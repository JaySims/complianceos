import {
  isEvidenceQueryFrameworkValid,
  isEvidenceQueryTenantValid,
} from "../lib/compliance/evidenceQueryService";


/*
 * ============================================================
 * COMPLIANCEOS — EVIDENCE QUERY POLICY VERIFICATION
 * ============================================================
 *
 * Deterministic verification of the pure tenant and framework
 * integrity policies used by the Evidence Query Boundary.
 *
 * This script performs no database writes.
 * ============================================================
 */


type TestCase = {
  name: string;
  actual: boolean;
  expected: boolean;
};


const tests: TestCase[] = [
  /*
   * ----------------------------------------------------------
   * TENANT INTEGRITY
   * ----------------------------------------------------------
   */

  {
    name:
      "Same-organization Assessment with no Document is valid",

    actual:
      isEvidenceQueryTenantValid(
        "org-alpha",
        {
          assessmentOrganizationId:
            "org-alpha",

          documentOrganizationId:
            null,
        }
      ),

    expected:
      true,
  },

  {
    name:
      "Same-organization Assessment and Document are valid",

    actual:
      isEvidenceQueryTenantValid(
        "org-alpha",
        {
          assessmentOrganizationId:
            "org-alpha",

          documentOrganizationId:
            "org-alpha",
        }
      ),

    expected:
      true,
  },

  {
    name:
      "Foreign Assessment is rejected",

    actual:
      isEvidenceQueryTenantValid(
        "org-alpha",
        {
          assessmentOrganizationId:
            "org-beta",

          documentOrganizationId:
            null,
        }
      ),

    expected:
      false,
  },

  {
    name:
      "Foreign Assessment remains invalid with local Document",

    actual:
      isEvidenceQueryTenantValid(
        "org-alpha",
        {
          assessmentOrganizationId:
            "org-beta",

          documentOrganizationId:
            "org-alpha",
        }
      ),

    expected:
      false,
  },

  {
    name:
      "Foreign Document is rejected",

    actual:
      isEvidenceQueryTenantValid(
        "org-alpha",
        {
          assessmentOrganizationId:
            "org-alpha",

          documentOrganizationId:
            "org-beta",
        }
      ),

    expected:
      false,
  },

  {
    name:
      "Foreign Assessment and foreign Document are rejected",

    actual:
      isEvidenceQueryTenantValid(
        "org-alpha",
        {
          assessmentOrganizationId:
            "org-beta",

          documentOrganizationId:
            "org-beta",
        }
      ),

    expected:
      false,
  },


  /*
   * ----------------------------------------------------------
   * FRAMEWORK INTEGRITY
   * ----------------------------------------------------------
   */

  {
    name:
      "Evidence with no Requirement is framework-valid",

    actual:
      isEvidenceQueryFrameworkValid(
        "framework-tax",
        null
      ),

    expected:
      true,
  },

  {
    name:
      "Matching Requirement framework is valid",

    actual:
      isEvidenceQueryFrameworkValid(
        "framework-tax",
        "framework-tax"
      ),

    expected:
      true,
  },

  {
    name:
      "Foreign Requirement framework is rejected",

    actual:
      isEvidenceQueryFrameworkValid(
        "framework-tax",
        "framework-labour"
      ),

    expected:
      false,
  },

  {
    name:
      "Framework prefix match is rejected",

    actual:
      isEvidenceQueryFrameworkValid(
        "framework-tax",
        "framework-tax-extra"
      ),

    expected:
      false,
  },

  {
    name:
      "Framework comparison is case-sensitive",

    actual:
      isEvidenceQueryFrameworkValid(
        "framework-tax",
        "FRAMEWORK-TAX"
      ),

    expected:
      false,
  },


  /*
   * ----------------------------------------------------------
   * ADDITIONAL TENANT BOUNDARIES
   * ----------------------------------------------------------
   */

  {
    name:
      "Organization identifiers require exact equality",

    actual:
      isEvidenceQueryTenantValid(
        "org-alpha",
        {
          assessmentOrganizationId:
            "org-alpha-extra",

          documentOrganizationId:
            null,
        }
      ),

    expected:
      false,
  },

  {
    name:
      "Organization comparison is case-sensitive",

    actual:
      isEvidenceQueryTenantValid(
        "org-alpha",
        {
          assessmentOrganizationId:
            "ORG-ALPHA",

          documentOrganizationId:
            null,
        }
      ),

    expected:
      false,
  },

  {
    name:
      "Document organization comparison requires exact equality",

    actual:
      isEvidenceQueryTenantValid(
        "org-alpha",
        {
          assessmentOrganizationId:
            "org-alpha",

          documentOrganizationId:
            "org-alpha-extra",
        }
      ),

    expected:
      false,
  },

  {
    name:
      "Documentless unmapped Evidence is structurally valid",

    actual:
      isEvidenceQueryTenantValid(
        "org-alpha",
        {
          assessmentOrganizationId:
            "org-alpha",

          documentOrganizationId:
            null,
        }
      ) &&
      isEvidenceQueryFrameworkValid(
        "framework-tax",
        null
      ),

    expected:
      true,
  },
];


/*
 * ============================================================
 * EXECUTION
 * ============================================================
 */

let passed = 0;
let failed = 0;


console.log(
  "============================================================"
);

console.log(
  " COMPLIANCEOS — EVIDENCE QUERY POLICY VERIFICATION"
);

console.log(
  "============================================================"
);

console.log(
  `Running ${tests.length} deterministic tests.`
);

console.log("");


tests.forEach(
  (
    test,
    index
  ) => {
    if (
      test.actual ===
      test.expected
    ) {
      passed += 1;

      console.log(
        `PASS ${index + 1}: ${test.name}`
      );

      return;
    }

    failed += 1;

    console.error(
      `FAIL ${index + 1}: ${test.name}`
    );

    console.error(
      `  Expected: ${String(
        test.expected
      )}`
    );

    console.error(
      `  Actual:   ${String(
        test.actual
      )}`
    );
  }
);


console.log("");

console.log(
  "============================================================"
);

console.log(
  `RESULT: ${passed}/${tests.length} passed`
);

console.log(
  `FAILED: ${failed}`
);

console.log(
  "============================================================"
);


if (failed > 0) {
  process.exitCode = 1;
}
