import { Prisma } from "@prisma/client";

import { createFrameworkCatalogueApprovalInTransaction } from "@/lib/compliance/frameworkCatalogueApprovalService";
import { buildFrameworkCatalogueManifestFingerprint } from "@/lib/compliance/frameworkCatalogueManifest";
import { createValidGovernedState } from "./frameworkCatalogueTestFixtures";

type TestResult = { name: string; passed: boolean };
const results: TestResult[] = [];
const record = (name: string, passed: boolean) => results.push({ name, passed });

type ApprovalRecord = {
  id: string;
  frameworkId: string;
  version: number;
  contentManifest: string;
  contentHash: string;
  manifestAlgorithmVersion: number;
  approvedAt: Date;
  approvedById: string;
  reason: string;
};

function toPrismaFramework() {
  const state = createValidGovernedState();
  return {
    ...state.framework,
    requirements: state.requirements.map((requirement) => ({
      ...requirement,
      currentApplicabilityAuthority: requirement.currentApplicability
        ? { applicabilityDefinition: requirement.currentApplicability }
        : null,
    })),
    regulatoryFactDefinitions: state.regulatoryFacts,
  };
}

type MockDatabase = {
  approvals: ApprovalRecord[];
  approvalWrites: number;
  corruptReread?: boolean;
};

function createMockTransaction(
  database: MockDatabase,
  framework = toPrismaFramework()
) {

  return {
    framework: {
      findUnique: async () => framework,
    },
    frameworkCatalogueApproval: {
      findFirst: async () => {
        const matches = database.approvals
          .filter((approval) => approval.frameworkId === framework.id)
          .sort((a, b) => b.version - a.version);
        return matches.length === 0 ? null : { version: matches[0].version };
      },
      create: async ({ data }: { data: Omit<ApprovalRecord, "id"> }) => {
        const created = { id: `approval-${database.approvals.length + 1}`, ...data };
        database.approvals.push(created);
        database.approvalWrites += 1;
        return created;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        database.corruptReread
          ? { ...database.approvals.find((approval) => approval.id === where.id)!, contentHash: "corrupted-hash" }
          : database.approvals.find((approval) => approval.id === where.id) ?? null,
    },
  } as unknown as Prisma.TransactionClient;
}

async function main() {
  const database: MockDatabase = { approvals: [], approvalWrites: 0 };
  const transaction = createMockTransaction(database);
  const expected = buildFrameworkCatalogueManifestFingerprint(createValidGovernedState());

  const result = await createFrameworkCatalogueApprovalInTransaction(transaction, {
    frameworkId: "framework-1",
    actorUserId: "user-1",
    reason: "8L.50G approval proof",
  });

  record("first approval succeeds", result.success);
  record("exactly one approval write", database.approvalWrites === 1);
  record("exactly one approval persisted", database.approvals.length === 1);

  const approval = database.approvals[0];
  record("first version is 1", approval?.version === 1);
  record("framework identity preserved", approval?.frameworkId === "framework-1");
  record("actor preserved", approval?.approvedById === "user-1");
  record("reason preserved", approval?.reason === "8L.50G approval proof");
  record("exact manifest persisted", approval?.contentManifest === expected.contentManifest);
  record("exact hash persisted", approval?.contentHash === expected.contentHash);
  record("algorithm version persisted", approval?.manifestAlgorithmVersion === expected.manifestAlgorithmVersion);

  const second = await createFrameworkCatalogueApprovalInTransaction(transaction, {
    frameworkId: "framework-1",
    actorUserId: "user-2",
    reason: "8L.50G second approval proof",
  });

  record("second approval succeeds", second.success);
  record("second approval increments version to 2", database.approvals[1]?.version === 2);
  record("second approval produces second write", database.approvalWrites === 2);
  record("approval history preserved", database.approvals.length === 2);
  record("first approval remains version 1", database.approvals[0]?.version === 1);

  const invalidDatabase: MockDatabase = {
    approvals: [],
    approvalWrites: 0,
  };
  const invalidFramework = toPrismaFramework();
  invalidFramework.requirements[0].currentApplicabilityAuthority = null;

  const invalidResult =
    await createFrameworkCatalogueApprovalInTransaction(
      createMockTransaction(invalidDatabase, invalidFramework),
      {
        frameworkId: "framework-1",
        actorUserId: "user-1",
        reason: "must fail structural eligibility",
      }
    );

  record(
    "structurally invalid catalogue fails closed",
    !invalidResult.success &&
      invalidResult.reason === "INVALID_GOVERNED_CATALOGUE_STATE"
  );
  record(
    "invalid catalogue performs zero approval writes",
    invalidDatabase.approvalWrites === 0
  );
  record(
    "invalid catalogue persists no approval",
    invalidDatabase.approvals.length === 0
  );

  const corruptDatabase: MockDatabase = {
    approvals: [],
    approvalWrites: 0,
    corruptReread: true,
  };

  let persistenceMismatchDetected = false;

  try {
    await createFrameworkCatalogueApprovalInTransaction(
      createMockTransaction(corruptDatabase),
      {
        frameworkId: "framework-1",
        actorUserId: "user-1",
        reason: "persistence verification proof",
      }
    );
  } catch (error) {
    persistenceMismatchDetected =
      error instanceof Error &&
      error.message ===
        "FRAMEWORK_CATALOGUE_APPROVAL_PERSISTENCE_VERIFICATION_FAILED";
  }

  record(
    "corrupted reread evidence is detected",
    persistenceMismatchDetected
  );
  record(
    "corrupted reread never reports approval success",
    persistenceMismatchDetected && corruptDatabase.approvalWrites === 1
  );

  for (const result of results) {
    console.log(`${result.passed ? "PASS" : "FAIL"} — ${result.name}`);
  }

  const failed = results.filter((result) => !result.passed).length;
  console.log(`RESULT — ${results.length - failed} PASS / ${failed} FAIL`);
  if (failed > 0) process.exitCode = 1;
}

void main();
