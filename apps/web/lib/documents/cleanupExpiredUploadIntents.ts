
import { prisma } from "@/lib/prisma";

import {
  deleteDocumentBlob,
  inspectDocumentBlob,
} from "@/lib/documents/documentStorage";

const DEFAULT_BATCH_SIZE = 100;
const CLEANUP_LEASE_MS = 5 * 60 * 1000;
const INITIAL_RETRY_DELAY_MS = 15 * 60 * 1000;
const MAX_RETRY_DELAY_MS = 24 * 60 * 60 * 1000;

type CleanupCandidate = {
  id: string;
  status: "PENDING" | "FAILED" | "CLEANING";
  filePath: string;
  fileSize: number;
  mimeType: string;
  documentId: string | null;
  expiresAt: Date;
  cleanupAfter: Date | null;
  cleanupLeaseExpiresAt: Date | null;
  cleanupAttemptCount: number;
};

type CleanupResult = {
  examined: number;
  claimed: number;
  deleted: number;
  protected: number;
  retried: number;
  skipped: number;
};

function getRetryDelay(attemptCount: number): number {
  const exponent = Math.min(Math.max(attemptCount - 1, 0), 10);

  return Math.min(
    INITIAL_RETRY_DELAY_MS * 2 ** exponent,
    MAX_RETRY_DELAY_MS,
  );
}

async function renewCleanupLease(
  intentId: string,
  currentLeaseExpiresAt: Date,
): Promise<Date | null> {
  const now = new Date();

  if (currentLeaseExpiresAt <= now) {
    return null;
  }

  const renewedLeaseExpiresAt = new Date(
    now.getTime() + CLEANUP_LEASE_MS,
  );

  const result = await prisma.documentUploadIntent.updateMany({
    where: {
      id: intentId,
      status: "CLEANING",
      cleanupLeaseExpiresAt: {
        equals: currentLeaseExpiresAt,
        gt: now,
      },
    },
    data: {
      cleanupLeaseExpiresAt: renewedLeaseExpiresAt,
    },
  });

  return result.count === 1
    ? renewedLeaseExpiresAt
    : null;
}

async function releaseForRetry(
  intent: CleanupCandidate,
  leaseExpiresAt: Date,
  now: Date,
): Promise<boolean> {
  const retryAt = new Date(
    now.getTime() + getRetryDelay(intent.cleanupAttemptCount + 1),
  );

  const result = await prisma.documentUploadIntent.updateMany({
    where: {
      id: intent.id,
      status: "CLEANING",
      cleanupLeaseExpiresAt: {
        equals: leaseExpiresAt,
        gt: now,
      },
    },
    data: {
      status: "FAILED",
      cleanupLeaseExpiresAt: null,
      cleanupAfter: retryAt,
    },
  });

  return result.count === 1;
}

async function protectReferencedDocument(
  intent: CleanupCandidate,
  leaseExpiresAt: Date,
): Promise<boolean> {
  const documentConditions = [
    { filePath: intent.filePath },
    ...(intent.documentId
      ? [{ id: intent.documentId }]
      : []),
  ];

  const document = await prisma.document.findFirst({
    where: {
      OR: documentConditions,
    },
    select: {
      id: true,
    },
  });

  if (!document) {
    return false;
  }

  const now = new Date();

  await prisma.documentUploadIntent.updateMany({
    where: {
      id: intent.id,
      status: "CLEANING",
      cleanupLeaseExpiresAt: {
        equals: leaseExpiresAt,
        gt: now,
      },
    },
    data: {
      status: "FAILED",
      cleanupLeaseExpiresAt: null,
      cleanupAfter: null,
    },
  });

  return true;
}

export async function cleanupExpiredUploadIntents(
  batchSize = DEFAULT_BATCH_SIZE,
): Promise<CleanupResult> {
  if (
    !Number.isSafeInteger(batchSize) ||
    batchSize < 1 ||
    batchSize > 1000
  ) {
    throw new Error("Invalid upload-intent cleanup batch size.");
  }

  // This timestamp selects the initial batch only.
  const now = new Date();

  const candidates =
    await prisma.documentUploadIntent.findMany({
      where: {
        OR: [
          {
            status: "PENDING",
            expiresAt: {
              lte: now,
            },
          },
          {
            status: "FAILED",
            cleanupAfter: {
              lte: now,
            },
          },
          {
            status: "CLEANING",
            cleanupLeaseExpiresAt: {
              lte: now,
            },
          },
        ],
      },
      select: {
        id: true,
        status: true,
        filePath: true,
        fileSize: true,
        mimeType: true,
        documentId: true,
        expiresAt: true,
        cleanupAfter: true,
        cleanupLeaseExpiresAt: true,
        cleanupAttemptCount: true,
      },
      orderBy: {
        updatedAt: "asc",
      },
      take: batchSize,
    });

  const result: CleanupResult = {
    examined: candidates.length,
    claimed: 0,
    deleted: 0,
    protected: 0,
    retried: 0,
    skipped: 0,
  };

  for (const candidate of candidates as CleanupCandidate[]) {
    // Use a fresh timestamp for each candidate. Earlier candidates
    // may take long enough that the original batch timestamp is stale.
    const claimNow = new Date();

    const leaseExpiresAt = new Date(
      claimNow.getTime() + CLEANUP_LEASE_MS,
    );

    let claimCondition:
      | {
          id: string;
          status: "PENDING";
          expiresAt: { lte: Date };
        }
      | {
          id: string;
          status: "FAILED";
          cleanupAfter: { lte: Date };
        }
      | {
          id: string;
          status: "CLEANING";
          cleanupLeaseExpiresAt: {
            equals: Date;
            lte: Date;
          };
        };

    if (candidate.status === "PENDING") {
      claimCondition = {
        id: candidate.id,
        status: "PENDING",
        expiresAt: {
          lte: claimNow,
        },
      };
    } else if (candidate.status === "FAILED") {
      claimCondition = {
        id: candidate.id,
        status: "FAILED",
        cleanupAfter: {
          lte: claimNow,
        },
      };
    } else {
      if (!candidate.cleanupLeaseExpiresAt) {
        result.skipped += 1;
        continue;
      }

      claimCondition = {
        id: candidate.id,
        status: "CLEANING",
        cleanupLeaseExpiresAt: {
          equals: candidate.cleanupLeaseExpiresAt,
          lte: claimNow,
        },
      };
    }

    const claim = await prisma.documentUploadIntent.updateMany({
      where: claimCondition,
      data: {
        status: "CLEANING",
        cleanupLeaseExpiresAt: leaseExpiresAt,
        cleanupAttemptCount: {
          increment: 1,
        },
      },
    });

    if (claim.count !== 1) {
      result.skipped += 1;
      continue;
    }

    result.claimed += 1;

    if (
      await protectReferencedDocument(
        candidate,
        leaseExpiresAt,
      )
    ) {
      result.protected += 1;
      continue;
    }

    let activeLeaseExpiresAt = leaseExpiresAt;

    try {
      const blob = await inspectDocumentBlob(candidate.filePath);

      if (!blob) {
        const deletionTime = new Date();

        const markedDeleted =
          await prisma.documentUploadIntent.updateMany({
            where: {
              id: candidate.id,
              status: "CLEANING",
              cleanupLeaseExpiresAt: {
                equals: activeLeaseExpiresAt,
                gt: deletionTime,
              },
            },
            data: {
              status: "DELETED",
              cleanupLeaseExpiresAt: null,
              cleanupAfter: null,
              deletedAt: deletionTime,
            },
          });

        if (markedDeleted.count === 1) {
          result.deleted += 1;
        } else {
          result.skipped += 1;
        }

        continue;
      }

      if (
        blob.pathname !== candidate.filePath ||
        blob.size !== candidate.fileSize ||
        blob.contentType !== candidate.mimeType
      ) {
        const mismatchTime = new Date();

        const protectedIntent =
          await prisma.documentUploadIntent.updateMany({
            where: {
              id: candidate.id,
              status: "CLEANING",
              cleanupLeaseExpiresAt: {
                equals: activeLeaseExpiresAt,
                gt: mismatchTime,
              },
            },
            data: {
              status: "FAILED",
              cleanupLeaseExpiresAt: null,
              cleanupAfter: null,
            },
          });

        if (protectedIntent.count === 1) {
          result.protected += 1;
        } else {
          result.skipped += 1;
        }

        continue;
      }

      const renewedLeaseExpiresAt = await renewCleanupLease(
        candidate.id,
        activeLeaseExpiresAt,
      );

      if (!renewedLeaseExpiresAt) {
        result.skipped += 1;
        continue;
      }

      activeLeaseExpiresAt = renewedLeaseExpiresAt;

      await deleteDocumentBlob(blob.pathname, blob.etag);

      const deletionTime = new Date();

      const markedDeleted =
        await prisma.documentUploadIntent.updateMany({
          where: {
            id: candidate.id,
            status: "CLEANING",
            cleanupLeaseExpiresAt: {
              equals: activeLeaseExpiresAt,
              gt: deletionTime,
            },
          },
          data: {
            status: "DELETED",
            cleanupLeaseExpiresAt: null,
            cleanupAfter: null,
            deletedAt: deletionTime,
          },
        });

      if (markedDeleted.count === 1) {
        result.deleted += 1;
      } else {
        result.skipped += 1;
      }
    } catch {
      const scheduledRetry = await releaseForRetry(
        candidate,
        activeLeaseExpiresAt,
        new Date(),
      );

      if (scheduledRetry) {
        result.retried += 1;
      } else {
        result.skipped += 1;
      }
    }
  }

  return result;
}
