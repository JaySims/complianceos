
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    documentUploadIntent: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  recoverExpiredUploadIntents,
} from "@/lib/documents/recoverExpiredUploadIntents";

describe("recoverExpiredUploadIntents", () => {
  const fixedNow = new Date("2026-11-19T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    vi.clearAllMocks();

    prismaMock.documentUploadIntent.findMany.mockResolvedValue([]);
    prismaMock.documentUploadIntent.updateMany.mockResolvedValue({
      count: 1,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("recovers expired finalization leases", async () => {
    const leaseExpiresAt = new Date(
      "2026-11-19T11:55:00.000Z",
    );

    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      {
        id: "intent-1",
        finalizationLeaseExpiresAt: leaseExpiresAt,
      },
    ]);

    const result = await recoverExpiredUploadIntents();

    expect(
      prismaMock.documentUploadIntent.findMany,
    ).toHaveBeenCalledWith({
      where: {
        status: "FINALIZING",
        finalizationLeaseExpiresAt: {
          lte: fixedNow,
        },
      },
      select: {
        id: true,
        finalizationLeaseExpiresAt: true,
      },
      orderBy: {
        finalizationLeaseExpiresAt: "asc",
      },
      take: 100,
    });

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        id: "intent-1",
        status: "FINALIZING",
        finalizationLeaseExpiresAt: {
          equals: leaseExpiresAt,
          lte: fixedNow,
        },
      },
      data: {
        status: "FAILED",
        finalizationLeaseExpiresAt: null,
        cleanupAfter: new Date(
          fixedNow.getTime() + 24 * 60 * 60 * 1000,
        ),
      },
    });

    expect(result).toEqual({
      examined: 1,
      recovered: 1,
    });
  });

  it("uses conditional updates so concurrent finalization cannot be overwritten", async () => {
    const leaseExpiresAt = new Date(
      "2026-11-19T11:55:00.000Z",
    );

    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      {
        id: "intent-2",
        finalizationLeaseExpiresAt: leaseExpiresAt,
      },
    ]);

    // Another process has already changed the record.
    // The conditional update therefore affects zero records.
    prismaMock.documentUploadIntent.updateMany.mockResolvedValue({
      count: 0,
    });

    const result = await recoverExpiredUploadIntents();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      examined: 1,
      recovered: 0,
    });
  });

  it("processes multiple expired intents and counts successful recoveries", async () => {
    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      {
        id: "intent-1",
        finalizationLeaseExpiresAt: new Date(
          "2026-11-19T11:50:00.000Z",
        ),
      },
      {
        id: "intent-2",
        finalizationLeaseExpiresAt: new Date(
          "2026-11-19T11:55:00.000Z",
        ),
      },
      {
        id: "intent-3",
        finalizationLeaseExpiresAt: new Date(
          "2026-11-19T11:58:00.000Z",
        ),
      },
    ]);

    prismaMock.documentUploadIntent.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });

    const result = await recoverExpiredUploadIntents(3);

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenCalledTimes(3);

    expect(result).toEqual({
      examined: 3,
      recovered: 2,
    });
  });

  it("respects the requested batch size", async () => {
    await recoverExpiredUploadIntents(25);

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
      recoverExpiredUploadIntents(0),
    ).rejects.toThrow(
      "Invalid upload-intent recovery batch size.",
    );

    await expect(
      recoverExpiredUploadIntents(1001),
    ).rejects.toThrow(
      "Invalid upload-intent recovery batch size.",
    );

    await expect(
      recoverExpiredUploadIntents(1.5),
    ).rejects.toThrow(
      "Invalid upload-intent recovery batch size.",
    );

    expect(
      prismaMock.documentUploadIntent.findMany,
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).not.toHaveBeenCalled();
  });

  it("does not attempt recovery when there are no expired intents", async () => {
    const result = await recoverExpiredUploadIntents();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).not.toHaveBeenCalled();

    expect(result).toEqual({
      examined: 0,
      recovered: 0,
    });
  });

  it("does not recover an intent whose lease is missing", async () => {
    prismaMock.documentUploadIntent.findMany.mockResolvedValue([
      {
        id: "intent-4",
        finalizationLeaseExpiresAt: null,
      },
    ]);

    const result = await recoverExpiredUploadIntents();

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).not.toHaveBeenCalled();

    expect(result).toEqual({
      examined: 1,
      recovered: 0,
    });
  });
});
