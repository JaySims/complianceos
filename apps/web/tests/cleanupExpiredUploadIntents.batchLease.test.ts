
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

describe("cleanupExpiredUploadIntents batch leases", () => {
  const fixedNow = new Date("2026-11-20T00:00:00.000Z");
  const delay = 6 * 60 * 1000;

  const firstCandidate = {
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

  const secondCandidate = {
    ...firstCandidate,
    id: "intent-2",
    filePath: "organizations/org-1/documents/file-2.pdf",
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
    vi.clearAllMocks();

    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      firstCandidate,
      secondCandidate,
    ]);

    prismaMock.documentUploadIntent.updateMany.mockResolvedValue({
      count: 1,
    });

    prismaMock.document.findFirst.mockResolvedValue(null);

    storageMock.inspectDocumentBlob.mockImplementation(
      async (pathname: string) => ({
        pathname,
        size: 1024,
        contentType: "application/pdf",
        etag: `etag-${pathname}`,
      }),
    );

    storageMock.deleteDocumentBlob.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a fresh lease for each candidate after earlier processing takes time", async () => {
    const secondClaimTime = new Date(
      fixedNow.getTime() + delay,
    );

    // Simulate the first deletion taking six minutes.
    // The second candidate must not inherit the original batch timestamp.
    storageMock.deleteDocumentBlob.mockImplementationOnce(
      async () => {
        vi.setSystemTime(secondClaimTime);
      },
    );

    await cleanupExpiredUploadIntents();

    const secondLeaseExpiresAt = new Date(
      secondClaimTime.getTime() + 5 * 60 * 1000,
    );

    // First candidate uses the original claim time.
    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenNthCalledWith(1, {
      where: {
        id: firstCandidate.id,
        status: "PENDING",
        expiresAt: {
          lte: fixedNow,
        },
      },
      data: {
        status: "CLEANING",
        cleanupLeaseExpiresAt: new Date(
          fixedNow.getTime() + 5 * 60 * 1000,
        ),
        cleanupAttemptCount: {
          increment: 1,
        },
      },
    });

    // The first candidate performs three updates:
    // claim, lease renewal and deletion finalisation.
    // The second candidate's claim is therefore the fourth update.
    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenNthCalledWith(4, {
      where: {
        id: secondCandidate.id,
        status: "PENDING",
        expiresAt: {
          lte: secondClaimTime,
        },
      },
      data: {
        status: "CLEANING",
        cleanupLeaseExpiresAt: secondLeaseExpiresAt,
        cleanupAttemptCount: {
          increment: 1,
        },
      },
    });

    expect(
      storageMock.deleteDocumentBlob,
    ).toHaveBeenCalledTimes(2);
  });
});
