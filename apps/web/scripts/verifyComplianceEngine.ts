import {
  EvidenceVerificationStatus,
} from "@prisma/client";

import {
  calculateEvidenceCompliance,
  deriveRequirementStatus,
  type ComplianceEvidenceInput,
  type ComplianceRequirementInput,
} from "../lib/compliance/complianceEngine";

/*
 * ============================================================
 * COMPLIANCEOS — COMPLIANCE ENGINE VERIFICATION HARNESS
 * ============================================================
 *
 * PURPOSE
 *
 * Prove the deterministic behavior of the evidence-driven
 * compliance engine before it is connected to PostgreSQL,
 * Assessment.score, Organization.complianceScore, Dashboard,
 * Trust Score, or Executive AI.
 *
 * This file:
 * - does not connect to the database
 * - does not mutate production data
 * - does not call an API
 * - does not alter ComplianceOS application state
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

const requirements: ComplianceRequirementInput[] = [
  {
    id: "tax",
    code: "TAX-001",
    title: "Tax Compliance",
    mandatory: true,
    weight: 3,
    active: true,
  },
  {
    id: "labour",
    code: "LAB-001",
    title: "Labour Compliance",
    mandatory: true,
    weight: 2,
    active: true,
  },
  {
    id: "industry",
    code: "IND-001",
    title: "Industry Compliance",
    mandatory: false,
    weight: 1,
    active: true,
  },
  {
    id: "inactive",
    code: "OLD-001",
    title: "Retired Requirement",
    mandatory: true,
    weight: 100,
    active: false,
  },
];

function evidence(
  id: string,
  requirementId: string,
  status: EvidenceVerificationStatus
): ComplianceEvidenceInput {
  return {
    id,
    requirementId,
    status,
  };
}

console.log(
  "============================================================"
);
console.log(
  " COMPLIANCEOS — EVIDENCE ENGINE BEHAVIOR TEST"
);
console.log(
  "============================================================"
);

console.log();
console.log("===== TEST 1: NO EVIDENCE =====");

const noEvidence =
  calculateEvidenceCompliance(
    requirements,
    []
  );

assertEqual(
  noEvidence.score,
  0,
  "No evidence produces 0% compliance"
);

assertEqual(
  noEvidence.missingRequirements,
  3,
  "All active requirements are missing"
);

assertEqual(
  noEvidence.totalWeight,
  6,
  "Inactive requirement excluded from denominator"
);

assertEqual(
  noEvidence.mandatoryRequirementsSatisfied,
  false,
  "Mandatory requirements are not satisfied"
);

console.log();
console.log("===== TEST 2: PENDING EVIDENCE =====");

const pending =
  calculateEvidenceCompliance(
    requirements,
    [
      evidence(
        "e1",
        "tax",
        EvidenceVerificationStatus.PENDING
      ),
    ]
  );

assertEqual(
  pending.score,
  0,
  "Pending evidence earns no compliance weight"
);

assertEqual(
  pending.pendingRequirements,
  1,
  "Pending requirement detected"
);

assertEqual(
  pending.missingRequirements,
  2,
  "Remaining requirements stay missing"
);

console.log();
console.log("===== TEST 3: ONE VERIFIED REQUIREMENT =====");

const oneVerified =
  calculateEvidenceCompliance(
    requirements,
    [
      evidence(
        "e1",
        "tax",
        EvidenceVerificationStatus.VERIFIED
      ),
    ]
  );

assertEqual(
  oneVerified.score,
  50,
  "Tax weight 3 of total weight 6 produces 50%"
);

assertEqual(
  oneVerified.earnedWeight,
  3,
  "Verified tax requirement earns weight 3"
);

assertEqual(
  oneVerified.verifiedRequirements,
  1,
  "One requirement is verified"
);

console.log();
console.log("===== TEST 4: ALL ACTIVE REQUIREMENTS VERIFIED =====");

const allVerified =
  calculateEvidenceCompliance(
    requirements,
    [
      evidence(
        "e1",
        "tax",
        EvidenceVerificationStatus.VERIFIED
      ),
      evidence(
        "e2",
        "labour",
        EvidenceVerificationStatus.VERIFIED
      ),
      evidence(
        "e3",
        "industry",
        EvidenceVerificationStatus.VERIFIED
      ),
    ]
  );

assertEqual(
  allVerified.score,
  100,
  "All active requirements verified produces 100%"
);

assertEqual(
  allVerified.verifiedRequirements,
  3,
  "All three active requirements are verified"
);

assertEqual(
  allVerified.mandatoryRequirementsSatisfied,
  true,
  "All mandatory requirements are satisfied"
);

console.log();
console.log("===== TEST 5: REJECTED EVIDENCE =====");

const rejected =
  calculateEvidenceCompliance(
    requirements,
    [
      evidence(
        "e1",
        "tax",
        EvidenceVerificationStatus.REJECTED
      ),
    ]
  );

assertEqual(
  rejected.score,
  0,
  "Rejected evidence earns no compliance weight"
);

assertEqual(
  rejected.rejectedRequirements,
  1,
  "Rejected requirement detected"
);

console.log();
console.log("===== TEST 6: EXPIRED EVIDENCE =====");

const expired =
  calculateEvidenceCompliance(
    requirements,
    [
      evidence(
        "e1",
        "tax",
        EvidenceVerificationStatus.EXPIRED
      ),
    ]
  );

assertEqual(
  expired.score,
  0,
  "Expired evidence earns no compliance weight"
);

assertEqual(
  expired.expiredRequirements,
  1,
  "Expired requirement detected"
);

console.log();
console.log(
  "===== TEST 7: VERIFIED OVERRIDES OLD REJECTED EVIDENCE ====="
);

const verifiedAndRejected =
  calculateEvidenceCompliance(
    requirements,
    [
      evidence(
        "old-tax",
        "tax",
        EvidenceVerificationStatus.REJECTED
      ),
      evidence(
        "new-tax",
        "tax",
        EvidenceVerificationStatus.VERIFIED
      ),
    ]
  );

assertEqual(
  verifiedAndRejected.requirements[0].status,
  "VERIFIED",
  "Verified evidence satisfies requirement despite rejected history"
);

assertEqual(
  verifiedAndRejected.score,
  50,
  "Verified tax requirement still earns full weight"
);

console.log();
console.log(
  "===== TEST 8: PENDING OVERRIDES REJECTED HISTORY ====="
);

const pendingAndRejected =
  deriveRequirementStatus([
    evidence(
      "old-tax",
      "tax",
      EvidenceVerificationStatus.REJECTED
    ),
    evidence(
      "new-tax",
      "tax",
      EvidenceVerificationStatus.PENDING
    ),
  ]);

assertEqual(
  pendingAndRejected,
  "PENDING",
  "Pending evidence represents current unresolved state"
);

console.log();
console.log(
  "===== TEST 9: ZERO-WEIGHT REQUIREMENTS ====="
);

const zeroWeight =
  calculateEvidenceCompliance(
    [
      {
        id: "zero",
        code: "ZERO-001",
        title: "Zero Weight Requirement",
        mandatory: false,
        weight: 0,
        active: true,
      },
    ],
    [
      evidence(
        "e1",
        "zero",
        EvidenceVerificationStatus.VERIFIED
      ),
    ]
  );

assertEqual(
  zeroWeight.score,
  0,
  "Zero total weight safely produces 0%"
);

console.log();
console.log(
  "===== TEST 10: NEGATIVE WEIGHT NORMALIZATION ====="
);

const negativeWeight =
  calculateEvidenceCompliance(
    [
      {
        id: "negative",
        code: "NEG-001",
        title: "Invalid Negative Weight",
        mandatory: true,
        weight: -5,
        active: true,
      },
    ],
    [
      evidence(
        "e1",
        "negative",
        EvidenceVerificationStatus.VERIFIED
      ),
    ]
  );

assertEqual(
  negativeWeight.totalWeight,
  0,
  "Negative weight is normalized to zero"
);

assertEqual(
  negativeWeight.score,
  0,
  "Invalid negative weight cannot create compliance"
);

console.log();
console.log(
  "============================================================"
);
console.log(
  " ALL COMPLIANCE ENGINE TESTS PASSED"
);
console.log(
  "============================================================"
);
