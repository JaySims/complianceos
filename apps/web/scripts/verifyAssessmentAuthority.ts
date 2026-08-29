import {
  canEstablishAssessmentAuthority,
  canSupersedeAssessmentAuthority,
  type AssessmentAuthorityCandidate,
  type AssessmentAuthoritySnapshot,
} from "../lib/compliance/assessmentAuthorityService";

type TestResult = {
  name: string;
  passed: boolean;
  detail: string;
};

const organizationA = "org-a";
const organizationB = "org-b";

const frameworkA = "framework-a";
const frameworkB = "framework-b";

const assessmentA: AssessmentAuthorityCandidate = {
  id: "assessment-a",
  organizationId: organizationA,
  frameworkId: frameworkA,
};

const assessmentB: AssessmentAuthorityCandidate = {
  id: "assessment-b",
  organizationId: organizationA,
  frameworkId: frameworkA,
};

const foreignOrganizationAssessment:
  AssessmentAuthorityCandidate = {
    id: "assessment-foreign-org",
    organizationId: organizationB,
    frameworkId: frameworkA,
  };

const foreignFrameworkAssessment:
  AssessmentAuthorityCandidate = {
    id: "assessment-foreign-framework",
    organizationId: organizationA,
    frameworkId: frameworkB,
  };

const authorityA: AssessmentAuthoritySnapshot = {
  organizationId: organizationA,
  frameworkId: frameworkA,
  assessmentId: assessmentA.id,
};

function record(
  results: TestResult[],
  name: string,
  passed: boolean,
  detail: string
): void {
  results.push({
    name,
    passed,
    detail,
  });
}

function expectSuccess(
  results: TestResult[],
  name: string,
  result: ReturnType<
    typeof canEstablishAssessmentAuthority
  >,
  detail: string
): void {
  record(
    results,
    name,
    result.success,
    detail
  );
}

function expectFailure(
  results: TestResult[],
  name: string,
  result:
    | ReturnType<
        typeof canEstablishAssessmentAuthority
      >
    | ReturnType<
        typeof canSupersedeAssessmentAuthority
      >,
  expectedReason: string,
  detail: string
): void {
  record(
    results,
    name,
    !result.success &&
      result.reason === expectedReason,
    detail
  );
}

function run(): void {
  const results: TestResult[] = [];

  /*
   * ==========================================================
   * INITIAL AUTHORITY
   * ==========================================================
   */

  expectSuccess(
    results,
    "1. Initial authority may be established when none exists",
    canEstablishAssessmentAuthority(
      organizationA,
      frameworkA,
      assessmentA,
      null
    ),
    "Valid same-tenant, same-framework Assessment is accepted."
  );

  expectFailure(
    results,
    "2. Initial authority rejects foreign Organization",
    canEstablishAssessmentAuthority(
      organizationA,
      frameworkA,
      foreignOrganizationAssessment,
      null
    ),
    "ASSESSMENT_ACCESS_DENIED",
    "Tenant boundary must be preserved."
  );

  expectFailure(
    results,
    "3. Initial authority rejects foreign Framework",
    canEstablishAssessmentAuthority(
      organizationA,
      frameworkA,
      foreignFrameworkAssessment,
      null
    ),
    "ASSESSMENT_FRAMEWORK_MISMATCH",
    "Framework boundary must be preserved."
  );

  expectFailure(
    results,
    "4. Existing authority cannot be silently replaced during establishment",
    canEstablishAssessmentAuthority(
      organizationA,
      frameworkA,
      assessmentB,
      authorityA
    ),
    "CURRENT_AUTHORITY_ALREADY_EXISTS",
    "Establishment is not supersession."
  );

  expectFailure(
    results,
    "5. Re-establishing the same authoritative Assessment is rejected",
    canEstablishAssessmentAuthority(
      organizationA,
      frameworkA,
      assessmentA,
      authorityA
    ),
    "ASSESSMENT_ALREADY_AUTHORITATIVE",
    "Authority establishment is not an idempotent replacement operation."
  );

  /*
   * ==========================================================
   * SUPERSESSION
   * ==========================================================
   */

  const validSupersession =
    canSupersedeAssessmentAuthority(
      organizationA,
      frameworkA,
      assessmentB,
      authorityA
    );

  record(
    results,
    "6. Current authority may be superseded by valid replacement",
    validSupersession.success,
    "Replacement belongs to the same Organization and Framework."
  );

  expectFailure(
    results,
    "7. Supersession requires existing authority",
    canSupersedeAssessmentAuthority(
      organizationA,
      frameworkA,
      assessmentB,
      null
    ),
    "CURRENT_AUTHORITY_NOT_FOUND",
    "Supersession cannot manufacture initial authority."
  );

  expectFailure(
    results,
    "8. Supersession rejects foreign Organization",
    canSupersedeAssessmentAuthority(
      organizationA,
      frameworkA,
      foreignOrganizationAssessment,
      authorityA
    ),
    "ASSESSMENT_ACCESS_DENIED",
    "Replacement cannot cross tenant boundaries."
  );

  expectFailure(
    results,
    "9. Supersession rejects foreign Framework",
    canSupersedeAssessmentAuthority(
      organizationA,
      frameworkA,
      foreignFrameworkAssessment,
      authorityA
    ),
    "ASSESSMENT_FRAMEWORK_MISMATCH",
    "Replacement cannot cross Framework boundaries."
  );

  expectFailure(
    results,
    "10. Authority cannot supersede itself",
    canSupersedeAssessmentAuthority(
      organizationA,
      frameworkA,
      assessmentA,
      authorityA
    ),
    "ASSESSMENT_ALREADY_AUTHORITATIVE",
    "Supersession must represent an actual authority change."
  );

  const mismatchedAuthority:
    AssessmentAuthoritySnapshot = {
      organizationId: organizationB,
      frameworkId: frameworkA,
      assessmentId: "assessment-x",
    };

  expectFailure(
    results,
    "11. Supersession rejects authority outside requested tenant tuple",
    canSupersedeAssessmentAuthority(
      organizationA,
      frameworkA,
      assessmentB,
      mismatchedAuthority
    ),
    "CURRENT_AUTHORITY_NOT_FOUND",
    "Observed authority must belong to the exact requested Organization and Framework."
  );

  const mismatchedFrameworkAuthority:
    AssessmentAuthoritySnapshot = {
      organizationId: organizationA,
      frameworkId: frameworkB,
      assessmentId: "assessment-y",
    };

  expectFailure(
    results,
    "12. Supersession rejects authority outside requested Framework tuple",
    canSupersedeAssessmentAuthority(
      organizationA,
      frameworkA,
      assessmentB,
      mismatchedFrameworkAuthority
    ),
    "CURRENT_AUTHORITY_NOT_FOUND",
    "Authority identity is scoped by Organization plus Framework."
  );

  /*
   * ==========================================================
   * REPORT
   * ==========================================================
   */

  console.log(
    "============================================================"
  );
  console.log(
    " COMPLIANCEOS — ASSESSMENT AUTHORITY VERIFICATION"
  );
  console.log(
    "============================================================"
  );

  for (const result of results) {
    console.log();
    console.log(
      `${result.passed ? "PASS" : "FAIL"} — ${result.name}`
    );
    console.log(result.detail);
  }

  const passed =
    results.filter(
      (result) => result.passed
    ).length;

  const failed =
    results.length - passed;

  console.log();
  console.log(
    "============================================================"
  );
  console.log(` Passed: ${passed}`);
  console.log(` Failed: ${failed}`);
  console.log(
    "============================================================"
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run();
