import {
  type AuthoritativeAssessmentScoreInput,
  calculateOrganizationComplianceAggregation,
} from "../lib/compliance/organizationComplianceAggregationService";

/*
 * ============================================================
 * COMPLIANCEOS
 * ORGANIZATION COMPLIANCE AGGREGATION VERIFICATION
 * ============================================================
 *
 * Deterministic domain-policy verification.
 *
 * This script:
 *
 * - does NOT connect to the database;
 * - does NOT mutate production data;
 * - does NOT modify Assessment scores;
 * - does NOT modify CurrentAssessmentAuthority;
 * - does NOT modify Organization records;
 * - verifies only the pure aggregation contract.
 *
 * ============================================================
 */

type TestResult = {
  name: string;
  passed: boolean;
  detail?: string;
};

const results: TestResult[] = [];

const ORGANIZATION_ID = "organization-primary";

function authoritativeAssessment(
  overrides: Partial<AuthoritativeAssessmentScoreInput> = {}
): AuthoritativeAssessmentScoreInput {
  return {
    authorityId: "authority-1",
    authorityOrganizationId: ORGANIZATION_ID,
    authorityFrameworkId: "framework-1",
    assessmentId: "assessment-1",
    assessmentOrganizationId: ORGANIZATION_ID,
    assessmentFrameworkId: "framework-1",
    score: 80,
    ...overrides,
  };
}

function record(
  name: string,
  passed: boolean,
  detail?: string
): void {
  results.push({
    name,
    passed,
    detail,
  });
}

function approximatelyEqual(
  actual: number,
  expected: number,
  epsilon = 1e-10
): boolean {
  return Math.abs(actual - expected) <= epsilon;
}

/*
 * ============================================================
 * 1. NO AUTHORITY
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      []
    );

  record(
    "1. No authority produces persisted-compatible zero with zero contributors",
    result.success &&
      result.aggregation.score === 0 &&
      result.aggregation.authoritativeFrameworkCount === 0 &&
      result.aggregation.scoredFrameworkCount === 0 &&
      result.aggregation.unscoredFrameworkCount === 0 &&
      result.aggregation.contributingAssessmentIds.length === 0
  );
}

/*
 * ============================================================
 * 2. SINGLE SCORED AUTHORITY
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          score: 84,
        }),
      ]
    );

  record(
    "2. Single scored authoritative Assessment becomes Organization score",
    result.success &&
      result.aggregation.score === 84 &&
      result.aggregation.authoritativeFrameworkCount === 1 &&
      result.aggregation.scoredFrameworkCount === 1 &&
      result.aggregation.unscoredFrameworkCount === 0 &&
      result.aggregation.contributingAssessmentIds.length === 1 &&
      result.aggregation.contributingAssessmentIds[0] ===
        "assessment-1"
  );
}

/*
 * ============================================================
 * 3. MULTIPLE AUTHORITATIVE FRAMEWORKS — EQUAL WEIGHT
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          authorityId: "authority-1",
          authorityFrameworkId: "framework-1",
          assessmentId: "assessment-1",
          assessmentFrameworkId: "framework-1",
          score: 84,
        }),

        authoritativeAssessment({
          authorityId: "authority-2",
          authorityFrameworkId: "framework-2",
          assessmentId: "assessment-2",
          assessmentFrameworkId: "framework-2",
          score: 91,
        }),

        authoritativeAssessment({
          authorityId: "authority-3",
          authorityFrameworkId: "framework-3",
          assessmentId: "assessment-3",
          assessmentFrameworkId: "framework-3",
          score: 76,
        }),
      ]
    );

  const expected =
    (84 + 91 + 76) / 3;

  record(
    "3. Multiple scored authoritative Frameworks use equal-weight mean",
    result.success &&
      approximatelyEqual(
        result.aggregation.score,
        expected
      ) &&
      result.aggregation.authoritativeFrameworkCount === 3 &&
      result.aggregation.scoredFrameworkCount === 3 &&
      result.aggregation.unscoredFrameworkCount === 0
  );
}

/*
 * ============================================================
 * 4. NULL SCORE IS EXCLUDED
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          score: null,
        }),
      ]
    );

  record(
    "4. Null authoritative Assessment score is uncalculated and excluded",
    result.success &&
      result.aggregation.score === 0 &&
      result.aggregation.authoritativeFrameworkCount === 1 &&
      result.aggregation.scoredFrameworkCount === 0 &&
      result.aggregation.unscoredFrameworkCount === 1 &&
      result.aggregation.contributingAssessmentIds.length === 0
  );
}

/*
 * ============================================================
 * 5. ZERO IS A REAL CALCULATED SCORE
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          score: 0,
        }),
      ]
    );

  record(
    "5. Numeric zero is included as genuine calculated 0% compliance",
    result.success &&
      result.aggregation.score === 0 &&
      result.aggregation.authoritativeFrameworkCount === 1 &&
      result.aggregation.scoredFrameworkCount === 1 &&
      result.aggregation.unscoredFrameworkCount === 0 &&
      result.aggregation.contributingAssessmentIds.length === 1
  );
}

/*
 * ============================================================
 * 6. MIXED SCORED AND NULL AUTHORITIES
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          authorityId: "authority-1",
          authorityFrameworkId: "framework-1",
          assessmentId: "assessment-1",
          assessmentFrameworkId: "framework-1",
          score: 80,
        }),

        authoritativeAssessment({
          authorityId: "authority-2",
          authorityFrameworkId: "framework-2",
          assessmentId: "assessment-2",
          assessmentFrameworkId: "framework-2",
          score: null,
        }),

        authoritativeAssessment({
          authorityId: "authority-3",
          authorityFrameworkId: "framework-3",
          assessmentId: "assessment-3",
          assessmentFrameworkId: "framework-3",
          score: 40,
        }),
      ]
    );

  record(
    "6. Null authority is excluded from denominator while remaining counted as authoritative",
    result.success &&
      result.aggregation.score === 60 &&
      result.aggregation.authoritativeFrameworkCount === 3 &&
      result.aggregation.scoredFrameworkCount === 2 &&
      result.aggregation.unscoredFrameworkCount === 1 &&
      result.aggregation.contributingAssessmentIds.length === 2 &&
      result.aggregation.contributingAssessmentIds[0] ===
        "assessment-1" &&
      result.aggregation.contributingAssessmentIds[1] ===
        "assessment-3"
  );
}

/*
 * ============================================================
 * 7. AUTHORITY ORGANIZATION MISMATCH
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          authorityOrganizationId:
            "organization-foreign",
        }),
      ]
    );

  record(
    "7. Foreign authority Organization is rejected",
    !result.success &&
      result.reason ===
        "AUTHORITY_TENANT_MISMATCH"
  );
}

/*
 * ============================================================
 * 8. ASSESSMENT ORGANIZATION MISMATCH
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          assessmentOrganizationId:
            "organization-foreign",
        }),
      ]
    );

  record(
    "8. Foreign authoritative Assessment Organization is rejected",
    !result.success &&
      result.reason ===
        "AUTHORITY_TENANT_MISMATCH"
  );
}

/*
 * ============================================================
 * 9. FRAMEWORK MISMATCH
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          authorityFrameworkId:
            "framework-authority",

          assessmentFrameworkId:
            "framework-assessment",
        }),
      ]
    );

  record(
    "9. Authority and Assessment Framework mismatch is rejected",
    !result.success &&
      result.reason ===
        "AUTHORITY_FRAMEWORK_MISMATCH"
  );
}

/*
 * ============================================================
 * 10. BELOW-ZERO SCORE NORMALIZATION
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          score: -25,
        }),
      ]
    );

  record(
    "10. Finite score below 0 normalizes defensively to 0",
    result.success &&
      result.aggregation.score === 0 &&
      result.aggregation.scoredFrameworkCount === 1 &&
      result.aggregation.unscoredFrameworkCount === 0
  );
}

/*
 * ============================================================
 * 11. ABOVE-100 SCORE NORMALIZATION
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          score: 145,
        }),
      ]
    );

  record(
    "11. Finite score above 100 normalizes defensively to 100",
    result.success &&
      result.aggregation.score === 100 &&
      result.aggregation.scoredFrameworkCount === 1
  );
}

/*
 * ============================================================
 * 12. NON-FINITE SCORE DEFENSIVE EXCLUSION
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          score: Number.NaN,
        }),

        authoritativeAssessment({
          authorityId: "authority-2",
          authorityFrameworkId: "framework-2",
          assessmentId: "assessment-2",
          assessmentFrameworkId: "framework-2",
          score: 70,
        }),
      ]
    );

  record(
    "12. Non-finite score cannot corrupt Organization aggregation",
    result.success &&
      result.aggregation.score === 70 &&
      result.aggregation.authoritativeFrameworkCount === 2 &&
      result.aggregation.scoredFrameworkCount === 1 &&
      result.aggregation.unscoredFrameworkCount === 1 &&
      result.aggregation.contributingAssessmentIds.length === 1 &&
      result.aggregation.contributingAssessmentIds[0] ===
        "assessment-2"
  );
}

/*
 * ============================================================
 * 13. CONTRIBUTOR ORDER IS DETERMINISTIC
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          authorityId: "authority-a",
          authorityFrameworkId: "framework-a",
          assessmentId: "assessment-a",
          assessmentFrameworkId: "framework-a",
          score: 10,
        }),

        authoritativeAssessment({
          authorityId: "authority-b",
          authorityFrameworkId: "framework-b",
          assessmentId: "assessment-b",
          assessmentFrameworkId: "framework-b",
          score: 20,
        }),

        authoritativeAssessment({
          authorityId: "authority-c",
          authorityFrameworkId: "framework-c",
          assessmentId: "assessment-c",
          assessmentFrameworkId: "framework-c",
          score: 30,
        }),
      ]
    );

  record(
    "13. Contributor metadata preserves deterministic authoritative input order",
    result.success &&
      result.aggregation.contributingAssessmentIds.join(
        ","
      ) ===
        "assessment-a,assessment-b,assessment-c"
  );
}

/*
 * ============================================================
 * 14. UNSCORED COUNT INCLUDES NULL AND NON-FINITE VALUES
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          authorityId: "authority-1",
          authorityFrameworkId: "framework-1",
          assessmentId: "assessment-1",
          assessmentFrameworkId: "framework-1",
          score: null,
        }),

        authoritativeAssessment({
          authorityId: "authority-2",
          authorityFrameworkId: "framework-2",
          assessmentId: "assessment-2",
          assessmentFrameworkId: "framework-2",
          score: Number.POSITIVE_INFINITY,
        }),

        authoritativeAssessment({
          authorityId: "authority-3",
          authorityFrameworkId: "framework-3",
          assessmentId: "assessment-3",
          assessmentFrameworkId: "framework-3",
          score: 50,
        }),
      ]
    );

  record(
    "14. Aggregation metadata accurately distinguishes authoritative and scored Frameworks",
    result.success &&
      result.aggregation.score === 50 &&
      result.aggregation.authoritativeFrameworkCount === 3 &&
      result.aggregation.scoredFrameworkCount === 1 &&
      result.aggregation.unscoredFrameworkCount === 2
  );
}

/*
 * ============================================================
 * 15. GENUINE ZERO WITH MULTIPLE FRAMEWORKS
 * ============================================================
 */

{
  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      [
        authoritativeAssessment({
          authorityId: "authority-1",
          authorityFrameworkId: "framework-1",
          assessmentId: "assessment-1",
          assessmentFrameworkId: "framework-1",
          score: 0,
        }),

        authoritativeAssessment({
          authorityId: "authority-2",
          authorityFrameworkId: "framework-2",
          assessmentId: "assessment-2",
          assessmentFrameworkId: "framework-2",
          score: 0,
        }),
      ]
    );

  record(
    "15. Multiple genuine 0% Framework scores remain a calculated Organization position",
    result.success &&
      result.aggregation.score === 0 &&
      result.aggregation.authoritativeFrameworkCount === 2 &&
      result.aggregation.scoredFrameworkCount === 2 &&
      result.aggregation.unscoredFrameworkCount === 0 &&
      result.aggregation.contributingAssessmentIds.length === 2
  );
}

/*
 * ============================================================
 * 16. HISTORICAL ASSESSMENTS CANNOT ENTER IMPLICITLY
 * ============================================================
 *
 * The pure policy accepts only explicit authoritative inputs.
 *
 * There is no Organization-wide Assessment collection, no
 * createdAt field, no Assessment status, and no "latest"
 * selection mechanism in this contract.
 *
 * This test demonstrates that only supplied authority-derived
 * inputs influence the result.
 * ============================================================
 */

{
  const authoritativeInputs = [
    authoritativeAssessment({
      authorityId: "authority-current",
      authorityFrameworkId: "framework-1",
      assessmentId: "assessment-current",
      assessmentFrameworkId: "framework-1",
      score: 90,
    }),
  ];

  /*
   * A hypothetical historical Assessment score of 10 is
   * deliberately absent because historical records are not part
   * of the aggregator input contract.
   */

  const result =
    calculateOrganizationComplianceAggregation(
      ORGANIZATION_ID,
      authoritativeInputs
    );

  record(
    "16. Historical Assessment scores cannot influence aggregation without explicit current authority",
    result.success &&
      result.aggregation.score === 90 &&
      result.aggregation.authoritativeFrameworkCount === 1 &&
      result.aggregation.scoredFrameworkCount === 1 &&
      result.aggregation.contributingAssessmentIds[0] ===
        "assessment-current"
  );
}

/*
 * ============================================================
 * RESULTS
 * ============================================================
 */

console.log(
  "============================================================"
);

console.log(
  " COMPLIANCEOS — ORGANIZATION AGGREGATION VERIFICATION"
);

console.log(
  "============================================================"
);

console.log();

for (const result of results) {
  console.log(
    `${result.passed ? "PASS" : "FAIL"} — ${result.name}`
  );

  if (
    !result.passed &&
    result.detail
  ) {
    console.log(
      `       ${result.detail}`
    );
  }
}

console.log();

const passed =
  results.filter(
    (result) => result.passed
  ).length;

const failed =
  results.length - passed;

console.log(
  `Passed: ${passed}/${results.length}`
);

console.log(
  `Failed: ${failed}/${results.length}`
);

console.log(
  "============================================================"
);

if (failed > 0) {
  process.exitCode = 1;
}
