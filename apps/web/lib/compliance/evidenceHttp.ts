import {
  NextResponse,
} from "next/server";

import {
  EvidenceVerificationStatus,
} from "@prisma/client";

import type {
  OrganizationAccessFailureReason,
} from "@/lib/auth/organizationAccess";

import type {
  CreateEvidenceInput,
  EvidenceMutationFailure,
  EvidenceMutationRecord,
  EvidenceMutationResult,
  EvidenceVerificationDecision,
  UpdatePendingEvidenceInput,
} from "@/lib/compliance/evidenceMutationService";


/*
 * ============================================================
 * COMPLIANCEOS — EVIDENCE HTTP ADAPTER
 * ============================================================
 *
 * PURPOSE
 *
 * This module translates between the untrusted HTTP boundary
 * and the locked Evidence Mutation domain boundary.
 *
 * It owns:
 *
 * - request-shape validation
 * - primitive HTTP input normalization
 * - organization-access HTTP responses
 * - Evidence domain-result HTTP translation
 * - Evidence JSON serialization
 *
 * It does NOT own:
 *
 * - authentication
 * - organization resolution
 * - Evidence persistence
 * - compliance calculations
 * - verification authority
 * - recalculation orchestration
 * - Trust Score
 * - Executive AI
 * - workflow state
 *
 * The locked Evidence Mutation service remains authoritative
 * for compliance mutation semantics.
 * ============================================================
 */


/*
 * ============================================================
 * GENERIC HTTP TYPES
 * ============================================================
 */

type UnknownRecord =
  Record<string, unknown>;

export type EvidenceHttpValidationSuccess<T> = {
  success: true;
  value: T;
};

export type EvidenceHttpValidationFailure = {
  success: false;
  message: string;
};

export type EvidenceHttpValidationResult<T> =
  | EvidenceHttpValidationSuccess<T>
  | EvidenceHttpValidationFailure;


/*
 * ============================================================
 * REQUEST BODY CONTRACTS
 * ============================================================
 */

export type EvidenceDecisionHttpInput = {
  decision: EvidenceVerificationDecision;
  notes?: string | null;
};


/*
 * ============================================================
 * BASIC VALUE HELPERS
 * ============================================================
 */

function isRecord(
  value: unknown
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}


function isNullableString(
  value: unknown
): value is string | null {
  return (
    value === null ||
    typeof value === "string"
  );
}


function hasOwn(
  value: UnknownRecord,
  key: string
): boolean {
  return Object.prototype.hasOwnProperty.call(
    value,
    key
  );
}


/*
 * ============================================================
 * CREATE INPUT VALIDATION
 * ============================================================
 */

export function validateCreateEvidenceHttpInput(
  body: unknown
): EvidenceHttpValidationResult<CreateEvidenceInput> {
  if (!isRecord(body)) {
    return {
      success: false,
      message: "Invalid request body.",
    };
  }

  if (
    !isNonEmptyString(
      body.assessmentId
    )
  ) {
    return {
      success: false,
      message:
        "assessmentId is required.",
    };
  }

  if (
    !isNonEmptyString(
      body.title
    )
  ) {
    return {
      success: false,
      message:
        "title is required.",
    };
  }

  if (
    !isNonEmptyString(
      body.fileUrl
    )
  ) {
    return {
      success: false,
      message:
        "fileUrl is required.",
    };
  }

  if (
    hasOwn(body, "requirementId") &&
    body.requirementId !== undefined &&
    !isNullableString(
      body.requirementId
    )
  ) {
    return {
      success: false,
      message:
        "requirementId must be a string or null.",
    };
  }

  if (
    typeof body.requirementId === "string" &&
    body.requirementId.trim().length === 0
  ) {
    return {
      success: false,
      message:
        "requirementId cannot be empty.",
    };
  }

  if (
    hasOwn(body, "documentId") &&
    body.documentId !== undefined &&
    !isNullableString(
      body.documentId
    )
  ) {
    return {
      success: false,
      message:
        "documentId must be a string or null.",
    };
  }

  if (
    typeof body.documentId === "string" &&
    body.documentId.trim().length === 0
  ) {
    return {
      success: false,
      message:
        "documentId cannot be empty.",
    };
  }

  if (
    hasOwn(body, "notes") &&
    body.notes !== undefined &&
    !isNullableString(
      body.notes
    )
  ) {
    return {
      success: false,
      message:
        "notes must be a string or null.",
    };
  }

  const input: CreateEvidenceInput = {
    assessmentId:
      body.assessmentId.trim(),

    title:
      body.title.trim(),

    fileUrl:
      body.fileUrl.trim(),
  };

  if (
    hasOwn(body, "requirementId") &&
    body.requirementId !== undefined
  ) {
    const requirementId =
      body.requirementId;

    input.requirementId =
      requirementId === null
        ? null
        : typeof requirementId === "string"
          ? requirementId.trim()
          : undefined;
  }

  if (
    hasOwn(body, "documentId") &&
    body.documentId !== undefined
  ) {
    const documentId =
      body.documentId;

    input.documentId =
      documentId === null
        ? null
        : typeof documentId === "string"
          ? documentId.trim()
          : undefined;
  }

  if (
    hasOwn(body, "notes") &&
    body.notes !== undefined
  ) {
    const notes =
      body.notes;

    input.notes =
      notes === null
        ? null
        : typeof notes === "string"
          ? notes
          : undefined;
  }

  return {
    success: true,
    value: input,
  };
}


/*
 * ============================================================
 * UPDATE INPUT VALIDATION
 * ============================================================
 */

export function validateUpdateEvidenceHttpInput(
  body: unknown
): EvidenceHttpValidationResult<UpdatePendingEvidenceInput> {
  if (!isRecord(body)) {
    return {
      success: false,
      message: "Invalid request body.",
    };
  }

  const allowedKeys =
    new Set([
      "title",
      "fileUrl",
      "requirementId",
      "documentId",
      "notes",
    ]);

  const suppliedKeys =
    Object.keys(body);

  if (
    suppliedKeys.some(
      (key) => !allowedKeys.has(key)
    )
  ) {
    return {
      success: false,
      message:
        "Request body contains unsupported fields.",
    };
  }

  if (
    suppliedKeys.length === 0
  ) {
    return {
      success: false,
      message:
        "At least one evidence field must be supplied.",
    };
  }

  if (
    hasOwn(body, "title") &&
    !isNonEmptyString(
      body.title
    )
  ) {
    return {
      success: false,
      message:
        "title must be a non-empty string.",
    };
  }

  if (
    hasOwn(body, "fileUrl") &&
    !isNonEmptyString(
      body.fileUrl
    )
  ) {
    return {
      success: false,
      message:
        "fileUrl must be a non-empty string.",
    };
  }

  if (
    hasOwn(body, "requirementId") &&
    !isNullableString(
      body.requirementId
    )
  ) {
    return {
      success: false,
      message:
        "requirementId must be a string or null.",
    };
  }

  if (
    typeof body.requirementId === "string" &&
    body.requirementId.trim().length === 0
  ) {
    return {
      success: false,
      message:
        "requirementId cannot be empty.",
    };
  }

  if (
    hasOwn(body, "documentId") &&
    !isNullableString(
      body.documentId
    )
  ) {
    return {
      success: false,
      message:
        "documentId must be a string or null.",
    };
  }

  if (
    typeof body.documentId === "string" &&
    body.documentId.trim().length === 0
  ) {
    return {
      success: false,
      message:
        "documentId cannot be empty.",
    };
  }

  if (
    hasOwn(body, "notes") &&
    !isNullableString(
      body.notes
    )
  ) {
    return {
      success: false,
      message:
        "notes must be a string or null.",
    };
  }

  const input:
    UpdatePendingEvidenceInput = {};

  if (hasOwn(body, "title")) {
    input.title =
      (
        body.title as string
      ).trim();
  }

  if (hasOwn(body, "fileUrl")) {
    input.fileUrl =
      (
        body.fileUrl as string
      ).trim();
  }

  if (
    hasOwn(body, "requirementId")
  ) {
    input.requirementId =
      body.requirementId === null
        ? null
        : (
            body.requirementId as string
          ).trim();
  }

  if (
    hasOwn(body, "documentId")
  ) {
    input.documentId =
      body.documentId === null
        ? null
        : (
            body.documentId as string
          ).trim();
  }

  if (hasOwn(body, "notes")) {
    input.notes =
      body.notes as string | null;
  }

  return {
    success: true,
    value: input,
  };
}


/*
 * ============================================================
 * DECISION INPUT VALIDATION
 * ============================================================
 */

export function validateEvidenceDecisionHttpInput(
  body: unknown
): EvidenceHttpValidationResult<EvidenceDecisionHttpInput> {
  if (!isRecord(body)) {
    return {
      success: false,
      message: "Invalid request body.",
    };
  }

  const allowedKeys =
    new Set([
      "decision",
      "notes",
    ]);

  if (
    Object.keys(body).some(
      (key) => !allowedKeys.has(key)
    )
  ) {
    return {
      success: false,
      message:
        "Request body contains unsupported fields.",
    };
  }

  if (
    body.decision !==
      EvidenceVerificationStatus.VERIFIED &&
    body.decision !==
      EvidenceVerificationStatus.REJECTED
  ) {
    return {
      success: false,
      message:
        "decision must be VERIFIED or REJECTED.",
    };
  }

  if (
    hasOwn(body, "notes") &&
    !isNullableString(
      body.notes
    )
  ) {
    return {
      success: false,
      message:
        "notes must be a string or null.",
    };
  }

  const input:
    EvidenceDecisionHttpInput = {
      decision:
        body.decision,
    };

  if (hasOwn(body, "notes")) {
    input.notes =
      body.notes as string | null;
  }

  return {
    success: true,
    value: input,
  };
}


/*
 * ============================================================
 * ORGANIZATION ACCESS FAILURE
 * ============================================================
 */

export function evidenceOrganizationAccessFailure(
  reason: OrganizationAccessFailureReason
) {
  const unauthenticated =
    reason === "MISSING_TOKEN" ||
    reason === "INVALID_TOKEN" ||
    reason === "INVALID_IDENTITY" ||
    reason === "USER_NOT_FOUND";

  return NextResponse.json(
    {
      success: false,

      message:
        unauthenticated
          ? "Unauthorized"
          : "Organisation access denied.",

      reason,
    },
    {
      status:
        unauthenticated
          ? 401
          : 403,
    }
  );
}


/*
 * ============================================================
 * EVIDENCE SERIALIZATION
 * ============================================================
 */

export function serializeEvidenceMutationRecord(
  evidence: EvidenceMutationRecord
) {
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
  };
}


/*
 * ============================================================
 * DOMAIN FAILURE → HTTP STATUS
 * ============================================================
 */

export function evidenceMutationFailureStatus(
  failure: EvidenceMutationFailure
): number {
  switch (failure.reason) {
    case "EVIDENCE_WRITE_FORBIDDEN":
    case "EVIDENCE_VERIFICATION_FORBIDDEN":
    case "ASSESSMENT_ACCESS_DENIED":
    case "DOCUMENT_ACCESS_DENIED":
    case "EVIDENCE_ACCESS_DENIED":
      return 403;

    case "ASSESSMENT_NOT_FOUND":
    case "REQUIREMENT_NOT_FOUND":
    case "DOCUMENT_NOT_FOUND":
    case "EVIDENCE_NOT_FOUND":
      return 404;

    case "REQUIREMENT_FRAMEWORK_MISMATCH":
    case "EVIDENCE_NOT_PENDING":
    case "INVALID_EVIDENCE_STATUS":
    case "EVIDENCE_CHANGED_DURING_MUTATION":
      return 409;

    case "MUTATION_COMMITTED_RECALCULATION_FAILED":
      return 503;

    case "EVIDENCE_MUTATION_FAILED":
    default:
      return 500;
  }
}


/*
 * ============================================================
 * DOMAIN RESULT → HTTP RESPONSE
 * ============================================================
 */

export function evidenceMutationHttpResponse(
  result: EvidenceMutationResult,
  successStatus = 200
) {
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,

        message:
          result.message,

        reason:
          result.reason,

        mutationCommitted:
          result.mutationCommitted,
      },
      {
        status:
          evidenceMutationFailureStatus(
            result
          ),
      }
    );
  }

  return NextResponse.json(
    {
      success: true,

      evidence:
        serializeEvidenceMutationRecord(
          result.evidence
        ),

      recalculated:
        result.recalculated,
    },
    {
      status:
        successStatus,
    }
  );
}


/*
 * ============================================================
 * INVALID REQUEST RESPONSE
 * ============================================================
 */

export function invalidEvidenceRequest(
  message = "Invalid request body."
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status: 400,
    }
  );
}
