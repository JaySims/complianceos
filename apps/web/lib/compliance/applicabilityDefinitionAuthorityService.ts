import {
  ApplicabilityDefinitionStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/*
 * ============================================================
 * COMPLIANCEOS — APPLICABILITY DEFINITION AUTHORITY SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Explicitly govern which approved ApplicabilityDefinition is
 * CURRENT for a ComplianceRequirement.
 *
 * APPROVED != CURRENT
 * LATEST VERSION != CURRENT
 *
 * This service must never infer authority from version,
 * createdAt, approvedAt, or effective dates.
 *
 * AUTHORIZATION
 *
 * V1 requires the actor to be an active member of the supplied
 * authorization Organization. No stricter role policy is
 * invented here.
 *
 * LIFECYCLE
 *
 * This service does not approve or retire definitions.
 *
 * ============================================================
 */

export type ApplicabilityDefinitionAuthorityFailureReason =
  | "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
  | "REQUIREMENT_NOT_FOUND"
  | "APPLICABILITY_DEFINITION_NOT_FOUND"
  | "APPLICABILITY_DEFINITION_REQUIREMENT_MISMATCH"
  | "APPLICABILITY_DEFINITION_NOT_APPROVED"
  | "CURRENT_AUTHORITY_NOT_FOUND"
  | "CURRENT_AUTHORITY_ALREADY_EXISTS"
  | "SAME_DEFINITION_ALREADY_AUTHORITATIVE"
  | "CURRENT_AUTHORITY_CHANGED"
  | "CONCURRENT_AUTHORITY_CONFLICT"
  | "AUTHORITY_TRANSACTION_FAILED";

export type ApplicabilityDefinitionAuthorityRecord = {
  id: string;
  requirementId: string;
  applicabilityDefinitionId: string;
  establishedAt: Date;
  establishedById: string | null;
  reason: string | null;
};

export type ApplicabilityDefinitionAuthorityResult =
  | {
      success: true;
      authority: ApplicabilityDefinitionAuthorityRecord;
    }
  | {
      success: false;
      reason: ApplicabilityDefinitionAuthorityFailureReason;
      message: string;
    };

export type ApplicabilityDefinitionAuthorityCandidate = {
  id: string;
  requirementId: string;
  status: ApplicabilityDefinitionStatus;
};

export type ApplicabilityDefinitionAuthoritySnapshot = {
  applicabilityDefinitionId: string;
} | null;

export type EstablishApplicabilityDefinitionAuthorityPolicyResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason:
        | "APPLICABILITY_DEFINITION_REQUIREMENT_MISMATCH"
        | "APPLICABILITY_DEFINITION_NOT_APPROVED"
        | "CURRENT_AUTHORITY_ALREADY_EXISTS";
    };

export type SupersedeApplicabilityDefinitionAuthorityPolicyResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason:
        | "APPLICABILITY_DEFINITION_REQUIREMENT_MISMATCH"
        | "APPLICABILITY_DEFINITION_NOT_APPROVED"
        | "CURRENT_AUTHORITY_NOT_FOUND"
        | "SAME_DEFINITION_ALREADY_AUTHORITATIVE";
    };

type DatabaseClient =
  | Prisma.TransactionClient
  | typeof prisma;

export function canEstablishApplicabilityDefinitionAuthority(
  requirementId: string,
  candidate: ApplicabilityDefinitionAuthorityCandidate,
  current: ApplicabilityDefinitionAuthoritySnapshot
): EstablishApplicabilityDefinitionAuthorityPolicyResult {
  if (candidate.requirementId !== requirementId) {
    return {
      success: false,
      reason:
        "APPLICABILITY_DEFINITION_REQUIREMENT_MISMATCH",
    };
  }

  if (
    candidate.status !==
    ApplicabilityDefinitionStatus.APPROVED
  ) {
    return {
      success: false,
      reason:
        "APPLICABILITY_DEFINITION_NOT_APPROVED",
    };
  }

  if (current !== null) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_ALREADY_EXISTS",
    };
  }

  return {
    success: true,
  };
}

export function canSupersedeApplicabilityDefinitionAuthority(
  requirementId: string,
  candidate: ApplicabilityDefinitionAuthorityCandidate,
  current: ApplicabilityDefinitionAuthoritySnapshot
): SupersedeApplicabilityDefinitionAuthorityPolicyResult {
  if (candidate.requirementId !== requirementId) {
    return {
      success: false,
      reason:
        "APPLICABILITY_DEFINITION_REQUIREMENT_MISMATCH",
    };
  }

  if (
    candidate.status !==
    ApplicabilityDefinitionStatus.APPROVED
  ) {
    return {
      success: false,
      reason:
        "APPLICABILITY_DEFINITION_NOT_APPROVED",
    };
  }

  if (current === null) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_NOT_FOUND",
    };
  }

  if (
    current.applicabilityDefinitionId ===
    candidate.id
  ) {
    return {
      success: false,
      reason:
        "SAME_DEFINITION_ALREADY_AUTHORITATIVE",
    };
  }

  return {
    success: true,
  };
}

type ApplicabilityDefinitionAuthorityContext = {
  requirement: {
    id: string;
  };
  candidate: ApplicabilityDefinitionAuthorityCandidate;
};

type ApplicabilityDefinitionAuthorityContextResult =
  | {
      success: true;
      context: ApplicabilityDefinitionAuthorityContext;
    }
  | {
      success: false;
      reason:
        | "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
        | "REQUIREMENT_NOT_FOUND"
        | "APPLICABILITY_DEFINITION_NOT_FOUND";
      message: string;
    };

async function validateApplicabilityDefinitionAuthorityContext(
  db: DatabaseClient,
  input: {
    organizationId: string;
    requirementId: string;
    applicabilityDefinitionId: string;
    actorUserId: string;
  }
): Promise<ApplicabilityDefinitionAuthorityContextResult> {
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

  const requirement =
    await db.complianceRequirement.findUnique({
      where: {
        id: input.requirementId,
      },
      select: {
        id: true,
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

  const candidate =
    await db.applicabilityDefinition.findUnique({
      where: {
        id: input.applicabilityDefinitionId,
      },
      select: {
        id: true,
        requirementId: true,
        status: true,
      },
    });

  if (!candidate) {
    return {
      success: false,
      reason: "APPLICABILITY_DEFINITION_NOT_FOUND",
      message:
        "Applicability definition not found.",
    };
  }

  return {
    success: true,
    context: {
      requirement,
      candidate,
    },
  };
}

const applicabilityDefinitionAuthoritySelect = {
  id: true,
  requirementId: true,
  applicabilityDefinitionId: true,
  establishedAt: true,
  establishedById: true,
  reason: true,
} satisfies Prisma.CurrentApplicabilityDefinitionAuthoritySelect;

async function readCurrentApplicabilityDefinitionAuthority(
  db: DatabaseClient,
  requirementId: string
): Promise<ApplicabilityDefinitionAuthorityRecord | null> {
  return db.currentApplicabilityDefinitionAuthority.findUnique({
    where: {
      requirementId,
    },
    select: applicabilityDefinitionAuthoritySelect,
  });
}

export async function getCurrentApplicabilityDefinitionAuthority(
  requirementId: string
): Promise<ApplicabilityDefinitionAuthorityResult> {
  try {
    const authority =
      await readCurrentApplicabilityDefinitionAuthority(
        prisma,
        requirementId
      );

    if (!authority) {
      return {
        success: false,
        reason: "CURRENT_AUTHORITY_NOT_FOUND",
        message:
          "No current applicability definition authority exists for this requirement.",
      };
    }

    return {
      success: true,
      authority,
    };
  } catch {
    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Current applicability definition authority could not be read.",
    };
  }
}

export type EstablishInitialApplicabilityDefinitionAuthorityInput = {
  organizationId: string;
  requirementId: string;
  applicabilityDefinitionId: string;
  actorUserId: string;
  reason?: string | null;
};

export async function establishInitialApplicabilityDefinitionAuthority(
  input: EstablishInitialApplicabilityDefinitionAuthorityInput
): Promise<ApplicabilityDefinitionAuthorityResult> {
  try {
    return await prisma.$transaction<ApplicabilityDefinitionAuthorityResult>(
      async (
        transaction: Prisma.TransactionClient
      ): Promise<ApplicabilityDefinitionAuthorityResult> => {
        const validation =
          await validateApplicabilityDefinitionAuthorityContext(
            transaction,
            input
          );

        if (!validation.success) {
          return validation;
        }

        const current =
          await readCurrentApplicabilityDefinitionAuthority(
            transaction,
            input.requirementId
          );

        const policy =
          canEstablishApplicabilityDefinitionAuthority(
            input.requirementId,
            validation.context.candidate,
            current
              ? {
                  applicabilityDefinitionId:
                    current.applicabilityDefinitionId,
                }
              : null
          );

        if (!policy.success) {
          return {
            success: false,
            reason: policy.reason,
            message:
              policy.reason ===
              "APPLICABILITY_DEFINITION_REQUIREMENT_MISMATCH"
                ? "Applicability definition does not belong to the supplied requirement."
                : policy.reason ===
                  "APPLICABILITY_DEFINITION_NOT_APPROVED"
                ? "Only an approved applicability definition may become current."
                : "Current applicability definition authority already exists for this requirement.",
          };
        }

        const authority =
          await transaction.currentApplicabilityDefinitionAuthority.create({
            data: {
              requirementId: input.requirementId,
              applicabilityDefinitionId:
                input.applicabilityDefinitionId,
              establishedById: input.actorUserId,
              reason: input.reason ?? null,
            },
            select: applicabilityDefinitionAuthoritySelect,
          });

        await transaction.applicabilityDefinitionAuthorityTransition.create({
          data: {
            requirementId: input.requirementId,
            previousApplicabilityDefinitionId: null,
            newApplicabilityDefinitionId:
              input.applicabilityDefinitionId,
            establishedById: input.actorUserId,
            reason: input.reason ?? null,
          },
        });

        const confirmed =
          await readCurrentApplicabilityDefinitionAuthority(
            transaction,
            input.requirementId
          );

        if (
          !confirmed ||
          confirmed.id !== authority.id ||
          confirmed.applicabilityDefinitionId !==
            input.applicabilityDefinitionId
        ) {
          return {
            success: false,
            reason: "AUTHORITY_TRANSACTION_FAILED",
            message:
              "Initial applicability definition authority could not be confirmed after persistence.",
          };
        }

        return {
          success: true,
          authority: confirmed,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" ||
        error.code === "P2002")
    ) {
      return {
        success: false,
        reason: "CONCURRENT_AUTHORITY_CONFLICT",
        message:
          "Initial applicability definition authority conflicted with another concurrent transaction.",
      };
    }

    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Initial applicability definition authority transaction failed.",
    };
  }
}

export type SupersedeApplicabilityDefinitionAuthorityInput = {
  organizationId: string;
  requirementId: string;
  applicabilityDefinitionId: string;
  actorUserId: string;
  reason?: string | null;
};

export async function supersedeApplicabilityDefinitionAuthority(
  input: SupersedeApplicabilityDefinitionAuthorityInput
): Promise<ApplicabilityDefinitionAuthorityResult> {
  try {
    return await prisma.$transaction<ApplicabilityDefinitionAuthorityResult>(
      async (
        transaction: Prisma.TransactionClient
      ): Promise<ApplicabilityDefinitionAuthorityResult> => {
        const validation =
          await validateApplicabilityDefinitionAuthorityContext(
            transaction,
            input
          );

        if (!validation.success) {
          return validation;
        }

        const current =
          await readCurrentApplicabilityDefinitionAuthority(
            transaction,
            input.requirementId
          );

        const snapshot: ApplicabilityDefinitionAuthoritySnapshot =
          current
            ? {
                applicabilityDefinitionId:
                  current.applicabilityDefinitionId,
              }
            : null;

        const policy =
          canSupersedeApplicabilityDefinitionAuthority(
            input.requirementId,
            validation.context.candidate,
            snapshot
          );

        if (!policy.success) {
          switch (policy.reason) {
            case "APPLICABILITY_DEFINITION_REQUIREMENT_MISMATCH":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Applicability definition does not belong to the supplied requirement.",
              };

            case "APPLICABILITY_DEFINITION_NOT_APPROVED":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Only an approved applicability definition may become current.",
              };

            case "CURRENT_AUTHORITY_NOT_FOUND":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "No current applicability definition authority exists to supersede.",
              };

            case "SAME_DEFINITION_ALREADY_AUTHORITATIVE":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Applicability definition is already the current authority.",
              };

            default: {
              const exhaustiveCheck: never =
                policy.reason;

              throw new Error(
                `Unhandled applicability definition supersession policy result: ${exhaustiveCheck}`
              );
            }
          }
        }

        if (!current) {
          return {
            success: false,
            reason: "CURRENT_AUTHORITY_NOT_FOUND",
            message:
              "No current applicability definition authority exists to supersede.",
          };
        }

        const update =
          await transaction.currentApplicabilityDefinitionAuthority.updateMany({
            where: {
              requirementId: input.requirementId,
              applicabilityDefinitionId:
                current.applicabilityDefinitionId,
            },
            data: {
              applicabilityDefinitionId:
                input.applicabilityDefinitionId,
              establishedAt: new Date(),
              establishedById: input.actorUserId,
              reason: input.reason ?? null,
            },
          });

        if (update.count !== 1) {
          return {
            success: false,
            reason: "CURRENT_AUTHORITY_CHANGED",
            message:
              "Current applicability definition authority changed before supersession could be committed.",
          };
        }

        await transaction.applicabilityDefinitionAuthorityTransition.create({
          data: {
            requirementId: input.requirementId,
            previousApplicabilityDefinitionId:
              current.applicabilityDefinitionId,
            newApplicabilityDefinitionId:
              input.applicabilityDefinitionId,
            establishedById: input.actorUserId,
            reason: input.reason ?? null,
          },
        });

        const confirmed =
          await readCurrentApplicabilityDefinitionAuthority(
            transaction,
            input.requirementId
          );

        if (
          !confirmed ||
          confirmed.applicabilityDefinitionId !==
            input.applicabilityDefinitionId
        ) {
          return {
            success: false,
            reason: "AUTHORITY_TRANSACTION_FAILED",
            message:
              "Superseded applicability definition authority could not be confirmed after persistence.",
          };
        }

        return {
          success: true,
          authority: confirmed,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" ||
        error.code === "P2002")
    ) {
      return {
        success: false,
        reason: "CONCURRENT_AUTHORITY_CONFLICT",
        message:
          "Applicability definition authority supersession conflicted with another concurrent transaction.",
      };
    }

    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Applicability definition authority supersession transaction failed.",
    };
  }
}
