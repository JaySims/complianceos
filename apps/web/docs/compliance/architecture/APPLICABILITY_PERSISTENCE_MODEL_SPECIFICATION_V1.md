# Applicability Persistence Model Specification V1

**Milestone:** 8A.3.4A — Exact Persistence Model Specification
**Status:** DESIGN SPECIFICATION — NOT YET IMPLEMENTED
**Domain:** Regulatory Applicability Persistence
**Primary Framework Context:** POPIA
**Architecture Parent:** APPLICABILITY_PERSISTENCE_ARCHITECTURE_V1.md

---

# 1. Purpose

This document defines the exact conceptual persistence model for the ComplianceOS regulatory applicability domain.

It translates the locked applicability persistence architecture into an implementation-ready design contract without authorizing a Prisma schema change, database migration, production applicability execution, scoring change, public API, or service implementation.

The specification exists to ensure that future persistence implementation preserves:

- regulatory truth;
- tenant integrity;
- framework integrity;
- historical reproducibility;
- three-valued applicability;
- regulatory-fact provenance;
- regulatory-fact version history;
- explicit current authority;
- contextual applicability;
- rule-version history;
- assessment-time fact snapshots;
- applicability-determination history;
- human authority boundaries;
- AI advisory boundaries;
- evidence-engine isolation;
- compliance-score integrity.

This document is the required design gate before the Prisma schema proposal.

---

# 2. Implementation Boundary

This specification does NOT authorize:

- modification of `schema.prisma`;
- creation or execution of Prisma migrations;
- production catalogue provisioning;
- production regulatory-fact persistence;
- production applicability resolution;
- modification of the locked evidence engine;
- modification of the locked compliance-scoring algorithm;
- modification of organization compliance aggregation;
- Trust Score integration;
- Executive AI integration;
- public applicability APIs;
- public regulatory-fact APIs;
- automated legal determinations by AI.

All names and fields in this document remain conceptual persistence contracts until separately approved through the Prisma schema proposal and schema stress-test milestones.

---

# 3. Locked Domain Doctrine

The persistence model SHALL preserve these invariants:

```text
ACTIVE ≠ APPLICABLE

MANDATORY ≠ UNIVERSAL

MISSING EVIDENCE ≠ NOT_APPLICABLE

UNKNOWN FACT ≠ FALSE

UNDETERMINED ≠ COMPLIANT

CURRENT ≠ VERIFIED

VERIFIED FACT ≠ COMPLIANT REQUIREMENT

APPROVED RULE ≠ CURRENT RULE

FACT PROVENANCE ≠ FACT AUTHORITY

REAL-WORLD VALIDITY ≠ SYSTEM KNOWLEDGE TIME

CURRENT ORGANIZATION STATE ≠ HISTORICAL ASSESSMENT STATE
```

No persistence implementation may weaken these distinctions.

---

# 4. Regulatory Persistence Chain

The approved conceptual chain is:

```text
Framework
   │
   ├── RegulatoryFactDefinition
   │
   └── ComplianceRequirement
            │
            └── ApplicabilityDefinition versions
                         │
                         └── Current Applicability Definition Authority

Organization × Framework
   │
   └── ApplicabilityContext
            │
            └── RegulatoryFact
                     │
                     ├── RegulatoryFactValue V1
                     ├── RegulatoryFactValue V2
                     └── RegulatoryFactValue V3
                                  │
                                  └── Current Regulatory Fact Authority

Assessment
   │
   ├── AssessmentRegulatoryFactSnapshot
   │
   └── AssessmentRequirementApplicability
             │
             ├── Applicability Revision 1
             ├── Applicability Revision 2
             └── Applicability Revision 3
                          │
                          └── Current Applicability Resolution Authority

Applicability Revision
   │
   └── Determination Fact Basis
             │
             └── AssessmentRegulatoryFactSnapshot

Current APPLICABLE requirements only
   │
   ↓
Locked Evidence Engine
   │
   ↓
Locked Compliance Scoring
```

---

# 5. Persistence Categories

The applicability domain contains three broad persistence categories.

## 5.1 Reference and definition state

Examples:

- Framework;
- ComplianceRequirement;
- RegulatoryFactDefinition;
- ApplicabilityDefinition.

These records describe regulatory meaning.

Once historically relied upon, they must not be destructively rewritten in a way that changes historical interpretation.

## 5.2 Current operational state

Examples:

- ApplicabilityContext;
- RegulatoryFact;
- current-authority records.

These records describe current domain organization and authoritative selection.

Current-authority records may change transactionally.

Changing current authority must never destroy historical versions.

## 5.3 Historical audit state

Examples:

- RegulatoryFactValue;
- AssessmentRegulatoryFactSnapshot;
- AssessmentRequirementApplicabilityRevision;
- DeterminationFactBasis.

These records form the regulatory audit chain.

Historical audit state is preservation-first.

---

# 6. RegulatoryFactDefinition

## 6.1 Responsibility

`RegulatoryFactDefinition` defines a stable regulatory question or fact type that may influence applicability.

Examples include:

```text
processing.special_personal_information
processing.children_personal_information
marketing.electronic_direct_marketing
relationships.operator_processes_personal_information
security.qualifying_compromise
transfers.personal_information_to_foreign_country_third_party
```

A fact definition describes WHAT may be established.

It does not contain the organization's answer.

## 6.2 Ownership

A RegulatoryFactDefinition belongs to a Framework.

Conceptually:

```text
Framework
   └── RegulatoryFactDefinition
```

A POPIA fact definition must not be used as though it belongs to another framework.

## 6.3 Conceptual fields

The persistence contract requires concepts equivalent to:

```text
id
frameworkId
key
name
description
valueType
permittedContextTypes
lifecycleState
version semantics where required
regulatory provenance
createdAt
updatedAt where mutable metadata is permitted
```

Exact physical fields remain subject to the Prisma schema proposal.

## 6.4 Stable key

The definition requires a stable machine-readable key.

Example:

```text
marketing.electronic_direct_marketing
```

The stable key must not depend on a human-readable title.

Renaming a display label must not change fact identity.

## 6.5 Value types

Supported conceptual fact-value types are:

```text
BOOLEAN
STRING
NUMBER
DATE
ENUM
MULTI_VALUE
```

Structured JSON may be permitted only where a future regulatory fact genuinely requires structured data and a dedicated typed representation is not appropriate.

JSON must not become an escape hatch for ordinary scalar facts.

## 6.6 Event is not a primitive fact-value type

Events are primarily represented through `ApplicabilityContext`.

Example:

```text
Context:
EVENT:security-incident-001

Fact Definition:
security.qualifying_compromise

Fact Value:
BOOLEAN TRUE
```

This is preferred over encoding the event itself as a primitive fact value.

## 6.7 Lifecycle

A fact definition used historically should be retired rather than erased.

Physical deletion must not destroy historical regulatory meaning.

---

# 7. ApplicabilityContext

## 7.1 Responsibility

`ApplicabilityContext` provides the stable real-world scope in which regulatory facts and applicability questions exist.

Applicability is not always organization-wide.

Contexts may represent:

```text
ORGANIZATION
EVENT
MATTER
PROCESSING_ACTIVITY
RELATIONSHIP
TRANSFER
SYSTEM
AUTOMATED_DECISION
```

Additional context types require separate approval.

## 7.2 Ownership

ApplicabilityContext is scoped to:

```text
Organization
+
Framework
```

It is not owned exclusively by an Assessment.

The same real-world event, matter, relationship, or activity may remain relevant across multiple assessments.

## 7.3 Explicit organization context

Organization-wide applicability SHALL use an explicit ORGANIZATION context.

It SHALL NOT rely on:

```text
contextId = NULL
```

as the meaning of organization-wide scope.

Conceptually:

```text
organizationId = Org A
frameworkId = POPIA
type = ORGANIZATION
stableKey = ORGANIZATION
```

## 7.4 Stable identity

A context requires a stable machine identity independent of its display name.

Conceptually:

```text
id
organizationId
frameworkId
type
stableKey
name?
description?
openedAt?
occurredAt?
closedAt?
lifecycleState?
createdAt
updatedAt
```

Exact physical fields remain unapproved until the Prisma proposal.

## 7.5 Conceptual uniqueness

Context identity must be unique within:

```text
Organization
+
Framework
+
Context Type
+
Stable Context Key
```

A display name must not be the authoritative identity.

## 7.6 Context lifecycle

Contexts used historically must not be physically erased through ordinary operations.

Events and matters may become closed, archived, or retired through future approved lifecycle semantics.

Closure does not erase history.

---

# 8. RegulatoryFact

## 8.1 Responsibility

`RegulatoryFact` provides stable identity for a regulatory fact across changing versions.

It answers:

> What regulatory fact are these versions describing?

It does not itself represent the changing value.

## 8.2 Stable identity

Conceptually:

```text
RegulatoryFact
=
Organization
+
RegulatoryFactDefinition
+
ApplicabilityContext
```

## 8.3 Conceptual fields

```text
id
organizationId
factDefinitionId
contextId
createdAt
```

Additional lifecycle metadata may be approved later.

The substantive fact value must not live on this stable identity.

## 8.4 Non-null context

Every RegulatoryFact must have a context.

Organization-wide facts use the explicit ORGANIZATION context.

This avoids nullable-context identity ambiguity.

## 8.5 Conceptual uniqueness

The stable identity is conceptually unique by:

```text
organizationId
+
factDefinitionId
+
contextId
```

## 8.6 Integrity

The following must hold:

```text
RegulatoryFact.organizationId
=
ApplicabilityContext.organizationId
```

and:

```text
RegulatoryFactDefinition.frameworkId
=
ApplicabilityContext.frameworkId
```

Cross-tenant and cross-framework fact identities are invalid.

---

# 9. RegulatoryFactValue

## 9.1 Responsibility

`RegulatoryFactValue` represents one immutable historical assertion about a RegulatoryFact.

Changing regulatory reality creates another version.

Historical versions are not overwritten.

## 9.2 Fact-history strategy

The approved strategy is:

```text
APPEND-ONLY / VERSIONED FACT VALUES
+
EXPLICIT CURRENT AUTHORITY
```

The model SHALL NOT depend on a mutable single fact-value row plus informal history.

## 9.3 Conceptual identity

Each value belongs to one RegulatoryFact.

Conceptually:

```text
RegulatoryFact
   ├── V1
   ├── V2
   └── V3
```

## 9.4 Conceptual fields

The persistence contract requires concepts equivalent to:

```text
id
regulatoryFactId
version
knowledgeState
authorityState
valueTypeSnapshot
booleanValue?
stringValue?
numberValue?
dateValue?
enumValue?
multiValue?
structuredValue?
establishedAt
validFrom?
validUntil?
reviewedAt?
freshness boundary metadata?
source/provenance metadata
establishedBy?
supersession/correction lineage?
createdAt
```

Exact physical representation remains for the Prisma proposal.

## 9.5 Typed value rule

A KNOWN fact version must contain exactly one compatible substantive value representation.

Examples:

```text
BOOLEAN → booleanValue
NUMBER  → numberValue
DATE    → dateValue
```

The persisted value type must agree with the corresponding RegulatoryFactDefinition contract.

## 9.6 UNKNOWN rule

If:

```text
knowledgeState = UNKNOWN
```

then no substantive fact value may be treated as established.

UNKNOWN must never be represented by FALSE, zero, an empty string, or an empty collection unless that value is genuinely KNOWN and legally meaningful.

## 9.7 Absence and explicit UNKNOWN

These conditions must remain distinguishable:

```text
NO AUTHORITATIVE FACT VERSION EXISTS

versus

AN AUTHORITATIVE UNKNOWN VERSION EXISTS
```

Both may result in conservative unresolved applicability, but their provenance differs.

---

# 10. Fact Knowledge State

The approved conceptual knowledge states are:

```text
KNOWN
UNKNOWN
```

Knowledge state answers only:

> Does this fact version contain an established substantive value?

It does not express compliance, applicability, evidence verification, freshness, or current authority.

`UNDETERMINED` does not belong here.

UNDETERMINED is an applicability result.
---

# 11. Fact Authority State

Fact authority is independent of knowledge.

The approved conceptual authority states are:

```text
DECLARED
REVIEWED
VERIFIED
DISPUTED
```

These states represent the standing of the assertion.

They do not represent compliance.

For example:

```text
marketing.electronic_direct_marketing = TRUE
authorityState = VERIFIED
```

may increase regulatory scope.

Therefore:

```text
VERIFIED FACT ≠ COMPLIANT ORGANIZATION
```

---

# 12. Freshness

Freshness is independent of knowledge and authority.

A fact may be:

```text
KNOWN
+
VERIFIED
+
STALE FOR CURRENT USE
```

without changing its historical authority.

Freshness should preferably be determined from:

```text
establishedAt
reviewedAt
fact freshness policy
reference time
```

rather than a mutable Boolean such as:

```text
stale = true
```

If a `staleAt`-equivalent boundary is persisted, it should represent a deterministic temporal boundary rather than an informal mutable status.

---

# 13. Temporal Semantics

## 13.1 Separate clocks

The persistence architecture distinguishes:

```text
REAL-WORLD VALIDITY TIME
SYSTEM KNOWLEDGE / ESTABLISHMENT TIME
CURRENT AUTHORITY TIME
ASSESSMENT REFERENCE TIME
```

These clocks must not be silently collapsed.

## 13.2 validFrom

`validFrom` represents when the assertion claims to have become true in regulatory reality.

## 13.3 establishedAt

`establishedAt` represents when ComplianceOS established the assertion.

Therefore this is valid:

```text
validFrom < establishedAt
```

## 13.4 Future-effective facts

This is also valid:

```text
validFrom > establishedAt
```

when a future regulatory state is legitimately known in advance.

Future-effective assertions must not automatically govern the present merely because they have been recorded.

## 13.5 Backdated facts

Backdated regulatory assertions are permitted where supported by provenance.

A backdated fact must not rewrite what an earlier assessment actually knew or relied upon.

## 13.6 validUntil

`validUntil` means the assertion is known to stop describing regulatory reality after a particular point.

It is distinct from freshness.

## 13.7 Corrections

A correction of previously incorrect information must be distinguishable from an ordinary change in real-world state.

Historical incorrect assertions are not erased.

The model must preserve conceptual lineage sufficient to distinguish:

```text
SUPERSEDES
CORRECTS
```

or equivalent semantics.

## 13.8 Overlapping validity

Contradictory authoritative KNOWN versions for the same stable RegulatoryFact must not silently govern the same effective period.

Conflicting temporal assertions require explicit resolution.

The system must not resolve such conflicts merely through:

```text
MAX(version)
MAX(createdAt)
```

---

# 14. CurrentRegulatoryFactAuthority

## 14.1 Responsibility

Current regulatory fact authority identifies which immutable RegulatoryFactValue currently governs the RegulatoryFact.

Conceptually:

```text
RegulatoryFact
   ├── V1
   ├── V2
   └── V3
         ↑
CurrentRegulatoryFactAuthority
```

## 14.2 Explicit authority

Current authority must not be inferred from highest version, latest creation time, or latest establishment time.

## 14.3 Cardinality

A RegulatoryFact has zero or one current authority.

The authority points to exactly one RegulatoryFactValue when present.

## 14.4 UNKNOWN may be current

Current authority may legitimately point to an UNKNOWN fact version.

Example:

```text
knowledgeState = UNKNOWN
authorityState = REVIEWED
```

This preserves conservative applicability behavior.

## 14.5 Current is not verified

```text
CURRENT ≠ VERIFIED
```

A declared or reviewed fact may be current without being verified.

## 14.6 Authority movement

Moving current authority must occur through an explicit authorized domain operation.

Changing authority must not mutate or delete historical fact versions.

---

# 15. Provenance

## 15.1 Principle

Every regulatory fact assertion must retain structured provenance sufficient to explain where it came from and how it obtained its standing.

## 15.2 Source and authority are separate

```text
SOURCE ≠ AUTHORITY
```

A user declaration can later become reviewed or verified without pretending the original source changed.

## 15.3 Conceptual source classes

The persistence architecture must support source concepts equivalent to:

```text
USER_DECLARATION
DOCUMENT
EXTERNAL_SOURCE
SYSTEM_DERIVATION
HUMAN_REVIEW
MIGRATION
```

AI assistance must be represented separately from the underlying source of regulatory truth.

## 15.4 Structured lineage

The provenance architecture must be capable of answering:

- Who established the assertion?
- What source supported it?
- When was it established?
- Which organization did it belong to?
- Which context did it belong to?
- Which source object was used?
- Was AI involved?
- Which previous fact version did it supersede or correct?
- Which derivation or extraction version was used?
- Who reviewed it?
- When did authority change?

Human-readable notes alone are insufficient.

---

# 16. AI Authority Boundary

AI may:

- propose regulatory facts;
- extract candidate facts from documents;
- classify information;
- summarize regulatory material;
- identify possible inconsistencies;
- recommend questions;
- explain persisted applicability results.

AI must not independently:

- manufacture organization regulatory facts;
- convert UNKNOWN to FALSE;
- establish VERIFIED regulatory truth without an approved authority path;
- make hidden legal applicability overrides;
- change current fact authority;
- change current rule authority;
- rewrite completed assessment history.

AI-assisted extraction must preserve the underlying source and machine-assistance provenance.

---

# 17. ApplicabilityDefinition

## 17.1 Responsibility

`ApplicabilityDefinition` represents one immutable version of the deterministic applicability rule for a ComplianceRequirement.

It answers:

> Under what regulatory conditions does this requirement apply?

## 17.2 Ownership

An ApplicabilityDefinition belongs to one ComplianceRequirement.

The requirement belongs to one Framework.

## 17.3 Versioning

Rule definitions are immutable versions.

Conceptually:

```text
Requirement
   ├── Rule V1
   ├── Rule V2
   └── Rule V3
```

A substantive rule change creates a new version.

Historical rule meaning is not overwritten.

## 17.4 Conceptual fields

The persistence contract requires concepts equivalent to:

```text
id
requirementId
version
applicabilityClass
resolutionPattern
ruleDefinition / validated declarative AST
ruleSchemaVersion
lifecycleState
regulatory provenance
effectiveFrom?
reviewedBy?
approvedAt?
createdAt
```

Exact physical fields remain for the Prisma proposal.

---

# 18. Applicability Rule Grammar

## 18.1 Declarative only

Applicability rules must be declarative data.

The persistence model SHALL NOT store arbitrary executable:

```text
JavaScript
TypeScript
SQL
shell code
eval expressions
AI prompts as executable legal rules
```

## 18.2 Controlled rule AST

Rules may be represented through a constrained, validated abstract syntax tree.

Potential approved operators may include only those required by the catalogue, such as:

```text
CONSTANT
FACT
AND
OR
NOT
EQUALS
IN
EXISTS
```

The exact V1 operator set must be approved during implementation.

ComplianceOS must not create a general-purpose programming language inside the applicability database.

## 18.3 Validation

A persisted rule must be validated against an application-owned schema.

The validator must reject:

- unknown operators;
- malformed operands;
- unknown fact definitions;
- incompatible fact-value types;
- unsupported rule structures;
- cross-framework fact dependencies.

---

# 19. Applicability Rule Dependencies

Rule dependencies on RegulatoryFactDefinition must be explicit.

Conceptually:

```text
ApplicabilityDefinition
        │
        └── ApplicabilityRuleFactDependency
                    │
                    └── RegulatoryFactDefinition
```

This permits integrity checking and dependency analysis without relying exclusively on parsing rule JSON.

The dependency relation must preserve framework integrity.

---

# 20. Applicability Classes

The broad applicability classes remain:

```text
GENERAL
CONDITIONAL
SECTOR_SPECIFIC
EVENT_TRIGGERED
```

These are regulatory classifications.

They do not replace the actual rule.

---

# 21. Resolution Patterns

The approved conceptual resolution patterns include:

```text
GENERAL_UNCONDITIONAL
GENERAL_WITH_EXCEPTION
ACTIVITY_CONDITIONAL
RELATIONSHIP_CONDITIONAL
PROCESSING_CATEGORY_CONDITIONAL
EVENT_TRIGGERED
REQUEST_OR_DISPUTE_TRIGGERED
PRIOR_AUTHORISATION_CONDITIONAL
SECTOR_SPECIFIC
COMPOUND_CONDITIONAL
```

Resolution pattern and applicability class are separate concepts.

---

# 22. General Requirements

General requirements must still receive explicit applicability definitions.

A GENERAL_UNCONDITIONAL requirement may conceptually use:

```text
CONSTANT TRUE
```

This avoids hidden implicit applicability behavior.

The desired architecture is:

```text
Every requirement
→ authoritative applicability definition
→ explicit persisted applicability determination
```

---

# 23. Three-Valued Rule Evaluation

The applicability resolver uses controlled three-valued logic:

```text
TRUE
FALSE
UNKNOWN
```

Examples:

```text
NOT UNKNOWN = UNKNOWN

TRUE AND UNKNOWN = UNKNOWN
FALSE AND UNKNOWN = FALSE

TRUE OR UNKNOWN = TRUE
FALSE OR UNKNOWN = UNKNOWN
```

Final applicability mapping is:

```text
TRUE    → APPLICABLE
FALSE   → NOT_APPLICABLE
UNKNOWN → UNDETERMINED
```

Individual rules must not redefine UNKNOWN as NOT_APPLICABLE.

---

# 24. Regulatory Review Boundary

`REGULATORY_REVIEW` is a governance flag or workflow boundary.

It must not operate as:

```text
if uncertain:
    return reviewer preference
```

A rule requiring regulatory review must not become authoritative for production applicability until the legal or regulatory interpretation is resolved and represented through an approved rule version.

---

# 25. CurrentApplicabilityDefinitionAuthority

## 25.1 Responsibility

Current applicability-definition authority identifies which approved ApplicabilityDefinition currently governs a ComplianceRequirement.

## 25.2 Explicit selection

Current rule authority must not be inferred from highest version, latest creation time, or latest approval time.

## 25.3 Cardinality

A requirement has zero or one current authoritative applicability definition.

## 25.4 Lifecycle and authority are separate

```text
APPROVED ≠ CURRENT
```

A historical rule may remain approved but no longer be current.

## 25.5 Separate authority domain

```text
CurrentApplicabilityDefinitionAuthority
≠
CurrentRegulatoryFactAuthority
≠
CurrentAssessmentAuthority
```

These are separate concepts and must remain independently controlled.
---

# 26. AssessmentRegulatoryFactSnapshot

## 26.1 Responsibility

`AssessmentRegulatoryFactSnapshot` is an immutable assessment-owned historical representation of the regulatory fact state actually used during applicability resolution.

It protects assessments from later changes to current facts.

## 26.2 Copy plus lineage

The snapshot must preserve:

```text
COPIED HISTORICAL MEANING
+
SOURCE VERSION LINEAGE
```

It must not rely exclusively on mutable upstream state.

## 26.3 Conceptual fields

The persistence contract requires concepts equivalent to:

```text
id
assessmentId
regulatoryFactId
sourceRegulatoryFactValueId?
context identity
factDefinition identity
factKeySnapshot
factDefinitionVersionSnapshot?
valueTypeSnapshot
typed value snapshot
knowledgeStateSnapshot
authorityStateSnapshot
provenance snapshot
validFromSnapshot?
validUntilSnapshot?
establishedAtSnapshot?
freshnessAtResolution
referenceTime
source-absence reason?
createdAt
```

Exact physical representation remains for the Prisma proposal.

## 26.4 Source lineage

Where an authoritative RegulatoryFactValue existed, the snapshot should retain lineage to that source version.

The snapshot must still copy enough meaning to remain historically understandable if upstream metadata later changes.

## 26.5 Unknown without source version

If no authoritative fact version exists, an assessment may still require a snapshot representing:

```text
UNKNOWN
NO_AUTHORITATIVE_VALUE
```

The system must not create a false organization fact merely to explain unresolved assessment scope.

## 26.6 Context awareness

Snapshots must preserve context identity.

The same fact definition may appear multiple times in one assessment under different event or matter contexts.

## 26.7 Reuse

One AssessmentRegulatoryFactSnapshot may support multiple applicability determinations within the same assessment resolution history.

Fact snapshots must not be duplicated merely because several rules depend on the same fact state.

## 26.8 Append-only assessment history

Recalculation must not silently overwrite historical snapshots.

If a later recalculation uses a new fact version, new historical snapshot state is created as required.

---

# 27. Assessment Snapshot Historical Safety

Consider:

```text
August Assessment
→ Fact V2

Current fact later becomes V3
```

The August assessment must continue to preserve V2 meaning.

A later backdated correction must not silently rewrite the fact state the August assessment actually used.

Historical assessment truth and newly discovered regulatory reality are separate audit dimensions.

---

# 28. AssessmentRequirementApplicability

## 28.1 Responsibility

`AssessmentRequirementApplicability` provides stable identity for one applicability question within an assessment.

It answers:

> Which requirement, in which context, is this assessment resolving?

It does not itself represent mutable historical result state.

## 28.2 Stable identity

Conceptually:

```text
Assessment
+
ComplianceRequirement
+
ApplicabilityContext
```

## 28.3 Context is mandatory

The identity must include context.

This is insufficient:

```text
assessmentId
+
requirementId
```

because event-triggered and matter-triggered requirements may have multiple relevant contexts.

## 28.4 Conceptual uniqueness

The stable identity is conceptually unique by:

```text
assessmentId
+
requirementId
+
contextId
```

## 28.5 General requirements

Organization-wide requirements use the explicit ORGANIZATION context.

No nullable-context exception is required.

---

# 29. AssessmentRequirementApplicabilityRevision

## 29.1 Responsibility

An applicability revision represents one immutable historical resolution of an AssessmentRequirementApplicability identity.

Conceptually:

```text
Stable Determination
   ├── R1
   ├── R2
   └── R3
```

## 29.2 Append-only

Applicability recalculation creates a new revision.

It must not silently update:

```text
UNDETERMINED
→
APPLICABLE
```

on an existing historical revision.

## 29.3 Conceptual fields

The persistence contract requires concepts equivalent to:

```text
id
assessmentRequirementApplicabilityId
revision
status
applicabilityDefinitionId
rule version / rule snapshot metadata
reason / explanation
referenceTime
resolvedAt
resolverVersion
resolution authority metadata
createdAt
```

Exact physical fields remain for the Prisma proposal.

## 29.4 Status

Applicability status is exactly:

```text
APPLICABLE
NOT_APPLICABLE
UNDETERMINED
```

It must not contain:

```text
COMPLIANT
NON_COMPLIANT
MISSING
VERIFIED
REJECTED
```

Those belong to other domains.

---

# 30. Determination Fact Basis

Applicability revisions must retain explicit lineage to the fact snapshots used.

Conceptually:

```text
AssessmentRequirementApplicabilityRevision
        │
        └── DeterminationFactBasis
                    │
                    └── AssessmentRegulatoryFactSnapshot
```

This relationship may be many-to-many.

A revision may depend on multiple fact snapshots.

One fact snapshot may support multiple revisions.

The lineage must be relationally inspectable rather than hidden exclusively in opaque JSON.

---

# 31. CurrentApplicabilityResolutionAuthority

## 31.1 Responsibility

Current applicability-resolution authority identifies which immutable applicability revision currently governs a stable determination for an active assessment.

Conceptually:

```text
Determination
   ├── R1
   ├── R2
   └── R3
         ↑
CurrentApplicabilityResolutionAuthority
```

## 31.2 Explicit authority

Current resolution must not be inferred from:

```text
MAX(revision)
MAX(createdAt)
```

## 31.3 Cardinality

A stable AssessmentRequirementApplicability identity has zero or one current authoritative resolution.

## 31.4 Separate authority domain

Current applicability-resolution authority is separate from:

```text
CurrentAssessmentAuthority
CurrentRegulatoryFactAuthority
CurrentApplicabilityDefinitionAuthority
```

---

# 32. Applicability Recalculation Transaction

For an active assessment, a recalculation that establishes a new authoritative resolution must be transactionally coherent.

Conceptually:

```text
BEGIN

validate tenant integrity

validate framework integrity

resolve authoritative rule version

resolve authoritative fact state

create required assessment fact snapshots

create applicability revision

create determination fact-basis relations

validate three-valued result

move current applicability resolution authority

COMMIT
```

If the operation fails before completion, the previous authoritative resolution remains valid.

Partial authority transitions are not acceptable.

---

# 33. Assessment Lifecycle Integration

The existing locked lifecycle is:

```text
DRAFT
→
IN_PROGRESS
→
REVIEW
→
COMPLETED
```

Controlled applicability recalculation may occur during:

```text
DRAFT
IN_PROGRESS
REVIEW
```

subject to later authorization policy.

Once an assessment is:

```text
COMPLETED
```

its historical applicability state must not be silently rewritten by later current-fact or current-rule changes.

Future regulatory changes may require a new assessment, reassessment, or explicit review workflow.

They do not rewrite completed history.

---

# 34. Current Assessment Authority Separation

`CurrentAssessmentAuthority` remains the existing authority for determining which assessment is current for an Organization × Framework.

It does not determine:

- current fact version;
- current rule version;
- current applicability revision.

Changing CurrentAssessmentAuthority must not mutate historical applicability records.

---

# 35. Applicability Coverage

Applicability uncertainty must remain visible separately from compliance scoring.

The system must be capable of reporting concepts equivalent to:

```text
Applicable requirements
Not-applicable requirements
Undetermined requirements
Applicability resolution coverage
```

A high Compliance Score must not conceal unresolved applicability scope.

---

# 36. Evidence Engine Boundary

Only requirements with current authoritative applicability result:

```text
APPLICABLE
```

may later enter the locked evidence-driven compliance engine.

Requirements resolved as:

```text
NOT_APPLICABLE
```

are excluded from the applicable requirement set.

Requirements resolved as:

```text
UNDETERMINED
```

are excluded from scoring but remain visibly unresolved.

The locked evidence-status semantics remain unchanged.

Applicability does not create a new evidence status.

---

# 37. Compliance Score Boundary

This persistence architecture does not change the locked compliance-score formula.

Applicability changes only the requirement set supplied to the locked engine.

Conceptually:

```text
Active Requirements
        ↓
Applicability Resolution
        ↓
APPLICABLE Requirements
        ↓
Locked Evidence Engine
        ↓
Locked Compliance Score
```

The system must never improve compliance results merely because required applicability facts are missing.

---

# 38. Applicability Exceptions

The locked distinction remains:

```text
APPLICABILITY_EXCEPTION
```

means the legal exception may remove the requirement from scope.

```text
COMPLIANCE_CONTROL_EXCEPTION
```

means the requirement remains applicable but the permitted compliance method or evidence changes.

These must never be collapsed.

Where legal effect remains unclear:

```text
REGULATORY_REVIEW
```

is required before production authority.

---

# 39. POPIA Sensitive Cases

The persistence architecture must preserve the previously identified regulatory-review boundaries, including:

```text
PLM-004
OPN-002
SEC-005
DSP-003
PA-001
PA-002
ADM-001
ADM-002
TBF-001
```

The exact legal interpretation remains governed by approved catalogue and applicability-rule versions.

Persistence must not silently resolve legal ambiguity.

---

# 40. ADM-002 Circularity Guard

The conceptual fact:

```text
automation.permitted_subject_to_safeguards
```

must not enter production applicability persistence without regulatory review.

The architecture must avoid using compliance with section 71 safeguards as though it were merely an independent scope fact if doing so would create circular reasoning.

Applicability facts describe regulatory reality.

Compliance evidence proves satisfaction of applicable obligations.

These domains must remain separate.

---

# 41. Prior Authorisation Guard

Prior-authorisation applicability facts must remain separate from proof that the organization actually obtained required authorization.

For example:

```text
processing_may_fall_within_section_57
```

and:

```text
prior_authorisation_required
```

may influence applicability.

Evidence that authorization was actually obtained belongs downstream in compliance evidence.

Absence of authorization evidence must not be interpreted as:

```text
prior_authorisation_required = FALSE
```

---

# 42. Security Event Context

SEC-005 requires event-sensitive persistence.

Multiple security events may exist.

Therefore:

```text
Assessment
+
SEC-005
+
Event Context A
```

is different from:

```text
Assessment
+
SEC-005
+
Event Context B
```

A permanent organization-wide breach Boolean is insufficient.

---

# 43. Data Subject Matter Context

DSP-003 may require matter-level persistence.

Multiple relevant matters may exist.

Therefore:

```text
Assessment
+
DSP-003
+
Matter Context A
```

is different from:

```text
Assessment
+
DSP-003
+
Matter Context B
```

A permanent organization-wide request/dispute Boolean is insufficient.

---

# 44. Tenant Integrity

Tenant integrity is mandatory.

For a single applicability resolution chain:

```text
Assessment.organizationId
=
ApplicabilityContext.organizationId
=
RegulatoryFact.organizationId
=
Assessment snapshot organization through Assessment
```

Cross-tenant fact use is invalid.

A client-supplied organization ID must never independently establish tenant authority.

Future external boundaries must use active organization membership or another separately approved tenant-authority mechanism.
---

# 45. Framework Integrity

Framework integrity is mandatory across the complete applicability chain.

For any persisted determination:

```text
Assessment.frameworkId
=
ComplianceRequirement.frameworkId
=
ApplicabilityContext.frameworkId
=
RegulatoryFactDefinition.frameworkId
=
ApplicabilityDefinition requirement framework
```

A fact definition belonging to one framework must not satisfy a rule belonging to another framework unless a future explicitly approved cross-framework abstraction is introduced.

No such abstraction is approved in V1.

---

# 46. Requirement Integrity

An ApplicabilityDefinition belongs to exactly one ComplianceRequirement.

An AssessmentRequirementApplicability must resolve the same requirement represented by the selected ApplicabilityDefinition.

Conceptually:

```text
AssessmentRequirementApplicability.requirementId
=
ApplicabilityDefinition.requirementId
```

A resolver must reject mismatched rule and requirement identities.

Requirement codes are catalogue identifiers.

They must not replace relational identity inside historical persistence.

---

# 47. Context Integrity

Every context used by:

```text
RegulatoryFact
AssessmentRequirementApplicability
AssessmentRegulatoryFactSnapshot
```

must belong to the same Organization × Framework domain as the assessment or regulatory fact using it.

Context identity must not be accepted merely because a supplied context ID exists.

Ownership must be validated.

---

# 48. Fact Definition Integrity

A RegulatoryFact must use a RegulatoryFactDefinition belonging to the same framework as its ApplicabilityContext.

A rule dependency must use a RegulatoryFactDefinition belonging to the same framework as the rule's ComplianceRequirement.

An AssessmentRegulatoryFactSnapshot must preserve which fact definition meaning it captured.

Cross-framework substitution is invalid.

---

# 49. Rule Version Historical Integrity

ApplicabilityDefinition versions are historical regulatory meaning.

Once a rule version has been used by an applicability revision, its substantive rule meaning must not be destructively modified.

A later interpretation requires a new version.

Historical applicability revisions must retain enough information to answer:

- Which rule version was used?
- Which rule schema version interpreted it?
- Which resolver version evaluated it?
- Which regulatory provenance supported it?
- Which fact snapshots formed its basis?

---

# 50. Resolver Version

Applicability resolution is not determined only by persisted rule data.

Application resolver semantics also matter.

Each historical applicability revision must therefore preserve a resolver-version concept.

Conceptually:

```text
resolverVersion = "applicability-resolver-v1"
```

If three-valued evaluation semantics or supported rule operators materially change, historical resolutions must remain attributable to the resolver semantics that produced them.

A new resolver version must not silently reinterpret completed historical revisions.

---

# 51. Authority Transition Audit

All current-authority domains must support auditable transitions.

These include:

```text
CurrentAssessmentAuthority
CurrentRegulatoryFactAuthority
CurrentApplicabilityDefinitionAuthority
CurrentApplicabilityResolutionAuthority
```

An authority transition must be capable of preserving concepts equivalent to:

```text
previousAuthorityTarget
newAuthorityTarget
changedAt
changedBy
reason
```

Exact implementation may use dedicated authority history, append-only transition records, or another separately approved relational design.

Silent pointer changes without sufficient auditability are not acceptable for regulatory authority.

---

# 52. CurrentRegulatoryFactAuthority Integrity

A CurrentRegulatoryFactAuthority may point only to a RegulatoryFactValue belonging to the same RegulatoryFact represented by the authority record.

Conceptually:

```text
CurrentAuthority.regulatoryFactId
=
SelectedValue.regulatoryFactId
```

The system must reject cross-fact authority pointers.

The selected fact version may be:

```text
KNOWN
UNKNOWN
DECLARED
REVIEWED
VERIFIED
DISPUTED
```

subject to future authorization policy.

Current selection does not itself alter those states.

---

# 53. CurrentApplicabilityDefinitionAuthority Integrity

A CurrentApplicabilityDefinitionAuthority may point only to an ApplicabilityDefinition belonging to the same ComplianceRequirement represented by the authority record.

Conceptually:

```text
CurrentRuleAuthority.requirementId
=
SelectedDefinition.requirementId
```

The system must reject cross-requirement rule authority.

Current selection does not mutate the selected rule version.

---

# 54. CurrentApplicabilityResolutionAuthority Integrity

A CurrentApplicabilityResolutionAuthority may point only to a revision belonging to the same stable AssessmentRequirementApplicability identity represented by the authority record.

Conceptually:

```text
CurrentResolutionAuthority.assessmentRequirementApplicabilityId
=
SelectedRevision.assessmentRequirementApplicabilityId
```

The system must reject cross-determination resolution authority.

Current selection does not mutate the selected revision.

---

# 55. Stable Identity Versus Version Identity

The persistence model intentionally separates stable identity from changing historical versions.

Examples:

```text
RegulatoryFact
→ stable identity

RegulatoryFactValue
→ historical version
```

and:

```text
AssessmentRequirementApplicability
→ stable determination identity

AssessmentRequirementApplicabilityRevision
→ historical resolution version
```

This prevents mutable business concepts from being confused with immutable audit records.

---

# 56. Version Number Semantics

Version numbers are local to their parent identity.

Conceptually:

```text
RegulatoryFactValue:
unique(RegulatoryFact, version)

ApplicabilityDefinition:
unique(ComplianceRequirement, version)

AssessmentRequirementApplicabilityRevision:
unique(AssessmentRequirementApplicability, revision)
```

Version numbers provide deterministic ordering and human inspection.

They do not establish current authority.

Therefore:

```text
HIGHEST VERSION ≠ CURRENT
```

---

# 57. Delete Semantics

Delete behavior is safety-critical.

The future Prisma proposal must define explicit `onDelete` behavior for every new relation.

Default or accidental cascade behavior is not acceptable.

The design principle is:

```text
PRESERVE HISTORICAL REGULATORY MEANING
```

Records historically relied upon should generally be retired, archived, closed, or preserved rather than physically erased.

---

# 58. Framework and Requirement Deletion

The current schema contains catalogue relationships whose existing cascade behavior predates applicability persistence.

Once applicability history references Framework or ComplianceRequirement meaning, destructive deletion becomes materially more dangerous.

The Prisma proposal must explicitly stress-test:

```text
Framework deletion
ComplianceRequirement deletion
ApplicabilityDefinition history
RegulatoryFactDefinition history
Assessment snapshot history
Applicability determination history
```

No migration may introduce applicability persistence while assuming existing cascade behavior is automatically safe.

---

# 59. Fact Definition Deletion

A RegulatoryFactDefinition that has:

- RegulatoryFact identities;
- historical RegulatoryFactValue records;
- rule dependencies;
- assessment snapshots;
- historical applicability lineage;

must not be physically deleted through ordinary catalogue administration.

Retirement is preferred.

Historical records must remain interpretable.

---

# 60. Applicability Definition Deletion

An ApplicabilityDefinition used by an AssessmentRequirementApplicabilityRevision is historical regulatory meaning.

It must not be physically deleted through ordinary rule administration.

Superseded rules remain historical records.

A newer current rule does not invalidate the existence of the earlier rule version.
---

# 61. Regulatory Fact Deletion

A stable RegulatoryFact may accumulate:

- multiple immutable RegulatoryFactValue versions;
- current-authority history;
- assessment snapshot lineage;
- applicability-determination dependencies.

Ordinary business operations must not physically delete such history.

Where a regulatory fact is no longer operationally relevant, future lifecycle semantics may retire the stable fact identity while preserving its historical versions.

---

# 62. Regulatory Fact Value Deletion

RegulatoryFactValue is historical assertion state.

Once a fact value has:

- been current;
- been reviewed or verified;
- been referenced by an assessment snapshot;
- participated in an applicability determination;
- been superseded or corrected by another version;

it must not be physically deleted through ordinary regulatory-fact administration.

Incorrect historical assertions should be corrected through explicit version lineage rather than erased.

---

# 63. Applicability Context Deletion

ApplicabilityContext may represent real-world historical entities such as:

```text
security incident
data-subject matter
processing activity
operator relationship
international transfer
automated decision system
```

Once historically referenced, a context must not be physically erased through ordinary operations.

Contexts may later support lifecycle states equivalent to:

```text
OPEN
CLOSED
ARCHIVED
RETIRED
```

where appropriate.

Lifecycle state does not erase historical identity.

---

# 64. Assessment Snapshot Deletion

AssessmentRegulatoryFactSnapshot forms part of the historical explanation of an assessment.

Once used by an applicability revision, it must be preserved with the assessment history.

Deletion of current organization facts or movement of current fact authority must not delete assessment snapshots.

---

# 65. Applicability Determination Deletion

AssessmentRequirementApplicability and its revisions form part of assessment regulatory history.

Completed assessment applicability history must be preservation-first.

An obsolete active-assessment revision may cease to be current without being physically erased.

Current authority changes replace authority, not history.

---

# 66. Organization Deletion Boundary

Organization deletion presents a deliberate tension between:

```text
privacy and data-erasure obligations
```

and:

```text
regulatory audit and retention obligations
```

This specification does not approve a simplistic cascade-delete policy for the applicability domain.

The Prisma proposal must explicitly identify which organization-owned records:

- may be deleted;
- must be retained;
- may require anonymization;
- may require pseudonymization;
- may require legal-retention controls;
- may require a separately governed destruction process.

Until that policy is approved, organization deletion semantics for the new applicability domain remain deliberately unresolved.

This unresolved boundary must block accidental cascade design.

---

# 67. Historical Preservation Principle

Historical preservation does not mean all data must be retained forever.

It means retention or destruction must occur through explicit policy rather than accidental relational behavior.

The architecture must support both:

```text
AUDITABILITY
```

and:

```text
LAWFUL DATA LIFECYCLE MANAGEMENT
```

without pretending they are the same problem.

---

# 68. Authorization Domains

Future authorization must distinguish at least the following conceptual capabilities:

```text
READ_REGULATORY_FACT

SUBMIT_REGULATORY_FACT

REVIEW_REGULATORY_FACT

VERIFY_REGULATORY_FACT

DISPUTE_REGULATORY_FACT

ESTABLISH_CURRENT_FACT_AUTHORITY

APPROVE_APPLICABILITY_DEFINITION

ESTABLISH_CURRENT_RULE_AUTHORITY

RESOLVE_APPLICABILITY

ESTABLISH_CURRENT_RESOLUTION_AUTHORITY
```

These capabilities need not map one-to-one to existing organization roles.

The exact permission matrix is deferred.

---

# 69. Four-Eyes Capability

The persistence model must not prevent future four-eyes controls.

For high-impact operations, ComplianceOS may later require:

```text
submitter ≠ reviewer
```

or:

```text
proposer ≠ authority establisher
```

The schema must retain enough actor and transition information to support such policy.

This specification does not mandate four-eyes approval for every operation.

It preserves the capability.

---

# 70. Human Authority

Where regulatory judgment is required, the persistence model must support accountable human authority.

Human authority must be attributable.

Conceptually, the system should be capable of answering:

```text
Who established this fact?
Who reviewed it?
Who verified it?
Who disputed it?
Who made this rule current?
Who made this resolution current?
When?
Why?
```

Shared or anonymous regulatory authority is insufficient for high-integrity audit history.

---

# 71. Typed Fact Value Integrity

The future physical schema must prevent logically contradictory value storage.

For example, a BOOLEAN fact version must not simultaneously persist:

```text
booleanValue = true
stringValue = "true"
numberValue = 1
```

as competing substantive representations.

The Prisma proposal must define application and database integrity rules ensuring that a KNOWN fact version contains exactly the permitted value representation for its value type.

UNKNOWN fact versions contain no authoritative substantive value.

---

# 72. Enum and Multi-Value Facts

ENUM fact definitions must define or reference an approved controlled value domain.

A persisted ENUM value must belong to that domain.

MULTI_VALUE facts require deterministic semantics for:

- ordering where relevant;
- duplicate handling;
- permitted member values;
- equality;
- historical snapshotting.

Arbitrary unvalidated string arrays are insufficient where legal interpretation depends on controlled categories.

---

# 73. Derived Regulatory Facts

Some regulatory facts may be deterministically derived from other authoritative information.

Derived facts must preserve:

```text
derivation source
derivation version
input lineage
establishment time
authority state
```

A derived fact is still a regulatory fact assertion.

It does not become authoritative merely because software calculated it.

If authoritative inputs later change, historical derived fact versions remain historical.

---

# 74. Document-Derived Regulatory Facts

Documents may support regulatory facts.

For example, a document-processing pipeline may extract a candidate fact.

The architecture must preserve:

```text
Document identity
extraction provenance
candidate value
human or approved authority path
```

Document verification and regulatory-fact authority are separate.

Therefore:

```text
VERIFIED DOCUMENT
≠
AUTOMATICALLY VERIFIED REGULATORY FACT
```

unless a future explicitly approved deterministic policy establishes that relationship for a specific fact type.

---

# 75. Concurrency and Authority Safety

Concurrent writes must not create multiple current authorities for a domain that permits only one.

The physical persistence design must protect:

```text
one current fact authority per RegulatoryFact

one current rule authority per ComplianceRequirement

one current resolution authority per AssessmentRequirementApplicability

one current assessment authority per Organization × Framework
```

Authority transitions must be transactional.

The system must protect against lost updates where two actors attempt to establish different current versions concurrently.

The exact locking or optimistic-concurrency mechanism is deferred to implementation design.
---

# 76. Transaction Integrity

Operations that establish regulatory authority must preserve atomic domain truth.

A transaction must not leave the system in an intermediate state where:

- a new version exists but authority unintentionally points elsewhere;
- authority points to a version whose required lineage was not persisted;
- an applicability revision exists without its required fact basis;
- a current resolution points to an incomplete revision;
- tenant or framework validation occurred only after persistence;
- completed assessment history was partially modified.

Authority-changing operations must validate integrity before commit.

---

# 77. Idempotency

Future mutation services should support deterministic retry behavior where operations may be retried because of network, transaction, or infrastructure failure.

A retry must not accidentally create multiple logically identical:

```text
fact versions
rule versions
applicability revisions
authority transitions
```

where the original operation already succeeded.

Exact idempotency-key design is deferred to service architecture.

Persistence must not make safe idempotency impossible.

---

# 78. Lifecycle and Retirement

Reference and stable operational records may require lifecycle concepts.

Potential lifecycle semantics include:

```text
DRAFT
ACTIVE
RETIRED
```

for definitions where appropriate, and:

```text
OPEN
CLOSED
ARCHIVED
RETIRED
```

for contexts where appropriate.

Exact enums are not approved here.

The principle is:

```text
RETIREMENT ≠ DELETION
```

Historical meaning must survive retirement.

---

# 79. Rule Approval and Current Authority

Rule lifecycle and rule authority are distinct.

A future rule workflow may conceptually resemble:

```text
DRAFT
→ REVIEWED
→ APPROVED
```

but becoming approved does not automatically make the rule current.

Current rule authority requires a separate explicit transition.

Therefore:

```text
APPROVED ≠ CURRENT
```

This separation permits controlled future-effective rules and safe rollback of authority without deleting versions.

---

# 80. Fact Review and Current Authority

Fact review state and current authority are also distinct.

A fact may be:

```text
DECLARED + CURRENT
REVIEWED + CURRENT
VERIFIED + CURRENT
DISPUTED + CURRENT
```

subject to future authorization and regulatory policy.

The persistence layer must not assume:

```text
CURRENT = VERIFIED
```

or:

```text
VERIFIED = CURRENT
```

---

# 81. Future-Effective Rule Versions

The persistence architecture must permit a rule version to exist before it becomes authoritative.

For example:

```text
Rule V2 created
Rule V2 approved
Rule V2 effectiveFrom = future date
Rule V1 remains current
```

A scheduler or authorized human process may later move current authority when appropriate.

The mere existence of a future-effective version must not change present applicability.

---

# 82. Historical Rule Corrections

If an ApplicabilityDefinition is discovered to contain an error, the incorrect historical version must not be silently edited after historical use.

A corrected rule requires a new version or another explicitly approved correction mechanism preserving historical lineage.

Whether prior assessments require reassessment is a separate governance decision.

Historical records must continue to show what rule actually governed their original resolution.

---

# 83. Database Constraints

The Prisma proposal must identify which invariants can and should be enforced by the database.

Candidate database-enforceable constraints include:

```text
unique stable context identity

unique RegulatoryFact identity

unique fact version per RegulatoryFact

unique applicability-definition version per requirement

unique stable assessment applicability identity

unique revision per stable assessment applicability identity

one authority row per authority domain identity

unique rule dependency relation
```

Application validation alone should not carry invariants that can safely and clearly be enforced relationally.

Cross-record tenant and framework integrity may require transactional application checks where ordinary foreign keys cannot express the complete invariant.

---

# 84. Indexing Requirements

The physical design must support efficient lookup of at least:

```text
current facts by Organization × Framework

facts by context

fact versions by RegulatoryFact

current fact authority

fact definitions by Framework × key

applicability definitions by requirement

current rule authority

rule dependencies by fact definition

assessment fact snapshots by Assessment

assessment applicability identities by Assessment

applicability revisions by stable determination

current applicability resolution authority

undetermined applicability by Assessment

applicable requirements by Assessment
```

Indexing must follow actual service query patterns during implementation.

Premature or redundant indexes should be avoided.

---

# 85. Migration Safety

The future applicability migration must be treated as a production data-foundation migration.

Before execution, the migration plan must prove:

- existing production data is preserved;
- existing locked assessment authority remains intact;
- existing evidence relations remain intact;
- existing compliance scores remain unchanged;
- no applicability default silently changes scoring;
- new non-null fields do not invalidate existing rows;
- catalogue deletion behavior is explicitly reviewed;
- migration history remains consistent;
- rollback or forward-recovery strategy is understood.

The migration must be reviewed before execution.

---

# 86. Shadow Database Safety

A production database must never be used as an accidental Prisma shadow database.

Neither:

```text
DATABASE_URL
```

nor:

```text
DIRECT_URL
```

may be treated as a shadow database merely because the connection succeeds.

Any future shadow database must be proven to be a separate disposable database before destructive migration tooling is permitted to use it.

---

# 87. No Silent Backfill

Introducing applicability persistence must not silently backfill:

```text
APPLICABLE
NOT_APPLICABLE
FALSE regulatory facts
TRUE regulatory facts
CURRENT authority
VERIFIED authority
```

for existing organizations or assessments unless an explicit approved migration rule proves that state.

Unknown regulatory state remains unknown.

Missing historical applicability data must not be rewritten as certainty.

---

# 88. Prohibited Persistence Shortcuts

The following designs are explicitly prohibited for V1:

```text
Organization.specialPersonalInformation = Boolean
Organization.childrenPersonalInformation = Boolean
Organization.directMarketing = Boolean
```

and similar organization-level POPIA Boolean explosion.

Also prohibited:

```text
ComplianceRequirement.applicable = Boolean
```

because applicability is organization-, assessment-, context-, fact-, and rule-dependent.

Also prohibited:

```text
Assessment.applicabilityJson = opaque unvalidated state
```

as the sole authoritative persistence mechanism.

Also prohibited:

```text
latest row wins
```

as an authority model.

Also prohibited:

```text
UNKNOWN → FALSE
```

as a convenience default.

Also prohibited:

```text
missing determination row → APPLICABLE
```

and:

```text
missing determination row → NOT_APPLICABLE
```

A missing determination is missing state, not regulatory truth.

---

# 89. Exact Conceptual Persistence Inventory

The V1 persistence architecture requires the following conceptual model inventory.

## 89.1 Existing models retained

```text
Organization
Framework
ComplianceRequirement
Assessment
CurrentAssessmentAuthority
Evidence
Document
OrganizationMember
```

Existing models remain governed by their locked milestones except where a future approved schema proposal adds required relations.

## 89.2 New reference and definition concepts

```text
RegulatoryFactDefinition
ApplicabilityDefinition
ApplicabilityRuleFactDependency
```

## 89.3 New context and fact concepts

```text
ApplicabilityContext
RegulatoryFact
RegulatoryFactValue
CurrentRegulatoryFactAuthority
```

## 89.4 New assessment historical concepts

```text
AssessmentRegulatoryFactSnapshot
AssessmentRequirementApplicability
AssessmentRequirementApplicabilityRevision
DeterminationFactBasis
CurrentApplicabilityResolutionAuthority
```

## 89.5 New rule-authority concept

```text
CurrentApplicabilityDefinitionAuthority
```

## 89.6 Authority audit requirement

Authority transitions require an auditable persistence strategy.

The exact physical representation may introduce dedicated authority-transition models during the Prisma proposal if required.

## 89.7 Conceptual model count

The core new conceptual persistence inventory therefore contains:

```text
12 named domain models

plus any separately approved authority-transition audit model or models
```

The Prisma proposal must not silently collapse these concepts merely to reduce table count.

It may refine physical representation only where all locked invariants remain demonstrably preserved.

---

# 90. Implementation Gate and Final Principle

## 90.1 Next milestone

After this specification is locked, the next authorized design milestone is:

```text
8A.3.4B — Prisma Schema Proposal
```

That milestone must define exact:

```text
model names
enum names
field names
scalar types
nullability
relations
relation names
unique constraints
indexes
onDelete behavior
onUpdate behavior
typed-value representation
provenance representation
authority representation
authority-transition audit
rule AST representation
rule dependency representation
snapshot representation
revision representation
fact-basis representation
tenant-integrity enforcement
framework-integrity enforcement
completed-assessment protection
```

## 90.2 Required schema stress test

No migration may follow merely because the Prisma schema compiles.

The proposed schema must first pass a dedicated stress test covering:

```text
tenant isolation
framework isolation
historical reproducibility
UNKNOWN preservation
three-valued applicability
current-authority uniqueness
authority-transition auditability
context multiplicity
event multiplicity
matter multiplicity
rule versioning
fact versioning
temporal semantics
corrections
future-effective state
typed-value integrity
delete semantics
organization deletion boundary
completed-assessment immutability
evidence-engine isolation
score-denominator safety
AI authority boundary
```

## 90.3 No implementation authorization

This document does not itself authorize:

```text
Prisma edits
migrations
database writes
fact services
applicability services
API routes
catalogue provisioning
production scoring integration
Trust Score integration
Executive AI integration
```

Those remain gated by later milestones.

## 90.4 Final persistence principle

The applicability persistence system must preserve enough authoritative, contextual, temporal, and historical information to answer:

```text
What requirement was being evaluated?

Which regulatory rule governed it?

Which version of that rule governed it?

Which organization and framework were involved?

Which real-world context was involved?

What regulatory facts were known?

Which fact versions were authoritative?

What was unknown?

What fact state was captured by the assessment?

Which facts formed the basis of the determination?

Which resolver semantics evaluated the rule?

What applicability result was produced?

Which revision was current?

Who established the relevant authorities?

When did those authorities change?

Can the historical result still be reproduced and explained?
```

If ComplianceOS cannot answer those questions, the persistence model is not sufficiently trustworthy for regulatory applicability.

The final governing principle is:

```text
THE SYSTEM MUST NEVER CREATE REGULATORY CERTAINTY
BY ERASING CONTEXT, HISTORY, PROVENANCE, OR UNCERTAINTY.
```
