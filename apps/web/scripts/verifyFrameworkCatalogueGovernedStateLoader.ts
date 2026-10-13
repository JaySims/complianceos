import { Prisma } from "@prisma/client";

import { loadFrameworkCatalogueGovernedState } from "../lib/compliance/frameworkCatalogueGovernedStateLoader";

type TestResult = { name: string; passed: boolean };
const results: TestResult[] = [];
const record = (name: string, passed: boolean) =>
  results.push({ name, passed });

function mockDatabase(
  framework: unknown,
  capture?: (args: unknown) => void
) {
  return {
    framework: {
      findUnique: async (args: unknown) => {
        capture?.(args);
        return framework;
      },
    },
  } as unknown as Prisma.TransactionClient;
}

function createFramework() {
  return {
    id: "framework-1",
    name: "Test Framework",
    version: "1",
    description: "Loader verification framework",
    requirements: [
      {
        id: "requirement-1",
        frameworkId: "framework-1",
        code: "REQ-001",
        title: "Active Requirement",
        description: null,
        category: "GOVERNANCE",
        authority: null,
        sourceTitle: null,
        sourceReference: null,
        sourceUrl: null,
        effectiveFrom: null,
        mandatory: true,
        weight: 1,
        active: true,
        currentApplicabilityAuthority: {
          applicabilityDefinition: {
            requirementId: "requirement-1",
            version: 2,
            status: "APPROVED",
            applicabilityClass: "GENERAL",
            resolutionPattern: "GENERAL_UNCONDITIONAL",
            ruleAst: { kind: "CONSTANT", value: true },
            ruleSchemaVersion: "1",
            sourceTitle: null,
            sourceReference: null,
            sourceUrl: null,
            effectiveFrom: null,
            effectiveUntil: null,
            dependencies: [
              { factDefinitionId: "fact-1", required: true },
            ],
          },
        },
      },
      {
        id: "requirement-2",
        frameworkId: "framework-1",
        code: "REQ-002",
        title: "Inactive Requirement",
        description: null,
        category: "GOVERNANCE",
        authority: null,
        sourceTitle: null,
        sourceReference: null,
        sourceUrl: null,
        effectiveFrom: null,
        mandatory: false,
        weight: 0,
        active: false,
        currentApplicabilityAuthority: null,
      },
    ],
    regulatoryFactDefinitions: [
      {
        id: "fact-1",
        frameworkId: "framework-1",
        key: "test_fact",
        name: "Test Fact",
        description: null,
        valueType: "ENUM",
        allowedContextTypes: ["ORGANIZATION"],
        sourceTitle: null,
        sourceReference: null,
        sourceUrl: null,
        effectiveFrom: null,
        active: false,
        options: [
          {
            value: "YES",
            label: "Yes",
            description: null,
            sortOrder: 1,
            active: false,
          },
        ],
      },
    ],
  };
}

async function main(): Promise<void> {
const missing = await loadFrameworkCatalogueGovernedState(
  mockDatabase(null),
  "missing"
);
record(
  "1. Missing framework fails closed",
  !missing.success && missing.reason === "FRAMEWORK_NOT_FOUND"
);

const loaded = await loadFrameworkCatalogueGovernedState(
  mockDatabase(createFramework()),
  "framework-1"
);

record(
  "2. Governed framework state loads",
  loaded.success
);

record(
  "3. Current applicability comes from explicit authority",
  loaded.success &&
    loaded.governedState.requirements[0]?.currentApplicability?.version === 2
);

record(
  "4. Inactive requirement preserves null current applicability",
  loaded.success &&
    loaded.governedState.requirements[1]?.active === false &&
    loaded.governedState.requirements[1]?.currentApplicability === null
);

record(
  "5. Inactive facts and options remain represented",
  loaded.success &&
    loaded.governedState.regulatoryFacts[0]?.active === false &&
    loaded.governedState.regulatoryFacts[0]?.options[0]?.active === false
);

record(
  "6. Applicability dependencies remain represented",
  loaded.success &&
    loaded.governedState.requirements[0]?.currentApplicability
      ?.dependencies[0]?.factDefinitionId === "fact-1"
);

let capturedQuery: unknown;
await loadFrameworkCatalogueGovernedState(
  mockDatabase(createFramework(), (args) => { capturedQuery = args; }),
  "framework-1"
);
const queryText = JSON.stringify(capturedQuery);
record(
  "7. Query selects applicability only through current authority",
  queryText.includes("currentApplicabilityAuthority") &&
    !queryText.includes("applicabilityDefinitions")
);
record(
  "8. Query does not filter governed collections by active state",
  !queryText.includes("\\\"where\\\":{\\\"active\\\":true}")
);

const malformed = createFramework();
malformed.requirements[0]!.currentApplicabilityAuthority!.applicabilityDefinition.ruleAst = {
  value: undefined,
} as unknown as { kind: string; value: boolean };
const malformedResult = await loadFrameworkCatalogueGovernedState(
  mockDatabase(malformed),
  "framework-1"
);
record(
  "9. Malformed rule AST JSON fails closed",
  !malformedResult.success &&
    malformedResult.reason === "INVALID_RULE_AST_JSON"
);

for (const result of results) {
  console.log(`${result.passed ? "PASS" : "FAIL"} — ${result.name}`);
}

const passed = results.filter((result) => result.passed).length;
const failed = results.length - passed;
console.log(`Passed: ${passed}  Failed: ${failed}`);
if (failed > 0) process.exitCode = 1;

}

void main();
