import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  CanonicalJsonValue,
  FrameworkCatalogueGovernedState,
} from "./frameworkCatalogueManifest";

type DatabaseClient =
  | Prisma.TransactionClient
  | typeof prisma;

export type LoadFrameworkCatalogueGovernedStateResult =
  | {
      success: true;
      governedState: FrameworkCatalogueGovernedState;
    }
  | {
      success: false;
      reason:
        | "FRAMEWORK_NOT_FOUND"
        | "INVALID_RULE_AST_JSON";
      message: string;
    };

function toCanonicalJsonValue(
  value: Prisma.JsonValue
): CanonicalJsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("NON_FINITE_RULE_AST_NUMBER");
    }

    return Object.is(value, -0) ? 0 : value;
  }

  if (Array.isArray(value)) {
    return value.map(toCanonicalJsonValue);
  }

  const converted: { [key: string]: CanonicalJsonValue } = {};

  for (const [key, child] of Object.entries(value)) {
    if (child === undefined) {
      throw new Error("UNDEFINED_RULE_AST_VALUE");
    }

    converted[key] = toCanonicalJsonValue(child);
  }

  return converted;
}

export async function loadFrameworkCatalogueGovernedState(
  db: DatabaseClient,
  frameworkId: string
): Promise<LoadFrameworkCatalogueGovernedStateResult> {
  const framework = await db.framework.findUnique({
    where: { id: frameworkId },
    select: {
      id: true,
      name: true,
      version: true,
      description: true,
      requirements: {
        select: {
          id: true,
          frameworkId: true,
          code: true,
          title: true,
          description: true,
          category: true,
          authority: true,
          sourceTitle: true,
          sourceReference: true,
          sourceUrl: true,
          effectiveFrom: true,
          mandatory: true,
          weight: true,
          active: true,
          currentApplicabilityAuthority: {
            select: {
              applicabilityDefinition: {
                select: {
                  requirementId: true,
                  version: true,
                  status: true,
                  applicabilityClass: true,
                  resolutionPattern: true,
                  ruleAst: true,
                  ruleSchemaVersion: true,
                  sourceTitle: true,
                  sourceReference: true,
                  sourceUrl: true,
                  effectiveFrom: true,
                  effectiveUntil: true,
                  dependencies: {
                    select: {
                      factDefinitionId: true,
                      required: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      regulatoryFactDefinitions: {
        select: {
          id: true,
          frameworkId: true,
          key: true,
          name: true,
          description: true,
          valueType: true,
          allowedContextTypes: true,
          sourceTitle: true,
          sourceReference: true,
          sourceUrl: true,
          effectiveFrom: true,
          active: true,
          options: {
            select: {
              value: true,
              label: true,
              description: true,
              sortOrder: true,
              active: true,
            },
          },
        },
      },
    },
  });

  if (!framework) {
    return {
      success: false,
      reason: "FRAMEWORK_NOT_FOUND",
      message: "Framework does not exist.",
    };
  }

  try {
    return {
      success: true,
      governedState: {
        framework: {
          id: framework.id,
          name: framework.name,
          version: framework.version,
          description: framework.description,
        },
        requirements: framework.requirements.map((requirement) => {
          const definition =
            requirement.currentApplicabilityAuthority
              ?.applicabilityDefinition ?? null;

          return {
            id: requirement.id,
            frameworkId: requirement.frameworkId,
            code: requirement.code,
            title: requirement.title,
            description: requirement.description,
            category: requirement.category,
            authority: requirement.authority,
            sourceTitle: requirement.sourceTitle,
            sourceReference: requirement.sourceReference,
            sourceUrl: requirement.sourceUrl,
            effectiveFrom: requirement.effectiveFrom,
            mandatory: requirement.mandatory,
            weight: requirement.weight,
            active: requirement.active,
            currentApplicability: definition
              ? {
                  requirementId: definition.requirementId,
                  version: definition.version,
                  status: definition.status,
                  applicabilityClass: definition.applicabilityClass,
                  resolutionPattern: definition.resolutionPattern,
                  ruleAst: toCanonicalJsonValue(definition.ruleAst),
                  ruleSchemaVersion: definition.ruleSchemaVersion,
                  sourceTitle: definition.sourceTitle,
                  sourceReference: definition.sourceReference,
                  sourceUrl: definition.sourceUrl,
                  effectiveFrom: definition.effectiveFrom,
                  effectiveUntil: definition.effectiveUntil,
                  dependencies: definition.dependencies.map(
                    (dependency) => ({
                      factDefinitionId: dependency.factDefinitionId,
                      required: dependency.required,
                    })
                  ),
                }
              : null,
          };
        }),
        regulatoryFacts: framework.regulatoryFactDefinitions.map(
          (fact) => ({
            id: fact.id,
            frameworkId: fact.frameworkId,
            key: fact.key,
            name: fact.name,
            description: fact.description,
            valueType: fact.valueType,
            allowedContextTypes: [...fact.allowedContextTypes],
            sourceTitle: fact.sourceTitle,
            sourceReference: fact.sourceReference,
            sourceUrl: fact.sourceUrl,
            effectiveFrom: fact.effectiveFrom,
            active: fact.active,
            options: fact.options.map((option) => ({
              value: option.value,
              label: option.label,
              description: option.description,
              sortOrder: option.sortOrder,
              active: option.active,
            })),
          })
        ),
      },
    };
  } catch {
    return {
      success: false,
      reason: "INVALID_RULE_AST_JSON",
      message:
        "Framework catalogue contains rule AST JSON that cannot enter the canonical manifest boundary.",
    };
  }
}
