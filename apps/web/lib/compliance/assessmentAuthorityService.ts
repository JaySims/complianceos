import {
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/*
 * ============================================================
 * COMPLIANCEOS — CURRENT ASSESSMENT AUTHORITY SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Determine which Assessment currently represents an
 * Organization's authoritative compliance position for one
 * Framework.
 *
 * AUTHORITY IS NOT LIFECYCLE
 *
 * Assessment.status describes lifecycle state:
 *
 * DRAFT
 *   ↓
 * IN_PROGRESS
 *   ↓
 * REVIEW
 *   ↓
 * COMPLETED
 *
 * CurrentAssessmentAuthority describes something different:
 *
 * Organization + Framework
 *   ↓
 * exactly zero or one current authoritative Assessment
 *
 * A COMPLETED Assessment may remain authoritative while a new
 * reassessment is being prepared.
 *
 * Creating a new Assessment does NOT automatically replace
 * current authority.
 *
 * DATABASE INVARIANTS
 *
 * The database guarantees:
 *
 * - at most one authority row per Organization + Framework;
 * - one Assessment cannot occupy multiple authority positions;
 * - an authoritative Assessment cannot be deleted while its
 *   authority row exists.
 *
 * SERVICE INVARIANTS
 *
 * This service additionally proves:
 *
 * - the Assessment belongs to the authorized Organization;
 * - the Assessment belongs to the requested Framework;
 * - authority cannot be established when authority already
 *   exists;
 * - supersession requires an existing authority;
 * - replacement Assessment belongs to the same Organization;
 * - replacement Assessment belongs to the same Framework;
 * - supersession cannot silently replace authority based on
 *   stale state.
 *
 * CURRENT SCOPE
 *
 * This service updates ONLY:
 *
 * - CurrentAssessmentAuthority
 *
 * This service does NOT update:
 *
 * - Assessment.status;
 * - Assessment.score;
 * - Organization.complianceScore;
 * - Organization.trustScore;
 * - Evidence;
 * - Documents;
 * - Workflow progress;
 * - Executive AI state.
 *
 * ============================================================
 */

export type AssessmentAuthorityFailureReason =
  | "ASSESSMENT_NOT_FOUND"
  | "ASSESSMENT_ACCESS_DENIED"
  | "ASSESSMENT_FRAMEWORK_MISMATCH"
  | "CURRENT_AUTHORITY_NOT_FOUND"
  | "CURRENT_AUTHORITY_ALREADY_EXISTS"
  | "ASSESSMENT_ALREADY_AUTHORITATIVE"
  | "AUTHORITY_CHANGED_DURING_SUPERSESSION"
  | "AUTHORITY_TRANSACTION_FAILED";

export type AssessmentAuthorityRecord = {
  id: string;
  organizationId: string;
  frameworkId: string;
  assessmentId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AssessmentAuthoritySuccess = {
  success: true;
  authority: AssessmentAuthorityRecord;
};

export type AssessmentAuthorityFailure = {
  success: false;
  reason: AssessmentAuthorityFailureReason;
  message: string;
};

export type AssessmentAuthorityResult =
  | AssessmentAuthoritySuccess
  | AssessmentAuthorityFailure;

export type ReadAssessmentAuthorityResult =
  | AssessmentAuthoritySuccess
  | {
      success: false;
      reason: "CURRENT_AUTHORITY_NOT_FOUND";
      message: string;
    };

/*
 * ============================================================
 * PURE AUTHORITY POLICY
 * ============================================================
 */

export type AssessmentAuthorityCandidate = {
  id: string;
  organizationId: string;
  frameworkId: string;
};

export type AssessmentAuthoritySnapshot = {
  organizationId: string;
  frameworkId: string;
  assessmentId: string;
};

export type EstablishAssessmentAuthorityFailureReason =
  | "ASSESSMENT_ACCESS_DENIED"
  | "ASSESSMENT_FRAMEWORK_MISMATCH"
  | "CURRENT_AUTHORITY_ALREADY_EXISTS"
  | "ASSESSMENT_ALREADY_AUTHORITATIVE";

export type SupersedeAssessmentAuthorityFailureReason =
  | "ASSESSMENT_ACCESS_DENIED"
  | "ASSESSMENT_FRAMEWORK_MISMATCH"
  | "CURRENT_AUTHORITY_NOT_FOUND"
  | "ASSESSMENT_ALREADY_AUTHORITATIVE";

export type EstablishAssessmentAuthorityPolicyResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason: EstablishAssessmentAuthorityFailureReason;
    };

export type SupersedeAssessmentAuthorityPolicyResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason: SupersedeAssessmentAuthorityFailureReason;
    };

export function canEstablishAssessmentAuthority(
  organizationId: string,
  frameworkId: string,
  assessment: AssessmentAuthorityCandidate,
  currentAuthority: AssessmentAuthoritySnapshot | null
): EstablishAssessmentAuthorityPolicyResult {
  if (assessment.organizationId !== organizationId) {
    return {
      success: false,
      reason: "ASSESSMENT_ACCESS_DENIED",
    };
  }

  if (assessment.frameworkId !== frameworkId) {
    return {
      success: false,
      reason: "ASSESSMENT_FRAMEWORK_MISMATCH",
    };
  }

  if (currentAuthority !== null) {
    if (
      currentAuthority.organizationId === organizationId &&
      currentAuthority.frameworkId === frameworkId &&
      currentAuthority.assessmentId === assessment.id
    ) {
      return {
        success: false,
        reason: "ASSESSMENT_ALREADY_AUTHORITATIVE",
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

export function canSupersedeAssessmentAuthority(
  organizationId: string,
  frameworkId: string,
  replacementAssessment: AssessmentAuthorityCandidate,
  currentAuthority: AssessmentAuthoritySnapshot | null
): SupersedeAssessmentAuthorityPolicyResult {
  if (replacementAssessment.organizationId !== organizationId) {
    return {
      success: false,
      reason: "ASSESSMENT_ACCESS_DENIED",
    };
  }

  if (replacementAssessment.frameworkId !== frameworkId) {
    return {
      success: false,
      reason: "ASSESSMENT_FRAMEWORK_MISMATCH",
    };
  }

  if (currentAuthority === null) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_NOT_FOUND",
    };
  }

  if (
    currentAuthority.organizationId !== organizationId ||
    currentAuthority.frameworkId !== frameworkId
  ) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_NOT_FOUND",
    };
  }

  if (currentAuthority.assessmentId === replacementAssessment.id) {
    return {
      success: false,
      reason: "ASSESSMENT_ALREADY_AUTHORITATIVE",
    };
  }

  return {
    success: true,
  };
}

/*
 * ============================================================
 * INTERNAL TRANSACTION INVARIANT ERROR
 * ============================================================
 */

class AssessmentAuthorityInvariantError extends Error {
  constructor(
    public readonly reason:
      | "AUTHORITY_CHANGED_DURING_SUPERSESSION"
      | "AUTHORITY_TRANSACTION_FAILED",
    message: string
  ) {
    super(message);
    this.name = "AssessmentAuthorityInvariantError";
  }
}

/*
 * ============================================================
 * INTERNAL HELPERS
 * ============================================================
 */

const authoritySelect = {
  id: true,
  organizationId: true,
  frameworkId: true,
  assessmentId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CurrentAssessmentAuthoritySelect;

async function findAssessmentCandidate(
  database: Prisma.TransactionClient | typeof prisma,
  assessmentId: string
): Promise<AssessmentAuthorityCandidate | null> {
  return database.assessment.findUnique({
    where: {
      id: assessmentId,
    },
    select: {
      id: true,
      organizationId: true,
      frameworkId: true,
    },
  });
}

/*
 * ============================================================
 * READ CURRENT AUTHORITY
 * ============================================================
 */

export async function getCurrentAssessmentAuthority(
  organizationId: string,
  frameworkId: string
): Promise<ReadAssessmentAuthorityResult> {
  const authority =
    await prisma.currentAssessmentAuthority.findUnique({
      where: {
        organizationId_frameworkId: {
          organizationId,
          frameworkId,
        },
      },
      select: authoritySelect,
    });

  if (!authority) {
    return {
      success: false,
      reason: "CURRENT_AUTHORITY_NOT_FOUND",
      message:
        "No current authoritative compliance assessment exists for this organisation and framework.",
    };
  }

  return {
    success: true,
    authority,
  };
}

/*
 * ============================================================
 * ESTABLISH INITIAL AUTHORITY
 * ============================================================
 *
 * Establishes authority only when Organization + Framework has
 * no current authority.
 *
 * This operation does NOT supersede existing authority.
 *
 * SERIALIZABLE isolation plus database uniqueness prevents
 * multiple committed authority rows for the same tuple.
 * ============================================================
 */

export async function establishInitialAssessmentAuthority(
  organizationId: string,
  frameworkId: string,
  assessmentId: string
): Promise<AssessmentAuthorityResult> {
  try {
    return await prisma.$transaction<AssessmentAuthorityResult>(
      async (
        transaction: Prisma.TransactionClient
      ): Promise<AssessmentAuthorityResult> => {
        const assessment =
          await findAssessmentCandidate(
            transaction,
            assessmentId
          );

        if (!assessment) {
          return {
            success: false,
            reason: "ASSESSMENT_NOT_FOUND",
            message:
              "Compliance assessment not found.",
          };
        }

        const currentAuthority =
          await transaction.currentAssessmentAuthority.findUnique({
            where: {
              organizationId_frameworkId: {
                organizationId,
                frameworkId,
              },
            },
            select: {
              organizationId: true,
              frameworkId: true,
              assessmentId: true,
            },
          });

        const policy =
          canEstablishAssessmentAuthority(
            organizationId,
            frameworkId,
            assessment,
            currentAuthority
          );

        if (!policy.success) {
          switch (policy.reason) {
            case "ASSESSMENT_ACCESS_DENIED":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Compliance assessment does not belong to the authorized organisation.",
              };

            case "ASSESSMENT_FRAMEWORK_MISMATCH":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Compliance assessment does not belong to the requested framework.",
              };

            case "ASSESSMENT_ALREADY_AUTHORITATIVE":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Compliance assessment is already authoritative for this organisation and framework.",
              };

            case "CURRENT_AUTHORITY_ALREADY_EXISTS":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "A current authoritative assessment already exists for this organisation and framework.",
              };

            default: {
              const exhaustiveCheck: never =
                policy.reason;

              throw new AssessmentAuthorityInvariantError(
                "AUTHORITY_TRANSACTION_FAILED",
                `Unhandled authority policy result: ${exhaustiveCheck}`
              );
            }
          }
        }

        const authority =
          await transaction.currentAssessmentAuthority.create({
            data: {
              organizationId,
              frameworkId,
              assessmentId: assessment.id,
            },
            select: authoritySelect,
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
      error instanceof AssessmentAuthorityInvariantError
    ) {
      return {
        success: false,
        reason: error.reason,
        message: error.message,
      };
    }

    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Current assessment authority could not be established safely.",
    };
  }
}

/*
 * ============================================================
 * SUPERSEDE CURRENT AUTHORITY
 * ============================================================
 *
 * Atomically moves authority from the observed current
 * Assessment to a replacement Assessment.
 *
 * Replacement must belong to the exact same Organization and
 * Framework.
 *
 * The mutation predicate contains the previously observed
 * assessmentId. Concurrent authority movement therefore cannot
 * silently overwrite newer authority.
 *
 * Historical Assessments are never deleted or modified.
 * ============================================================
 */

export async function supersedeAssessmentAuthority(
  organizationId: string,
  frameworkId: string,
  replacementAssessmentId: string
): Promise<AssessmentAuthorityResult> {
  try {
    return await prisma.$transaction<AssessmentAuthorityResult>(
      async (
        transaction: Prisma.TransactionClient
      ): Promise<AssessmentAuthorityResult> => {
        const replacementAssessment =
          await findAssessmentCandidate(
            transaction,
            replacementAssessmentId
          );

        if (!replacementAssessment) {
          return {
            success: false,
            reason: "ASSESSMENT_NOT_FOUND",
            message:
              "Replacement compliance assessment not found.",
          };
        }

        const currentAuthority =
          await transaction.currentAssessmentAuthority.findUnique({
            where: {
              organizationId_frameworkId: {
                organizationId,
                frameworkId,
              },
            },
            select: {
              organizationId: true,
              frameworkId: true,
              assessmentId: true,
            },
          });

        const policy =
          canSupersedeAssessmentAuthority(
            organizationId,
            frameworkId,
            replacementAssessment,
            currentAuthority
          );

        if (!policy.success) {
          switch (policy.reason) {
            case "ASSESSMENT_ACCESS_DENIED":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Replacement compliance assessment does not belong to the authorized organisation.",
              };

            case "ASSESSMENT_FRAMEWORK_MISMATCH":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Replacement compliance assessment does not belong to the requested framework.",
              };

            case "CURRENT_AUTHORITY_NOT_FOUND":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "No current authoritative assessment exists to supersede for this organisation and framework.",
              };

            case "ASSESSMENT_ALREADY_AUTHORITATIVE":
              return {
                success: false,
                reason: policy.reason,
                message:
                  "Replacement compliance assessment is already authoritative for this organisation and framework.",
              };

            default: {
              const exhaustiveCheck: never =
                policy.reason;

              throw new AssessmentAuthorityInvariantError(
                "AUTHORITY_TRANSACTION_FAILED",
                `Unhandled authority policy result: ${exhaustiveCheck}`
              );
            }
          }
        }

        if (!currentAuthority) {
          throw new AssessmentAuthorityInvariantError(
            "AUTHORITY_CHANGED_DURING_SUPERSESSION",
            "Current assessment authority disappeared before supersession could be applied."
          );
        }

        const update =
          await transaction.currentAssessmentAuthority.updateMany({
            where: {
              organizationId,
              frameworkId,
              assessmentId:
                currentAuthority.assessmentId,
            },
            data: {
              assessmentId:
                replacementAssessment.id,
            },
          });

        if (update.count !== 1) {
          throw new AssessmentAuthorityInvariantError(
            "AUTHORITY_CHANGED_DURING_SUPERSESSION",
            "Current assessment authority changed before supersession could be applied."
          );
        }

        const authority =
          await transaction.currentAssessmentAuthority.findUnique({
            where: {
              organizationId_frameworkId: {
                organizationId,
                frameworkId,
              },
            },
            select: authoritySelect,
          });

        if (
          !authority ||
          authority.assessmentId !==
            replacementAssessment.id
        ) {
          throw new AssessmentAuthorityInvariantError(
            "AUTHORITY_CHANGED_DURING_SUPERSESSION",
            "Superseded assessment authority could not be confirmed."
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
      error instanceof AssessmentAuthorityInvariantError
    ) {
      return {
        success: false,
        reason: error.reason,
        message: error.message,
      };
    }

    return {
      success: false,
      reason: "AUTHORITY_TRANSACTION_FAILED",
      message:
        "Current assessment authority could not be superseded safely.",
    };
  }
}
