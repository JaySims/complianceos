import { z } from "zod";
import { RegulatoryFactValueType } from "@prisma/client";

export const APPLICABILITY_RULE_SCHEMA_VERSION =
  "applicability-rule-v1" as const;

export const APPLICABILITY_RULE_MAX_DEPTH = 20;
export const APPLICABILITY_RULE_MAX_NODES = 500;
export const APPLICABILITY_RULE_MAX_LOGICAL_CHILDREN = 100;

export const APPLICABILITY_RULE_NODE_KINDS = [
  "CONSTANT",
  "ALL",
  "ANY",
  "NOT",
  "FACT_PREDICATE",
] as const;

export type ApplicabilityRuleNodeKind =
  (typeof APPLICABILITY_RULE_NODE_KINDS)[number];

export const APPLICABILITY_RULE_PREDICATE_OPERATORS = [
  "EQUALS",
  "NOT_EQUALS",
  "GREATER_THAN",
  "GREATER_THAN_OR_EQUAL",
  "LESS_THAN",
  "LESS_THAN_OR_EQUAL",
  "CONTAINS",
  "CONTAINS_ANY",
  "CONTAINS_ALL",
  "IS_EMPTY",
] as const;

export type ApplicabilityRulePredicateOperator =
  (typeof APPLICABILITY_RULE_PREDICATE_OPERATORS)[number];

export type ApplicabilityRuleConstantNode = {
  kind: "CONSTANT";
  value: boolean;
};

export type ApplicabilityRuleAllNode = {
  kind: "ALL";
  children: readonly ApplicabilityRuleNode[];
};

export type ApplicabilityRuleAnyNode = {
  kind: "ANY";
  children: readonly ApplicabilityRuleNode[];
};

export type ApplicabilityRuleNotNode = {
  kind: "NOT";
  child: ApplicabilityRuleNode;
};

export type ApplicabilityRuleFactPredicateNode = {
  kind: "FACT_PREDICATE";
  factKey: string;
  operator: ApplicabilityRulePredicateOperator;
  operand?: unknown;
};

export type ApplicabilityRuleNode =
  | ApplicabilityRuleConstantNode
  | ApplicabilityRuleAllNode
  | ApplicabilityRuleAnyNode
  | ApplicabilityRuleNotNode
  | ApplicabilityRuleFactPredicateNode;

const applicabilityRuleConstantNodeSchema = z.strictObject({
  kind: z.literal("CONSTANT"),
  value: z.boolean(),
});

const applicabilityRuleFactPredicateNodeSchema = z.strictObject({
  kind: z.literal("FACT_PREDICATE"),
  factKey: z.string().trim().min(1),
  operator: z.enum(APPLICABILITY_RULE_PREDICATE_OPERATORS),
  operand: z.unknown().optional(),
});

const applicabilityRuleNodeSchema: z.ZodType<ApplicabilityRuleNode> =
  z.lazy(() =>
    z.union([
      applicabilityRuleConstantNodeSchema,
      applicabilityRuleFactPredicateNodeSchema,
      z.strictObject({
        kind: z.literal("ALL"),
        children: z.array(applicabilityRuleNodeSchema).min(2),
      }),
      z.strictObject({
        kind: z.literal("ANY"),
        children: z.array(applicabilityRuleNodeSchema).min(2),
      }),
      z.strictObject({
        kind: z.literal("NOT"),
        child: applicabilityRuleNodeSchema,
      }),
    ])
  );

type ApplicabilityRuleStructuralMetrics = {
  depth: number;
  nodeCount: number;
};

export type ApplicabilityRulePolicyFailureReason =
  | "INVALID_AST_SHAPE"
  | "AST_DEPTH_LIMIT_EXCEEDED"
  | "AST_NODE_LIMIT_EXCEEDED"
  | "LOGICAL_CHILD_LIMIT_EXCEEDED"
  | "INVALID_PREDICATE_OPERAND_PRESENCE"
  | "INVALID_PREDICATE_OPERATOR_FOR_VALUE_TYPE"
  | "INVALID_PREDICATE_OPERAND_SHAPE";

export type ApplicabilityRulePolicyResult =
  | { success: true; rule: ApplicabilityRuleNode }
  | {
      success: false;
      reason: ApplicabilityRulePolicyFailureReason;
      message: string;
    };

function measureApplicabilityRuleStructure(
  node: ApplicabilityRuleNode
): ApplicabilityRuleStructuralMetrics {
  switch (node.kind) {
    case "CONSTANT":
    case "FACT_PREDICATE":
      return { depth: 1, nodeCount: 1 };

    case "NOT": {
      const child = measureApplicabilityRuleStructure(node.child);
      return {
        depth: child.depth + 1,
        nodeCount: child.nodeCount + 1,
      };
    }

    case "ALL":
    case "ANY": {
      const childMetrics = node.children.map(
        measureApplicabilityRuleStructure
      );

      return {
        depth: Math.max(...childMetrics.map((m) => m.depth)) + 1,
        nodeCount:
          childMetrics.reduce((sum, m) => sum + m.nodeCount, 1),
      };
    }
  }
}

function hasLogicalChildLimitViolation(
  node: ApplicabilityRuleNode
): boolean {
  switch (node.kind) {
    case "CONSTANT":
    case "FACT_PREDICATE":
      return false;

    case "NOT":
      return hasLogicalChildLimitViolation(node.child);

    case "ALL":
    case "ANY":
      return (
        node.children.length >
          APPLICABILITY_RULE_MAX_LOGICAL_CHILDREN ||
        node.children.some(hasLogicalChildLimitViolation)
      );
  }
}

export function validateApplicabilityRuleStructure(
  input: unknown
): ApplicabilityRulePolicyResult {
  const parsed = applicabilityRuleNodeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      reason: "INVALID_AST_SHAPE",
      message: "Applicability rule AST does not match the V1 grammar shape.",
    };
  }

  if (hasLogicalChildLimitViolation(parsed.data)) {
    return {
      success: false,
      reason: "LOGICAL_CHILD_LIMIT_EXCEEDED",
      message: "Applicability rule ALL or ANY node exceeds the V1 child limit.",
    };
  }

  const metrics = measureApplicabilityRuleStructure(parsed.data);
  if (metrics.depth > APPLICABILITY_RULE_MAX_DEPTH) {
    return {
      success: false,
      reason: "AST_DEPTH_LIMIT_EXCEEDED",
      message: "Applicability rule AST exceeds the V1 depth limit.",
    };
  }

  if (metrics.nodeCount > APPLICABILITY_RULE_MAX_NODES) {
    return {
      success: false,
      reason: "AST_NODE_LIMIT_EXCEEDED",
      message: "Applicability rule AST exceeds the V1 total node limit.",
    };
  }

  if (hasPredicateOperandPresenceViolation(parsed.data)) {
    return {
      success: false,
      reason: "INVALID_PREDICATE_OPERAND_PRESENCE",
      message: "Applicability rule predicate operand presence violates the V1 grammar.",
    };
  }

  return {
    success: true,
    rule: parsed.data,
  };
}

function hasInvalidPredicateOperandPresence(
  node: ApplicabilityRuleFactPredicateNode
): boolean {
  const hasOperand =
    Object.prototype.hasOwnProperty.call(node, "operand");

  if (node.operator === "IS_EMPTY") {
    return hasOperand;
  }

  return !hasOperand;
}

function hasPredicateOperandPresenceViolation(
  node: ApplicabilityRuleNode
): boolean {
  switch (node.kind) {
    case "CONSTANT":
      return false;

    case "FACT_PREDICATE":
      return hasInvalidPredicateOperandPresence(node);

    case "NOT":
      return hasPredicateOperandPresenceViolation(node.child);

    case "ALL":
    case "ANY":
      return node.children.some(
        hasPredicateOperandPresenceViolation
      );
  }
}

const APPLICABILITY_RULE_OPERATORS_BY_VALUE_TYPE: Readonly<
  Record<
    RegulatoryFactValueType,
    readonly ApplicabilityRulePredicateOperator[]
  >
> = {
  [RegulatoryFactValueType.BOOLEAN]: [
    "EQUALS",
    "NOT_EQUALS",
  ],
  [RegulatoryFactValueType.STRING]: [
    "EQUALS",
    "NOT_EQUALS",
  ],
  [RegulatoryFactValueType.NUMBER]: [
    "EQUALS",
    "NOT_EQUALS",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUAL",
    "LESS_THAN",
    "LESS_THAN_OR_EQUAL",
  ],
  [RegulatoryFactValueType.DATE]: [
    "EQUALS",
    "NOT_EQUALS",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUAL",
    "LESS_THAN",
    "LESS_THAN_OR_EQUAL",
  ],
  [RegulatoryFactValueType.ENUM]: [
    "EQUALS",
    "NOT_EQUALS",
  ],
  [RegulatoryFactValueType.MULTI_VALUE]: [
    "CONTAINS",
    "CONTAINS_ANY",
    "CONTAINS_ALL",
    "IS_EMPTY",
  ],
};

export function isApplicabilityRuleOperatorAllowedForValueType(
  operator: ApplicabilityRulePredicateOperator,
  valueType: RegulatoryFactValueType
): boolean {
  return APPLICABILITY_RULE_OPERATORS_BY_VALUE_TYPE[
    valueType
  ].includes(operator);
}

export type ApplicabilityRulePredicateTypeValidationResult =
  | { success: true }
  | {
      success: false;
      reason: "INVALID_PREDICATE_OPERATOR_FOR_VALUE_TYPE";
      message: string;
    };

export function validateApplicabilityRulePredicateOperatorForValueType(
  predicate: ApplicabilityRuleFactPredicateNode,
  valueType: RegulatoryFactValueType
): ApplicabilityRulePredicateTypeValidationResult {
  if (
    !isApplicabilityRuleOperatorAllowedForValueType(
      predicate.operator,
      valueType
    )
  ) {
    return {
      success: false,
      reason: "INVALID_PREDICATE_OPERATOR_FOR_VALUE_TYPE",
      message: "Applicability rule predicate operator is not valid for the resolved regulatory fact value type.",
    };
  }

  return { success: true };
}

function isNonEmptyApplicabilityRuleString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isFiniteDecimalString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)
  );
}

function isExplicitTimezoneIsoTimestamp(
  value: unknown
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(
      value
    );

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) {
    return false;
  }

  if (
    day < 1 ||
    day > applicabilityRuleDaysInMonth(year, month)
  ) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function applicabilityRuleDaysInMonth(
  year: number,
  month: number
): number {
  if (month === 2) {
    const leap =
      year % 4 === 0 &&
      (year % 100 !== 0 || year % 400 === 0);
    return leap ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export type ApplicabilityRulePredicateOperandValidationResult =
  | { success: true }
  | {
      success: false;
      reason: "INVALID_PREDICATE_OPERAND_SHAPE";
      message: string;
    };

function invalidApplicabilityRuleOperandShape(
  message: string
): ApplicabilityRulePredicateOperandValidationResult {
  return {
    success: false,
    reason: "INVALID_PREDICATE_OPERAND_SHAPE",
    message,
  };
}

export function validateApplicabilityRulePredicateOperandShape(
  predicate: ApplicabilityRuleFactPredicateNode,
  valueType: RegulatoryFactValueType
): ApplicabilityRulePredicateOperandValidationResult {
  switch (valueType) {
    case RegulatoryFactValueType.BOOLEAN:
      return typeof predicate.operand === "boolean"
        ? { success: true }
        : invalidApplicabilityRuleOperandShape(
            "BOOLEAN applicability predicate requires a JSON boolean operand."
          );

    case RegulatoryFactValueType.STRING:
      return typeof predicate.operand === "string"
        ? { success: true }
        : invalidApplicabilityRuleOperandShape(
            "STRING applicability predicate requires a JSON string operand."
          );

    case RegulatoryFactValueType.NUMBER:
      return isFiniteDecimalString(predicate.operand)
        ? { success: true }
        : invalidApplicabilityRuleOperandShape(
            "NUMBER applicability predicate requires a finite decimal-string operand."
          );

    case RegulatoryFactValueType.DATE:
      return isExplicitTimezoneIsoTimestamp(predicate.operand)
        ? { success: true }
        : invalidApplicabilityRuleOperandShape(
            "DATE applicability predicate requires a valid ISO 8601 timestamp operand with an explicit timezone."
          );

    case RegulatoryFactValueType.ENUM:
      return isNonEmptyApplicabilityRuleString(predicate.operand)
        ? { success: true }
        : invalidApplicabilityRuleOperandShape(
            "ENUM applicability predicate requires a non-empty string operand."
          );


    case RegulatoryFactValueType.MULTI_VALUE:
      switch (predicate.operator) {
        case "IS_EMPTY":
          return { success: true };

        case "CONTAINS":
          return isNonEmptyApplicabilityRuleString(predicate.operand)
            ? { success: true }
            : invalidApplicabilityRuleOperandShape(
                "MULTI_VALUE CONTAINS requires one non-empty string operand."
              );

        case "CONTAINS_ANY":
        case "CONTAINS_ALL":
          return isNonEmptyUniqueStringArray(predicate.operand)
            ? { success: true }
            : invalidApplicabilityRuleOperandShape(
                "MULTI_VALUE CONTAINS_ANY/CONTAINS_ALL requires a non-empty array of unique non-empty strings."
              );

        default:
          return invalidApplicabilityRuleOperandShape(
            "Invalid operand shape for MULTI_VALUE applicability predicate."
          );
      }
  }
}

function isNonEmptyUniqueStringArray(
  value: unknown
): value is readonly string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  if (!value.every(isNonEmptyApplicabilityRuleString)) {
    return false;
  }

  return new Set(value).size === value.length;
}

function collectApplicabilityRuleFactKeys(
  node: ApplicabilityRuleNode,
  keys: Set<string>
): void {
  switch (node.kind) {
    case "CONSTANT":
      return;

    case "FACT_PREDICATE":
      keys.add(node.factKey);
      return;

    case "NOT":
      collectApplicabilityRuleFactKeys(node.child, keys);
      return;

    case "ALL":
    case "ANY":
      for (const child of node.children) {
        collectApplicabilityRuleFactKeys(child, keys);
      }
      return;
  }
}

export function extractApplicabilityRuleFactKeys(
  rule: ApplicabilityRuleNode
): readonly string[] {
  const keys = new Set<string>();
  collectApplicabilityRuleFactKeys(rule, keys);
  return [...keys].sort();
}

export type ApplicabilityRuleSchemaVersionValidationResult =
  | { success: true }
  | {
      success: false;
      reason: "UNSUPPORTED_RULE_SCHEMA_VERSION";
      message: string;
    };

export function validateApplicabilityRuleSchemaVersion(
  version: string
): ApplicabilityRuleSchemaVersionValidationResult {
  return version === APPLICABILITY_RULE_SCHEMA_VERSION
    ? { success: true }
    : {
        success: false,
        reason: "UNSUPPORTED_RULE_SCHEMA_VERSION",
        message: `Unsupported applicability rule schema version: ${version}`,
      };
}

export type ApplicabilityRuleTruthValue =
  | "TRUE"
  | "FALSE"
  | "UNKNOWN";

export function notApplicabilityRuleTruth(
  value: ApplicabilityRuleTruthValue
): ApplicabilityRuleTruthValue {
  switch (value) {
    case "TRUE":
      return "FALSE";
    case "FALSE":
      return "TRUE";
    case "UNKNOWN":
      return "UNKNOWN";
  }
}

export function allApplicabilityRuleTruth(
  values: readonly ApplicabilityRuleTruthValue[]
): ApplicabilityRuleTruthValue {
  if (values.includes("FALSE")) {
    return "FALSE";
  }

  if (values.includes("UNKNOWN")) {
    return "UNKNOWN";
  }

  return "TRUE";
}

export function anyApplicabilityRuleTruth(
  values: readonly ApplicabilityRuleTruthValue[]
): ApplicabilityRuleTruthValue {
  if (values.includes("TRUE")) {
    return "TRUE";
  }

  if (values.includes("UNKNOWN")) {
    return "UNKNOWN";
  }

  return "FALSE";
}

export type ApplicabilityRulePredicateTruthResolver = (
  predicate: ApplicabilityRuleFactPredicateNode
) => ApplicabilityRuleTruthValue;

export function evaluateApplicabilityRuleTruth(
  node: ApplicabilityRuleNode,
  resolvePredicate: ApplicabilityRulePredicateTruthResolver
): ApplicabilityRuleTruthValue {
  switch (node.kind) {
    case "CONSTANT":
      return node.value ? "TRUE" : "FALSE";

    case "FACT_PREDICATE":
      return resolvePredicate(node);

    case "NOT":
      return notApplicabilityRuleTruth(
        evaluateApplicabilityRuleTruth(node.child, resolvePredicate)
      );

    case "ALL":
      return allApplicabilityRuleTruth(
        node.children.map((child) =>
          evaluateApplicabilityRuleTruth(child, resolvePredicate)
        )
      );

    case "ANY":
      return anyApplicabilityRuleTruth(
        node.children.map((child) =>
          evaluateApplicabilityRuleTruth(child, resolvePredicate)
        )
      );
  }
}

export type ApplicabilityRuleFactInput =
  | {
      knowledgeState: "UNKNOWN";
      valueType: RegulatoryFactValueType;
    }
  | {
      knowledgeState: "KNOWN";
      valueType: RegulatoryFactValueType;
      value: unknown;
    };

export function evaluateApplicabilityRulePredicateTruth(
  predicate: ApplicabilityRuleFactPredicateNode,
  fact: ApplicabilityRuleFactInput
): ApplicabilityRuleTruthValue {
  if (fact.knowledgeState === "UNKNOWN") {
    return "UNKNOWN";
  }

  switch (fact.valueType) {
    case RegulatoryFactValueType.BOOLEAN:
      if (typeof fact.value !== "boolean") {
        throw new Error(
          `Invalid KNOWN BOOLEAN fact value for ${predicate.factKey}`
        );
      }

      if (predicate.operator === "EQUALS") {
        return fact.value === predicate.operand ? "TRUE" : "FALSE";
      }

      if (predicate.operator === "NOT_EQUALS") {
        return fact.value !== predicate.operand ? "TRUE" : "FALSE";
      }

      throw new Error(
        `Invalid BOOLEAN operator for ${predicate.factKey}`
      );

    case RegulatoryFactValueType.STRING:
      if (typeof fact.value !== "string") {
        throw new Error(
          `Invalid KNOWN STRING fact value for ${predicate.factKey}`
        );
      }

      if (predicate.operator === "EQUALS") {
        return fact.value === predicate.operand ? "TRUE" : "FALSE";
      }

      if (predicate.operator === "NOT_EQUALS") {
        return fact.value !== predicate.operand ? "TRUE" : "FALSE";
      }

      throw new Error(
        `Invalid STRING operator for ${predicate.factKey}`
      );

    case RegulatoryFactValueType.NUMBER: {
      if (
        !isFiniteDecimalString(fact.value) ||
        !isFiniteDecimalString(predicate.operand)
      ) {
        throw new Error(
          `Invalid KNOWN NUMBER value or operand for ${predicate.factKey}`
        );
      }

      const comparison = compareApplicabilityRuleDecimals(
        fact.value,
        predicate.operand
      );

      switch (predicate.operator) {
        case "EQUALS":
          return comparison === 0 ? "TRUE" : "FALSE";
        case "NOT_EQUALS":
          return comparison !== 0 ? "TRUE" : "FALSE";
        case "GREATER_THAN":
          return comparison > 0 ? "TRUE" : "FALSE";
        case "GREATER_THAN_OR_EQUAL":
          return comparison >= 0 ? "TRUE" : "FALSE";
        case "LESS_THAN":
          return comparison < 0 ? "TRUE" : "FALSE";
        case "LESS_THAN_OR_EQUAL":
          return comparison <= 0 ? "TRUE" : "FALSE";
        default:
          throw new Error(
            `Invalid NUMBER operator for ${predicate.factKey}`
          );
      }
    }

    case RegulatoryFactValueType.DATE: {
      if (
        !isExplicitTimezoneIsoTimestamp(fact.value) ||
        !isExplicitTimezoneIsoTimestamp(predicate.operand)
      ) {
        throw new Error(
          `Invalid KNOWN DATE value or operand for ${predicate.factKey}`
        );
      }

      const factInstant = Date.parse(fact.value);
      const operandInstant = Date.parse(predicate.operand);

      switch (predicate.operator) {
        case "EQUALS":
          return factInstant === operandInstant ? "TRUE" : "FALSE";
        case "NOT_EQUALS":
          return factInstant !== operandInstant ? "TRUE" : "FALSE";
        case "GREATER_THAN":
          return factInstant > operandInstant ? "TRUE" : "FALSE";
        case "GREATER_THAN_OR_EQUAL":
          return factInstant >= operandInstant ? "TRUE" : "FALSE";
        case "LESS_THAN":
          return factInstant < operandInstant ? "TRUE" : "FALSE";
        case "LESS_THAN_OR_EQUAL":
          return factInstant <= operandInstant ? "TRUE" : "FALSE";
        default:
          throw new Error(
            `Invalid DATE operator for ${predicate.factKey}`
          );
      }
    }

    case RegulatoryFactValueType.ENUM:
      if (
        !isNonEmptyApplicabilityRuleString(fact.value) ||
        !isNonEmptyApplicabilityRuleString(predicate.operand)
      ) {
        throw new Error(
          `Invalid KNOWN ENUM value or operand for ${predicate.factKey}`
        );
      }

      if (predicate.operator === "EQUALS") {
        return fact.value === predicate.operand ? "TRUE" : "FALSE";
      }

      if (predicate.operator === "NOT_EQUALS") {
        return fact.value !== predicate.operand ? "TRUE" : "FALSE";
      }

      throw new Error(
        `Invalid ENUM operator for ${predicate.factKey}`
      );

    case RegulatoryFactValueType.MULTI_VALUE: {
      const factValues = fact.value;

      if (
        !Array.isArray(factValues) ||
        !factValues.every(isNonEmptyApplicabilityRuleString) ||
        new Set(factValues).size !== factValues.length
      ) {
        throw new Error(
          `Invalid KNOWN MULTI_VALUE fact value for ${predicate.factKey}`
        );
      }

      switch (predicate.operator) {
        case "CONTAINS":
          if (!isNonEmptyApplicabilityRuleString(predicate.operand)) {
            throw new Error(
              `Invalid MULTI_VALUE CONTAINS operand for ${predicate.factKey}`
            );
          }
          return factValues.includes(predicate.operand)
            ? "TRUE"
            : "FALSE";

        case "CONTAINS_ANY":
          if (!isNonEmptyUniqueStringArray(predicate.operand)) {
            throw new Error(
              `Invalid MULTI_VALUE CONTAINS_ANY operand for ${predicate.factKey}`
            );
          }
          return predicate.operand.some((value) =>
            factValues.includes(value)
          )
            ? "TRUE"
            : "FALSE";

        case "CONTAINS_ALL":
          if (!isNonEmptyUniqueStringArray(predicate.operand)) {
            throw new Error(
              `Invalid MULTI_VALUE CONTAINS_ALL operand for ${predicate.factKey}`
            );
          }
          return predicate.operand.every((value) =>
            factValues.includes(value)
          )
            ? "TRUE"
            : "FALSE";

        case "IS_EMPTY":
          return factValues.length === 0 ? "TRUE" : "FALSE";

        default:
          throw new Error(
            `Invalid MULTI_VALUE operator for ${predicate.factKey}`
          );
      }
    }

    default:
      throw new Error(
        `KNOWN fact predicate evaluation not yet implemented for ${predicate.factKey}`
      );
  }
}

function normalizeApplicabilityRuleDecimal(
  value: string
): { negative: boolean; integer: string; fraction: string } {
  const negative = value.startsWith("-");
  const unsigned = value.replace(/^[+-]/, "");
  const [rawInteger = "", rawFraction = ""] = unsigned.split(".");
  const integer = rawInteger.replace(/^0+(?=\d)/, "") || "0";
  const fraction = rawFraction.replace(/0+$/, "");

  const isZero =
    integer === "0" && fraction.length === 0;

  return {
    negative: isZero ? false : negative,
    integer,
    fraction,
  };
}

function compareApplicabilityRuleDecimals(
  left: string,
  right: string
): -1 | 0 | 1 {
  const a = normalizeApplicabilityRuleDecimal(left);
  const b = normalizeApplicabilityRuleDecimal(right);

  if (a.negative !== b.negative) {
    return a.negative ? -1 : 1;
  }

  const sign = a.negative ? -1 : 1;

  if (a.integer.length !== b.integer.length) {
    return a.integer.length < b.integer.length
      ? (sign === 1 ? -1 : 1)
      : (sign === 1 ? 1 : -1);
  }

  if (a.integer !== b.integer) {
    return a.integer < b.integer
      ? (sign === 1 ? -1 : 1)
      : (sign === 1 ? 1 : -1);
  }

  const fractionLength = Math.max(
    a.fraction.length,
    b.fraction.length
  );
  const aFraction = a.fraction.padEnd(fractionLength, "0");
  const bFraction = b.fraction.padEnd(fractionLength, "0");

  if (aFraction === bFraction) {
    return 0;
  }

  return aFraction < bFraction
    ? (sign === 1 ? -1 : 1)
    : (sign === 1 ? 1 : -1);
}

export type ApplicabilityRuleResolution =
  | "APPLICABLE"
  | "NOT_APPLICABLE"
  | "UNDETERMINED";

export function mapApplicabilityRuleTruthToResolution(
  truth: ApplicabilityRuleTruthValue
): ApplicabilityRuleResolution {
  switch (truth) {
    case "TRUE":
      return "APPLICABLE";
    case "FALSE":
      return "NOT_APPLICABLE";
    case "UNKNOWN":
      return "UNDETERMINED";
  }
}

export type ApplicabilityRuleFactInputMap = Readonly<
  Record<string, ApplicabilityRuleFactInput | undefined>
>;

export function evaluateApplicabilityRule(
  rule: ApplicabilityRuleNode,
  facts: ApplicabilityRuleFactInputMap
): ApplicabilityRuleResolution {
  const truth = evaluateApplicabilityRuleTruth(
    rule,
    (predicate) => {
      const hasFact =
        Object.prototype.hasOwnProperty.call(
          facts,
          predicate.factKey
        );

      const fact = facts[predicate.factKey];

      if (!hasFact || !fact) {
        throw new Error(
          `Missing applicability fact input for ${predicate.factKey}`
        );
      }

      return evaluateApplicabilityRulePredicateTruth(
        predicate,
        fact
      );
    }
  );

  return mapApplicabilityRuleTruthToResolution(truth);
}

export type ApplicabilityRuleFactTypeMap = Readonly<
  Record<string, RegulatoryFactValueType | undefined>
>;

export type ApplicabilityRuleSemanticValidationResult =
  | { success: true }
  | {
      success: false;
      reason:
        | "MISSING_FACT_TYPE"
        | "INVALID_PREDICATE_OPERATOR_FOR_VALUE_TYPE"
        | "INVALID_PREDICATE_OPERAND_SHAPE";
      message: string;
    };

export function validateApplicabilityRuleSemantics(
  rule: ApplicabilityRuleNode,
  factTypes: ApplicabilityRuleFactTypeMap
): ApplicabilityRuleSemanticValidationResult {
  switch (rule.kind) {
    case "CONSTANT":
      return { success: true };

    case "FACT_PREDICATE": {
      const hasFactType =
        Object.prototype.hasOwnProperty.call(
          factTypes,
          rule.factKey
        );

      const valueType = factTypes[rule.factKey];

      if (!hasFactType || !valueType) {
        return {
          success: false,
          reason: "MISSING_FACT_TYPE",
          message: `Missing applicability fact type for ${rule.factKey}`,
        };
      }

      const operatorResult =
        validateApplicabilityRulePredicateOperatorForValueType(
          rule,
          valueType
        );

      if (!operatorResult.success) {
        return operatorResult;
      }

      const operandResult =
        validateApplicabilityRulePredicateOperandShape(
          rule,
          valueType
        );

      if (!operandResult.success) {
        return operandResult;
      }

      return { success: true };
    }

    case "NOT":
      return validateApplicabilityRuleSemantics(
        rule.child,
        factTypes
      );

    case "ALL":
    case "ANY":
      for (const child of rule.children) {
        const result = validateApplicabilityRuleSemantics(
          child,
          factTypes
        );

        if (!result.success) {
          return result;
        }
      }

      return { success: true };
  }
}
