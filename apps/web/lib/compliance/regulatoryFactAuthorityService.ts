import {
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/*
 * ============================================================
 * COMPLIANCEOS — REGULATORY FACT AUTHORITY SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Select which existing RegulatoryFactValue currently governs
 * one RegulatoryFact.
 *
 * CURRENT AUTHORITY IS NOT EVIDENTIAL QUALITY
 *
 * CurrentRegulatoryFactAuthority identifies governing
 * organizational state.
 *
 * It does NOT imply:
 *
 * - KNOWN;
 * - VERIFIED;
 * - highest version;
 * - latest timestamp;
 * - strongest provenance.
 *
 * RegulatoryFactValue.authorityState remains independent and
 * is not mutated by this service.
 *
 * AUTHORITY HISTORY
 *
 * Every successful initial establishment or supersession must
 * preserve a typed RegulatoryFactAuthorityTransition in the
 * same transaction as the current-authority change.
 *
 * AUTHORIZATION
 *
 * V1 requires the initiating actor to be an active member of
 * the RegulatoryFact's organization.
 *
 * No role-specific authority policy is invented here.
 *
 * ============================================================
 */

export type RegulatoryFactAuthorityFailureReason =
  | "REGULATORY_FACT_NOT_FOUND"
  | "REGULATORY_FACT_INACTIVE"
  | "FACT_VALUE_NOT_FOUND"
  | "FACT_VALUE_MISMATCH"
  | "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
  | "CURRENT_AUTHORITY_NOT_FOUND"
  | "CURRENT_AUTHORITY_ALREADY_EXISTS"
  | "FACT_VALUE_ALREADY_AUTHORITATIVE"
  | "AUTHORITY_CHANGED_DURING_SUPERSESSION"
  | "CONCURRENT_AUTHORITY_CONFLICT"
  | "AUTHORITY_TRANSACTION_FAILED";

export type RegulatoryFactAuthorityRecord = {
  id: string;
  regulatoryFactId: string;
  regulatoryFactValueId: string;
  establishedAt: Date;
  establishedById: string | null;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RegulatoryFactAuthoritySuccess = {
  success: true;
  authority: RegulatoryFactAuthorityRecord;
};

export type RegulatoryFactAuthorityFailure = {
  success: false;
  reason: RegulatoryFactAuthorityFailureReason;
  message: string;
};

export type RegulatoryFactAuthorityResult =
  | RegulatoryFactAuthoritySuccess
  | RegulatoryFactAuthorityFailure;

export type RegulatoryFactAuthorityCandidate = {
  id: string;
  regulatoryFactId: string;
};

export type RegulatoryFactAuthoritySnapshot = {
  regulatoryFactId: string;
  regulatoryFactValueId: string;
};

export type EstablishRegulatoryFactAuthorityPolicyResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason:
        | "FACT_VALUE_MISMATCH"
        | "CURRENT_AUTHORITY_ALREADY_EXISTS"
        | "FACT_VALUE_ALREADY_AUTHORITATIVE";
    };

export type SupersedeRegulatoryFactAuthorityPolicyResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason:
        | "FACT_VALUE_MISMATCH"
        | "CURRENT_AUTHORITY_NOT_FOUND"
        | "FACT_VALUE_ALREADY_AUTHORITATIVE";
    };

type DatabaseClient =
  | Prisma.TransactionClient
  | typeof prisma;

/*
 * ============================================================
 * PURE AUTHORITY POLICY
 * ============================================================
 */

export function canEstablishRegulatoryFactAuthority(
  regulatoryFactId: string,
  candidate: RegulatoryFactAuthorityCandidate,
  currentAuthority: RegulatoryFactAuthoritySnapshot | null
): EstablishRegulatoryFactAuthorityPolicyResult {
  if (candidate.regulatoryFactId !== regulatoryFactId) {
    return {
      success: false,
      reason: "FACT_VALUE_MISMATCH",
    };
  }

  if (currentAuthority !== null) {
    if (
      currentAuthority.regulatoryFactId === regulatoryFactId &&
      currentAuthority.regulatoryFactValueId === candidate.id
    ) {
      return {
        success: false,
        reason: "FACT_VALUE_ALREADY_AUTHORITATIVE",
      };
    }

    return {
      success: false,
      reason: "CURRENT_AUTHORITY_ALREADY_EXISTS",
    };
  }

  return {
    success: true,
  };
}

export function canSupersedeRegulatoryFactAuthority(
  regulatoryFactId: string,
  candidate: RegulatoryFactAuthorityCandidate,
  currentAuthority: RegulatoryFactAuthoritySnapshot | null
): SupersedeRegulatoryFactAuthorityPolicyResult {
  if (candidate.regulatoryFactId !== regulatoryFactId) {
    return {
      success: false,
      reason: "FACT_VALUE_MISMATCH",
    };
  }

  if (currentAuthority === null) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_NOT_FOUND",
    };
  }

  if (
    currentAuthority.regulatoryFactId === regulatoryFactId &&
    currentAuthority.regulatoryFactValueId === candidate.id
  ) {
    return {
      success: false,
      reason: "FACT_VALUE_ALREADY_AUTHORITATIVE",
    };
  }

  return {
    success: true,
  };
}

type RegulatoryFactAuthorityReadContext = {
  regulatoryFactId: string;
  organizationId: string;
  candidate: RegulatoryFactAuthorityCandidate;
};

type RegulatoryFactAuthorityReadResult =
  | {
      success: true;
      context: RegulatoryFactAuthorityReadContext;
    }
  | RegulatoryFactAuthorityFailure;

async function validateRegulatoryFactAuthorityContext(
  db: DatabaseClient,
  regulatoryFactId: string,
  regulatoryFactValueId: string,
  actorUserId: string
): Promise<RegulatoryFactAuthorityReadResult> {
  const regulatoryFact =
    await db.regulatoryFact.findUnique({
      where: {
        id: regulatoryFactId,
      },
      select: {
        id: true,
        organizationId: true,
        active: true,
      },
    });

  if (!regulatoryFact) {
    return {
      success: false,
      reason: "REGULATORY_FACT_NOT_FOUND",
      message:
        "Regulatory fact not found.",
    };
  }

  if (!regulatoryFact.active) {
    return {
      success: false,
      reason: "REGULATORY_FACT_INACTIVE",
      message:
        "Regulatory fact is inactive.",
    };
  }

  const membership =
    await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: actorUserId,
          organizationId:
            regulatoryFact.organizationId,
        },
      },
      select: {
        active: true,
      },
    });

  if (!membership || !membership.active) {
    return {
      success: false,
      reason:
        "USER_NOT_ACTIVE_ORGANIZATION_MEMBER",
      message:
        "Actor must be an active member of the organization.",
    };
  }

  const candidate =
    await db.regulatoryFactValue.findUnique({
      where: {
        id: regulatoryFactValueId,
      },
      select: {
        id: true,
        regulatoryFactId: true,
      },
    });

  if (!candidate) {
    return {
      success: false,
      reason: "FACT_VALUE_NOT_FOUND",
      message:
        "Regulatory fact value not found.",
    };
  }

  if (
    candidate.regulatoryFactId !==
    regulatoryFact.id
  ) {
    return {
      success: false,
      reason: "FACT_VALUE_MISMATCH",
      message:
        "Regulatory fact value does not belong to the selected regulatory fact.",
    };
  }

  return {
    success: true,
    context: {
      regulatoryFactId: regulatoryFact.id,
      organizationId:
        regulatoryFact.organizationId,
      candidate,
    },
  };
}

const regulatoryFactAuthoritySelect = {
  id: true,
  regulatoryFactId: true,
  regulatoryFactValueId: true,
  establishedAt: true,
  establishedById: true,
  reason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CurrentRegulatoryFactAuthoritySelect;

type ReadRegulatoryFactAuthorityResult =
  | RegulatoryFactAuthoritySuccess
  | {
      success: false;
      reason: "CURRENT_AUTHORITY_NOT_FOUND";
      message: string;
    };

async function findCurrentRegulatoryFactAuthority(
  db: DatabaseClient,
  regulatoryFactId: string
): Promise<RegulatoryFactAuthoritySnapshot | null> {
  return db.currentRegulatoryFactAuthority.findUnique({
    where: {
      regulatoryFactId,
    },
    select: {
      regulatoryFactId: true,
      regulatoryFactValueId: true,
    },
  });
}

export async function getCurrentRegulatoryFactAuthority(
  regulatoryFactId: string
): Promise<ReadRegulatoryFactAuthorityResult> {
  const authority =
    await prisma.currentRegulatoryFactAuthority.findUnique({
      where: {
        regulatoryFactId,
      },
      select: regulatoryFactAuthoritySelect,
    });

  if (!authority) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_NOT_FOUND",
      message:
        "No current regulatory fact authority exists for the selected regulatory fact.",
    };
  }

  return {
    success: true,
    authority,
  };
}

/*
 * ============================================================
 * ESTABLISH INITIAL REGULATORY FACT AUTHORITY
 * ============================================================
 *
 * Establishes current authority only when the RegulatoryFact
 * has no current authority.
 *
 * The selected RegulatoryFactValue must already exist and must
 * belong to the exact RegulatoryFact.
 *
 * Current authority and typed transition history are committed
 * atomically in one SERIALIZABLE transaction.
 *
 * This operation does NOT mutate RegulatoryFactValue.
 * ============================================================
 */

export async function establishInitialRegulatoryFactAuthority(
  regulatoryFactId: string,
  regulatoryFactValueId: string,
  actorUserId: string,
  reason?: string | null
): Promise<RegulatoryFactAuthorityResult> {
  try {
    return await prisma.$transaction<RegulatoryFactAuthorityResult>(
      async (
        transaction: Prisma.TransactionClient
      ): Promise<RegulatoryFactAuthorityResult> => {
        const validation =
          await validateRegulatoryFactAuthorityContext(
            transaction,
            regulatoryFactId,
            regulatoryFactValueId,
            actorUserId
          );

        if (!validation.success) {
          return validation;
        }

        const currentAuthority =
          await findCurrentRegulatoryFactAuthority(
            transaction,
            validation.context.regulatoryFactId
          );

        const policy =
          canEstablishRegulatoryFactAuthority(
            validation.context.regulatoryFactId,
            validation.context.candidate,
            currentAuthority
          );

        if (!policy.success) {
          switch (policy.reason) {
            case "FACT_VALUE_MISMATCH":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Regulatory fact value does not belong to the selected regulatory fact.",
              };

            case "FACT_VALUE_ALREADY_AUTHORITATIVE":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Regulatory fact value is already authoritative for the selected regulatory fact.",
              };

            case "CURRENT_AUTHORITY_ALREADY_EXISTS":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Current regulatory fact authority already exists.",
              };

            default: {
              const exhaustiveCheck: never =
                policy.reason;

              throw new Error(
                `Unhandled regulatory fact authority policy result: ${exhaustiveCheck}`
              );
            }
          }
        }

        const authority =
          await transaction.currentRegulatoryFactAuthority.create({
            data: {
              regulatoryFactId:
                validation.context.regulatoryFactId,
              regulatoryFactValueId:
                validation.context.candidate.id,
              establishedById: actorUserId,
              reason: reason ?? null,
            },
            select: regulatoryFactAuthoritySelect,
          });

        await transaction.regulatoryFactAuthorityTransition.create({
          data: {
            regulatoryFactId:
              validation.context.regulatoryFactId,
            previousFactValueId: null,
            newFactValueId:
              validation.context.candidate.id,
            establishedById: actorUserId,
            reason: reason ?? null,
          },
        });

        return {
          success: true,
          authority,
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
      error.code === "P2034"
    ) {
      return {
        success: false,
        reason: "CONCURRENT_AUTHORITY_CONFLICT",
        message:
          "Initial regulatory fact authority could not be established because of a concurrent authority change.",
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;

      if (
        Array.isArray(target) &&
        target.includes("regulatoryFactId")
      ) {
        return {
          success: false,
          reason: "CURRENT_AUTHORITY_ALREADY_EXISTS",
          message:
            "Current regulatory fact authority was established by another operation.",
        };
      }
    }

    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Initial regulatory fact authority could not be established safely.",
    };
  }
}

/*
 * ============================================================
 * SUPERSEDE REGULATORY FACT AUTHORITY
 * ============================================================
 *
 * Replaces an existing current authority with another existing
 * RegulatoryFactValue belonging to the same RegulatoryFact.
 *
 * The current pointer update is guarded by the exact previously
 * observed regulatoryFactValueId to prevent stale authority
 * replacement.
 *
 * The pointer change and typed transition history are committed
 * atomically in one SERIALIZABLE transaction.
 *
 * This operation does NOT mutate RegulatoryFactValue.
 * ============================================================
 */

export async function supersedeRegulatoryFactAuthority(
  regulatoryFactId: string,
  regulatoryFactValueId: string,
  actorUserId: string,
  reason?: string | null
): Promise<RegulatoryFactAuthorityResult> {
  try {
    return await prisma.$transaction<RegulatoryFactAuthorityResult>(
      async (
        transaction: Prisma.TransactionClient
      ): Promise<RegulatoryFactAuthorityResult> => {
        const validation =
          await validateRegulatoryFactAuthorityContext(
            transaction,
            regulatoryFactId,
            regulatoryFactValueId,
            actorUserId
          );

        if (!validation.success) {
          return validation;
        }

        const currentAuthority =
          await findCurrentRegulatoryFactAuthority(
            transaction,
            validation.context.regulatoryFactId
          );

        const policy =
          canSupersedeRegulatoryFactAuthority(
            validation.context.regulatoryFactId,
            validation.context.candidate,
            currentAuthority
          );

        if (!policy.success) {
          switch (policy.reason) {
            case "FACT_VALUE_MISMATCH":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Regulatory fact value does not belong to the selected regulatory fact.",
              };

            case "CURRENT_AUTHORITY_NOT_FOUND":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "No current regulatory fact authority exists to supersede.",
              };

            case "FACT_VALUE_ALREADY_AUTHORITATIVE":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Regulatory fact value is already authoritative for the selected regulatory fact.",
              };

            default: {
              const exhaustiveCheck: never =
                policy.reason;

              throw new Error(
                `Unhandled regulatory fact authority policy result: ${exhaustiveCheck}`
              );
            }
          }
        }

        if (!currentAuthority) {
          return {
            success: false,
            reason: "CURRENT_AUTHORITY_NOT_FOUND",
            message:
              "No current regulatory fact authority exists to supersede.",
          };
        }

        const previousFactValueId =
          currentAuthority.regulatoryFactValueId;

        const update =
          await transaction.currentRegulatoryFactAuthority.updateMany({
            where: {
              regulatoryFactId:
                validation.context.regulatoryFactId,
              regulatoryFactValueId:
                previousFactValueId,
            },
            data: {
              regulatoryFactValueId:
                validation.context.candidate.id,
              establishedAt: new Date(),
              establishedById: actorUserId,
              reason: reason ?? null,
            },
          });

        if (update.count !== 1) {
          return {
            success: false,
            reason:
              "AUTHORITY_CHANGED_DURING_SUPERSESSION",
            message:
              "Current regulatory fact authority changed before supersession could be committed.",
          };
        }

        await transaction.regulatoryFactAuthorityTransition.create({
          data: {
            regulatoryFactId:
              validation.context.regulatoryFactId,
            previousFactValueId,
            newFactValueId:
              validation.context.candidate.id,
            establishedById: actorUserId,
            reason: reason ?? null,
          },
        });

        const authority =
          await transaction.currentRegulatoryFactAuthority.findUnique({
            where: {
              regulatoryFactId:
                validation.context.regulatoryFactId,
            },
            select: regulatoryFactAuthoritySelect,
          });

        if (
          !authority ||
          authority.regulatoryFactValueId !==
            validation.context.candidate.id
        ) {
          throw new Error(
            "Regulatory fact authority supersession could not be confirmed."
          );
        }

        return {
          success: true,
          authority,
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
      error.code === "P2034"
    ) {
      return {
        success: false,
        reason: "CONCURRENT_AUTHORITY_CONFLICT",
        message:
          "Regulatory fact authority could not be superseded because of a concurrent authority change.",
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;

      if (
        Array.isArray(target) &&
        target.includes("regulatoryFactValueId")
      ) {
        return {
          success: false,
          reason: "CONCURRENT_AUTHORITY_CONFLICT",
          message:
            "The selected regulatory fact value is already involved in another current-authority assignment.",
        };
      }
    }

    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Regulatory fact authority could not be superseded safely.",
    };
  }
}
