import {
  RegulatoryFactKnowledgeState,
  RegulatoryFactValueType,
} from "@prisma/client";

/*
 * ============================================================
 * COMPLIANCEOS — REGULATORY FACT VALUE POLICY
 * ============================================================
 *
 * PURPOSE
 *
 * Enforce the semantic shape of RegulatoryFactValue before any
 * value is persisted or considered for regulatory-fact authority.
 *
 * This module is intentionally pure:
 *
 * - no Prisma client;
 * - no database reads;
 * - no database writes;
 * - no authority mutation.
 *
 * Controlled ENUM / MULTI_VALUE vocabulary membership requires
 * definition-option data and is therefore validated separately by
 * the regulatory-fact value service.
 *
 * ============================================================
 */

export type RegulatoryFactTypedValueInput = {
  booleanValue?: boolean | null;
  stringValue?: string | null;
  numberValue?: string | number | null;
  dateValue?: Date | null;
  enumValue?: string | null;
  multiValue?: readonly string[] | null;
};

export type RegulatoryFactValuePolicyFailureReason =
  | "UNKNOWN_VALUE_CONTAINS_SUBSTANTIVE_DATA"
  | "KNOWN_VALUE_MISSING_REQUIRED_DATA"
  | "KNOWN_VALUE_HAS_CONFLICTING_TYPED_DATA"
  | "INVALID_STRING_VALUE"
  | "INVALID_NUMBER_VALUE"
  | "INVALID_DATE_VALUE"
  | "INVALID_ENUM_VALUE"
  | "INVALID_MULTI_VALUE";

export type RegulatoryFactValuePolicyResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason: RegulatoryFactValuePolicyFailureReason;
      message: string;
    };

function hasNonEmptyString(
  value: string | null | undefined
): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function hasNumberValue(
  value: string | number | null | undefined
): boolean {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "string") {
    const normalized = value.trim();

    if (normalized.length === 0) {
      return false;
    }

    return Number.isFinite(Number(normalized));
  }

  return false;
}

function hasValidDate(
  value: Date | null | undefined
): boolean {
  return (
    value instanceof Date &&
    Number.isFinite(value.getTime())
  );
}

function normalizedMultiValue(
  value: readonly string[] | null | undefined
): readonly string[] {
  return value ?? [];
}

function hasSubstantiveTypedValue(
  input: RegulatoryFactTypedValueInput
): boolean {
  return (
    input.booleanValue !== null &&
      input.booleanValue !== undefined ||
    hasNonEmptyString(input.stringValue) ||
    hasNumberValue(input.numberValue) ||
    hasValidDate(input.dateValue) ||
    hasNonEmptyString(input.enumValue) ||
    normalizedMultiValue(input.multiValue).length > 0
  );
}

function activeTypedFieldCount(
  input: RegulatoryFactTypedValueInput
): number {
  return [
    input.booleanValue !== null &&
      input.booleanValue !== undefined,
    hasNonEmptyString(input.stringValue),
    hasNumberValue(input.numberValue),
    hasValidDate(input.dateValue),
    hasNonEmptyString(input.enumValue),
    normalizedMultiValue(input.multiValue).length > 0,
  ].filter(Boolean).length;
}

function conflictingTypedValueResult():
  RegulatoryFactValuePolicyResult {
  return {
    success: false,
    reason:
      "KNOWN_VALUE_HAS_CONFLICTING_TYPED_DATA",
    message:
      "Known regulatory fact value contains data in a typed field that does not match its definition value type.",
  };
}

export function validateRegulatoryFactValueShape(
  knowledgeState: RegulatoryFactKnowledgeState,
  valueType: RegulatoryFactValueType,
  input: RegulatoryFactTypedValueInput
): RegulatoryFactValuePolicyResult {
  if (
    knowledgeState ===
    RegulatoryFactKnowledgeState.UNKNOWN
  ) {
    if (hasSubstantiveTypedValue(input)) {
      return {
        success: false,
        reason:
          "UNKNOWN_VALUE_CONTAINS_SUBSTANTIVE_DATA",
        message:
          "Unknown regulatory fact value cannot contain authoritative substantive typed data.",
      };
    }

    return {
      success: true,
    };
  }

  switch (valueType) {
    case RegulatoryFactValueType.BOOLEAN: {
      if (
        typeof input.booleanValue !== "boolean"
      ) {
        return {
          success: false,
          reason:
            "KNOWN_VALUE_MISSING_REQUIRED_DATA",
          message:
            "Known BOOLEAN regulatory fact requires booleanValue.",
        };
      }

      if (activeTypedFieldCount(input) !== 1) {
        return conflictingTypedValueResult();
      }

      return {
        success: true,
      };
    }

    case RegulatoryFactValueType.STRING: {
      if (!hasNonEmptyString(input.stringValue)) {
        return {
          success: false,
          reason: "INVALID_STRING_VALUE",
          message:
            "Known STRING regulatory fact requires a non-empty stringValue.",
        };
      }

      if (activeTypedFieldCount(input) !== 1) {
        return conflictingTypedValueResult();
      }

      return {
        success: true,
      };
    }

    case RegulatoryFactValueType.NUMBER: {
      if (!hasNumberValue(input.numberValue)) {
        return {
          success: false,
          reason: "INVALID_NUMBER_VALUE",
          message:
            "Known NUMBER regulatory fact requires a finite numeric numberValue.",
        };
      }

      if (activeTypedFieldCount(input) !== 1) {
        return conflictingTypedValueResult();
      }

      return {
        success: true,
      };
    }

    case RegulatoryFactValueType.DATE: {
      if (!hasValidDate(input.dateValue)) {
        return {
          success: false,
          reason: "INVALID_DATE_VALUE",
          message:
            "Known DATE regulatory fact requires a valid dateValue.",
        };
      }

      if (activeTypedFieldCount(input) !== 1) {
        return conflictingTypedValueResult();
      }

      return {
        success: true,
      };
    }

    case RegulatoryFactValueType.ENUM: {
      if (!hasNonEmptyString(input.enumValue)) {
        return {
          success: false,
          reason: "INVALID_ENUM_VALUE",
          message:
            "Known ENUM regulatory fact requires a non-empty enumValue.",
        };
      }

      if (activeTypedFieldCount(input) !== 1) {
        return conflictingTypedValueResult();
      }

      return {
        success: true,
      };
    }

    case RegulatoryFactValueType.MULTI_VALUE: {
      const values =
        normalizedMultiValue(input.multiValue);

      /*
       * KNOWN + [] is valid by design and represents an
       * authoritative empty set.
       */

      if (
        values.some(
          (value) =>
            typeof value !== "string" ||
            value.trim().length === 0
        )
      ) {
        return {
          success: false,
          reason: "INVALID_MULTI_VALUE",
          message:
            "Known MULTI_VALUE regulatory fact cannot contain empty values.",
        };
      }

      const conflictingScalarField =
        input.booleanValue !== null &&
          input.booleanValue !== undefined ||
        hasNonEmptyString(input.stringValue) ||
        hasNumberValue(input.numberValue) ||
        hasValidDate(input.dateValue) ||
        hasNonEmptyString(input.enumValue);

      if (conflictingScalarField) {
        return conflictingTypedValueResult();
      }

      return {
        success: true,
      };
    }

    default: {
      const exhaustiveCheck: never =
        valueType;

      throw new Error(
        `Unhandled regulatory fact value type: ${exhaustiveCheck}`
      );
    }
  }
}
