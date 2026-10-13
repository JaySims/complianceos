import { Prisma } from "@prisma/client";

import { withdrawFrameworkCatalogueAuthorityInTransaction } from "@/lib/compliance/frameworkCatalogueAuthorityService";
import { createValidGovernedState } from "./frameworkCatalogueTestFixtures";

type TestResult = { name: string; passed: boolean };
const results: TestResult[] = [];
const record = (name: string, passed: boolean) => results.push({ name, passed });

type AuthorityRecord = {
  id: string;
  frameworkId: string;
  frameworkCatalogueApprovalId: string;
  establishedAt: Date;
  establishedById: string;
  reason: string;
};

type TransitionRecord = {
  frameworkId: string;
  previousFrameworkCatalogueApprovalId: string | null;
  newFrameworkCatalogueApprovalId: string | null;
  transitionType: string;
  transitionedById: string;
  reason: string;
};

type MockDatabase = {
  authority: AuthorityRecord | null;
  transitions: TransitionRecord[];
  deleteAttempts: number;
  simulateConcurrentChange?: boolean;
};

function createMockTransaction(database: MockDatabase) {
  return {
    currentFrameworkCatalogueAuthority: {
      findUnique: async () => database.authority,

      deleteMany: async () => {
        database.deleteAttempts += 1;

        if (!database.authority || database.simulateConcurrentChange) {
          database.authority = null;
          return { count: 0 };
        }

        database.authority = null;

        return { count: 1 };
      },
    },

    frameworkCatalogueAuthorityTransition: {
      create: async ({
        data,
      }: {
        data: TransitionRecord;
      }) => {
        database.transitions.push(data);

        return data;
      },
    },
  } as unknown as Prisma.TransactionClient;
}

async function main() {
  const database: MockDatabase = {
    authority: {
      id: "authority-1",
      frameworkId: "framework-1",
      frameworkCatalogueApprovalId: "approval-1",
      establishedAt: new Date(),
      establishedById: "user-1",
      reason: "initial authority establishment",
    },
    transitions: [],
    deleteAttempts: 0,
  };

  const result =
    await withdrawFrameworkCatalogueAuthorityInTransaction(
      createMockTransaction(database),
      {
        frameworkId: "framework-1",
        actorUserId: "user-2",
        reason: "withdrawal proof",
      }
    );

  record(
    "existing authority withdraw succeeds",
    result.success
  );

  record(
    "authority pointer removed",
    database.authority === null
  );

  record(
    "exactly one delete attempt performed",
    database.deleteAttempts === 1
  );

  const transition = database.transitions[0];

  record(
    "WITHDRAW transition recorded",
    transition?.transitionType === "WITHDRAW"
  );

  record(
    "previous approval preserved",
    transition?.previousFrameworkCatalogueApprovalId === "approval-1"
  );

  record(
    "new approval is null",
    transition?.newFrameworkCatalogueApprovalId === null
  );

  const emptyDatabase: MockDatabase = {
    authority: null,
    transitions: [],
    deleteAttempts: 0,
  };

  const emptyResult =
    await withdrawFrameworkCatalogueAuthorityInTransaction(
      createMockTransaction(emptyDatabase),
      {
        frameworkId: "framework-1",
        actorUserId: "user-2",
        reason: "withdraw without authority proof",
      }
    );

  record(
    "missing authority fails closed",
    !emptyResult.success &&
      emptyResult.reason === "CURRENT_AUTHORITY_NOT_FOUND"
  );

  record(
    "missing authority performs no delete",
    emptyDatabase.deleteAttempts === 0
  );

  record(
    "missing authority creates no transition",
    emptyDatabase.transitions.length === 0
  );

  const staleDatabase: MockDatabase = {
    authority: {
      id: "authority-1",
      frameworkId: "framework-1",
      frameworkCatalogueApprovalId: "approval-1",
      establishedAt: new Date(),
      establishedById: "user-1",
      reason: "stale authority proof",
    },
    transitions: [],
    deleteAttempts: 0,
    simulateConcurrentChange: true,
  };

  const staleResult =
    await withdrawFrameworkCatalogueAuthorityInTransaction(
      createMockTransaction(staleDatabase),
      {
        frameworkId: "framework-1",
        actorUserId: "user-2",
        reason: "stale withdrawal proof",
      }
    );

  record(
    "stale authority change fails closed",
    !staleResult.success &&
      staleResult.reason === "CURRENT_AUTHORITY_CHANGED"
  );

  record(
    "stale authority creates no transition",
    staleDatabase.transitions.length === 0
  );

  for (const result of results) {
    console.log(`${result.passed ? "PASS" : "FAIL"} — ${result.name}`);
  }

  const failed =
    results.filter((result) => !result.passed).length;

  console.log(
    `RESULT — ${results.length - failed} PASS / ${failed} FAIL`
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main();
