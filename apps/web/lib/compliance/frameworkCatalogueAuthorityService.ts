import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loadFrameworkCatalogueGovernedState } from "@/lib/compliance/frameworkCatalogueGovernedStateLoader";
import { validateFrameworkCataloguePublicationIntegrity, type FrameworkCataloguePublicationIntegrityFailureReason } from "@/lib/compliance/frameworkCataloguePublicationIntegrity";

type DatabaseClient = Prisma.TransactionClient | typeof prisma;

export type FrameworkCatalogueAuthorityFailureReason =
  | FrameworkCataloguePublicationIntegrityFailureReason
  | "FRAMEWORK_NOT_FOUND"
  | "FRAMEWORK_CATALOGUE_APPROVAL_NOT_FOUND"
  | "INVALID_RULE_AST_JSON"
  | "CURRENT_AUTHORITY_ALREADY_EXISTS"
  | "CURRENT_AUTHORITY_NOT_FOUND"
  | "SAME_APPROVAL_ALREADY_AUTHORITATIVE"
  | "CURRENT_AUTHORITY_CHANGED"
  | "CONCURRENT_AUTHORITY_CONFLICT"
  | "AUTHORITY_TRANSACTION_FAILED";

export type FrameworkCatalogueAuthorityRecord = {
  id: string;
  frameworkId: string;
  frameworkCatalogueApprovalId: string;
  establishedAt: Date;
  establishedById: string;
  reason: string;
};

export type FrameworkCatalogueAuthorityResult =
  | {
      success: true;
      authority: FrameworkCatalogueAuthorityRecord;
    }
  | {
      success: false;
      reason: FrameworkCatalogueAuthorityFailureReason;
      message: string;
    };

const frameworkCatalogueAuthoritySelect = {
  id: true,
  frameworkId: true,
  frameworkCatalogueApprovalId: true,
  establishedAt: true,
  establishedById: true,
  reason: true,
} satisfies Prisma.CurrentFrameworkCatalogueAuthoritySelect;

const frameworkCatalogueApprovalEvidenceSelect = {
  id: true,
  frameworkId: true,
  contentManifest: true,
  contentHash: true,
  manifestAlgorithmVersion: true,
} satisfies Prisma.FrameworkCatalogueApprovalSelect;

async function readCurrentFrameworkCatalogueAuthority(
  db: DatabaseClient,
  frameworkId: string
): Promise<FrameworkCatalogueAuthorityRecord | null> {
  return db.currentFrameworkCatalogueAuthority.findUnique({
    where: { frameworkId },
    select: frameworkCatalogueAuthoritySelect,
  });
}

async function readFrameworkCatalogueApproval(
  db: DatabaseClient,
  frameworkCatalogueApprovalId: string
) {
  return db.frameworkCatalogueApproval.findUnique({
    where: { id: frameworkCatalogueApprovalId },
    select: frameworkCatalogueApprovalEvidenceSelect,
  });
}

async function validateFrameworkCatalogueAuthorityCandidate(
  db: DatabaseClient,
  frameworkId: string,
  frameworkCatalogueApprovalId: string
): Promise<FrameworkCatalogueAuthorityResult | { success: true }> {
  const approval = await readFrameworkCatalogueApproval(
    db,
    frameworkCatalogueApprovalId
  );

  if (!approval) {
    return {
      success: false,
      reason: "FRAMEWORK_CATALOGUE_APPROVAL_NOT_FOUND",
      message: "Framework catalogue approval not found.",
    };
  }

  if (approval.frameworkId !== frameworkId) {
    return {
      success: false,
      reason: "APPROVAL_FRAMEWORK_MISMATCH",
      message: "Framework catalogue approval does not belong to the supplied framework.",
    };
  }

  const governedState = await loadFrameworkCatalogueGovernedState(
    db,
    frameworkId
  );

  if (!governedState.success) {
    return governedState;
  }

  return validateFrameworkCataloguePublicationIntegrity({
    governedState: governedState.governedState,
    approval,
  });
}

export type EstablishFrameworkCatalogueAuthorityInput = {
  frameworkId: string;
  frameworkCatalogueApprovalId: string;
  actorUserId: string;
  reason: string;
};

export async function establishFrameworkCatalogueAuthorityInTransaction(
  transaction: Prisma.TransactionClient,
  input: EstablishFrameworkCatalogueAuthorityInput
): Promise<FrameworkCatalogueAuthorityResult> {
  const validation = await validateFrameworkCatalogueAuthorityCandidate(
    transaction,
    input.frameworkId,
    input.frameworkCatalogueApprovalId
  );

  if (!validation.success) {
    return validation;
  }

  const current = await readCurrentFrameworkCatalogueAuthority(
    transaction,
    input.frameworkId
  );

  if (current) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_ALREADY_EXISTS",
      message: "Current framework catalogue authority already exists.",
    };
  }

  const authority =
    await transaction.currentFrameworkCatalogueAuthority.create({
      data: {
        frameworkId: input.frameworkId,
        frameworkCatalogueApprovalId:
          input.frameworkCatalogueApprovalId,
        establishedById: input.actorUserId,
        reason: input.reason,
      },
      select: frameworkCatalogueAuthoritySelect,
    });

  await transaction.frameworkCatalogueAuthorityTransition.create({
    data: {
      frameworkId: input.frameworkId,
      previousFrameworkCatalogueApprovalId: null,
      newFrameworkCatalogueApprovalId:
        input.frameworkCatalogueApprovalId,
      transitionType: "ESTABLISH",
      transitionedById: input.actorUserId,
      reason: input.reason,
    },
  });

  const confirmed = await readCurrentFrameworkCatalogueAuthority(
    transaction,
    input.frameworkId
  );

  if (
    !confirmed ||
    confirmed.id !== authority.id ||
    confirmed.frameworkCatalogueApprovalId !==
      input.frameworkCatalogueApprovalId
  ) {
    throw new Error(
      "FRAMEWORK_CATALOGUE_AUTHORITY_PERSISTENCE_VERIFICATION_FAILED"
    );
  }

  return {
    success: true,
    authority: confirmed,
  };
}

export async function establishFrameworkCatalogueAuthority(
  input: EstablishFrameworkCatalogueAuthorityInput
): Promise<FrameworkCatalogueAuthorityResult> {
  try {
    return await prisma.$transaction<FrameworkCatalogueAuthorityResult>(
      async (transaction: Prisma.TransactionClient) =>
        establishFrameworkCatalogueAuthorityInTransaction(
          transaction,
          input
        ),
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      return {
        success: false,
        reason: "CONCURRENT_AUTHORITY_CONFLICT",
        message:
          "Framework catalogue authority establishment conflicted with another concurrent transaction.",
      };
    }

    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Framework catalogue authority establishment transaction failed.",
    };
  }
}

export type ReplaceFrameworkCatalogueAuthorityInput = {
  frameworkId: string;
  frameworkCatalogueApprovalId: string;
  actorUserId: string;
  reason: string;
};

export async function replaceFrameworkCatalogueAuthorityInTransaction(
  transaction: Prisma.TransactionClient,
  input: ReplaceFrameworkCatalogueAuthorityInput
): Promise<FrameworkCatalogueAuthorityResult> {
  const validation = await validateFrameworkCatalogueAuthorityCandidate(
    transaction,
    input.frameworkId,
    input.frameworkCatalogueApprovalId
  );

  if (!validation.success) {
    return validation;
  }

  const current = await readCurrentFrameworkCatalogueAuthority(
    transaction,
    input.frameworkId
  );

  if (!current) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_NOT_FOUND",
      message: "No current framework catalogue authority exists to replace.",
    };
  }

  if (
    current.frameworkCatalogueApprovalId ===
    input.frameworkCatalogueApprovalId
  ) {
    return {
      success: false,
      reason: "SAME_APPROVAL_ALREADY_AUTHORITATIVE",
      message: "Framework catalogue approval is already current.",
    };
  }

  const update =
    await transaction.currentFrameworkCatalogueAuthority.updateMany({
      where: {
        frameworkId: input.frameworkId,
        frameworkCatalogueApprovalId:
          current.frameworkCatalogueApprovalId,
      },
      data: {
        frameworkCatalogueApprovalId:
          input.frameworkCatalogueApprovalId,
        establishedAt: new Date(),
        establishedById: input.actorUserId,
        reason: input.reason,
      },
    });

  if (update.count !== 1) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_CHANGED",
      message:
        "Current framework catalogue authority changed before replacement could be committed.",
    };
  }

  await transaction.frameworkCatalogueAuthorityTransition.create({
    data: {
      frameworkId: input.frameworkId,
      previousFrameworkCatalogueApprovalId:
        current.frameworkCatalogueApprovalId,
      newFrameworkCatalogueApprovalId:
        input.frameworkCatalogueApprovalId,
      transitionType: "REPLACE",
      transitionedById: input.actorUserId,
      reason: input.reason,
    },
  });

  const confirmed = await readCurrentFrameworkCatalogueAuthority(
    transaction,
    input.frameworkId
  );

  if (
    !confirmed ||
    confirmed.frameworkCatalogueApprovalId !==
      input.frameworkCatalogueApprovalId
  ) {
    throw new Error(
      "FRAMEWORK_CATALOGUE_AUTHORITY_PERSISTENCE_VERIFICATION_FAILED"
    );
  }

  return {
    success: true,
    authority: confirmed,
  };
}


export async function replaceFrameworkCatalogueAuthority(
  input: ReplaceFrameworkCatalogueAuthorityInput
): Promise<FrameworkCatalogueAuthorityResult> {
  try {
    return await prisma.$transaction<FrameworkCatalogueAuthorityResult>(
      async (transaction: Prisma.TransactionClient) =>
        replaceFrameworkCatalogueAuthorityInTransaction(
          transaction,
          input
        ),
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      return {
        success: false,
        reason: "CONCURRENT_AUTHORITY_CONFLICT",
        message:
          "Framework catalogue authority replacement conflicted with another concurrent transaction.",
      };
    }

    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Framework catalogue authority replacement transaction failed.",
    };
  }
}

export type WithdrawFrameworkCatalogueAuthorityInput = {
  frameworkId: string;
  actorUserId: string;
  reason: string;
};


export async function withdrawFrameworkCatalogueAuthorityInTransaction(
  transaction: Prisma.TransactionClient,
  input: WithdrawFrameworkCatalogueAuthorityInput
): Promise<FrameworkCatalogueAuthorityResult> {
  const current = await readCurrentFrameworkCatalogueAuthority(
    transaction,
    input.frameworkId
  );

  if (!current) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_NOT_FOUND",
      message:
        "No current framework catalogue authority exists.",
    };
  }

  const removed =
    await transaction.currentFrameworkCatalogueAuthority.deleteMany({
      where: {
        frameworkId: input.frameworkId,
        frameworkCatalogueApprovalId:
          current.frameworkCatalogueApprovalId,
      },
    });

  if (removed.count !== 1) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_CHANGED",
      message:
        "Current framework catalogue authority changed before withdrawal could be committed.",
    };
  }

  await transaction.frameworkCatalogueAuthorityTransition.create({
    data: {
      frameworkId: input.frameworkId,
      previousFrameworkCatalogueApprovalId:
        current.frameworkCatalogueApprovalId,
      newFrameworkCatalogueApprovalId: null,
      transitionType: "WITHDRAW",
      transitionedById: input.actorUserId,
      reason: input.reason,
    },
  });

  const confirmed =
    await readCurrentFrameworkCatalogueAuthority(
      transaction,
      input.frameworkId
    );

  if (confirmed) {
    throw new Error(
      "FRAMEWORK_CATALOGUE_AUTHORITY_WITHDRAWAL_PERSISTENCE_VERIFICATION_FAILED"
    );
  }

  return {
    success: true,
    authority: current,
  };
}



export async function withdrawFrameworkCatalogueAuthority(
  input: WithdrawFrameworkCatalogueAuthorityInput
): Promise<FrameworkCatalogueAuthorityResult> {
  try {
    return await prisma.$transaction<FrameworkCatalogueAuthorityResult>(
      async (transaction: Prisma.TransactionClient) =>
        withdrawFrameworkCatalogueAuthorityInTransaction(transaction, input),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      return {
        success: false,
        reason: "CONCURRENT_AUTHORITY_CONFLICT",
        message:
          "Framework catalogue authority withdrawal conflicted with another concurrent transaction.",
      };
    }

    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Framework catalogue authority withdrawal transaction failed.",
    };
  }
}

