# ComplianceOS Applicability Rule Grammar V1

**Status:** DESIGN CONTRACT — PRE-IMPLEMENTATION

## 1. Purpose

This document defines the V1 declarative rule grammar used by
ApplicabilityDefinition.ruleAst.

The grammar determines how ComplianceOS represents and evaluates legal
applicability conditions over typed regulatory facts.

It is intentionally not a general-purpose programming language.

## 2. Governing Principles

The V1 grammar MUST preserve these ComplianceOS doctrines:

```text
UNKNOWN FACT != FALSE
UNDETERMINED != NOT_APPLICABLE
KNOWN empty MULTI_VALUE != UNKNOWN
LATEST VERSION != CURRENT AUTHORITY
APPROVED RULE != CURRENT RULE
```

Applicability rules MUST be deterministic, declarative, typed and auditable.

They MUST NOT execute arbitrary JavaScript, TypeScript, SQL, shell commands,
eval expressions, dynamic functions, or AI prompts as legal execution logic.

## 3. Input Fact Types

V1 operates only on the canonical RegulatoryFactValueType vocabulary:

```text
BOOLEAN
STRING
NUMBER
DATE
ENUM
MULTI_VALUE
```

Every fact presented to the evaluator also carries a knowledge state:

```text
KNOWN
UNKNOWN
```

The evaluator MUST NOT infer KNOWN from the physical presence of a default value.

## 4. Three-Valued Evaluation Domain

Rule evaluation uses the internal truth domain:

```text
TRUE
FALSE
UNKNOWN
```

The final applicability mapping is:

```text
TRUE     -> APPLICABLE
FALSE    -> NOT_APPLICABLE
UNKNOWN  -> UNDETERMINED
```

UNKNOWN MUST NOT be silently coerced to FALSE.

## 5. Logical Composition

V1 supports exactly three logical composition operators:

```text
ALL
ANY
NOT
```

ALL represents logical conjunction.
ANY represents logical disjunction.
NOT represents logical negation.

These operators evaluate only over the internal truth domain:

```text
TRUE
FALSE
UNKNOWN
```

Logical evaluation MUST preserve UNKNOWN according to the V1 truth tables.

## 6. V1 Truth Tables

### 6.1 ALL

```text
TRUE    ALL TRUE     -> TRUE
TRUE    ALL FALSE    -> FALSE
TRUE    ALL UNKNOWN  -> UNKNOWN
FALSE   ALL TRUE     -> FALSE
FALSE   ALL FALSE    -> FALSE
FALSE   ALL UNKNOWN  -> FALSE
UNKNOWN ALL TRUE     -> UNKNOWN
UNKNOWN ALL FALSE    -> FALSE
UNKNOWN ALL UNKNOWN  -> UNKNOWN
```

### 6.2 ANY

```text
TRUE    ANY TRUE     -> TRUE
TRUE    ANY FALSE    -> TRUE
TRUE    ANY UNKNOWN  -> TRUE
FALSE   ANY TRUE     -> TRUE
FALSE   ANY FALSE    -> FALSE
FALSE   ANY UNKNOWN  -> UNKNOWN
UNKNOWN ANY TRUE     -> TRUE
UNKNOWN ANY FALSE    -> UNKNOWN
UNKNOWN ANY UNKNOWN  -> UNKNOWN
```

### 6.3 NOT

```text
NOT TRUE     -> FALSE
NOT FALSE    -> TRUE
NOT UNKNOWN  -> UNKNOWN
```

For ALL, FALSE dominates before UNKNOWN.
For ANY, TRUE dominates before UNKNOWN.
NOT preserves UNKNOWN.

## 7. V1 AST Node Kinds

Every V1 ruleAst MUST be a single root node.

The root and all descendants MUST use one of these node kinds:

```text
CONSTANT
ALL
ANY
NOT
FACT_PREDICATE
```

No additional node kind is permitted unless introduced by a later grammar version.

Node meaning:

```text
CONSTANT        fixed TRUE or FALSE result
ALL             conjunction over child nodes
ANY             disjunction over child nodes
NOT             negation of exactly one child node
FACT_PREDICATE  typed predicate over one regulatory fact
```

UNKNOWN is not a valid CONSTANT literal.
UNKNOWN arises from evaluation when required regulatory knowledge is unavailable.

## 8. Structural Node Shapes

### 8.1 CONSTANT

```json
{ "kind": "CONSTANT", "value": true }
```

Rules:

```text
value MUST be boolean
no child nodes permitted
no fact reference permitted
```

### 8.2 ALL

```json
{ "kind": "ALL", "children": [ ... ] }
```

Rules:

```text
children MUST be an array
children MUST contain at least two nodes
every child MUST itself be a valid V1 node
```

### 8.3 ANY

```json
{ "kind": "ANY", "children": [ ... ] }
```

Rules:

```text
children MUST be an array
children MUST contain at least two nodes
every child MUST itself be a valid V1 node
```

### 8.4 NOT

```json
{ "kind": "NOT", "child": { ... } }
```

Rules:

```text
child MUST contain exactly one valid V1 node
children arrays are not permitted on NOT
```

FACT_PREDICATE structure is defined separately after the V1 type/operator matrix.

## 9. V1 Predicate Operator Allow-List

FACT_PREDICATE operators are restricted by RegulatoryFactValueType.

V1 permits only these operators:

```text
EQUALS
NOT_EQUALS
GREATER_THAN
GREATER_THAN_OR_EQUAL
LESS_THAN
LESS_THAN_OR_EQUAL
CONTAINS
CONTAINS_ANY
CONTAINS_ALL
IS_EMPTY
```

No other operator is valid in grammar V1.

V1 explicitly excludes arbitrary regex, substring execution, arithmetic,
functions, scripts, dynamic expressions, and caller-defined operators.

V1 does not expose knowledgeState as a predicate operator.
If a referenced fact is UNKNOWN, predicate evaluation produces UNKNOWN.

## 10. V1 Type / Operator Matrix

The operator applied by FACT_PREDICATE MUST be permitted for the referenced fact type.

```text
BOOLEAN
  EQUALS
  NOT_EQUALS

STRING
  EQUALS
  NOT_EQUALS

NUMBER
  EQUALS
  NOT_EQUALS
  GREATER_THAN
  GREATER_THAN_OR_EQUAL
  LESS_THAN
  LESS_THAN_OR_EQUAL

DATE
  EQUALS
  NOT_EQUALS
  GREATER_THAN
  GREATER_THAN_OR_EQUAL
  LESS_THAN
  LESS_THAN_OR_EQUAL

ENUM
  EQUALS
  NOT_EQUALS

MULTI_VALUE
  CONTAINS
  CONTAINS_ANY
  CONTAINS_ALL
  IS_EMPTY
```

Operators outside this matrix MUST fail rule validation.

No implicit type coercion is permitted.
A predicate operand MUST conform to the referenced fact definition valueType.

## 11. Predicate Operand Semantics

Predicate operands MUST be explicit, typed and deterministic.

### 11.1 BOOLEAN

BOOLEAN operands MUST be JSON boolean literals:

```json
true
false
```

String values such as "true" or "false" are invalid BOOLEAN operands.

### 11.2 STRING

STRING operands MUST be JSON strings.

EQUALS and NOT_EQUALS use exact string comparison in V1.
No case folding, trimming, substring matching or normalization is implicit.

### 11.3 NUMBER

NUMBER operands MUST be valid finite decimal strings.

```json
"0"
"12.5"
"1000.00"
"-3.75"
```

V1 MUST NOT rely on JavaScript floating-point coercion for regulatory comparison.
The validator MUST reject operands that are not valid finite decimal representations.

### 11.4 DATE

DATE operands MUST be ISO 8601 timestamp strings with an explicit timezone.

```json
"2026-09-03T00:00:00Z"
"2026-09-03T12:30:00+02:00"
```

Timezone-free date/time strings are invalid in V1.
DATE comparison MUST compare instants, not raw string representations.

### 11.5 ENUM

ENUM operands MUST be non-empty JSON strings.

The referenced value MUST satisfy the controlled option vocabulary of the
RegulatoryFactDefinition.

### 11.6 MULTI_VALUE

CONTAINS takes exactly one non-empty string operand.

CONTAINS_ANY and CONTAINS_ALL take non-empty arrays of unique, non-empty strings.
An empty operand array is invalid for both operators.

Each operand member MUST satisfy the controlled option vocabulary of the
RegulatoryFactDefinition.

IS_EMPTY takes no operand.

A KNOWN empty MULTI_VALUE is authoritative knowledge of an empty set.
It MUST NOT be interpreted as UNKNOWN.

## 12. MULTI_VALUE Evaluation Semantics

For a KNOWN MULTI_VALUE fact, predicates operate over the authoritative set.

```text
CONTAINS x
  TRUE if x is a member of the set
  FALSE otherwise

CONTAINS_ANY [a, b, ...]
  TRUE if at least one operand member exists in the set
  FALSE otherwise

CONTAINS_ALL [a, b, ...]
  TRUE if every operand member exists in the set
  FALSE otherwise

IS_EMPTY
  TRUE if the authoritative set contains zero members
  FALSE otherwise
```

Known-empty behavior is explicit:

```text
KNOWN [] CONTAINS x        -> FALSE
KNOWN [] CONTAINS_ANY [...] -> FALSE
KNOWN [] CONTAINS_ALL [...] -> FALSE
KNOWN [] IS_EMPTY          -> TRUE
```

For UNKNOWN MULTI_VALUE facts, every V1 predicate evaluates to UNKNOWN.

UNKNOWN MUST NOT be reinterpreted as an empty set.

## 13. FACT_PREDICATE Node Shape

A FACT_PREDICATE evaluates exactly one regulatory fact reference.

General form:

```json
{
  "kind": "FACT_PREDICATE",
  "factKey": "example.fact.key",
  "operator": "EQUALS",
  "operand": true
}
```

Rules:

```text
kind MUST equal FACT_PREDICATE
factKey MUST be a non-empty framework-scoped regulatory fact key
operator MUST be permitted by the V1 type/operator matrix
operand MUST satisfy the operator and fact-type operand contract
```

For IS_EMPTY, the operand field MUST be absent.
For every other V1 predicate operator, the operand field MUST be present.

### 13.1 Fact Reference Resolution

factKey is resolved within the framework of the ComplianceRequirement that owns the ApplicabilityDefinition.

Resolution MUST use the unique pair: (frameworkId, factKey).

The resolved RegulatoryFactDefinition MUST exist and MUST be active when a new ApplicabilityDefinition version is validated for creation or approval.

AST fact references MUST NOT resolve by database ID, latest-created definition, or cross-framework key matching.

### 13.2 Controlled Option Resolution

For ENUM and MULTI_VALUE predicates, each operand value MUST resolve against the options belonging to the resolved RegulatoryFactDefinition.

Resolution MUST use the unique pair: (factDefinitionId, optionValue).

Each referenced option MUST exist and MUST be active when a new rule version is validated for creation or approval.

## 14. Rule Dependency Integrity

Every FACT_PREDICATE in ruleAst contributes exactly one regulatory fact reference.

Validation MUST extract the distinct set of factKey values from the complete AST.

Each extracted factKey MUST resolve successfully within the requirement framework.

Duplicate references to the same factKey in multiple predicates do not create duplicate dependencies.

The resolved fact definition IDs form the canonical dependency set for the rule version.

### 14.1 Persisted Dependency Reconciliation

The persisted ApplicabilityRuleFactDependency rows MUST exactly match the canonical dependency set extracted from ruleAst.

Validation MUST reject:

- any fact referenced by ruleAst that has no corresponding dependency row
- any dependency row whose fact is not referenced by ruleAst
- duplicate dependency rows for the same fact definition

Dependency persistence MUST therefore represent ruleAst exactly, not an approximation or superset.

## 15. Grammar Version Identity

ApplicabilityDefinition.ruleSchemaVersion identifies the grammar contract used to validate and evaluate ruleAst.

The canonical V1 identifier is:

```text
applicability-rule-v1
```

V1 validators and evaluators MUST reject unsupported ruleSchemaVersion values.

A rule MUST be validated and evaluated only by logic that explicitly supports its declared grammar version.

Future grammar changes that alter syntax or evaluation semantics MUST use a new ruleSchemaVersion.

## 16. Structural Safety Limits

V1 ruleAst validation MUST enforce bounded structural complexity.

The V1 limits are:

```text
maximum AST depth: 20
maximum total AST nodes: 500
maximum children in one ALL node: 100
maximum children in one ANY node: 100
```

Rules exceeding any V1 structural limit MUST fail validation.

These limits are execution-safety constraints and do not alter legal evaluation semantics.

## 17. V1 Architecture Stress-Test Cases

The grammar MUST satisfy the following adversarial cases before implementation.

### 17.1 Three-Valued Semantics

```text
UNKNOWN fact with EQUALS predicate -> UNKNOWN
NOT UNKNOWN -> UNKNOWN
ALL(FALSE, UNKNOWN) -> FALSE
ALL(TRUE, UNKNOWN) -> UNKNOWN
ANY(TRUE, UNKNOWN) -> TRUE
ANY(FALSE, UNKNOWN) -> UNKNOWN
```

UNKNOWN MUST never be silently coerced to FALSE.

### 17.2 Type and Reference Safety

```text
BOOLEAN with GREATER_THAN -> validation failure
NUMBER with CONTAINS -> validation failure
STRING with numeric operand -> validation failure
NUMBER with invalid decimal string -> validation failure
DATE without explicit timezone -> validation failure
IS_EMPTY with an operand -> validation failure
non-IS_EMPTY predicate without an operand -> validation failure
```

Additional reference-safety cases:

```text
cross-framework factKey resolution -> validation failure
inactive RegulatoryFactDefinition -> validation failure for new rule validation
unknown ENUM option -> validation failure
inactive ENUM option -> validation failure for new rule validation
unknown MULTI_VALUE option -> validation failure
inactive MULTI_VALUE option -> validation failure for new rule validation
```

### 17.3 Dependency and Grammar Integrity

```text
AST fact reference missing dependency row -> validation failure
extra dependency row not referenced by AST -> validation failure
duplicate dependency for same fact definition -> validation failure
unsupported ruleSchemaVersion -> validation failure
```

### 17.4 Structural and Empty-Set Safety

```text
AST depth greater than 20 -> validation failure
total AST nodes greater than 500 -> validation failure
ALL with more than 100 children -> validation failure
ANY with more than 100 children -> validation failure
KNOWN [] with CONTAINS x -> FALSE
KNOWN [] with CONTAINS_ANY [...] -> FALSE
KNOWN [] with CONTAINS_ALL [...] -> FALSE
KNOWN [] with IS_EMPTY -> TRUE
UNKNOWN MULTI_VALUE with any predicate -> UNKNOWN
```

## 18. Closed Node Shapes

V1 AST node shapes are closed contracts.

Properties not defined for a node kind MUST cause validation failure.

Validators MUST NOT silently ignore, preserve or execute unknown node properties.

This rule applies recursively to the root node and every descendant node.

### 18.1 Closed-Shape Stress Test

```text
any AST node containing an unknown property -> validation failure
```
