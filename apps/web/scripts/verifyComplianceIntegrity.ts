import {
  DocumentVerificationStatus,
  EvidenceVerificationStatus,
} from "@prisma/client";

import {
  calculateEvidenceCompliance,
  type ComplianceRequirementInput,
} from "../lib/compliance/complianceEngine";

import {
  getEffectiveEvidenceStatus,
  normalizeComplianceEvidence,
  type ComplianceEvidenceRecord,
} from "../lib/compliance/complianceIntegrity";

/*
 * ============================================================
 * COMPLIANCEOS — COMPLIANCE INTEGRITY VERIFICATION
 * ============================================================
 *
 * PURPOSE
 *
 * Prove the evidence integrity boundary independently from the
 * production database.
 *
 * This script:
 *
 * - performs no Prisma queries
 * - performs no database writes
 * - creates no production records
 * - installs no testing framework
 *
 * It verifies:
 *
 * - Organization / Document tenant integrity
 * - Assessment Framework / Requirement integrity
 * - unmapped Evidence behavior
 * - Document verification-state authority
 * - calendar expiry behavior
 * - expiry boundary behavior
 * - Evidence state preservation
 * - inactive same-Framework Requirement behavior
 *
 * ============================================================
 */

function assertEqual<T>(
  actual: T,
  expected: T,
  label: string
): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${String(expected)}, received ${String(actual)}`
    );
  }

  console.log(`✓ ${label}`);
}

const NOW =
  new Date(
    "2026-08-28T07:00:00.000Z"
  );

const ORGANIZATION_ID =
  "organization-a";

const VALID_REQUIREMENT_ID =
  "requirement-a";

const INACTIVE_REQUIREMENT_ID =
  "requirement-inactive";

const VALID_REQUIREMENTS =
  new Set<string>([
    VALID_REQUIREMENT_ID,
    INACTIVE_REQUIREMENT_ID,
  ]);

function record(input: {
  id?: string;

  requirementId?:
    | string
    | null;

  evidenceStatus?:
    EvidenceVerificationStatus;

  documentOrganizationId?:
    string;

  documentStatus?:
    DocumentVerificationStatus;

  expiresAt?:
    Date
    | null;

  withDocument?:
    boolean;
} = {}): ComplianceEvidenceRecord {
  const withDocument =
    input.withDocument ??
    true;

  return {
    id:
      input.id ??
      "evidence-1",

    requirementId:
      input.requirementId === undefined
        ? VALID_REQUIREMENT_ID
        : input.requirementId,

    status:
      input.evidenceStatus ??
      EvidenceVerificationStatus.VERIFIED,

    verifiedAt:
      NOW,

    createdAt:
      NOW,

    document:
      withDocument
        ? {
            id:
              "document-1",

            organizationId:
              input.documentOrganizationId ??
              ORGANIZATION_ID,

            status:
              input.documentStatus ??
              DocumentVerificationStatus.VERIFIED,

            expiresAt:
              input.expiresAt === undefined
                ? null
                : input.expiresAt,
          }
        : null,
  };
}

console.log(
  "============================================================"
);
console.log(
  " COMPLIANCEOS — EVIDENCE INTEGRITY TEST"
);
console.log(
  "============================================================"
);

/*
 * ============================================================
 * TEST 1
 * Verified Evidence + verified valid Document.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 1: VERIFIED VALID DOCUMENT ====="
);

const valid =
  normalizeComplianceEvidence({
    organizationId:
      ORGANIZATION_ID,

    validRequirementIds:
      VALID_REQUIREMENTS,

    evidence: [
      record(),
    ],

    now:
      NOW,
  });

assertEqual(
  valid.success,
  true,
  "Valid evidence passes integrity validation"
);

if (!valid.success) {
  throw new Error(
    "Valid evidence unexpectedly failed."
  );
}

assertEqual(
  valid.evidence.length,
  1,
  "Valid evidence enters calculation"
);

assertEqual(
  valid.evidence[0].status,
  EvidenceVerificationStatus.VERIFIED,
  "Verified evidence remains VERIFIED"
);

/*
 * ============================================================
 * TEST 2
 * Cross-tenant Document.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 2: CROSS-TENANT DOCUMENT ====="
);

const foreignDocument =
  normalizeComplianceEvidence({
    organizationId:
      ORGANIZATION_ID,

    validRequirementIds:
      VALID_REQUIREMENTS,

    evidence: [
      record({
        documentOrganizationId:
          "organization-b",
      }),
    ],

    now:
      NOW,
  });

assertEqual(
  foreignDocument.success,
  false,
  "Foreign organization document is rejected"
);

if (foreignDocument.success) {
  throw new Error(
    "Cross-tenant document unexpectedly passed."
  );
}

assertEqual(
  foreignDocument.reason,
  "INVALID_EVIDENCE_DOCUMENT",
  "Cross-tenant failure has explicit reason"
);

/*
 * ============================================================
 * TEST 3
 * Requirement outside Assessment Framework.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 3: FOREIGN FRAMEWORK REQUIREMENT ====="
);

const foreignRequirement =
  normalizeComplianceEvidence({
    organizationId:
      ORGANIZATION_ID,

    validRequirementIds:
      VALID_REQUIREMENTS,

    evidence: [
      record({
        requirementId:
          "requirement-from-another-framework",
      }),
    ],

    now:
      NOW,
  });

assertEqual(
  foreignRequirement.success,
  false,
  "Foreign framework requirement is rejected"
);

if (foreignRequirement.success) {
  throw new Error(
    "Foreign framework requirement unexpectedly passed."
  );
}

assertEqual(
  foreignRequirement.reason,
  "INVALID_EVIDENCE_REQUIREMENT",
  "Framework integrity failure has explicit reason"
);

/*
 * ============================================================
 * TEST 4
 * Unmapped Evidence.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 4: UNMAPPED EVIDENCE ====="
);

const unmapped =
  normalizeComplianceEvidence({
    organizationId:
      ORGANIZATION_ID,

    validRequirementIds:
      VALID_REQUIREMENTS,

    evidence: [
      record({
        requirementId:
          null,
      }),
    ],

    now:
      NOW,
  });

assertEqual(
  unmapped.success,
  true,
  "Unmapped evidence is not treated as corruption"
);

if (!unmapped.success) {
  throw new Error(
    "Unmapped evidence unexpectedly failed."
  );
}

assertEqual(
  unmapped.evidence.length,
  0,
  "Unmapped evidence is excluded from requirement scoring"
);

/*
 * ============================================================
 * TEST 4B
 * Unmapped Evidence must not conceal a cross-tenant Document.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 4B: UNMAPPED CROSS-TENANT DOCUMENT ====="
);

const unmappedForeignDocument =
  normalizeComplianceEvidence({
    organizationId:
      ORGANIZATION_ID,

    validRequirementIds:
      VALID_REQUIREMENTS,

    evidence: [
      record({
        requirementId:
          null,

        documentOrganizationId:
          "organization-b",
      }),
    ],

    now:
      NOW,
  });

assertEqual(
  unmappedForeignDocument.success,
  false,
  "Unmapped evidence cannot conceal a foreign organization document"
);

if (unmappedForeignDocument.success) {
  throw new Error(
    "Unmapped cross-tenant document unexpectedly passed."
  );
}

assertEqual(
  unmappedForeignDocument.reason,
  "INVALID_EVIDENCE_DOCUMENT",
  "Unmapped cross-tenant evidence has explicit failure reason"
);

/*
 * ============================================================
 * TEST 5
 * Pending Document.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 5: PENDING DOCUMENT ====="
);

const pendingDocument =
  getEffectiveEvidenceStatus({
    evidenceStatus:
      EvidenceVerificationStatus.VERIFIED,

    documentStatus:
      DocumentVerificationStatus.PENDING,

    documentExpiresAt:
      null,

    now:
      NOW,
  });

assertEqual(
  pendingDocument,
  EvidenceVerificationStatus.PENDING,
  "Pending document prevents VERIFIED compliance"
);

/*
 * ============================================================
 * TEST 6
 * Rejected Document.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 6: REJECTED DOCUMENT ====="
);

const rejectedDocument =
  getEffectiveEvidenceStatus({
    evidenceStatus:
      EvidenceVerificationStatus.VERIFIED,

    documentStatus:
      DocumentVerificationStatus.REJECTED,

    documentExpiresAt:
      null,

    now:
      NOW,
  });

assertEqual(
  rejectedDocument,
  EvidenceVerificationStatus.REJECTED,
  "Rejected document invalidates VERIFIED evidence"
);

/*
 * ============================================================
 * TEST 7
 * Explicitly expired Document.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 7: EXPIRED DOCUMENT STATUS ====="
);

const expiredDocument =
  getEffectiveEvidenceStatus({
    evidenceStatus:
      EvidenceVerificationStatus.VERIFIED,

    documentStatus:
      DocumentVerificationStatus.EXPIRED,

    documentExpiresAt:
      null,

    now:
      NOW,
  });

assertEqual(
  expiredDocument,
  EvidenceVerificationStatus.EXPIRED,
  "Expired document invalidates VERIFIED evidence"
);

/*
 * ============================================================
 * TEST 8
 * Calendar-expired Document whose stored status is VERIFIED.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 8: CALENDAR EXPIRY ====="
);

const calendarExpired =
  getEffectiveEvidenceStatus({
    evidenceStatus:
      EvidenceVerificationStatus.VERIFIED,

    documentStatus:
      DocumentVerificationStatus.VERIFIED,

    documentExpiresAt:
      new Date(
        "2026-08-27T07:00:00.000Z"
      ),

    now:
      NOW,
  });

assertEqual(
  calendarExpired,
  EvidenceVerificationStatus.EXPIRED,
  "Past expiresAt overrides stale VERIFIED document status"
);

/*
 * ============================================================
 * TEST 9
 * Future expiry remains valid.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 9: FUTURE EXPIRY ====="
);

const futureExpiry =
  getEffectiveEvidenceStatus({
    evidenceStatus:
      EvidenceVerificationStatus.VERIFIED,

    documentStatus:
      DocumentVerificationStatus.VERIFIED,

    documentExpiresAt:
      new Date(
        "2027-08-28T07:00:00.000Z"
      ),

    now:
      NOW,
  });

assertEqual(
  futureExpiry,
  EvidenceVerificationStatus.VERIFIED,
  "Future expiry does not invalidate verified evidence"
);

/*
 * ============================================================
 * TEST 10
 * Evidence without Document.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 10: EVIDENCE WITHOUT DOCUMENT ====="
);

const noDocument =
  normalizeComplianceEvidence({
    organizationId:
      ORGANIZATION_ID,

    validRequirementIds:
      VALID_REQUIREMENTS,

    evidence: [
      record({
        withDocument:
          false,

        evidenceStatus:
          EvidenceVerificationStatus.VERIFIED,
      }),
    ],

    now:
      NOW,
  });

assertEqual(
  noDocument.success,
  true,
  "Evidence without Document remains supported"
);

if (!noDocument.success) {
  throw new Error(
    "Document-independent evidence unexpectedly failed."
  );
}

assertEqual(
  noDocument.evidence[0].status,
  EvidenceVerificationStatus.VERIFIED,
  "Document-independent VERIFIED evidence remains VERIFIED"
);

/*
 * ============================================================
 * TEST 11
 * Verified Document does not override rejected Evidence.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 11: REJECTED EVIDENCE + VERIFIED DOCUMENT ====="
);

const rejectedEvidence =
  getEffectiveEvidenceStatus({
    evidenceStatus:
      EvidenceVerificationStatus.REJECTED,

    documentStatus:
      DocumentVerificationStatus.VERIFIED,

    documentExpiresAt:
      null,

    now:
      NOW,
  });

assertEqual(
  rejectedEvidence,
  EvidenceVerificationStatus.REJECTED,
  "Verified document cannot override rejected evidence"
);

/*
 * ============================================================
 * TEST 12
 * Pending Evidence remains pending with verified Document.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 12: PENDING EVIDENCE + VERIFIED DOCUMENT ====="
);

const pendingEvidence =
  getEffectiveEvidenceStatus({
    evidenceStatus:
      EvidenceVerificationStatus.PENDING,

    documentStatus:
      DocumentVerificationStatus.VERIFIED,

    documentExpiresAt:
      null,

    now:
      NOW,
  });

assertEqual(
  pendingEvidence,
  EvidenceVerificationStatus.PENDING,
  "Verified document cannot override pending evidence"
);

/*
 * ============================================================
 * TEST 13
 * Expiry boundary: expiresAt exactly equal to now.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 13: EXPIRY EXACTLY AT NOW ====="
);

const expiresExactlyNow =
  getEffectiveEvidenceStatus({
    evidenceStatus:
      EvidenceVerificationStatus.VERIFIED,

    documentStatus:
      DocumentVerificationStatus.VERIFIED,

    documentExpiresAt:
      NOW,

    now:
      NOW,
  });

assertEqual(
  expiresExactlyNow,
  EvidenceVerificationStatus.EXPIRED,
  "Document is expired when expiresAt equals now"
);

/*
 * ============================================================
 * TEST 14
 * Inactive Requirement belonging to the correct Framework.
 *
 * Integrity must accept the relationship because the
 * Requirement belongs to the Assessment Framework.
 *
 * The scoring engine must then exclude the inactive Requirement
 * from the current compliance score.
 * ============================================================
 */

console.log();
console.log(
  "===== TEST 14: INACTIVE SAME-FRAMEWORK REQUIREMENT ====="
);

const inactiveEvidence =
  normalizeComplianceEvidence({
    organizationId:
      ORGANIZATION_ID,

    validRequirementIds:
      VALID_REQUIREMENTS,

    evidence: [
      record({
        id:
          "evidence-inactive",

        requirementId:
          INACTIVE_REQUIREMENT_ID,

        evidenceStatus:
          EvidenceVerificationStatus.VERIFIED,
      }),
    ],

    now:
      NOW,
  });

assertEqual(
  inactiveEvidence.success,
  true,
  "Inactive same-framework requirement passes integrity validation"
);

if (!inactiveEvidence.success) {
  throw new Error(
    "Inactive same-framework requirement unexpectedly failed integrity validation."
  );
}

assertEqual(
  inactiveEvidence.evidence.length,
  1,
  "Inactive same-framework evidence remains valid after normalization"
);

const scoringRequirements:
  ComplianceRequirementInput[] = [
    {
      id:
        VALID_REQUIREMENT_ID,

      code:
        "ACTIVE-001",

      title:
        "Active requirement",

      mandatory:
        true,

      weight:
        1,

      active:
        true,
    },
    {
      id:
        INACTIVE_REQUIREMENT_ID,

      code:
        "INACTIVE-001",

      title:
        "Inactive historical requirement",

      mandatory:
        true,

      weight:
        100,

      active:
        false,
    },
  ];

const inactiveRequirementScore =
  calculateEvidenceCompliance(
    scoringRequirements,
    inactiveEvidence.evidence
  );

assertEqual(
  inactiveRequirementScore.score,
  0,
  "Verified inactive requirement contributes no current compliance score"
);

assertEqual(
  inactiveRequirementScore.totalWeight,
  1,
  "Inactive requirement weight is excluded from current denominator"
);

assertEqual(
  inactiveRequirementScore.totalRequirements,
  1,
  "Inactive requirement is excluded from current requirement count"
);

assertEqual(
  inactiveRequirementScore.verifiedRequirements,
  0,
  "Inactive verified evidence cannot satisfy the active requirement"
);

assertEqual(
  inactiveRequirementScore.mandatoryRequirementsSatisfied,
  false,
  "Missing active mandatory requirement remains unsatisfied"
);

console.log();
console.log(
  "============================================================"
);
console.log(
  " ALL COMPLIANCE INTEGRITY TESTS PASSED"
);
console.log(
  "============================================================"
);
