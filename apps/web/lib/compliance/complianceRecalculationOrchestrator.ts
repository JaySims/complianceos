import { prisma } from "@/lib/prisma";

import {
  persistAssessmentComplianceScore,
  type PersistAssessmentScoreSuccess,
} from "@/lib/compliance/assessmentScorePersistenceService";

import {
  getCurrentAssessmentAuthority,
} from "@/lib/compliance/assessmentAuthorityService";

import {
  persistOrganizationComplianceScore,
  type OrganizationComplianceAggregationSuccess,
} from "@/lib/compliance/organizationComplianceAggregationService";

/*
 * ============================================================
 * COMPLIANCEOS — COMPLIANCE RECALCULATION ORCHESTRATOR
 * ============================================================
 *
 * PURPOSE
 *
 * Coordinate the locked compliance calculation services when
 * compliance truth changes.
 *
 * CANONICAL FLOW
 *
 * Evidence / Document truth
 *   ↓
 * Assessment compliance recalculation
 *   ↓
 * Assessment.score
 *   ↓
 * Current Assessment Authority
 *   ↓
 * Organization compliance aggregation
 *   ↓
 * Organization.complianceScore
 *
 * LOCKED SERVICE BOUNDARIES
 *
 * This orchestrator does NOT calculate compliance itself.
 *
 * It delegates exclusively to:
 *
 * - persistAssessmentComplianceScore()
 * - getCurrentAssessmentAuthority()
 * - persistOrganizationComplianceScore()
 *
 * The locked calculation, integrity, authority and aggregation
 * policies remain the source of truth.
 *
 * TRANSACTION MODEL
 *
 * The orchestrator deliberately does NOT create a surrounding
 * Prisma transaction.
 *
 * Assessment score persistence and Organization aggregation each
 * own their SERIALIZABLE transaction boundary.
 *
 * The orchestrator coordinates those independently atomic
 * operations and reports partial failure explicitly.
 *
 * CURRENT SCOPE
 *
 * This orchestrator may cause writes only through the locked:
 *
 * - Assessment score persistence service;
 * - Organization compliance aggregation service.
 *
 * It does NOT mutate:
 *
 * - Evidence;
 * - Documents;
 * - Assessment lifecycle status;
 * - Current Assessment Authority;
 * - Workflow progress;
 * - Trust Score;
 * - Executive AI state.
 *
 * ============================================================
 */

export type ComplianceRecalculationFailureReason =
  | "ASSESSMENT_RECALCULATION_FAILED"
  | "AUTHORITY_READ_FAILED"
  | "ORGANIZATION_AGGREGATION_FAILED"
  | "DOCUMENT_NOT_FOUND"
  | "DOCUMENT_ACCESS_DENIED"
  | "DOCUMENT_ASSESSMENT_INTEGRITY_FAILED";

export type AssessmentComplianceRecalculationSuccess = {
  success: true;
  organizationId: string;
  assessmentId: string;
  frameworkId: string;
  assessment:
    PersistAssessmentScoreSuccess["assessment"];
  organizationAggregationTriggered: boolean;
  organization:
    | OrganizationComplianceAggregationSuccess["organization"]
    | null;
};

export type AssessmentComplianceRecalculationFailure = {
  success: false;
  reason: ComplianceRecalculationFailureReason;
  message: string;
  organizationId: string;
  assessmentId: string;
};

export type AssessmentComplianceRecalculationResult =
  | AssessmentComplianceRecalculationSuccess
  | AssessmentComplianceRecalculationFailure;

export type DocumentComplianceRecalculationSuccess = {
  success: true;
  organizationId: string;
  documentId: string;
  affectedAssessmentIds: string[];
  recalculatedAssessmentIds: string[];
  authoritativeAssessmentIds: string[];
  organizationAggregationTriggered: boolean;
  organization:
    | OrganizationComplianceAggregationSuccess["organization"]
    | null;
};

export type DocumentComplianceRecalculationFailure = {
  success: false;
  reason: ComplianceRecalculationFailureReason;
  message: string;
  organizationId: string;
  documentId: string;
  affectedAssessmentIds: string[];
  recalculatedAssessmentIds: string[];
};

export type DocumentComplianceRecalculationResult =
  | DocumentComplianceRecalculationSuccess
  | DocumentComplianceRecalculationFailure;

export type AuthorityComplianceRecalculationSuccess = {
  success: true;
  organizationId: string;
  organization:
    OrganizationComplianceAggregationSuccess["organization"];
};

export type AuthorityComplianceRecalculationFailure = {
  success: false;
  reason: "ORGANIZATION_AGGREGATION_FAILED";
  message: string;
  organizationId: string;
};

export type AuthorityComplianceRecalculationResult =
  | AuthorityComplianceRecalculationSuccess
  | AuthorityComplianceRecalculationFailure;

/*
 * ============================================================
 * PURE ORCHESTRATION POLICY
 * ============================================================
 *
 * These functions contain no database access and perform no
 * mutations.
 *
 * They make the orchestration decisions independently testable.
 * ============================================================
 */

export type AssessmentAuthorityPolicyInput = {
  assessmentId: string;
  authoritativeAssessmentId: string | null;
};

export type AssessmentAuthorityPolicyResult = {
  authoritative: boolean;
  shouldAggregateOrganization: boolean;
};

export function determineAssessmentAuthorityPolicy(
  input: AssessmentAuthorityPolicyInput
): AssessmentAuthorityPolicyResult {
  const authoritative =
    input.authoritativeAssessmentId !== null &&
    input.authoritativeAssessmentId === input.assessmentId;

  return {
    authoritative,
    shouldAggregateOrganization: authoritative,
  };
}

export type DocumentEvidenceAssessmentInput = {
  assessmentId: string;
  assessmentOrganizationId: string;
};

export type DocumentAssessmentDiscoveryResult =
  | {
      success: true;
      affectedAssessmentIds: string[];
    }
  | {
      success: false;
      reason: "DOCUMENT_ASSESSMENT_INTEGRITY_FAILED";
      message: string;
    };

export function determineDocumentAffectedAssessments(
  organizationId: string,
  evidenceRows: DocumentEvidenceAssessmentInput[]
): DocumentAssessmentDiscoveryResult {
  for (const evidence of evidenceRows) {
    if (
      evidence.assessmentOrganizationId !==
      organizationId
    ) {
      return {
        success: false,
        reason:
          "DOCUMENT_ASSESSMENT_INTEGRITY_FAILED",
        message:
          "Document-linked evidence references an assessment outside the authorized organisation.",
      };
    }
  }

  const affectedAssessmentIds =
    Array.from(
      new Set(
        evidenceRows.map(
          (evidence) => evidence.assessmentId
        )
      )
    ).sort();

  return {
    success: true,
    affectedAssessmentIds,
  };
}

export type DocumentAggregationPolicyResult = {
  authoritativeAssessmentIds: string[];
  shouldAggregateOrganization: boolean;
};

export function determineDocumentAggregationPolicy(
  recalculatedAssessmentIds: string[],
  authoritativeAssessmentIds: string[]
): DocumentAggregationPolicyResult {
  const recalculatedSet =
    new Set(recalculatedAssessmentIds);

  const authoritative =
    Array.from(
      new Set(
        authoritativeAssessmentIds.filter(
          (assessmentId) =>
            recalculatedSet.has(assessmentId)
        )
      )
    ).sort();

  return {
    authoritativeAssessmentIds: authoritative,
    shouldAggregateOrganization:
      authoritative.length > 0,
  };
}

/*
 * ============================================================
 * INTERNAL — AUTHORITY CHECK
 * ============================================================
 */

type AssessmentAuthorityCheck =
  | {
      success: true;
      authoritative: boolean;
    }
  | {
      success: false;
      message: string;
    };

async function isAssessmentCurrentlyAuthoritative(
  organizationId: string,
  frameworkId: string,
  assessmentId: string
): Promise<AssessmentAuthorityCheck> {
  try {
    const authority =
      await getCurrentAssessmentAuthority(
        organizationId,
        frameworkId
      );

    if (!authority.success) {
      if (
        authority.reason ===
        "CURRENT_AUTHORITY_NOT_FOUND"
      ) {
        const policy =
          determineAssessmentAuthorityPolicy({
            assessmentId,
            authoritativeAssessmentId: null,
          });

        return {
          success: true,
          authoritative: policy.authoritative,
        };
      }

      return {
        success: false,
        message:
          "Current assessment authority could not be resolved safely.",
      };
    }

    const policy =
      determineAssessmentAuthorityPolicy({
        assessmentId,
        authoritativeAssessmentId:
          authority.authority.assessmentId,
      });

    return {
      success: true,
      authoritative: policy.authoritative,
    };
  } catch {
    return {
      success: false,
      message:
        "Current assessment authority could not be resolved safely.",
    };
  }
}

/*
 * ============================================================
 * RECALCULATE ONE ASSESSMENT
 * ============================================================
 *
 * Used when Evidence affecting one Assessment changes.
 *
 * Organization aggregation occurs only when the recalculated
 * Assessment is currently authoritative for its Framework.
 * ============================================================
 */

export async function recalculateAssessmentCompliance(
  organizationId: string,
  assessmentId: string,
  now: Date = new Date()
): Promise<AssessmentComplianceRecalculationResult> {
  const assessmentResult =
    await persistAssessmentComplianceScore(
      organizationId,
      assessmentId,
      now
    );

  if (!assessmentResult.success) {
    return {
      success: false,
      reason:
        "ASSESSMENT_RECALCULATION_FAILED",
      message: assessmentResult.message,
      organizationId,
      assessmentId,
    };
  }

  const authorityCheck =
    await isAssessmentCurrentlyAuthoritative(
      organizationId,
      assessmentResult.assessment.frameworkId,
      assessmentResult.assessment.id
    );

  if (!authorityCheck.success) {
    return {
      success: false,
      reason: "AUTHORITY_READ_FAILED",
      message: authorityCheck.message,
      organizationId,
      assessmentId,
    };
  }

  const aggregationPolicy =
    determineAssessmentAuthorityPolicy({
      assessmentId:
        assessmentResult.assessment.id,
      authoritativeAssessmentId:
        authorityCheck.authoritative
          ? assessmentResult.assessment.id
          : null,
    });

  if (
    !aggregationPolicy.shouldAggregateOrganization
  ) {
    return {
      success: true,
      organizationId,
      assessmentId:
        assessmentResult.assessment.id,
      frameworkId:
        assessmentResult.assessment.frameworkId,
      assessment:
        assessmentResult.assessment,
      organizationAggregationTriggered: false,
      organization: null,
    };
  }

  const organizationResult =
    await persistOrganizationComplianceScore(
      organizationId
    );

  if (!organizationResult.success) {
    return {
      success: false,
      reason:
        "ORGANIZATION_AGGREGATION_FAILED",
      message: organizationResult.message,
      organizationId,
      assessmentId,
    };
  }

  return {
    success: true,
    organizationId,
    assessmentId:
      assessmentResult.assessment.id,
    frameworkId:
      assessmentResult.assessment.frameworkId,
    assessment:
      assessmentResult.assessment,
    organizationAggregationTriggered: true,
    organization:
      organizationResult.organization,
  };
}

/*
 * ============================================================
 * RECALCULATE AFTER DOCUMENT TRUTH CHANGE
 * ============================================================
 *
 * A Document may support Evidence belonging to multiple
 * Assessments.
 *
 * Therefore:
 *
 * 1. Prove Document belongs to Organization.
 * 2. Discover DISTINCT linked Assessment ids.
 * 3. Recalculate every affected Assessment.
 * 4. Determine whether any affected Assessment is authoritative.
 * 5. Aggregate Organization ONCE.
 *
 * No Evidence or Document mutation occurs here.
 * ============================================================
 */

export async function recalculateDocumentCompliance(
  organizationId: string,
  documentId: string,
  now: Date = new Date()
): Promise<DocumentComplianceRecalculationResult> {
  const document =
    await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

  if (!document) {
    return {
      success: false,
      reason: "DOCUMENT_NOT_FOUND",
      message: "Compliance document not found.",
      organizationId,
      documentId,
      affectedAssessmentIds: [],
      recalculatedAssessmentIds: [],
    };
  }

  if (
    document.organizationId !==
    organizationId
  ) {
    return {
      success: false,
      reason: "DOCUMENT_ACCESS_DENIED",
      message:
        "Compliance document does not belong to the authorized organisation.",
      organizationId,
      documentId,
      affectedAssessmentIds: [],
      recalculatedAssessmentIds: [],
    };
  }

  const evidenceRows =
    await prisma.evidence.findMany({
      where: {
        documentId,
      },
      select: {
        assessmentId: true,
        assessment: {
          select: {
            id: true,
            organizationId: true,
            frameworkId: true,
          },
        },
      },
      orderBy: {
        assessmentId: "asc",
      },
    });

  for (const evidence of evidenceRows) {
    if (
      evidence.assessment.id !==
      evidence.assessmentId
    ) {
      return {
        success: false,
        reason:
          "DOCUMENT_ASSESSMENT_INTEGRITY_FAILED",
        message:
          "Document-linked evidence references an inconsistent assessment identity.",
        organizationId,
        documentId,
        affectedAssessmentIds: [],
        recalculatedAssessmentIds: [],
      };
    }
  }

  const discovery =
    determineDocumentAffectedAssessments(
      organizationId,
      evidenceRows.map((evidence) => ({
        assessmentId:
          evidence.assessmentId,
        assessmentOrganizationId:
          evidence.assessment.organizationId,
      }))
    );

  if (!discovery.success) {
    return {
      success: false,
      reason: discovery.reason,
      message: discovery.message,
      organizationId,
      documentId,
      affectedAssessmentIds: [],
      recalculatedAssessmentIds: [],
    };
  }

  const affectedAssessmentIds =
    discovery.affectedAssessmentIds;

  const recalculatedAssessmentIds:
    string[] = [];

  const authoritativeAssessmentIds:
    string[] = [];

  for (
    const affectedAssessmentId
    of affectedAssessmentIds
  ) {
    const assessmentResult =
      await persistAssessmentComplianceScore(
        organizationId,
        affectedAssessmentId,
        now
      );

    if (!assessmentResult.success) {
      return {
        success: false,
        reason:
          "ASSESSMENT_RECALCULATION_FAILED",
        message: assessmentResult.message,
        organizationId,
        documentId,
        affectedAssessmentIds,
        recalculatedAssessmentIds,
      };
    }

    recalculatedAssessmentIds.push(
      assessmentResult.assessment.id
    );

    const authorityCheck =
      await isAssessmentCurrentlyAuthoritative(
        organizationId,
        assessmentResult.assessment.frameworkId,
        assessmentResult.assessment.id
      );

    if (!authorityCheck.success) {
      return {
        success: false,
        reason: "AUTHORITY_READ_FAILED",
        message: authorityCheck.message,
        organizationId,
        documentId,
        affectedAssessmentIds,
        recalculatedAssessmentIds,
      };
    }

    if (authorityCheck.authoritative) {
      authoritativeAssessmentIds.push(
        assessmentResult.assessment.id
      );
    }
  }

  const aggregationPolicy =
    determineDocumentAggregationPolicy(
      recalculatedAssessmentIds,
      authoritativeAssessmentIds
    );

  if (
    !aggregationPolicy.shouldAggregateOrganization
  ) {
    return {
      success: true,
      organizationId,
      documentId,
      affectedAssessmentIds,
      recalculatedAssessmentIds,
      authoritativeAssessmentIds:
        aggregationPolicy
          .authoritativeAssessmentIds,
      organizationAggregationTriggered: false,
      organization: null,
    };
  }

  const organizationResult =
    await persistOrganizationComplianceScore(
      organizationId
    );

  if (!organizationResult.success) {
    return {
      success: false,
      reason:
        "ORGANIZATION_AGGREGATION_FAILED",
      message: organizationResult.message,
      organizationId,
      documentId,
      affectedAssessmentIds,
      recalculatedAssessmentIds,
    };
  }

  return {
    success: true,
    organizationId,
    documentId,
    affectedAssessmentIds,
    recalculatedAssessmentIds,
    authoritativeAssessmentIds:
      aggregationPolicy
        .authoritativeAssessmentIds,
    organizationAggregationTriggered: true,
    organization:
      organizationResult.organization,
  };
}

/*
 * ============================================================
 * RECALCULATE AFTER AUTHORITY CHANGE
 * ============================================================
 *
 * Called only AFTER authority establishment or supersession has
 * succeeded.
 *
 * Authority movement does not itself alter Evidence truth.
 * Therefore Assessment recalculation is deliberately omitted.
 *
 * The Organization aggregate must, however, be recalculated
 * because the authoritative Assessment set has changed.
 * ============================================================
 */

export async function recalculateOrganizationAfterAuthorityChange(
  organizationId: string
): Promise<AuthorityComplianceRecalculationResult> {
  const organizationResult =
    await persistOrganizationComplianceScore(
      organizationId
    );

  if (!organizationResult.success) {
    return {
      success: false,
      reason:
        "ORGANIZATION_AGGREGATION_FAILED",
      message: organizationResult.message,
      organizationId,
    };
  }

  return {
    success: true,
    organizationId,
    organization:
      organizationResult.organization,
  };
}
