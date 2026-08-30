import {
  AssessmentStatus,
  ComplianceRequirementCategory,
  DocumentVerificationStatus,
  EvidenceVerificationStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  OrganizationAccessContext,
} from "@/lib/auth/organizationAccess";

import {
  canReadComplianceEvidence,
} from "@/lib/compliance/evidenceMutationService";


/*
 * ============================================================
 * COMPLIANCEOS — EVIDENCE QUERY SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Establish the authoritative application read boundary for
 * Compliance Evidence.
 *
 * RESPONSIBILITIES
 *
 * - organization-scoped Evidence reads;
 * - Assessment ownership enforcement;
 * - Evidence ownership enforcement through Assessment;
 * - reuse of the locked Evidence read-role policy;
 * - linked Document tenant-integrity validation;
 * - linked Requirement framework-integrity validation;
 * - safe relational projection for Evidence consumers;
 * - deterministic Evidence collection ordering.
 *
 * NOT RESPONSIBLE FOR
 *
 * - authentication token resolution;
 * - HTTP parsing or response translation;
 * - Evidence mutation;
 * - compliance recalculation;
 * - score persistence;
 * - organization aggregation;
 * - Current Assessment Authority mutation;
 * - Trust Score;
 * - Executive AI;
 * - Workflow progress;
 * - binary file access or storage.
 *
 * The OrganizationAccessContext is authoritative.
 * No browser-controlled organization identifier is accepted.
 * ============================================================
 */


/*
 * ============================================================
 * RESULT CONTRACT
 * ============================================================
 */

export type EvidenceQueryFailureReason =
  | "EVIDENCE_READ_FORBIDDEN"
  | "ASSESSMENT_NOT_FOUND"
  | "ASSESSMENT_ACCESS_DENIED"
  | "EVIDENCE_NOT_FOUND"
  | "EVIDENCE_ACCESS_DENIED"
  | "EVIDENCE_QUERY_FAILED";


export type EvidenceQueryAssessmentRecord = {
  id: string;
  title: string;
  score: number | null;
  status: AssessmentStatus;
  frameworkId: string;
};


export type EvidenceQueryRequirementRecord = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: ComplianceRequirementCategory;
  authority: string | null;
  mandatory: boolean;
  weight: number;
  active: boolean;
};


export type EvidenceQueryDocumentRecord = {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  status: DocumentVerificationStatus;
  issuedAt: Date | null;
  expiresAt: Date | null;
  verifiedAt: Date | null;
  uploadedAt: Date;
  updatedAt: Date;
};


export type EvidenceQueryRecord = {
  id: string;
  title: string;
  fileUrl: string;
  assessmentId: string;
  documentId: string | null;
  requirementId: string | null;
  status: EvidenceVerificationStatus;
  verifiedAt: Date | null;
  verifiedById: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  assessment: EvidenceQueryAssessmentRecord;

  requirement:
    | EvidenceQueryRequirementRecord
    | null;

  document:
    | EvidenceQueryDocumentRecord
    | null;
};


export type EvidenceQuerySuccess = {
  success: true;
  evidence: EvidenceQueryRecord;
};


export type EvidenceCollectionQuerySuccess = {
  success: true;
  assessment: EvidenceQueryAssessmentRecord;
  evidence: EvidenceQueryRecord[];
  count: number;
};


export type EvidenceQueryFailure = {
  success: false;
  reason: EvidenceQueryFailureReason;
  message: string;
};


export type EvidenceQueryResult =
  | EvidenceQuerySuccess
  | EvidenceQueryFailure;


export type EvidenceCollectionQueryResult =
  | EvidenceCollectionQuerySuccess
  | EvidenceQueryFailure;


/*
 * ============================================================
 * PRISMA PROJECTION
 * ============================================================
 *
 * Keep the database projection explicit.
 *
 * Document.filePath is deliberately excluded from the public
 * query contract because storage infrastructure is not part of
 * the Compliance Evidence application read boundary.
 *
 * Internal organization/framework identifiers required for
 * integrity validation are selected but stripped before return.
 * ============================================================
 */

const evidenceQuerySelect = {
  id: true,
  title: true,
  fileUrl: true,
  assessmentId: true,
  documentId: true,
  requirementId: true,
  status: true,
  verifiedAt: true,
  verifiedById: true,
  notes: true,
  createdAt: true,
  updatedAt: true,

  assessment: {
    select: {
      id: true,
      title: true,
      score: true,
      status: true,
      organizationId: true,
      frameworkId: true,
    },
  },

  requirement: {
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      category: true,
      authority: true,
      mandatory: true,
      weight: true,
      active: true,
      frameworkId: true,
    },
  },

  document: {
    select: {
      id: true,
      documentType: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      status: true,
      issuedAt: true,
      expiresAt: true,
      verifiedAt: true,
      uploadedAt: true,
      updatedAt: true,
      organizationId: true,
    },
  },
} as const;


/*
 * ============================================================
 * INTERNAL QUERY RECORD
 * ============================================================
 */

type EvidenceQueryDatabaseRecord = {
  id: string;
  title: string;
  fileUrl: string;
  assessmentId: string;
  documentId: string | null;
  requirementId: string | null;
  status: EvidenceVerificationStatus;
  verifiedAt: Date | null;
  verifiedById: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  assessment: {
    id: string;
    title: string;
    score: number | null;
    status: AssessmentStatus;
    organizationId: string;
    frameworkId: string;
  };

  requirement: {
    id: string;
    code: string;
    title: string;
    description: string | null;
    category: ComplianceRequirementCategory;
    authority: string | null;
    mandatory: boolean;
    weight: number;
    active: boolean;
    frameworkId: string;
  } | null;

  document: {
    id: string;
    documentType: string;
    fileName: string;
    fileSize: number | null;
    mimeType: string | null;
    status: DocumentVerificationStatus;
    issuedAt: Date | null;
    expiresAt: Date | null;
    verifiedAt: Date | null;
    uploadedAt: Date;
    updatedAt: Date;
    organizationId: string;
  } | null;
};


/*
 * ============================================================
 * PURE INTEGRITY POLICY
 * ============================================================
 */

export function isEvidenceQueryTenantValid(
  organizationId: string,
  evidence: {
    assessmentOrganizationId: string;
    documentOrganizationId: string | null;
  }
): boolean {
  if (
    evidence.assessmentOrganizationId !==
    organizationId
  ) {
    return false;
  }

  if (
    evidence.documentOrganizationId !== null &&
    evidence.documentOrganizationId !==
      organizationId
  ) {
    return false;
  }

  return true;
}


export function isEvidenceQueryFrameworkValid(
  assessmentFrameworkId: string,
  requirementFrameworkId: string | null
): boolean {
  if (requirementFrameworkId === null) {
    return true;
  }

  return (
    requirementFrameworkId ===
    assessmentFrameworkId
  );
}


/*
 * ============================================================
 * SAFE PROJECTION
 * ============================================================
 */

function toEvidenceQueryRecord(
  evidence: EvidenceQueryDatabaseRecord
): EvidenceQueryRecord {
  return {
    id: evidence.id,
    title: evidence.title,
    fileUrl: evidence.fileUrl,
    assessmentId: evidence.assessmentId,
    documentId: evidence.documentId,
    requirementId: evidence.requirementId,
    status: evidence.status,
    verifiedAt: evidence.verifiedAt,
    verifiedById: evidence.verifiedById,
    notes: evidence.notes,
    createdAt: evidence.createdAt,
    updatedAt: evidence.updatedAt,

    assessment: {
      id: evidence.assessment.id,
      title: evidence.assessment.title,
      score: evidence.assessment.score,
      status: evidence.assessment.status,
      frameworkId:
        evidence.assessment.frameworkId,
    },

    requirement:
      evidence.requirement === null
        ? null
        : {
            id: evidence.requirement.id,
            code: evidence.requirement.code,
            title: evidence.requirement.title,
            description:
              evidence.requirement.description,
            category:
              evidence.requirement.category,
            authority:
              evidence.requirement.authority,
            mandatory:
              evidence.requirement.mandatory,
            weight:
              evidence.requirement.weight,
            active:
              evidence.requirement.active,
          },

    document:
      evidence.document === null
        ? null
        : {
            id: evidence.document.id,
            documentType:
              evidence.document.documentType,
            fileName:
              evidence.document.fileName,
            fileSize:
              evidence.document.fileSize,
            mimeType:
              evidence.document.mimeType,
            status:
              evidence.document.status,
            issuedAt:
              evidence.document.issuedAt,
            expiresAt:
              evidence.document.expiresAt,
            verifiedAt:
              evidence.document.verifiedAt,
            uploadedAt:
              evidence.document.uploadedAt,
            updatedAt:
              evidence.document.updatedAt,
          },
  };
}


/*
 * ============================================================
 * INTERNAL INTEGRITY CHECK
 * ============================================================
 */

function validateEvidenceQueryIntegrity(
  organizationId: string,
  evidence: EvidenceQueryDatabaseRecord
): EvidenceQueryFailure | null {
  const tenantValid =
    isEvidenceQueryTenantValid(
      organizationId,
      {
        assessmentOrganizationId:
          evidence.assessment.organizationId,

        documentOrganizationId:
          evidence.document?.organizationId ??
          null,
      }
    );

  if (!tenantValid) {
    return {
      success: false,
      reason: "EVIDENCE_ACCESS_DENIED",
      message:
        "Compliance Evidence contains a foreign organization relationship.",
    };
  }

  const frameworkValid =
    isEvidenceQueryFrameworkValid(
      evidence.assessment.frameworkId,
      evidence.requirement?.frameworkId ??
        null
    );

  if (!frameworkValid) {
    return {
      success: false,
      reason: "EVIDENCE_ACCESS_DENIED",
      message:
        "Compliance Evidence contains an invalid framework relationship.",
    };
  }

  return null;
}


/*
 * ============================================================
 * GET ONE EVIDENCE RECORD
 * ============================================================
 */

export async function getComplianceEvidence(
  context: OrganizationAccessContext,
  evidenceId: string
): Promise<EvidenceQueryResult> {
  if (
    !canReadComplianceEvidence(
      context.membership.role
    )
  ) {
    return {
      success: false,
      reason: "EVIDENCE_READ_FORBIDDEN",
      message:
        "The current organization membership cannot read Compliance Evidence.",
    };
  }

  try {
    const evidence =
      await prisma.evidence.findUnique({
        where: {
          id: evidenceId,
        },
        select: evidenceQuerySelect,
      });

    if (!evidence) {
      return {
        success: false,
        reason: "EVIDENCE_NOT_FOUND",
        message:
          "Compliance Evidence was not found.",
      };
    }

    const integrityFailure =
      validateEvidenceQueryIntegrity(
        context.organization.id,
        evidence
      );

    if (integrityFailure) {
      return integrityFailure;
    }

    return {
      success: true,
      evidence:
        toEvidenceQueryRecord(
          evidence
        ),
    };
  } catch {
    return {
      success: false,
      reason: "EVIDENCE_QUERY_FAILED",
      message:
        "Compliance Evidence could not be read.",
    };
  }
}


/*
 * ============================================================
 * LIST EVIDENCE FOR AN ASSESSMENT
 * ============================================================
 */

export async function listAssessmentComplianceEvidence(
  context: OrganizationAccessContext,
  assessmentId: string
): Promise<EvidenceCollectionQueryResult> {
  if (
    !canReadComplianceEvidence(
      context.membership.role
    )
  ) {
    return {
      success: false,
      reason: "EVIDENCE_READ_FORBIDDEN",
      message:
        "The current organization membership cannot read Compliance Evidence.",
    };
  }

  try {
    /*
     * Prove Assessment ownership before querying its Evidence.
     */
    const assessment =
      await prisma.assessment.findUnique({
        where: {
          id: assessmentId,
        },
        select: {
          id: true,
          title: true,
          score: true,
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
          "Assessment was not found.",
      };
    }

    if (
      assessment.organizationId !==
      context.organization.id
    ) {
      return {
        success: false,
        reason: "ASSESSMENT_ACCESS_DENIED",
        message:
          "Assessment does not belong to the authorized organization.",
      };
    }

    const evidence =
      await prisma.evidence.findMany({
        where: {
          assessmentId:
            assessment.id,
        },
        select:
          evidenceQuerySelect,
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "asc",
          },
        ],
      });

    /*
     * Evidence was selected through an authorized Assessment,
     * but linked Document and Requirement relationships are
     * validated defensively before any record is returned.
     */
    for (const item of evidence) {
      const integrityFailure =
        validateEvidenceQueryIntegrity(
          context.organization.id,
          item
        );

      if (integrityFailure) {
        return integrityFailure;
      }
    }

    const records =
      evidence.map(
        toEvidenceQueryRecord
      );

    return {
      success: true,

      assessment: {
        id: assessment.id,
        title: assessment.title,
        score: assessment.score,
        status: assessment.status,
        frameworkId:
          assessment.frameworkId,
      },

      evidence: records,

      count:
        records.length,
    };
  } catch {
    return {
      success: false,
      reason: "EVIDENCE_QUERY_FAILED",
      message:
        "Assessment Compliance Evidence could not be read.",
    };
  }
}
