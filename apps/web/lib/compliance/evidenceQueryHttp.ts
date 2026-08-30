import {
  NextResponse,
} from "next/server";

import type {
  EvidenceCollectionQueryResult,
  EvidenceQueryAssessmentRecord,
  EvidenceQueryDocumentRecord,
  EvidenceQueryFailure,
  EvidenceQueryRecord,
  EvidenceQueryRequirementRecord,
  EvidenceQueryResult,
} from "@/lib/compliance/evidenceQueryService";


/*
 * ============================================================
 * COMPLIANCEOS — EVIDENCE QUERY HTTP ADAPTER
 * ============================================================
 *
 * PURPOSE
 *
 * Translate the Evidence Query application's domain contracts
 * into safe HTTP responses.
 *
 * This adapter owns:
 *
 * - query-result serialization;
 * - Date → ISO string conversion;
 * - query failure → HTTP status mapping;
 * - query response envelopes.
 *
 * This adapter does NOT own:
 *
 * - authentication;
 * - organization resolution;
 * - role authorization;
 * - tenant integrity;
 * - framework integrity;
 * - Prisma reads;
 * - Evidence mutation;
 * - compliance recalculation;
 * - score persistence;
 * - Trust Score;
 * - Executive AI;
 * - Workflow progress.
 *
 * Organization-access failures continue to use the locked
 * Evidence HTTP organization-access translator.
 * ============================================================
 */


/*
 * ============================================================
 * SERIALIZED CONTRACTS
 * ============================================================
 */

export type SerializedEvidenceQueryAssessment = {
  id: string;
  title: string;
  score: number | null;
  status: EvidenceQueryAssessmentRecord["status"];
  frameworkId: string;
};


export type SerializedEvidenceQueryRequirement = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: EvidenceQueryRequirementRecord["category"];
  authority: string | null;
  mandatory: boolean;
  weight: number;
  active: boolean;
};


export type SerializedEvidenceQueryDocument = {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  status: EvidenceQueryDocumentRecord["status"];
  issuedAt: string | null;
  expiresAt: string | null;
  verifiedAt: string | null;
  uploadedAt: string;
  updatedAt: string;
};


export type SerializedEvidenceQueryRecord = {
  id: string;
  title: string;
  fileUrl: string;
  assessmentId: string;
  documentId: string | null;
  requirementId: string | null;
  status: EvidenceQueryRecord["status"];
  verifiedAt: string | null;
  verifiedById: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  assessment:
    SerializedEvidenceQueryAssessment;

  requirement:
    | SerializedEvidenceQueryRequirement
    | null;

  document:
    | SerializedEvidenceQueryDocument
    | null;
};


/*
 * ============================================================
 * SERIALIZATION
 * ============================================================
 */

function serializeAssessment(
  assessment: EvidenceQueryAssessmentRecord
): SerializedEvidenceQueryAssessment {
  return {
    id:
      assessment.id,

    title:
      assessment.title,

    score:
      assessment.score,

    status:
      assessment.status,

    frameworkId:
      assessment.frameworkId,
  };
}


function serializeRequirement(
  requirement: EvidenceQueryRequirementRecord
): SerializedEvidenceQueryRequirement {
  return {
    id:
      requirement.id,

    code:
      requirement.code,

    title:
      requirement.title,

    description:
      requirement.description,

    category:
      requirement.category,

    authority:
      requirement.authority,

    mandatory:
      requirement.mandatory,

    weight:
      requirement.weight,

    active:
      requirement.active,
  };
}


function serializeDocument(
  document: EvidenceQueryDocumentRecord
): SerializedEvidenceQueryDocument {
  return {
    id:
      document.id,

    documentType:
      document.documentType,

    fileName:
      document.fileName,

    fileSize:
      document.fileSize,

    mimeType:
      document.mimeType,

    status:
      document.status,

    issuedAt:
      document.issuedAt
        ? document.issuedAt.toISOString()
        : null,

    expiresAt:
      document.expiresAt
        ? document.expiresAt.toISOString()
        : null,

    verifiedAt:
      document.verifiedAt
        ? document.verifiedAt.toISOString()
        : null,

    uploadedAt:
      document.uploadedAt.toISOString(),

    updatedAt:
      document.updatedAt.toISOString(),
  };
}


export function serializeEvidenceQueryRecord(
  evidence: EvidenceQueryRecord
): SerializedEvidenceQueryRecord {
  return {
    id:
      evidence.id,

    title:
      evidence.title,

    fileUrl:
      evidence.fileUrl,

    assessmentId:
      evidence.assessmentId,

    documentId:
      evidence.documentId,

    requirementId:
      evidence.requirementId,

    status:
      evidence.status,

    verifiedAt:
      evidence.verifiedAt
        ? evidence.verifiedAt.toISOString()
        : null,

    verifiedById:
      evidence.verifiedById,

    notes:
      evidence.notes,

    createdAt:
      evidence.createdAt.toISOString(),

    updatedAt:
      evidence.updatedAt.toISOString(),

    assessment:
      serializeAssessment(
        evidence.assessment
      ),

    requirement:
      evidence.requirement
        ? serializeRequirement(
            evidence.requirement
          )
        : null,

    document:
      evidence.document
        ? serializeDocument(
            evidence.document
          )
        : null,
  };
}


/*
 * ============================================================
 * FAILURE → HTTP STATUS
 * ============================================================
 */

export function evidenceQueryFailureStatus(
  failure: EvidenceQueryFailure
): number {
  switch (failure.reason) {
    case "EVIDENCE_READ_FORBIDDEN":
    case "ASSESSMENT_ACCESS_DENIED":
    case "EVIDENCE_ACCESS_DENIED":
      return 403;

    case "ASSESSMENT_NOT_FOUND":
    case "EVIDENCE_NOT_FOUND":
      return 404;

    case "EVIDENCE_QUERY_FAILED":
      return 500;

    default: {
      const exhaustive:
        never =
          failure.reason;

      return exhaustive;
    }
  }
}


/*
 * ============================================================
 * SINGLE EVIDENCE RESPONSE
 * ============================================================
 */

export function evidenceQueryHttpResponse(
  result: EvidenceQueryResult
) {
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        reason:
          result.reason,
        message:
          result.message,
      },
      {
        status:
          evidenceQueryFailureStatus(
            result
          ),
      }
    );
  }

  return NextResponse.json(
    {
      success: true,

      evidence:
        serializeEvidenceQueryRecord(
          result.evidence
        ),
    },
    {
      status: 200,
    }
  );
}


/*
 * ============================================================
 * ASSESSMENT EVIDENCE COLLECTION RESPONSE
 * ============================================================
 */

export function evidenceCollectionQueryHttpResponse(
  result: EvidenceCollectionQueryResult
) {
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        reason:
          result.reason,
        message:
          result.message,
      },
      {
        status:
          evidenceQueryFailureStatus(
            result
          ),
      }
    );
  }

  return NextResponse.json(
    {
      success: true,

      assessment:
        serializeAssessment(
          result.assessment
        ),

      evidence:
        result.evidence.map(
          serializeEvidenceQueryRecord
        ),

      count:
        result.count,
    },
    {
      status: 200,
    }
  );
}
