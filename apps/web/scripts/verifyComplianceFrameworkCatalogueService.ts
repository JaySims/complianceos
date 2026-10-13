import { Prisma } from "@prisma/client";

import {
  getComplianceFrameworkCatalogueWithDatabase,
} from "@/lib/compliance/complianceFrameworkCatalogueService";
import {
  FRAMEWORK_CATALOGUE_MANIFEST_ALGORITHM_VERSION,
  buildFrameworkCatalogueManifestFingerprint,
} from "@/lib/compliance/frameworkCatalogueManifest";
import { createValidGovernedState } from "./frameworkCatalogueTestFixtures";

type TestResult = {
  name: string;
  passed: boolean;
};

const results: TestResult[] = [];

const record = (name: string, passed: boolean) =>
  results.push({ name, passed });

type ApprovalEvidence = {
  frameworkId: string;
  contentManifest: string;
  contentHash: string;
  manifestAlgorithmVersion: number;
};

type AuthorityRecord = {
  frameworkId: string;
  frameworkCatalogueApproval: ApprovalEvidence;
};

type MockDatabase = {
  authorities: AuthorityRecord[];
  frameworks: Map<string, ReturnType<typeof toPrismaFramework>>;
  authorityReads: number;
  frameworkReads: number;
};

function toPrismaFramework(
  state = createValidGovernedState()
) {
  return {
    ...state.framework,

    requirements: state.requirements.map((requirement) => ({
      ...requirement,

      currentApplicabilityAuthority:
        requirement.currentApplicability
          ? {
              applicabilityDefinition:
                requirement.currentApplicability,
            }
          : null,
    })),

    regulatoryFactDefinitions: state.regulatoryFacts,
  };
}

function createApprovalEvidence(
  state = createValidGovernedState()
): ApprovalEvidence {
  const fingerprint =
    buildFrameworkCatalogueManifestFingerprint(state);

  return {
    frameworkId: state.framework.id,
    contentManifest: fingerprint.contentManifest,
    contentHash: fingerprint.contentHash,
    manifestAlgorithmVersion:
      fingerprint.manifestAlgorithmVersion,
  };
}

function createMockDatabase(
  input?: {
    authorities?: AuthorityRecord[];
    frameworks?: Array<ReturnType<typeof toPrismaFramework>>;
  }
): {
  database: MockDatabase;
  client: Prisma.TransactionClient;
} {
  const database: MockDatabase = {
    authorities: input?.authorities ?? [],
    frameworks: new Map(
      (input?.frameworks ?? []).map((framework) => [
        framework.id,
        framework,
      ])
    ),
    authorityReads: 0,
    frameworkReads: 0,
  };

  const client = {
    currentFrameworkCatalogueAuthority: {
      findMany: async () => {
        database.authorityReads += 1;

        return [...database.authorities].sort(
          (left, right) => {
            const leftFramework =
              database.frameworks.get(left.frameworkId);

            const rightFramework =
              database.frameworks.get(right.frameworkId);

            const leftName = leftFramework?.name ?? "";
            const rightName = rightFramework?.name ?? "";

            if (leftName < rightName) return -1;
            if (leftName > rightName) return 1;

            if (left.frameworkId < right.frameworkId) return -1;
            if (left.frameworkId > right.frameworkId) return 1;

            return 0;
          }
        );
      },
    },

    framework: {
      findUnique: async ({
        where,
      }: {
        where: { id: string };
      }) => {
        database.frameworkReads += 1;

        return database.frameworks.get(where.id) ?? null;
      },
    },
  } as unknown as Prisma.TransactionClient;

  return {
    database,
    client,
  };
}

function createStateForFramework(input: {
  id: string;
  name: string;
}) {
  const state = structuredClone(
    createValidGovernedState()
  );

  state.framework.id = input.id;
  state.framework.name = input.name;

  for (const requirement of state.requirements) {
    requirement.frameworkId = input.id;
  }

  for (const fact of state.regulatoryFacts) {
    fact.frameworkId = input.id;
  }

  return state;
}

async function main() {
  const empty = createMockDatabase();

  const emptyResult =
    await getComplianceFrameworkCatalogueWithDatabase(
      empty.client
    );

  record(
    "zero current authorities returns successful empty catalogue",
    emptyResult.success &&
      emptyResult.entries.length === 0
  );

  record(
    "catalogue discovery reads current authority exactly once",
    empty.database.authorityReads === 1
  );

  record(
    "zero authorities performs no framework governed-state reads",
    empty.database.frameworkReads === 0
  );

  const unpublishedState =
    createValidGovernedState();

  const unpublished = createMockDatabase({
    frameworks: [
      toPrismaFramework(unpublishedState),
    ],
  });

  const unpublishedResult =
    await getComplianceFrameworkCatalogueWithDatabase(
      unpublished.client
    );

  record(
    "framework existence without current authority is invisible",
    unpublishedResult.success &&
      unpublishedResult.entries.length === 0
  );

  const approvalOnly = createMockDatabase({
    frameworks: [
      toPrismaFramework(unpublishedState),
    ],
  });

  const approvalOnlyResult =
    await getComplianceFrameworkCatalogueWithDatabase(
      approvalOnly.client
    );

  record(
    "approval without current authority cannot expose framework",
    approvalOnlyResult.success &&
      approvalOnlyResult.entries.length === 0
  );

  const validState =
    createValidGovernedState();

  const validApproval =
    createApprovalEvidence(validState);

  const valid = createMockDatabase({
    authorities: [
      {
        frameworkId: validState.framework.id,
        frameworkCatalogueApproval: validApproval,
      },
    ],
    frameworks: [
      toPrismaFramework(validState),
    ],
  });

  const validResult =
    await getComplianceFrameworkCatalogueWithDatabase(
      valid.client
    );

  record(
    "valid current authority exposes framework",
    validResult.success &&
      validResult.entries.length === 1
  );

  record(
    "visible entry uses validated governed-state identity",
    validResult.success &&
      validResult.entries[0]?.id ===
        validState.framework.id
  );

  record(
    "visible entry uses validated governed-state name",
    validResult.success &&
      validResult.entries[0]?.name ===
        validState.framework.name
  );

  record(
    "visible entry preserves governed-state version",
    validResult.success &&
      validResult.entries[0]?.version ===
        validState.framework.version
  );

  record(
    "visible entry preserves governed-state description",
    validResult.success &&
      validResult.entries[0]?.description ===
        validState.framework.description
  );

  const wrongFrameworkApproval = {
    ...validApproval,
    frameworkId: "framework-other",
  };

  const crossFramework = createMockDatabase({
    authorities: [
      {
        frameworkId: validState.framework.id,
        frameworkCatalogueApproval:
          wrongFrameworkApproval,
      },
    ],
    frameworks: [
      toPrismaFramework(validState),
    ],
  });

  const crossFrameworkResult =
    await getComplianceFrameworkCatalogueWithDatabase(
      crossFramework.client
    );

  record(
    "cross-framework authority approval fails catalogue read closed",
    !crossFrameworkResult.success &&
      crossFrameworkResult.reason ===
        "FRAMEWORK_CATALOGUE_READ_FAILED"
  );

  const unsupportedAlgorithm = createMockDatabase({
    authorities: [
      {
        frameworkId: validState.framework.id,
        frameworkCatalogueApproval: {
          ...validApproval,
          manifestAlgorithmVersion:
            FRAMEWORK_CATALOGUE_MANIFEST_ALGORITHM_VERSION +
            1,
        },
      },
    ],
    frameworks: [
      toPrismaFramework(validState),
    ],
  });

  const unsupportedAlgorithmResult =
    await getComplianceFrameworkCatalogueWithDatabase(
      unsupportedAlgorithm.client
    );

  record(
    "unsupported manifest algorithm fails catalogue read closed",
    !unsupportedAlgorithmResult.success &&
      unsupportedAlgorithmResult.reason ===
        "FRAMEWORK_CATALOGUE_READ_FAILED"
  );

  const corruptManifest = createMockDatabase({
    authorities: [
      {
        frameworkId: validState.framework.id,
        frameworkCatalogueApproval: {
          ...validApproval,
          contentManifest:
            `${validApproval.contentManifest} `,
        },
      },
    ],
    frameworks: [
      toPrismaFramework(validState),
    ],
  });

  const corruptManifestResult =
    await getComplianceFrameworkCatalogueWithDatabase(
      corruptManifest.client
    );

  record(
    "persisted manifest/hash mismatch fails catalogue read closed",
    !corruptManifestResult.success &&
      corruptManifestResult.reason ===
        "FRAMEWORK_CATALOGUE_READ_FAILED"
  );

  const driftedState =
    createValidGovernedState();

  driftedState.framework.description =
    "Unapproved live catalogue drift";

  const drift = createMockDatabase({
    authorities: [
      {
        frameworkId: validState.framework.id,
        frameworkCatalogueApproval: validApproval,
      },
    ],
    frameworks: [
      toPrismaFramework(driftedState),
    ],
  });

  const driftResult =
    await getComplianceFrameworkCatalogueWithDatabase(
      drift.client
    );

  record(
    "live governed catalogue drift fails read closed",
    !driftResult.success &&
      driftResult.reason ===
        "FRAMEWORK_CATALOGUE_READ_FAILED"
  );

  const invalidState =
    createValidGovernedState();

  invalidState.requirements[0]!.currentApplicability =
    null;

  const invalidStructure = createMockDatabase({
    authorities: [
      {
        frameworkId: validState.framework.id,
        frameworkCatalogueApproval: validApproval,
      },
    ],
    frameworks: [
      toPrismaFramework(invalidState),
    ],
  });

  const invalidStructureResult =
    await getComplianceFrameworkCatalogueWithDatabase(
      invalidStructure.client
    );

  record(
    "structurally ineligible governed state fails catalogue read closed",
    !invalidStructureResult.success &&
      invalidStructureResult.reason ===
        "FRAMEWORK_CATALOGUE_READ_FAILED"
  );

  const missingFramework = createMockDatabase({
    authorities: [
      {
        frameworkId: validState.framework.id,
        frameworkCatalogueApproval: validApproval,
      },
    ],
  });

  const missingFrameworkResult =
    await getComplianceFrameworkCatalogueWithDatabase(
      missingFramework.client
    );

  record(
    "governed-state load failure fails catalogue read closed",
    !missingFrameworkResult.success &&
      missingFrameworkResult.reason ===
        "FRAMEWORK_CATALOGUE_READ_FAILED"
  );

  const withdrawn = createMockDatabase({
    authorities: [],
    frameworks: [
      toPrismaFramework(validState),
    ],
  });

  const withdrawnResult =
    await getComplianceFrameworkCatalogueWithDatabase(
      withdrawn.client
    );

  record(
    "withdrawn framework with no current authority is invisible",
    withdrawnResult.success &&
      withdrawnResult.entries.length === 0
  );

  const alphaState =
    createStateForFramework({
      id: "framework-alpha",
      name: "Alpha Framework",
    });

  const betaState =
    createStateForFramework({
      id: "framework-beta",
      name: "Beta Framework",
    });

  const ordered = createMockDatabase({
    authorities: [
      {
        frameworkId: betaState.framework.id,
        frameworkCatalogueApproval:
          createApprovalEvidence(betaState),
      },
      {
        frameworkId: alphaState.framework.id,
        frameworkCatalogueApproval:
          createApprovalEvidence(alphaState),
      },
    ],
    frameworks: [
      toPrismaFramework(betaState),
      toPrismaFramework(alphaState),
    ],
  });

  const orderedResult =
    await getComplianceFrameworkCatalogueWithDatabase(
      ordered.client
    );

  record(
    "multiple valid published frameworks preserve deterministic catalogue order",
    orderedResult.success &&
      orderedResult.entries.length === 2 &&
      orderedResult.entries[0]?.id ===
        "framework-alpha" &&
      orderedResult.entries[1]?.id ===
        "framework-beta"
  );

  for (const result of results) {
    console.log(
      `${result.passed ? "PASS" : "FAIL"} — ${result.name}`
    );
  }

  const failed =
    results.filter((result) => !result.passed).length;

  console.log(
    `RESULT — ${results.length - failed} PASS / ${failed} FAIL`
  );

  if (failed > 0) process.exitCode = 1;
}

void main();