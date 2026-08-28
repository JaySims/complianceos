import {
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  calculateEvidenceCompliance,
  type ComplianceScoreResult,
} from "@/lib/compliance/complianceEngine";

import {
  normalizeComplianceEvidence,
  type ComplianceIntegrityFailureReason,
} from "@/lib/compliance/complianceIntegrity";

/*
 * ============================================================
 * COMPLIANCEOS — COMPLIANCE CALCULATION SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Prisma-backed read-only adapter for the evidence-driven
 * ComplianceOS calculation engine.
 *
 * AUTHORITY MODEL
 *
 * The organizationId supplied here must already come from the
 * ComplianceOS organization authorization boundary.
 *
 * This service independently proves:
 *
 * - Assessment belongs to the authorized Organization.
 * - Evidence belongs to the Assessment.
 * - Evidence Requirement references remain inside the
 *   Assessment Framework.
 * - Linked Documents remain inside the authorized Organization.
 *
 * IMPORTANT
 *
 * All Framework Requirements are loaded for relationship
 * integrity validation.
 *
 * Only ACTIVE Framework Requirements participate in the
 * compliance calculation.
 *
 * An inactive Requirement belonging to the correct Framework is
 * therefore not an integrity violation; it is simply excluded
 * from the current score.
 *
 * DATABASE CLIENT BOUNDARY
 *
 * By default this service uses the global Prisma client and
 * remains a normal read-only calculation service.
 *
 * A Prisma.TransactionClient may be supplied by a trusted
 * server-side caller when the calculation must participate in
 * the caller's existing database transaction.
 *
 * This does NOT alter:
 *
 * - scoring mathematics;
 * - evidence integrity rules;
 * - tenant ownership rules;
 * - active Requirement semantics.
 *
 * CURRENT BEHAVIOR
 *
 * READ ONLY.
 *
 * This service does NOT update:
 *
 * - Assessment.score
 * - Organization.complianceScore
 * - Trust Score
 * - Executive AI
 * - Workflow progress
 *
 * ============================================================
 */

export type ComplianceCalculationFailureReason =
  | "ASSESSMENT_NOT_FOUND"
  | "ASSESSMENT_ACCESS_DENIED"
  | ComplianceIntegrityFailureReason;

export type ComplianceCalculationResult =
  | {
      success: true;

      assessment: {
        id: string;
        organizationId: string;
        frameworkId: string;
      };

      calculation: ComplianceScoreResult;
    }
  | {
      success: false;

      reason:
        ComplianceCalculationFailureReason;

      message: string;
    };

/*
 * ============================================================
 * DATABASE READ CLIENT
 * ============================================================
 *
 * The calculation requires only delegates available on both:
 *
 * - PrismaClient;
 * - Prisma.TransactionClient.
 *
 * The global Prisma client is used unless an existing
 * transaction client is explicitly supplied.
 * ============================================================
 */

type ComplianceCalculationClient =
  | typeof prisma
  | Prisma.TransactionClient;

/*
 * ============================================================
 * CALCULATE ASSESSMENT COMPLIANCE
 * ============================================================
 */

export async function calculateAssessmentCompliance(
  organizationId: string,
  assessmentId: string,
  now: Date = new Date(),
  database: ComplianceCalculationClient =
    prisma
): Promise<ComplianceCalculationResult> {
  /*
   * ----------------------------------------------------------
   * 1. Locate Assessment.
   * ----------------------------------------------------------
   */

  const assessment =
    await database.assessment.findUnique({
      where: {
        id: assessmentId,
      },

      select: {
        id: true,
        organizationId: true,
        frameworkId: true,
      },
    });

  if (!assessment) {
    return {
      success: false,

      reason:
        "ASSESSMENT_NOT_FOUND",

      message:
        "Compliance assessment not found.",
    };
  }

  /*
   * ----------------------------------------------------------
   * 2. Enforce Assessment tenant ownership.
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
   * 3. Load ALL Requirements belonging to the Framework.
   *
   * We deliberately load active and inactive Requirements.
   *
   * The complete set proves Framework membership.
   * The active subset determines current compliance scoring.
   * ----------------------------------------------------------
   */

  const frameworkRequirements =
    await database.complianceRequirement.findMany({
      where: {
        frameworkId:
          assessment.frameworkId,
      },

      select: {
        id: true,
        code: true,
        title: true,
        mandatory: true,
        weight: true,
        active: true,
      },

      orderBy: [
        {
          category: "asc",
        },
        {
          code: "asc",
        },
      ],
    });

  const frameworkRequirementIds =
    new Set(
      frameworkRequirements.map(
        (requirement) =>
          requirement.id
      )
    );

  const activeRequirements =
    frameworkRequirements.filter(
      (requirement) =>
        requirement.active
    );

  const activeRequirementIds =
    new Set(
      activeRequirements.map(
        (requirement) =>
          requirement.id
      )
    );

  /*
   * ----------------------------------------------------------
   * 4. Load Assessment Evidence.
   * ----------------------------------------------------------
   */

  const evidence =
    await database.evidence.findMany({
      where: {
        assessmentId:
          assessment.id,
      },

      select: {
        id: true,
        requirementId: true,
        status: true,
        verifiedAt: true,
        createdAt: true,

        document: {
          select: {
            id: true,
            organizationId: true,
            status: true,
            expiresAt: true,
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    });

  /*
   * ----------------------------------------------------------
   * 5. Validate cross-relationship integrity.
   *
   * IMPORTANT:
   *
   * Framework membership is validated against ALL Requirements,
   * not only active Requirements.
   * ----------------------------------------------------------
   */

  const integrity =
    normalizeComplianceEvidence({
      organizationId,

      validRequirementIds:
        frameworkRequirementIds,

      evidence,

      now,
    });

  if (!integrity.success) {
    return integrity;
  }

  /*
   * ----------------------------------------------------------
   * 6. Exclude Evidence belonging to inactive Requirements.
   *
   * Such Evidence is historically valid and belongs to the
   * correct Framework, but must not affect the current score.
   * ----------------------------------------------------------
   */

  const activeEvidence =
    integrity.evidence.filter(
      (item) =>
        item.requirementId !== null &&
        activeRequirementIds.has(
          item.requirementId
        )
    );

  /*
   * ----------------------------------------------------------
   * 7. Execute deterministic compliance calculation using only
   *    active Requirements and their applicable Evidence.
   * ----------------------------------------------------------
   */

  const calculation =
    calculateEvidenceCompliance(
      activeRequirements,
      activeEvidence
    );

  return {
    success: true,

    assessment: {
      id:
        assessment.id,

      organizationId:
        assessment.organizationId,

      frameworkId:
        assessment.frameworkId,
    },

    calculation,
  };
}
