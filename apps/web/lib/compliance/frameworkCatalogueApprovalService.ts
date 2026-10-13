import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { loadFrameworkCatalogueGovernedState } from "./frameworkCatalogueGovernedStateLoader";
import { buildFrameworkCatalogueManifestFingerprint } from "./frameworkCatalogueManifest";

export type CreateFrameworkCatalogueApprovalInput = {
  frameworkId: string;
  actorUserId: string;
  reason: string;
};

export type CreateFrameworkCatalogueApprovalFailureReason =
  | "FRAMEWORK_NOT_FOUND"
  | "INVALID_RULE_AST_JSON"
  | "INVALID_GOVERNED_CATALOGUE_STATE"
  | "CONCURRENT_APPROVAL_CONFLICT"
  | "APPROVAL_TRANSACTION_FAILED";

export type FrameworkCatalogueApprovalRecord = {
  id: string;
  frameworkId: string;
  version: number;
  contentManifest: string;
  contentHash: string;
  manifestAlgorithmVersion: number;
  approvedAt: Date;
  approvedById: string;
  reason: string;
};

export type CreateFrameworkCatalogueApprovalResult =
  | {
      success: true;
      approval: FrameworkCatalogueApprovalRecord;
    }
  | {
      success: false;
      reason: CreateFrameworkCatalogueApprovalFailureReason;
      message: string;
    };

const frameworkCatalogueApprovalSelect = {
  id: true,
  frameworkId: true,
  version: true,
  contentManifest: true,
  contentHash: true,
  manifestAlgorithmVersion: true,
  approvedAt: true,
  approvedById: true,
  reason: true,
} satisfies Prisma.FrameworkCatalogueApprovalSelect;

export async function createFrameworkCatalogueApprovalInTransaction(
  transaction: Prisma.TransactionClient,
  input: CreateFrameworkCatalogueApprovalInput
): Promise<CreateFrameworkCatalogueApprovalResult> {
  const loaded = await loadFrameworkCatalogueGovernedState(
    transaction,
    input.frameworkId
  );

  if (!loaded.success) {
    return loaded;
  }

  let fingerprint;

  try {
    fingerprint = buildFrameworkCatalogueManifestFingerprint(
      loaded.governedState
    );
  } catch {
    return {
      success: false,
      reason: "INVALID_GOVERNED_CATALOGUE_STATE",
      message:
        "Framework catalogue governed state is not eligible for approval.",
    };
  }

  const latestApproval =
    await transaction.frameworkCatalogueApproval.findFirst({
      where: {
        frameworkId: input.frameworkId,
      },
      orderBy: {
        version: "desc",
      },
      select: {
        version: true,
      },
    });

  const version =
    latestApproval === null ? 1 : latestApproval.version + 1;

  const approvedAt = new Date();

  const created =
    await transaction.frameworkCatalogueApproval.create({
      data: {
        frameworkId: input.frameworkId,
        version,
        contentManifest: fingerprint.contentManifest,
        contentHash: fingerprint.contentHash,
        manifestAlgorithmVersion:
          fingerprint.manifestAlgorithmVersion,
        approvedAt,
        approvedById: input.actorUserId,
        reason: input.reason,
      },
      select: frameworkCatalogueApprovalSelect,
    });

  const persisted =
    await transaction.frameworkCatalogueApproval.findUnique({
      where: {
        id: created.id,
      },
      select: frameworkCatalogueApprovalSelect,
    });

  if (
    !persisted ||
    persisted.frameworkId !== input.frameworkId ||
    persisted.version !== version ||
    persisted.contentManifest !== fingerprint.contentManifest ||
    persisted.contentHash !== fingerprint.contentHash ||
    persisted.manifestAlgorithmVersion !==
      fingerprint.manifestAlgorithmVersion ||
    persisted.approvedById !== input.actorUserId ||
    persisted.reason !== input.reason ||
    persisted.approvedAt.getTime() !== approvedAt.getTime()
  ) {
    throw new Error(
      "FRAMEWORK_CATALOGUE_APPROVAL_PERSISTENCE_VERIFICATION_FAILED"
    );
  }

  return {
    success: true,
    approval: persisted,
  };
}

export async function createFrameworkCatalogueApproval(
  input: CreateFrameworkCatalogueApprovalInput
): Promise<CreateFrameworkCatalogueApprovalResult> {
  try {
    return await prisma.$transaction<CreateFrameworkCatalogueApprovalResult>(
      (transaction: Prisma.TransactionClient) =>
        createFrameworkCatalogueApprovalInTransaction(transaction, input),
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );

  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" ||
        (error.code === "P2002" &&
          Array.isArray(error.meta?.target) &&
          error.meta.target.includes("frameworkId") &&
          error.meta.target.includes("version")))
    ) {
      return {
        success: false,
        reason: "CONCURRENT_APPROVAL_CONFLICT",
        message:
          "Framework catalogue approval conflicted with another concurrent transaction.",
      };
    }

    return {
      success: false,
      reason: "APPROVAL_TRANSACTION_FAILED",
      message:
        "Framework catalogue approval transaction failed.",
    };
  }
}
