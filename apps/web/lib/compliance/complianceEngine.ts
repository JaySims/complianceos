import {
  EvidenceVerificationStatus,
} from "@prisma/client";

/*
 * ============================================================
 * COMPLIANCEOS — EVIDENCE-DRIVEN COMPLIANCE ENGINE
 * ============================================================
 *
 * PURPOSE
 *
 * This module is the deterministic compliance calculation
 * domain for ComplianceOS.
 *
 * It does not:
 * - query the database
 * - mutate the database
 * - authorize users
 * - upload documents
 * - verify evidence
 * - calculate Digital Trust
 *
 * It receives requirements and evidence that have already
 * passed the appropriate organization/security boundary and
 * derives compliance state from them.
 *
 * SOURCE OF TRUTH
 *
 * ComplianceRequirement
 *        ↓
 * Evidence
 *        ↓
 * EvidenceVerificationStatus
 *        ↓
 * Requirement Status
 *        ↓
 * Weighted Compliance Score
 *
 * A workflow checkbox is NOT compliance evidence.
 * A document upload alone is NOT compliance evidence.
 *
 * Only VERIFIED evidence satisfies a requirement.
 * ============================================================
 */

export type RequirementComplianceStatus =
  | "MISSING"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export interface ComplianceRequirementInput {
  id: string;
  code: string;
  title: string;
  mandatory: boolean;
  weight: number;
  active: boolean;
}

export interface ComplianceEvidenceInput {
  id: string;
  requirementId: string | null;
  status: EvidenceVerificationStatus;
  verifiedAt?: Date | null;
  createdAt?: Date;
}

export interface RequirementComplianceResult {
  requirementId: string;
  code: string;
  title: string;
  mandatory: boolean;
  weight: number;
  status: RequirementComplianceStatus;
  evidenceCount: number;
  verifiedEvidenceCount: number;
  earnedWeight: number;
}

export interface ComplianceScoreResult {
  score: number;
  earnedWeight: number;
  totalWeight: number;

  totalRequirements: number;
  verifiedRequirements: number;
  pendingRequirements: number;
  missingRequirements: number;
  rejectedRequirements: number;
  expiredRequirements: number;

  mandatoryRequirements: number;
  verifiedMandatoryRequirements: number;
  mandatoryRequirementsSatisfied: boolean;

  requirements: RequirementComplianceResult[];
}

/*
 * ============================================================
 * NORMALIZATION
 * ============================================================
 */

function normalizeWeight(weight: number): number {
  if (!Number.isFinite(weight)) {
    return 0;
  }

  return Math.max(0, weight);
}

/*
 * ============================================================
 * REQUIREMENT STATUS
 * ============================================================
 *
 * Status precedence:
 *
 * 1. VERIFIED
 * 2. PENDING
 * 3. REJECTED
 * 4. EXPIRED
 * 5. MISSING
 *
 * VERIFIED has the highest authority because one valid,
 * verified piece of evidence is sufficient to satisfy the
 * requirement even if older evidence was rejected or expired.
 *
 * PENDING outranks negative historical evidence because there
 * is currently evidence awaiting a verification decision.
 *
 * MISSING means no evidence exists for the requirement.
 * ============================================================
 */

export function deriveRequirementStatus(
  evidence: ComplianceEvidenceInput[]
): RequirementComplianceStatus {
  if (evidence.length === 0) {
    return "MISSING";
  }

  if (
    evidence.some(
      (item) =>
        item.status ===
        EvidenceVerificationStatus.VERIFIED
    )
  ) {
    return "VERIFIED";
  }

  if (
    evidence.some(
      (item) =>
        item.status ===
        EvidenceVerificationStatus.PENDING
    )
  ) {
    return "PENDING";
  }

  if (
    evidence.some(
      (item) =>
        item.status ===
        EvidenceVerificationStatus.REJECTED
    )
  ) {
    return "REJECTED";
  }

  if (
    evidence.some(
      (item) =>
        item.status ===
        EvidenceVerificationStatus.EXPIRED
    )
  ) {
    return "EXPIRED";
  }

  return "MISSING";
}

/*
 * ============================================================
 * REQUIREMENT EVALUATION
 * ============================================================
 */

export function evaluateRequirement(
  requirement: ComplianceRequirementInput,
  evidence: ComplianceEvidenceInput[]
): RequirementComplianceResult {
  const requirementEvidence =
    evidence.filter(
      (item) =>
        item.requirementId === requirement.id
    );

  const status =
    deriveRequirementStatus(
      requirementEvidence
    );

  const weight =
    normalizeWeight(
      requirement.weight
    );

  const verifiedEvidenceCount =
    requirementEvidence.filter(
      (item) =>
        item.status ===
        EvidenceVerificationStatus.VERIFIED
    ).length;

  return {
    requirementId:
      requirement.id,

    code:
      requirement.code,

    title:
      requirement.title,

    mandatory:
      requirement.mandatory,

    weight,

    status,

    evidenceCount:
      requirementEvidence.length,

    verifiedEvidenceCount,

    earnedWeight:
      status === "VERIFIED"
        ? weight
        : 0,
  };
}

/*
 * ============================================================
 * COMPLIANCE SCORE
 * ============================================================
 *
 * Formula:
 *
 *      verified requirement weight
 * ------------------------------------- × 100
 *       total active requirement weight
 *
 * PENDING, REJECTED, EXPIRED and MISSING requirements earn
 * zero compliance weight.
 *
 * This intentionally avoids awarding regulatory compliance
 * merely because evidence has been uploaded.
 * ============================================================
 */

export function calculateEvidenceCompliance(
  requirements: ComplianceRequirementInput[],
  evidence: ComplianceEvidenceInput[]
): ComplianceScoreResult {
  const activeRequirements =
    requirements.filter(
      (requirement) =>
        requirement.active
    );

  const evaluatedRequirements =
    activeRequirements.map(
      (requirement) =>
        evaluateRequirement(
          requirement,
          evidence
        )
    );

  const totalWeight =
    evaluatedRequirements.reduce(
      (total, requirement) =>
        total + requirement.weight,
      0
    );

  const earnedWeight =
    evaluatedRequirements.reduce(
      (total, requirement) =>
        total + requirement.earnedWeight,
      0
    );

  const score =
    totalWeight > 0
      ? Math.round(
          (earnedWeight / totalWeight) *
            100
        )
      : 0;

  const verifiedRequirements =
    evaluatedRequirements.filter(
      (requirement) =>
        requirement.status ===
        "VERIFIED"
    ).length;

  const pendingRequirements =
    evaluatedRequirements.filter(
      (requirement) =>
        requirement.status ===
        "PENDING"
    ).length;

  const missingRequirements =
    evaluatedRequirements.filter(
      (requirement) =>
        requirement.status ===
        "MISSING"
    ).length;

  const rejectedRequirements =
    evaluatedRequirements.filter(
      (requirement) =>
        requirement.status ===
        "REJECTED"
    ).length;

  const expiredRequirements =
    evaluatedRequirements.filter(
      (requirement) =>
        requirement.status ===
        "EXPIRED"
    ).length;

  const mandatory =
    evaluatedRequirements.filter(
      (requirement) =>
        requirement.mandatory
    );

  const verifiedMandatoryRequirements =
    mandatory.filter(
      (requirement) =>
        requirement.status ===
        "VERIFIED"
    ).length;

  return {
    score,

    earnedWeight,
    totalWeight,

    totalRequirements:
      evaluatedRequirements.length,

    verifiedRequirements,
    pendingRequirements,
    missingRequirements,
    rejectedRequirements,
    expiredRequirements,

    mandatoryRequirements:
      mandatory.length,

    verifiedMandatoryRequirements,

    mandatoryRequirementsSatisfied:
      mandatory.length ===
      verifiedMandatoryRequirements,

    requirements:
      evaluatedRequirements,
  };
}
