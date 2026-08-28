import {
  AssessmentStatus,
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
  | "ASSESSMENT_STATUS_CHANGED";

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
  /*
   * ----------------------------------------------------------
   * 1. Locate Assessment.
   * ----------------------------------------------------------
   */

  const assessment =
    await prisma.assessment.findUnique({
      where: {
        id: assessmentId,
      },

      select: {
        id: true,
        status: true,
        organizationId: true,
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

  /*
   * ----------------------------------------------------------
   * 2. Enforce tenant ownership.
   * ----------------------------------------------------------
   */

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

  /*
   * ----------------------------------------------------------
   * 3. Enforce lifecycle policy against observed state.
   * ----------------------------------------------------------
   */

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
   * ----------------------------------------------------------
   * 4. Persist using an atomic optimistic concurrency predicate.
   *
   * The update requires:
   *
   * - Assessment identity;
   * - authorized Organization;
   * - the exact status validated above.
   *
   * If another request changes the lifecycle state after our
   * read, this update affects zero rows instead of overwriting
   * newer state.
   * ----------------------------------------------------------
   */

  const update =
    await prisma.assessment.updateMany({
      where: {
        id:
          assessment.id,

        organizationId,

        status:
          assessment.status,
      },

      data: {
        status:
          nextStatus,
      },
    });

  if (update.count !== 1) {
    return {
      success: false,

      reason:
        "ASSESSMENT_STATUS_CHANGED",

      message:
        "Assessment lifecycle state changed before the requested transition could be applied.",
    };
  }

  /*
   * ----------------------------------------------------------
   * 5. Reload the successfully transitioned Assessment.
   *
   * The tenant and expected new status remain part of the read
   * predicate.
   * ----------------------------------------------------------
   */

  const updated =
    await prisma.assessment.findFirst({
      where: {
        id:
          assessment.id,

        organizationId,

        status:
          nextStatus,
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
   * The atomic update succeeded. Failure to confirm the expected
   * state means another lifecycle mutation occurred immediately
   * afterward.
   */

  if (!updated) {
    return {
      success: false,

      reason:
        "ASSESSMENT_STATUS_CHANGED",

      message:
        "Assessment lifecycle state changed before the completed transition could be confirmed.",
    };
  }

  return {
    success: true,

    assessment:
      updated,
  };
}
