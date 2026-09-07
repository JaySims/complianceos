import {
  RegulatoryFactAuthorityState,
  RegulatoryFactKnowledgeState,
  RegulatoryFactSourceType,
  RegulatoryFactValueType,
} from "@prisma/client";

import {
  RegulatoryFactTypedValueInput,
  RegulatoryFactValuePolicyFailureReason,
  validateRegulatoryFactValueShape,
} from "./regulatoryFactValuePolicy";

import type {
  ApplicabilityRuleFactInput,
} from "./applicabilityRulePolicy";

/*
 * ============================================================
 * COMPLIANCEOS — ASSESSMENT REGULATORY FACT SNAPSHOT POLICY
 * ============================================================
 *
 * PURPOSE
 *
 * Define the pure semantic contract for assessment-time
 * regulatory fact snapshots.
 *
 * This module intentionally performs:
 * - no Prisma client access;
 * - no database reads;
 * - no database writes;
 * - no authority mutation;
 * - no applicability revision mutation.
 *
 * UNKNOWN is explicit regulatory knowledge state and MUST NOT
 * be converted to false or inferred from physical nullability.
 * ============================================================
 */

export type AssessmentRegulatoryFactSnapshotSource = {
  regulatoryFactId: string;
  regulatoryFactValueId: string;
  authorityState: RegulatoryFactAuthorityState;
  knowledgeState: RegulatoryFactKnowledgeState;
  valueType: RegulatoryFactValueType;
  typedValue: RegulatoryFactTypedValueInput;
  validFrom: Date | null;
  validUntil: Date | null;
  sourceType: RegulatoryFactSourceType;
  sourceReference: string | null;
  sourceDescription: string | null;
  establishedAt: Date;
  reviewedAt: Date | null;
};

export type AssessmentRegulatoryFactSnapshotDefinition = {
  factDefinitionId: string;
  factKey: string;
  factName: string;
  valueType: RegulatoryFactValueType;
};

export type AssessmentRegulatoryFactSnapshotPolicyInput = {
  definition: AssessmentRegulatoryFactSnapshotDefinition;
  source: AssessmentRegulatoryFactSnapshotSource | null;
};

export type AssessmentRegulatoryFactSnapshotPolicyFailureReason =
  | RegulatoryFactValuePolicyFailureReason
  | "SOURCE_VALUE_TYPE_MISMATCH"
  | "INVALID_SOURCE_LINEAGE";

export type AssessmentRegulatoryFactSnapshotPolicyFailure = {
  success: false;
  reason: AssessmentRegulatoryFactSnapshotPolicyFailureReason;
  message: string;
};

export type AssessmentRegulatoryFactSnapshotMaterial = {
  factDefinitionId: string;
  sourceRegulatoryFactId: string | null;
  sourceFactValueId: string | null;
  factKey: string;
  factName: string;
  valueType: RegulatoryFactValueType;
  knowledgeState: RegulatoryFactKnowledgeState;
  authorityState: RegulatoryFactAuthorityState | null;
  booleanValue: boolean | null;
  stringValue: string | null;
  numberValue: string | number | null;
  dateValue: Date | null;
  enumValue: string | null;
  multiValue: readonly string[];
  validFrom: Date | null;
  validUntil: Date | null;
  sourceType: RegulatoryFactSourceType | null;
  sourceReference: string | null;
  sourceDescription: string | null;
  sourceEstablishedAt: Date | null;
  sourceReviewedAt: Date | null;
};

export type AssessmentRegulatoryFactSnapshotPolicyResult =
  | {
      success: true;
      snapshot: AssessmentRegulatoryFactSnapshotMaterial;
    }
  | AssessmentRegulatoryFactSnapshotPolicyFailure;

function copyDate(value: Date | null): Date | null {
  return value === null ? null : new Date(value.getTime());
}

function hasValidLineageId(value: string): boolean {
  return value.trim().length > 0;
}

function unknownSnapshotMaterial(
  definition: AssessmentRegulatoryFactSnapshotDefinition
): AssessmentRegulatoryFactSnapshotMaterial {
  return {
    factDefinitionId: definition.factDefinitionId,
    sourceRegulatoryFactId: null,
    sourceFactValueId: null,
    factKey: definition.factKey,
    factName: definition.factName,
    valueType: definition.valueType,
    knowledgeState: RegulatoryFactKnowledgeState.UNKNOWN,
    authorityState: null,
    booleanValue: null,
    stringValue: null,
    numberValue: null,
    dateValue: null,
    enumValue: null,
    multiValue: [],
    validFrom: null,
    validUntil: null,
    sourceType: null,
    sourceReference: null,
    sourceDescription: null,
    sourceEstablishedAt: null,
    sourceReviewedAt: null,
  };
}

export function buildAssessmentRegulatoryFactSnapshotMaterial(
  input: AssessmentRegulatoryFactSnapshotPolicyInput
): AssessmentRegulatoryFactSnapshotPolicyResult {
  const { definition, source } = input;

  if (source === null) {
    const shapeValidation =
      validateRegulatoryFactValueShape(
        RegulatoryFactKnowledgeState.UNKNOWN,
        definition.valueType,
        {
          booleanValue: null,
          stringValue: null,
          numberValue: null,
          dateValue: null,
          enumValue: null,
          multiValue: [],
        }
      );

    if (!shapeValidation.success) {
      return shapeValidation;
    }

    return {
      success: true,
      snapshot: unknownSnapshotMaterial(definition),
    };
  }

  if (source.valueType !== definition.valueType) {
    return {
      success: false,
      reason: "SOURCE_VALUE_TYPE_MISMATCH",
      message:
        "Authoritative regulatory fact value type does not match the assessment fact definition.",
    };
  }

  if (
    !hasValidLineageId(source.regulatoryFactId) ||
    !hasValidLineageId(source.regulatoryFactValueId)
  ) {
    return {
      success: false,
      reason: "INVALID_SOURCE_LINEAGE",
      message:
        "Source-backed assessment fact snapshot requires valid regulatory fact and fact-value lineage identifiers.",
    };
  }

  const shapeValidation =
    validateRegulatoryFactValueShape(
      source.knowledgeState,
      definition.valueType,
      source.typedValue
    );

  if (!shapeValidation.success) {
    return shapeValidation;
  }

  return {
    success: true,
    snapshot: {
      factDefinitionId: definition.factDefinitionId,
      sourceRegulatoryFactId: source.regulatoryFactId,
      sourceFactValueId: source.regulatoryFactValueId,
      factKey: definition.factKey,
      factName: definition.factName,
      valueType: definition.valueType,
      knowledgeState: source.knowledgeState,
      authorityState: source.authorityState,
      booleanValue: source.typedValue.booleanValue ?? null,
      stringValue: source.typedValue.stringValue ?? null,
      numberValue: source.typedValue.numberValue ?? null,
      dateValue: copyDate(source.typedValue.dateValue ?? null),
      enumValue: source.typedValue.enumValue ?? null,
      multiValue: [...(source.typedValue.multiValue ?? [])],
      validFrom: copyDate(source.validFrom),
      validUntil: copyDate(source.validUntil),
      sourceType: source.sourceType,
      sourceReference: source.sourceReference,
      sourceDescription: source.sourceDescription,
      sourceEstablishedAt: copyDate(source.establishedAt),
      sourceReviewedAt: copyDate(source.reviewedAt),
    },
  };
}

export type AssessmentSnapshotEvaluatorInputFailureReason =
  | "INVALID_KNOWN_SNAPSHOT_VALUE";

export type AssessmentSnapshotEvaluatorInputResult =
  | {
      success: true;
      fact: ApplicabilityRuleFactInput;
    }
  | {
      success: false;
      reason: AssessmentSnapshotEvaluatorInputFailureReason;
      message: string;
    };

function invalidKnownSnapshotValue(
  valueType: RegulatoryFactValueType
): AssessmentSnapshotEvaluatorInputResult {
  return {
    success: false,
    reason: "INVALID_KNOWN_SNAPSHOT_VALUE",
    message:
      `KNOWN ${valueType} assessment fact snapshot does not contain a valid evaluator value.`,
  };
}

function snapshotNumberToEvaluatorString(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value;
}

export function toApplicabilityRuleFactInput(
  snapshot: AssessmentRegulatoryFactSnapshotMaterial
): AssessmentSnapshotEvaluatorInputResult {
  if (
    snapshot.knowledgeState ===
    RegulatoryFactKnowledgeState.UNKNOWN
  ) {
    return {
      success: true,
      fact: {
        knowledgeState: "UNKNOWN",
        valueType: snapshot.valueType,
      },
    };
  }

  switch (snapshot.valueType) {
    case RegulatoryFactValueType.BOOLEAN:
      if (typeof snapshot.booleanValue !== "boolean") {
        return invalidKnownSnapshotValue(
          RegulatoryFactValueType.BOOLEAN
        );
      }

      return {
        success: true,
        fact: {
          knowledgeState: "KNOWN",
          valueType: RegulatoryFactValueType.BOOLEAN,
          value: snapshot.booleanValue,
        },
      };

    case RegulatoryFactValueType.STRING:
      if (typeof snapshot.stringValue !== "string") {
        return invalidKnownSnapshotValue(
          RegulatoryFactValueType.STRING
        );
      }

      return {
        success: true,
        fact: {
          knowledgeState: "KNOWN",
          valueType: RegulatoryFactValueType.STRING,
          value: snapshot.stringValue,
        },
      };

    case RegulatoryFactValueType.NUMBER: {
      const numberValue =
        snapshotNumberToEvaluatorString(
          snapshot.numberValue
        );

      if (numberValue === null) {
        return invalidKnownSnapshotValue(
          RegulatoryFactValueType.NUMBER
        );
      }

      return {
        success: true,
        fact: {
          knowledgeState: "KNOWN",
          valueType: RegulatoryFactValueType.NUMBER,
          value: numberValue,
        },
      };
    }

    case RegulatoryFactValueType.DATE:
      if (
        !(snapshot.dateValue instanceof Date) ||
        !Number.isFinite(snapshot.dateValue.getTime())
      ) {
        return invalidKnownSnapshotValue(
          RegulatoryFactValueType.DATE
        );
      }

      return {
        success: true,
        fact: {
          knowledgeState: "KNOWN",
          valueType: RegulatoryFactValueType.DATE,
          value: snapshot.dateValue.toISOString(),
        },
      };

    case RegulatoryFactValueType.ENUM:
      if (
        typeof snapshot.enumValue !== "string" ||
        snapshot.enumValue.length === 0
      ) {
        return invalidKnownSnapshotValue(
          RegulatoryFactValueType.ENUM
        );
      }

      return {
        success: true,
        fact: {
          knowledgeState: "KNOWN",
          valueType: RegulatoryFactValueType.ENUM,
          value: snapshot.enumValue,
        },
      };

    case RegulatoryFactValueType.MULTI_VALUE:
      if (
        !Array.isArray(snapshot.multiValue) ||
        !snapshot.multiValue.every(
          (value) => typeof value === "string"
        )
      ) {
        return invalidKnownSnapshotValue(
          RegulatoryFactValueType.MULTI_VALUE
        );
      }

      return {
        success: true,
        fact: {
          knowledgeState: "KNOWN",
          valueType: RegulatoryFactValueType.MULTI_VALUE,
          value: [...snapshot.multiValue],
        },
      };
  }
}
