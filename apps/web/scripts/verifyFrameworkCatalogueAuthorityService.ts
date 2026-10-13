import { Prisma } from "@prisma/client";

import {
  establishFrameworkCatalogueAuthorityInTransaction,
  replaceFrameworkCatalogueAuthorityInTransaction,
} from "@/lib/compliance/frameworkCatalogueAuthorityService";
import { buildFrameworkCatalogueManifestFingerprint } from "@/lib/compliance/frameworkCatalogueManifest";
import { createValidGovernedState } from "./frameworkCatalogueTestFixtures";

type TestResult = { name: string; passed: boolean };
const results: TestResult[] = [];
const record = (name: string, passed: boolean) =>
  results.push({ name, passed });

type ApprovalRecord = {
  id: string;
  frameworkId: string;
  contentManifest: string;
  contentHash: string;
  manifestAlgorithmVersion: number;
};

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
  authority: AuthorityRecord | null;
  transitions: TransitionRecord[];
  authorityCreates: number;
  authorityUpdates: number;
  simulateConcurrentChange?: boolean;
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
      findUnique: async ({ where }: { where: { id: string } }) =>
        database.approvals.find((approval) => approval.id === where.id) ?? null,
    },

    currentFrameworkCatalogueAuthority: {
      findUnique: async () => database.authority,

      create: async ({
        data,
      }: {
        data: Omit<AuthorityRecord, "id" | "establishedAt">;
      }) => {
        const created: AuthorityRecord = {
          id: "authority-1",
          establishedAt: new Date("2026-01-01T00:00:00.000Z"),
          ...data,
        };

        database.authority = created;
        database.authorityCreates += 1;
        return created;
      },

      updateMany: async ({
        data,
      }: {
        data: {
          frameworkCatalogueApprovalId: string;
          establishedAt: Date;
          establishedById: string;
          reason: string;
        };
      }) => {
        database.authorityUpdates += 1;

        if (!database.authority || database.simulateConcurrentChange) {
          return { count: 0 };
        }

        database.authority = {
          ...database.authority,
          ...data,
        };

        return { count: 1 };
      },
    },

    frameworkCatalogueAuthorityTransition: {
      create: async ({ data }: { data: TransitionRecord }) => {
        database.transitions.push(data);
        return data;
      },
    },
  } as unknown as Prisma.TransactionClient;
}

function createValidApproval(
  id: string,
  frameworkId = "framework-1"
): ApprovalRecord {
  const fingerprint =
    buildFrameworkCatalogueManifestFingerprint(createValidGovernedState());

  return {
    id,
    frameworkId,
    contentManifest: fingerprint.contentManifest,
    contentHash: fingerprint.contentHash,
    manifestAlgorithmVersion: fingerprint.manifestAlgorithmVersion,
  };
}

async function main() {
  const establishDatabase: MockDatabase = {
    approvals: [createValidApproval("approval-1")],
    authority: null,
    transitions: [],
    authorityCreates: 0,
    authorityUpdates: 0,
  };

  const establishResult =
    await establishFrameworkCatalogueAuthorityInTransaction(
      createMockTransaction(establishDatabase),
      {
        frameworkId: "framework-1",
        frameworkCatalogueApprovalId: "approval-1",
        actorUserId: "user-1",
        reason: "8L.51E establish proof",
      }
    );

  record("valid ESTABLISH succeeds", establishResult.success);
  record(
    "ESTABLISH creates exactly one authority",
    establishDatabase.authorityCreates === 1
  );
  record(
    "ESTABLISH points to approved catalogue",
    establishDatabase.authority?.frameworkCatalogueApprovalId === "approval-1"
  );
  record(
    "ESTABLISH preserves actor",
    establishDatabase.authority?.establishedById === "user-1"
  );
  record(
    "ESTABLISH records exactly one transition",
    establishDatabase.transitions.length === 1
  );

  const establishTransition = establishDatabase.transitions[0];

  record(
    "ESTABLISH transition type is explicit",
    establishTransition?.transitionType === "ESTABLISH"
  );
  record(
    "ESTABLISH transition previous approval is null",
    establishTransition?.previousFrameworkCatalogueApprovalId === null
  );
  record(
    "ESTABLISH transition records new approval",
    establishTransition?.newFrameworkCatalogueApprovalId === "approval-1"
  );

  const existingDatabase: MockDatabase = {
    approvals: [createValidApproval("approval-1")],
    authority: {
      id: "authority-existing",
      frameworkId: "framework-1",
      frameworkCatalogueApprovalId: "approval-1",
      establishedAt: new Date("2026-01-01T00:00:00.000Z"),
      establishedById: "user-1",
      reason: "existing authority",
    },
    transitions: [],
    authorityCreates: 0,
    authorityUpdates: 0,
  };

  const existingResult =
    await establishFrameworkCatalogueAuthorityInTransaction(
      createMockTransaction(existingDatabase),
      {
        frameworkId: "framework-1",
        frameworkCatalogueApprovalId: "approval-1",
        actorUserId: "user-2",
        reason: "must not establish twice",
      }
    );

  record(
    "existing authority blocks ESTABLISH",
    !existingResult.success &&
      existingResult.reason === "CURRENT_AUTHORITY_ALREADY_EXISTS"
  );
  record(
    "blocked ESTABLISH creates no authority",
    existingDatabase.authorityCreates === 0
  );
  record(
    "blocked ESTABLISH creates no transition",
    existingDatabase.transitions.length === 0
  );

  const crossFrameworkDatabase: MockDatabase = {
    approvals: [createValidApproval("approval-cross", "framework-2")],
    authority: null,
    transitions: [],
    authorityCreates: 0,
    authorityUpdates: 0,
  };

  const crossFrameworkResult =
    await establishFrameworkCatalogueAuthorityInTransaction(
      createMockTransaction(crossFrameworkDatabase),
      {
        frameworkId: "framework-1",
        frameworkCatalogueApprovalId: "approval-cross",
        actorUserId: "user-1",
        reason: "must reject cross-framework approval",
      }
    );

  record(
    "cross-framework approval fails closed",
    !crossFrameworkResult.success &&
      crossFrameworkResult.reason === "APPROVAL_FRAMEWORK_MISMATCH"
  );
  record(
    "cross-framework rejection creates no authority",
    crossFrameworkDatabase.authorityCreates === 0
  );
  record(
    "cross-framework rejection creates no transition",
    crossFrameworkDatabase.transitions.length === 0
  );

  const driftDatabase: MockDatabase = {
    approvals: [createValidApproval("approval-drift")],
    authority: null,
    transitions: [],
    authorityCreates: 0,
    authorityUpdates: 0,
  };

  const driftFramework = toPrismaFramework();
  driftFramework.name = "Drifted Framework Name";

  const driftResult =
    await establishFrameworkCatalogueAuthorityInTransaction(
      createMockTransaction(driftDatabase, driftFramework),
      {
        frameworkId: "framework-1",
        frameworkCatalogueApprovalId: "approval-drift",
        actorUserId: "user-1",
        reason: "must reject catalogue drift",
      }
    );

  record(
    "catalogue fingerprint drift blocks ESTABLISH",
    !driftResult.success &&
      driftResult.reason === "LIVE_CATALOGUE_FINGERPRINT_MISMATCH"
  );
  record(
    "drift rejection creates no authority",
    driftDatabase.authorityCreates === 0
  );
  record(
    "drift rejection creates no transition",
    driftDatabase.transitions.length === 0
  );


  const replaceDatabase: MockDatabase = {
    approvals: [
      createValidApproval("approval-1"),
      createValidApproval("approval-2"),
    ],
    authority: {
      id: "authority-replace",
      frameworkId: "framework-1",
      frameworkCatalogueApprovalId: "approval-1",
      establishedAt: new Date("2026-01-01T00:00:00.000Z"),
      establishedById: "user-1",
      reason: "original authority",
    },
    transitions: [],
    authorityCreates: 0,
    authorityUpdates: 0,
  };

  const replaceResult =
    await replaceFrameworkCatalogueAuthorityInTransaction(
      createMockTransaction(replaceDatabase),
      {
        frameworkId: "framework-1",
        frameworkCatalogueApprovalId: "approval-2",
        actorUserId: "user-2",
        reason: "8L.51E replace proof",
      }
    );

  record("valid REPLACE succeeds", replaceResult.success);
  record(
    "REPLACE performs exactly one guarded update",
    replaceDatabase.authorityUpdates === 1
  );
  record(
    "REPLACE installs new approval",
    replaceDatabase.authority?.frameworkCatalogueApprovalId === "approval-2"
  );
  record(
    "REPLACE preserves new actor",
    replaceDatabase.authority?.establishedById === "user-2"
  );
  record(
    "REPLACE records exactly one transition",
    replaceDatabase.transitions.length === 1
  );

  const replaceTransition = replaceDatabase.transitions[0];

  record(
    "REPLACE transition type is explicit",
    replaceTransition?.transitionType === "REPLACE"
  );
  record(
    "REPLACE transition preserves previous approval",
    replaceTransition?.previousFrameworkCatalogueApprovalId === "approval-1"
  );
  record(
    "REPLACE transition records new approval",
    replaceTransition?.newFrameworkCatalogueApprovalId === "approval-2"
  );

  const sameApprovalDatabase: MockDatabase = {
    approvals: [createValidApproval("approval-1")],
    authority: {
      id: "authority-same",
      frameworkId: "framework-1",
      frameworkCatalogueApprovalId: "approval-1",
      establishedAt: new Date("2026-01-01T00:00:00.000Z"),
      establishedById: "user-1",
      reason: "current authority",
    },
    transitions: [],
    authorityCreates: 0,
    authorityUpdates: 0,
  };

  const sameApprovalResult =
    await replaceFrameworkCatalogueAuthorityInTransaction(
      createMockTransaction(sameApprovalDatabase),
      {
        frameworkId: "framework-1",
        frameworkCatalogueApprovalId: "approval-1",
        actorUserId: "user-2",
        reason: "must reject same approval",
      }
    );

  record(
    "same approval blocks REPLACE",
    !sameApprovalResult.success &&
      sameApprovalResult.reason === "SAME_APPROVAL_ALREADY_AUTHORITATIVE"
  );
  record(
    "same approval performs no update",
    sameApprovalDatabase.authorityUpdates === 0
  );
  record(
    "same approval creates no transition",
    sameApprovalDatabase.transitions.length === 0
  );

  const missingCurrentDatabase: MockDatabase = {
    approvals: [createValidApproval("approval-2")],
    authority: null,
    transitions: [],
    authorityCreates: 0,
    authorityUpdates: 0,
  };

  const missingCurrentResult =
    await replaceFrameworkCatalogueAuthorityInTransaction(
      createMockTransaction(missingCurrentDatabase),
      {
        frameworkId: "framework-1",
        frameworkCatalogueApprovalId: "approval-2",
        actorUserId: "user-2",
        reason: "must require current authority",
      }
    );

  record(
    "missing current authority blocks REPLACE",
    !missingCurrentResult.success &&
      missingCurrentResult.reason === "CURRENT_AUTHORITY_NOT_FOUND"
  );
  record(
    "missing current authority performs no update",
    missingCurrentDatabase.authorityUpdates === 0
  );
  record(
    "missing current authority creates no transition",
    missingCurrentDatabase.transitions.length === 0
  );

  const staleReplaceDatabase: MockDatabase = {
    approvals: [
      createValidApproval("approval-1"),
      createValidApproval("approval-2"),
    ],
    authority: {
      id: "authority-stale",
      frameworkId: "framework-1",
      frameworkCatalogueApprovalId: "approval-1",
      establishedAt: new Date("2026-01-01T00:00:00.000Z"),
      establishedById: "user-1",
      reason: "observed authority",
    },
    transitions: [],
    authorityCreates: 0,
    authorityUpdates: 0,
    simulateConcurrentChange: true,
  };

  const staleReplaceResult =
    await replaceFrameworkCatalogueAuthorityInTransaction(
      createMockTransaction(staleReplaceDatabase),
      {
        frameworkId: "framework-1",
        frameworkCatalogueApprovalId: "approval-2",
        actorUserId: "user-2",
        reason: "stale replacement proof",
      }
    );

  record(
    "stale authority change fails REPLACE closed",
    !staleReplaceResult.success &&
      staleReplaceResult.reason === "CURRENT_AUTHORITY_CHANGED"
  );
  record(
    "stale REPLACE attempts exactly one guarded update",
    staleReplaceDatabase.authorityUpdates === 1
  );
  record(
    "stale REPLACE creates no transition",
    staleReplaceDatabase.transitions.length === 0
  );

  for (const result of results) {
    console.log(`${result.passed ? "PASS" : "FAIL"} — ${result.name}`);
  }

  const failed = results.filter((result) => !result.passed).length;
  console.log(`RESULT — ${results.length - failed} PASS / ${failed} FAIL`);

  if (failed > 0) process.exitCode = 1;
}

void main();
