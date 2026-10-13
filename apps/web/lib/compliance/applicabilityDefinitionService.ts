import {
  ApplicabilityClass,
  ApplicabilityDefinitionStatus,
  ApplicabilityResolutionPattern,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  ApplicabilityDefinitionRulePolicyReason,
  ValidatedApplicabilityDefinitionRule,
  validateApplicabilityDefinitionRule,
} from "./applicabilityDefinitionRuleValidation";

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

export type CreateApplicabilityDefinitionRulePolicyReason =
  ApplicabilityDefinitionRulePolicyReason;

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

type PreparedApplicabilityDefinitionCreation = {
  context: ApplicabilityDefinitionCreationContext;
  rule: ValidatedApplicabilityDefinitionRule["rule"];
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

  const ruleValidation =
    await validateApplicabilityDefinitionRule(
      db,
      {
        frameworkId:
          contextResult.context.frameworkId,
        ruleSchemaVersion:
          input.ruleSchemaVersion,
        ruleAst: input.ruleAst,
      }
    );

  if (!ruleValidation.success) {
    return ruleValidation;
  }

  return {
    success: true,
    prepared: {
      context: contextResult.context,
      rule: ruleValidation.validated.rule,
      factDefinitionIds:
        ruleValidation.validated.factDefinitionIds,
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


export async function createApplicabilityDefinitionInTransaction(
  tx: Prisma.TransactionClient,
  input: CreateApplicabilityDefinitionInput
): Promise<CreateApplicabilityDefinitionResult> {
  const effectiveRangeResult =
    validateApplicabilityDefinitionEffectiveRange(input);

  if (!effectiveRangeResult.success) {
    return effectiveRangeResult;
  }

  const preparationResult =
    await prepareApplicabilityDefinitionCreation(tx, input);

  if (!preparationResult.success) {
    return preparationResult;
  }

  const persisted = await persistApplicabilityDefinitionDraft(
    tx,
    input,
    preparationResult.prepared
  );

  return {
    success: true,
    applicabilityDefinitionId: persisted.applicabilityDefinitionId,
    version: persisted.version,
    status: persisted.status,
  };
}

export async function createApplicabilityDefinition(
  input: CreateApplicabilityDefinitionInput
): Promise<CreateApplicabilityDefinitionResult> {
  const effectiveRangeResult =
    validateApplicabilityDefinitionEffectiveRange(input);

  if (!effectiveRangeResult.success) {
    return effectiveRangeResult;
  }

  try {
    const created = await prisma.$transaction(
      async (tx) =>
        createApplicabilityDefinitionInTransaction(tx, input),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return created;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002" || error.code === "P2034") {
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
      message: "Applicability definition could not be persisted.",
    };
  }
}