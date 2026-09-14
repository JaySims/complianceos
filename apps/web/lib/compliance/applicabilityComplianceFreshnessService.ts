import {
  AssessmentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  determineApplicabilityFreshnessExecutionSummary,
  determineApplicabilityFreshnessLifecycleDisposition,
  determineDefinitionAuthorityAffectedAssessments,
  determineResolutionAuthorityAffectedAssessment,
  type ApplicabilityFreshnessAssessmentReference,
  type ApplicabilityFreshnessTargetOutcome,
  type ApplicabilityFreshnessExecutionSummary,
} from "./applicabilityComplianceFreshnessPolicy";

import {
  recalculateAssessmentCompliance,
} from "./complianceRecalculationOrchestrator";

/*
 * ============================================================
 * APPLICABILITY COMPLIANCE FRESHNESS SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Reconcile persisted Assessment compliance scores after an
 * applicability authority operation has already committed.
 *
 * AUTHORITY BOUNDARY
 *
 * This service does NOT establish, supersede, or mutate:
 *
 * - applicability definition authority;
 * - applicability resolution authority;
 * - Assessment authority;
 * - Assessment lifecycle state.
 *
 * Authority mutation happens before this service is invoked.
 *
 * Therefore every result produced here represents a
 * post-authority consequence. Freshness failure never implies
 * authority rollback.
 *
 * HISTORICAL BOUNDARY
 *
 * DRAFT, IN_PROGRESS, and REVIEW Assessments may be
 * recalculated.
 *
 * COMPLETED Assessments are historical snapshots and must not
 * have their persisted historical score silently rewritten due
 * to later current-rule changes.
 *
 * DEFINITION CONSEQUENCE
 *
 * Applicability definition authority belongs to a Requirement.
 *
 * A changed Requirement definition may affect every Assessment
 * using the Requirement's Framework, including Assessments that
 * do not yet have a materialized applicability identity for the
 * Requirement.
 *
 * Therefore definition freshness discovery is Framework-wide,
 * not applicability-row-wide.
 *
 * TRANSACTION MODEL
 *
 * This service deliberately creates no surrounding transaction.
 *
 * recalculateAssessmentCompliance() owns the already-locked
 * Assessment-score / Organization-aggregation orchestration
 * boundaries and reports partial failure explicitly.
 *
 * ============================================================
 */

export type ApplicabilityFreshnessFailureReason =
  | "APPLICABILITY_NOT_FOUND"
  | "APPLICABILITY_ASSESSMENT_INTEGRITY_FAILED"
  | "REQUIREMENT_NOT_FOUND"
  | "ASSESSMENT_DISCOVERY_FAILED"
  | "ASSESSMENT_RECALCULATION_FAILED"
  | "FRESHNESS_READ_FAILED";

export type ApplicabilityFreshnessSuccess = {
  success: true;
  summary: ApplicabilityFreshnessExecutionSummary;
};

export type ApplicabilityFreshnessFailure = {
  success: false;
  authorityCommitted: true;
  reason: ApplicabilityFreshnessFailureReason;
  message: string;
  summary: ApplicabilityFreshnessExecutionSummary;
};

export type ApplicabilityFreshnessResult =
  | ApplicabilityFreshnessSuccess
  | ApplicabilityFreshnessFailure;

type AssessmentFreshnessCandidate = {
  id: string;
  organizationId: string;
  status: AssessmentStatus;
};

function failure(
  reason: ApplicabilityFreshnessFailureReason,
  message: string,
  outcomes: readonly ApplicabilityFreshnessTargetOutcome[]
): ApplicabilityFreshnessFailure {
  return {
    success: false,
    authorityCommitted: true,
    reason,
    message,
    summary:
      determineApplicabilityFreshnessExecutionSummary(
        outcomes
      ),
  };
}

async function executeFreshnessTargets(
  candidates: readonly AssessmentFreshnessCandidate[],
  now: Date
): Promise<ApplicabilityFreshnessResult> {
  const outcomes: ApplicabilityFreshnessTargetOutcome[] = [];

  for (const candidate of candidates) {
    const lifecycle =
      determineApplicabilityFreshnessLifecycleDisposition(
        candidate.status
      );

    if (
      lifecycle.action ===
      "PRESERVE_COMPLETED_HISTORY"
    ) {
      outcomes.push({
        organizationId: candidate.organizationId,
        assessmentId: candidate.id,
        status: "PRESERVED_COMPLETED_HISTORY",
        requiresReassessment:
          lifecycle.requiresReassessment,
      });

      continue;
    }

    let recalculation;

    try {
      recalculation =
        await recalculateAssessmentCompliance(
          candidate.organizationId,
          candidate.id,
          now
        );
    } catch {
      outcomes.push({
        organizationId: candidate.organizationId,
        assessmentId: candidate.id,
        status: "RECALCULATION_FAILED",
        requiresReassessment: false,
      });

      return failure(
        "ASSESSMENT_RECALCULATION_FAILED",
        `Applicability authority was committed, but compliance freshness recalculation threw unexpectedly for Assessment ${candidate.id}.`,
        outcomes
      );
    }

    if (!recalculation.success) {
      outcomes.push({
        organizationId: candidate.organizationId,
        assessmentId: candidate.id,
        status: "RECALCULATION_FAILED",
        requiresReassessment: false,
      });

      return failure(
        "ASSESSMENT_RECALCULATION_FAILED",
        `Applicability authority was committed, but compliance freshness recalculation failed for Assessment ${candidate.id}: ${recalculation.message}`,
        outcomes
      );
    }

    outcomes.push({
      organizationId: candidate.organizationId,
      assessmentId: candidate.id,
      status: "RECALCULATED",
      requiresReassessment: false,
    });
  }

  return {
    success: true,
    summary:
      determineApplicabilityFreshnessExecutionSummary(
        outcomes
      ),
  };
}

export async function refreshAfterResolutionAuthorityCommit(
  organizationId: string,
  applicabilityId: string,
  now: Date = new Date()
): Promise<ApplicabilityFreshnessResult> {
  try {
    const applicability =
      await prisma.assessmentRequirementApplicability.findUnique({
        where: {
          id: applicabilityId,
        },
        select: {
          id: true,
          assessmentId: true,
          assessment: {
            select: {
              id: true,
              organizationId: true,
              status: true,
            },
          },
        },
      });

    if (!applicability) {
      return failure(
        "APPLICABILITY_NOT_FOUND",
        "Applicability authority was committed, but the applicability identity could not be resolved for compliance freshness.",
        []
      );
    }

    if (
      applicability.assessment.id !==
      applicability.assessmentId
    ) {
      return failure(
        "APPLICABILITY_ASSESSMENT_INTEGRITY_FAILED",
        "Applicability authority was committed, but the applicability identity references an inconsistent Assessment.",
        []
      );
    }

    const discovery =
      determineResolutionAuthorityAffectedAssessment(
        organizationId,
        {
          assessmentId:
            applicability.assessmentId,
          assessmentOrganizationId:
            applicability.assessment.organizationId,
        }
      );

    if (!discovery.success) {
      return failure(
        "APPLICABILITY_ASSESSMENT_INTEGRITY_FAILED",
        discovery.message,
        []
      );
    }

    return executeFreshnessTargets(
      [
        {
          id: discovery.target.assessmentId,
          organizationId:
            discovery.target.organizationId,
          status: applicability.assessment.status,
        },
      ],
      now
    );
  } catch {
    return failure(
      "FRESHNESS_READ_FAILED",
      "Applicability authority was committed, but the affected Assessment could not be read safely for compliance freshness.",
      []
    );
  }
}

export async function refreshAfterDefinitionAuthorityCommit(
  requirementId: string,
  now: Date = new Date()
): Promise<ApplicabilityFreshnessResult> {
  try {
    const requirement =
      await prisma.complianceRequirement.findUnique({
        where: {
          id: requirementId,
        },
        select: {
          id: true,
          frameworkId: true,
        },
      });

    if (!requirement) {
      return failure(
        "REQUIREMENT_NOT_FOUND",
        "Applicability definition authority was committed, but the Requirement could not be resolved for compliance freshness.",
        []
      );
    }

    const assessments =
      await prisma.assessment.findMany({
        where: {
          frameworkId: requirement.frameworkId,
        },
        select: {
          id: true,
          organizationId: true,
          status: true,
        },
        orderBy: [
          {
            organizationId: "asc",
          },
          {
            id: "asc",
          },
        ],
      });

    const references:
      ApplicabilityFreshnessAssessmentReference[] =
      assessments.map((assessment) => ({
        assessmentId: assessment.id,
        assessmentOrganizationId:
          assessment.organizationId,
      }));

    const discovery =
      determineDefinitionAuthorityAffectedAssessments(
        references
      );

    const assessmentByTargetKey =
      new Map(
        assessments.map((assessment) => [
          `${assessment.organizationId}\0${assessment.id}`,
          assessment,
        ])
      );

    const candidates:
      AssessmentFreshnessCandidate[] = [];

    for (const target of discovery.targets) {
      const assessment =
        assessmentByTargetKey.get(
          `${target.organizationId}\0${target.assessmentId}`
        );

      if (!assessment) {
        return failure(
          "ASSESSMENT_DISCOVERY_FAILED",
          "Applicability definition authority was committed, but an affected Assessment could not be reconciled with freshness discovery.",
          []
        );
      }

      candidates.push({
        id: assessment.id,
        organizationId: assessment.organizationId,
        status: assessment.status,
      });
    }

    return executeFreshnessTargets(
      candidates,
      now
    );
  } catch {
    return failure(
      "FRESHNESS_READ_FAILED",
      "Applicability definition authority was committed, but affected Assessments could not be read safely for compliance freshness.",
      []
    );
  }
}
