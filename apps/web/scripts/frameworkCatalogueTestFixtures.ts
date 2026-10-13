import type { FrameworkCatalogueGovernedState } from "../lib/compliance/frameworkCatalogueManifest";

export function createValidGovernedState(): FrameworkCatalogueGovernedState {
  return {
    framework: {
      id: "framework-1",
      name: "Test Framework",
      version: "1",
      description: "Manifest verification framework",
    },
    requirements: [
      {
        id: "requirement-1",
        frameworkId: "framework-1",
        code: "REQ-001",
        title: "Test Requirement",
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
        currentApplicability: {
          requirementId: "requirement-1",
          version: 1,
          status: "APPROVED",
          applicabilityClass: "GENERAL",
          resolutionPattern: "GENERAL_UNCONDITIONAL",
          ruleAst: { type: "literal", value: true },
          ruleSchemaVersion: "1",
          sourceTitle: null,
          sourceReference: null,
          sourceUrl: null,
          effectiveFrom: null,
          effectiveUntil: null,
          dependencies: [{ factDefinitionId: "fact-1", required: true }],
        },
      },
    ],
    regulatoryFacts: [
      {
        id: "fact-1",
        frameworkId: "framework-1",
        key: "test_fact",
        name: "Test Fact",
        description: null,
        valueType: "BOOLEAN",
        allowedContextTypes: ["ORGANIZATION"],
        sourceTitle: null,
        sourceReference: null,
        sourceUrl: null,
        effectiveFrom: null,
        active: true,
        options: [],
      },
    ],
  };
}

