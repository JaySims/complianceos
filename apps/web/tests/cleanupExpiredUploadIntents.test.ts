
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { prismaMock, storageMock } = vi.hoisted(() => ({
  prismaMock: {
    documentUploadIntent: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    document: {
      findFirst: vi.fn(),
    },
  },
  storageMock: {
    inspectDocumentBlob: vi.fn(),
    deleteDocumentBlob: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/documents/documentStorage", () => ({
  inspectDocumentBlob: storageMock.inspectDocumentBlob,
  deleteDocumentBlob: storageMock.deleteDocumentBlob,
}));

import {
  cleanupExpiredUploadIntents,
} from "@/lib/documents/cleanupExpiredUploadIntents";

describe("cleanupExpiredUploadIntents", () => {
  const fixedNow = new Date("2026-11-20T00:00:00.000Z");
  const leaseExpiresAt = new Date(
    fixedNow.getTime() + 5 * 60 * 1000,
  );

  const candidate = {
    id: "intent-1",
    status: "PENDING" as const,
    filePath: "organizations/org-1/documents/file-1.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
    documentId: null,
    expiresAt: new Date("2026-11-19T23:00:00.000Z"),
    cleanupAfter: null,
    cleanupLeaseExpiresAt: null,
    cleanupAttemptCount: 0,
  };

  const blob = {
    pathname: candidate.filePath,
    size: candidate.fileSize,
    contentType: candidate.mimeType,
    etag: "etag-123",
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    vi.clearAllMocks();

    prismaMock.documentUploadIntent.findMany.mockResolvedValue([]);
    prismaMock.documentUploadIntent.updateMany.mockResolvedValue({
      count: 1,
    });
    prismaMock.document.findFirst.mockResolvedValue(null);

    storageMock.inspectDocumentBlob.mockResolvedValue(blob);
    storageMock.deleteDocumentBlob.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("claims an expired pending intent and deletes its verified blob", async () => {
    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      candidate,
    ]);

    const result = await cleanupExpiredUploadIntents();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenNthCalledWith(1, {
      where: {
        id: candidate.id,
        status: "PENDING",
        expiresAt: {
          lte: fixedNow,
        },
      },
      data: {
        status: "CLEANING",
        cleanupLeaseExpiresAt: leaseExpiresAt,
        cleanupAttemptCount: {
          increment: 1,
        },
      },
    });

    expect(prismaMock.document.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            filePath: candidate.filePath,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    expect(
      storageMock.inspectDocumentBlob,
    ).toHaveBeenCalledWith(candidate.filePath);

    expect(
      storageMock.deleteDocumentBlob,
    ).toHaveBeenCalledWith(candidate.filePath, "etag-123");

    expect(result).toEqual({
      examined: 1,
      claimed: 1,
      deleted: 1,
      protected: 0,
      retried: 0,
      skipped: 0,
    });
  });

  it("renews the cleanup lease before deleting the blob", async () => {
    const renewalTime = new Date(
      fixedNow.getTime() + 1000,
    );

    const renewedLeaseExpiresAt = new Date(
      renewalTime.getTime() + 5 * 60 * 1000,
    );

    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      candidate,
    ]);

    storageMock.inspectDocumentBlob.mockImplementation(async () => {
      vi.setSystemTime(renewalTime);
      return blob;
    });

    const result = await cleanupExpiredUploadIntents();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenNthCalledWith(2, {
      where: {
        id: candidate.id,
        status: "CLEANING",
        cleanupLeaseExpiresAt: {
          equals: leaseExpiresAt,
          gt: renewalTime,
        },
      },
      data: {
        cleanupLeaseExpiresAt: renewedLeaseExpiresAt,
      },
    });

    expect(
      storageMock.deleteDocumentBlob,
    ).toHaveBeenCalledWith(candidate.filePath, blob.etag);

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenLastCalledWith({
      where: {
        id: candidate.id,
        status: "CLEANING",
        cleanupLeaseExpiresAt: {
          equals: renewedLeaseExpiresAt,
          gt: renewalTime,
        },
      },
      data: {
        status: "DELETED",
        cleanupLeaseExpiresAt: null,
        cleanupAfter: null,
        deletedAt: renewalTime,
      },
    });

    expect(result.deleted).toBe(1);
  });

  it("does not delete the blob when lease renewal fails", async () => {
    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      candidate,
    ]);

    prismaMock.documentUploadIntent.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const result = await cleanupExpiredUploadIntents();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenNthCalledWith(2, {
      where: {
        id: candidate.id,
        status: "CLEANING",
        cleanupLeaseExpiresAt: {
          equals: leaseExpiresAt,
          gt: fixedNow,
        },
      },
      data: {
        cleanupLeaseExpiresAt: leaseExpiresAt,
      },
    });

    expect(
      storageMock.deleteDocumentBlob,
    ).not.toHaveBeenCalled();

    expect(result).toEqual({
      examined: 1,
      claimed: 1,
      deleted: 0,
      protected: 0,
      retried: 0,
      skipped: 1,
    });
  });

  it("does not delete a blob referenced by a document", async () => {
    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      {
        ...candidate,
        documentId: "document-1",
      },
    ]);

    prismaMock.document.findFirst.mockResolvedValue({
      id: "document-1",
    });

    const result = await cleanupExpiredUploadIntents();

    expect(prismaMock.document.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            filePath: candidate.filePath,
          },
          {
            id: "document-1",
          },
        ],
      },
      select: {
        id: true,
      },
    });

    expect(
      storageMock.inspectDocumentBlob,
    ).not.toHaveBeenCalled();

    expect(
      storageMock.deleteDocumentBlob,
    ).not.toHaveBeenCalled();

    expect(result.protected).toBe(1);
  });

  it("marks an already-missing blob as deleted without calling delete", async () => {
    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      candidate,
    ]);

    storageMock.inspectDocumentBlob.mockResolvedValue(null);

    const result = await cleanupExpiredUploadIntents();

    expect(
      storageMock.deleteDocumentBlob,
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenLastCalledWith({
      where: {
        id: candidate.id,
        status: "CLEANING",
        cleanupLeaseExpiresAt: {
          equals: leaseExpiresAt,
          gt: fixedNow,
        },
      },
      data: {
        status: "DELETED",
        cleanupLeaseExpiresAt: null,
        cleanupAfter: null,
        deletedAt: fixedNow,
      },
    });

    expect(result.deleted).toBe(1);
  });

  it("does not delete a blob whose metadata does not match the intent", async () => {
    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      candidate,
    ]);

    storageMock.inspectDocumentBlob.mockResolvedValue({
      ...blob,
      size: 2048,
    });

    const result = await cleanupExpiredUploadIntents();

    expect(
      storageMock.deleteDocumentBlob,
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenLastCalledWith({
      where: {
        id: candidate.id,
        status: "CLEANING",
        cleanupLeaseExpiresAt: {
          equals: leaseExpiresAt,
          gt: fixedNow,
        },
      },
      data: {
        status: "FAILED",
        cleanupLeaseExpiresAt: null,
        cleanupAfter: null,
      },
    });

    expect(result.protected).toBe(1);
  });

  it("uses the exact lease and status when reclaiming an expired cleanup", async () => {
    const expiredCleanupLease = new Date(
      "2026-11-19T23:50:00.000Z",
    );

    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      {
        ...candidate,
        status: "CLEANING",
        cleanupLeaseExpiresAt: expiredCleanupLease,
      },
    ]);

    await cleanupExpiredUploadIntents();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenNthCalledWith(1, {
      where: {
        id: candidate.id,
        status: "CLEANING",
        cleanupLeaseExpiresAt: {
          equals: expiredCleanupLease,
          lte: fixedNow,
        },
      },
      data: {
        status: "CLEANING",
        cleanupLeaseExpiresAt: leaseExpiresAt,
        cleanupAttemptCount: {
          increment: 1,
        },
      },
    });
  });

  it("skips an intent when another worker has already claimed it", async () => {
    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      candidate,
    ]);

    prismaMock.documentUploadIntent.updateMany.mockResolvedValue({
      count: 0,
    });

    const result = await cleanupExpiredUploadIntents();

    expect(
      storageMock.inspectDocumentBlob,
    ).not.toHaveBeenCalled();

    expect(
      storageMock.deleteDocumentBlob,
    ).not.toHaveBeenCalled();

    expect(result).toEqual({
      examined: 1,
      claimed: 0,
      deleted: 0,
      protected: 0,
      retried: 0,
      skipped: 1,
    });
  });

  it("schedules a retry with backoff when blob deletion fails", async () => {
    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      candidate,
    ]);

    storageMock.deleteDocumentBlob.mockRejectedValue(
      new Error("Storage temporarily unavailable."),
    );

    const result = await cleanupExpiredUploadIntents();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenLastCalledWith({
      where: {
        id: candidate.id,
        status: "CLEANING",
        cleanupLeaseExpiresAt: {
          equals: leaseExpiresAt,
          gt: fixedNow,
        },
      },
      data: {
        status: "FAILED",
        cleanupLeaseExpiresAt: null,
        cleanupAfter: new Date(
          fixedNow.getTime() + 15 * 60 * 1000,
        ),
      },
    });

    expect(result.retried).toBe(1);
  });

  it("respects the requested batch size", async () => {
    await cleanupExpiredUploadIntents(25);

    expect(
      prismaMock.documentUploadIntent.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 25,
      }),
    );
  });

  it("rejects invalid batch sizes before querying the database", async () => {
    await expect(
      cleanupExpiredUploadIntents(0),
    ).rejects.toThrow(
      "Invalid upload-intent cleanup batch size.",
    );

    await expect(
      cleanupExpiredUploadIntents(1001),
    ).rejects.toThrow(
      "Invalid upload-intent cleanup batch size.",
    );

    await expect(
      cleanupExpiredUploadIntents(1.5),
    ).rejects.toThrow(
      "Invalid upload-intent cleanup batch size.",
    );

    expect(
      prismaMock.documentUploadIntent.findMany,
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).not.toHaveBeenCalled();
  });

  it("does not update anything when no cleanup candidates exist", async () => {
    const result = await cleanupExpiredUploadIntents();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).not.toHaveBeenCalled();

    expect(
      storageMock.inspectDocumentBlob,
    ).not.toHaveBeenCalled();

    expect(result).toEqual({
      examined: 0,
      claimed: 0,
      deleted: 0,
      protected: 0,
      retried: 0,
      skipped: 0,
    });
  });
});
