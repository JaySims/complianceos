/*
 * ============================================================
 * APPLICABILITY-DRIVEN COMPLIANCE FRESHNESS POLICY
 * ============================================================
 *
 * Pure policy for determining which Assessments are affected
 * after applicability authority changes.
 *
 * This module performs no database access and no mutations.
 *
 * RESOLUTION AUTHORITY
 *
 * Resolution-authority movement affects the Assessment owning
 * that exact materialized applicability identity.
 *
 * The resolution path is organization-scoped because the
 * Applicability belongs to one Assessment, and that Assessment
 * belongs to one Organization.
 *
 * DEFINITION AUTHORITY
 *
 * Definition authority is requirement-scoped rather than
 * organization-scoped.
 *
 * One ComplianceRequirement may have materialized applicability
 * identities across Assessments belonging to multiple
 * Organizations.
 *
 * Therefore a definition-authority movement may affect every
 * Assessment that materialized applicability for that
 * Requirement, regardless of Organization.
 *
 * Assessment discovery is based on applicability persistence,
 * never Evidence.
 *
 * ============================================================
 */

export type ApplicabilityFreshnessAssessmentReference = {
  assessmentId: string;
  assessmentOrganizationId: string;
};

export type ApplicabilityFreshnessAssessmentTarget = {
  organizationId: string;
  assessmentId: string;
};

export type ResolutionAuthorityFreshnessDiscoveryResult =
  | {
      success: true;
      target: ApplicabilityFreshnessAssessmentTarget;
    }
  | {
      success: false;
      reason:
        "APPLICABILITY_FRESHNESS_ASSESSMENT_INTEGRITY_FAILED";
      message: string;
    };

export type DefinitionAuthorityFreshnessDiscoveryResult = {
  success: true;
  targets: ApplicabilityFreshnessAssessmentTarget[];
};

export function determineResolutionAuthorityAffectedAssessment(
  organizationId: string,
  reference: ApplicabilityFreshnessAssessmentReference
): ResolutionAuthorityFreshnessDiscoveryResult {
  if (
    reference.assessmentOrganizationId !==
    organizationId
  ) {
    return {
      success: false,
      reason:
        "APPLICABILITY_FRESHNESS_ASSESSMENT_INTEGRITY_FAILED",
      message:
        "Applicability references an assessment outside the authorized organisation.",
    };
  }

  return {
    success: true,
    target: {
      organizationId,
      assessmentId: reference.assessmentId,
    },
  };
}

export function determineDefinitionAuthorityAffectedAssessments(
  references:
    readonly ApplicabilityFreshnessAssessmentReference[]
): DefinitionAuthorityFreshnessDiscoveryResult {
  const uniqueTargets =
    new Map<
      string,
      ApplicabilityFreshnessAssessmentTarget
    >();

  for (const reference of references) {
    const key =
      `${reference.assessmentOrganizationId}\u0000${reference.assessmentId}`;

    if (!uniqueTargets.has(key)) {
      uniqueTargets.set(key, {
        organizationId:
          reference.assessmentOrganizationId,
        assessmentId:
          reference.assessmentId,
      });
    }
  }

  const targets =
    Array.from(uniqueTargets.values()).sort(
      (left, right) => {
        const organizationComparison =
          left.organizationId.localeCompare(
            right.organizationId
          );

        if (organizationComparison !== 0) {
          return organizationComparison;
        }

        return left.assessmentId.localeCompare(
          right.assessmentId
        );
      }
    );

  return {
    success: true,
    targets,
  };
}

/*
 * ============================================================
 * ASSESSMENT FRESHNESS LIFECYCLE DISPOSITION
 * ============================================================
 *
 * Applicability-driven score freshness must respect Assessment
 * historical integrity.
 *
 * DRAFT, IN_PROGRESS, and REVIEW Assessments remain mutable and
 * may have their persisted compliance score recalculated after
 * an applicability authority consequence.
 *
 * COMPLETED Assessments are historical snapshots. Later current
 * fact, rule, or applicability-definition changes must not
 * silently rewrite their historical applicability state or
 * persisted historical score.
 *
 * A COMPLETED Assessment may nevertheless remain referenced by
 * CurrentAssessmentAuthority while reassessment is prepared.
 * That condition requires an explicit freshness/reassessment
 * signal rather than silent historical score recalculation.
 *
 * This policy does not itself read or mutate authority.
 * ============================================================
 */

export type ApplicabilityFreshnessAssessmentStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED";

export type ApplicabilityFreshnessLifecycleDisposition =
  | {
      action: "RECALCULATE";
      requiresReassessment: false;
    }
  | {
      action: "PRESERVE_COMPLETED_HISTORY";
      requiresReassessment: true;
    };

export function determineApplicabilityFreshnessLifecycleDisposition(
  status: ApplicabilityFreshnessAssessmentStatus
): ApplicabilityFreshnessLifecycleDisposition {
  if (status === "COMPLETED") {
    return {
      action: "PRESERVE_COMPLETED_HISTORY",
      requiresReassessment: true,
    };
  }

  return {
    action: "RECALCULATE",
    requiresReassessment: false,
  };
}

/*
 * ============================================================
 * POST-AUTHORITY FRESHNESS OUTCOME
 * ============================================================
 *
 * Applicability authority is committed before freshness
 * orchestration executes.
 *
 * Therefore freshness failure must never imply authority
 * rollback.
 *
 * The outcome contract preserves:
 *
 * - successful recalculations already completed;
 * - completed historical Assessments deliberately preserved;
 * - Assessments requiring reassessment;
 * - the exact Assessment where freshness recalculation failed.
 *
 * ============================================================
 */

export type ApplicabilityFreshnessOutcomeStatus =
  | "RECALCULATED"
  | "PRESERVED_COMPLETED_HISTORY"
  | "RECALCULATION_FAILED";

export type ApplicabilityFreshnessTargetOutcome = {
  organizationId: string;
  assessmentId: string;
  status: ApplicabilityFreshnessOutcomeStatus;
  requiresReassessment: boolean;
};

export type ApplicabilityFreshnessExecutionSummary = {
  authorityCommitted: true;
  affectedTargets: ApplicabilityFreshnessAssessmentTarget[];
  recalculatedTargets: ApplicabilityFreshnessAssessmentTarget[];
  preservedCompletedTargets: ApplicabilityFreshnessAssessmentTarget[];
  reassessmentRequiredTargets: ApplicabilityFreshnessAssessmentTarget[];
  failedTarget: ApplicabilityFreshnessAssessmentTarget | null;
};

export function determineApplicabilityFreshnessExecutionSummary(
  outcomes: readonly ApplicabilityFreshnessTargetOutcome[]
): ApplicabilityFreshnessExecutionSummary {
  const affectedTargets: ApplicabilityFreshnessAssessmentTarget[] = [];
  const recalculatedTargets: ApplicabilityFreshnessAssessmentTarget[] = [];
  const preservedCompletedTargets: ApplicabilityFreshnessAssessmentTarget[] = [];
  const reassessmentRequiredTargets: ApplicabilityFreshnessAssessmentTarget[] = [];

  let failedTarget: ApplicabilityFreshnessAssessmentTarget | null = null;

  for (const outcome of outcomes) {
    const target = {
      organizationId: outcome.organizationId,
      assessmentId: outcome.assessmentId,
    };

    affectedTargets.push(target);

    if (outcome.status === "RECALCULATED") {
      recalculatedTargets.push(target);
    }

    if (
      outcome.status ===
      "PRESERVED_COMPLETED_HISTORY"
    ) {
      preservedCompletedTargets.push(target);
    }

    if (outcome.requiresReassessment) {
      reassessmentRequiredTargets.push(target);
    }

    if (
      outcome.status === "RECALCULATION_FAILED" &&
      failedTarget === null
    ) {
      failedTarget = target;
    }
  }

  return {
    authorityCommitted: true,
    affectedTargets,
    recalculatedTargets,
    preservedCompletedTargets,
    reassessmentRequiredTargets,
    failedTarget,
  };
}
