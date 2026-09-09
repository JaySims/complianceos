import {
  ApplicabilityContextType,
  ApplicabilityDefinitionStatus,
  ApplicabilityResolutionPattern,
  ApplicabilityReviewState,
  ApplicabilityStatus,
  AssessmentStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/*
 * ============================================================
 * COMPLIANCEOS — ASSESSMENT LIFECYCLE SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Establish the controlled lifecycle for framework-specific
 * compliance assessments.
 *
 * An Assessment represents an Organization's evaluation against
 * one Compliance Framework.
 *
 * IMPORTANT DOMAIN RULES
 *
 * Assessment lifecycle status is NOT compliance status.
 *
 * COMPLETED means the assessment review lifecycle has concluded.
 * It does NOT mean:
 *
 * - the Organization is fully compliant;
 * - the Assessment score is 100%;
 * - all Requirements are VERIFIED;
 * - workflow completion proves compliance.
 *
 * Compliance truth remains derived from verified Evidence through
 * the locked evidence-driven Compliance Engine.
 *
 * AUTHORITY MODEL
 *
 * organizationId supplied to this service must already come from
 * the ComplianceOS organization authorization boundary.
 *
 * The service independently validates:
 *
 * - Framework existence;
 * - User existence;
 * - active Organization membership;
 * - Assessment tenant ownership before lifecycle mutation.
 *
 * CURRENT SCOPE
 *
 * This service manages:
 *
 * - Assessment creation;
 * - Assessment lifecycle transitions.
 *
 * This service does NOT update:
 *
 * - Assessment.score;
 * - Organization.complianceScore;
 * - Organization.trustScore;
 * - Evidence verification state;
 * - Workflow progress;
 * - Executive AI state.
 *
 * ============================================================
 */

export type AssessmentLifecycleFailureReason =
  | "FRAMEWORK_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
  | "ASSESSMENT_NOT_FOUND"
  | "ASSESSMENT_ACCESS_DENIED"
  | "INVALID_STATUS_TRANSITION"
  | "ASSESSMENT_STATUS_CHANGED"
  | "ASSESSMENT_COMPLETION_SCOPE_INCOMPLETE"
  | "ASSESSMENT_COMPLETION_DEFINITION_AUTHORITY_MISSING"
  | "ASSESSMENT_COMPLETION_DEFINITION_AUTHORITY_INTEGRITY_VIOLATION"
  | "ASSESSMENT_COMPLETION_RESOLUTION_STALE"
  | "ASSESSMENT_COMPLETION_AUTHORITY_MISSING"
  | "ASSESSMENT_COMPLETION_AUTHORITY_INTEGRITY_VIOLATION"
  | "ASSESSMENT_COMPLETION_REVIEW_REQUIRED"
  | "ASSESSMENT_COMPLETION_TRANSACTION_FAILED";

export type AssessmentLifecycleRecord = {
  id: string;
  title: string;
  score: number | null;
  status: AssessmentStatus;
  organizationId: string;
  frameworkId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AssessmentLifecycleSuccess = {
  success: true;
  assessment: AssessmentLifecycleRecord;
};

export type AssessmentLifecycleFailure = {
  success: false;
  reason: AssessmentLifecycleFailureReason;
  message: string;
};

export type AssessmentLifecycleResult =
  | AssessmentLifecycleSuccess
  | AssessmentLifecycleFailure;

export type CreateAssessmentInput = {
  organizationId: string;
  frameworkId: string;
  userId: string;
  title: string;
};

/*
 * ============================================================
 * STATUS TRANSITION POLICY
 * ============================================================
 *
 * Allowed:
 *
 * DRAFT
 *   → IN_PROGRESS
 *
 * IN_PROGRESS
 *   → REVIEW
 *
 * REVIEW
 *   → COMPLETED
 *
 * COMPLETED is terminal in the current lifecycle model.
 *
 * Reassessment should eventually create a new Assessment rather
 * than reopening historical completed assessments.
 * ============================================================
 */

const ALLOWED_STATUS_TRANSITIONS:
  Readonly<
    Record<
      AssessmentStatus,
      readonly AssessmentStatus[]
    >
  > = {
    [AssessmentStatus.DRAFT]: [
      AssessmentStatus.IN_PROGRESS,
    ],

    [AssessmentStatus.IN_PROGRESS]: [
      AssessmentStatus.REVIEW,
    ],

    [AssessmentStatus.REVIEW]: [
      AssessmentStatus.COMPLETED,
    ],

    [AssessmentStatus.COMPLETED]: [],
  };

/*
 * ============================================================
 * CAN TRANSITION ASSESSMENT STATUS
 * ============================================================
 *
 * Pure lifecycle policy helper.
 *
 * Exported so the transition rules can be tested independently
 * from Prisma/database behavior.
 * ============================================================
 */

export function canTransitionAssessmentStatus(
  currentStatus: AssessmentStatus,
  nextStatus: AssessmentStatus
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[
    currentStatus
  ].includes(
    nextStatus
  );
}

/*
 * ============================================================
 * NORMALIZE ASSESSMENT TITLE
 * ============================================================
 */

function normalizeAssessmentTitle(
  title: string
): string {
  const normalized =
    title.trim();

  if (normalized.length > 0) {
    return normalized;
  }

  return "Compliance Assessment";
}

/*
 * ============================================================
 * CREATE ASSESSMENT
 * ============================================================
 *
 * Every newly created Assessment begins:
 *
 * status = DRAFT
 * score  = null
 *
 * Callers cannot manufacture lifecycle progress or compliance
 * score during creation.
 * ============================================================
 */

export async function createAssessment(
  input: CreateAssessmentInput
): Promise<AssessmentLifecycleResult> {
  /*
   * ----------------------------------------------------------
   * 1. Prove Framework existence.
   * ----------------------------------------------------------
   */

  const framework =
    await prisma.framework.findUnique({
      where: {
        id: input.frameworkId,
      },

      select: {
        id: true,
      },
    });

  if (!framework) {
    return {
      success: false,
      reason: "FRAMEWORK_NOT_FOUND",
      message:
        "Compliance framework not found.",
    };
  }

  /*
   * ----------------------------------------------------------
   * 2. Prove User existence.
   * ----------------------------------------------------------
   */

  const user =
    await prisma.user.findUnique({
      where: {
        id: input.userId,
      },

      select: {
        id: true,
      },
    });

  if (!user) {
    return {
      success: false,
      reason: "USER_NOT_FOUND",
      message:
        "Assessment user not found.",
    };
  }

  /*
   * ----------------------------------------------------------
   * 3. Prove active Organization membership.
   *
   * The organizationId is expected to originate from the
   * authorization boundary, but lifecycle writes still verify
   * that the initiating User currently belongs to that tenant.
   * ----------------------------------------------------------
   */

  const membership =
    await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId:
            input.userId,

          organizationId:
            input.organizationId,
        },
      },

      select: {
        active: true,
      },
    });

  if (
    !membership ||
    !membership.active
  ) {
    return {
      success: false,

      reason:
        "USER_NOT_ACTIVE_ORGANIZATION_MEMBER",

      message:
        "Assessment user is not an active member of the authorized organisation.",
    };
  }

  /*
   * ----------------------------------------------------------
   * 4. Create Assessment in deterministic initial state.
   * ----------------------------------------------------------
   */

  const assessment =
    await prisma.assessment.create({
      data: {
        title:
          normalizeAssessmentTitle(
            input.title
          ),

        score: null,

        status:
          AssessmentStatus.DRAFT,

        organizationId:
          input.organizationId,

        frameworkId:
          framework.id,

        userId:
          user.id,
      },

      select: {
        id: true,
        title: true,
        score: true,
        status: true,
        organizationId: true,
        frameworkId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  return {
    success: true,
    assessment,
  };
}

class AssessmentCompletionInvariantError extends Error {
  constructor(
    readonly reason: AssessmentLifecycleFailureReason,
    message: string
  ) {
    super(message);
    this.name = "AssessmentCompletionInvariantError";
  }
}

async function assertAssessmentCompletionIntegrity(
  transaction: Prisma.TransactionClient,
  assessment: {
    id: string;
    organizationId: string;
    frameworkId: string;
  }
): Promise<void> {
  /*
   * Completion validates explicit persisted regulatory scope.
   *
   * V1 does not manufacture EVENT / MATTER / ACTIVITY /
   * RELATIONSHIP / TRANSFER / SYSTEM / AUTOMATED_DECISION
   * contexts that ComplianceOS has never observed.
   *
   * Every active framework requirement must nevertheless have:
   *
   * - explicit current ApplicabilityDefinition authority;
   * - at least one explicit persisted applicability identity.
   *
   * GENERAL_UNCONDITIONAL requirements additionally require the
   * canonical ORGANIZATION context.
   */

  const activeRequirements =
    await transaction.complianceRequirement.findMany({
      where: {
        frameworkId: assessment.frameworkId,
        active: true,
      },

      select: {
        id: true,

        currentApplicabilityAuthority: {
          select: {
            requirementId: true,
            applicabilityDefinitionId: true,

            applicabilityDefinition: {
              select: {
                id: true,
                requirementId: true,
                status: true,
                resolutionPattern: true,
              },
            },
          },
        },
      },

      orderBy: {
        id: "asc",
      },
    });

  const applicability =
    await transaction.assessmentRequirementApplicability.findMany({
      where: {
        assessmentId: assessment.id,
      },

      select: {
        id: true,
        assessmentId: true,
        requirementId: true,
        contextId: true,

        requirement: {
          select: {
            frameworkId: true,
          },
        },

        context: {
          select: {
            organizationId: true,
            frameworkId: true,
            contextType: true,
            stableContextKey: true,
          },
        },

        currentAuthority: {
          select: {
            applicabilityId: true,
            revisionId: true,

            revision: {
              select: {
                id: true,
                applicabilityId: true,
                applicabilityDefinitionId: true,
                status: true,
                reviewState: true,
              },
            },
          },
        },
      },

      orderBy: {
        id: "asc",
      },
    });

  const applicabilityByRequirement =
    new Map<
      string,
      typeof applicability
    >();

  for (const item of applicability) {
    const existing =
      applicabilityByRequirement.get(
        item.requirementId
      );

    if (existing) {
      existing.push(item);
    } else {
      applicabilityByRequirement.set(
        item.requirementId,
        [item]
      );
    }
  }

  const authoritativeDefinitionByRequirement =
    new Map<string, string>();

  for (const requirement of activeRequirements) {
    const definitionAuthority =
      requirement.currentApplicabilityAuthority;

    if (!definitionAuthority) {
      throw new AssessmentCompletionInvariantError(
        "ASSESSMENT_COMPLETION_DEFINITION_AUTHORITY_MISSING",
        "Assessment cannot be completed because an active framework requirement has no explicit current applicability-definition authority."
      );
    }

    if (
      definitionAuthority.requirementId !==
        requirement.id ||
      definitionAuthority
        .applicabilityDefinition
        .id !==
        definitionAuthority
          .applicabilityDefinitionId ||
      definitionAuthority
        .applicabilityDefinition
        .requirementId !==
        requirement.id ||
      definitionAuthority
        .applicabilityDefinition
        .status !==
        ApplicabilityDefinitionStatus.APPROVED
    ) {
      throw new AssessmentCompletionInvariantError(
        "ASSESSMENT_COMPLETION_DEFINITION_AUTHORITY_INTEGRITY_VIOLATION",
        "Current applicability-definition authority does not belong to the exact active requirement or does not point to an approved definition."
      );
    }

    authoritativeDefinitionByRequirement.set(
      requirement.id,
      definitionAuthority.applicabilityDefinitionId
    );

    const requirementApplicability =
      applicabilityByRequirement.get(
        requirement.id
      ) ?? [];

    /*
     * Missing rows never mean implicitly APPLICABLE or
     * NOT_APPLICABLE.
     */
    if (
      requirementApplicability.length === 0
    ) {
      throw new AssessmentCompletionInvariantError(
        "ASSESSMENT_COMPLETION_SCOPE_INCOMPLETE",
        "Assessment cannot be completed because an active framework requirement has no explicit persisted applicability determination."
      );
    }

    /*
     * Canonical organization-wide requirements must use the
     * explicit ORGANIZATION context.
     *
     * Other resolution patterns may legitimately use one or more
     * contextual identities; V1 validates materialized identities
     * without inventing unobserved contexts.
     */
    if (
      definitionAuthority
        .applicabilityDefinition
        .resolutionPattern ===
      ApplicabilityResolutionPattern
        .GENERAL_UNCONDITIONAL
    ) {
      const hasCanonicalOrganizationContext =
        requirementApplicability.some(
          (item) =>
            item.context.contextType ===
              ApplicabilityContextType.ORGANIZATION &&
            item.context.stableContextKey ===
              "ORGANIZATION" &&
            item.context.organizationId ===
              assessment.organizationId &&
            item.context.frameworkId ===
              assessment.frameworkId
        );

      if (!hasCanonicalOrganizationContext) {
        throw new AssessmentCompletionInvariantError(
          "ASSESSMENT_COMPLETION_SCOPE_INCOMPLETE",
          "Assessment cannot be completed because a GENERAL_UNCONDITIONAL requirement lacks its canonical ORGANIZATION-context applicability determination."
        );
      }
    }
  }

  /*
   * Every materialized applicability identity must remain inside
   * the assessment domain and possess an explicit trustworthy
   * current resolution authority.
   */
  for (const item of applicability) {
    if (
      item.assessmentId !== assessment.id ||
      item.requirement.frameworkId !==
        assessment.frameworkId ||
      item.context.organizationId !==
        assessment.organizationId ||
      item.context.frameworkId !==
        assessment.frameworkId
    ) {
      throw new AssessmentCompletionInvariantError(
        "ASSESSMENT_COMPLETION_AUTHORITY_INTEGRITY_VIOLATION",
        "Assessment applicability scope crosses the authorized assessment organization or framework domain."
      );
    }

    const authority = item.currentAuthority;

    if (!authority) {
      throw new AssessmentCompletionInvariantError(
        "ASSESSMENT_COMPLETION_AUTHORITY_MISSING",
        "Assessment cannot be completed because an applicability determination has no explicit current resolution authority."
      );
    }

    if (
      authority.applicabilityId !== item.id ||
      authority.revisionId !==
        authority.revision.id ||
      authority.revision.applicabilityId !==
        item.id
    ) {
      throw new AssessmentCompletionInvariantError(
        "ASSESSMENT_COMPLETION_AUTHORITY_INTEGRITY_VIOLATION",
        "Current applicability resolution authority does not belong to the exact applicability identity being completed."
      );
    }

    const authoritativeDefinitionId =
      authoritativeDefinitionByRequirement.get(
        item.requirementId
      );

    if (!authoritativeDefinitionId) {
      throw new AssessmentCompletionInvariantError(
        "ASSESSMENT_COMPLETION_DEFINITION_AUTHORITY_INTEGRITY_VIOLATION",
        "Assessment applicability references a requirement outside the validated active current-definition authority set."
      );
    }

    if (
      authority.revision
        .applicabilityDefinitionId !==
      authoritativeDefinitionId
    ) {
      throw new AssessmentCompletionInvariantError(
        "ASSESSMENT_COMPLETION_RESOLUTION_STALE",
        "Assessment cannot be completed because a current applicability resolution was produced from a definition that is no longer authoritative for its requirement."
      );
    }

    if (
      authority.revision.status !==
        ApplicabilityStatus.APPLICABLE &&
      authority.revision.status !==
        ApplicabilityStatus.NOT_APPLICABLE &&
      authority.revision.status !==
        ApplicabilityStatus.UNDETERMINED
    ) {
      throw new AssessmentCompletionInvariantError(
        "ASSESSMENT_COMPLETION_AUTHORITY_INTEGRITY_VIOLATION",
        "Current applicability resolution authority contains an unsupported applicability status."
      );
    }

    if (
      authority.revision.reviewState ===
      ApplicabilityReviewState.REQUIRED
    ) {
      throw new AssessmentCompletionInvariantError(
        "ASSESSMENT_COMPLETION_REVIEW_REQUIRED",
        "Assessment cannot be completed while a current applicability resolution still requires regulatory review."
      );
    }
  }
}

/*
 * ============================================================
 * TRANSITION ASSESSMENT STATUS
 * ============================================================
 *
 * Lifecycle mutation is tenant-scoped and protected by an
 * optimistic concurrency predicate.
 *
 * The status observed and validated by this service must still
 * be the current database status when the mutation executes.
 *
 * A concurrent lifecycle mutation therefore cannot silently
 * overwrite a transition based on stale state.
 * ============================================================
 */

export async function transitionAssessmentStatus(
  organizationId: string,
  assessmentId: string,
  nextStatus: AssessmentStatus
): Promise<AssessmentLifecycleResult> {
  try {
    return await prisma.$transaction<AssessmentLifecycleResult>(
      async (
        transaction: Prisma.TransactionClient
      ): Promise<AssessmentLifecycleResult> => {
        const assessment =
          await transaction.assessment.findUnique({
            where: {
              id: assessmentId,
            },

            select: {
              id: true,
              status: true,
              organizationId: true,
              frameworkId: true,
            },
          });

        if (!assessment) {
          return {
            success: false,
            reason: "ASSESSMENT_NOT_FOUND",
            message:
              "Compliance assessment not found.",
          };
        }

        if (
          assessment.organizationId !==
          organizationId
        ) {
          return {
            success: false,
            reason:
              "ASSESSMENT_ACCESS_DENIED",
            message:
              "Compliance assessment does not belong to the authorized organisation.",
          };
        }

        if (
          !canTransitionAssessmentStatus(
            assessment.status,
            nextStatus
          )
        ) {
          return {
            success: false,
            reason:
              "INVALID_STATUS_TRANSITION",
            message:
              `Assessment cannot transition from ${assessment.status} to ${nextStatus}.`,
          };
        }

        /*
         * Completion is a regulatory closure boundary.
         *
         * Ordinary DRAFT -> IN_PROGRESS and IN_PROGRESS -> REVIEW
         * transitions do not require applicability closure.
         */
        if (
          assessment.status ===
            AssessmentStatus.REVIEW &&
          nextStatus ===
            AssessmentStatus.COMPLETED
        ) {
          await assertAssessmentCompletionIntegrity(
            transaction,
            assessment
          );
        }

        const update =
          await transaction.assessment.updateMany({
            where: {
              id: assessment.id,
              organizationId,
              status: assessment.status,
            },

            data: {
              status: nextStatus,
            },
          });

        if (update.count !== 1) {
          throw new AssessmentCompletionInvariantError(
            "ASSESSMENT_STATUS_CHANGED",
            "Assessment lifecycle state changed before the requested transition could be applied."
          );
        }

        const updated =
          await transaction.assessment.findFirst({
            where: {
              id: assessment.id,
              organizationId,
              status: nextStatus,
            },

            select: {
              id: true,
              title: true,
              score: true,
              status: true,
              organizationId: true,
              frameworkId: true,
              userId: true,
              createdAt: true,
              updatedAt: true,
            },
          });

        /*
         * This confirmation occurs after mutation, therefore
         * failure MUST throw so Prisma aborts the transaction.
         */
        if (!updated) {
          throw new AssessmentCompletionInvariantError(
            "ASSESSMENT_STATUS_CHANGED",
            "Assessment lifecycle state changed before the completed transition could be confirmed."
          );
        }

        return {
          success: true,
          assessment: updated,
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
      AssessmentCompletionInvariantError
    ) {
      return {
        success: false,
        reason: error.reason,
        message: error.message,
      };
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" ||
        error.code === "P2002")
    ) {
      return {
        success: false,
        reason: "ASSESSMENT_STATUS_CHANGED",
        message:
          "Assessment lifecycle state changed concurrently.",
      };
    }

    return {
      success: false,
      reason:
        "ASSESSMENT_COMPLETION_TRANSACTION_FAILED",
      message:
        "Assessment lifecycle transition could not be completed safely.",
    };
  }
}
