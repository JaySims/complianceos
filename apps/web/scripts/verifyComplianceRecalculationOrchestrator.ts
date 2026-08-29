import {
  determineAssessmentAuthorityPolicy,
  determineDocumentAffectedAssessments,
  determineDocumentAggregationPolicy,
} from "../lib/compliance/complianceRecalculationOrchestrator";

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

function assertArrayEquals(
  actual: string[],
  expected: string[],
  message: string
): void {
  assert(
    actual.length === expected.length &&
      actual.every(
        (value, index) =>
          value === expected[index]
      ),
    `${message}. Expected [${expected.join(
      ", "
    )}], received [${actual.join(", ")}].`
  );
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
  " COMPLIANCEOS — RECALCULATION ORCHESTRATION VERIFICATION"
);
console.log(
  "============================================================"
);
console.log();

runTest(
  "1. Historical Assessment does not trigger Organization aggregation",
  () => {
    const result =
      determineAssessmentAuthorityPolicy({
        assessmentId: "assessment-history",
        authoritativeAssessmentId:
          "assessment-current",
      });

    assert(
      result.authoritative === false,
      "Historical Assessment must not be authoritative"
    );

    assert(
      result.shouldAggregateOrganization ===
        false,
      "Historical Assessment must not trigger Organization aggregation"
    );
  }
);

runTest(
  "2. Current authoritative Assessment triggers Organization aggregation",
  () => {
    const result =
      determineAssessmentAuthorityPolicy({
        assessmentId: "assessment-current",
        authoritativeAssessmentId:
          "assessment-current",
      });

    assert(
      result.authoritative === true,
      "Current Assessment must be recognized as authoritative"
    );

    assert(
      result.shouldAggregateOrganization ===
        true,
      "Authoritative Assessment must trigger Organization aggregation"
    );
  }
);

runTest(
  "3. Missing authority does not trigger Organization aggregation",
  () => {
    const result =
      determineAssessmentAuthorityPolicy({
        assessmentId: "assessment-1",
        authoritativeAssessmentId: null,
      });

    assert(
      result.authoritative === false,
      "Assessment cannot be authoritative when no authority exists"
    );

    assert(
      result.shouldAggregateOrganization ===
        false,
      "Missing authority must not trigger Organization aggregation"
    );
  }
);

runTest(
  "4. Document discovery deduplicates affected Assessments",
  () => {
    const result =
      determineDocumentAffectedAssessments(
        "org-1",
        [
          {
            assessmentId: "assessment-b",
            assessmentOrganizationId:
              "org-1",
          },
          {
            assessmentId: "assessment-a",
            assessmentOrganizationId:
              "org-1",
          },
          {
            assessmentId: "assessment-b",
            assessmentOrganizationId:
              "org-1",
          },
        ]
      );

    assert(
      result.success,
      "Valid document evidence should pass discovery"
    );

    if (!result.success) {
      return;
    }

    assertArrayEquals(
      result.affectedAssessmentIds,
      [
        "assessment-a",
        "assessment-b",
      ],
      "Affected Assessments must be unique and deterministic"
    );
  }
);

runTest(
  "5. Document with no Evidence affects no Assessments",
  () => {
    const result =
      determineDocumentAffectedAssessments(
        "org-1",
        []
      );

    assert(
      result.success,
      "Empty Evidence set is not an integrity failure"
    );

    if (!result.success) {
      return;
    }

    assertArrayEquals(
      result.affectedAssessmentIds,
      [],
      "Document without Evidence must affect no Assessments"
    );
  }
);

runTest(
  "6. Cross-tenant document Evidence is rejected",
  () => {
    const result =
      determineDocumentAffectedAssessments(
        "org-1",
        [
          {
            assessmentId: "assessment-1",
            assessmentOrganizationId:
              "org-2",
          },
        ]
      );

    assert(
      !result.success,
      "Foreign Organization Assessment must fail document discovery"
    );

    if (result.success) {
      return;
    }

    assert(
      result.reason ===
        "DOCUMENT_ASSESSMENT_INTEGRITY_FAILED",
      "Cross-tenant Evidence must return explicit integrity failure"
    );
  }
);

runTest(
  "7. Recalculated historical Assessments do not trigger aggregation",
  () => {
    const result =
      determineDocumentAggregationPolicy(
        [
          "assessment-a",
          "assessment-b",
        ],
        []
      );

    assertArrayEquals(
      result.authoritativeAssessmentIds,
      [],
      "No authoritative Assessment should be reported"
    );

    assert(
      result.shouldAggregateOrganization ===
        false,
      "Historical-only recalculation must not aggregate Organization"
    );
  }
);

runTest(
  "8. One authoritative affected Assessment triggers one Organization aggregation decision",
  () => {
    const result =
      determineDocumentAggregationPolicy(
        [
          "assessment-a",
          "assessment-b",
        ],
        ["assessment-b"]
      );

    assertArrayEquals(
      result.authoritativeAssessmentIds,
      ["assessment-b"],
      "Authoritative affected Assessment must be retained"
    );

    assert(
      result.shouldAggregateOrganization ===
        true,
      "One authoritative affected Assessment must trigger aggregation"
    );
  }
);

runTest(
  "9. Multiple authoritative affected Assessments still produce one aggregation decision",
  () => {
    const result =
      determineDocumentAggregationPolicy(
        [
          "assessment-a",
          "assessment-b",
          "assessment-c",
        ],
        [
          "assessment-c",
          "assessment-a",
        ]
      );

    assertArrayEquals(
      result.authoritativeAssessmentIds,
      [
        "assessment-a",
        "assessment-c",
      ],
      "Authoritative Assessment ids must be deterministic"
    );

    assert(
      result.shouldAggregateOrganization ===
        true,
      "Multiple authoritative Assessments still require only the single aggregate decision represented by the policy"
    );
  }
);

runTest(
  "10. Duplicate authoritative Assessment ids are normalized",
  () => {
    const result =
      determineDocumentAggregationPolicy(
        [
          "assessment-a",
          "assessment-b",
        ],
        [
          "assessment-a",
          "assessment-a",
        ]
      );

    assertArrayEquals(
      result.authoritativeAssessmentIds,
      ["assessment-a"],
      "Duplicate authority ids must be removed"
    );

    assert(
      result.shouldAggregateOrganization ===
        true,
      "Normalized authority still triggers aggregation"
    );
  }
);

runTest(
  "11. Authority ids outside recalculated Assessment set cannot trigger aggregation",
  () => {
    const result =
      determineDocumentAggregationPolicy(
        ["assessment-a"],
        ["assessment-other"]
      );

    assertArrayEquals(
      result.authoritativeAssessmentIds,
      [],
      "Unrelated authority must be excluded"
    );

    assert(
      result.shouldAggregateOrganization ===
        false,
      "Unrelated authority must not trigger aggregation"
    );
  }
);

runTest(
  "12. Mixed authoritative and unrelated ids retain only recalculated authority",
  () => {
    const result =
      determineDocumentAggregationPolicy(
        [
          "assessment-a",
          "assessment-b",
        ],
        [
          "assessment-other",
          "assessment-b",
        ]
      );

    assertArrayEquals(
      result.authoritativeAssessmentIds,
      ["assessment-b"],
      "Only recalculated authoritative Assessments may participate"
    );

    assert(
      result.shouldAggregateOrganization ===
        true,
      "A valid authoritative affected Assessment must trigger aggregation"
    );
  }
);

console.log();
console.log(
  "============================================================"
);
console.log(`Passed: ${passed}/12`);
console.log(`Failed: ${failed}/12`);
console.log(
  "============================================================"
);

if (failed > 0) {
  process.exitCode = 1;
}
