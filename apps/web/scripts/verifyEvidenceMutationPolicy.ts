import {
  EvidenceVerificationStatus,
  OrganizationMemberRole,
} from "@prisma/client";

import {
  canReadComplianceEvidence,
  canSubmitComplianceEvidence,
  canVerifyComplianceEvidence,
  doesPendingEvidenceUpdateRequireRecalculation,
  isEvidenceVerificationDecision,
} from "../lib/compliance/evidenceMutationService";

let passed = 0;
let failed = 0;

function assert(
  condition: boolean,
  message: string
): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runTest(
  name: string,
  test: () => void
): void {
  try {
    test();
    passed += 1;
    console.log(`PASS — ${name}`);
  } catch (error) {
    failed += 1;

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(`FAIL — ${name}`);
    console.error(`       ${message}`);
  }
}

console.log(
  "============================================================"
);
console.log(
  " COMPLIANCEOS — EVIDENCE MUTATION POLICY VERIFICATION"
);
console.log(
  "============================================================"
);
console.log();

runTest(
  "1. OWNER can read, submit and verify Evidence",
  () => {
    assert(
      canReadComplianceEvidence(
        OrganizationMemberRole.OWNER
      ),
      "OWNER must be able to read Evidence"
    );

    assert(
      canSubmitComplianceEvidence(
        OrganizationMemberRole.OWNER
      ),
      "OWNER must be able to submit Evidence"
    );

    assert(
      canVerifyComplianceEvidence(
        OrganizationMemberRole.OWNER
      ),
      "OWNER must be able to verify Evidence"
    );
  }
);

runTest(
  "2. ADMIN can read, submit and verify Evidence",
  () => {
    assert(
      canReadComplianceEvidence(
        OrganizationMemberRole.ADMIN
      ),
      "ADMIN must be able to read Evidence"
    );

    assert(
      canSubmitComplianceEvidence(
        OrganizationMemberRole.ADMIN
      ),
      "ADMIN must be able to submit Evidence"
    );

    assert(
      canVerifyComplianceEvidence(
        OrganizationMemberRole.ADMIN
      ),
      "ADMIN must be able to verify Evidence"
    );
  }
);

runTest(
  "3. MANAGER can read and submit but cannot verify",
  () => {
    assert(
      canReadComplianceEvidence(
        OrganizationMemberRole.MANAGER
      ),
      "MANAGER must be able to read Evidence"
    );

    assert(
      canSubmitComplianceEvidence(
        OrganizationMemberRole.MANAGER
      ),
      "MANAGER must be able to submit Evidence"
    );

    assert(
      !canVerifyComplianceEvidence(
        OrganizationMemberRole.MANAGER
      ),
      "MANAGER must not verify Evidence"
    );
  }
);

runTest(
  "4. MEMBER can read and submit but cannot verify",
  () => {
    assert(
      canReadComplianceEvidence(
        OrganizationMemberRole.MEMBER
      ),
      "MEMBER must be able to read Evidence"
    );

    assert(
      canSubmitComplianceEvidence(
        OrganizationMemberRole.MEMBER
      ),
      "MEMBER must be able to submit Evidence"
    );

    assert(
      !canVerifyComplianceEvidence(
        OrganizationMemberRole.MEMBER
      ),
      "MEMBER must not verify Evidence"
    );
  }
);

runTest(
  "5. AUDITOR can read and verify but cannot submit",
  () => {
    assert(
      canReadComplianceEvidence(
        OrganizationMemberRole.AUDITOR
      ),
      "AUDITOR must be able to read Evidence"
    );

    assert(
      !canSubmitComplianceEvidence(
        OrganizationMemberRole.AUDITOR
      ),
      "AUDITOR must not submit Evidence"
    );

    assert(
      canVerifyComplianceEvidence(
        OrganizationMemberRole.AUDITOR
      ),
      "AUDITOR must be able to verify Evidence"
    );
  }
);

runTest(
  "6. Every Organization role can read Evidence",
  () => {
    for (
      const role of Object.values(
        OrganizationMemberRole
      )
    ) {
      assert(
        canReadComplianceEvidence(role),
        `${role} must have Evidence read access`
      );
    }
  }
);

runTest(
  "7. VERIFIED is a valid reviewer decision",
  () => {
    assert(
      isEvidenceVerificationDecision(
        EvidenceVerificationStatus.VERIFIED
      ),
      "VERIFIED must be accepted"
    );
  }
);

runTest(
  "8. REJECTED is a valid reviewer decision",
  () => {
    assert(
      isEvidenceVerificationDecision(
        EvidenceVerificationStatus.REJECTED
      ),
      "REJECTED must be accepted"
    );
  }
);

runTest(
  "9. PENDING is not a manual reviewer decision",
  () => {
    assert(
      !isEvidenceVerificationDecision(
        EvidenceVerificationStatus.PENDING
      ),
      "PENDING must not be a reviewer decision"
    );
  }
);

runTest(
  "10. EXPIRED is not a manual reviewer decision",
  () => {
    assert(
      !isEvidenceVerificationDecision(
        EvidenceVerificationStatus.EXPIRED
      ),
      "EXPIRED must not be a reviewer decision"
    );
  }
);

runTest(
  "11. Submission and verification roles are deliberately separated",
  () => {
    assert(
      canSubmitComplianceEvidence(
        OrganizationMemberRole.MEMBER
      ) &&
        !canVerifyComplianceEvidence(
          OrganizationMemberRole.MEMBER
        ),
      "MEMBER must demonstrate submit-without-verify separation"
    );

    assert(
      !canSubmitComplianceEvidence(
        OrganizationMemberRole.AUDITOR
      ) &&
        canVerifyComplianceEvidence(
          OrganizationMemberRole.AUDITOR
        ),
      "AUDITOR must demonstrate verify-without-submit separation"
    );
  }
);

runTest(
  "12. Only OWNER, ADMIN and AUDITOR may verify Evidence",
  () => {
    const allowed =
      Object.values(
        OrganizationMemberRole
      )
        .filter(
          canVerifyComplianceEvidence
        )
        .sort();

    const expected = [
      OrganizationMemberRole.ADMIN,
      OrganizationMemberRole.AUDITOR,
      OrganizationMemberRole.OWNER,
    ].sort();

    assert(
      JSON.stringify(allowed) ===
        JSON.stringify(expected),
      `Unexpected verification role set: ${allowed.join(
        ", "
      )}`
    );
  }
);

runTest(
  "13. Title-only pending edit does not require recalculation",
  () => {
    assert(
      !doesPendingEvidenceUpdateRequireRecalculation({
        title: "Updated title",
      }),
      "Title-only changes must not trigger compliance recalculation"
    );
  }
);

runTest(
  "14. File URL and notes edits do not require recalculation",
  () => {
    assert(
      !doesPendingEvidenceUpdateRequireRecalculation({
        fileUrl: "/documents/replacement.pdf",
        notes: "Metadata correction",
      }),
      "Metadata-only changes must not trigger compliance recalculation"
    );
  }
);

runTest(
  "15. Requirement linkage requires recalculation",
  () => {
    assert(
      doesPendingEvidenceUpdateRequireRecalculation({
        requirementId: "requirement-1",
      }),
      "Requirement linkage must trigger compliance recalculation"
    );
  }
);

runTest(
  "16. Requirement unlinking requires recalculation",
  () => {
    assert(
      doesPendingEvidenceUpdateRequireRecalculation({
        requirementId: null,
      }),
      "Requirement unlinking must trigger compliance recalculation"
    );
  }
);

runTest(
  "17. Document linkage requires recalculation",
  () => {
    assert(
      doesPendingEvidenceUpdateRequireRecalculation({
        documentId: "document-1",
      }),
      "Document linkage must trigger compliance recalculation"
    );
  }
);

runTest(
  "18. Document unlinking requires recalculation",
  () => {
    assert(
      doesPendingEvidenceUpdateRequireRecalculation({
        documentId: null,
      }),
      "Document unlinking must trigger compliance recalculation"
    );
  }
);

runTest(
  "19. Combined metadata and compliance linkage requires recalculation",
  () => {
    assert(
      doesPendingEvidenceUpdateRequireRecalculation({
        title: "Updated evidence",
        notes: "New mapping",
        requirementId: "requirement-2",
      }),
      "Compliance linkage must dominate metadata-only changes"
    );
  }
);

runTest(
  "20. Empty pending update does not require recalculation",
  () => {
    assert(
      !doesPendingEvidenceUpdateRequireRecalculation({}),
      "An empty update must not trigger compliance recalculation"
    );
  }
);

console.log();
console.log(
  "============================================================"
);
console.log(`Passed: ${passed}/20`);
console.log(`Failed: ${failed}/20`);
console.log(
  "============================================================"
);

if (failed > 0) {
  process.exitCode = 1;
}
