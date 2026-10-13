
import {
  ApplicabilityClass,
  ApplicabilityDefinitionStatus,
  ApplicabilityResolutionPattern,
  Prisma,
} from "@prisma/client";

import {
  createApplicabilityDefinitionInTransaction as createApplicabilityDefinition,
  type CreateApplicabilityDefinitionInput,
} from "@/lib/compliance/applicabilityDefinitionService";

import {
  approveApplicabilityDefinitionInTransaction as approveApplicabilityDefinition,
  type ApproveApplicabilityDefinitionInput,
} from "@/lib/compliance/applicabilityDefinitionApprovalService";

import { createValidGovernedState } from "./frameworkCatalogueTestFixtures";

type TestResult = {
  name: string;
  passed: boolean;
};

const results: TestResult[] = [];

const record = (name: string, passed: boolean) =>
  results.push({ name, passed });

type GovernedFact = ReturnType<
  typeof createValidGovernedState
>["regulatoryFacts"][number];

type FactDefinition = GovernedFact;

type Requirement = {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  active: boolean;
};

type ApplicabilityDefinitionRecord = {
  id: string;
  requirementId: string;
  version: number;
  applicabilityClass: ApplicabilityClass;
  resolutionPattern: ApplicabilityResolutionPattern;
  status: ApplicabilityDefinitionStatus;
  ruleAst: unknown;
  ruleSchemaVersion: string;
  sourceTitle: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
  approvedAt: Date | null;
  approvedById: string | null;
};

type DependencyRecord = {
  id: string;
  applicabilityDefinitionId: string;
  factDefinitionId: string;
  required: boolean;
};

type MockDatabase = {
  requirements: Map<string, Requirement>;
  factDefinitions: Map<string, FactDefinition>;
  definitions: Map<string, ApplicabilityDefinitionRecord>;
  dependencies: Map<string, DependencyRecord>;
  users: Set<string>;
  activeMemberships: Set<string>;

  requirementReads: number;
  factDefinitionReads: number;
  factOptionReads: number;
  definitionReads: number;
  definitionCreates: number;
  dependencyReads: number;
  dependencyCreates: number;
  definitionUpdates: number;
  definitionUpdateMany: number;

  // Test-only switch used to simulate a concurrent lifecycle change.
  simulateConcurrentDefinitionApproval: boolean;
};

function membershipKey(
  userId: string,
  organizationId: string
): string {
  return `${userId}::${organizationId}`;
}

function dependencyKey(
  applicabilityDefinitionId: string,
  factDefinitionId: string
): string {
  return `${applicabilityDefinitionId}::${factDefinitionId}`;
}

function createBaseRequirement(): Requirement {
  const state = createValidGovernedState();
  const requirement = state.requirements[0];

  return {
    id: requirement.id,
    frameworkId: requirement.frameworkId,
    code: requirement.code,
    title: requirement.title,
    active: requirement.active,
  };
}

function createBaseFact(): FactDefinition {
  const state = createValidGovernedState();
  return state.regulatoryFacts[0];
}

function createMockDatabase(input?: {
  requirements?: Requirement[];
  factDefinitions?: FactDefinition[];
  users?: string[];
  activeMemberships?: Array<{
    userId: string;
    organizationId: string;
  }>;
  definitions?: ApplicabilityDefinitionRecord[];
  dependencies?: DependencyRecord[];
}): {
  database: MockDatabase;
  client: Prisma.TransactionClient;
} {
  const database: MockDatabase = {
    requirements: new Map(
      (input?.requirements ?? []).map((requirement) => [
        requirement.id,
        requirement,
      ])
    ),

    factDefinitions: new Map(
      (input?.factDefinitions ?? []).map((fact) => [
        `${fact.frameworkId}::${fact.key}`,
        fact,
      ])
    ),

    definitions: new Map(
      (input?.definitions ?? []).map((definition) => [
        definition.id,
        definition,
      ])
    ),

    dependencies: new Map(
      (input?.dependencies ?? []).map((dependency) => [
        dependencyKey(
          dependency.applicabilityDefinitionId,
          dependency.factDefinitionId
        ),
        dependency,
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

    requirementReads: 0,
    factDefinitionReads: 0,
    factOptionReads: 0,
    definitionReads: 0,
    definitionCreates: 0,
    dependencyReads: 0,
    dependencyCreates: 0,
    definitionUpdates: 0,
    definitionUpdateMany: 0,
    simulateConcurrentDefinitionApproval: false,
  };

  const client = {
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
        const key = membershipKey(
          where.userId_organizationId.userId,
          where.userId_organizationId.organizationId
        );

        return database.activeMemberships.has(key)
          ? { active: true }
          : null;
      },
    },

    complianceRequirement: {
      findUnique: async ({
        where,
      }: {
        where: { id: string };
      }) => {
        database.requirementReads += 1;
        return database.requirements.get(where.id) ?? null;
      },
    },

    regulatoryFactDefinition: {
      findUnique: async ({
        where,
      }: {
        where: {
          frameworkId_key: {
            frameworkId: string;
            key: string;
          };
        };
      }) => {
        database.factDefinitionReads += 1;

        return (
          database.factDefinitions.get(
            `${where.frameworkId_key.frameworkId}::${where.frameworkId_key.key}`
          ) ?? null
        );
      },

      findMany: async ({
        where,
      }: {
        where: {
          id?: {
            in: string[];
          };
          frameworkId?: string;
          key?: {
            in: string[];
          };
        };
      }) => {
        database.factDefinitionReads += 1;

        return [...database.factDefinitions.values()].filter(
          (fact) => {
            if (
              where.id !== undefined &&
              !where.id.in.includes(fact.id)
            ) {
              return false;
            }

            if (
              where.frameworkId !== undefined &&
              fact.frameworkId !== where.frameworkId
            ) {
              return false;
            }

            if (
              where.key !== undefined &&
              !where.key.in.includes(fact.key)
            ) {
              return false;
            }

            return true;
          }
        );
      },
    },

    regulatoryFactDefinitionOption: {
      findMany: async ({
        where,
      }: {
        where: {
          factDefinitionId?: {
            in: string[];
          };
          value?: {
            in: string[];
          };
          active?: boolean;
        };
      }) => {
        database.factOptionReads += 1;

        const factIds = where.factDefinitionId?.in ?? [];
        const values = where.value?.in ?? [];

        return [...database.factDefinitions.values()]
          .flatMap((fact) =>
            fact.options.map((option) => ({
              ...option,
              factDefinitionId: fact.id,
            }))
          )
          .filter((option) => {
            if (
              factIds.length > 0 &&
              !factIds.includes(option.factDefinitionId)
            ) {
              return false;
            }

            if (
              values.length > 0 &&
              !values.includes(option.value)
            ) {
              return false;
            }

            if (
              typeof where.active === "boolean" &&
              option.active !== where.active
            ) {
              return false;
            }

            return true;
          });
      },
    },

    applicabilityDefinition: {
      findFirst: async ({
        where,
      }: {
        where: {
          requirementId: string;
        };
      }) => {
        database.definitionReads += 1;

        const definitions = [
          ...database.definitions.values(),
        ].filter(
          (definition) =>
            definition.requirementId === where.requirementId
        );

        definitions.sort((a, b) => b.version - a.version);

        return definitions[0] ?? null;
      },

      findUnique: async ({
        where,
      }: {
        where: { id: string };
      }) => {
        database.definitionReads += 1;

        const definition = database.definitions.get(where.id);

        if (!definition) {
          return null;
        }

        return {
          ...definition,
          dependencies: [...database.dependencies.values()].filter(
            (dependency) =>
              dependency.applicabilityDefinitionId === definition.id
          ),
        };
      },

      create: async ({
        data,
      }: {
        data: {
          requirementId: string;
          version: number;
          applicabilityClass: ApplicabilityClass;
          resolutionPattern: ApplicabilityResolutionPattern;
          status: ApplicabilityDefinitionStatus;
          ruleAst: unknown;
          ruleSchemaVersion: string;
          sourceTitle?: string | null;
          sourceReference?: string | null;
          sourceUrl?: string | null;
          effectiveFrom?: Date | null;
          effectiveUntil?: Date | null;
        };
      }) => {
        database.definitionCreates += 1;

        const definition: ApplicabilityDefinitionRecord = {
          id: `applicability-definition-${database.definitionCreates}`,
          requirementId: data.requirementId,
          version: data.version,
          applicabilityClass: data.applicabilityClass,
          resolutionPattern: data.resolutionPattern,
          status: data.status,
          ruleAst: data.ruleAst,
          ruleSchemaVersion: data.ruleSchemaVersion,
          sourceTitle: data.sourceTitle ?? null,
          sourceReference: data.sourceReference ?? null,
          sourceUrl: data.sourceUrl ?? null,
          effectiveFrom: data.effectiveFrom ?? null,
          effectiveUntil: data.effectiveUntil ?? null,
          approvedAt: null,
          approvedById: null,
        };

        database.definitions.set(definition.id, definition);
        return definition;
      },

      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: {
          status?: ApplicabilityDefinitionStatus;
          approvedAt?: Date | null;
          approvedById?: string | null;
        };
      }) => {
        database.definitionUpdates += 1;

        const existing = database.definitions.get(where.id);

        if (!existing) {
          throw new Error("Definition not found");
        }

        const updated = {
          ...existing,
          ...data,
        };

        database.definitions.set(updated.id, updated);
        return updated;
      },

      updateMany: async ({
        where,
        data,
      }: {
        where: {
          id: string;
          status: ApplicabilityDefinitionStatus;
        };
        data: {
          status?: ApplicabilityDefinitionStatus;
          approvedAt?: Date | null;
          approvedById?: string | null;
        };
      }) => {
        database.definitionUpdateMany += 1;

        /*
         * Simulate a competing approval immediately before the
         * guarded update evaluates its expected lifecycle status.
         *
         * This switch is disabled by default, so the other tests
         * retain their original behavior.
         */
        if (database.simulateConcurrentDefinitionApproval) {
          database.simulateConcurrentDefinitionApproval = false;

          const competingDefinition =
            database.definitions.get(where.id);

          if (competingDefinition) {
            database.definitions.set(where.id, {
              ...competingDefinition,
              status: ApplicabilityDefinitionStatus.APPROVED,
            });
          }
        }

        const existing = database.definitions.get(where.id);

        if (!existing || existing.status !== where.status) {
          return { count: 0 };
        }

        const updated = {
          ...existing,
          ...data,
        };

        database.definitions.set(updated.id, updated);
        return { count: 1 };
      },
    },

    applicabilityRuleFactDependency: {
      create: async ({
        data,
      }: {
        data: {
          applicabilityDefinitionId: string;
          factDefinitionId: string;
          required: boolean;
        };
      }) => {
        database.dependencyCreates += 1;

        const dependency: DependencyRecord = {
          id: `dependency-${database.dependencyCreates}`,
          applicabilityDefinitionId:
            data.applicabilityDefinitionId,
          factDefinitionId: data.factDefinitionId,
          required: data.required,
        };

        database.dependencies.set(
          dependencyKey(
            dependency.applicabilityDefinitionId,
            dependency.factDefinitionId
          ),
          dependency
        );

        return dependency;
      },

      createMany: async ({
        data,
      }: {
        data: {
          applicabilityDefinitionId: string;
          factDefinitionId: string;
          required: boolean;
        }[];
      }) => {
        for (const item of data) {
          database.dependencyCreates += 1;

          const dependency: DependencyRecord = {
            id: `dependency-${database.dependencyCreates}`,
            applicabilityDefinitionId:
              item.applicabilityDefinitionId,
            factDefinitionId: item.factDefinitionId,
            required: item.required,
          };

          database.dependencies.set(
            dependencyKey(
              dependency.applicabilityDefinitionId,
              dependency.factDefinitionId
            ),
            dependency
          );
        }

        return { count: data.length };
      },

      findMany: async ({
        where,
      }: {
        where: {
          applicabilityDefinitionId: string;
        };
      }) => {
        database.dependencyReads += 1;

        return [...database.dependencies.values()].filter(
          (dependency) =>
            dependency.applicabilityDefinitionId ===
            where.applicabilityDefinitionId
        );
      },
    },
  } as unknown as Prisma.TransactionClient;

  return {
    database,
    client,
  };
}

const baseInput: CreateApplicabilityDefinitionInput = {
  organizationId: "organization-1",
  requirementId: "requirement-1",
  actorUserId: "user-1",
  applicabilityClass: ApplicabilityClass.GENERAL,
  resolutionPattern:
    ApplicabilityResolutionPattern.GENERAL_UNCONDITIONAL,
  ruleAst: {
    kind: "FACT_PREDICATE",
    factKey: "test_fact",
    operator: "EQUALS",
    operand: true,
  },
  ruleSchemaVersion: "applicability-rule-v1",
  sourceTitle: null,
  sourceReference: null,
  sourceUrl: null,
  effectiveFrom: null,
  effectiveUntil: null,
};

const approvalInput: ApproveApplicabilityDefinitionInput = {
  organizationId: "organization-1",
  applicabilityDefinitionId: "applicability-definition-1",
  actorUserId: "user-1",
};

function createValidDatabase() {
  const requirement = createBaseRequirement();
  const fact = createBaseFact();

  return createMockDatabase({
    requirements: [requirement],
    factDefinitions: [fact],
    users: [baseInput.actorUserId],
    activeMemberships: [
      {
        userId: baseInput.actorUserId,
        organizationId: baseInput.organizationId,
      },
    ],
  });
}

async function expectCreateFailure(
  name: string,
  mock: ReturnType<typeof createMockDatabase>,
  expectedReason: string,
  input: CreateApplicabilityDefinitionInput = baseInput
) {
  const result = await createApplicabilityDefinition(
    mock.client,
    input
  );

  record(
    name,
    !result.success &&
      result.reason === expectedReason &&
      mock.database.definitionCreates === 0 &&
      mock.database.dependencyCreates === 0
  );
}

async function main() {
  const missingMember = createMockDatabase({
    requirements: [createBaseRequirement()],
    factDefinitions: [createBaseFact()],
  });

  await expectCreateFailure(
    "inactive organization membership blocks definition creation",
    missingMember,
    "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
  );

  const missingRequirement = createMockDatabase({
    factDefinitions: [createBaseFact()],
    users: [baseInput.actorUserId],
    activeMemberships: [
      {
        userId: baseInput.actorUserId,
        organizationId: baseInput.organizationId,
      },
    ],
  });

  await expectCreateFailure(
    "missing requirement blocks definition creation",
    missingRequirement,
    "REQUIREMENT_NOT_FOUND"
  );

  const inactiveRequirement = createBaseRequirement();
  inactiveRequirement.active = false;

  const inactiveRequirementDb = createMockDatabase({
    requirements: [inactiveRequirement],
    factDefinitions: [createBaseFact()],
    users: [baseInput.actorUserId],
    activeMemberships: [
      {
        userId: baseInput.actorUserId,
        organizationId: baseInput.organizationId,
      },
    ],
  });

  await expectCreateFailure(
    "inactive requirement blocks definition creation",
    inactiveRequirementDb,
    "REQUIREMENT_INACTIVE"
  );

  const unsupportedSchema = createValidDatabase();

  await expectCreateFailure(
    "unsupported rule schema version fails closed",
    unsupportedSchema,
    "UNSUPPORTED_RULE_SCHEMA_VERSION",
    {
      ...baseInput,
      ruleSchemaVersion: "1",
    }
  );

  const malformedRule = createValidDatabase();

  await expectCreateFailure(
    "malformed rule structure fails closed",
    malformedRule,
    "INVALID_RULE_STRUCTURE",
    {
      ...baseInput,
      ruleAst: {
        type: "literal",
        value: true,
      },
    }
  );

  const missingFactRule = createValidDatabase();

  const missingFactResult =
    await createApplicabilityDefinition(
      missingFactRule.client,
      {
        ...baseInput,
        ruleAst: {
          kind: "FACT_PREDICATE",
          factKey: "missing_fact",
          operator: "EQUALS",
          operand: true,
        },
      }
    );

  record(
    "missing referenced fact blocks definition creation",
    !missingFactResult.success &&
      missingFactResult.reason ===
        "FACT_DEFINITION_NOT_FOUND" &&
      missingFactRule.database.definitionCreates === 0
  );

  const inactiveFact = createBaseFact();
  inactiveFact.active = false;

  const inactiveFactDb = createMockDatabase({
    requirements: [createBaseRequirement()],
    factDefinitions: [inactiveFact],
    users: [baseInput.actorUserId],
    activeMemberships: [
      {
        userId: baseInput.actorUserId,
        organizationId: baseInput.organizationId,
      },
    ],
  });

  const inactiveFactResult =
    await createApplicabilityDefinition(
      inactiveFactDb.client,
      {
        ...baseInput,
        ruleAst: {
          kind: "FACT_PREDICATE",
          factKey: inactiveFact.key,
          operator: "EQUALS",
          operand: true,
        },
      }
    );

  record(
    "inactive referenced fact blocks definition creation",
    !inactiveFactResult.success &&
      inactiveFactResult.reason ===
        "FACT_DEFINITION_INACTIVE"
  );

  const foreignFact = createBaseFact();
  foreignFact.frameworkId = "framework-other";

  const foreignFactDb = createMockDatabase({
    requirements: [createBaseRequirement()],
    factDefinitions: [foreignFact],
    users: [baseInput.actorUserId],
    activeMemberships: [
      {
        userId: baseInput.actorUserId,
        organizationId: baseInput.organizationId,
      },
    ],
  });

  const foreignFactResult =
    await createApplicabilityDefinition(
      foreignFactDb.client,
      {
        ...baseInput,
        ruleAst: {
          kind: "FACT_PREDICATE",
          factKey: foreignFact.key,
          operator: "EQUALS",
          operand: true,
        },
      }
    );

  record(
    "framework-mismatched fact is not accepted",
    !foreignFactResult.success &&
      foreignFactResult.reason ===
        "FACT_DEFINITION_NOT_FOUND"
  );

  const invalidSemantics = createValidDatabase();

  const invalidSemanticAst = {
    kind: "FACT_PREDICATE",
    factKey: "test_fact",
    operator: "GREATER_THAN",
    operand: true,
  };

  const invalidSemanticsResult =
    await createApplicabilityDefinition(
      invalidSemantics.client,
      {
        ...baseInput,
        ruleAst: invalidSemanticAst,
      }
    );

  record(
    "invalid rule semantics fail closed",
    !invalidSemanticsResult.success &&
      invalidSemanticsResult.reason ===
        "INVALID_RULE_SEMANTICS"
  );

  const invalidEffectiveRange = createValidDatabase();

  const invalidEffectiveRangeResult =
    await createApplicabilityDefinition(
      invalidEffectiveRange.client,
      {
        ...baseInput,
        effectiveFrom: new Date("2027-01-01T00:00:00.000Z"),
        effectiveUntil: new Date("2026-01-01T00:00:00.000Z"),
      }
    );

  record(
    "invalid effective date range fails closed",
    !invalidEffectiveRangeResult.success &&
      invalidEffectiveRangeResult.reason ===
        "INVALID_EFFECTIVE_RANGE"
  );

  const valid = createValidDatabase();
  const expectedFactId = createBaseFact().id;

  const firstCreate =
    await createApplicabilityDefinition(
      valid.client,
      baseInput
    );

  record(
    "valid applicability definition creates successfully",
    firstCreate.success
  );

  record(
    "successful definition starts in DRAFT",
    firstCreate.success &&
      firstCreate.status ===
        ApplicabilityDefinitionStatus.DRAFT
  );

  record(
    "successful definition receives version 1",
    firstCreate.success && firstCreate.version === 1
  );

  record(
    "exactly one definition is created",
    valid.database.definitionCreates === 1
  );

  record(
    "exactly one required dependency is created",
    valid.database.dependencyCreates === 1
  );

  record(
    "dependency points to validated fact",
    firstCreate.success &&
      [...valid.database.dependencies.values()][0]
        ?.factDefinitionId === expectedFactId
  );

  const secondCreate =
    await createApplicabilityDefinition(
      valid.client,
      baseInput
    );

  record(
    "second definition version increments deterministically",
    secondCreate.success && secondCreate.version === 2
  );

  record(
    "second definition creates a second dependency",
    valid.database.dependencyCreates === 2
  );

  const approvalDb = createValidDatabase();

  const createdForApproval =
    await createApplicabilityDefinition(
      approvalDb.client,
      baseInput
    );

  record(
    "approval fixture definition is created",
    createdForApproval.success
  );

  const approvalResult =
    await approveApplicabilityDefinition(
      approvalDb.client,
      approvalInput
    );

  record(
    "valid DRAFT definition can be approved",
    approvalResult.success
  );

  record(
    "approval changes lifecycle to APPROVED",
    approvalResult.success &&
      approvalResult.definition.status ===
        ApplicabilityDefinitionStatus.APPROVED
  );

  record(
    "approval records approving actor",
    approvalResult.success &&
      approvalResult.definition.approvedById ===
        baseInput.actorUserId
  );

  record(
    "approval records approval timestamp",
    approvalResult.success &&
      approvalResult.definition.approvedAt instanceof Date
  );

  record(
    "approval uses guarded updateMany",
    approvalDb.database.definitionUpdateMany === 1
  );

  const alreadyApproved =
    await approveApplicabilityDefinition(
      approvalDb.client,
      approvalInput
    );

  record(
    "already approved definition cannot be approved again",
    !alreadyApproved.success &&
      alreadyApproved.reason ===
        "DEFINITION_ALREADY_APPROVED"
  );

  const dependencyCorruptionDb = createValidDatabase();

  const dependencyCreated =
    await createApplicabilityDefinition(
      dependencyCorruptionDb.client,
      baseInput
    );

  if (dependencyCreated.success) {
    const dependency =
      [...dependencyCorruptionDb.database.dependencies.values()][0];

    if (dependency) {
      dependency.required = false;
    }

    const corruptedApproval =
      await approveApplicabilityDefinition(
        dependencyCorruptionDb.client,
        approvalInput
      );

    record(
      "corrupted dependency integrity blocks approval",
      !corruptedApproval.success &&
        corruptedApproval.reason ===
          "DEPENDENCY_INTEGRITY_VIOLATION"
    );
  } else {
    record(
      "corrupted dependency integrity blocks approval",
      false
    );
  }

  const approvalRevalidationDb = createValidDatabase();

  const revalidationCreate =
    await createApplicabilityDefinition(
      approvalRevalidationDb.client,
      baseInput
    );

  if (revalidationCreate.success) {
    const persisted =
      approvalRevalidationDb.database.definitions.get(
        "applicability-definition-1"
      );

    if (persisted) {
      persisted.ruleAst = invalidSemanticAst;
    }

    const revalidationApproval =
      await approveApplicabilityDefinition(
        approvalRevalidationDb.client,
        approvalInput
      );

    record(
      "approval revalidates persisted rule semantics",
      !revalidationApproval.success &&
        revalidationApproval.reason ===
          "INVALID_RULE_SEMANTICS"
    );
  } else {
    record(
      "approval revalidates persisted rule semantics",
      false
    );
  }

  const concurrentApprovalDb = createValidDatabase();

  const concurrentCreate =
    await createApplicabilityDefinition(
      concurrentApprovalDb.client,
      baseInput
    );

  if (concurrentCreate.success) {
    /*
     * Simulate a competing approval inside the mock's updateMany,
     * immediately before its expected-status guard is evaluated.
     */
    concurrentApprovalDb.database
      .simulateConcurrentDefinitionApproval = true;

    const concurrentApproval =
      await approveApplicabilityDefinition(
        concurrentApprovalDb.client,
        approvalInput
      );

    record(
      "approval detects concurrent lifecycle change",
      !concurrentApproval.success &&
        concurrentApproval.reason ===
          "DEFINITION_CHANGED_DURING_APPROVAL" &&
        concurrentApprovalDb.database.definitionUpdateMany === 1 &&
        concurrentApprovalDb.database.definitions.get(
          "applicability-definition-1"
        )?.status === ApplicabilityDefinitionStatus.APPROVED
    );
  } else {
    record(
      "approval detects concurrent lifecycle change",
      false
    );
  }

  const noAuthorityMutationDb = createValidDatabase();

  const noAuthorityCreate =
    await createApplicabilityDefinition(
      noAuthorityMutationDb.client,
      baseInput
    );

  if (noAuthorityCreate.success) {
    const beforeDefinitions =
      noAuthorityMutationDb.database.definitions.size;

    const beforeDependencies =
      noAuthorityMutationDb.database.dependencies.size;

    const authorityResult =
      await approveApplicabilityDefinition(
        noAuthorityMutationDb.client,
        approvalInput
      );

    record(
      "approval succeeds without creating authority state",
      authorityResult.success &&
        noAuthorityMutationDb.database.definitions.size ===
          beforeDefinitions &&
        noAuthorityMutationDb.database.dependencies.size ===
          beforeDependencies
    );
  } else {
    record(
      "approval succeeds without creating authority state",
      false
    );
  }

  const summary = {
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
  };

  for (const result of results) {
    console.log(
      `${result.passed ? "PASS" : "FAIL"} ${result.name}`
    );
  }

  console.log();
  console.log(
    `Applicability Definition verification: ${summary.passed} PASS / ${summary.failed} FAIL`
  );

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});