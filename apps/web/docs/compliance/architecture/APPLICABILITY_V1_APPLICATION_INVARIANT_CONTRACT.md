# Applicability V1 Application-Enforced Invariant Contract

## 1. Status

This document defines the mandatory semantic integrity contract for the
ComplianceOS Applicability V1 domain.

It complements the Prisma schema.

The Prisma schema establishes structural database integrity through:

- primary keys;
- foreign keys;
- uniqueness;
- nullability;
- enums;
- indexes;
- referential delete behavior.

This contract defines semantic rules that cannot be inferred merely from the
existence of structurally valid relational records.

These rules are mandatory application-layer invariants.

They are not optional service conventions.

---

## 2. Enforcement Boundary

Applicability V1 uses the following enforcement boundary.

### Database-enforced

PostgreSQL and Prisma are responsible for:

- referential integrity;
- uniqueness;
- enum validity;
- required versus nullable fields;
- physical value representation;
- indexed lookup paths;
- configured delete restrictions;
- configured SetNull relationships.

### Application-enforced

ComplianceOS domain services are responsible for:

- cross-record ownership consistency;
- authority-pointer correctness;
- context compatibility;
- framework compatibility;
- typed-value correctness;
- knowledge-state semantics;
- controlled vocabulary validation;
- transition integrity;
- derivation integrity;
- provenance semantics;
- authorization;
- transaction-level atomicity.

Application-enforced invariants MUST be validated before authoritative state
is committed.

---

## 3. Authority Pointer Integrity

### 3.1 Current Regulatory Fact Authority

For every CurrentRegulatoryFactAuthority record:

CurrentRegulatoryFactAuthority.regulatoryFactValue.regulatoryFactId
must equal
CurrentRegulatoryFactAuthority.regulatoryFactId

A regulatory fact value belonging to another RegulatoryFact MUST NOT become
the current authority.

Authority MUST NOT be inferred from:

- highest version;
- latest createdAt;
- latest updatedAt;
- latest validFrom;
- most recently reviewed value.

The CurrentRegulatoryFactAuthority record is the authoritative pointer.

---

### 3.2 Current Applicability Definition Authority

For every CurrentApplicabilityDefinitionAuthority record:

CurrentApplicabilityDefinitionAuthority.applicabilityDefinition.requirementId
must equal
CurrentApplicabilityDefinitionAuthority.requirementId

An ApplicabilityDefinition belonging to another ComplianceRequirement MUST
NOT become authoritative for the requirement.

Authority MUST NOT be inferred from the highest definition version or latest
timestamp.

---

### 3.3 Current Applicability Resolution Authority

For every CurrentApplicabilityResolutionAuthority record:

CurrentApplicabilityResolutionAuthority.revision.applicabilityId
must equal
CurrentApplicabilityResolutionAuthority.applicabilityId

A revision belonging to another applicability record MUST NOT become the
current authoritative resolution.

Authority MUST NOT be inferred from the highest revision number or latest
timestamp.

---

## 4. Regulatory Fact Ownership and Context Integrity

For every RegulatoryFact:

RegulatoryFact.context.organizationId
must equal
RegulatoryFact.organizationId

The selected ApplicabilityContext MUST belong to the same organization as the
RegulatoryFact.

Additionally:

RegulatoryFact.context.frameworkId
must equal
RegulatoryFact.factDefinition.frameworkId

The RegulatoryFactDefinition and ApplicabilityContext MUST belong to the same
framework domain.

The RegulatoryFact context type MUST also be permitted by:

RegulatoryFactDefinition.allowedContextTypes

A fact definition MUST NOT be applied to a context type outside its explicitly
allowed context types.

Scope MUST NOT be inferred from a regulatory fact key name.

---

## 5. Applicability Assessment Domain Integrity

For every AssessmentRequirementApplicability:

- the referenced requirement MUST belong to the assessment's framework domain;
- the referenced ApplicabilityContext MUST belong to the assessment's
  organization domain;
- the context MUST belong to the relevant framework domain;
- the assessment, requirement and context MUST form one coherent applicability
  evaluation domain.

Foreign-key validity alone does not establish this coherence.

---

## 6. Typed Regulatory Fact Value Integrity

RegulatoryFactValue and AssessmentRegulatoryFactSnapshot use typed value
columns.

The application MUST enforce typed-value exclusivity.

### BOOLEAN

When the effective RegulatoryFactDefinition.valueType is BOOLEAN, the
authoritative substantive value is booleanValue.

Other typed value fields MUST NOT be treated as authoritative substantive
values.

### STRING

For STRING, stringValue is authoritative.

### NUMBER

For NUMBER, numberValue is authoritative.

### DATE

For DATE, dateValue is authoritative.

### ENUM

For ENUM, enumValue is authoritative.

The value MUST match an active permitted RegulatoryFactDefinitionOption.

### MULTI_VALUE

For MULTI_VALUE, multiValue is authoritative.

Production MULTI_VALUE facts are treated as controlled-vocabulary values until
an explicit CONTROLLED versus FREE_FORM policy is introduced.

Each controlled member MUST match an active permitted
RegulatoryFactDefinitionOption.

---

## 7. Knowledge-State Integrity

RegulatoryFactKnowledgeState is semantically independent from physical field
cardinality.

### UNKNOWN

UNKNOWN means the system does not possess an authoritative substantive fact
value.

Physical defaults MUST NOT manufacture knowledge.

UNKNOWN plus an empty multiValue array means unknown.

An empty PostgreSQL array alone MUST NOT be interpreted as known.

### KNOWN

KNOWN means the system possesses an authoritative substantive value according
to the fact definition's value type.

For MULTI_VALUE, KNOWN plus an empty multiValue array is valid and means an
authoritative empty set.

Therefore UNKNOWN plus an empty array and KNOWN plus an empty array have
different meanings.

Knowledge MUST NOT be inferred solely from whether a typed column is null or an
array is empty.

---

## 8. Fact Authority-State Integrity

RegulatoryFactAuthorityState represents authority independently from evidence
or document verification.

The following implication is forbidden:

Document VERIFIED
does not imply
RegulatoryFactValue VERIFIED

The following implication is also forbidden:

Document exists
does not imply
regulatory fact is true

Document provenance and regulatory-fact authority are separate concepts.

Fact authority MUST be established through the regulatory-fact authority
workflow.

---

## 9. Provenance Integrity

RegulatoryFactValueSource preserves detailed lineage for RegulatoryFactValue.

A source record proves that a source relationship exists.

It does NOT itself prove:

- truth;
- verification;
- regulatory authority;
- applicability;
- current authority.

Where sourceType is DOCUMENT and documentId is present, the referenced Document
is provenance only.

The application's authority workflow remains responsible for determining
RegulatoryFactAuthorityState and current authority.

---

## 10. Derivation Integrity

For RegulatoryFactValue records whose source semantics represent
SYSTEM_DERIVATION:

- derivationKey MUST identify the derivation mechanism;
- derivationVersion MUST identify the derivation implementation/version;
- material fact inputs MUST be preserved through RegulatoryFactDerivationInput
  where applicable.

The derivedFactValueId identifies the derived output.

The inputFactValueId identifies a fact value actually used as an input.

Derivation lineage MUST NOT be reconstructed or inferred from timestamps.

Where ordering is semantically relevant, inputOrder MUST preserve it.

---

## 11. Regulatory Fact Authority Transition Integrity

For every RegulatoryFactAuthorityTransition:

When previousFactValueId is present:

previousFactValue.regulatoryFactId
must equal
regulatoryFactId

And:

newFactValue.regulatoryFactId
must equal
regulatoryFactId

A transition MUST NOT point across RegulatoryFact boundaries.

The transition and corresponding current-authority pointer update MUST be
performed atomically.

---

## 12. Applicability Definition Authority Transition Integrity

For every ApplicabilityDefinitionAuthorityTransition:

When previousApplicabilityDefinitionId is present:

previousApplicabilityDefinition.requirementId
must equal
requirementId

And:

newApplicabilityDefinition.requirementId
must equal
requirementId

Definitions from different ComplianceRequirement records MUST NOT be mixed
inside one authority transition.

---

## 13. Applicability Resolution Authority Transition Integrity

For every ApplicabilityResolutionAuthorityTransition:

When previousRevisionId is present:

previousRevision.applicabilityId
must equal
applicabilityId

And:

newRevision.applicabilityId
must equal
applicabilityId

Revisions from different AssessmentRequirementApplicability records MUST NOT be
mixed inside one authority transition.

---

## 14. Applicability Revision Integrity

Every AssessmentRequirementApplicabilityRevision MUST belong to the
AssessmentRequirementApplicability identified by applicabilityId.

Its applicability definition MUST be valid for the requirement represented by
that applicability record.

A revision is historical evidence of a determination.

Revision history MUST NOT be overwritten to simulate a new determination.

New determinations require new revisions.

---

## 15. Snapshot Integrity

AssessmentRegulatoryFactSnapshot represents the fact state used by an
assessment at a defined point in the applicability process.

When sourceRegulatoryFactId and sourceFactValueId are present:

sourceFactValue.regulatoryFactId
must equal
sourceRegulatoryFactId

The source RegulatoryFact MUST be compatible with the snapshot's fact
definition and context.

The snapshot MUST preserve the value semantics used by the assessment even if
the live RegulatoryFact later changes.

Assessment decisions MUST NOT silently mutate because current regulatory facts
change after snapshot creation.

---

## 16. Determination Fact Basis Integrity

Every DeterminationFactBasis links an applicability revision to a fact
snapshot actually used in that determination.

The referenced snapshot MUST belong to the same assessment domain as the
AssessmentRequirementApplicability being resolved.

Fact-basis records MUST represent actual decision inputs.

They MUST NOT be populated merely because related snapshots exist.

---

## 17. Authorization Integrity

User relation fields provide lineage and attribution.

They do NOT themselves grant authority.

The existence of establishedById, approvedById, resolvedById or reviewedById
does not prove the actor was authorized.

Authorization MUST derive from active organization membership and application
policy.

Authority-changing services MUST verify authorization before committing the
change.

---

## 18. Transaction Atomicity

Operations that change authoritative state MUST use a database transaction.

Where applicable, one transaction MUST include:

1. validation of the proposed domain transition;
2. creation of the new value, definition or revision;
3. creation of supporting provenance or derivation records;
4. creation of the typed authority-transition record;
5. update or creation of the current-authority pointer.

The system MUST NOT intentionally persist an authority transition while leaving
the corresponding current-authority pointer inconsistent.

Likewise, the current-authority pointer MUST NOT be changed without preserving
the corresponding transition history where the operation represents an
authority transition.

---

## 19. Concurrency Integrity

Authority-changing services MUST account for concurrent writes.

The service MUST prevent two concurrent operations from both assuming they
successfully established incompatible current authority.

Database uniqueness constraints are necessary but are not sufficient to express
all semantic ownership invariants.

Transaction strategy MUST therefore include appropriate conflict handling.

---

## 20. Historical Integrity

Historical values, definitions, revisions, snapshots, provenance records,
derivation inputs and authority transitions are evidence-bearing records.

They MUST NOT be silently rewritten to represent a different historical state.

Corrections and supersession MUST use the domain's explicit versioning,
correction, revision or transition mechanisms.

---

## 21. Application Service Requirement

No direct application write path may bypass these invariants.

Writes affecting applicability authority or regulatory-fact authority MUST flow
through domain services responsible for enforcing this contract.

Repository or ORM access alone MUST NOT be treated as sufficient authorization
to mutate authoritative state.

---

## 22. V1 Enforcement Decision

For Applicability V1, semantic cross-record invariants are enforced in the
ComplianceOS application/domain service layer rather than through PostgreSQL
triggers.

PostgreSQL remains responsible for structural integrity.

This decision may be revisited if production evidence demonstrates that a
specific invariant requires additional database-level protection.

Any such change requires an explicit architecture decision.

---

## 23. Migration Boundary

This contract MUST be reviewed before the Applicability V1 migration is created
or applied.

Migration creation does not waive application-layer invariants.

Successful Prisma validation, Prisma Client generation or SQL migration
generation proves structural validity only.

It does not prove semantic applicability correctness.

---

## 24. V1 Gate

Applicability V1 may proceed to migration artifact design only when:

- the Prisma candidate remains structurally valid;
- the generated SQL remains additive and reviewed;
- this semantic invariant contract is accepted;
- no unresolved authority-domain ambiguity remains;
- no database migration has been applied prematurely.

This contract becomes the implementation specification for the services that
write authoritative applicability and regulatory-fact state.
