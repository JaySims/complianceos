
import { prisma } from "@/lib/prisma";

const DEFAULT_BATCH_SIZE = 100;
const CLEANUP_DELAY_MS = 24 * 60 * 60 * 1000;

type RecoveryResult = {
  examined: number;
  recovered: number;
};

export async function recoverExpiredUploadIntents(
  batchSize = DEFAULT_BATCH_SIZE,
): Promise<RecoveryResult> {
  if (
    !Number.isSafeInteger(batchSize) ||
    batchSize < 1 ||
    batchSize > 1000
  ) {
    throw new Error("Invalid upload-intent recovery batch size.");
  }

  const now = new Date();

  const expiredIntents =
    await prisma.documentUploadIntent.findMany({
      where: {
        status: "FINALIZING",
        finalizationLeaseExpiresAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        finalizationLeaseExpiresAt: true,
      },
      orderBy: {
        finalizationLeaseExpiresAt: "asc",
      },
      take: batchSize,
    });

  let recovered = 0;

  for (const intent of expiredIntents) {
    if (!intent.finalizationLeaseExpiresAt) {
      continue;
    }

    const result =
      await prisma.documentUploadIntent.updateMany({
        where: {
          id: intent.id,
          status: "FINALIZING",
          finalizationLeaseExpiresAt: {
            equals: intent.finalizationLeaseExpiresAt,
            lte: now,
          },
        },
        data: {
          status: "FAILED",
          finalizationLeaseExpiresAt: null,
          cleanupAfter: new Date(
            now.getTime() + CLEANUP_DELAY_MS,
          ),
        },
      });

    recovered += result.count;
  }

  return {
    examined: expiredIntents.length,
    recovered,
  };
}
