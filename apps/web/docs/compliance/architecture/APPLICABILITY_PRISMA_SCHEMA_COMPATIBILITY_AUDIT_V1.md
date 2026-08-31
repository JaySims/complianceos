# Applicability Prisma Schema Compatibility Audit V1

**Milestone:** 8A.3.4B.1 — Prisma Schema Compatibility Audit
**Status:** DESIGN AUDIT — NOT IMPLEMENTED
**Baseline:** 405329aec1ba3769cfc07e5b2ab8d8c05e485ee0
**Schema:** apps/web/prisma/schema.prisma
**Prisma:** 6.19.3
**Parent:** APPLICABILITY_PERSISTENCE_MODEL_SPECIFICATION_V1.md

---

# 1. Purpose

This document audits the existing ComplianceOS Prisma schema against the locked applicability persistence model before any Prisma schema proposal or database modification is authorized.

The audit determines:

- where new applicability models attach to existing models;
- which existing relations require inverse relations;
- which existing delete semantics require protection;
- which invariants Prisma/PostgreSQL can enforce structurally;
- which invariants require transactional application validation;
- which existing models remain unchanged;
- which conceptual persistence models require new physical models;
- which unresolved decisions must be settled by the Prisma schema proposal.

This document does not modify or authorize modification of `schema.prisma`.

---

# 2. Existing Schema Baseline

The current Prisma schema contains:

```text
User
Organization
Framework
ComplianceRequirement
Assessment
CurrentAssessmentAuthority
Evidence
Recommendation
Document
AuditLog
OrganizationMember
WorkflowProgress
ExecutiveMission
```

Existing enums are:

```text
UserRole
AssessmentStatus
OrganizationMemberRole
ExecutiveMissionStatus
DocumentVerificationStatus
EvidenceVerificationStatus
ComplianceRequirementCategory
```

No applicability-specific model or enum currently exists.

---

# 3. Existing Tenant Boundary

`Organization` remains the primary tenant boundary.

Current organization-owned domains include:

```text
Assessment
CurrentAssessmentAuthority
Document
OrganizationMember
WorkflowProgress
ExecutiveMission
User primary organization relation
```

Applicability persistence must attach to Organization without introducing an independent competing tenant identity.

New organization-owned concepts include:

```text
ApplicabilityContext
RegulatoryFact
```

Historical assessment-owned records inherit tenant context through Assessment but must still be validated against organization-owned contexts and facts.

---

# 4. Existing Framework Boundary

`Framework` currently owns:

```text
Assessment
CurrentAssessmentAuthority
ComplianceRequirement
```

The applicability architecture adds framework-owned regulatory meaning through:

```text
RegulatoryFactDefinition
```

ApplicabilityDefinition remains requirement-owned, while ComplianceRequirement already belongs to Framework.

Framework identity therefore remains the catalogue and regulatory-domain boundary.

---

# 5. ComplianceRequirement Compatibility

Current relevant fields are:

```text
id
code
title
description
category
authority
sourceTitle
sourceReference
sourceUrl
effectiveFrom
mandatory
weight
active
frameworkId
createdAt
updatedAt
```

No applicability state exists on ComplianceRequirement.

This is correct.

The proposal must NOT add a global field equivalent to:

```text
applicable Boolean
```

ComplianceRequirement requires future inverse relations for:

```text
ApplicabilityDefinition
AssessmentRequirementApplicability
```

and potentially current applicability-definition authority depending on final physical relation design.

---

# 6. Assessment Compatibility

Current Assessment identity includes:

```text
organizationId
frameworkId
```

This makes Assessment the correct historical evaluation boundary.

Assessment requires future inverse relations for:

```text
AssessmentRegulatoryFactSnapshot
AssessmentRequirementApplicability
```

Applicability state must not be stored as one opaque authoritative JSON field on Assessment.

The existing Assessment lifecycle remains:

```text
DRAFT
IN_PROGRESS
REVIEW
COMPLETED
```

Completed-assessment applicability history must be protected by service-level lifecycle rules and preservation-first relations.

---

# 7. CurrentAssessmentAuthority Compatibility

CurrentAssessmentAuthority already establishes explicit authority for:

```text
Organization × Framework → Assessment
```

Its existing uniqueness is:

```text
@@unique([organizationId, frameworkId])
```

and:

```text
assessmentId @unique
```

This authority domain remains separate from:

```text
CurrentRegulatoryFactAuthority
CurrentApplicabilityDefinitionAuthority
CurrentApplicabilityResolutionAuthority
```

No applicability model may overload CurrentAssessmentAuthority.

---

# 8. Evidence Compatibility

Evidence remains downstream of applicability.

Current Evidence links:

```text
Assessment
Document?
ComplianceRequirement?
```

Applicability persistence must not add:

```text
NOT_APPLICABLE
UNDETERMINED
```

to EvidenceVerificationStatus.

The locked evidence engine continues to receive only the requirement set resolved as APPLICABLE.

Evidence persistence itself is outside the 8A.3.4B schema-design scope except for compatibility verification.

---

# 9. Document Compatibility

Document remains organization-owned and may later provide provenance for regulatory facts.

A verified Document must not automatically imply a verified RegulatoryFact.

If document-derived fact provenance is physically modeled in V1, the schema proposal must preserve:

```text
document identity
fact assertion identity
extraction/derivation provenance
authority separation
```

The existing Document model must not be converted into a regulatory-fact store.

---

# 10. User and OrganizationMember Compatibility

`OrganizationMember` remains the active tenant-membership authority used by application boundaries.

Future applicability authorization may distinguish capabilities beyond existing role names.

The Prisma persistence proposal should preserve actor lineage where required but must not encode the complete authorization policy into regulatory persistence enums.

Actor references may use User relations where appropriate.

Authorization remains a service/application responsibility.

---

# 11. New Conceptual Model Inventory

The locked persistence specification distinguishes a 12-model core inventory from the separately enumerated current rule-authority concept.

## 11.1 Twelve-model core

The 12-model core is:

```text
RegulatoryFactDefinition
ApplicabilityDefinition
ApplicabilityRuleFactDependency
ApplicabilityContext
RegulatoryFact
RegulatoryFactValue
CurrentRegulatoryFactAuthority
AssessmentRegulatoryFactSnapshot
AssessmentRequirementApplicability
AssessmentRequirementApplicabilityRevision
DeterminationFactBasis
CurrentApplicabilityResolutionAuthority
```

## 11.2 Separate current rule-authority concept

The locked architecture separately requires:

```text
CurrentApplicabilityDefinitionAuthority
```

Therefore the applicability persistence architecture currently contains:

```text
12 core named models
+
1 separately enumerated current rule-authority model
=
13 named persistence concepts
```

before any authority-transition audit model or models are introduced.

This distinction preserves the terminology of the locked parent specification while preventing the Prisma proposal from incorrectly treating 12 as the total physical persistence-model count.

## 11.3 Physical representation rule

The Prisma proposal must account for all 13 named persistence concepts.

It must not silently omit:

```text
CurrentApplicabilityDefinitionAuthority
```

merely because that concept is enumerated separately from the parent's 12-model core inventory.

The proposal may refine physical representation only where every locked invariant remains demonstrably preserved.

No table-count optimization may collapse an explicit authority domain into:

```text
latest version wins
```

or another inferred-authority mechanism.
# 12. Authority Transition Audit

The locked specification requires auditable transitions for:

```text
CurrentAssessmentAuthority
CurrentRegulatoryFactAuthority
CurrentApplicabilityDefinitionAuthority
CurrentApplicabilityResolutionAuthority
```

The existing CurrentAssessmentAuthority contains:

```text
createdAt
updatedAt
```

but no explicit transition-history model.

The Prisma proposal must decide whether V1 introduces:

```text
AuthorityTransition
```

as a generalized append-only audit model,

or dedicated transition models.

A generic existing `AuditLog` is insufficient by itself unless it can preserve typed authority-domain lineage and transition integrity required by the locked architecture.

This decision must be explicit in the proposal.

---

# 13. Delete-Semantics Audit

The existing schema contains several delete behaviors relevant to future applicability history.

## 13.1 ComplianceRequirement

Current relation:

```text
framework Framework @relation(... onDelete: Cascade)
```

Deleting a Framework can therefore delete its ComplianceRequirement rows.

Once applicability definitions and historical applicability records reference requirements, this behavior becomes safety-critical.

The new proposal must not blindly cascade historical applicability records with requirement deletion.

## 13.2 CurrentAssessmentAuthority

Current Organization and Framework relations use:

```text
onDelete: Cascade
```

Assessment uses:

```text
onDelete: Restrict
```

These existing semantics remain locked unless separately changed.

New historical applicability models must not automatically copy these cascade choices.

## 13.3 Evidence

Assessment deletion cascades Evidence.

Requirement deletion sets Evidence.requirementId to null.

These semantics belong to the existing evidence domain and must not be silently changed by applicability persistence design.

## 13.4 Organization-owned operational records

Several existing operational models cascade when Organization is deleted.

The locked applicability architecture explicitly leaves organization-deletion semantics unresolved because privacy, retention, and regulatory audit obligations may conflict.

Therefore new applicability models must not default to Organization cascade deletion without an explicit policy decision.

---

# 14. Database-Enforceable Invariants

Prisma/PostgreSQL can structurally enforce candidate invariants including:

```text
unique context identity
unique RegulatoryFact identity
unique fact version per RegulatoryFact
unique ApplicabilityDefinition version per ComplianceRequirement
unique rule dependency
unique AssessmentRequirementApplicability identity
unique applicability revision per stable determination
one CurrentRegulatoryFactAuthority row per RegulatoryFact
one CurrentApplicabilityDefinitionAuthority row per ComplianceRequirement
one CurrentApplicabilityResolutionAuthority row per stable determination
```

Foreign keys can enforce direct parent-child identity.

These should be preferred where they accurately express the invariant.

---

# 15. Transactional Application Invariants

Some locked invariants cannot be completely expressed by ordinary Prisma relations alone.

These include:

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

and:

```text
Assessment.organizationId
=
ApplicabilityContext.organizationId
```

and:

```text
Assessment.frameworkId
=
ComplianceRequirement.frameworkId
=
ApplicabilityContext.frameworkId
```

and:

```text
ApplicabilityDefinition.requirementId
=
AssessmentRequirementApplicability.requirementId
```

where the equality crosses several independent relations.

The service layer must validate these invariants transactionally unless the final PostgreSQL design introduces suitable composite foreign-key constraints outside ordinary Prisma expressiveness.

---

# 16. Explicit Context Requirement

The locked architecture rejects nullable context as shorthand for organization-wide applicability.

Therefore:

```text
ApplicabilityContext
```

must include an explicit ORGANIZATION context type.

RegulatoryFact and AssessmentRequirementApplicability should reference a concrete context identity.

This avoids:

```text
NULL = organization-wide
```

semantics.

---

# 17. Versioning Requirements

The proposal must support explicit local version uniqueness for:

```text
RegulatoryFactValue
→ RegulatoryFact + version

ApplicabilityDefinition
→ ComplianceRequirement + version

AssessmentRequirementApplicabilityRevision
→ AssessmentRequirementApplicability + revision
```

Highest version must not imply current authority.

Explicit authority models remain mandatory.

---

# 18. Three-Valued Applicability

The schema proposal requires an applicability-status enum equivalent to:

```text
APPLICABLE
NOT_APPLICABLE
UNDETERMINED
```

This enum belongs to applicability resolution.

It must not be merged with:

```text
EvidenceVerificationStatus
DocumentVerificationStatus
AssessmentStatus
```

---

# 19. Fact Knowledge and Authority

RegulatoryFactValue requires separate concepts for knowledge and authority.

Knowledge:

```text
KNOWN
UNKNOWN
```

Authority:

```text
DECLARED
REVIEWED
VERIFIED
DISPUTED
```

These must not be collapsed into one status enum.

Current authority is also separate.

Therefore:

```text
KNOWN ≠ VERIFIED
VERIFIED ≠ CURRENT
CURRENT ≠ VERIFIED
UNKNOWN ≠ FALSE
```

---

# 20. Typed Fact Values

The schema proposal must support heterogeneous typed fact values without converting every fact into opaque JSON.

Required conceptual value families are:

```text
BOOLEAN
STRING
NUMBER
DATE
ENUM
MULTI_VALUE
```

The proposal must define exact physical columns and validation responsibilities.

Prisma schema syntax alone may not enforce the complete rule:

```text
KNOWN fact
→ exactly one compatible substantive value
```

Therefore application validation and, where appropriate, migration-level PostgreSQL CHECK constraints must be considered.

---

# 21. Temporal Compatibility

RegulatoryFactValue requires temporal concepts distinct from `createdAt`.

The proposal must account for:

```text
validFrom
validUntil
establishedAt
reviewedAt
```

and must not use `createdAt` as a substitute for real-world validity.

Future-effective and backdated facts must remain representable.

---

# 22. Snapshot Compatibility

AssessmentRegulatoryFactSnapshot must preserve copied historical meaning.

It cannot rely only on a foreign key to RegulatoryFactValue.

The proposal must provide physical snapshot fields sufficient to preserve:

```text
fact identity
fact key
value type
typed value
knowledge state
authority state
provenance
temporal state
context
reference time
source lineage where available
```

A later mutation or retirement of upstream definitions must not make the assessment historically unintelligible.

---

# 23. Applicability Revision Compatibility

AssessmentRequirementApplicability provides stable identity.

AssessmentRequirementApplicabilityRevision provides immutable historical resolution.

CurrentApplicabilityResolutionAuthority selects the governing revision.

The proposal must not place a mutable authoritative status directly on the stable identity as the sole historical record.

---

# 24. Fact-Basis Compatibility

DeterminationFactBasis must provide an explicit relational many-to-many lineage between:

```text
AssessmentRequirementApplicabilityRevision
```

and:

```text
AssessmentRegulatoryFactSnapshot
```

The fact basis must not exist only as opaque JSON.

---

# 25. Rule Representation Compatibility

ApplicabilityDefinition requires deterministic declarative rule representation.

Prisma may physically store the validated AST using `Json`.

If so:

```text
Json storage ≠ unvalidated arbitrary logic
```

The application-owned validator remains authoritative for permitted operators and operand structure.

The schema must also preserve:

```text
ruleSchemaVersion
resolverVersion on historical resolution
explicit rule fact dependencies
```

No executable JavaScript, TypeScript, SQL, shell expression, or AI prompt may become persisted executable legal logic.

---

# 26. Provenance Compatibility

The schema proposal must decide the exact physical representation of regulatory-fact provenance.

Provenance must be structured enough to preserve:

```text
source type
source identity/reference
actor
establishment time
review lineage
AI involvement where relevant
derivation/extraction version where relevant
correction/supersession lineage
```

A single free-text `notes` field is insufficient.

---

# 27. Existing AuditLog

Current AuditLog is:

```text
id
action
entity
entityId
userEmail
timestamp
```

This model is generic and string-oriented.

It does not relationally guarantee:

```text
authority domain
previous target
new target
organization
framework
actor identity
transition reason
```

Therefore the Prisma proposal must not assume AuditLog alone satisfies the locked authority-transition audit requirement.

---

# 28. Index Compatibility

The proposal must design indexes around future query paths, including:

```text
fact definitions by framework and key
contexts by organization and framework
facts by organization/context
fact versions by fact
current fact authority
rules by requirement
current rule authority
rule dependencies
assessment snapshots
assessment applicability identities
applicability revisions
current resolution authority
applicable/undetermined assessment scope
```

Indexes should not be added merely because a column exists.

---

# 29. Migration Compatibility

The existing schema contains production data foundations and locked compliance milestones.

Future migration design must preserve:

```text
existing organizations
existing assessments
CurrentAssessmentAuthority
existing evidence
documents
existing compliance scores
existing trust scores
```

No applicability migration may silently establish regulatory truth for existing records.

---

# 30. Prisma 6.19.3 Compatibility

The current project uses:

```text
prisma 6.19.3
@prisma/client 6.19.3
PostgreSQL
```

The schema proposal must target the currently installed Prisma version.

The Prisma 7 package configuration deprecation warning is unrelated to applicability persistence and is outside this milestone.

No Prisma upgrade is required for 8A.3.4B.

---

# 31. Schema Proposal Requirements

8A.3.4B must define exact proposed:

```text
models
enums
fields
scalar types
defaults
nullability
relations
relation names
unique constraints
indexes
onDelete behavior
onUpdate behavior
versioning
typed values
provenance
rule AST storage
rule dependencies
snapshots
revisions
fact basis
authority pointers
authority transition audit
tenant validation
framework validation
completed-assessment protection
```

The proposal must distinguish:

```text
DATABASE-ENFORCED
APPLICATION-ENFORCED
MIGRATION-ENFORCED
GOVERNANCE-ENFORCED
```

invariants.

---

# 32. Implementation Boundary

This audit authorizes no implementation.

It does not authorize:

```text
schema.prisma modification
prisma format
prisma generate
migration creation
migration execution
database writes
catalogue provisioning
regulatory fact services
applicability resolution services
API routes
scoring integration
Trust Score integration
Executive AI integration
```

The next output after this audit is an exact Prisma schema proposal document.

---

# 33. Audit Conclusion

The existing ComplianceOS Prisma schema can support the locked applicability architecture through additive persistence design, but the new domain cannot safely be implemented as a small collection of Boolean fields or mutable status columns.

The proposal must preserve:

```text
stable identities
immutable versions
explicit current authority
context multiplicity
three-valued applicability
typed regulatory facts
structured provenance
historical snapshots
immutable applicability revisions
fact-basis lineage
tenant integrity
framework integrity
delete safety
authority-transition auditability
evidence-engine isolation
score integrity
```

The most important schema-design principle is:

```text
THE DATABASE MUST PRESERVE REGULATORY HISTORY
WITHOUT CONFUSING CURRENT AUTHORITY WITH HISTORICAL TRUTH.
```
