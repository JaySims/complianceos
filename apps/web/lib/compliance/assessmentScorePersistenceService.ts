import {
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  calculateAssessmentCompliance,
  type ComplianceCalculationFailureReason,
} from "@/lib/compliance/complianceCalculationService";

import type {
  ComplianceScoreResult,
} from "@/lib/compliance/complianceEngine";

/*
 * ============================================================
 * COMPLIANCEOS — ASSESSMENT SCORE PERSISTENCE SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Persist the evidence-derived compliance score for one
 * Assessment.
 *
 * SOURCE OF TRUTH
 *
 * This service NEVER accepts a compliance score from a caller.
 *
 * The score originates exclusively from:
 *
 * verified Evidence
 *   ↓
 * Compliance Integrity
 *   ↓
 * locked Compliance Engine
 *   ↓
 * calculateAssessmentCompliance()
 *   ↓
 * Assessment.score
 *
 * TRANSACTION MODEL
 *
 * Calculation and persistence execute inside one interactive
 * Prisma transaction using SERIALIZABLE isolation.
 *
 * The same transaction client is passed into the calculation
 * service, so Assessment, Requirement and Evidence reads belong
 * to the same transactional operation as the score write.
 *
 * If PostgreSQL cannot serialize a conflicting concurrent
 * operation safely, the transaction must fail rather than claim
 * successful score persistence from an unsafe interleaving.
 *
 * AUTHORITY MODEL
 *
 * organizationId supplied to this service must already originate
 * from the ComplianceOS organization authorization boundary.
 *
 * calculateAssessmentCompliance() independently proves:
 *
 * - Assessment tenant ownership;
 * - Requirement / Framework integrity;
 * - linked Document tenant integrity;
 * - current Evidence validity;
 * - active Requirement applicability.
 *
 * CURRENT SCOPE
 *
 * This service updates ONLY:
 *
 * - Assessment.score
 *
 * This service does NOT update:
 *
 * - Assessment.status;
 * - Organization.complianceScore;
 * - Organization.trustScore;
 * - Evidence;
 * - Documents;
 * - Workflow progress;
 * - Executive AI state.
 *
 * ============================================================
 */

export type AssessmentScorePersistenceFailureReason =
  ComplianceCalculationFailureReason
  | "ASSESSMENT_CHANGED_DURING_CALCULATION"
  | "SCORE_PERSISTENCE_TRANSACTION_FAILED";

export type PersistAssessmentScoreSuccess = {
  success: true;

  assessment: {
    id: string;
    organizationId: string;
    frameworkId: string;
    score: number;
    updatedAt: Date;
  };

  calculation: ComplianceScoreResult;
};

export type PersistAssessmentScoreFailure = {
  success: false;

  reason:
    AssessmentScorePersistenceFailureReason;

  message: string;
};

export type PersistAssessmentScoreResult =
  | PersistAssessmentScoreSuccess
  | PersistAssessmentScoreFailure;

/*
 * ============================================================
 * INTERNAL TRANSACTION FAILURE
 * ============================================================
 *
 * Used only to force rollback when a defensive persistence
 * invariant fails after calculation.
 * ============================================================
 */

class AssessmentPersistenceInvariantError
  extends Error {
  constructor(message: string) {
    super(message);

    this.name =
      "AssessmentPersistenceInvariantError";
  }
}

/*
 * ============================================================
 * PERSIST ASSESSMENT COMPLIANCE SCORE
 * ============================================================
 *
 * No score parameter exists by design.
 *
 * The caller identifies only:
 *
 * - authorized Organization;
 * - Assessment.
 *
 * ComplianceOS calculates the score itself from current Evidence.
 * ============================================================
 */

export async function persistAssessmentComplianceScore(
  organizationId: string,
  assessmentId: string,
  now: Date = new Date()
): Promise<PersistAssessmentScoreResult> {
  try {
    const transactionResult =
      await prisma.$transaction<
        PersistAssessmentScoreResult
      >(
        async (
          transaction:
            Prisma.TransactionClient
        ): Promise<
          PersistAssessmentScoreResult
        > => {
          /*
           * ----------------------------------------------------
           * 1. Calculate from authoritative Evidence inside the
           *    SAME transaction used for persistence.
           * ----------------------------------------------------
           */

          const result =
            await calculateAssessmentCompliance(
              organizationId,
              assessmentId,
              now,
              transaction
            );

          if (!result.success) {
            return result;
          }

          /*
           * ----------------------------------------------------
           * 2. Persist using tenant + framework scoped predicate.
           * ----------------------------------------------------
           */

          const update =
            await transaction.assessment.updateMany({
              where: {
                id:
                  result.assessment.id,

                organizationId:
                  result.assessment.organizationId,

                frameworkId:
                  result.assessment.frameworkId,
              },

              data: {
                score:
                  result.calculation.score,
              },
            });

          /*
           * ----------------------------------------------------
           * 3. Exactly one Assessment must have been updated.
           *
           * Throwing here forces transaction rollback.
           * ----------------------------------------------------
           */

          if (update.count !== 1) {
            throw new AssessmentPersistenceInvariantError(
              "Compliance assessment changed before its calculated score could be persisted."
            );
          }

          /*
           * ----------------------------------------------------
           * 4. Confirm persisted state inside the same
           *    transaction.
           * ----------------------------------------------------
           */

          const assessment =
            await transaction.assessment.findFirst({
              where: {
                id:
                  result.assessment.id,

                organizationId:
                  result.assessment.organizationId,

                frameworkId:
                  result.assessment.frameworkId,
              },

              select: {
                id: true,
                organizationId: true,
                frameworkId: true,
                score: true,
                updatedAt: true,
              },
            });

          if (
            !assessment ||
            assessment.score === null
          ) {
            throw new AssessmentPersistenceInvariantError(
              "Persisted compliance assessment state could not be confirmed."
            );
          }

          const successResult:
            PersistAssessmentScoreSuccess = {
              success: true,

              assessment: {
                id:
                  assessment.id,

                organizationId:
                  assessment.organizationId,

                frameworkId:
                  assessment.frameworkId,

                score:
                  assessment.score,

                updatedAt:
                  assessment.updatedAt,
              },

              calculation:
                result.calculation,
            };

          return successResult;
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
        }
      );

    return transactionResult;
  } catch (error) {
    /*
     * ----------------------------------------------------------
     * Defensive invariant failure.
     * ----------------------------------------------------------
     */

    if (
      error instanceof
      AssessmentPersistenceInvariantError
    ) {
      return {
        success: false,

        reason:
          "ASSESSMENT_CHANGED_DURING_CALCULATION",

        message:
          error.message,
      };
    }

    /*
     * ----------------------------------------------------------
     * Transaction/database failure.
     *
     * This includes serialization conflicts that PostgreSQL /
     * Prisma may surface when concurrent state cannot be safely
     * committed under SERIALIZABLE isolation.
     *
     * No raw database error is exposed through the service
     * result.
     * ----------------------------------------------------------
     */

    return {
      success: false,

      reason:
        "SCORE_PERSISTENCE_TRANSACTION_FAILED",

      message:
        "The evidence-derived compliance score could not be persisted safely.",
    };
  }
}
