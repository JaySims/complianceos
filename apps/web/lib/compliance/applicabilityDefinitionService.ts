import {
  ApplicabilityClass,
  ApplicabilityDefinitionStatus,
  ApplicabilityResolutionPattern,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  ApplicabilityRuleNode,
  ApplicabilityRulePolicyFailureReason,
  ApplicabilityRuleSemanticValidationResult,
  ApplicabilityRuleSchemaVersionValidationResult,
  extractApplicabilityRuleFactKeys,
  validateApplicabilityRuleSchemaVersion,
  validateApplicabilityRuleSemantics,
  validateApplicabilityRuleStructure,
} from "./applicabilityRulePolicy";

export type CreateApplicabilityDefinitionInput = {
  organizationId: string;
  requirementId: string;
  actorUserId: string;

  applicabilityClass: ApplicabilityClass;
  resolutionPattern: ApplicabilityResolutionPattern;

  ruleAst: unknown;
  ruleSchemaVersion: string;

  sourceTitle?: string | null;
  sourceReference?: string | null;
  sourceUrl?: string | null;

  effectiveFrom?: Date | null;
  effectiveUntil?: Date | null;
};

export type CreateApplicabilityDefinitionFailureReason =
  | "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
  | "REQUIREMENT_NOT_FOUND"
  | "REQUIREMENT_INACTIVE"
  | "UNSUPPORTED_RULE_SCHEMA_VERSION"
  | "INVALID_RULE_STRUCTURE"
  | "FACT_DEFINITION_NOT_FOUND"
  | "FACT_DEFINITION_INACTIVE"
  | "FACT_FRAMEWORK_MISMATCH"
  | "INVALID_RULE_SEMANTICS"
  | "INVALID_ENUM_OPTION"
  | "INVALID_MULTI_VALUE_OPTION"
  | "INVALID_EFFECTIVE_RANGE"
  | "CONCURRENT_VERSION_CONFLICT"
  | "PERSISTENCE_FAILED";

type ApplicabilityRuleSemanticFailureReason =
  Extract<
    ApplicabilityRuleSemanticValidationResult,
    { success: false }
  >["reason"];

type ApplicabilityRuleSchemaVersionFailureReason =
  Extract<
    ApplicabilityRuleSchemaVersionValidationResult,
    { success: false }
  >["reason"];

export type CreateApplicabilityDefinitionRulePolicyReason =
  | ApplicabilityRulePolicyFailureReason
  | ApplicabilityRuleSemanticFailureReason
  | ApplicabilityRuleSchemaVersionFailureReason;

export type CreateApplicabilityDefinitionResult =
  | {
      success: true;
      applicabilityDefinitionId: string;
      version: number;
      status: ApplicabilityDefinitionStatus;
    }
  | {
      success: false;
      reason: CreateApplicabilityDefinitionFailureReason;
      message: string;
      rulePolicyReason?: CreateApplicabilityDefinitionRulePolicyReason;
    };

type DatabaseClient =
  | Prisma.TransactionClient
  | typeof prisma;

type ValidatedApplicabilityDefinitionRule = {
  rule: ApplicabilityRuleNode;
  factDefinitionIds: readonly string[];
};

type ApplicabilityDefinitionCreationContext = {
  requirementId: string;
  frameworkId: string;
};

type ApplicabilityDefinitionCreationContextResult =
  | {
      success: true;
      context: ApplicabilityDefinitionCreationContext;
    }
  | {
      success: false;
      reason: CreateApplicabilityDefinitionFailureReason;
      message: string;
    };

async function validateApplicabilityDefinitionCreationContext(
  db: DatabaseClient,
  input: CreateApplicabilityDefinitionInput
): Promise<ApplicabilityDefinitionCreationContextResult> {
  const membership =
    await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: input.actorUserId,
          organizationId: input.organizationId,
        },
      },
      select: {
        active: true,
      },
    });

  if (!membership || !membership.active) {
    return {
      success: false,
      reason: "USER_NOT_ACTIVE_ORGANIZATION_MEMBER",
      message:
        "User is not an active member of the organization.",
    };
  }

  const requirement =
    await db.complianceRequirement.findUnique({
      where: {
        id: input.requirementId,
      },
      select: {
        id: true,
        frameworkId: true,
        active: true,
      },
    });

  if (!requirement) {
    return {
      success: false,
      reason: "REQUIREMENT_NOT_FOUND",
      message: "Compliance requirement does not exist.",
    };
  }

  if (!requirement.active) {
    return {
      success: false,
      reason: "REQUIREMENT_INACTIVE",
      message: "Compliance requirement is inactive.",
    };
  }

  return {
    success: true,
    context: {
      requirementId: requirement.id,
      frameworkId: requirement.frameworkId,
    },
  };
}

type ApplicabilityDefinitionRulePreparationResult =
  | {
      success: true;
      rule: ApplicabilityRuleNode;
      factKeys: readonly string[];
    }
  | {
      success: false;
      reason: CreateApplicabilityDefinitionFailureReason;
      message: string;
      rulePolicyReason?: CreateApplicabilityDefinitionRulePolicyReason;
    };

function prepareApplicabilityDefinitionRule(
  input: CreateApplicabilityDefinitionInput
): ApplicabilityDefinitionRulePreparationResult {
  const versionResult =
    validateApplicabilityRuleSchemaVersion(
      input.ruleSchemaVersion
    );

  if (!versionResult.success) {
    return {
      success: false,
      reason: "UNSUPPORTED_RULE_SCHEMA_VERSION",
      message: versionResult.message,
      rulePolicyReason: versionResult.reason,
    };
  }

  const structureResult =
    validateApplicabilityRuleStructure(
      input.ruleAst
    );

  if (!structureResult.success) {
    return {
      success: false,
      reason: "INVALID_RULE_STRUCTURE",
      message: structureResult.message,
      rulePolicyReason: structureResult.reason,
    };
  }

  return {
    success: true,
    rule: structureResult.rule,
    factKeys: extractApplicabilityRuleFactKeys(
      structureResult.rule
    ),
  };
}

type ApplicabilityDefinitionFactResolution = {
  factDefinitionIds: readonly string[];
  factDefinitionIdsByKey: Readonly<
    Record<string, string>
  >;
  factTypes: Readonly<
    Record<
      string,
      import("@prisma/client").RegulatoryFactValueType
    >
  >;
};

type ApplicabilityDefinitionFactResolutionResult =
  | {
      success: true;
      resolution: ApplicabilityDefinitionFactResolution;
    }
  | {
      success: false;
      reason: CreateApplicabilityDefinitionFailureReason;
      message: string;
    };

async function resolveApplicabilityDefinitionFacts(
  db: DatabaseClient,
  frameworkId: string,
  factKeys: readonly string[]
): Promise<ApplicabilityDefinitionFactResolutionResult> {
  if (factKeys.length === 0) {
    return {
      success: true,
      resolution: {
        factDefinitionIds: [],
        factDefinitionIdsByKey:
          Object.create(null) as Record<string, string>,
        factTypes:
          Object.create(null) as Record<
            string,
            import("@prisma/client").RegulatoryFactValueType
          >,
      },
    };
  }

  const factDefinitions =
    await db.regulatoryFactDefinition.findMany({
      where: {
        frameworkId,
        key: {
          in: [...factKeys],
        },
      },
      select: {
        id: true,
        key: true,
        frameworkId: true,
        valueType: true,
        active: true,
      },
    });

  const byKey = new Map(
    factDefinitions.map((definition) => [
      definition.key,
      definition,
    ])
  );

  const factDefinitionIds: string[] = [];
  const factDefinitionIdsByKey =
    Object.create(null) as Record<string, string>;

  const factTypes =
    Object.create(null) as Record<
      string,
      import("@prisma/client").RegulatoryFactValueType
    >;

  for (const factKey of factKeys) {
    const definition = byKey.get(factKey);

    if (!definition) {
      return {
        success: false,
        reason: "FACT_DEFINITION_NOT_FOUND",
        message:
          `Regulatory fact definition does not exist in the requirement framework for ${factKey}.`,
      };
    }

    if (definition.frameworkId !== frameworkId) {
      return {
        success: false,
        reason: "FACT_FRAMEWORK_MISMATCH",
        message:
          `Regulatory fact definition framework mismatch for ${factKey}.`,
      };
    }

    if (!definition.active) {
      return {
        success: false,
        reason: "FACT_DEFINITION_INACTIVE",
        message:
          `Regulatory fact definition is inactive for ${factKey}.`,
      };
    }

    factDefinitionIds.push(definition.id);
    factDefinitionIdsByKey[factKey] = definition.id;
    factTypes[factKey] = definition.valueType;
  }

  return {
    success: true,
    resolution: {
      factDefinitionIds,
      factDefinitionIdsByKey,
      factTypes,
    },
  };
}

type ApplicabilityDefinitionRuleSemanticValidationResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason: CreateApplicabilityDefinitionFailureReason;
      message: string;
      rulePolicyReason?: CreateApplicabilityDefinitionRulePolicyReason;
    };

function validateApplicabilityDefinitionRuleSemantics(
  rule: ApplicabilityRuleNode,
  factTypes: ApplicabilityDefinitionFactResolution["factTypes"]
): ApplicabilityDefinitionRuleSemanticValidationResult {
  const semanticResult =
    validateApplicabilityRuleSemantics(
      rule,
      factTypes
    );

  if (!semanticResult.success) {
    return {
      success: false,
      reason: "INVALID_RULE_SEMANTICS",
      message: semanticResult.message,
      rulePolicyReason: semanticResult.reason,
    };
  }

  return {
    success: true,
  };
}

type ApplicabilityDefinitionControlledOptionReference = {
  factKey: string;
  values: readonly string[];
};

function collectApplicabilityDefinitionControlledOptionReferences(
  rule: ApplicabilityRuleNode,
  factTypes: ApplicabilityDefinitionFactResolution["factTypes"]
): ApplicabilityDefinitionControlledOptionReference[] {
  const valuesByFactKey = new Map<string, Set<string>>();

  function visit(node: ApplicabilityRuleNode): void {
    switch (node.kind) {
      case "CONSTANT":
        return;

      case "NOT":
        visit(node.child);
        return;

      case "ALL":
      case "ANY":
        for (const child of node.children) {
          visit(child);
        }
        return;

      case "FACT_PREDICATE": {
        const valueType = factTypes[node.factKey];

        if (
          valueType !== "ENUM" &&
          valueType !== "MULTI_VALUE"
        ) {
          return;
        }

        if (node.operator === "IS_EMPTY") {
          return;
        }

        const values =
          Array.isArray(node.operand)
            ? node.operand
            : [node.operand];

        let collected = valuesByFactKey.get(
          node.factKey
        );

        if (!collected) {
          collected = new Set<string>();
          valuesByFactKey.set(
            node.factKey,
            collected
          );
        }

        for (const value of values) {
          if (typeof value === "string") {
            collected.add(value);
          }
        }
      }
    }
  }

  visit(rule);

  return [...valuesByFactKey.entries()]
    .sort(([left], [right]) =>
      left.localeCompare(right)
    )
    .map(([factKey, values]) => ({
      factKey,
      values: [...values].sort(),
    }));
}

async function validateApplicabilityDefinitionControlledOptions(
  db: DatabaseClient,
  rule: ApplicabilityRuleNode,
  resolution: ApplicabilityDefinitionFactResolution
): Promise<ApplicabilityDefinitionRuleSemanticValidationResult> {
  const references =
    collectApplicabilityDefinitionControlledOptionReferences(
      rule,
      resolution.factTypes
    );

  if (references.length === 0) {
    return {
      success: true,
    };
  }

  for (const reference of references) {
    const factDefinitionId =
      resolution.factDefinitionIdsByKey[
        reference.factKey
      ];

    if (!factDefinitionId) {
      return {
        success: false,
        reason: "INVALID_RULE_SEMANTICS",
        message:
          `Missing resolved fact definition for ${reference.factKey}.`,
      };
    }

    const activeOptions =
      await db.regulatoryFactDefinitionOption.findMany({
        where: {
          factDefinitionId,
          active: true,
          value: {
            in: [...reference.values],
          },
        },
        select: {
          value: true,
        },
      });

    const activeValues = new Set(
      activeOptions.map((option) => option.value)
    );

    for (const value of reference.values) {
      if (activeValues.has(value)) {
        continue;
      }

      const valueType =
        resolution.factTypes[reference.factKey];

      return {
        success: false,
        reason:
          valueType === "ENUM"
            ? "INVALID_ENUM_OPTION"
            : "INVALID_MULTI_VALUE_OPTION",
        message:
          `Controlled option ${value} is not active for ${reference.factKey}.`,
      };
    }
  }

  return {
    success: true,
  };
}

type PreparedApplicabilityDefinitionCreation = {
  context: ApplicabilityDefinitionCreationContext;
  rule: ApplicabilityRuleNode;
  factDefinitionIds: readonly string[];
};

type PrepareApplicabilityDefinitionCreationResult =
  | {
      success: true;
      prepared: PreparedApplicabilityDefinitionCreation;
    }
  | {
      success: false;
      reason: CreateApplicabilityDefinitionFailureReason;
      message: string;
      rulePolicyReason?: CreateApplicabilityDefinitionRulePolicyReason;
    };

async function prepareApplicabilityDefinitionCreation(
  db: DatabaseClient,
  input: CreateApplicabilityDefinitionInput
): Promise<PrepareApplicabilityDefinitionCreationResult> {
  const contextResult =
    await validateApplicabilityDefinitionCreationContext(
      db,
      input
    );

  if (!contextResult.success) {
    return contextResult;
  }

  const ruleResult =
    prepareApplicabilityDefinitionRule(input);

  if (!ruleResult.success) {
    return ruleResult;
  }

  const factResolutionResult =
    await resolveApplicabilityDefinitionFacts(
      db,
      contextResult.context.frameworkId,
      ruleResult.factKeys
    );

  if (!factResolutionResult.success) {
    return factResolutionResult;
  }

  const semanticResult =
    validateApplicabilityDefinitionRuleSemantics(
      ruleResult.rule,
      factResolutionResult.resolution.factTypes
    );

  if (!semanticResult.success) {
    return semanticResult;
  }

  const optionResult =
    await validateApplicabilityDefinitionControlledOptions(
      db,
      ruleResult.rule,
      factResolutionResult.resolution
    );

  if (!optionResult.success) {
    return optionResult;
  }

  return {
    success: true,
    prepared: {
      context: contextResult.context,
      rule: ruleResult.rule,
      factDefinitionIds:
        factResolutionResult.resolution.factDefinitionIds,
    },
  };
}

type ApplicabilityDefinitionEffectiveRangeValidationResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason: "INVALID_EFFECTIVE_RANGE";
      message: string;
    };

function validateApplicabilityDefinitionEffectiveRange(
  input: CreateApplicabilityDefinitionInput
): ApplicabilityDefinitionEffectiveRangeValidationResult {
  if (
    input.effectiveFrom &&
    input.effectiveUntil &&
    input.effectiveFrom.getTime() >
      input.effectiveUntil.getTime()
  ) {
    return {
      success: false,
      reason: "INVALID_EFFECTIVE_RANGE",
      message:
        "Applicability definition effectiveFrom must not be later than effectiveUntil.",
    };
  }

  return {
    success: true,
  };
}

type PersistApplicabilityDefinitionDraftResult = {
  applicabilityDefinitionId: string;
  version: number;
  status: ApplicabilityDefinitionStatus;
};

async function persistApplicabilityDefinitionDraft(
  tx: Prisma.TransactionClient,
  input: CreateApplicabilityDefinitionInput,
  prepared: PreparedApplicabilityDefinitionCreation
): Promise<PersistApplicabilityDefinitionDraftResult> {
  const latestDefinition =
    await tx.applicabilityDefinition.findFirst({
      where: {
        requirementId:
          prepared.context.requirementId,
      },
      orderBy: {
        version: "desc",
      },
      select: {
        version: true,
      },
    });

  const nextVersion =
    (latestDefinition?.version ?? 0) + 1;

  const created =
    await tx.applicabilityDefinition.create({
      data: {
        requirementId:
          prepared.context.requirementId,
        version: nextVersion,
        applicabilityClass:
          input.applicabilityClass,
        resolutionPattern:
          input.resolutionPattern,
        status:
          ApplicabilityDefinitionStatus.DRAFT,
        ruleAst:
          prepared.rule as Prisma.InputJsonValue,
        ruleSchemaVersion:
          input.ruleSchemaVersion,
        sourceTitle:
          input.sourceTitle ?? null,
        sourceReference:
          input.sourceReference ?? null,
        sourceUrl:
          input.sourceUrl ?? null,
        effectiveFrom:
          input.effectiveFrom ?? null,
        effectiveUntil:
          input.effectiveUntil ?? null,
      },
      select: {
        id: true,
        version: true,
        status: true,
      },
    });

  if (prepared.factDefinitionIds.length > 0) {
    await tx.applicabilityRuleFactDependency.createMany({
      data: prepared.factDefinitionIds.map(
        (factDefinitionId) => ({
          applicabilityDefinitionId: created.id,
          factDefinitionId,
          required: true,
        })
      ),
    });
  }

  const confirmation =
    await tx.applicabilityDefinition.findUnique({
      where: {
        id: created.id,
      },
      select: {
        version: true,
        status: true,
        dependencies: {
          select: {
            factDefinitionId: true,
            required: true,
          },
        },
      },
    });

  if (!confirmation) {
    throw new Error(
      "Applicability definition post-write confirmation failed."
    );
  }

  if (
    confirmation.version !== created.version ||
    confirmation.status !==
      ApplicabilityDefinitionStatus.DRAFT
  ) {
    throw new Error(
      "Applicability definition persisted with unexpected version or status."
    );
  }

  const expectedDependencyIds =
    [...prepared.factDefinitionIds].sort();

  const confirmedDependencyIds =
    confirmation.dependencies
      .map((dependency) => {
        if (!dependency.required) {
          throw new Error(
            "Applicability definition dependency persisted as non-required."
          );
        }

        return dependency.factDefinitionId;
      })
      .sort();

  if (
    expectedDependencyIds.length !==
      confirmedDependencyIds.length ||
    expectedDependencyIds.some(
      (factDefinitionId, index) =>
        factDefinitionId !==
        confirmedDependencyIds[index]
    )
  ) {
    throw new Error(
      "Applicability definition dependency set failed post-write confirmation."
    );
  }

  return {
    applicabilityDefinitionId: created.id,
    version: created.version,
    status: created.status,
  };
}

export async function createApplicabilityDefinition(
  input: CreateApplicabilityDefinitionInput
): Promise<CreateApplicabilityDefinitionResult> {
  const effectiveRangeResult =
    validateApplicabilityDefinitionEffectiveRange(
      input
    );

  if (!effectiveRangeResult.success) {
    return effectiveRangeResult;
  }

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        const preparationResult =
          await prepareApplicabilityDefinitionCreation(
            tx,
            input
          );

        if (!preparationResult.success) {
          return preparationResult;
        }

        const persisted =
          await persistApplicabilityDefinitionDraft(
            tx,
            input,
            preparationResult.prepared
          );

        return {
          success: true as const,
          applicabilityDefinitionId:
            persisted.applicabilityDefinitionId,
          version: persisted.version,
          status: persisted.status,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return created;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      if (
        error.code === "P2002" ||
        error.code === "P2034"
      ) {
        return {
          success: false,
          reason: "CONCURRENT_VERSION_CONFLICT",
          message:
            "Applicability definition version allocation conflicted with another concurrent transaction.",
        };
      }
    }

    return {
      success: false,
      reason: "PERSISTENCE_FAILED",
      message:
        "Applicability definition could not be persisted.",
    };
  }
}
