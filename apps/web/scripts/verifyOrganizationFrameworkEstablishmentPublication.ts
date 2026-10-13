import {
  AssessmentStatus,
  Prisma,
} from "@prisma/client";

import {
  establishOrganizationFrameworkInTransaction,
  type EstablishOrganizationFrameworkInput,
} from "@/lib/compliance/organizationFrameworkEstablishmentService";
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

type CatalogueAuthorityRecord = {
  frameworkId: string;
  frameworkCatalogueApproval: ApprovalEvidence;
};

type AssessmentAuthorityRecord = {
  organizationId: string;
  frameworkId: string;
  assessmentId: string;
};

type MockDatabase = {
  frameworks: Map<string, ReturnType<typeof toPrismaFramework>>;
  catalogueAuthorities: Map<string, CatalogueAuthorityRecord>;
  users: Set<string>;
  activeMemberships: Set<string>;
  assessmentAuthorities: Map<string, AssessmentAuthorityRecord>;
  frameworkReads: number;
  catalogueAuthorityReads: number;
  userReads: number;
  membershipReads: number;
  assessmentAuthorityReads: number;
  assessmentCreates: number;
  assessmentAuthorityCreates: number;
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

function assessmentAuthorityKey(
  organizationId: string,
  frameworkId: string
): string {
  return `${organizationId}::${frameworkId}`;
}

function membershipKey(
  userId: string,
  organizationId: string
): string {
  return `${userId}::${organizationId}`;
}

function createMockDatabase(input?: {
  frameworks?: Array<ReturnType<typeof toPrismaFramework>>;
  catalogueAuthorities?: CatalogueAuthorityRecord[];
  users?: string[];
  activeMemberships?: Array<{
    userId: string;
    organizationId: string;
  }>;
  assessmentAuthorities?: AssessmentAuthorityRecord[];
}): {
  database: MockDatabase;
  client: Prisma.TransactionClient;
} {
  const database: MockDatabase = {
    frameworks: new Map(
      (input?.frameworks ?? []).map((framework) => [
        framework.id,
        framework,
      ])
    ),

    catalogueAuthorities: new Map(
      (input?.catalogueAuthorities ?? []).map((authority) => [
        authority.frameworkId,
        authority,
      ])
    ),

    users: new Set(input?.users ?? []),

    activeMemberships: new Set(
      (input?.activeMemberships ?? []).map((membership) =>
        membershipKey(
          membership.userId,
          membership.organizationId
        )
      )
    ),

    assessmentAuthorities: new Map(
      (input?.assessmentAuthorities ?? []).map((authority) => [
        assessmentAuthorityKey(
          authority.organizationId,
          authority.frameworkId
        ),
        authority,
      ])
    ),

    frameworkReads: 0,
    catalogueAuthorityReads: 0,
    userReads: 0,
    membershipReads: 0,
    assessmentAuthorityReads: 0,
    assessmentCreates: 0,
    assessmentAuthorityCreates: 0,
  };

  const client = {
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

    currentFrameworkCatalogueAuthority: {
      findUnique: async ({
        where,
      }: {
        where: { frameworkId: string };
      }) => {
        database.catalogueAuthorityReads += 1;

        return (
          database.catalogueAuthorities.get(
            where.frameworkId
          ) ?? null
        );
      },
    },

    user: {
      findUnique: async ({
        where,
      }: {
        where: { id: string };
      }) => {
        database.userReads += 1;

        return database.users.has(where.id)
          ? { id: where.id }
          : null;
      },
    },

    organizationMember: {
      findUnique: async ({
        where,
      }: {
        where: {
          userId_organizationId: {
            userId: string;
            organizationId: string;
          };
        };
      }) => {
        database.membershipReads += 1;

        const key = membershipKey(
          where.userId_organizationId.userId,
          where.userId_organizationId.organizationId
        );

        return database.activeMemberships.has(key)
          ? { active: true }
          : null;
      },
    },

    currentAssessmentAuthority: {
      findUnique: async ({
        where,
      }: {
        where: {
          organizationId_frameworkId: {
            organizationId: string;
            frameworkId: string;
          };
        };
      }) => {
        database.assessmentAuthorityReads += 1;

        const key = assessmentAuthorityKey(
          where.organizationId_frameworkId.organizationId,
          where.organizationId_frameworkId.frameworkId
        );

        return database.assessmentAuthorities.get(key) ?? null;
      },

      create: async ({
        data,
      }: {
        data: AssessmentAuthorityRecord;
      }) => {
        database.assessmentAuthorityCreates += 1;

        const authority = {
          organizationId: data.organizationId,
          frameworkId: data.frameworkId,
          assessmentId: data.assessmentId,
        };

        database.assessmentAuthorities.set(
          assessmentAuthorityKey(
            authority.organizationId,
            authority.frameworkId
          ),
          authority
        );

        return authority;
      },
    },

    assessment: {
      create: async ({
        data,
      }: {
        data: {
          title: string;
          score: number | null;
          status: AssessmentStatus;
          organizationId: string;
          frameworkId: string;
          userId: string;
        };
      }) => {
        database.assessmentCreates += 1;

        return {
          id: `assessment-${database.assessmentCreates}`,
          title: data.title,
          score: data.score,
          status: data.status,
          organizationId: data.organizationId,
          frameworkId: data.frameworkId,
          userId: data.userId,
        };
      },
    },
  } as unknown as Prisma.TransactionClient;

  return {
    database,
    client,
  };
}

const input: EstablishOrganizationFrameworkInput = {
  organizationId: "organization-1",
  frameworkId: "framework-1",
  userId: "user-1",
  title: "Initial Compliance Assessment",
};

function createState() {
  const state = structuredClone(
    createValidGovernedState()
  );

  state.framework.id = input.frameworkId;

  for (const requirement of state.requirements) {
    requirement.frameworkId = input.frameworkId;
  }

  for (const fact of state.regulatoryFacts) {
    fact.frameworkId = input.frameworkId;
  }

  return state;
}

function createValidEstablishmentDatabase() {
  const state = createState();
  const approval = createApprovalEvidence(state);

  const mock = createMockDatabase({
    frameworks: [toPrismaFramework(state)],

    catalogueAuthorities: [
      {
        frameworkId: state.framework.id,
        frameworkCatalogueApproval: approval,
      },
    ],

    users: [input.userId],

    activeMemberships: [
      {
        userId: input.userId,
        organizationId: input.organizationId,
      },
    ],
  });

  return {
    state,
    approval,
    ...mock,
  };
}

async function expectFailure(
  name: string,
  mock: ReturnType<typeof createMockDatabase>,
  expectedReason:
    | "FRAMEWORK_NOT_FOUND"
    | "FRAMEWORK_NOT_PUBLISHED"
    | "FRAMEWORK_PUBLICATION_INVALID"
    | "USER_NOT_FOUND"
    | "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
    | "CURRENT_AUTHORITY_ALREADY_EXISTS"
    | "ESTABLISHMENT_TRANSACTION_FAILED"
) {
  try {
    const result =
      await establishOrganizationFrameworkInTransaction(
        mock.client,
        input
      );

    record(
      name,
      !result.success &&
        result.reason === expectedReason &&
        mock.database.assessmentCreates === 0 &&
        mock.database.assessmentAuthorityCreates === 0
    );
  } catch (error) {
    const candidate = error as {
      reason?: string;
    };

    record(
      name,
      candidate.reason === expectedReason &&
        mock.database.assessmentCreates === 0 &&
        mock.database.assessmentAuthorityCreates === 0
    );
  }
}

async function main() {
  const missingFramework = createMockDatabase({
    users: [input.userId],
  });

  await expectFailure(
    "missing framework fails before establishment mutation",
    missingFramework,
    "FRAMEWORK_NOT_FOUND"
  );

  record(
    "missing framework does not read catalogue authority",
    missingFramework.database.catalogueAuthorityReads === 0
  );

  const unpublishedState = createState();

  const unpublished = createMockDatabase({
    frameworks: [toPrismaFramework(unpublishedState)],
    users: [input.userId],
  });

  await expectFailure(
    "existing unpublished framework blocks new establishment",
    unpublished,
    "FRAMEWORK_NOT_PUBLISHED"
  );

  record(
    "unpublished framework fails before user and membership reads",
    unpublished.database.userReads === 0 &&
      unpublished.database.membershipReads === 0
  );

  const valid = createValidEstablishmentDatabase();

  const validResult =
    await establishOrganizationFrameworkInTransaction(
      valid.client,
      input
    );

  record(
    "valid current publication permits organization establishment",
    validResult.success
  );

  record(
    "successful establishment creates exactly one assessment",
    valid.database.assessmentCreates === 1
  );

  record(
    "successful establishment creates exactly one current assessment authority",
    valid.database.assessmentAuthorityCreates === 1
  );

  record(
    "successful assessment begins in DRAFT lifecycle state",
    validResult.success &&
      validResult.assessment.status === AssessmentStatus.DRAFT
  );

  record(
    "successful assessment preserves requested organization and framework",
    validResult.success &&
      validResult.assessment.organizationId ===
        input.organizationId &&
      validResult.assessment.frameworkId ===
        input.frameworkId
  );

  const crossFrameworkState = createState();

  const crossFrameworkApproval = {
    ...createApprovalEvidence(crossFrameworkState),
    frameworkId: "framework-other",
  };

  const crossFramework = createMockDatabase({
    frameworks: [toPrismaFramework(crossFrameworkState)],

    catalogueAuthorities: [
      {
        frameworkId: input.frameworkId,
        frameworkCatalogueApproval:
          crossFrameworkApproval,
      },
    ],

    users: [input.userId],

    activeMemberships: [
      {
        userId: input.userId,
        organizationId: input.organizationId,
      },
    ],
  });

  await expectFailure(
    "cross-framework authority approval blocks establishment",
    crossFramework,
    "FRAMEWORK_PUBLICATION_INVALID"
  );

  const unsupportedState = createState();

  const unsupportedApproval = {
    ...createApprovalEvidence(unsupportedState),
    manifestAlgorithmVersion:
      FRAMEWORK_CATALOGUE_MANIFEST_ALGORITHM_VERSION + 1,
  };

  const unsupported = createMockDatabase({
    frameworks: [toPrismaFramework(unsupportedState)],

    catalogueAuthorities: [
      {
        frameworkId: input.frameworkId,
        frameworkCatalogueApproval: unsupportedApproval,
      },
    ],

    users: [input.userId],

    activeMemberships: [
      {
        userId: input.userId,
        organizationId: input.organizationId,
      },
    ],
  });

  await expectFailure(
    "unsupported manifest algorithm blocks establishment",
    unsupported,
    "FRAMEWORK_PUBLICATION_INVALID"
  );

  const corruptState = createState();

  const corruptApproval = {
    ...createApprovalEvidence(corruptState),
    contentManifest: '{"corrupt":true}',
  };

  const corrupt = createMockDatabase({
    frameworks: [toPrismaFramework(corruptState)],

    catalogueAuthorities: [
      {
        frameworkId: input.frameworkId,
        frameworkCatalogueApproval: corruptApproval,
      },
    ],

    users: [input.userId],

    activeMemberships: [
      {
        userId: input.userId,
        organizationId: input.organizationId,
      },
    ],
  });

  await expectFailure(
    "persisted approval manifest corruption blocks establishment",
    corrupt,
    "FRAMEWORK_PUBLICATION_INVALID"
  );

  const driftApprovedState = createState();
  const driftApproval =
    createApprovalEvidence(driftApprovedState);

  const driftLiveState = structuredClone(
    driftApprovedState
  );

  driftLiveState.framework.description =
    "Governed catalogue content changed after approval.";

  const drift = createMockDatabase({
    frameworks: [toPrismaFramework(driftLiveState)],

    catalogueAuthorities: [
      {
        frameworkId: input.frameworkId,
        frameworkCatalogueApproval: driftApproval,
      },
    ],

    users: [input.userId],

    activeMemberships: [
      {
        userId: input.userId,
        organizationId: input.organizationId,
      },
    ],
  });

  await expectFailure(
    "live governed catalogue drift blocks establishment",
    drift,
    "FRAMEWORK_PUBLICATION_INVALID"
  );

  const structurallyInvalidState = createState();

  structurallyInvalidState.requirements[0]!.currentApplicability =
    null;

  const structurallyInvalidApproval =
    createApprovalEvidence(createState());

  const structurallyInvalid = createMockDatabase({
    frameworks: [
      toPrismaFramework(structurallyInvalidState),
    ],

    catalogueAuthorities: [
      {
        frameworkId: input.frameworkId,
        frameworkCatalogueApproval:
          structurallyInvalidApproval,
      },
    ],

    users: [input.userId],

    activeMemberships: [
      {
        userId: input.userId,
        organizationId: input.organizationId,
      },
    ],
  });

  await expectFailure(
    "structurally ineligible governed state blocks establishment",
    structurallyInvalid,
    "FRAMEWORK_PUBLICATION_INVALID"
  );

  const withdrawnState = createState();

  const withdrawn = createMockDatabase({
    frameworks: [toPrismaFramework(withdrawnState)],
    users: [input.userId],

    activeMemberships: [
      {
        userId: input.userId,
        organizationId: input.organizationId,
      },
    ],
  });

  await expectFailure(
    "withdrawn framework with no current catalogue authority blocks new establishment",
    withdrawn,
    "FRAMEWORK_NOT_PUBLISHED"
  );

  const existingAuthoritySetup =
    createValidEstablishmentDatabase();

  existingAuthoritySetup.database.assessmentAuthorities.set(
    assessmentAuthorityKey(
      input.organizationId,
      input.frameworkId
    ),
    {
      organizationId: input.organizationId,
      frameworkId: input.frameworkId,
      assessmentId: "assessment-existing",
    }
  );

  await expectFailure(
    "existing organization assessment authority prevents duplicate establishment",
    existingAuthoritySetup,
    "CURRENT_AUTHORITY_ALREADY_EXISTS"
  );

  record(
    "duplicate establishment preserves existing organization authority",
    existingAuthoritySetup.database.assessmentAuthorities.get(
      assessmentAuthorityKey(
        input.organizationId,
        input.frameworkId
      )
    )?.assessmentId === "assessment-existing"
  );

  const inactiveMemberSetup =
    createValidEstablishmentDatabase();

  inactiveMemberSetup.database.activeMemberships.clear();

  await expectFailure(
    "inactive organization membership still blocks establishment",
    inactiveMemberSetup,
    "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
  );

  record(
    "publication validation occurs before user validation",
    crossFramework.database.userReads === 0
  );

  record(
    "publication validation occurs before membership validation",
    crossFramework.database.membershipReads === 0
  );

  record(
    "publication failure performs no assessment mutation",
    crossFramework.database.assessmentCreates === 0
  );

  record(
    "publication failure performs no assessment-authority mutation",
    crossFramework.database.assessmentAuthorityCreates === 0
  );

  for (const result of results) {
    console.log(
      `${result.passed ? "PASS" : "FAIL"} — ${result.name}`
    );
  }

  const passed = results.filter(
    (result) => result.passed
  ).length;

  const failed = results.length - passed;

  console.log(
    `RESULT — ${passed} PASS / ${failed} FAIL`
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main();