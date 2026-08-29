import {
  EvidenceVerificationStatus,
} from "@prisma/client";

import {
  evidenceMutationFailureStatus,
  serializeEvidenceMutationRecord,
  validateCreateEvidenceHttpInput,
  validateEvidenceDecisionHttpInput,
  validateUpdateEvidenceHttpInput,
} from "../lib/compliance/evidenceHttp";

import type {
  EvidenceMutationFailure,
  EvidenceMutationRecord,
} from "../lib/compliance/evidenceMutationService";


let passed = 0;
let failed = 0;


function assert(
  condition: boolean,
  message: string
) {
  if (!condition) {
    throw new Error(message);
  }
}


function runTest(
  name: string,
  test: () => void
) {
  try {
    test();

    passed += 1;

    console.log(
      `PASS — ${name}`
    );
  } catch (error) {
    failed += 1;

    console.error(
      `FAIL — ${name}`
    );

    console.error(error);
  }
}


function failure(
  reason:
    EvidenceMutationFailure["reason"]
): EvidenceMutationFailure {
  return {
    success: false,
    reason,
    message: "test",
    mutationCommitted:
      reason ===
      "MUTATION_COMMITTED_RECALCULATION_FAILED",
  };
}


console.log(
  "============================================================"
);
console.log(
  " COMPLIANCEOS — EVIDENCE HTTP POLICY VERIFICATION"
);
console.log(
  "============================================================"
);
console.log();


runTest(
  "1. Valid create body is normalized",
  () => {
    const result =
      validateCreateEvidenceHttpInput({
        assessmentId:
          " assessment-1 ",
        title:
          " Tax certificate ",
        fileUrl:
          " /files/tax.pdf ",
        requirementId:
          " requirement-1 ",
        documentId:
          null,
        notes:
          "Submitted",
      });

    assert(
      result.success,
      "Expected valid create body"
    );

    if (!result.success) {
      return;
    }

    assert(
      result.value.assessmentId ===
        "assessment-1",
      "assessmentId should be trimmed"
    );

    assert(
      result.value.title ===
        "Tax certificate",
      "title should be trimmed"
    );

    assert(
      result.value.fileUrl ===
        "/files/tax.pdf",
      "fileUrl should be trimmed"
    );
  }
);


runTest(
  "2. Create rejects non-object body",
  () => {
    const result =
      validateCreateEvidenceHttpInput(
        null
      );

    assert(
      !result.success,
      "Null body must be rejected"
    );
  }
);


runTest(
  "3. Create requires assessmentId",
  () => {
    const result =
      validateCreateEvidenceHttpInput({
        title: "Evidence",
        fileUrl: "/evidence.pdf",
      });

    assert(
      !result.success,
      "assessmentId must be required"
    );
  }
);


runTest(
  "4. Create requires title",
  () => {
    const result =
      validateCreateEvidenceHttpInput({
        assessmentId:
          "assessment-1",
        fileUrl:
          "/evidence.pdf",
      });

    assert(
      !result.success,
      "title must be required"
    );
  }
);


runTest(
  "5. Create requires fileUrl",
  () => {
    const result =
      validateCreateEvidenceHttpInput({
        assessmentId:
          "assessment-1",
        title:
          "Evidence",
      });

    assert(
      !result.success,
      "fileUrl must be required"
    );
  }
);


runTest(
  "6. Create rejects empty optional IDs",
  () => {
    const result =
      validateCreateEvidenceHttpInput({
        assessmentId:
          "assessment-1",
        title:
          "Evidence",
        fileUrl:
          "/evidence.pdf",
        requirementId:
          "   ",
      });

    assert(
      !result.success,
      "Empty requirementId must be rejected"
    );
  }
);


runTest(
  "7. Pending update accepts metadata-only edit",
  () => {
    const result =
      validateUpdateEvidenceHttpInput({
        title:
          "Updated Evidence",
        notes:
          "Correction",
      });

    assert(
      result.success,
      "Metadata edit should be valid"
    );
  }
);


runTest(
  "8. Pending update accepts explicit unlinking",
  () => {
    const result =
      validateUpdateEvidenceHttpInput({
        requirementId: null,
        documentId: null,
      });

    assert(
      result.success,
      "Explicit unlinking should be valid"
    );
  }
);


runTest(
  "9. Pending update rejects empty body",
  () => {
    const result =
      validateUpdateEvidenceHttpInput(
        {}
      );

    assert(
      !result.success,
      "Empty update must be rejected"
    );
  }
);


runTest(
  "10. Pending update rejects unsupported fields",
  () => {
    const result =
      validateUpdateEvidenceHttpInput({
        status: "VERIFIED",
      });

    assert(
      !result.success,
      "HTTP update must not permit status mutation"
    );
  }
);


runTest(
  "11. Pending update rejects empty title",
  () => {
    const result =
      validateUpdateEvidenceHttpInput({
        title: "   ",
      });

    assert(
      !result.success,
      "Empty title must be rejected"
    );
  }
);


runTest(
  "12. VERIFIED decision is accepted",
  () => {
    const result =
      validateEvidenceDecisionHttpInput({
        decision: "VERIFIED",
      });

    assert(
      result.success,
      "VERIFIED should be accepted"
    );
  }
);


runTest(
  "13. REJECTED decision is accepted",
  () => {
    const result =
      validateEvidenceDecisionHttpInput({
        decision: "REJECTED",
        notes:
          "Document mismatch",
      });

    assert(
      result.success,
      "REJECTED should be accepted"
    );
  }
);


runTest(
  "14. PENDING cannot be submitted as reviewer decision",
  () => {
    const result =
      validateEvidenceDecisionHttpInput({
        decision: "PENDING",
      });

    assert(
      !result.success,
      "PENDING must be rejected"
    );
  }
);


runTest(
  "15. EXPIRED cannot be submitted as reviewer decision",
  () => {
    const result =
      validateEvidenceDecisionHttpInput({
        decision: "EXPIRED",
      });

    assert(
      !result.success,
      "EXPIRED must be rejected"
    );
  }
);


runTest(
  "16. Decision rejects unsupported fields",
  () => {
    const result =
      validateEvidenceDecisionHttpInput({
        decision: "VERIFIED",
        verifiedById:
          "attacker-controlled-user",
      });

    assert(
      !result.success,
      "Reviewer identity must not enter through HTTP"
    );
  }
);


runTest(
  "17. Authorization failures map to 403",
  () => {
    const reasons:
      EvidenceMutationFailure["reason"][] =
      [
        "EVIDENCE_WRITE_FORBIDDEN",
        "EVIDENCE_VERIFICATION_FORBIDDEN",
        "ASSESSMENT_ACCESS_DENIED",
        "DOCUMENT_ACCESS_DENIED",
        "EVIDENCE_ACCESS_DENIED",
      ];

    for (const reason of reasons) {
      assert(
        evidenceMutationFailureStatus(
          failure(reason)
        ) === 403,
        `${reason} should map to 403`
      );
    }
  }
);


runTest(
  "18. Missing resources map to 404",
  () => {
    const reasons:
      EvidenceMutationFailure["reason"][] =
      [
        "ASSESSMENT_NOT_FOUND",
        "REQUIREMENT_NOT_FOUND",
        "DOCUMENT_NOT_FOUND",
        "EVIDENCE_NOT_FOUND",
      ];

    for (const reason of reasons) {
      assert(
        evidenceMutationFailureStatus(
          failure(reason)
        ) === 404,
        `${reason} should map to 404`
      );
    }
  }
);


runTest(
  "19. State conflicts map to 409",
  () => {
    const reasons:
      EvidenceMutationFailure["reason"][] =
      [
        "REQUIREMENT_FRAMEWORK_MISMATCH",
        "EVIDENCE_NOT_PENDING",
        "INVALID_EVIDENCE_STATUS",
        "EVIDENCE_CHANGED_DURING_MUTATION",
      ];

    for (const reason of reasons) {
      assert(
        evidenceMutationFailureStatus(
          failure(reason)
        ) === 409,
        `${reason} should map to 409`
      );
    }
  }
);


runTest(
  "20. Internal mutation failure maps to 500",
  () => {
    assert(
      evidenceMutationFailureStatus(
        failure(
          "EVIDENCE_MUTATION_FAILED"
        )
      ) === 500,
      "Mutation failure should map to 500"
    );
  }
);


runTest(
  "21. Committed recalculation failure maps to 503",
  () => {
    assert(
      evidenceMutationFailureStatus(
        failure(
          "MUTATION_COMMITTED_RECALCULATION_FAILED"
        )
      ) === 503,
      "Committed recalculation failure should map to 503"
    );
  }
);


runTest(
  "22. Evidence dates serialize to ISO strings",
  () => {
    const evidence:
      EvidenceMutationRecord = {
        id: "evidence-1",
        title: "Evidence",
        fileUrl: "/evidence.pdf",
        assessmentId:
          "assessment-1",
        documentId: null,
        requirementId: null,
        status:
          EvidenceVerificationStatus.VERIFIED,
        verifiedAt:
          new Date(
            "2026-08-29T12:00:00.000Z"
          ),
        verifiedById:
          "user-1",
        notes: null,
        createdAt:
          new Date(
            "2026-08-29T10:00:00.000Z"
          ),
        updatedAt:
          new Date(
            "2026-08-29T12:00:00.000Z"
          ),
      };

    const serialized =
      serializeEvidenceMutationRecord(
        evidence
      );

    assert(
      serialized.verifiedAt ===
        "2026-08-29T12:00:00.000Z",
      "verifiedAt must serialize to ISO"
    );

    assert(
      serialized.createdAt ===
        "2026-08-29T10:00:00.000Z",
      "createdAt must serialize to ISO"
    );

    assert(
      serialized.updatedAt ===
        "2026-08-29T12:00:00.000Z",
      "updatedAt must serialize to ISO"
    );
  }
);


console.log();
console.log(
  "============================================================"
);
console.log(
  `Passed: ${passed}/22`
);
console.log(
  `Failed: ${failed}/22`
);
console.log(
  "============================================================"
);


if (failed > 0) {
  process.exitCode = 1;
}
