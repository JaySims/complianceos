import {
  ApplicabilityDefinitionStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/*
 * ============================================================
 * COMPLIANCEOS — APPLICABILITY DEFINITION APPROVAL SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Approve an existing immutable ApplicabilityDefinition.
 *
 * APPROVED DOES NOT MEAN CURRENT
 *
 * Successful approval changes lifecycle/governance state only.
 * This service must never establish or supersede
 * CurrentApplicabilityDefinitionAuthority.
 *
 * V1 AUTHORIZATION
 *
 * The initiating actor must be an active member of the
 * supplied authorization Organization.
 *
 * No role-specific approval policy or four-eyes rule is
 * invented here because ApplicabilityDefinition currently
 * does not persist rule-author lineage.
 *
 * RETIREMENT
 *
 * Retirement semantics are intentionally outside this service.
 *
 * ============================================================
 */

export type ApproveApplicabilityDefinitionInput = {
  organizationId: string;
  applicabilityDefinitionId: string;
  actorUserId: string;
};

export type ApproveApplicabilityDefinitionFailureReason =
  | "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
  | "APPLICABILITY_DEFINITION_NOT_FOUND"
  | "REQUIREMENT_NOT_FOUND"
  | "REQUIREMENT_INACTIVE"
  | "DEFINITION_ALREADY_APPROVED"
  | "INVALID_DEFINITION_STATUS"
  | "DEFINITION_CHANGED_DURING_APPROVAL"
  | "CONCURRENT_APPROVAL_CONFLICT"
  | "APPROVAL_TRANSACTION_FAILED";

export type ApprovedApplicabilityDefinitionRecord = {
  id: string;
  requirementId: string;
  version: number;
  status: ApplicabilityDefinitionStatus;
  approvedAt: Date | null;
  approvedById: string | null;
};

export type ApproveApplicabilityDefinitionResult =
  | {
      success: true;
      definition: ApprovedApplicabilityDefinitionRecord;
    }
  | {
      success: false;
      reason: ApproveApplicabilityDefinitionFailureReason;
      message: string;
    };

type DatabaseClient =
  | Prisma.TransactionClient
  | typeof prisma;

export type ApplicabilityDefinitionApprovalPolicyResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason:
        | "DEFINITION_ALREADY_APPROVED"
        | "INVALID_DEFINITION_STATUS";
    };

/*
 * ============================================================
 * PURE APPROVAL POLICY
 * ============================================================
 *
 * V1 permits one lifecycle transition only:
 *
 * DRAFT -> APPROVED
 *
 * APPROVED is not treated as idempotent success because callers
 * must not silently mistake an already-completed governance
 * action for a newly performed approval.
 *
 * RETIRED -> APPROVED is not authorized.
 * ============================================================
 */

export function canApproveApplicabilityDefinition(
  status: ApplicabilityDefinitionStatus
): ApplicabilityDefinitionApprovalPolicyResult {
  switch (status) {
    case ApplicabilityDefinitionStatus.DRAFT:
      return {
        success: true,
      };

    case ApplicabilityDefinitionStatus.APPROVED:
      return {
        success: false,
        reason: "DEFINITION_ALREADY_APPROVED",
      };

    case ApplicabilityDefinitionStatus.RETIRED:
      return {
        success: false,
        reason: "INVALID_DEFINITION_STATUS",
      };

    default: {
      const exhaustiveCheck: never = status;

      throw new Error(
        `Unhandled applicability definition status: ${exhaustiveCheck}`
      );
    }
  }
}

type ApplicabilityDefinitionApprovalContext = {
  definition: {
    id: string;
    requirementId: string;
    version: number;
    status: ApplicabilityDefinitionStatus;
  };
};

type ApplicabilityDefinitionApprovalContextResult =
  | {
      success: true;
      context: ApplicabilityDefinitionApprovalContext;
    }
  | {
      success: false;
      reason:
        | "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
        | "APPLICABILITY_DEFINITION_NOT_FOUND"
        | "REQUIREMENT_NOT_FOUND"
        | "REQUIREMENT_INACTIVE";
      message: string;
    };

/*
 * ============================================================
 * APPROVAL CONTEXT VALIDATION
 * ============================================================
 */

async function validateApplicabilityDefinitionApprovalContext(
  db: DatabaseClient,
  input: ApproveApplicabilityDefinitionInput
): Promise<ApplicabilityDefinitionApprovalContextResult> {
  const membership =
    await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: input.actorUserId,
          organizationId: input.organizationId,
        },
      },
      select: {
        active: true,
      },
    });

  if (!membership || !membership.active) {
    return {
      success: false,
      reason: "USER_NOT_ACTIVE_ORGANIZATION_MEMBER",
      message:
        "Actor must be an active member of the authorization organization.",
    };
  }

  const definition =
    await db.applicabilityDefinition.findUnique({
      where: {
        id: input.applicabilityDefinitionId,
      },
      select: {
        id: true,
        requirementId: true,
        version: true,
        status: true,
      },
    });

  if (!definition) {
    return {
      success: false,
      reason: "APPLICABILITY_DEFINITION_NOT_FOUND",
      message:
        "Applicability definition not found.",
    };
  }

  const requirement =
    await db.complianceRequirement.findUnique({
      where: {
        id: definition.requirementId,
      },
      select: {
        id: true,
        active: true,
      },
    });

  if (!requirement) {
    return {
      success: false,
      reason: "REQUIREMENT_NOT_FOUND",
      message:
        "Compliance requirement not found.",
    };
  }

  if (!requirement.active) {
    return {
      success: false,
      reason: "REQUIREMENT_INACTIVE",
      message:
        "Compliance requirement is inactive.",
    };
  }

  return {
    success: true,
    context: {
      definition,
    },
  };
}

const approvedApplicabilityDefinitionSelect = {
  id: true,
  requirementId: true,
  version: true,
  status: true,
  approvedAt: true,
  approvedById: true,
} satisfies Prisma.ApplicabilityDefinitionSelect;

/*
 * ============================================================
 * GUARDED APPROVAL PERSISTENCE
 * ============================================================
 *
 * The mutation is guarded by the exact lifecycle state observed
 * by the approval policy.
 *
 * A successful write must affect exactly one DRAFT definition.
 * ============================================================
 */

async function persistApplicabilityDefinitionApproval(
  tx: Prisma.TransactionClient,
  input: ApproveApplicabilityDefinitionInput,
  context: ApplicabilityDefinitionApprovalContext
): Promise<ApproveApplicabilityDefinitionResult> {
  const approvedAt = new Date();

  const update =
    await tx.applicabilityDefinition.updateMany({
      where: {
        id: context.definition.id,
        status: ApplicabilityDefinitionStatus.DRAFT,
      },
      data: {
        status: ApplicabilityDefinitionStatus.APPROVED,
        approvedAt,
        approvedById: input.actorUserId,
      },
    });

  if (update.count !== 1) {
    return {
      success: false,
      reason: "DEFINITION_CHANGED_DURING_APPROVAL",
      message:
        "Applicability definition changed before approval could be committed.",
    };
  }

  const definition =
    await tx.applicabilityDefinition.findUnique({
      where: {
        id: context.definition.id,
      },
      select: approvedApplicabilityDefinitionSelect,
    });

  if (
    !definition ||
    definition.status !== ApplicabilityDefinitionStatus.APPROVED ||
    definition.approvedById !== input.actorUserId ||
    definition.approvedAt === null
  ) {
    return {
      success: false,
      reason: "APPROVAL_TRANSACTION_FAILED",
      message:
        "Applicability definition approval could not be confirmed after persistence.",
    };
  }

  return {
    success: true,
    definition,
  };
}

/*
 * ============================================================
 * APPROVE APPLICABILITY DEFINITION
 * ============================================================
 *
 * Performs one explicit governance transition:
 *
 * DRAFT -> APPROVED
 *
 * Approval is isolated from current-authority selection.
 * ============================================================
 */

export async function approveApplicabilityDefinition(
  input: ApproveApplicabilityDefinitionInput
): Promise<ApproveApplicabilityDefinitionResult> {
  try {
    return await prisma.$transaction<ApproveApplicabilityDefinitionResult>(
      async (
        transaction: Prisma.TransactionClient
      ): Promise<ApproveApplicabilityDefinitionResult> => {
        const validation =
          await validateApplicabilityDefinitionApprovalContext(
            transaction,
            input
          );

        if (!validation.success) {
          return validation;
        }

        const policy =
          canApproveApplicabilityDefinition(
            validation.context.definition.status
          );

        if (!policy.success) {
          switch (policy.reason) {
            case "DEFINITION_ALREADY_APPROVED":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Applicability definition is already approved.",
              };

            case "INVALID_DEFINITION_STATUS":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Applicability definition is not in a state that may be approved.",
              };

            default: {
              const exhaustiveCheck: never =
                policy.reason;

              throw new Error(
                `Unhandled applicability definition approval policy result: ${exhaustiveCheck}`
              );
            }
          }
        }

        return persistApplicabilityDefinitionApproval(
          transaction,
          input,
          validation.context
        );
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        success: false,
        reason: "CONCURRENT_APPROVAL_CONFLICT",
        message:
          "Applicability definition approval conflicted with another concurrent transaction.",
      };
    }

    return {
      success: false,
      reason: "APPROVAL_TRANSACTION_FAILED",
      message:
        "Applicability definition approval transaction failed.",
    };
  }
}
