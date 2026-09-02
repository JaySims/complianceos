import {
  Prisma,
  RegulatoryFactAuthorityState,
  RegulatoryFactKnowledgeState,
  RegulatoryFactSourceType,
  RegulatoryFactValueSourceType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  RegulatoryFactTypedValueInput,
  RegulatoryFactValuePolicyFailureReason,
  validateRegulatoryFactValueShape,
} from "./regulatoryFactValuePolicy";

export type RegulatoryFactValueSourceInput = {
  sourceType: RegulatoryFactValueSourceType;
  documentId?: string | null;
  sourceReference?: string | null;
  sourceDescription?: string | null;
  capturedAt?: Date;
};

export type RegulatoryFactDerivationInput = {
  inputFactValueId: string;
  inputOrder?: number | null;
};

type EstablishRegulatoryFactValueInput = {
  organizationId: string;
  regulatoryFactId: string;
  actorUserId: string;

  knowledgeState: RegulatoryFactKnowledgeState;
  authorityState: RegulatoryFactAuthorityState;

  value: RegulatoryFactTypedValueInput;

  validFrom?: Date | null;
  validUntil?: Date | null;

  sourceType: RegulatoryFactSourceType;
  sourceReference?: string | null;
  sourceDescription?: string | null;

  reviewedAt?: Date | null;
  reviewedById?: string | null;

  supersedesValueId?: string | null;
  correctionOfId?: string | null;

  derivationKey?: string | null;
  derivationVersion?: string | null;

  sources?: readonly RegulatoryFactValueSourceInput[];
  derivationInputs?: readonly RegulatoryFactDerivationInput[];
};

export type EstablishRegulatoryFactValueFailureReason =
  | "REGULATORY_FACT_NOT_FOUND"
  | "REGULATORY_FACT_INACTIVE"
  | "ORGANIZATION_MISMATCH"
  | "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
  | "FACT_DEFINITION_INACTIVE"
  | "FACT_CONTEXT_MISMATCH"
  | "FACT_CONTEXT_TYPE_NOT_ALLOWED"
  | "INVALID_VALUE_SHAPE"
  | "INVALID_ENUM_OPTION"
  | "INVALID_MULTI_VALUE_OPTION"
  | "INVALID_VALIDITY_RANGE"
  | "INVALID_REVIEW_LINEAGE"
  | "INVALID_SUPERSESSION_LINEAGE"
  | "INVALID_CORRECTION_LINEAGE"
  | "INVALID_PROVENANCE"
  | "INVALID_DERIVATION"
  | "CONCURRENT_VERSION_CONFLICT"
  | "PERSISTENCE_FAILED";

export type EstablishRegulatoryFactValueResult =
  | {
      success: true;
      regulatoryFactValueId: string;
      version: number;
    }
  | {
      success: false;
      reason: EstablishRegulatoryFactValueFailureReason;
      message: string;
      valuePolicyReason?: RegulatoryFactValuePolicyFailureReason;
    };

export type ValidateRegulatoryFactValueEstablishmentResult =
  | {
      success: true;
      regulatoryFactId: string;
      factDefinitionId: string;
      valueType: import("@prisma/client").RegulatoryFactValueType;
    }
  | {
      success: false;
      reason: EstablishRegulatoryFactValueFailureReason;
      message: string;
      valuePolicyReason?: RegulatoryFactValuePolicyFailureReason;
    };

type DatabaseClient =
  | Prisma.TransactionClient
  | typeof prisma;

type RegulatoryFactEstablishmentContext = {
  regulatoryFactId: string;
  factDefinitionId: string;
  valueType: import("@prisma/client").RegulatoryFactValueType;
};

type RegulatoryFactEstablishmentContextResult =
  | {
      success: true;
      context: RegulatoryFactEstablishmentContext;
    }
  | {
      success: false;
      reason: EstablishRegulatoryFactValueFailureReason;
      message: string;
    };

async function validateRegulatoryFactEstablishmentContext(
  db: DatabaseClient,
  input: EstablishRegulatoryFactValueInput
): Promise<RegulatoryFactEstablishmentContextResult> {
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

  const regulatoryFact =
    await db.regulatoryFact.findUnique({
      where: {
        id: input.regulatoryFactId,
      },
      select: {
        id: true,
        organizationId: true,
        active: true,
        factDefinition: {
          select: {
            id: true,
            frameworkId: true,
            valueType: true,
            allowedContextTypes: true,
            active: true,
          },
        },
        context: {
          select: {
            organizationId: true,
            frameworkId: true,
            contextType: true,
          },
        },
      },
    });

  if (!regulatoryFact) {
    return {
      success: false,
      reason: "REGULATORY_FACT_NOT_FOUND",
      message: "Regulatory fact does not exist.",
    };
  }

  if (
    regulatoryFact.organizationId !==
    input.organizationId
  ) {
    return {
      success: false,
      reason: "ORGANIZATION_MISMATCH",
      message:
        "Regulatory fact does not belong to the organization.",
    };
  }

  if (!regulatoryFact.active) {
    return {
      success: false,
      reason: "REGULATORY_FACT_INACTIVE",
      message: "Regulatory fact is inactive.",
    };
  }

  if (!regulatoryFact.factDefinition.active) {
    return {
      success: false,
      reason: "FACT_DEFINITION_INACTIVE",
      message: "Regulatory fact definition is inactive.",
    };
  }

  if (
    regulatoryFact.context.organizationId !==
      regulatoryFact.organizationId ||
    regulatoryFact.context.frameworkId !==
      regulatoryFact.factDefinition.frameworkId
  ) {
    return {
      success: false,
      reason: "FACT_CONTEXT_MISMATCH",
      message:
        "Regulatory fact context is inconsistent with its organization or framework.",
    };
  }

  if (
    !regulatoryFact.factDefinition.allowedContextTypes.includes(
      regulatoryFact.context.contextType
    )
  ) {
    return {
      success: false,
      reason: "FACT_CONTEXT_TYPE_NOT_ALLOWED",
      message:
        "Regulatory fact context type is not allowed by its definition.",
    };
  }

  return {
    success: true,
    context: {
      regulatoryFactId: regulatoryFact.id,
      factDefinitionId:
        regulatoryFact.factDefinition.id,
      valueType:
        regulatoryFact.factDefinition.valueType,
    },
  };
}

export async function validateRegulatoryFactValueEstablishment(
  input: EstablishRegulatoryFactValueInput,
  db: DatabaseClient = prisma
): Promise<ValidateRegulatoryFactValueEstablishmentResult> {
  const establishmentContext =
    await validateRegulatoryFactEstablishmentContext(
      db,
      input
    );

  if (!establishmentContext.success) {
    return establishmentContext;
  }

  if (
    input.validFrom &&
    input.validUntil &&
    input.validFrom.getTime() >
      input.validUntil.getTime()
  ) {
    return {
      success: false,
      reason: "INVALID_VALIDITY_RANGE",
      message:
        "Regulatory fact value validFrom cannot be later than validUntil.",
    };
  }

  const valuePolicy =
    validateRegulatoryFactValueShape(
      input.knowledgeState,
      establishmentContext.context.valueType,
      input.value
    );

  if (!valuePolicy.success) {
    return {
      success: false,
      reason: "INVALID_VALUE_SHAPE",
      message: valuePolicy.message,
      valuePolicyReason: valuePolicy.reason,
    };
  }

  if (
    input.knowledgeState ===
    RegulatoryFactKnowledgeState.KNOWN
  ) {
    const activeOptions =
      await db.regulatoryFactDefinitionOption.findMany({
        where: {
          factDefinitionId:
            establishmentContext.context
              .factDefinitionId,
          active: true,
        },
        select: {
          value: true,
        },
      });

    const permittedValues =
      new Set(
        activeOptions.map(
          (option) => option.value
        )
      );

    if (
      establishmentContext.context.valueType ===
        "ENUM" &&
      input.value.enumValue &&
      !permittedValues.has(
        input.value.enumValue
      )
    ) {
      return {
        success: false,
        reason: "INVALID_ENUM_OPTION",
        message:
          "Known ENUM regulatory fact value must match an active definition option.",
      };
    }

    if (
      establishmentContext.context.valueType ===
      "MULTI_VALUE"
    ) {
      const invalidValue =
        (input.value.multiValue ?? []).find(
          (value) =>
            !permittedValues.has(value)
        );

      if (invalidValue !== undefined) {
        return {
          success: false,
          reason:
            "INVALID_MULTI_VALUE_OPTION",
          message:
            "Known MULTI_VALUE regulatory fact values must match active definition options.",
        };
      }
    }
  }

  const lineageValidation =
    await validateRegulatoryFactValueLineage(
      db,
      input
    );

  if (!lineageValidation.success) {
    return lineageValidation;
  }

  return {
    success: true,
    regulatoryFactId:
      establishmentContext.context.regulatoryFactId,
    factDefinitionId:
      establishmentContext.context.factDefinitionId,
    valueType:
      establishmentContext.context.valueType,
  };
}

async function validateRegulatoryFactValueLineage(
  db: DatabaseClient,
  input: EstablishRegulatoryFactValueInput
): Promise<
  | { success: true }
  | {
      success: false;
      reason: EstablishRegulatoryFactValueFailureReason;
      message: string;
    }
> {
  if (
    input.reviewedAt &&
    !input.reviewedById
  ) {
    return {
      success: false,
      reason: "INVALID_REVIEW_LINEAGE",
      message:
        "reviewedAt cannot be recorded without reviewedById.",
    };
  }

  if (
    input.reviewedById &&
    !input.reviewedAt
  ) {
    return {
      success: false,
      reason: "INVALID_REVIEW_LINEAGE",
      message:
        "reviewedById cannot be recorded without reviewedAt.",
    };
  }

  if (input.reviewedById) {
    const reviewerMembership =
      await db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: input.reviewedById,
            organizationId: input.organizationId,
          },
        },
        select: {
          active: true,
        },
      });

    if (
      !reviewerMembership ||
      !reviewerMembership.active
    ) {
      return {
        success: false,
        reason: "INVALID_REVIEW_LINEAGE",
        message:
          "Reviewer must be an active member of the organization.",
      };
    }
  }

  const lineageIds = [
    input.supersedesValueId,
    input.correctionOfId,
  ].filter(
    (value): value is string =>
      typeof value === "string"
  );

  if (lineageIds.length > 0) {
    const lineageValues =
      await db.regulatoryFactValue.findMany({
        where: {
          id: {
            in: lineageIds,
          },
        },
        select: {
          id: true,
          regulatoryFactId: true,
        },
      });

    const foundLineageIds =
      new Set(
        lineageValues.map(
          (lineageValue) => lineageValue.id
        )
      );

    if (
      input.supersedesValueId &&
      !foundLineageIds.has(
        input.supersedesValueId
      )
    ) {
      return {
        success: false,
        reason:
          "INVALID_SUPERSESSION_LINEAGE",
        message:
          "Referenced superseded regulatory fact value does not exist.",
      };
    }

    if (
      input.correctionOfId &&
      !foundLineageIds.has(
        input.correctionOfId
      )
    ) {
      return {
        success: false,
        reason:
          "INVALID_CORRECTION_LINEAGE",
        message:
          "Referenced correction target regulatory fact value does not exist.",
      };
    }

    for (const lineageValue of lineageValues) {
      if (
        lineageValue.regulatoryFactId !==
        input.regulatoryFactId
      ) {
        return {
          success: false,
          reason:
            lineageValue.id ===
            input.supersedesValueId
              ? "INVALID_SUPERSESSION_LINEAGE"
              : "INVALID_CORRECTION_LINEAGE",
          message:
            "Supersession and correction lineage must remain within the same regulatory fact.",
        };
      }
    }
  }

  const sources =
    input.sources ?? [];

  for (const source of sources) {
    if (
      source.sourceType ===
        RegulatoryFactValueSourceType.DOCUMENT &&
      !source.documentId?.trim()
    ) {
      return {
        success: false,
        reason: "INVALID_PROVENANCE",
        message:
          "DOCUMENT provenance requires documentId.",
      };
    }

    if (
      source.sourceType ===
        RegulatoryFactValueSourceType.EXTERNAL_REFERENCE &&
      !source.sourceReference?.trim()
    ) {
      return {
        success: false,
        reason: "INVALID_PROVENANCE",
        message:
          "EXTERNAL_REFERENCE provenance requires sourceReference.",
      };
    }

    if (
      source.sourceType ===
        RegulatoryFactValueSourceType.DECLARATION &&
      !source.sourceDescription?.trim()
    ) {
      return {
        success: false,
        reason: "INVALID_PROVENANCE",
        message:
          "DECLARATION provenance requires sourceDescription.",
      };
    }
  }

  const documentIds =
    sources
      .filter(
        (source) =>
          source.sourceType ===
            RegulatoryFactValueSourceType.DOCUMENT &&
          source.documentId
      )
      .map(
        (source) =>
          source.documentId as string
      );

  if (documentIds.length > 0) {
    const documents =
      await db.document.findMany({
        where: {
          id: {
            in: documentIds,
          },
          organizationId:
            input.organizationId,
        },
        select: {
          id: true,
        },
      });

    if (
      documents.length !==
      new Set(documentIds).size
    ) {
      return {
        success: false,
        reason: "INVALID_PROVENANCE",
        message:
          "Document provenance must reference documents belonging to the same organization.",
      };
    }
  }

  if (
    input.sourceType ===
    RegulatoryFactSourceType.SYSTEM_DERIVATION
  ) {
    if (
      !input.derivationKey?.trim() ||
      !input.derivationVersion?.trim()
    ) {
      return {
        success: false,
        reason: "INVALID_DERIVATION",
        message:
          "SYSTEM_DERIVATION requires derivationKey and derivationVersion.",
      };
    }
  }

  const derivationInputs =
    input.derivationInputs ?? [];

  if (derivationInputs.length > 0) {
    const inputIds =
      derivationInputs.map(
        (derivationInput) =>
          derivationInput.inputFactValueId
      );

    if (
      new Set(inputIds).size !==
      inputIds.length
    ) {
      return {
        success: false,
        reason: "INVALID_DERIVATION",
        message:
          "Derivation input fact values must be unique.",
      };
    }

    const existingInputs =
      await db.regulatoryFactValue.findMany({
        where: {
          id: {
            in: inputIds,
          },
        },
        select: {
          id: true,
          regulatoryFact: {
            select: {
              organizationId: true,
            },
          },
        },
      });

    if (
      existingInputs.length !==
      inputIds.length
    ) {
      return {
        success: false,
        reason: "INVALID_DERIVATION",
        message:
          "Each derivation input must reference an existing regulatory fact value.",
      };
    }

    if (
      existingInputs.some(
        (existingInput) =>
          existingInput.regulatoryFact
            .organizationId !==
          input.organizationId
      )
    ) {
      return {
        success: false,
        reason: "INVALID_DERIVATION",
        message:
          "Derivation inputs must remain within the same organization tenant.",
      };
    }
  }

  return {
    success: true,
  };
}

async function createRegulatoryFactValue(
  db: Prisma.TransactionClient,
  input: EstablishRegulatoryFactValueInput,
  version: number,
  establishedAt: Date
) {
  return db.regulatoryFactValue.create({
    data: {
      regulatoryFact: {
        connect: {
          id: input.regulatoryFactId,
        },
      },
      version,
      knowledgeState: input.knowledgeState,
      authorityState: input.authorityState,
      booleanValue: input.value.booleanValue,
      stringValue: input.value.stringValue,
      numberValue: input.value.numberValue,
      dateValue: input.value.dateValue,
      enumValue: input.value.enumValue,
      multiValue: [...(input.value.multiValue ?? [])],
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      establishedAt,
      reviewedAt: input.reviewedAt,
      sourceType: input.sourceType,
      sourceReference: input.sourceReference,
      sourceDescription: input.sourceDescription,
      derivationKey: input.derivationKey,
      derivationVersion: input.derivationVersion,
      establishedBy: {
        connect: {
          id: input.actorUserId,
        },
      },
      ...(input.reviewedById
        ? {
            reviewedBy: {
              connect: {
                id: input.reviewedById,
              },
            },
          }
        : {}),
      ...(input.supersedesValueId
        ? {
            supersedesValue: {
              connect: {
                id: input.supersedesValueId,
              },
            },
          }
        : {}),
      ...(input.correctionOfId
        ? {
            correctionOf: {
              connect: {
                id: input.correctionOfId,
              },
            },
          }
        : {}),
      ...(input.sources?.length
        ? {
            sources: {
              create: input.sources.map((source) => ({
                sourceType: source.sourceType,
                sourceReference: source.sourceReference,
                sourceDescription: source.sourceDescription,
                capturedAt: source.capturedAt,
                ...(source.documentId
                  ? {
                      document: {
                        connect: {
                          id: source.documentId,
                        },
                      },
                    }
                  : {}),
              })),
            },
          }
        : {}),
      ...(input.derivationInputs?.length
        ? {
            derivationInputs: {
              create: input.derivationInputs.map(
                (derivationInput) => ({
                  inputOrder: derivationInput.inputOrder,
                  inputFactValue: {
                    connect: {
                      id: derivationInput.inputFactValueId,
                    },
                  },
                })
              ),
            },
          }
        : {}),
    },
    select: {
      id: true,
      version: true,
    },
  });
}

async function persistRegulatoryFactValue(
  input: EstablishRegulatoryFactValueInput
): Promise<EstablishRegulatoryFactValueResult> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const validation =
          await validateRegulatoryFactValueEstablishment(
            input,
            tx
          );

        if (!validation.success) {
          return validation;
        }

        const latestVersion =
          await tx.regulatoryFactValue.findFirst({
            where: {
              regulatoryFactId:
                validation.regulatoryFactId,
            },
            orderBy: {
              version: "desc",
            },
            select: {
              version: true,
            },
          });

        const nextVersion =
          (latestVersion?.version ?? 0) + 1;

        const establishedAt = new Date();

        if (
          input.reviewedAt &&
          input.reviewedAt < establishedAt
        ) {
          return {
            success: false,
            reason: "INVALID_REVIEW_LINEAGE",
            message:
              "reviewedAt cannot precede the regulatory fact value establishment event.",
          };
        }

        const createdValue =
          await createRegulatoryFactValue(
            tx,
            input,
            nextVersion,
            establishedAt
          );

        return {
          success: true,
          regulatoryFactValueId: createdValue.id,
          version: createdValue.version,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        success: false,
        reason: "CONCURRENT_VERSION_CONFLICT",
        message:
          "Regulatory fact value could not be persisted because of a concurrent write conflict.",
      };
    }

    return {
      success: false,
      reason: "PERSISTENCE_FAILED",
      message:
        "Regulatory fact value could not be persisted safely.",
    };
  }
}
