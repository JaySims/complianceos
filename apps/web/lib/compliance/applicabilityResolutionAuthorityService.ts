import {
  AssessmentStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/*
 * ============================================================
 * COMPLIANCEOS — APPLICABILITY RESOLUTION AUTHORITY SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Explicitly govern which existing
 * AssessmentRequirementApplicabilityRevision is CURRENT for a
 * stable AssessmentRequirementApplicability identity.
 *
 * RESOLVED REVISION != CURRENT REVISION
 * LATEST REVISION != CURRENT REVISION
 *
 * This service must never infer authority from revision number,
 * resolvedAt, createdAt, or any other ordering field.
 *
 * AUTHORIZATION
 *
 * V1 requires the actor to be an active member of the
 * applicability assessment's Organization. No stricter role
 * policy is invented here.
 *
 * LIFECYCLE
 *
 * Authority may change only while the parent Assessment is
 * mutable: DRAFT, IN_PROGRESS, or REVIEW.
 *
 * COMPLETED assessment history must not be silently rewritten.
 *
 * This service does not create applicability revisions and does
 * not alter Assessment lifecycle state.
 *
 * ============================================================
 */

export type ApplicabilityResolutionAuthorityFailureReason =
  | "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
  | "APPLICABILITY_NOT_FOUND"
  | "ASSESSMENT_NOT_MUTABLE"
  | "REVISION_NOT_FOUND"
  | "REVISION_APPLICABILITY_MISMATCH"
  | "CURRENT_AUTHORITY_NOT_FOUND"
  | "CURRENT_AUTHORITY_ALREADY_EXISTS"
  | "CURRENT_AUTHORITY_INTEGRITY_VIOLATION"
  | "SAME_REVISION_ALREADY_AUTHORITATIVE"
  | "CURRENT_AUTHORITY_CHANGED"
  | "CONCURRENT_AUTHORITY_CONFLICT"
  | "AUTHORITY_TRANSACTION_FAILED";

export type ApplicabilityResolutionAuthorityRecord = {
  id: string;
  applicabilityId: string;
  revisionId: string;
  establishedAt: Date;
  establishedById: string | null;
  reason: string | null;
};

export type ApplicabilityResolutionAuthorityResult =
  | {
      success: true;
      authority: ApplicabilityResolutionAuthorityRecord;
    }
  | {
      success: false;
      reason: ApplicabilityResolutionAuthorityFailureReason;
      message: string;
    };

export type ApplicabilityResolutionAuthorityCandidate = {
  id: string;
  applicabilityId: string;
};

export type ApplicabilityResolutionAuthoritySnapshot = {
  revisionId: string;
} | null;

export type EstablishApplicabilityResolutionAuthorityPolicyResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason:
        | "REVISION_APPLICABILITY_MISMATCH"
        | "CURRENT_AUTHORITY_ALREADY_EXISTS";
    };

export type SupersedeApplicabilityResolutionAuthorityPolicyResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason:
        | "REVISION_APPLICABILITY_MISMATCH"
        | "CURRENT_AUTHORITY_NOT_FOUND"
        | "SAME_REVISION_ALREADY_AUTHORITATIVE";
    };

type DatabaseClient =
  | Prisma.TransactionClient
  | typeof prisma;

const MUTABLE_ASSESSMENT_STATUSES =
  new Set<AssessmentStatus>([
    AssessmentStatus.DRAFT,
    AssessmentStatus.IN_PROGRESS,
    AssessmentStatus.REVIEW,
  ]);

export function canEstablishApplicabilityResolutionAuthority(
  applicabilityId: string,
  candidate: ApplicabilityResolutionAuthorityCandidate,
  current: ApplicabilityResolutionAuthoritySnapshot
): EstablishApplicabilityResolutionAuthorityPolicyResult {
  if (candidate.applicabilityId !== applicabilityId) {
    return {
      success: false,
      reason: "REVISION_APPLICABILITY_MISMATCH",
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

export function canSupersedeApplicabilityResolutionAuthority(
  applicabilityId: string,
  candidate: ApplicabilityResolutionAuthorityCandidate,
  current: ApplicabilityResolutionAuthoritySnapshot
): SupersedeApplicabilityResolutionAuthorityPolicyResult {
  if (candidate.applicabilityId !== applicabilityId) {
    return {
      success: false,
      reason: "REVISION_APPLICABILITY_MISMATCH",
    };
  }

  if (current === null) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_NOT_FOUND",
    };
  }

  if (current.revisionId === candidate.id) {
    return {
      success: false,
      reason: "SAME_REVISION_ALREADY_AUTHORITATIVE",
    };
  }

  return {
    success: true,
  };
}

type ApplicabilityResolutionAuthorityContext = {
  applicability: {
    id: string;
    assessmentId: string;
    assessment: {
      organizationId: string;
      status: AssessmentStatus;
    };
  };
  candidate: ApplicabilityResolutionAuthorityCandidate;
};

type ApplicabilityResolutionAuthorityContextResult =
  | {
      success: true;
      context: ApplicabilityResolutionAuthorityContext;
    }
  | {
      success: false;
      reason:
        | "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
        | "APPLICABILITY_NOT_FOUND"
        | "ASSESSMENT_NOT_MUTABLE"
        | "REVISION_NOT_FOUND";
      message: string;
    };

async function validateApplicabilityResolutionAuthorityContext(
  db: DatabaseClient,
  input: {
    organizationId: string;
    applicabilityId: string;
    revisionId: string;
    actorUserId: string;
  }
): Promise<ApplicabilityResolutionAuthorityContextResult> {
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

  const applicability =
    await db.assessmentRequirementApplicability.findUnique({
      where: {
        id: input.applicabilityId,
      },
      select: {
        id: true,
        assessmentId: true,
        assessment: {
          select: {
            organizationId: true,
            status: true,
          },
        },
      },
    });

  if (!applicability) {
    return {
      success: false,
      reason: "APPLICABILITY_NOT_FOUND",
      message:
        "Assessment requirement applicability record not found.",
    };
  }

  if (
    applicability.assessment.organizationId !==
    input.organizationId
  ) {
    return {
      success: false,
      reason: "USER_NOT_ACTIVE_ORGANIZATION_MEMBER",
      message:
        "Applicability does not belong to the authorization organization.",
    };
  }

  if (
    !MUTABLE_ASSESSMENT_STATUSES.has(
      applicability.assessment.status
    )
  ) {
    return {
      success: false,
      reason: "ASSESSMENT_NOT_MUTABLE",
      message:
        "Applicability resolution authority cannot change for a completed assessment.",
    };
  }

  const candidate =
    await db.assessmentRequirementApplicabilityRevision.findUnique({
      where: {
        id: input.revisionId,
      },
      select: {
        id: true,
        applicabilityId: true,
      },
    });

  if (!candidate) {
    return {
      success: false,
      reason: "REVISION_NOT_FOUND",
      message:
        "Applicability resolution revision not found.",
    };
  }

  return {
    success: true,
    context: {
      applicability,
      candidate,
    },
  };
}

const applicabilityResolutionAuthoritySelect = {
  id: true,
  applicabilityId: true,
  revisionId: true,
  establishedAt: true,
  establishedById: true,
  reason: true,
  revision: {
    select: {
      applicabilityId: true,
    },
  },
} satisfies Prisma.CurrentApplicabilityResolutionAuthoritySelect;

type InternalApplicabilityResolutionAuthorityRecord = {
  id: string;
  applicabilityId: string;
  revisionId: string;
  establishedAt: Date;
  establishedById: string | null;
  reason: string | null;
  revision: {
    applicabilityId: string;
  };
};

function toPublicApplicabilityResolutionAuthorityRecord(
  authority: InternalApplicabilityResolutionAuthorityRecord
): ApplicabilityResolutionAuthorityRecord {
  return {
    id: authority.id,
    applicabilityId: authority.applicabilityId,
    revisionId: authority.revisionId,
    establishedAt: authority.establishedAt,
    establishedById: authority.establishedById,
    reason: authority.reason,
  };
}

function hasCurrentApplicabilityResolutionAuthorityIntegrity(
  authority: InternalApplicabilityResolutionAuthorityRecord,
  applicabilityId: string
): boolean {
  return (
    authority.applicabilityId === applicabilityId &&
    authority.revision.applicabilityId === applicabilityId
  );
}

async function readCurrentApplicabilityResolutionAuthority(
  db: DatabaseClient,
  applicabilityId: string
): Promise<InternalApplicabilityResolutionAuthorityRecord | null> {
  return db.currentApplicabilityResolutionAuthority.findUnique({
    where: {
      applicabilityId,
    },
    select: applicabilityResolutionAuthoritySelect,
  });
}

export async function getCurrentApplicabilityResolutionAuthority(
  applicabilityId: string
): Promise<ApplicabilityResolutionAuthorityResult> {
  try {
    const authority =
      await readCurrentApplicabilityResolutionAuthority(
        prisma,
        applicabilityId
      );

    if (!authority) {
      return {
        success: false,
        reason: "CURRENT_AUTHORITY_NOT_FOUND",
        message:
          "No current applicability resolution authority exists for this applicability record.",
      };
    }

    if (
      !hasCurrentApplicabilityResolutionAuthorityIntegrity(
        authority,
        applicabilityId
      )
    ) {
      return {
        success: false,
        reason: "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
        message:
          "Current applicability resolution authority points to a revision outside its applicability record.",
      };
    }

    return {
      success: true,
      authority:
        toPublicApplicabilityResolutionAuthorityRecord(
          authority
        ),
    };
  } catch {
    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Current applicability resolution authority could not be read.",
    };
  }
}

export type EstablishInitialApplicabilityResolutionAuthorityInput = {
  organizationId: string;
  applicabilityId: string;
  revisionId: string;
  actorUserId: string;
  reason?: string | null;
};

class ApplicabilityResolutionAuthorityTransactionAbort extends Error {
  constructor(
    readonly reason:
      | "AUTHORITY_TRANSACTION_FAILED"
      | "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
    message: string
  ) {
    super(message);
    this.name =
      "ApplicabilityResolutionAuthorityTransactionAbort";
  }
}

export async function establishInitialApplicabilityResolutionAuthority(
  input: EstablishInitialApplicabilityResolutionAuthorityInput
): Promise<ApplicabilityResolutionAuthorityResult> {
  try {
    return await prisma.$transaction<ApplicabilityResolutionAuthorityResult>(
      async (
        transaction: Prisma.TransactionClient
      ): Promise<ApplicabilityResolutionAuthorityResult> => {
        const validation =
          await validateApplicabilityResolutionAuthorityContext(
            transaction,
            input
          );

        if (!validation.success) {
          return validation;
        }

        const current =
          await readCurrentApplicabilityResolutionAuthority(
            transaction,
            input.applicabilityId
          );

        if (
          current &&
          !hasCurrentApplicabilityResolutionAuthorityIntegrity(
            current,
            input.applicabilityId
          )
        ) {
          return {
            success: false,
            reason:
              "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
            message:
              "Existing current applicability resolution authority points to a revision outside its applicability record.",
          };
        }

        const policy =
          canEstablishApplicabilityResolutionAuthority(
            input.applicabilityId,
            validation.context.candidate,
            current
              ? {
                  revisionId: current.revisionId,
                }
              : null
          );

        if (!policy.success) {
          return {
            success: false,
            reason: policy.reason,
            message:
              policy.reason ===
              "REVISION_APPLICABILITY_MISMATCH"
                ? "Applicability revision does not belong to the supplied applicability record."
                : "Current applicability resolution authority already exists for this applicability record.",
          };
        }

        const authority =
          await transaction.currentApplicabilityResolutionAuthority.create({
            data: {
              applicabilityId: input.applicabilityId,
              revisionId: input.revisionId,
              establishedById: input.actorUserId,
              reason: input.reason ?? null,
            },
            select: applicabilityResolutionAuthoritySelect,
          });

        await transaction.applicabilityResolutionAuthorityTransition.create({
          data: {
            applicabilityId: input.applicabilityId,
            previousRevisionId: null,
            newRevisionId: input.revisionId,
            establishedById: input.actorUserId,
            reason: input.reason ?? null,
          },
        });

        const confirmed =
          await readCurrentApplicabilityResolutionAuthority(
            transaction,
            input.applicabilityId
          );

        if (
          !confirmed ||
          confirmed.id !== authority.id ||
          confirmed.revisionId !== input.revisionId
        ) {
          throw new ApplicabilityResolutionAuthorityTransactionAbort(
            "AUTHORITY_TRANSACTION_FAILED",
            "Initial applicability resolution authority could not be confirmed after persistence."
          );
        }

        if (
          !hasCurrentApplicabilityResolutionAuthorityIntegrity(
            confirmed,
            input.applicabilityId
          )
        ) {
          throw new ApplicabilityResolutionAuthorityTransactionAbort(
            "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
            "Persisted current applicability resolution authority does not belong to the expected applicability record."
          );
        }

        return {
          success: true,
          authority:
            toPublicApplicabilityResolutionAuthorityRecord(
              confirmed
            ),
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof
      ApplicabilityResolutionAuthorityTransactionAbort
    ) {
      return {
        success: false,
        reason: error.reason,
        message: error.message,
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" ||
        error.code === "P2002")
    ) {
      return {
        success: false,
        reason: "CONCURRENT_AUTHORITY_CONFLICT",
        message:
          "Initial applicability resolution authority conflicted with another concurrent transaction.",
      };
    }

    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Initial applicability resolution authority transaction failed.",
    };
  }
}

export type SupersedeApplicabilityResolutionAuthorityInput = {
  organizationId: string;
  applicabilityId: string;
  revisionId: string;
  actorUserId: string;
  reason?: string | null;
};

export async function supersedeApplicabilityResolutionAuthority(
  input: SupersedeApplicabilityResolutionAuthorityInput
): Promise<ApplicabilityResolutionAuthorityResult> {
  try {
    return await prisma.$transaction<ApplicabilityResolutionAuthorityResult>(
      async (
        transaction: Prisma.TransactionClient
      ): Promise<ApplicabilityResolutionAuthorityResult> => {
        const validation =
          await validateApplicabilityResolutionAuthorityContext(
            transaction,
            input
          );

        if (!validation.success) {
          return validation;
        }

        const current =
          await readCurrentApplicabilityResolutionAuthority(
            transaction,
            input.applicabilityId
          );

        if (
          current &&
          !hasCurrentApplicabilityResolutionAuthorityIntegrity(
            current,
            input.applicabilityId
          )
        ) {
          return {
            success: false,
            reason:
              "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
            message:
              "Existing current applicability resolution authority points to a revision outside its applicability record.",
          };
        }

        const snapshot: ApplicabilityResolutionAuthoritySnapshot =
          current
            ? {
                revisionId: current.revisionId,
              }
            : null;

        const policy =
          canSupersedeApplicabilityResolutionAuthority(
            input.applicabilityId,
            validation.context.candidate,
            snapshot
          );

        if (!policy.success) {
          switch (policy.reason) {
            case "REVISION_APPLICABILITY_MISMATCH":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Applicability revision does not belong to the supplied applicability record.",
              };

            case "CURRENT_AUTHORITY_NOT_FOUND":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "No current applicability resolution authority exists to supersede.",
              };

            case "SAME_REVISION_ALREADY_AUTHORITATIVE":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Applicability revision is already the current authority.",
              };

            default: {
              const exhaustiveCheck: never =
                policy.reason;

              throw new Error(
                `Unhandled applicability resolution supersession policy result: ${exhaustiveCheck}`
              );
            }
          }
        }

        if (!current) {
          return {
            success: false,
            reason: "CURRENT_AUTHORITY_NOT_FOUND",
            message:
              "No current applicability resolution authority exists to supersede.",
          };
        }

        const update =
          await transaction.currentApplicabilityResolutionAuthority.updateMany({
            where: {
              applicabilityId: input.applicabilityId,
              revisionId: current.revisionId,
            },
            data: {
              revisionId: input.revisionId,
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
              "Current applicability resolution authority changed before supersession could be committed.",
          };
        }

        await transaction.applicabilityResolutionAuthorityTransition.create({
          data: {
            applicabilityId: input.applicabilityId,
            previousRevisionId: current.revisionId,
            newRevisionId: input.revisionId,
            establishedById: input.actorUserId,
            reason: input.reason ?? null,
          },
        });

        const confirmed =
          await readCurrentApplicabilityResolutionAuthority(
            transaction,
            input.applicabilityId
          );

        if (
          !confirmed ||
          confirmed.revisionId !== input.revisionId
        ) {
          throw new ApplicabilityResolutionAuthorityTransactionAbort(
            "AUTHORITY_TRANSACTION_FAILED",
            "Superseded applicability resolution authority could not be confirmed after persistence."
          );
        }

        if (
          !hasCurrentApplicabilityResolutionAuthorityIntegrity(
            confirmed,
            input.applicabilityId
          )
        ) {
          throw new ApplicabilityResolutionAuthorityTransactionAbort(
            "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
            "Persisted current applicability resolution authority does not belong to the expected applicability record."
          );
        }

        return {
          success: true,
          authority:
            toPublicApplicabilityResolutionAuthorityRecord(
              confirmed
            ),
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof
      ApplicabilityResolutionAuthorityTransactionAbort
    ) {
      return {
        success: false,
        reason: error.reason,
        message: error.message,
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" ||
        error.code === "P2002")
    ) {
      return {
        success: false,
        reason: "CONCURRENT_AUTHORITY_CONFLICT",
        message:
          "Applicability resolution authority supersession conflicted with another concurrent transaction.",
      };
    }

    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Applicability resolution authority supersession transaction failed.",
    };
  }
}
