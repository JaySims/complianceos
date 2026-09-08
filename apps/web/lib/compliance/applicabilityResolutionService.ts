import {
  ApplicabilityDefinitionStatus,
  ApplicabilityResolutionAuthority,
  ApplicabilityReviewState,
  ApplicabilityStatus,
  AssessmentStatus,
  Prisma,
  RegulatoryFactKnowledgeState,
  RegulatoryFactValueType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  buildAssessmentRegulatoryFactSnapshotMaterial,
  toApplicabilityRuleFactInput,
  type AssessmentRegulatoryFactSnapshotMaterial,
} from "./assessmentRegulatoryFactSnapshotPolicy";

import {
  validateApplicabilityDefinitionRule,
} from "./applicabilityDefinitionRuleValidation";

import {
  evaluateApplicabilityRule,
  type ApplicabilityRuleFactInputMap,
  type ApplicabilityRuleNode,
} from "./applicabilityRulePolicy";

/*
 * ============================================================
 * COMPLIANCEOS — APPLICABILITY RESOLUTION SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Resolve one Compliance Requirement for one Assessment and one
 * Applicability Context against the explicitly CURRENT approved
 * Applicability Definition.
 *
 * This service owns the atomic creation of:
 * - assessment-time Regulatory Fact snapshots;
 * - stable AssessmentRequirementApplicability identity;
 * - immutable applicability revision;
 * - exact DeterminationFactBasis lineage.
 *
 * This service intentionally DOES NOT:
 * - approve Applicability Definitions;
 * - infer definition authority from latest/highest version;
 * - establish or supersede current resolution authority;
 * - infer Regulatory Fact authority from latest/highest version;
 * - mutate Regulatory Fact values or authority;
 * - mutate completed Assessment history.
 *
 * Current applicability resolution authority is a separate
 * governance concern handled by the resolution-authority service.
 * ============================================================
 */

export const APPLICABILITY_RESOLVER_VERSION =
  "complianceos-applicability-resolver-v1";

export type ResolveAssessmentRequirementApplicabilityInput = {
  assessmentId: string;
  requirementId: string;
  contextId: string;
  organizationId: string;
  userId: string;
  reason: string;
};

export type ApplicabilityResolutionFailureReason =
  | "UNAUTHORIZED"
  | "ASSESSMENT_NOT_FOUND"
  | "ASSESSMENT_ORGANIZATION_MISMATCH"
  | "ASSESSMENT_NOT_MUTABLE"
  | "REQUIREMENT_NOT_FOUND"
  | "REQUIREMENT_FRAMEWORK_MISMATCH"
  | "CONTEXT_NOT_FOUND"
  | "CONTEXT_ORGANIZATION_MISMATCH"
  | "CONTEXT_FRAMEWORK_MISMATCH"
  | "CONTEXT_INACTIVE"
  | "CURRENT_DEFINITION_AUTHORITY_NOT_FOUND"
  | "CURRENT_DEFINITION_AUTHORITY_INTEGRITY_VIOLATION"
  | "CURRENT_DEFINITION_NOT_APPROVED"
  | "DEPENDENCY_INTEGRITY_VIOLATION"
  | "REGULATORY_FACT_NOT_FOUND"
  | "REGULATORY_FACT_INTEGRITY_VIOLATION"
  | "CURRENT_FACT_AUTHORITY_NOT_FOUND"
  | "CURRENT_FACT_AUTHORITY_INTEGRITY_VIOLATION"
  | "SNAPSHOT_POLICY_VIOLATION"
  | "EVALUATOR_INPUT_VIOLATION"
  | "RULE_EVALUATION_FAILED"
  | "CONCURRENCY_CONFLICT"
  | "PERSISTENCE_ERROR";

export type ApplicabilityResolutionRecord = {
  applicabilityId: string;
  revisionId: string;
  revision: number;
  applicabilityDefinitionId: string;
  status: ApplicabilityStatus;
  resolutionAuthority: ApplicabilityResolutionAuthority;
  reviewState: ApplicabilityReviewState;
  resolverVersion: string;
  factSnapshotIds: readonly string[];
};

export type ApplicabilityResolutionSuccess = {
  success: true;
  resolution: ApplicabilityResolutionRecord;
};

export type ApplicabilityResolutionFailure = {
  success: false;
  reason: ApplicabilityResolutionFailureReason;
  message: string;
};

export type ApplicabilityResolutionResult =
  | ApplicabilityResolutionSuccess
  | ApplicabilityResolutionFailure;

type ResolutionTransaction = Prisma.TransactionClient;

const MUTABLE_ASSESSMENT_STATUSES =
  new Set<AssessmentStatus>([
    AssessmentStatus.DRAFT,
    AssessmentStatus.IN_PROGRESS,
    AssessmentStatus.REVIEW,
  ]);

function failure(
  reason: ApplicabilityResolutionFailureReason,
  message: string
): ApplicabilityResolutionFailure {
  return {
    success: false,
    reason,
    message,
  };
}

function mapRuleResolutionToApplicabilityStatus(
  resolution:
    | "APPLICABLE"
    | "NOT_APPLICABLE"
    | "UNDETERMINED"
): ApplicabilityStatus {
  switch (resolution) {
    case "APPLICABLE":
      return ApplicabilityStatus.APPLICABLE;

    case "NOT_APPLICABLE":
      return ApplicabilityStatus.NOT_APPLICABLE;

    case "UNDETERMINED":
      return ApplicabilityStatus.UNDETERMINED;
  }
}

function reviewStateForSystemResolution(
  status: ApplicabilityStatus
): ApplicabilityReviewState {
  return status === ApplicabilityStatus.UNDETERMINED
    ? ApplicabilityReviewState.REQUIRED
    : ApplicabilityReviewState.NOT_REQUIRED;
}


type ResolutionContext = {
  assessment: {
    id: string;
    status: AssessmentStatus;
    organizationId: string;
    frameworkId: string;
  };
  requirement: {
    id: string;
    frameworkId: string;
  };
  context: {
    id: string;
    organizationId: string;
    frameworkId: string;
    active: boolean;
  };
  definition: {
    id: string;
    requirementId: string;
    status: ApplicabilityDefinitionStatus;
    ruleAst: Prisma.JsonValue;
    ruleSchemaVersion: string;
    validatedRule: ApplicabilityRuleNode;
    dependencies: readonly {
      factDefinitionId: string;
      required: boolean;
    }[];
  };
};

type ResolutionContextResult =
  | {
      success: true;
      context: ResolutionContext;
    }
  | ApplicabilityResolutionFailure;

async function loadResolutionContext(
  db: ResolutionTransaction,
  input: ResolveAssessmentRequirementApplicabilityInput
): Promise<ResolutionContextResult> {
  const membership =
    await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: input.userId,
          organizationId: input.organizationId,
        },
      },
      select: {
        active: true,
      },
    });

  if (!membership || !membership.active) {
    return failure(
      "UNAUTHORIZED",
      "Actor must be an active member of the authorized organization."
    );
  }

  const assessment =
    await db.assessment.findUnique({
      where: {
        id: input.assessmentId,
      },
      select: {
        id: true,
        status: true,
        organizationId: true,
        frameworkId: true,
      },
    });

  if (!assessment) {
    return failure(
      "ASSESSMENT_NOT_FOUND",
      "Compliance assessment not found."
    );
  }

  if (assessment.organizationId !== input.organizationId) {
    return failure(
      "ASSESSMENT_ORGANIZATION_MISMATCH",
      "Assessment does not belong to the authorized organization."
    );
  }

  if (!MUTABLE_ASSESSMENT_STATUSES.has(assessment.status)) {
    return failure(
      "ASSESSMENT_NOT_MUTABLE",
      "Completed assessment history cannot be recalculated by ordinary applicability resolution."
    );
  }

  const requirement =
    await db.complianceRequirement.findUnique({
      where: {
        id: input.requirementId,
      },
      select: {
        id: true,
        frameworkId: true,
      },
    });

  if (!requirement) {
    return failure(
      "REQUIREMENT_NOT_FOUND",
      "Compliance requirement not found."
    );
  }

  if (requirement.frameworkId !== assessment.frameworkId) {
    return failure(
      "REQUIREMENT_FRAMEWORK_MISMATCH",
      "Compliance requirement does not belong to the assessment framework."
    );
  }

  const context =
    await db.applicabilityContext.findUnique({
      where: {
        id: input.contextId,
      },
      select: {
        id: true,
        organizationId: true,
        frameworkId: true,
        active: true,
      },
    });

  if (!context) {
    return failure(
      "CONTEXT_NOT_FOUND",
      "Applicability context not found."
    );
  }

  if (context.organizationId !== assessment.organizationId) {
    return failure(
      "CONTEXT_ORGANIZATION_MISMATCH",
      "Applicability context does not belong to the assessment organization."
    );
  }

  if (context.frameworkId !== assessment.frameworkId) {
    return failure(
      "CONTEXT_FRAMEWORK_MISMATCH",
      "Applicability context does not belong to the assessment framework."
    );
  }

  if (!context.active) {
    return failure(
      "CONTEXT_INACTIVE",
      "Applicability context is inactive."
    );
  }

  const authority =
    await db.currentApplicabilityDefinitionAuthority.findUnique({
      where: {
        requirementId: requirement.id,
      },
      select: {
        requirementId: true,
        applicabilityDefinitionId: true,
      },
    });

  if (!authority) {
    return failure(
      "CURRENT_DEFINITION_AUTHORITY_NOT_FOUND",
      "No current applicability definition authority exists for this requirement."
    );
  }

  if (authority.requirementId !== requirement.id) {
    return failure(
      "CURRENT_DEFINITION_AUTHORITY_INTEGRITY_VIOLATION",
      "Current applicability definition authority is scoped to a different requirement."
    );
  }

  const definition =
    await db.applicabilityDefinition.findUnique({
      where: {
        id: authority.applicabilityDefinitionId,
      },
      select: {
        id: true,
        requirementId: true,
        status: true,
        ruleAst: true,
        ruleSchemaVersion: true,
        dependencies: {
          select: {
            factDefinitionId: true,
            required: true,
          },
        },
      },
    });

  if (!definition) {
    return failure(
      "CURRENT_DEFINITION_AUTHORITY_INTEGRITY_VIOLATION",
      "Current applicability definition authority points to a missing definition."
    );
  }

  if (definition.requirementId !== requirement.id) {
    return failure(
      "CURRENT_DEFINITION_AUTHORITY_INTEGRITY_VIOLATION",
      "Current applicability definition authority points to a definition for a different requirement."
    );
  }

  if (
    definition.status !==
    ApplicabilityDefinitionStatus.APPROVED
  ) {
    return failure(
      "CURRENT_DEFINITION_NOT_APPROVED",
      "Current applicability definition must be APPROVED before it can resolve assessment applicability."
    );
  }

  const ruleValidation =
    await validateApplicabilityDefinitionRule(
      db,
      {
        frameworkId: assessment.frameworkId,
        ruleSchemaVersion:
          definition.ruleSchemaVersion,
        ruleAst: definition.ruleAst,
      }
    );

  if (!ruleValidation.success) {
    return failure(
      "DEPENDENCY_INTEGRITY_VIOLATION",
      `Current APPROVED applicability definition failed semantic revalidation: ${ruleValidation.reason}.`
    );
  }

  const expectedDependencyIds =
    ruleValidation.validated.factDefinitionIds;

  if (
    definition.dependencies.length !==
    expectedDependencyIds.length
  ) {
    return failure(
      "DEPENDENCY_INTEGRITY_VIOLATION",
      "Persisted applicability rule dependencies do not exactly match the current APPROVED rule AST."
    );
  }

  const expectedDependencySet =
    new Set(expectedDependencyIds);

  for (const dependency of definition.dependencies) {
    if (
      dependency.required !== true ||
      !expectedDependencySet.has(
        dependency.factDefinitionId
      )
    ) {
      return failure(
        "DEPENDENCY_INTEGRITY_VIOLATION",
        "Persisted applicability rule dependencies do not exactly match the current APPROVED rule AST."
      );
    }
  }

  return {
    success: true,
    context: {
      assessment,
      requirement,
      context,
      definition: {
        ...definition,
        validatedRule: ruleValidation.validated.rule,
      },
    },
  };
}


type ResolvedFactInput = {
  factDefinitionId: string;
  factKey: string;
  snapshot: AssessmentRegulatoryFactSnapshotMaterial;
  evaluatorFact: ApplicabilityRuleFactInputMap[string];
};

type ResolveFactInputsResult =
  | {
      success: true;
      facts: readonly ResolvedFactInput[];
      evaluatorFacts: ApplicabilityRuleFactInputMap;
    }
  | ApplicabilityResolutionFailure;

function normalizePrismaDecimalForSnapshot(
  value: Prisma.Decimal | null
): string | null {
  if (value === null) {
    return null;
  }

  return value.toString();
}

async function resolveAuthoritativeFactInputs(
  db: ResolutionTransaction,
  context: ResolutionContext
): Promise<ResolveFactInputsResult> {
  const facts: ResolvedFactInput[] = [];
  const evaluatorFacts: Record<
    string,
    ApplicabilityRuleFactInputMap[string]
  > = Object.create(null);

  for (const dependency of context.definition.dependencies) {
    const factDefinition =
      await db.regulatoryFactDefinition.findUnique({
        where: {
          id: dependency.factDefinitionId,
        },
        select: {
          id: true,
          frameworkId: true,
          key: true,
          name: true,
          valueType: true,
          allowedContextTypes: true,
          active: true,
        },
      });

    if (
      !factDefinition ||
      !factDefinition.active ||
      factDefinition.frameworkId !==
        context.assessment.frameworkId
    ) {
      return failure(
        "DEPENDENCY_INTEGRITY_VIOLATION",
        "Applicability dependency does not resolve to an active fact definition in the assessment framework."
      );
    }

    const applicabilityContext =
      await db.applicabilityContext.findUnique({
        where: {
          id: context.context.id,
        },
        select: {
          contextType: true,
        },
      });

    if (!applicabilityContext) {
      return failure(
        "CONTEXT_NOT_FOUND",
        "Applicability context disappeared during resolution."
      );
    }

    if (
      !factDefinition.allowedContextTypes.includes(
        applicabilityContext.contextType
      )
    ) {
      return failure(
        "REGULATORY_FACT_INTEGRITY_VIOLATION",
        "Fact definition is not compatible with the selected applicability context type."
      );
    }

    const regulatoryFact =
      await db.regulatoryFact.findUnique({
        where: {
          organizationId_factDefinitionId_contextId: {
            organizationId:
              context.assessment.organizationId,
            factDefinitionId: factDefinition.id,
            contextId: context.context.id,
          },
        },
        select: {
          id: true,
          organizationId: true,
          factDefinitionId: true,
          contextId: true,
          active: true,
        },
      });

    if (!regulatoryFact || !regulatoryFact.active) {
      return failure(
        "REGULATORY_FACT_NOT_FOUND",
        "Required regulatory fact does not exist as an active fact for the assessment context."
      );
    }

    if (
      regulatoryFact.organizationId !==
        context.assessment.organizationId ||
      regulatoryFact.factDefinitionId !==
        factDefinition.id ||
      regulatoryFact.contextId !==
        context.context.id
    ) {
      return failure(
        "REGULATORY_FACT_INTEGRITY_VIOLATION",
        "Regulatory fact does not satisfy the required organization, definition, and context domain."
      );
    }

    const currentAuthority =
      await db.currentRegulatoryFactAuthority.findUnique({
        where: {
          regulatoryFactId: regulatoryFact.id,
        },
        select: {
          regulatoryFactId: true,
          regulatoryFactValueId: true,
        },
      });

    if (!currentAuthority) {
      return failure(
        "CURRENT_FACT_AUTHORITY_NOT_FOUND",
        "Required regulatory fact has no explicit current authority."
      );
    }

    if (
      currentAuthority.regulatoryFactId !==
      regulatoryFact.id
    ) {
      return failure(
        "CURRENT_FACT_AUTHORITY_INTEGRITY_VIOLATION",
        "Current regulatory fact authority is scoped to a different regulatory fact."
      );
    }

    const factValue =
      await db.regulatoryFactValue.findUnique({
        where: {
          id: currentAuthority.regulatoryFactValueId,
        },
        select: {
          id: true,
          regulatoryFactId: true,
          knowledgeState: true,
          authorityState: true,
          booleanValue: true,
          stringValue: true,
          numberValue: true,
          dateValue: true,
          enumValue: true,
          multiValue: true,
          validFrom: true,
          validUntil: true,
          establishedAt: true,
          reviewedAt: true,
          sourceType: true,
          sourceReference: true,
          sourceDescription: true,
        },
      });

    if (!factValue) {
      return failure(
        "CURRENT_FACT_AUTHORITY_INTEGRITY_VIOLATION",
        "Current regulatory fact authority points to a missing fact value."
      );
    }

    if (
      factValue.regulatoryFactId !== regulatoryFact.id
    ) {
      return failure(
        "CURRENT_FACT_AUTHORITY_INTEGRITY_VIOLATION",
        "Current regulatory fact authority points to a value owned by a different regulatory fact."
      );
    }

    const snapshotResult =
      buildAssessmentRegulatoryFactSnapshotMaterial({
        definition: {
          factDefinitionId: factDefinition.id,
          factKey: factDefinition.key,
          factName: factDefinition.name,
          valueType: factDefinition.valueType,
        },
        source: {
          regulatoryFactId: regulatoryFact.id,
          regulatoryFactValueId: factValue.id,
          authorityState: factValue.authorityState,
          knowledgeState: factValue.knowledgeState,
          valueType: factDefinition.valueType,
          typedValue: {
            booleanValue: factValue.booleanValue,
            stringValue: factValue.stringValue,
            numberValue:
              normalizePrismaDecimalForSnapshot(
                factValue.numberValue
              ),
            dateValue: factValue.dateValue,
            enumValue: factValue.enumValue,
            multiValue: [...factValue.multiValue],
          },
          validFrom: factValue.validFrom,
          validUntil: factValue.validUntil,
          sourceType: factValue.sourceType,
          sourceReference: factValue.sourceReference,
          sourceDescription:
            factValue.sourceDescription,
          establishedAt: factValue.establishedAt,
          reviewedAt: factValue.reviewedAt,
        },
      });

    if (!snapshotResult.success) {
      return failure(
        "SNAPSHOT_POLICY_VIOLATION",
        `Regulatory fact ${factDefinition.key} cannot produce a valid assessment snapshot: ${snapshotResult.message}`
      );
    }

    const evaluatorResult =
      toApplicabilityRuleFactInput(
        snapshotResult.snapshot
      );

    if (!evaluatorResult.success) {
      return failure(
        "EVALUATOR_INPUT_VIOLATION",
        `Regulatory fact ${factDefinition.key} cannot produce a valid applicability evaluator input: ${evaluatorResult.message}`
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        evaluatorFacts,
        factDefinition.key
      )
    ) {
      return failure(
        "DEPENDENCY_INTEGRITY_VIOLATION",
        `Duplicate applicability dependency fact key: ${factDefinition.key}.`
      );
    }

    evaluatorFacts[factDefinition.key] =
      evaluatorResult.fact;

    facts.push({
      factDefinitionId: factDefinition.id,
      factKey: factDefinition.key,
      snapshot: snapshotResult.snapshot,
      evaluatorFact: evaluatorResult.fact,
    });
  }

  return {
    success: true,
    facts,
    evaluatorFacts,
  };
}


/*
 * ============================================================
 * SYSTEM RESOLUTION PERSISTENCE
 * ============================================================
 *
 * Persists historical determination evidence only.
 *
 * This helper MUST be called inside the resolver's surrounding
 * SERIALIZABLE transaction.
 *
 * Creating a resolution revision does NOT make that revision
 * current. CurrentApplicabilityResolutionAuthority belongs to
 * the separate authority-governance phase.
 * ============================================================
 */

type PersistSystemResolutionInput = {
  context: ResolutionContext;
  facts: readonly ResolvedFactInput[];
  status: ApplicabilityStatus;
  reviewState: ApplicabilityReviewState;
  reason: string;
  resolvedById: string;
};

async function persistSystemResolution(
  db: ResolutionTransaction,
  input: PersistSystemResolutionInput
): Promise<ApplicabilityResolutionResult> {
  const stableApplicability =
    await db.assessmentRequirementApplicability.upsert({
      where: {
        assessmentId_requirementId_contextId: {
          assessmentId: input.context.assessment.id,
          requirementId: input.context.requirement.id,
          contextId: input.context.context.id,
        },
      },
      update: {},
      create: {
        assessmentId: input.context.assessment.id,
        requirementId: input.context.requirement.id,
        contextId: input.context.context.id,
      },
      select: {
        id: true,
        assessmentId: true,
        requirementId: true,
        contextId: true,
      },
    });

  if (
    stableApplicability.assessmentId !==
      input.context.assessment.id ||
    stableApplicability.requirementId !==
      input.context.requirement.id ||
    stableApplicability.contextId !==
      input.context.context.id
  ) {
    throw new Error(
      "Stable applicability identity persisted outside the validated assessment, requirement, or context domain."
    );
  }

  const latestRevision =
    await db.assessmentRequirementApplicabilityRevision.findFirst({
      where: {
        applicabilityId: stableApplicability.id,
      },
      orderBy: {
        revision: "desc",
      },
      select: {
        revision: true,
      },
    });

  const nextRevision =
    (latestRevision?.revision ?? 0) + 1;

  const snapshotIds: string[] = [];

  for (const fact of input.facts) {
    const material = fact.snapshot;

    const snapshot =
      await db.assessmentRegulatoryFactSnapshot.create({
        data: {
          assessmentId:
            input.context.assessment.id,
          contextId:
            input.context.context.id,
          factDefinitionId:
            material.factDefinitionId,
          sourceRegulatoryFactId:
            material.sourceRegulatoryFactId,
          sourceFactValueId:
            material.sourceFactValueId,
          factKey:
            material.factKey,
          factName:
            material.factName,
          valueType:
            material.valueType,
          knowledgeState:
            material.knowledgeState,
          authorityState:
            material.authorityState,
          booleanValue:
            material.booleanValue,
          stringValue:
            material.stringValue,
          numberValue:
            material.numberValue === null
              ? null
              : new Prisma.Decimal(
                  material.numberValue
                ),
          dateValue:
            material.dateValue,
          enumValue:
            material.enumValue,
          multiValue:
            [...material.multiValue],
          validFrom:
            material.validFrom,
          validUntil:
            material.validUntil,
          sourceType:
            material.sourceType,
          sourceReference:
            material.sourceReference,
          sourceDescription:
            material.sourceDescription,
          sourceEstablishedAt:
            material.sourceEstablishedAt,
          sourceReviewedAt:
            material.sourceReviewedAt,
        },
        select: {
          id: true,
        },
      });

    snapshotIds.push(snapshot.id);
  }

  const revision =
    await db.assessmentRequirementApplicabilityRevision.create({
      data: {
        applicabilityId:
          stableApplicability.id,
        revision:
          nextRevision,
        applicabilityDefinitionId:
          input.context.definition.id,
        status:
          input.status,
        resolutionAuthority:
          ApplicabilityResolutionAuthority.SYSTEM,
        reviewState:
          input.reviewState,
        resolverVersion:
          APPLICABILITY_RESOLVER_VERSION,
        reason:
          input.reason,
        resolvedById:
          input.resolvedById,
      },
      select: {
        id: true,
        applicabilityId: true,
        revision: true,
        applicabilityDefinitionId: true,
        status: true,
        resolutionAuthority: true,
        reviewState: true,
        resolverVersion: true,
      },
    });

  if (snapshotIds.length > 0) {
    await db.determinationFactBasis.createMany({
      data: snapshotIds.map(
        (factSnapshotId) => ({
          revisionId:
            revision.id,
          factSnapshotId,
        })
      ),
    });
  }

  const confirmation =
    await db.assessmentRequirementApplicabilityRevision.findUnique({
      where: {
        id: revision.id,
      },
      select: {
        id: true,
        applicabilityId: true,
        revision: true,
        applicabilityDefinitionId: true,
        status: true,
        resolutionAuthority: true,
        reviewState: true,
        resolverVersion: true,
        factBasis: {
          select: {
            factSnapshotId: true,
          },
        },
      },
    });

  if (
    !confirmation ||
    confirmation.applicabilityId !==
      stableApplicability.id ||
    confirmation.revision !==
      nextRevision ||
    confirmation.applicabilityDefinitionId !==
      input.context.definition.id ||
    confirmation.status !==
      input.status ||
    confirmation.resolutionAuthority !==
      ApplicabilityResolutionAuthority.SYSTEM ||
    confirmation.reviewState !==
      input.reviewState ||
    confirmation.resolverVersion !==
      APPLICABILITY_RESOLVER_VERSION
  ) {
    throw new Error(
      "Applicability resolution revision could not be confirmed after persistence."
    );
  }

  const expectedSnapshotIds =
    [...snapshotIds].sort();

  const confirmedSnapshotIds =
    confirmation.factBasis
      .map(
        (basis) =>
          basis.factSnapshotId
      )
      .sort();

  if (
    expectedSnapshotIds.length !==
      confirmedSnapshotIds.length ||
    expectedSnapshotIds.some(
      (snapshotId, index) =>
        snapshotId !==
        confirmedSnapshotIds[index]
    )
  ) {
    throw new Error(
      "Applicability resolution fact basis could not be confirmed after persistence."
    );
  }

  return {
    success: true,
    resolution: {
      applicabilityId:
        stableApplicability.id,
      revisionId:
        revision.id,
      revision:
        revision.revision,
      applicabilityDefinitionId:
        revision.applicabilityDefinitionId,
      status:
        revision.status,
      resolutionAuthority:
        revision.resolutionAuthority,
      reviewState:
        revision.reviewState,
      resolverVersion:
        revision.resolverVersion,
      factSnapshotIds:
        snapshotIds,
    },
  };
}

export async function resolveAssessmentRequirementApplicability(
  input: ResolveAssessmentRequirementApplicabilityInput
): Promise<ApplicabilityResolutionResult> {
  const normalizedReason = input.reason.trim();

  if (normalizedReason.length === 0) {
    return failure(
      "PERSISTENCE_ERROR",
      "Applicability resolution reason must not be empty."
    );
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const contextResult =
          await loadResolutionContext(
            tx,
            input
          );

        if (!contextResult.success) {
          return contextResult;
        }

        const factInputsResult =
          await resolveAuthoritativeFactInputs(
            tx,
            contextResult.context
          );

        if (!factInputsResult.success) {
          return factInputsResult;
        }

        let ruleResolution:
          | "APPLICABLE"
          | "NOT_APPLICABLE"
          | "UNDETERMINED";

        try {
          ruleResolution =
            evaluateApplicabilityRule(
              contextResult.context.definition.validatedRule,
              factInputsResult.evaluatorFacts
            );
        } catch {
          return failure(
            "RULE_EVALUATION_FAILED",
            "Current APPROVED applicability rule could not be evaluated safely against the authoritative assessment fact inputs."
          );
        }

        const status =
          mapRuleResolutionToApplicabilityStatus(
            ruleResolution
          );

        const reviewState =
          reviewStateForSystemResolution(
            status
          );

        return await persistSystemResolution(
          tx,
          {
            context:
              contextResult.context,
            facts:
              factInputsResult.facts,
            status,
            reviewState,
            reason:
              normalizedReason,
            resolvedById:
              input.userId,
          }
        );
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
      (
        error.code === "P2002" ||
        error.code === "P2034"
      )
    ) {
      return failure(
        "CONCURRENCY_CONFLICT",
        "Applicability resolution conflicted with another concurrent transaction."
      );
    }

    return failure(
      "PERSISTENCE_ERROR",
      "Applicability resolution could not be persisted safely."
    );
  }
}
