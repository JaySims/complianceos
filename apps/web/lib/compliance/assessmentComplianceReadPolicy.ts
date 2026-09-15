/*
 * ============================================================
 * ASSESSMENT COMPLIANCE READ POLICY
 * ============================================================
 *
 * Pure policy governing how ComplianceOS presents compliance
 * state for an Assessment.
 *
 * This policy performs no database reads and no persistence.
 *
 * CORE BOUNDARIES
 *
 * 1. Mutable Assessments
 *
 *    DRAFT, IN_PROGRESS, and REVIEW Assessments may present
 *    live applicability-aware compliance state calculated from
 *    current authoritative inputs.
 *
 * 2. Completed Assessments
 *
 *    COMPLETED Assessments are historical snapshots.
 *
 *    Their persisted historical compliance score must not be
 *    silently replaced by a calculation performed under later
 *    current Evidence, applicability definitions, facts, or
 *    applicability-resolution authority.
 *
 * 3. Applicability Coverage
 *
 *    Applicability Coverage is distinct from Compliance Score.
 *
 *    V1 currently derives coverage at calculation/read time and
 *    does not persist a historical coverage snapshot.
 *
 *    Therefore a COMPLETED Assessment must not manufacture
 *    historical coverage by recalculating against current rules.
 *
 * 4. Authority
 *
 *    Assessment authority is explicit and is resolved outside
 *    this pure policy. This policy never infers authority from
 *    timestamps, lifecycle status, score, or creation order.
 * ============================================================
 */

export type AssessmentComplianceReadStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED";

export type AssessmentComplianceScoreSource =
  | "LIVE_CALCULATION"
  | "PERSISTED_HISTORICAL";

export type AssessmentApplicabilityCoverageSource =
  | "LIVE_CALCULATION"
  | "HISTORICAL_UNAVAILABLE";

export type AssessmentComplianceReadDisposition =
  | {
      mode: "LIVE";
      scoreSource: "LIVE_CALCULATION";
      coverageSource: "LIVE_CALCULATION";
      calculateCurrentState: true;
      preserveHistoricalScore: false;
    }
  | {
      mode: "HISTORICAL";
      scoreSource: "PERSISTED_HISTORICAL";
      coverageSource: "HISTORICAL_UNAVAILABLE";
      calculateCurrentState: false;
      preserveHistoricalScore: true;
    };

/*
 * ============================================================
 * READ DISPOSITION
 * ============================================================
 *
 * This is intentionally lifecycle-driven, not authority-driven.
 *
 * CurrentAssessmentAuthority may point to either a mutable or a
 * completed Assessment. Authority determines WHICH Assessment is
 * read. Lifecycle determines HOW its compliance state may be
 * presented.
 * ============================================================
 */

export function determineAssessmentComplianceReadDisposition(
  status: AssessmentComplianceReadStatus
): AssessmentComplianceReadDisposition {
  if (status === "COMPLETED") {
    return {
      mode: "HISTORICAL",
      scoreSource: "PERSISTED_HISTORICAL",
      coverageSource: "HISTORICAL_UNAVAILABLE",
      calculateCurrentState: false,
      preserveHistoricalScore: true,
    };
  }

  return {
    mode: "LIVE",
    scoreSource: "LIVE_CALCULATION",
    coverageSource: "LIVE_CALCULATION",
    calculateCurrentState: true,
    preserveHistoricalScore: false,
  };
}

/*
 * ============================================================
 * HISTORICAL SCORE POLICY
 * ============================================================
 *
 * A completed Assessment may legitimately have no persisted
 * score. The read layer must preserve that absence rather than
 * manufacture a score from current state.
 * ============================================================
 */

export function selectHistoricalAssessmentComplianceScore(
  persistedScore: number | null
): number | null {
  return persistedScore;
}
