import {
  DocumentVerificationStatus,
  EvidenceVerificationStatus,
} from "@prisma/client";

import type {
  ComplianceEvidenceInput,
} from "@/lib/compliance/complianceEngine";

/*
 * ============================================================
 * COMPLIANCEOS — COMPLIANCE EVIDENCE INTEGRITY
 * ============================================================
 *
 * PURPOSE
 *
 * This module validates and normalizes database evidence before
 * that evidence is allowed into the deterministic compliance
 * scoring engine.
 *
 * It contains no Prisma queries and performs no database writes.
 *
 * SECURITY / INTEGRITY RULES
 *
 * 1. Every linked Document must belong to the authorized
 *    Organization, including Documents attached to unmapped
 *    Evidence.
 *
 * 2. Evidence without requirementId remains valid evidence data
 *    but is not requirement-scored.
 *
 * 3. A non-null requirementId must belong to the Assessment
 *    Framework. Active/inactive scoring policy is handled by
 *    the calculation service.
 *
 * 4. A linked Document that is pending, rejected, expired, or
 *    past expiresAt cannot support VERIFIED compliance.
 *
 * ============================================================
 */

export type ComplianceIntegrityFailureReason =
  | "INVALID_EVIDENCE_REQUIREMENT"
  | "INVALID_EVIDENCE_DOCUMENT";

export interface ComplianceEvidenceRecord {
  id: string;

  requirementId:
    | string
    | null;

  status:
    EvidenceVerificationStatus;

  verifiedAt:
    | Date
    | null;

  createdAt:
    Date;

  document:
    | {
        id: string;

        organizationId:
          string;

        status:
          DocumentVerificationStatus;

        expiresAt:
          | Date
          | null;
      }
    | null;
}

export type NormalizeComplianceEvidenceResult =
  | {
      success: true;

      evidence:
        ComplianceEvidenceInput[];
    }
  | {
      success: false;

      reason:
        ComplianceIntegrityFailureReason;

      message:
        string;
    };

/*
 * ============================================================
 * EFFECTIVE EVIDENCE STATUS
 * ============================================================
 */

export function getEffectiveEvidenceStatus(input: {
  evidenceStatus:
    EvidenceVerificationStatus;

  documentStatus:
    | DocumentVerificationStatus
    | null;

  documentExpiresAt:
    | Date
    | null;

  now:
    Date;
}): EvidenceVerificationStatus {
  const {
    evidenceStatus,
    documentStatus,
    documentExpiresAt,
    now,
  } = input;

  /*
   * Evidence may exist independently from Document storage.
   */

  if (documentStatus === null) {
    return evidenceStatus;
  }

  /*
   * Calendar expiry takes precedence over a stale persisted
   * Document status.
   */

  if (
    documentExpiresAt &&
    documentExpiresAt.getTime() <=
      now.getTime()
  ) {
    return EvidenceVerificationStatus.EXPIRED;
  }

  if (
    documentStatus ===
    DocumentVerificationStatus.REJECTED
  ) {
    return EvidenceVerificationStatus.REJECTED;
  }

  if (
    documentStatus ===
    DocumentVerificationStatus.EXPIRED
  ) {
    return EvidenceVerificationStatus.EXPIRED;
  }

  /*
   * Pending supporting documentation cannot produce verified
   * regulatory evidence.
   */

  if (
    documentStatus ===
    DocumentVerificationStatus.PENDING
  ) {
    return EvidenceVerificationStatus.PENDING;
  }

  /*
   * At this point the linked Document is VERIFIED.
   *
   * Evidence.status still determines whether that Document has
   * been accepted as evidence for the requirement.
   */

  return evidenceStatus;
}

/*
 * ============================================================
 * NORMALIZE COMPLIANCE EVIDENCE
 * ============================================================
 */

export function normalizeComplianceEvidence(input: {
  organizationId:
    string;

  validRequirementIds:
    ReadonlySet<string>;

  evidence:
    ComplianceEvidenceRecord[];

  now?:
    Date;
}): NormalizeComplianceEvidenceResult {
  const {
    organizationId,
    validRequirementIds,
    evidence,
  } = input;

  const now =
    input.now ??
    new Date();

  const normalized:
    ComplianceEvidenceInput[] = [];

  for (const item of evidence) {
    /*
     * Tenant integrity applies to every linked Document.
     *
     * This check deliberately occurs before requirement mapping
     * so unmapped Evidence cannot conceal a cross-Organization
     * Document relationship.
     */

    if (
      item.document &&
      item.document.organizationId !==
        organizationId
    ) {
      return {
        success: false,

        reason:
          "INVALID_EVIDENCE_DOCUMENT",

        message:
          "Compliance evidence references a document outside the authorized organisation.",
      };
    }

    /*
     * requirementId is intentionally nullable in the current
     * schema.
     *
     * Unmapped Evidence remains valid evidence data but does not
     * participate in requirement scoring.
     */

    if (!item.requirementId) {
      continue;
    }

    /*
     * A mapped Requirement must belong to the Assessment
     * Framework.
     *
     * validRequirementIds contains all Requirements belonging to
     * that Framework, including inactive Requirements.
     *
     * Current scoring eligibility is handled separately by the
     * calculation service.
     */

    if (
      !validRequirementIds.has(
        item.requirementId
      )
    ) {
      return {
        success: false,

        reason:
          "INVALID_EVIDENCE_REQUIREMENT",

        message:
          "Compliance evidence references a requirement outside the assessment framework.",
      };
    }

    const effectiveStatus =
      getEffectiveEvidenceStatus({
        evidenceStatus:
          item.status,

        documentStatus:
          item.document?.status ??
          null,

        documentExpiresAt:
          item.document?.expiresAt ??
          null,

        now,
      });

    normalized.push({
      id:
        item.id,

      requirementId:
        item.requirementId,

      status:
        effectiveStatus,

      verifiedAt:
        item.verifiedAt,

      createdAt:
        item.createdAt,
    });
  }

  return {
    success: true,
    evidence: normalized,
  };
}
