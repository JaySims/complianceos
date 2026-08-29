import {
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/*
 * ============================================================
 * COMPLIANCEOS — ORGANIZATION COMPLIANCE AGGREGATION SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Derive and persist the Organization-level compliance score
 * from the Organization's CURRENT authoritative Assessments.
 *
 * SOURCE OF TRUTH
 *
 * Verified Evidence
 *   ↓
 * Compliance Engine
 *   ↓
 * Assessment.score
 *   ↓
 * CurrentAssessmentAuthority
 *   ↓
 * Organization Compliance Aggregation
 *   ↓
 * Organization.complianceScore
 *
 * AUTHORITY RULE
 *
 * Historical Assessments never participate merely because they
 * are newer, completed, or scored.
 *
 * Only Assessments referenced by CurrentAssessmentAuthority for
 * the authorized Organization may participate.
 *
 * NULL SCORE RULE
 *
 * Assessment.score === null means the authoritative Assessment
 * has not yet produced a persisted evidence-derived score.
 *
 * Null scores are therefore excluded from the numeric
 * denominator rather than interpreted as 0% compliance.
 *
 * WEIGHTING RULE
 *
 * Framework-level weighting is not currently modeled.
 *
 * Every SCORED authoritative Framework therefore contributes
 * equally to the Organization compliance score.
 *
 * ZERO-CONTRIBUTOR RULE
 *
 * If no authoritative Assessment currently has a numeric score,
 * Organization.complianceScore is persisted as 0.
 *
 * Result metadata separately exposes authority and contributor
 * counts so callers can distinguish:
 *
 * - no calculated compliance position; from
 * - a genuine calculated 0% compliance position.
 *
 * TRANSACTION MODEL
 *
 * Authority reads, Assessment score reads, Organization score
 * persistence, and persistence confirmation execute inside one
 * SERIALIZABLE Prisma transaction.
 *
 * PostgreSQL must reject unsafe concurrent interleavings rather
 * than allow ComplianceOS to persist a score from inconsistent
 * authority / Assessment state.
 *
 * AUTHORIZATION BOUNDARY
 *
 * organizationId supplied to this service must already originate
 * from the ComplianceOS organization authorization boundary.
 *
 * CURRENT SCOPE
 *
 * This service updates ONLY:
 *
 * - Organization.complianceScore.
 *
 * This service does NOT update:
 *
 * - Assessment.score;
 * - Assessment.status;
 * - CurrentAssessmentAuthority;
 * - Organization.trustScore;
 * - Evidence;
 * - Documents;
 * - Workflow progress;
 * - Executive AI state.
 *
 * ============================================================
 */

export type OrganizationComplianceAggregationFailureReason =
  | "ORGANIZATION_NOT_FOUND"
  | "AUTHORITY_ASSESSMENT_NOT_FOUND"
  | "AUTHORITY_TENANT_MISMATCH"
  | "AUTHORITY_FRAMEWORK_MISMATCH"
  | "ORGANIZATION_CHANGED_DURING_AGGREGATION"
  | "AGGREGATION_TRANSACTION_FAILED";

export type AuthoritativeAssessmentScoreInput = {
  authorityId: string;
  authorityOrganizationId: string;
  authorityFrameworkId: string;
  assessmentId: string;
  assessmentOrganizationId: string;
  assessmentFrameworkId: string;
  score: number | null;
};

export type OrganizationComplianceAggregation = {
  score: number;
  authoritativeFrameworkCount: number;
  scoredFrameworkCount: number;
  unscoredFrameworkCount: number;
  contributingAssessmentIds: string[];
};

export type OrganizationComplianceAggregationSuccess = {
  success: true;

  organization: {
    id: string;
    complianceScore: number;
    updatedAt: Date;
  };

  aggregation: OrganizationComplianceAggregation;
};

export type OrganizationComplianceAggregationFailure = {
  success: false;
  reason: OrganizationComplianceAggregationFailureReason;
  message: string;
};

export type OrganizationComplianceAggregationResult =
  | OrganizationComplianceAggregationSuccess
  | OrganizationComplianceAggregationFailure;

export type OrganizationComplianceAggregationPolicySuccess = {
  success: true;
  aggregation: OrganizationComplianceAggregation;
};

export type OrganizationComplianceAggregationPolicyFailure = {
  success: false;
  reason:
    | "AUTHORITY_TENANT_MISMATCH"
    | "AUTHORITY_FRAMEWORK_MISMATCH";
  message: string;
};

export type OrganizationComplianceAggregationPolicyResult =
  | OrganizationComplianceAggregationPolicySuccess
  | OrganizationComplianceAggregationPolicyFailure;

/*
 * ============================================================
 * INTERNAL TRANSACTION FAILURE
 * ============================================================
 */

class OrganizationComplianceAggregationInvariantError
  extends Error {
  reason:
    | "AUTHORITY_ASSESSMENT_NOT_FOUND"
    | "ORGANIZATION_CHANGED_DURING_AGGREGATION";

  constructor(
    reason:
      | "AUTHORITY_ASSESSMENT_NOT_FOUND"
      | "ORGANIZATION_CHANGED_DURING_AGGREGATION",
    message: string
  ) {
    super(message);

    this.name =
      "OrganizationComplianceAggregationInvariantError";

    this.reason = reason;
  }
}

/*
 * ============================================================
 * SCORE NORMALIZATION
 * ============================================================
 *
 * Assessment scores produced by the locked Compliance Engine are
 * expected to be finite percentages from 0 through 100.
 *
 * This boundary remains defensive:
 *
 * - non-finite values do not contribute;
 * - values below 0 normalize to 0;
 * - values above 100 normalize to 100.
 *
 * ============================================================
 */

function normalizeAssessmentScore(
  score: number
): number | null {
  if (!Number.isFinite(score)) {
    return null;
  }

  return Math.min(
    100,
    Math.max(0, score)
  );
}

/*
 * ============================================================
 * CALCULATE ORGANIZATION COMPLIANCE AGGREGATION
 * ============================================================
 *
 * PURE DOMAIN POLICY.
 *
 * No database access.
 * No persistence.
 *
 * ============================================================
 */

export function calculateOrganizationComplianceAggregation(
  organizationId: string,
  inputs: AuthoritativeAssessmentScoreInput[]
): OrganizationComplianceAggregationPolicyResult {
  const contributingAssessmentIds: string[] = [];

  let scoredFrameworkCount = 0;
  let scoreTotal = 0;

  for (const input of inputs) {
    /*
     * Authority must belong to the exact authorized tenant.
     */

    if (
      input.authorityOrganizationId !==
        organizationId ||
      input.assessmentOrganizationId !==
        organizationId
    ) {
      return {
        success: false,
        reason: "AUTHORITY_TENANT_MISMATCH",
        message:
          "Current assessment authority does not belong to the authorized organisation.",
      };
    }

    /*
     * Authority Framework and Assessment Framework must agree.
     *
     * Separate database foreign keys cannot prove this composite
     * relationship, so the service boundary proves it explicitly.
     */

    if (
      input.authorityFrameworkId !==
      input.assessmentFrameworkId
    ) {
      return {
        success: false,
        reason: "AUTHORITY_FRAMEWORK_MISMATCH",
        message:
          "Current assessment authority does not match the authoritative assessment framework.",
      };
    }

    /*
     * Null means not yet calculated.
     *
     * It is excluded rather than converted into regulatory
     * non-compliance.
     */

    if (input.score === null) {
      continue;
    }

    const normalizedScore =
      normalizeAssessmentScore(input.score);

    /*
     * Prisma/PostgreSQL should not normally surface non-finite
     * persisted Float values here. Defensive exclusion prevents
     * an invalid numeric value from corrupting aggregation.
     */

    if (normalizedScore === null) {
      continue;
    }

    scoreTotal += normalizedScore;
    scoredFrameworkCount += 1;

    contributingAssessmentIds.push(
      input.assessmentId
    );
  }

  const authoritativeFrameworkCount =
    inputs.length;

  const unscoredFrameworkCount =
    authoritativeFrameworkCount -
    scoredFrameworkCount;

  const score =
    scoredFrameworkCount === 0
      ? 0
      : scoreTotal / scoredFrameworkCount;

  return {
    success: true,

    aggregation: {
      score,
      authoritativeFrameworkCount,
      scoredFrameworkCount,
      unscoredFrameworkCount,
      contributingAssessmentIds,
    },
  };
}

/*
 * ============================================================
 * AGGREGATE AND PERSIST ORGANIZATION COMPLIANCE
 * ============================================================
 *
 * The caller supplies only the authorized Organization id.
 *
 * The service itself determines:
 *
 * - current authority rows;
 * - authoritative Assessments;
 * - current persisted Assessment scores;
 * - the resulting Organization compliance score.
 *
 * No caller-provided compliance score is accepted.
 *
 * ============================================================
 */

export async function persistOrganizationComplianceScore(
  organizationId: string
): Promise<OrganizationComplianceAggregationResult> {
  try {
    return await prisma.$transaction<
      OrganizationComplianceAggregationResult
    >(
      async (
        transaction: Prisma.TransactionClient
      ): Promise<
        OrganizationComplianceAggregationResult
      > => {
        /*
         * ------------------------------------------------------
         * 1. Prove Organization exists.
         * ------------------------------------------------------
         */

        const organization =
          await transaction.organization.findUnique({
            where: {
              id: organizationId,
            },

            select: {
              id: true,
            },
          });

        if (!organization) {
          return {
            success: false,
            reason: "ORGANIZATION_NOT_FOUND",
            message:
              "Organization not found.",
          };
        }

        /*
         * ------------------------------------------------------
         * 2. Load ONLY current authority rows for Organization.
         *
         * Assessment relation is deliberately loaded through the
         * authority row. No latest-assessment query exists here.
         * ------------------------------------------------------
         */

        const authorities =
          await transaction.currentAssessmentAuthority.findMany({
            where: {
              organizationId,
            },

            orderBy: [
              {
                frameworkId: "asc",
              },
              {
                id: "asc",
              },
            ],

            select: {
              id: true,
              organizationId: true,
              frameworkId: true,
              assessmentId: true,

              assessment: {
                select: {
                  id: true,
                  organizationId: true,
                  frameworkId: true,
                  score: true,
                },
              },
            },
          });

        /*
         * ------------------------------------------------------
         * 3. Normalize DB records into pure aggregation inputs.
         * ------------------------------------------------------
         */

        const inputs:
          AuthoritativeAssessmentScoreInput[] =
          authorities.map((authority) => {
            if (!authority.assessment) {
              throw new OrganizationComplianceAggregationInvariantError(
                "AUTHORITY_ASSESSMENT_NOT_FOUND",
                "Current assessment authority references an assessment that could not be resolved."
              );
            }

            return {
              authorityId:
                authority.id,

              authorityOrganizationId:
                authority.organizationId,

              authorityFrameworkId:
                authority.frameworkId,

              assessmentId:
                authority.assessment.id,

              assessmentOrganizationId:
                authority.assessment.organizationId,

              assessmentFrameworkId:
                authority.assessment.frameworkId,

              score:
                authority.assessment.score,
            };
          });

        /*
         * ------------------------------------------------------
         * 4. Execute deterministic aggregation policy.
         * ------------------------------------------------------
         */

        const policy =
          calculateOrganizationComplianceAggregation(
            organizationId,
            inputs
          );

        if (!policy.success) {
          return policy;
        }

        /*
         * ------------------------------------------------------
         * 5. Persist ONLY Organization.complianceScore.
         *
         * Tenant-scoped updateMany provides an explicit guarded
         * mutation boundary.
         * ------------------------------------------------------
         */

        const update =
          await transaction.organization.updateMany({
            where: {
              id: organizationId,
            },

            data: {
              complianceScore:
                policy.aggregation.score,
            },
          });

        if (update.count !== 1) {
          throw new OrganizationComplianceAggregationInvariantError(
            "ORGANIZATION_CHANGED_DURING_AGGREGATION",
            "Organization changed before its aggregated compliance score could be persisted."
          );
        }

        /*
         * ------------------------------------------------------
         * 6. Confirm persisted Organization state inside the
         *    SAME transaction.
         * ------------------------------------------------------
         */

        const persistedOrganization =
          await transaction.organization.findUnique({
            where: {
              id: organizationId,
            },

            select: {
              id: true,
              complianceScore: true,
              updatedAt: true,
            },
          });

        if (!persistedOrganization) {
          throw new OrganizationComplianceAggregationInvariantError(
            "ORGANIZATION_CHANGED_DURING_AGGREGATION",
            "Persisted organization compliance state could not be confirmed."
          );
        }

        if (
          persistedOrganization.complianceScore !==
          policy.aggregation.score
        ) {
          throw new OrganizationComplianceAggregationInvariantError(
            "ORGANIZATION_CHANGED_DURING_AGGREGATION",
            "Persisted organization compliance score does not match the authoritative aggregation result."
          );
        }

        return {
          success: true,

          organization: {
            id:
              persistedOrganization.id,

            complianceScore:
              persistedOrganization.complianceScore,

            updatedAt:
              persistedOrganization.updatedAt,
          },

          aggregation:
            policy.aggregation,
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
      OrganizationComplianceAggregationInvariantError
    ) {
      return {
        success: false,
        reason: error.reason,
        message: error.message,
      };
    }

    return {
      success: false,
      reason: "AGGREGATION_TRANSACTION_FAILED",
      message:
        "Organization compliance score could not be aggregated and persisted safely.",
    };
  }
}
