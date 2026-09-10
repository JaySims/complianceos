import {
  ApplicabilityDefinitionStatus,
  ApplicabilityStatus,
} from "@prisma/client";

/*
 * ============================================================
 * COMPLIANCEOS — APPLICABILITY SCORING SCOPE POLICY
 * ============================================================
 *
 * PURPOSE
 *
 * Determine which ACTIVE Compliance Requirements may be supplied
 * to the locked evidence-driven Compliance Engine.
 *
 * Applicability changes only the requirement set supplied to the
 * engine. It does not change evidence statuses or scoring maths.
 *
 * V1 FAIL-CLOSED BOUNDARY
 *
 * For each active Requirement:
 *
 * - zero applicability identities:
 *     scoring scope is incomplete;
 *
 * - more than one applicability identity:
 *     production scoring is blocked until the separately-gated
 *     multiple-context scoring rule is approved;
 *
 * - exactly one applicability identity:
 *     its explicit CURRENT resolution authority must be valid,
 *     current-definition coherent, and one of:
 *
 *       APPLICABLE     -> include in scoring;
 *       NOT_APPLICABLE -> exclude from scoring;
 *       UNDETERMINED   -> exclude from scoring while remaining
 *                         unresolved outside Compliance Score.
 *
 * Missing rows never mean implicitly APPLICABLE.
 * UNKNOWN / UNDETERMINED never means NOT_APPLICABLE.
 * ============================================================
 */

export type ApplicabilityScoringScopeFailureReason =
  | "APPLICABILITY_DEFINITION_AUTHORITY_MISSING"
  | "APPLICABILITY_DEFINITION_AUTHORITY_INTEGRITY_VIOLATION"
  | "APPLICABILITY_SCOPE_MISSING"
  | "MULTIPLE_CONTEXT_SCORING_UNSUPPORTED"
  | "APPLICABILITY_DOMAIN_INTEGRITY_VIOLATION"
  | "APPLICABILITY_CURRENT_AUTHORITY_MISSING"
  | "APPLICABILITY_CURRENT_AUTHORITY_INTEGRITY_VIOLATION"
  | "APPLICABILITY_RESOLUTION_STALE"
  | "APPLICABILITY_STATUS_INVALID";

export type ScoringRequirementApplicabilityInput = {
  id: string;
  active: boolean;

  currentDefinitionAuthority: {
    requirementId: string;
    applicabilityDefinitionId: string;

    applicabilityDefinition: {
      id: string;
      requirementId: string;
      status: ApplicabilityDefinitionStatus;
    };
  } | null;

  applicability: Array<{
    id: string;
    requirementId: string;

    currentAuthority: {
      applicabilityId: string;
      revisionId: string;

      revision: {
        id: string;
        applicabilityId: string;
        applicabilityDefinitionId: string;
        status: ApplicabilityStatus;
      };
    } | null;
  }>;
};

export type ApplicabilityScoringScopeSuccess = {
  success: true;
  applicableRequirementIds: string[];
  notApplicableRequirementIds: string[];
  undeterminedRequirementIds: string[];
};

export type ApplicabilityScoringScopeFailure = {
  success: false;
  reason: ApplicabilityScoringScopeFailureReason;
  requirementId: string;
  message: string;
};

export type ApplicabilityScoringScopeResult =
  | ApplicabilityScoringScopeSuccess
  | ApplicabilityScoringScopeFailure;

export function determineApplicabilityScoringScope(
  requirements: ScoringRequirementApplicabilityInput[]
): ApplicabilityScoringScopeResult {
  const applicableRequirementIds: string[] = [];
  const notApplicableRequirementIds: string[] = [];
  const undeterminedRequirementIds: string[] = [];

  for (const requirement of requirements) {
    if (!requirement.active) {
      continue;
    }

    const definitionAuthority =
      requirement.currentDefinitionAuthority;

    if (!definitionAuthority) {
      return {
        success: false,
        reason:
          "APPLICABILITY_DEFINITION_AUTHORITY_MISSING",
        requirementId: requirement.id,
        message:
          "Active requirement has no explicit current applicability-definition authority.",
      };
    }

    if (
      definitionAuthority.requirementId !==
        requirement.id ||
      definitionAuthority.applicabilityDefinition.id !==
        definitionAuthority.applicabilityDefinitionId ||
      definitionAuthority.applicabilityDefinition.requirementId !==
        requirement.id ||
      definitionAuthority.applicabilityDefinition.status !==
        ApplicabilityDefinitionStatus.APPROVED
    ) {
      return {
        success: false,
        reason:
          "APPLICABILITY_DEFINITION_AUTHORITY_INTEGRITY_VIOLATION",
        requirementId: requirement.id,
        message:
          "Current applicability-definition authority is not valid for the active requirement.",
      };
    }

    if (requirement.applicability.length === 0) {
      return {
        success: false,
        reason: "APPLICABILITY_SCOPE_MISSING",
        requirementId: requirement.id,
        message:
          "Active requirement has no explicit persisted applicability identity.",
      };
    }

    /*
     * Persistence supports multiple contexts, but the V1
     * production scoring-collapse rule for several contexts is
     * intentionally not yet approved.
     */
    if (requirement.applicability.length > 1) {
      return {
        success: false,
        reason:
          "MULTIPLE_CONTEXT_SCORING_UNSUPPORTED",
        requirementId: requirement.id,
        message:
          "Requirement has multiple applicability contexts; production scoring is blocked until the multiple-context scoring rule is separately approved.",
      };
    }

    const applicability =
      requirement.applicability[0];

    if (
      applicability.requirementId !==
      requirement.id
    ) {
      return {
        success: false,
        reason:
          "APPLICABILITY_DOMAIN_INTEGRITY_VIOLATION",
        requirementId: requirement.id,
        message:
          "Applicability identity belongs to a different requirement.",
      };
    }

    const authority =
      applicability.currentAuthority;

    if (!authority) {
      return {
        success: false,
        reason:
          "APPLICABILITY_CURRENT_AUTHORITY_MISSING",
        requirementId: requirement.id,
        message:
          "Applicability identity has no explicit current resolution authority.",
      };
    }

    const revision =
      authority.revision;

    if (
      authority.applicabilityId !==
        applicability.id ||
      authority.revisionId !== revision.id ||
      revision.applicabilityId !==
        applicability.id
    ) {
      return {
        success: false,
        reason:
          "APPLICABILITY_CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
        requirementId: requirement.id,
        message:
          "Current applicability resolution authority does not point coherently to the applicability revision.",
      };
    }

    if (
      revision.applicabilityDefinitionId !==
      definitionAuthority.applicabilityDefinitionId
    ) {
      return {
        success: false,
        reason:
          "APPLICABILITY_RESOLUTION_STALE",
        requirementId: requirement.id,
        message:
          "Current applicability resolution was produced from a definition that is no longer authoritative.",
      };
    }

    switch (revision.status) {
      case ApplicabilityStatus.APPLICABLE:
        applicableRequirementIds.push(
          requirement.id
        );
        break;

      case ApplicabilityStatus.NOT_APPLICABLE:
        notApplicableRequirementIds.push(
          requirement.id
        );
        break;

      case ApplicabilityStatus.UNDETERMINED:
        undeterminedRequirementIds.push(
          requirement.id
        );
        break;

      default:
        return {
          success: false,
          reason:
            "APPLICABILITY_STATUS_INVALID",
          requirementId: requirement.id,
          message:
            "Current applicability revision contains an unsupported status.",
        };
    }
  }

  return {
    success: true,
    applicableRequirementIds:
      applicableRequirementIds.sort(),
    notApplicableRequirementIds:
      notApplicableRequirementIds.sort(),
    undeterminedRequirementIds:
      undeterminedRequirementIds.sort(),
  };
}
