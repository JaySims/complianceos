import {
  Prisma,
  RegulatoryFactValueType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  ApplicabilityRuleNode,
  ApplicabilityRulePolicyFailureReason,
  ApplicabilityRuleSchemaVersionValidationResult,
  ApplicabilityRuleSemanticValidationResult,
  extractApplicabilityRuleFactKeys,
  validateApplicabilityRuleSchemaVersion,
  validateApplicabilityRuleSemantics,
  validateApplicabilityRuleStructure,
} from "./applicabilityRulePolicy";

/*
 * ============================================================
 * APPLICABILITY DEFINITION RULE VALIDATION
 * ============================================================
 *
 * Shared DB-aware semantic validation for ApplicabilityDefinition
 * rule versions.
 *
 * This module owns validation only.
 *
 * It does NOT:
 * - authorize actors,
 * - create or mutate ApplicabilityDefinition records,
 * - create or repair dependency rows,
 * - approve definitions,
 * - retire definitions,
 * - select current authority.
 *
 * Both creation and approval may use this validator so the same
 * frozen grammar contract is enforced at both governance points.
 * ============================================================
 */

type DatabaseClient =
  | Prisma.TransactionClient
  | typeof prisma;

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

export type ApplicabilityDefinitionRulePolicyReason =
  | ApplicabilityRulePolicyFailureReason
  | ApplicabilityRuleSemanticFailureReason
  | ApplicabilityRuleSchemaVersionFailureReason;

export type ApplicabilityDefinitionRuleValidationFailureReason =
  | "UNSUPPORTED_RULE_SCHEMA_VERSION"
  | "INVALID_RULE_STRUCTURE"
  | "FACT_DEFINITION_NOT_FOUND"
  | "FACT_DEFINITION_INACTIVE"
  | "FACT_FRAMEWORK_MISMATCH"
  | "INVALID_RULE_SEMANTICS"
  | "INVALID_ENUM_OPTION"
  | "INVALID_MULTI_VALUE_OPTION";

export type ValidatedApplicabilityDefinitionRule = {
  rule: ApplicabilityRuleNode;
  factKeys: readonly string[];
  factDefinitionIds: readonly string[];
};

export type ApplicabilityDefinitionRuleValidationResult =
  | {
      success: true;
      validated: ValidatedApplicabilityDefinitionRule;
    }
  | {
      success: false;
      reason: ApplicabilityDefinitionRuleValidationFailureReason;
      message: string;
      rulePolicyReason?: ApplicabilityDefinitionRulePolicyReason;
    };

type ApplicabilityDefinitionFactResolution = {
  factDefinitionIds: readonly string[];
  factDefinitionIdsByKey: Readonly<
    Record<string, string>
  >;
  factTypes: Readonly<
    Record<string, RegulatoryFactValueType>
  >;
};

type ApplicabilityDefinitionFactResolutionResult =
  | {
      success: true;
      resolution: ApplicabilityDefinitionFactResolution;
    }
  | {
      success: false;
      reason: ApplicabilityDefinitionRuleValidationFailureReason;
      message: string;
    };

type ApplicabilityDefinitionControlledOptionReference = {
  factKey: string;
  values: readonly string[];
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
            RegulatoryFactValueType
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
      RegulatoryFactValueType
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

function collectControlledOptionReferences(
  rule: ApplicabilityRuleNode,
  factTypes: ApplicabilityDefinitionFactResolution["factTypes"]
): ApplicabilityDefinitionControlledOptionReference[] {
  const valuesByFactKey =
    new Map<string, Set<string>>();

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

        let collected =
          valuesByFactKey.get(node.factKey);

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

        return;
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

async function validateControlledOptions(
  db: DatabaseClient,
  rule: ApplicabilityRuleNode,
  resolution: ApplicabilityDefinitionFactResolution
): Promise<ApplicabilityDefinitionRuleValidationResult | null> {
  const references =
    collectControlledOptionReferences(
      rule,
      resolution.factTypes
    );

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

  return null;
}

export async function validateApplicabilityDefinitionRule(
  db: DatabaseClient,
  input: {
    frameworkId: string;
    ruleSchemaVersion: string;
    ruleAst: unknown;
  }
): Promise<ApplicabilityDefinitionRuleValidationResult> {
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

  const factKeys =
    extractApplicabilityRuleFactKeys(
      structureResult.rule
    );

  const factResolution =
    await resolveApplicabilityDefinitionFacts(
      db,
      input.frameworkId,
      factKeys
    );

  if (!factResolution.success) {
    return factResolution;
  }

  const semanticResult =
    validateApplicabilityRuleSemantics(
      structureResult.rule,
      factResolution.resolution.factTypes
    );

  if (!semanticResult.success) {
    return {
      success: false,
      reason: "INVALID_RULE_SEMANTICS",
      message: semanticResult.message,
      rulePolicyReason: semanticResult.reason,
    };
  }

  const optionFailure =
    await validateControlledOptions(
      db,
      structureResult.rule,
      factResolution.resolution
    );

  if (optionFailure) {
    return optionFailure;
  }

  return {
    success: true,
    validated: {
      rule: structureResult.rule,
      factKeys,
      factDefinitionIds:
        factResolution.resolution.factDefinitionIds,
    },
  };
}
