# Applicability Prisma Schema Proposal V1

**Milestone:** 8A.3.4B — Exact Prisma Schema Proposal

**Status:** PROPOSAL — NOT IMPLEMENTED

**Baseline:** 9e56864b52c57bca60f4785c7cc06cbaf3dba73f

**Target:** apps/web/prisma/schema.prisma

**Prisma:** 6.19.3

**Database:** PostgreSQL

**Parent specifications:**

- APPLICABILITY_DOMAIN_MODEL_V1.md
- POPIA_APPLICABILITY_FACT_MATRIX_V1.md
- POPIA_APPLICABILITY_RESOLUTION_GRAMMAR_V1.md
- APPLICABILITY_PERSISTENCE_ARCHITECTURE_V1.md
- APPLICABILITY_PERSISTENCE_MODEL_SPECIFICATION_V1.md
- APPLICABILITY_PRISMA_SCHEMA_COMPATIBILITY_AUDIT_V1.md

---

# 1. Purpose

This document defines the exact proposed Prisma persistence contract for the ComplianceOS regulatory applicability domain.

It translates the locked conceptual architecture into proposed physical Prisma models, enums, fields, relations, constraints, indexes, versioning structures, authority pointers, provenance structures, snapshots, revisions, and lineage.

This document is a design proposal.

It does not modify `schema.prisma`.

It does not authorize a migration.

It does not authorize production applicability resolution.

---

# 2. Locked Persistence Doctrine

The proposal MUST preserve:

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

LATEST VERSION ≠ CURRENT AUTHORITY
```

The database must never manufacture regulatory certainty from missing information.

---

# 3. Existing Models Retained

The following existing models remain authoritative in their current domains:

```text
Organization
Framework
ComplianceRequirement
Assessment
CurrentAssessmentAuthority
Evidence
Document
User
OrganizationMember
```

The proposal is primarily additive.

Any inverse relation added to an existing model is a compatibility addition and does not redefine that model's existing authority.

Existing unrelated models remain outside this proposal.

---

# 4. Proposed Persistence Inventory

The locked architecture contains a 12-model core:

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

It separately requires:

```text
CurrentApplicabilityDefinitionAuthority
```

Therefore this proposal must account for all:

```text
13 named applicability persistence concepts
```

before any separately approved authority-transition audit structure.

---

# 5. Proposed Enum Inventory

The following enums are proposed:

```prisma
enum RegulatoryFactValueType {
  BOOLEAN
  STRING
  NUMBER
  DATE
  ENUM
  MULTI_VALUE
}

enum RegulatoryFactKnowledgeState {
  KNOWN
  UNKNOWN
}

enum RegulatoryFactAuthorityState {
  DECLARED
  REVIEWED
  VERIFIED
  DISPUTED
}

enum RegulatoryFactSourceType {
  USER_DECLARATION
  DOCUMENT
  SYSTEM_DERIVATION
  EXTERNAL_SOURCE
  IMPORT
  ADMINISTRATIVE
}

enum ApplicabilityContextType {
  ORGANIZATION
  EVENT
  MATTER
  ACTIVITY
  RELATIONSHIP
  TRANSFER
  SYSTEM
  AUTOMATED_DECISION
}

enum ApplicabilityClass {
  GENERAL
  CONDITIONAL
  SECTOR_SPECIFIC
  EVENT_TRIGGERED
}

enum ApplicabilityResolutionPattern {
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
}

enum ApplicabilityDefinitionStatus {
  DRAFT
  APPROVED
  RETIRED
}

enum ApplicabilityStatus {
  APPLICABLE
  NOT_APPLICABLE
  UNDETERMINED
}

enum ApplicabilityResolutionAuthority {
  SYSTEM
  HUMAN
}

enum ApplicabilityReviewState {
  NOT_REQUIRED
  REQUIRED
  COMPLETED
}
```

These enums deliberately separate:

```text
fact value type
fact knowledge
fact authority
fact provenance source
context type
applicability class
resolution pattern
rule lifecycle
applicability result
resolution authority
regulatory review state
```

No enum may collapse these independent dimensions.

---

# 6. RegulatoryFactDefinition

## 6.1 Purpose

`RegulatoryFactDefinition` defines the regulatory meaning and data type of a reusable fact within a Framework.

Examples include:

```text
processing.special_personal_information
marketing.electronic_direct_marketing
security.qualifying_compromise
transfers.personal_information_to_foreign_country_third_party
```

A fact definition is reference data.

It is not an organization's fact value.

## 6.2 Proposed Prisma Model

```prisma
```

## 6.3 Invariants

DATABASE-ENFORCED:

```text
id is globally unique
frameworkId must reference Framework
key is unique within Framework
valueType is constrained to RegulatoryFactValueType
```

APPLICATION-ENFORCED:

```text
key is stable after production use
valueType cannot be changed incompatibly after historical use
retirement is preferred to deletion
source provenance changes must not rewrite historical assessment snapshots
```

GOVERNANCE-ENFORCED:

```text
regulatory meaning changes require review
material semantic changes may require a new definition rather than mutation
```

---

# 7. ApplicabilityContext

## 7.1 Purpose

`ApplicabilityContext` provides explicit scope identity for regulatory facts and applicability determinations.

It prevents nullable context from meaning "organization-wide."

Every applicability context belongs to:

```text
Organization
Framework
```

The ORGANIZATION context is explicit.

Event and matter contexts are first-class records.

## 7.2 Proposed Prisma Model

```prisma
model ApplicabilityContext {
  id               String                   @id @default(cuid())
  organizationId   String
  frameworkId      String
  contextType      ApplicabilityContextType
  stableContextKey String
  name             String?
  description      String?
  openedAt         DateTime?
  closedAt         DateTime?
  active           Boolean                  @default(true)
  createdAt        DateTime                 @default(now())
  updatedAt        DateTime                 @updatedAt

  organization     Organization             @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  framework        Framework                @relation(fields: [frameworkId], references: [id], onDelete: Restrict)
  facts            RegulatoryFact[]
  factSnapshots    AssessmentRegulatoryFactSnapshot[]
  applicability    AssessmentRequirementApplicability[]

  @@unique([organizationId, frameworkId, contextType, stableContextKey])
  @@index([organizationId, frameworkId])
  @@index([organizationId, contextType])
  @@index([frameworkId, contextType])
  @@index([active])
}
```

## 7.3 Organization Context

Each Organization × Framework pair requiring applicability resolution must have one explicit context such as:

```text
contextType      = ORGANIZATION
stableContextKey = ORGANIZATION
```

APPLICATION-ENFORCED:

```text
exactly one canonical ORGANIZATION context exists for an Organization × Framework pair when applicability is initialized
```

The database uniqueness constraint prevents duplicate canonical keys once that convention is used.

## 7.4 Historical Safety

Contexts referenced by historical assessments must not be physically deleted merely because:

```text
an event ended
a matter closed
a relationship ended
an activity ceased
```

Closure is represented through lifecycle fields, not historical erasure.

---

# 8. RegulatoryFact

## 8.1 Purpose

`RegulatoryFact` is the stable identity of an organization's fact within a particular applicability context.

Stable identity is:

```text
Organization
+
RegulatoryFactDefinition
+
ApplicabilityContext
```

It contains no authoritative mutable fact value.

Values are versioned separately.

## 8.2 Proposed Prisma Model

```prisma
model RegulatoryFact {
  id               String   @id @default(cuid())
  organizationId   String
  factDefinitionId String
  contextId        String
  active           Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  organization     Organization                    @relation(fields: [organizationId], references: [id], onDelete: Restrict)
  factDefinition   RegulatoryFactDefinition        @relation(fields: [factDefinitionId], references: [id], onDelete: Restrict)
  context          ApplicabilityContext            @relation(fields: [contextId], references: [id], onDelete: Restrict)
  values           RegulatoryFactValue[]
  currentAuthority CurrentRegulatoryFactAuthority?

  @@unique([organizationId, factDefinitionId, contextId])
  @@index([organizationId])
  @@index([factDefinitionId])
  @@index([contextId])
  @@index([active])
}
```

## 8.3 Cross-Boundary Integrity

Prisma relations alone do not guarantee:

```text
RegulatoryFact.organizationId
=
ApplicabilityContext.organizationId
```

or:

```text
RegulatoryFactDefinition.frameworkId
=
ApplicabilityContext.frameworkId
```

Therefore these are TRANSACTIONAL APPLICATION INVARIANTS.

A RegulatoryFact must not be created until both equalities have been verified inside the write transaction.

---

# 9. RegulatoryFactValue

## 9.1 Purpose

`RegulatoryFactValue` is an immutable versioned assertion of regulatory fact state.

A RegulatoryFact may have many versions.

No version becomes current merely because its version number is highest.

## 9.2 Proposed Prisma Model

```prisma
model RegulatoryFactValue {
  id                String                       @id @default(cuid())
  regulatoryFactId  String
  version           Int
  knowledgeState    RegulatoryFactKnowledgeState
  authorityState    RegulatoryFactAuthorityState
  booleanValue      Boolean?
  stringValue       String?
  numberValue       Decimal?
  dateValue         DateTime?
  enumValue         String?
  multiValue        String[]                     @default([])
  validFrom         DateTime?
  validUntil        DateTime?
  establishedAt     DateTime
  reviewedAt        DateTime?
  sourceType        RegulatoryFactSourceType
  sourceReference   String?
  sourceDescription String?
  establishedById   String?
  reviewedById      String?
  supersedesValueId String?
  correctionOfId    String?
  derivationKey     String?
  derivationVersion String?
  createdAt         DateTime                     @default(now())

  regulatoryFact    RegulatoryFact               @relation(fields: [regulatoryFactId], references: [id], onDelete: Restrict)
  establishedBy     User?                        @relation("RegulatoryFactEstablishedBy", fields: [establishedById], references: [id], onDelete: SetNull)
  reviewedBy        User?                        @relation("RegulatoryFactReviewedBy", fields: [reviewedById], references: [id], onDelete: SetNull)
  supersedesValue   RegulatoryFactValue?         @relation("RegulatoryFactSupersession", fields: [supersedesValueId], references: [id], onDelete: Restrict)
  supersededBy      RegulatoryFactValue[]        @relation("RegulatoryFactSupersession")
  correctionOf      RegulatoryFactValue?         @relation("RegulatoryFactCorrection", fields: [correctionOfId], references: [id], onDelete: Restrict)
  corrections       RegulatoryFactValue[]        @relation("RegulatoryFactCorrection")
  currentAuthority              CurrentRegulatoryFactAuthority?
  snapshots                     AssessmentRegulatoryFactSnapshot[]
  sources                       RegulatoryFactValueSource[]
  derivationInputs              RegulatoryFactDerivationInput[] @relation("DerivedFactInputs")
  usedAsDerivationInput         RegulatoryFactDerivationInput[] @relation("FactValueUsedAsDerivationInput")
  previousAuthorityTransitions  RegulatoryFactAuthorityTransition[] @relation("PreviousRegulatoryFactAuthorityValue")
  newAuthorityTransitions       RegulatoryFactAuthorityTransition[] @relation("NewRegulatoryFactAuthorityValue")

  @@unique([regulatoryFactId, version])
  @@index([regulatoryFactId])
  @@index([knowledgeState])
  @@index([authorityState])
  @@index([validFrom])
  @@index([validUntil])
  @@index([sourceType])
  @@index([establishedById])
  @@index([reviewedById])
}
```

## 9.3 Typed-Value Contract

When:

```text
knowledgeState = UNKNOWN
```

all substantive value columns must be empty.

When:

```text
knowledgeState = KNOWN
```

the populated value column must correspond to:

```text
RegulatoryFactDefinition.valueType
```

Examples:

```text
BOOLEAN     → booleanValue
STRING      → stringValue
NUMBER      → numberValue
DATE        → dateValue
ENUM        → enumValue
MULTI_VALUE → multiValue
```

Prisma cannot fully express this cross-model typed-value constraint.

Therefore it requires:

```text
APPLICATION-ENFORCED validation
+
candidate PostgreSQL CHECK constraints where locally expressible
```

`multiValue` requires special care because an empty array may be a legitimate known value.

Therefore:

```text
empty MULTI_VALUE ≠ UNKNOWN
```

Knowledge state remains authoritative.

## 9.4 Immutability

After creation, a RegulatoryFactValue used as regulatory history must not be mutated to change its substantive meaning.

Corrections create a new version.

Supersession creates a new version.

Current authority is changed separately.

---

# 10. CurrentRegulatoryFactAuthority

## 10.1 Purpose

`CurrentRegulatoryFactAuthority` explicitly selects the currently authoritative RegulatoryFactValue.

It prevents:

```text
MAX(version)
```

from becoming legal authority.

## 10.2 Proposed Prisma Model

```prisma
model CurrentRegulatoryFactAuthority {
  id                    String   @id @default(cuid())
  regulatoryFactId      String   @unique
  regulatoryFactValueId String   @unique
  establishedAt         DateTime @default(now())
  establishedById       String?
  reason                String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  regulatoryFact        RegulatoryFact      @relation(fields: [regulatoryFactId], references: [id], onDelete: Restrict)
  regulatoryFactValue   RegulatoryFactValue @relation(fields: [regulatoryFactValueId], references: [id], onDelete: Restrict)
  establishedBy         User?               @relation("CurrentRegulatoryFactAuthorityEstablishedBy", fields: [establishedById], references: [id], onDelete: SetNull)

  @@index([establishedById])
}
```

## 10.3 Authority Integrity

The database guarantees one current authority row per RegulatoryFact.

The service layer must additionally guarantee:

```text
CurrentRegulatoryFactAuthority.regulatoryFactValueId
belongs to
CurrentRegulatoryFactAuthority.regulatoryFactId
```

A current authority may point to a fact value whose knowledge state is UNKNOWN.

Therefore:

```text
CURRENT ≠ KNOWN
CURRENT ≠ VERIFIED
```

The current authority row identifies governing organizational state, not evidential quality.

---

# 11. ApplicabilityDefinition

## 11.1 Purpose

`ApplicabilityDefinition` stores an immutable versioned applicability rule for a ComplianceRequirement.

A new substantive legal rule creates a new version.

The highest version is not automatically current.

## 11.2 Proposed Prisma Model

```prisma
model ApplicabilityDefinition {
  id                String                         @id @default(cuid())
  requirementId     String
  version           Int
  applicabilityClass ApplicabilityClass
  resolutionPattern ApplicabilityResolutionPattern
  status            ApplicabilityDefinitionStatus @default(DRAFT)
  ruleAst           Json
  ruleSchemaVersion String
  sourceTitle       String?
  sourceReference   String?
  sourceUrl         String?
  effectiveFrom     DateTime?
  effectiveUntil    DateTime?
  approvedAt        DateTime?
  approvedById      String?
  retiredAt         DateTime?
  createdAt         DateTime                       @default(now())

  requirement       ComplianceRequirement                    @relation(fields: [requirementId], references: [id], onDelete: Restrict)
  approvedBy        User?                                    @relation("ApplicabilityDefinitionApprovedBy", fields: [approvedById], references: [id], onDelete: SetNull)
  dependencies      ApplicabilityRuleFactDependency[]
  currentAuthority  CurrentApplicabilityDefinitionAuthority?
  revisions         AssessmentRequirementApplicabilityRevision[]

  @@unique([requirementId, version])
  @@index([requirementId])
  @@index([status])
  @@index([applicabilityClass])
  @@index([resolutionPattern])
  @@index([effectiveFrom])
  @@index([effectiveUntil])
}
```

## 11.3 Rule AST Safety

`ruleAst Json` stores a validated declarative AST.

It must never contain executable arbitrary:

```text
JavaScript
TypeScript
SQL
shell
eval expressions
AI prompts used as legal execution logic
```

APPLICATION-ENFORCED:

```text
AST schema validation
operator allow-list
operand validation
fact dependency validation
three-valued evaluation semantics
```

`ruleSchemaVersion` identifies the grammar contract used to validate the AST.

---

# 12. ApplicabilityRuleFactDependency

## 12.1 Purpose

This model explicitly records which regulatory fact definitions a rule depends upon.

It prevents dependencies from existing only inside opaque rule JSON.

## 12.2 Proposed Prisma Model

```prisma
model ApplicabilityRuleFactDependency {
  id                       String   @id @default(cuid())
  applicabilityDefinitionId String
  factDefinitionId         String
  required                 Boolean  @default(true)
  createdAt                DateTime @default(now())

  applicabilityDefinition  ApplicabilityDefinition @relation(fields: [applicabilityDefinitionId], references: [id], onDelete: Restrict)
  factDefinition           RegulatoryFactDefinition @relation(fields: [factDefinitionId], references: [id], onDelete: Restrict)

  @@unique([applicabilityDefinitionId, factDefinitionId])
  @@index([applicabilityDefinitionId])
  @@index([factDefinitionId])
}
```

## 12.3 Dependency Integrity

APPLICATION-ENFORCED:

```text
ApplicabilityDefinition.requirement.frameworkId
=
RegulatoryFactDefinition.frameworkId
```

The declared dependency set must agree with the fact references contained in the validated AST.

---

# 13. CurrentApplicabilityDefinitionAuthority

## 13.1 Purpose

This model explicitly selects the current applicability rule for a ComplianceRequirement.

APPROVED does not imply CURRENT.

## 13.2 Proposed Prisma Model

```prisma
model CurrentApplicabilityDefinitionAuthority {
  id                        String   @id @default(cuid())
  requirementId             String   @unique
  applicabilityDefinitionId String   @unique
  establishedAt             DateTime @default(now())
  establishedById           String?
  reason                    String?
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  requirement               ComplianceRequirement  @relation(fields: [requirementId], references: [id], onDelete: Restrict)
  applicabilityDefinition   ApplicabilityDefinition @relation(fields: [applicabilityDefinitionId], references: [id], onDelete: Restrict)
  establishedBy             User?                   @relation("CurrentApplicabilityDefinitionAuthorityEstablishedBy", fields: [establishedById], references: [id], onDelete: SetNull)

  @@index([establishedById])
}
```

## 13.3 Authority Integrity

APPLICATION-ENFORCED:

```text
applicabilityDefinition.requirementId
=
requirementId
```

The selected definition must satisfy the approved/current-governance policy.

No query may infer current rule authority from:

```text
status = APPROVED
highest version
latest createdAt
latest effectiveFrom
```

---

# 14. Part 1 Design Checkpoint

Part 1 establishes:

```text
enum vocabulary
fact definition identity
explicit context identity
stable regulatory fact identity
append-only fact values
explicit current fact authority
versioned applicability definitions
explicit rule dependencies
explicit current rule authority
```

No assessment historical models have yet been specified in this document.

Those are defined in Part 2.

No implementation is authorized by Part 1.
---

# 15. AssessmentRegulatoryFactSnapshot

## 15.1 Purpose

`AssessmentRegulatoryFactSnapshot` preserves the regulatory fact meaning actually relied upon by an Assessment.

It is historical assessment state.

It must remain intelligible even if:

```text
the organization's current fact changes
the source RegulatoryFactValue is superseded
the fact definition is retired
the context is closed
provenance metadata evolves
```

A snapshot may represent UNKNOWN regulatory knowledge.

A snapshot therefore does not require a source RegulatoryFactValue.

## 15.2 Proposed Prisma Model

```prisma
model AssessmentRegulatoryFactSnapshot {
  id                    String                       @id @default(cuid())
  assessmentId          String
  contextId             String
  factDefinitionId      String
  sourceRegulatoryFactId String?
  sourceFactValueId     String?
  factKey               String
  factName              String
  valueType             RegulatoryFactValueType
  knowledgeState        RegulatoryFactKnowledgeState
  authorityState        RegulatoryFactAuthorityState?
  booleanValue          Boolean?
  stringValue           String?
  numberValue           Decimal?
  dateValue             DateTime?
  enumValue             String?
  multiValue            String[]                     @default([])
  validFrom             DateTime?
  validUntil            DateTime?
  sourceType            RegulatoryFactSourceType?
  sourceReference       String?
  sourceDescription     String?
  sourceEstablishedAt   DateTime?
  sourceReviewedAt      DateTime?
  capturedAt            DateTime                     @default(now())
  createdAt             DateTime                     @default(now())

  assessment            Assessment                   @relation(fields: [assessmentId], references: [id], onDelete: Restrict)
  context               ApplicabilityContext         @relation(fields: [contextId], references: [id], onDelete: Restrict)
  factDefinition        RegulatoryFactDefinition     @relation(fields: [factDefinitionId], references: [id], onDelete: Restrict)
  sourceRegulatoryFact  RegulatoryFact?              @relation(fields: [sourceRegulatoryFactId], references: [id], onDelete: Restrict)
  sourceFactValue       RegulatoryFactValue?         @relation(fields: [sourceFactValueId], references: [id], onDelete: Restrict)
  determinationBasis    DeterminationFactBasis[]

  @@index([assessmentId])
  @@index([assessmentId, contextId])
  @@index([factDefinitionId])
  @@index([sourceRegulatoryFactId])
  @@index([sourceFactValueId])
  @@index([knowledgeState])
}
```

## 15.3 Snapshot Copy Contract

The snapshot copies regulatory meaning rather than depending exclusively on mutable upstream records.

Copied fields include:

```text
factKey
factName
valueType
knowledgeState
authorityState
typed substantive value
validFrom
validUntil
sourceType
sourceReference
sourceDescription
sourceEstablishedAt
sourceReviewedAt
capturedAt
```

The foreign keys preserve lineage where available.

The copied fields preserve historical intelligibility.

## 15.4 UNKNOWN Snapshot

When:

```text
knowledgeState = UNKNOWN
```

the snapshot may legitimately have:

```text
sourceRegulatoryFactId = null
sourceFactValueId = null
authorityState = null
sourceType = null
```

and no substantive typed value.

This represents:

```text
the assessment explicitly knew that this required fact was unknown
```

It must never be converted to false.

## 15.5 Snapshot Immutability

Once a snapshot has been used by an applicability determination revision, its regulatory meaning is immutable.

Corrections require new assessment-time snapshot material and a new applicability revision where the assessment lifecycle permits recalculation.

Completed assessment history must not be rewritten.

---

# 16. AssessmentRequirementApplicability

## 16.1 Purpose

`AssessmentRequirementApplicability` is the stable identity of a requirement applicability determination within an Assessment and ApplicabilityContext.

Stable identity is:

```text
Assessment
+
ComplianceRequirement
+
ApplicabilityContext
```

It does not itself store the mutable authoritative applicability result.

Resolution history is versioned separately.

## 16.2 Proposed Prisma Model

```prisma
model AssessmentRequirementApplicability {
  id             String   @id @default(cuid())
  assessmentId   String
  requirementId  String
  contextId      String
  createdAt      DateTime @default(now())

  assessment     Assessment                                @relation(fields: [assessmentId], references: [id], onDelete: Restrict)
  requirement    ComplianceRequirement                     @relation(fields: [requirementId], references: [id], onDelete: Restrict)
  context        ApplicabilityContext                       @relation(fields: [contextId], references: [id], onDelete: Restrict)
  revisions      AssessmentRequirementApplicabilityRevision[]
  currentAuthority CurrentApplicabilityResolutionAuthority?

  @@unique([assessmentId, requirementId, contextId])
  @@index([assessmentId])
  @@index([requirementId])
  @@index([contextId])
  @@index([assessmentId, requirementId])
}
```

## 16.3 Cross-Boundary Integrity

Before creation, the service must transactionally prove:

```text
Assessment.organizationId
=
ApplicabilityContext.organizationId
```

and:

```text
Assessment.frameworkId
=
ApplicabilityContext.frameworkId
```

and:

```text
Assessment.frameworkId
=
ComplianceRequirement.frameworkId
```

The stable identity must never connect:

```text
one tenant's assessment
to another tenant's context
```

or:

```text
a requirement from another framework
```

---

# 17. AssessmentRequirementApplicabilityRevision

## 17.1 Purpose

`AssessmentRequirementApplicabilityRevision` is an immutable versioned applicability resolution.

It records:

```text
the result
the rule used
the resolver used
the authority class
the review state
the explanation
the time of resolution
```

A new resolution creates a new revision.

Existing revisions are not overwritten.

## 17.2 Proposed Prisma Model

```prisma
model AssessmentRequirementApplicabilityRevision {
  id                       String                           @id @default(cuid())
  applicabilityId          String
  revision                 Int
  applicabilityDefinitionId String
  status                   ApplicabilityStatus
  resolutionAuthority      ApplicabilityResolutionAuthority
  reviewState              ApplicabilityReviewState        @default(NOT_REQUIRED)
  resolverVersion          String
  reason                   String
  resolutionBasis          Json?
  resolvedAt               DateTime                         @default(now())
  resolvedById             String?
  reviewedAt               DateTime?
  reviewedById             String?
  createdAt                DateTime                         @default(now())

  applicability            AssessmentRequirementApplicability @relation(fields: [applicabilityId], references: [id], onDelete: Restrict)
  applicabilityDefinition  ApplicabilityDefinition             @relation(fields: [applicabilityDefinitionId], references: [id], onDelete: Restrict)
  resolvedBy               User?                               @relation("ApplicabilityRevisionResolvedBy", fields: [resolvedById], references: [id], onDelete: SetNull)
  reviewedBy               User?                               @relation("ApplicabilityRevisionReviewedBy", fields: [reviewedById], references: [id], onDelete: SetNull)
  factBasis                DeterminationFactBasis[]
  currentAuthority         CurrentApplicabilityResolutionAuthority?

  @@unique([applicabilityId, revision])
  @@index([applicabilityId])
  @@index([applicabilityDefinitionId])
  @@index([status])
  @@index([resolutionAuthority])
  @@index([reviewState])
  @@index([resolvedAt])
  @@index([resolvedById])
  @@index([reviewedById])
}
```

## 17.3 Historical Rule Integrity

The revision references the exact ApplicabilityDefinition used for the determination.

APPLICATION-ENFORCED:

```text
ApplicabilityDefinition.requirementId
=
AssessmentRequirementApplicability.requirementId
```

Historical resolution does not automatically move when current rule authority later changes.

## 17.4 Resolver Version

`resolverVersion` identifies the deterministic resolution implementation used.

It is distinct from:

```text
ApplicabilityDefinition.version
ruleSchemaVersion
```

This allows later explanation of:

```text
which legal rule version was used
which rule grammar interpreted it
which resolver implementation evaluated it
```

## 17.5 Resolution Basis

`resolutionBasis Json?` may contain structured non-authoritative explanatory metadata.

It must not replace:

```text
DeterminationFactBasis
ApplicabilityDefinition relation
status
reason
resolverVersion
```

Core lineage remains relational.

---

# 18. DeterminationFactBasis

## 18.1 Purpose

`DeterminationFactBasis` explicitly records the fact snapshots relied upon by a particular applicability revision.

It is the relational evidence of:

```text
which known or unknown regulatory facts produced this applicability result
```

## 18.2 Proposed Prisma Model

```prisma
model DeterminationFactBasis {
  id             String   @id @default(cuid())
  revisionId     String
  factSnapshotId String
  createdAt      DateTime @default(now())

  revision       AssessmentRequirementApplicabilityRevision @relation(fields: [revisionId], references: [id], onDelete: Restrict)
  factSnapshot   AssessmentRegulatoryFactSnapshot            @relation(fields: [factSnapshotId], references: [id], onDelete: Restrict)

  @@unique([revisionId, factSnapshotId])
  @@index([revisionId])
  @@index([factSnapshotId])
}
```

## 18.3 Basis Integrity

APPLICATION-ENFORCED:

```text
DeterminationFactBasis.revision
and
DeterminationFactBasis.factSnapshot
must belong to the same Assessment
```

The fact snapshot's definition must also be permitted by the applicability rule dependency set unless the basis is explicitly allowed as resolver metadata under a future reviewed extension.

V1 should default to strict dependency alignment.

---

# 19. CurrentApplicabilityResolutionAuthority

## 19.1 Purpose

`CurrentApplicabilityResolutionAuthority` explicitly selects the governing revision for a stable assessment requirement applicability identity.

It prevents:

```text
MAX(revision)
```

from becoming authority.

## 19.2 Proposed Prisma Model

```prisma
model CurrentApplicabilityResolutionAuthority {
  id                String   @id @default(cuid())
  applicabilityId   String   @unique
  revisionId        String   @unique
  establishedAt     DateTime @default(now())
  establishedById   String?
  reason            String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  applicability     AssessmentRequirementApplicability         @relation(fields: [applicabilityId], references: [id], onDelete: Restrict)
  revision          AssessmentRequirementApplicabilityRevision @relation(fields: [revisionId], references: [id], onDelete: Restrict)
  establishedBy     User?                                      @relation("CurrentApplicabilityResolutionAuthorityEstablishedBy", fields: [establishedById], references: [id], onDelete: SetNull)

  @@index([establishedById])
}
```

## 19.3 Authority Integrity

APPLICATION-ENFORCED:

```text
revision.applicabilityId
=
applicabilityId
```

The selected revision must be a legitimate revision of the stable determination.

No query may infer authority from:

```text
highest revision
latest resolvedAt
latest createdAt
```

---

# 20. Assessment Applicability Resolution Transaction

For an active assessment, applicability recalculation should conceptually occur in one transaction.

The transaction must:

```text
1. load Assessment and lifecycle state
2. load applicable current rule authority
3. load required rule dependencies
4. resolve the correct ApplicabilityContext
5. load explicit current regulatory fact authority where available
6. establish assessment fact snapshots
7. evaluate the validated rule using three-valued logic
8. create a new applicability revision
9. create DeterminationFactBasis rows
10. establish or change CurrentApplicabilityResolutionAuthority
11. compute applicability coverage metadata outside Compliance Score
```

The transaction must fail rather than partially establish authority.

---

# 21. Completed Assessment Protection

The existing Assessment lifecycle ends at:

```text
COMPLETED
```

Completed assessment regulatory history must not be silently recalculated.

APPLICATION-ENFORCED:

```text
if Assessment.status = COMPLETED
then ordinary regulatory-fact changes
must not rewrite:
  AssessmentRegulatoryFactSnapshot
  AssessmentRequirementApplicabilityRevision
  CurrentApplicabilityResolutionAuthority
```

If future governance permits a formal correction process, that process must be explicit and separately audited.

It must not masquerade as ordinary recalculation.

---

# 22. Applicability Coverage

Compliance Score and Applicability Coverage are separate concepts.

For an Assessment, the system must be able to derive:

```text
resolved applicable requirements
resolved not-applicable requirements
undetermined requirements
total requirements requiring applicability resolution
```

A candidate conceptual coverage formula is:

```text
resolved =
APPLICABLE + NOT_APPLICABLE

coverage =
resolved / total applicability determinations
```

UNDETERMINED does not count as resolved regulatory scope.

The exact product presentation may evolve.

The persistence requirement is that UNDETERMINED remains queryable and visible.

---

# 23. Evidence Engine Boundary

Only current authoritative applicability revisions whose status is:

```text
APPLICABLE
```

may contribute their requirements to the locked evidence-driven compliance engine.

The applicability persistence layer does not change:

```text
EvidenceVerificationStatus
```

and does not add:

```text
NOT_APPLICABLE
UNDETERMINED
```

to Evidence.

The boundary remains:

```text
Applicability Resolution
        ↓
APPLICABLE requirement set
        ↓
Locked Evidence Engine
        ↓
Requirement Compliance Status
        ↓
Compliance Score
```

---

# 24. Requirement and Context Multiplicity

A requirement may have more than one applicability identity within one Assessment when different contexts exist.

Examples include:

```text
multiple security events
multiple data-subject matters
multiple transfers
multiple relationships
multiple automated-decision systems
```

Therefore this is correct:

```text
@@unique([assessmentId, requirementId, contextId])
```

and this would be incorrect:

```text
@@unique([assessmentId, requirementId])
```

for the general persistence architecture.

The scoring integration layer must later define how multiple APPLICABLE contexts for the same ComplianceRequirement affect the requirement-level evidence/scoring boundary.

That scoring integration decision is not authorized in this milestone.

---

# 25. General Requirement Context

GENERAL_UNCONDITIONAL requirements still receive explicit applicability persistence.

They should use the canonical:

```text
ORGANIZATION
```

ApplicabilityContext for the Assessment's Organization × Framework pair.

No missing applicability row may mean:

```text
implicitly APPLICABLE
```

The resolver must create explicit determination history.

---

# 26. Event and Matter Historical Safety

Event and matter contexts are not temporary cache keys.

For:

```text
SEC-005
DSP-003
```

and similar future requirements, the context itself is part of regulatory history.

Closing the event or matter must not:

```text
delete the context
delete fact snapshots
delete applicability determinations
rewrite historical NOT_APPLICABLE/APPLICABLE/UNDETERMINED results
```

Historical preservation is mandatory.

---

# 27. Applicability Exception Safety

The persistence model must preserve the architectural distinction between:

```text
APPLICABILITY_EXCEPTION
```

and:

```text
COMPLIANCE_CONTROL_EXCEPTION
```

An applicability exception may affect whether the requirement applies.

A compliance-control exception does not remove the requirement from applicability merely because it changes the permitted compliance method.

The current proposal does not add an exception-result enum to the stable determination.

Exception reasoning remains represented through:

```text
ApplicabilityDefinition.ruleAst
ApplicabilityDefinition.resolutionPattern
AssessmentRequirementApplicabilityRevision.reason
AssessmentRequirementApplicabilityRevision.resolutionBasis
DeterminationFactBasis
```

If future implementation proves that explicit exception classification must be persisted independently, that requires a reviewed schema extension.

---

# 28. Regulatory Review Boundary

Some applicability resolutions require human regulatory review.

The proposal uses the `ApplicabilityReviewState` enum defined in Section 5:

```text
NOT_REQUIRED
REQUIRED
COMPLETED
```

A resolver may produce:

```text
UNDETERMINED + REQUIRED
```

where legal ambiguity or insufficient authoritative facts prevent deterministic resolution.

`COMPLETED` means the required review occurred.

It does not by itself determine whether the result is:

```text
APPLICABLE
NOT_APPLICABLE
UNDETERMINED
```

The applicability result remains independently stored.

---

# 29. Human Resolution Authority

`ApplicabilityResolutionAuthority` distinguishes:

```text
SYSTEM
HUMAN
```

This records the class of authority responsible for a revision.

It does not replace actor lineage.

When:

```text
resolutionAuthority = HUMAN
```

APPLICATION-ENFORCED policy should normally require:

```text
resolvedById != null
```

When:

```text
resolutionAuthority = SYSTEM
```

`resolvedById` may be null.

AI is not a legal authority class.

AI may assist a human or deterministic resolver but must not become a third authoritative resolution state.

---

# 30. Part 2 Design Checkpoint

Part 2 establishes:

```text
immutable assessment fact snapshots
stable Assessment × Requirement × Context identity
append-only applicability revisions
explicit fact-basis lineage
explicit current resolution authority
transactional recalculation
completed-assessment protection
applicability coverage separation
evidence-engine isolation
context multiplicity
event/matter historical safety
human-review boundaries
```

The proposal now represents all 13 named applicability persistence concepts.

Part 3 must still define:

```text
existing-model inverse relations
actor relation additions
Document lineage additions
authority-transition auditing
delete semantics
database/application/migration/governance constraints
indexes
migration implications
schema-level stress-test requirements
implementation prohibition
```

No implementation is authorized by Part 2.
---

# 31. Existing Organization Relation Additions

The proposed applicability persistence layer requires additive inverse relations on the existing `Organization` model.

Proposed additions:

```prisma
regulatoryFacts        RegulatoryFact[]
applicabilityContexts  ApplicabilityContext[]
```

These relations do not alter Organization's existing tenant authority.

Historical assessment snapshots and applicability determinations remain Assessment-owned and therefore do not require redundant direct Organization foreign keys merely for convenience.

The service layer must derive and validate tenant identity through the authoritative relation chain.

---

# 32. Existing Framework Relation Additions

The existing `Framework` model requires additive inverse relations:

```prisma
regulatoryFactDefinitions RegulatoryFactDefinition[]
applicabilityContexts      ApplicabilityContext[]
```

ApplicabilityDefinition remains attached through ComplianceRequirement rather than directly to Framework.

This preserves:

```text
Framework
→ ComplianceRequirement
→ ApplicabilityDefinition
```

and:

```text
Framework
→ RegulatoryFactDefinition
```

as distinct regulatory catalogue structures.

---

# 33. Existing ComplianceRequirement Relation Additions

The existing `ComplianceRequirement` model requires:

```prisma
applicabilityDefinitions      ApplicabilityDefinition[]
currentApplicabilityAuthority CurrentApplicabilityDefinitionAuthority?
assessmentApplicability       AssessmentRequirementApplicability[]
applicabilityDefinitionAuthorityTransitions ApplicabilityDefinitionAuthorityTransition[]
```

No global applicability Boolean is proposed.

No current applicability result belongs directly on ComplianceRequirement.

Applicability remains assessment-and-context specific.

---

# 34. Existing Assessment Relation Additions

The existing `Assessment` model requires:

```prisma
regulatoryFactSnapshots AssessmentRegulatoryFactSnapshot[]
requirementApplicability AssessmentRequirementApplicability[]
```

These relations expose historical applicability state without placing authoritative scope state into opaque Assessment JSON.

The existing:

```prisma
currentAuthority CurrentAssessmentAuthority?
```

remains independent.

---

# 35. Existing User Relation Additions

Actor lineage introduces proposed inverse User relations:

```prisma
regulatoryFactValuesEstablished RegulatoryFactValue[] @relation("RegulatoryFactEstablishedBy")
regulatoryFactValuesReviewed    RegulatoryFactValue[] @relation("RegulatoryFactReviewedBy")

currentFactAuthoritiesEstablished CurrentRegulatoryFactAuthority[] @relation("CurrentRegulatoryFactAuthorityEstablishedBy")

regulatoryFactAuthorityTransitionsEstablished RegulatoryFactAuthorityTransition[] @relation("RegulatoryFactAuthorityTransitionEstablishedBy")

applicabilityDefinitionsApproved ApplicabilityDefinition[] @relation("ApplicabilityDefinitionApprovedBy")

currentApplicabilityDefinitionsEstablished CurrentApplicabilityDefinitionAuthority[] @relation("CurrentApplicabilityDefinitionAuthorityEstablishedBy")

applicabilityDefinitionAuthorityTransitionsEstablished ApplicabilityDefinitionAuthorityTransition[] @relation("ApplicabilityDefinitionAuthorityTransitionEstablishedBy")

applicabilityRevisionsResolved AssessmentRequirementApplicabilityRevision[] @relation("ApplicabilityRevisionResolvedBy")
applicabilityRevisionsReviewed AssessmentRequirementApplicabilityRevision[] @relation("ApplicabilityRevisionReviewedBy")

currentApplicabilityResolutionsEstablished CurrentApplicabilityResolutionAuthority[] @relation("CurrentApplicabilityResolutionAuthorityEstablishedBy")

applicabilityResolutionAuthorityTransitionsEstablished ApplicabilityResolutionAuthorityTransition[] @relation("ApplicabilityResolutionAuthorityTransitionEstablishedBy")
```

These are lineage relations.

They do not grant authorization.

Authorization continues to derive from active OrganizationMember membership and application policy.

---

# 36. Existing Document Relation Addition

The existing Document model requires the typed provenance-source inverse:

```prisma
regulatoryFactValueSources RegulatoryFactValueSource[]
```

This represents provenance linkage only.

It must never imply:

```text
Document VERIFIED
→ RegulatoryFactValue VERIFIED
```

or:

```text
Document exists
→ regulatory fact is true
```

Fact authority remains independently represented by:

```text
RegulatoryFactAuthorityState
```

---

# 37. Typed Authority Domains

The normalized proposal preserves four logically separate current-authority domains:

```text
CurrentAssessmentAuthority
CurrentRegulatoryFactAuthority
CurrentApplicabilityDefinitionAuthority
CurrentApplicabilityResolutionAuthority
```

CurrentAssessmentAuthority remains part of the previously locked assessment-authority architecture.

The three new applicability persistence authority domains use typed relational transition history.

No generic polymorphic authority-transition table is part of the canonical proposal.

---

# 38. Typed Authority Transition Models

The normalized proposal uses:

```text
RegulatoryFactAuthorityTransition
ApplicabilityDefinitionAuthorityTransition
ApplicabilityResolutionAuthorityTransition
```

Each transition model preserves relational foreign keys to:

```text
the stable authority subject
the previous target where one existed
the new target
the actor where available
the transition reason
the transition timestamp
```

This is intentionally stronger than storing polymorphic string identifiers.

---

# 39. Authority Transition Referential Integrity

APPLICATION-ENFORCED:

```text
RegulatoryFactAuthorityTransition.previousFactValue
and newFactValue
must belong to regulatoryFactId.

ApplicabilityDefinitionAuthorityTransition.previousApplicabilityDefinition
and newApplicabilityDefinition
must belong to requirementId.

ApplicabilityResolutionAuthorityTransition.previousRevision
and newRevision
must belong to applicabilityId.
```

The typed foreign keys prove target existence.

The service-layer equality checks prove target ownership by the stable authority subject.

---

# 40. Authority Transition Immutability

The three typed authority-transition models are append-only historical records.

After creation, their authority-subject identity, previous target, new target, actor lineage, reason, and transition time must not be silently rewritten.

Corrections require an explicit compensating governance event rather than destructive rewriting.

Physical database enforcement is finalized during migration and deployment design.

The immutability requirement itself is not optional.

---

# 41. Assessment Authority Audit Boundary

This proposal does not modify the locked CurrentAssessmentAuthority persistence design.

No new AssessmentAuthorityTransition model is authorized by this milestone.

A future controlled extension may evaluate typed assessment-authority transition history separately.

This boundary does not weaken the typed transition requirements for the three new applicability authority domains.

---

# 42. Current Authority Transaction Rule

Every current-authority change must conceptually perform:

```text
1. validate domain ownership
2. validate candidate target
3. read existing current authority under transaction
4. create/update the explicit domain authority
5. create AuthorityTransition
6. commit both together
```

The system must not successfully change current authority while failing to preserve its transition history.

The exact transaction implementation belongs to future services.

---

# 43. Fact Current-Authority Integrity

For `CurrentRegulatoryFactAuthority`:

DATABASE-ENFORCED:

```text
one authority row per RegulatoryFact
regulatoryFactValueId unique as currently proposed
both referenced rows must exist
```

APPLICATION-ENFORCED:

```text
selected RegulatoryFactValue belongs to selected RegulatoryFact
candidate value is not an unrelated tenant fact
authority transition is audited
```

The schema stress test must specifically examine whether:

```text
regulatoryFactValueId @unique
```

is necessary or overly restrictive.

Its intent is to prevent one fact-value version from simultaneously serving as the current target of multiple stable RegulatoryFact identities.

Because a RegulatoryFactValue already belongs to exactly one RegulatoryFact, the uniqueness may be redundant.

Redundant constraints should not survive merely for appearance.

---

# 44. Rule Current-Authority Integrity

For `CurrentApplicabilityDefinitionAuthority`:

DATABASE-ENFORCED:

```text
one current rule authority row per ComplianceRequirement
applicabilityDefinitionId currently unique
```

APPLICATION-ENFORCED:

```text
selected ApplicabilityDefinition belongs to requirementId
definition satisfies approved/current governance
authority transition is audited
```

The stress test must examine whether target uniqueness is redundant given each ApplicabilityDefinition already belongs to one ComplianceRequirement.

---

# 45. Resolution Current-Authority Integrity

For `CurrentApplicabilityResolutionAuthority`:

DATABASE-ENFORCED:

```text
one current resolution authority row per stable applicability identity
revisionId currently unique
```

APPLICATION-ENFORCED:

```text
selected revision belongs to applicabilityId
assessment lifecycle permits authority change
authority transition is audited
```

Again, target uniqueness must be evaluated for necessity rather than retained automatically.

---

# 46. Assessment Authority Compatibility

The existing `CurrentAssessmentAuthority` remains unchanged by this proposal unless a later separately approved migration extends its audit integration.

The new AuthorityTransition architecture may include future transitions for:

```text
domain = ASSESSMENT
```

but this proposal does not authorize alteration of existing assessment-authority service behavior.

The schema stress test must determine how to introduce audit history without destabilizing the locked Current Assessment Authority milestone.

---

# 47. Preservation-First Delete Policy

The new applicability domain defaults to preservation-first referential behavior.

Reference and historical records should generally use:

```text
onDelete: Restrict
```

when deletion would destroy regulatory meaning or historical reproducibility.

`Cascade` is appropriate only when destruction of the dependent record is explicitly intended and proven safe.

`SetNull` is appropriate only where copied historical meaning survives loss of optional lineage.

---

# 48. RegulatoryFactDefinition Delete Semantics

Proposed relation from RegulatoryFactDefinition to Framework:

```text
onDelete: Restrict
```

This intentionally differs from the existing:

```text
ComplianceRequirement.framework
onDelete: Cascade
```

Once regulatory fact definitions are used by:

```text
RegulatoryFact
ApplicabilityRuleFactDependency
AssessmentRegulatoryFactSnapshot
```

physical deletion should not erase their regulatory identity.

Retirement should normally use:

```text
active = false
```

rather than deletion.

---

# 49. ApplicabilityDefinition Delete Semantics

ApplicabilityDefinition is historically significant once referenced by:

```text
AssessmentRequirementApplicabilityRevision
CurrentApplicabilityDefinitionAuthority
ApplicabilityRuleFactDependency
```

Therefore proposed historical relations use:

```text
onDelete: Restrict
```

Rule retirement uses lifecycle state and temporal fields.

Historical rule versions must not disappear because a newer rule becomes current.

---

# 50. RegulatoryFact Delete Semantics

RegulatoryFact is stable organization regulatory-state identity.

Its relations to:

```text
Organization
RegulatoryFactDefinition
ApplicabilityContext
```

are proposed with:

```text
onDelete: Restrict
```

RegulatoryFactValue references it with:

```text
onDelete: Restrict
```

Retirement should normally use:

```text
active = false
```

Deletion must not destroy fact history.

---

# 51. RegulatoryFactValue Delete Semantics

RegulatoryFactValue is append-only regulatory history.

It may be referenced by:

```text
CurrentRegulatoryFactAuthority
AssessmentRegulatoryFactSnapshot source lineage
supersession lineage
correction lineage
```

Current authority and self-history relations use preservation-first restrictions.

Assessment snapshots use copied historical meaning and optional source lineage.

The current proposal uses:

```text
sourceFactValue onDelete: SetNull
```

for snapshot lineage.

The schema stress test must challenge whether historical source lineage should instead be `Restrict`.

Copied snapshot meaning protects assessment interpretation, but deleting the original fact value may still violate regulatory audit expectations.

No deletion behavior is final until that stress test is complete.

---

# 52. ApplicabilityContext Delete Semantics

ApplicabilityContext participates directly in:

```text
RegulatoryFact
AssessmentRegulatoryFactSnapshot
AssessmentRequirementApplicability
```

The proposal uses:

```text
onDelete: Restrict
```

for these relationships.

Context closure is represented by:

```text
closedAt
active
```

not physical deletion.

---

# 53. Assessment Historical Delete Semantics

The proposal uses:

```text
AssessmentRegulatoryFactSnapshot.assessment
onDelete: Restrict

AssessmentRequirementApplicability.assessment
onDelete: Restrict
```

This means an Assessment with applicability history cannot be casually deleted.

This differs from some existing assessment-dependent behavior such as Evidence cascade deletion.

The difference is deliberate because applicability snapshots and revisions are intended as regulatory historical records.

The final policy must be reviewed against privacy and retention obligations.

---

# 54. Organization Delete Boundary

The locked architecture intentionally leaves physical Organization deletion unresolved.

New organization-owned applicability models therefore use preservation-first:

```text
onDelete: Restrict
```

rather than copying existing Organization cascade behavior.

This creates a deliberate future governance requirement:

```text
privacy deletion
vs
regulatory retention
vs
audit preservation
vs
legal hold
vs
anonymization
```

must be resolved before physical tenant deletion is supported across the applicability domain.

No applicability migration may silently decide this policy.

---

# 55. Framework Delete Boundary

Framework is regulatory reference data.

New applicability relations should restrict destructive deletion once historical or operational regulatory state depends on the Framework.

The existing ComplianceRequirement cascade relationship creates a compatibility concern.

The schema stress test must determine whether implementation requires:

```text
changing existing Framework → ComplianceRequirement delete behavior
```

or whether framework deletion is prohibited at service/governance level while preserving the existing schema relation initially.

No change to that locked existing relation is authorized in this proposal.

---

# 56. ComplianceRequirement Delete Boundary

Assessment applicability history references ComplianceRequirement directly.

The proposed relation uses:

```text
onDelete: Restrict
```

This means a requirement used in historical applicability cannot be physically removed without first violating or deliberately dismantling history.

This interacts with the existing Framework cascade-to-requirement behavior.

The stress test must treat this as a migration and operational compatibility issue, not merely a Prisma syntax issue.

---

# 57. Typed Fact Database Constraints

The proposed typed-value design uses:

```text
booleanValue
stringValue
numberValue
dateValue
enumValue
multiValue
```

Prisma can express these columns but cannot by itself fully enforce:

```text
factDefinition.valueType
matches populated value column
```

because `valueType` belongs to RegulatoryFactDefinition through RegulatoryFact.

APPLICATION-ENFORCED validation is mandatory.

Migration-level PostgreSQL CHECK constraints may enforce local portions, such as mutually exclusive scalar columns, but cannot trivially validate the cross-table definition type.

The final migration design must not pretend a local CHECK solves the cross-table invariant.

---

# 58. UNKNOWN Typed-Value Constraint

For:

```text
knowledgeState = UNKNOWN
```

APPLICATION-ENFORCED:

```text
booleanValue = null
stringValue = null
numberValue = null
dateValue = null
enumValue = null
multiValue contains no authoritative substantive meaning
```

Because Prisma scalar-list fields do not use null in the same way as nullable scalar columns, MULTI_VALUE requires special treatment.

An empty array can mean a known empty set.

Therefore:

```text
knowledgeState
```

must remain separate from the array's cardinality.

The stress test must determine whether `multiValue String[]` requires an explicit default or alternative representation for safe migration behavior.

---

# 59. ENUM Fact Validation

For a fact definition whose:

```text
valueType = ENUM
```

the proposed physical value is:

```text
enumValue String?
```

The permitted domain cannot be enforced by a single global Prisma enum because different RegulatoryFactDefinitions may have different legal value sets.

The proposal therefore requires future definition-level enum-option metadata or validated rule/configuration metadata before production use of ENUM facts.

Until that representation is approved:

```text
ENUM value validation is APPLICATION/GOVERNANCE-ENFORCED
```

The schema stress test must determine whether V1 requires a dedicated:

```text
RegulatoryFactEnumOption
```

model before implementation.

---

# 60. MULTI_VALUE Fact Validation

`MULTI_VALUE` similarly requires a defined permitted-value domain where the fact is enumerated rather than free-form.

The proposal must not assume every `String[]` is legally valid merely because PostgreSQL accepts it.

Validation belongs to the fact definition's approved semantic contract.

The stress test must determine whether:

```text
ENUM
MULTI_VALUE
```

share one option-definition mechanism.

---

# 61. Temporal Integrity

For RegulatoryFactValue:

```text
validFrom
validUntil
establishedAt
reviewedAt
createdAt
```

represent different temporal concepts.

APPLICATION-ENFORCED examples include:

```text
validUntil must not precede validFrom
reviewedAt must not represent review before the relevant establishment event unless a documented import/migration exception exists
future validFrom is permitted
backdated validFrom is permitted
createdAt does not determine real-world validity
```

No query may infer current regulatory truth solely from the latest timestamp.

---

# 62. Applicability Rule Temporal Integrity

ApplicabilityDefinition includes:

```text
effectiveFrom
effectiveUntil
approvedAt
createdAt
```

These are independent.

A rule may be:

```text
approved now
effective later
historically effective
retired after a replacement
```

CurrentApplicabilityDefinitionAuthority remains the explicit operational authority pointer.

Temporal fields do not independently establish current authority.

---

# 63. Fact Provenance Integrity

RegulatoryFactValue currently proposes structured provenance fields:

```text
sourceType
sourceReference
sourceDescription
documentId
establishedById
reviewedById
derivationKey
derivationVersion
supersedesValueId
correctionOfId
```

This is intentionally more structured than a single notes field.

The schema stress test must determine whether provenance needs a separate first-class model for:

```text
multiple source documents
multiple external sources
multiple derivation inputs
```

before implementation.

V1 must not falsely imply one-source provenance if real regulatory facts require many-source lineage.

---

# 64. Document-Derived Fact Safety

If:

```text
sourceType = DOCUMENT
```

APPLICATION-ENFORCED policy should normally require:

```text
documentId != null
```

A document-derived fact must retain extraction/derivation lineage where automated extraction occurred.

Document verification and fact verification remain independent.

No AI extraction may silently establish:

```text
authorityState = VERIFIED
```

without the required authority process.

---

# 65. System-Derived Fact Safety

If:

```text
sourceType = SYSTEM_DERIVATION
```

the proposal expects:

```text
derivationKey
derivationVersion
```

to identify deterministic derivation logic.

The source facts or inputs used for derivation must remain traceable.

The current single-row provenance proposal may be insufficient for multi-input derivations.

The schema stress test must challenge this explicitly.

---

# 66. External-Source Fact Safety

For:

```text
sourceType = EXTERNAL_SOURCE
```

`sourceReference` should identify the external basis.

External source data does not become VERIFIED merely because it originated outside ComplianceOS.

Authority remains separately established.

Future integrations may require source-provider identity and retrieval timestamp.

Those are schema stress-test questions, not assumptions.

---

# 67. Cross-Tenant Integrity Matrix

The service layer must validate at least the following equalities.

For RegulatoryFact:

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

For AssessmentRegulatoryFactSnapshot:

```text
Assessment.organizationId
=
ApplicabilityContext.organizationId
```

and:

```text
Assessment.frameworkId
=
ApplicabilityContext.frameworkId
=
RegulatoryFactDefinition.frameworkId
```

For AssessmentRequirementApplicability:

```text
Assessment.organizationId
=
ApplicabilityContext.organizationId
```

and:

```text
Assessment.frameworkId
=
ApplicabilityContext.frameworkId
=
ComplianceRequirement.frameworkId
```

For ApplicabilityDefinition dependency:

```text
ApplicabilityDefinition.requirement.frameworkId
=
RegulatoryFactDefinition.frameworkId
```

For applicability revision:

```text
ApplicabilityDefinition.requirementId
=
AssessmentRequirementApplicability.requirementId
```

For DeterminationFactBasis:

```text
revision's Assessment
=
snapshot's Assessment
```

These validations must occur transactionally.

---

# 68. Composite Foreign-Key Consideration

PostgreSQL can enforce some cross-boundary equalities using redundant composite keys and composite foreign keys.

Prisma support and migration complexity must be evaluated before adopting that strategy.

The proposal deliberately does not duplicate:

```text
organizationId
frameworkId
```

onto every historical row solely to simulate stronger constraints without first proving the design.

The schema stress test must compare:

```text
normalized relations + transactional validation
```

against:

```text
redundant boundary columns + composite database constraints
```

for the highest-risk tenant-integrity paths.

Tenant isolation is more important than schema minimalism.

---

# 69. Version Integrity

Versioned models require:

```text
RegulatoryFactValue
@@unique([regulatoryFactId, version])

ApplicabilityDefinition
@@unique([requirementId, version])

AssessmentRequirementApplicabilityRevision
@@unique([applicabilityId, revision])
```

APPLICATION-ENFORCED:

```text
version/revision must be positive
allocation must be concurrency-safe
gaps may be acceptable
duplicate numbers are not
highest number does not establish authority
```

The migration or service implementation may use transactional allocation.

No `MAX(version) + 1` implementation is safe without concurrency protection.

---

# 70. Immutability Enforcement Boundary

Prisma schemas do not make ordinary rows immutable.

Therefore append-only semantics for:

```text
RegulatoryFactValue
AssessmentRegulatoryFactSnapshot once relied upon
AssessmentRequirementApplicabilityRevision
DeterminationFactBasis
AuthorityTransition
```

require service-layer write restrictions.

Database triggers or restricted database roles may later strengthen immutability.

The proposal does not assume documentation alone is sufficient production enforcement.

The schema stress test must identify which immutable records justify database-level protection.

---

# 71. Idempotency Boundary

Future write services must be idempotent where retries are expected.

Potential idempotency-sensitive operations include:

```text
canonical ORGANIZATION context creation
RegulatoryFact stable identity creation
fact version submission
applicability stable identity creation
applicability recalculation
current-authority establishment
authority-transition recording
```

Unique constraints provide part of the protection.

Service-level idempotency keys may be required for externally retried operations.

No idempotency-key schema is proposed yet.

The stress test must determine whether persistence support is required before public mutation APIs exist.

---

# 72. Concurrency Boundary

Concurrency is safety-critical for:

```text
fact version allocation
rule version allocation
applicability revision allocation
current authority replacement
authority transition audit
```

A future implementation must use database transactions and appropriate conflict handling.

The existence of unique constraints does not by itself guarantee a clean authority transition under concurrent writers.

The schema proposal must be implementable with atomic transactional semantics.

---

# 73. Four-Eyes Capability

The schema must preserve the ability to enforce four-eyes governance.

Examples:

```text
fact declarer != fact verifier
rule author != rule approver
resolution proposer != human reviewer
```

The proposal does not hard-code all four-eyes policies as database constraints because governance may vary by action and organization.

Actor lineage must be sufficient for application policy to enforce them.

No design decision may erase the identities required to evaluate separation of duties.

---

# 74. Applicability Definition Approval

The proposed ApplicabilityDefinition includes:

```text
status
approvedAt
approvedById
```

APPLICATION-ENFORCED:

```text
status = APPROVED
normally requires approvedAt
normally requires approvedById
```

Retired rules remain historical.

Current rule authority may only select a rule permitted by governance.

APPROVED still does not mean CURRENT.

---

# 75. Applicability Review Consistency

For AssessmentRequirementApplicabilityRevision:

APPLICATION-ENFORCED candidate rules include:

```text
reviewState = COMPLETED
→ reviewedAt should exist

reviewState = COMPLETED
→ reviewedById should normally exist

resolutionAuthority = HUMAN
→ resolvedById should normally exist
```

The stress test must determine whether any of these should become database CHECK constraints in migration SQL.

---

# 76. Index Strategy

Indexes should support demonstrated query paths.

Candidate high-value paths include:

```text
RegulatoryFactDefinition by Framework + key
ApplicabilityContext by Organization + Framework + type
RegulatoryFact by Organization + definition + context
RegulatoryFactValue by RegulatoryFact + version
current RegulatoryFact authority by RegulatoryFact
ApplicabilityDefinition by Requirement + version
current ApplicabilityDefinition authority by Requirement
rule dependencies by definition/fact
snapshots by Assessment/context/fact definition
stable applicability by Assessment/Requirement/context
revisions by stable applicability + revision
current resolution authority by stable applicability
determinations by status/review state where operationally required
```

Unique constraints already create supporting indexes in PostgreSQL.

The final schema should avoid redundant indexes whose leading columns duplicate an existing unique index without a demonstrated query need.

---

# 77. Existing Model Index Safety

This proposal does not authorize unrelated index changes on:

```text
Organization
Framework
ComplianceRequirement
Assessment
Evidence
Document
OrganizationMember
```

Any existing-index modification must be justified by an applicability query plan or integrity requirement.

Performance optimization occurs after correctness, not instead of correctness.

---

# 78. Migration Introduction Principle

The future applicability migration should be structurally additive wherever possible.

It must not:

```text
create fabricated regulatory facts
mark unknown facts false
mark requirements applicable by default
create current authority from MAX(version)
create assessment snapshots from stale onboarding fields
backfill VERIFIED authority without evidence
recalculate existing compliance scores
change Trust Score
invoke Executive AI
```

Schema creation and regulatory truth establishment are separate operations.

---

# 79. Existing Data Preservation

The future migration must preserve existing:

```text
Organizations
Frameworks
ComplianceRequirements
Assessments
CurrentAssessmentAuthorities
Evidence
Documents
OrganizationMembers
WorkflowProgress
ExecutiveMissions
complianceScore
trustScore
```

The introduction of empty applicability tables is safer than manufacturing historical applicability state.

No silent regulatory backfill is permitted.

---

# 80. Production Zero-Truth Principle

A successful schema migration does not mean ComplianceOS knows an organization's regulatory applicability.

Immediately after migration, absence of applicability data means:

```text
no applicability state has been established
```

not:

```text
NOT_APPLICABLE
```

and not:

```text
APPLICABLE
```

Production truth begins only through authorized fact and resolution workflows.

---

# 81. Prisma Generation Boundary

A later implementation milestone may run:

```text
prisma format
prisma validate
prisma generate
```

only after an approved `schema.prisma` implementation exists.

This proposal milestone does not authorize those commands.

No generated Prisma client should change during documentation design.

---

# 82. Migration Boundary

This proposal does not authorize:

```text
prisma migrate dev
prisma migrate deploy
prisma db push
prisma migrate reset
prisma migrate resolve
```

Migration design occurs only after the schema proposal passes its dedicated stress test.

The production database remains untouched.

---

# 83. Shadow Database Safety

No future migration command may use:

```text
DATABASE_URL
DIRECT_URL
```

as a shadow database unless that target has been independently proven to be a separate disposable shadow database.

Production or production-like data must never be exposed to destructive shadow-database operations.

The prior migration-ledger recovery lesson remains binding.

---

# 84. Schema Stress-Test Requirements

Before any implementation, 8A.3.4C must challenge at least:

```text
Prisma syntax validity
Prisma 6.19.3 compatibility
relation completeness
relation naming collisions
required inverse relations
Decimal compatibility
String[] migration behavior
nullable provenance
UNKNOWN typed values
ENUM option architecture
MULTI_VALUE option architecture
one-source vs many-source provenance
derived-fact input lineage
self-relations
authority target uniqueness
authority transition integrity
context uniqueness
event/matter multiplicity
tenant isolation
framework isolation
requirement/rule integrity
snapshot immutability
revision immutability
completed-assessment protection
delete semantics
existing Framework cascade interaction
Organization deletion boundary
version allocation
concurrency
idempotency
index redundancy
migration safety
zero-truth migration behavior
evidence-engine isolation
score isolation
AI authority isolation
```

Any failed critical invariant blocks implementation.

---

# 85. Open Design Questions for Stress Test

The following questions are intentionally unresolved rather than hidden.

1. Should `RegulatoryFactValue.multiValue` remain `String[]`, and what default/null semantics are safest?

2. Do ENUM and MULTI_VALUE require a first-class allowed-option model in V1?

3. Does regulatory-fact provenance require first-class many-to-many source records?

4. Do derived facts require first-class input-lineage records?

5. Should snapshot source links use `SetNull` or `Restrict`?

6. Are `@unique` constraints on authority target IDs necessary or redundant?

7. Is generalized `AuthorityTransition` sufficiently relationally strong?

8. Should authority transitions instead use dedicated domain tables?

9. Should selected tenant/framework invariants use redundant columns and composite foreign keys?

10. Which append-only records justify database triggers or database-role protection?

11. How should version numbers be allocated safely under concurrency?

12. Does public mutation require persisted idempotency keys?

13. How should multiple APPLICABLE contexts for one requirement later enter requirement-level scoring?

14. Should existing Framework → ComplianceRequirement cascade semantics eventually change?

15. What final physical Organization deletion/anonymization policy satisfies privacy and regulatory retention?

These questions must be resolved or explicitly deferred with safety justification before implementation.

---

# 86. Proposed Physical Model Count

The proposal currently contains:

```text
13 named applicability persistence models
+
1 proposed AuthorityTransition audit model
=
14 proposed new Prisma models
```

The 13 applicability concepts are:

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
CurrentApplicabilityDefinitionAuthority
```

The additional governance model is:

```text
AuthorityTransition
```

No model may be removed merely to reduce table count if doing so destroys a locked invariant.

---

# 87. Proposed New Enum Count

The applicability proposal introduced 11 initial domain enums:

```text
RegulatoryFactValueType
RegulatoryFactKnowledgeState
RegulatoryFactAuthorityState
RegulatoryFactSourceType
ApplicabilityContextType
ApplicabilityClass
ApplicabilityResolutionPattern
ApplicabilityDefinitionStatus
ApplicabilityStatus
ApplicabilityResolutionAuthority
ApplicabilityReviewState
```

Part 3 additionally proposes:

```text
AuthorityDomain
```

Therefore the current proposal contains:

```text
12 proposed new enums
```

The schema stress test may refine this count where semantics require it.

---

# 88. Existing Model Modification Summary

Proposed additive relation changes affect:

```text
Organization
Framework
ComplianceRequirement
Assessment
User
Document
```

No substantive existing scalar field is proposed for removal.

No existing enum value is proposed for removal.

No existing compliance score field is changed.

No Evidence verification status is changed.

No Assessment lifecycle state is changed.

No CurrentAssessmentAuthority semantic is replaced.

---

# 89. Enforcement Classification

The final implementation must classify every critical invariant as one or more of:

```text
DATABASE-ENFORCED
APPLICATION-ENFORCED
MIGRATION-ENFORCED
GOVERNANCE-ENFORCED
```

Examples:

DATABASE-ENFORCED:

```text
primary keys
foreign keys
local uniqueness
enum membership
selected referential delete restrictions
```

APPLICATION-ENFORCED:

```text
cross-tenant equality
cross-framework equality
typed-value compatibility
authority target ownership
AST validation
snapshot/revision immutability
completed-assessment protection
transactional authority transition
```

MIGRATION-ENFORCED:

```text
safe table introduction
safe custom CHECK constraints
no fabricated truth
no destructive backfill
```

GOVERNANCE-ENFORCED:

```text
rule approval
regulatory interpretation
four-eyes policy
retention policy
human legal review
```

No critical invariant may exist only as an undocumented assumption.

---

# 90. Exact Proposal Boundary

This document proposes a physical Prisma architecture.

It does not authorize:

```text
editing apps/web/prisma/schema.prisma
creating a migration
executing a migration
changing production data
provisioning POPIA catalogue rows
creating regulatory facts
establishing applicability
changing Compliance Score
changing Trust Score
changing Executive AI
creating public APIs
```

The next milestone is:

```text
8A.3.4C — Applicability Prisma Schema Stress Test
```

Only after that milestone passes may an exact implementation candidate be prepared.

---

# 91. Final Design Principle

The proposed Prisma architecture exists to make regulatory state:

```text
explicit
typed
contextual
versioned
historical
explainable
tenant-safe
authority-safe
reproducible
```

The database must preserve uncertainty rather than erase it.

The database must preserve history rather than rewrite it.

The database must preserve explicit authority rather than infer it.

The final principle is:

```text
THE SCHEMA MUST MAKE IT HARDER TO CREATE FALSE REGULATORY CERTAINTY
THAN TO PRESERVE REGULATORY UNCERTAINTY, CONTEXT, AUTHORITY, AND HISTORY.
```
# 92. Stress-Test Resolution Status

The exact Prisma proposal has now undergone a relational persistence stress test.

The stress test does not authorize implementation.

Its purpose is to distinguish:

```text
KEEP
REVISE
DEFER
```

before the proposal becomes an implementation contract.

The following resolutions are adopted:

```text
Regulatory fact context scope              REVISE
MULTI_VALUE empty-array semantics           REVISE
ENUM / MULTI_VALUE option vocabulary        REVISE
multi-source fact provenance                REVISE
derived-fact input lineage                  REVISE
generic AuthorityTransition                 REVISE
snapshot source SetNull semantics           REVISE

current-authority target uniqueness         KEEP
normalized tenant/framework structure       KEEP FOR V1
database immutability strengthening         DEFER
version allocation implementation           DEFER
public mutation idempotency persistence     DEFER
multiple-context scoring integration        DEFER
Framework cascade modification              DEFER
Organization physical deletion policy       DEFER
```

A DEFER decision means the question remains explicitly controlled by a later milestone.

It does not mean the system may silently choose a default.

---

# 93. Regulatory Fact Context Scope Resolution

The original RegulatoryFactDefinition proposal identifies:

```text
Framework
key
name
description
value type
regulatory provenance
```

but does not physically express the ApplicabilityContext types in which the fact definition may legitimately operate.

That omission must be corrected.

A regulatory fact definition must explicitly declare its permitted context scope.

---

# 94. Proposed RegulatoryFactDefinition Context Scope

The revised proposal adds:

```prisma
allowedContextTypes ApplicabilityContextType[]
```

to RegulatoryFactDefinition.

The revised conceptual fragment is:

```prisma
model RegulatoryFactDefinition {
  id                  String                     @id @default(cuid())
  frameworkId         String
  key                 String
  name                String
  description         String?
  valueType           RegulatoryFactValueType
  allowedContextTypes ApplicabilityContextType[]
  sourceTitle         String?
  sourceReference     String?
  sourceUrl           String?
  effectiveFrom       DateTime?
  active              Boolean                    @default(true)
  createdAt           DateTime                   @default(now())
  updatedAt           DateTime                   @updatedAt

  framework           Framework                         @relation(fields: [frameworkId], references: [id], onDelete: Restrict)
  facts               RegulatoryFact[]
  ruleDependencies    ApplicabilityRuleFactDependency[]
  options             RegulatoryFactDefinitionOption[]

  @@unique([frameworkId, key])
  @@index([frameworkId])
  @@index([active])
  @@index([valueType])
}
```

APPLICATION-ENFORCED:

```text
allowedContextTypes must not be empty for an active production fact definition
RegulatoryFact.context.contextType must belong to factDefinition.allowedContextTypes
```

Examples:

```text
organization-level processing fact
→ [ORGANIZATION]

security incident fact
→ [EVENT]

data-subject dispute fact
→ [MATTER]

transborder transfer fact
→ [TRANSFER]

automated-decision fact
→ [AUTOMATED_DECISION]
```

A fact definition may permit more than one context type where regulatory semantics genuinely require it.

No service may infer context scope merely from the fact key name.

---

# 95. Context Scope Historical Safety

Changing allowed context scope may alter regulatory meaning.

Therefore once a RegulatoryFactDefinition has been used by historical facts or assessment snapshots, incompatible semantic scope changes must not silently reinterpret that history.

The implementation stress test must determine whether:

```text
fact definition retirement + replacement
```

is required for substantive scope changes.

Historical records continue to retain the original definition identity.

---

# 96. MULTI_VALUE Physical Representation Resolution

For V1, PostgreSQL/Prisma scalar arrays remain acceptable for MULTI_VALUE regulatory facts.

The revised physical field is:

```prisma
multiValue String[] @default([])
```

The same representation is proposed for:

```text
RegulatoryFactValue
AssessmentRegulatoryFactSnapshot
```

The empty array has a precise meaning only when interpreted with knowledgeState.

---

# 97. MULTI_VALUE Knowledge Semantics

The following states are distinct:

```text
knowledgeState = UNKNOWN
multiValue = []
```

means:

```text
the value is unknown
```

while:

```text
knowledgeState = KNOWN
multiValue = []
```

means:

```text
the authoritative known value is an empty set
```

Therefore:

```text
[] ≠ UNKNOWN
```

and:

```text
UNKNOWN ≠ []
```

Knowledge state remains authoritative for uncertainty.

Array cardinality must never manufacture knowledge.

---

# 98. Typed Value Exclusivity

For a KNOWN RegulatoryFactValue, exactly the value family corresponding to RegulatoryFactDefinition.valueType carries substantive meaning.

Conceptually:

```text
BOOLEAN     → booleanValue
STRING      → stringValue
NUMBER      → numberValue
DATE        → dateValue
ENUM        → enumValue
MULTI_VALUE → multiValue
```

For UNKNOWN:

```text
no typed field carries authoritative substantive meaning
```

For MULTI_VALUE specifically, the physical default empty array does not itself violate UNKNOWN because knowledgeState controls whether that array is meaningful.

APPLICATION-ENFORCED typed-value validation is mandatory.

Migration-level local CHECK constraints should be considered where they materially strengthen integrity without pretending to solve cross-table valueType validation.

---
# 99. Regulatory Fact Option Vocabulary Resolution

ENUM and constrained MULTI_VALUE facts require an explicit approved option vocabulary.

Arbitrary strings are not sufficient for regulatory catalogue integrity.

The proposal therefore adds a first-class option-definition model.

---

# 100. Proposed RegulatoryFactDefinitionOption Model

```prisma
model RegulatoryFactDefinitionOption {
  id               String   @id @default(cuid())
  factDefinitionId String
  value            String
  label            String
  description      String?
  sortOrder        Int?
  active           Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  factDefinition   RegulatoryFactDefinition @relation(fields: [factDefinitionId], references: [id], onDelete: Restrict)

  @@unique([factDefinitionId, value])
  @@index([factDefinitionId])
  @@index([factDefinitionId, active])
}
```

This model defines permitted catalogue vocabulary.

It does not itself store an organization fact value.

---

# 101. Option Vocabulary Rules

APPLICATION-ENFORCED:

```text
valueType = ENUM
→ enumValue must match an active permitted option

valueType = MULTI_VALUE with controlled vocabulary
→ every multiValue member must match an active permitted option
```

A future fact definition may require a free-form MULTI_VALUE collection.

Therefore the existence of MULTI_VALUE does not automatically mean every such definition must use constrained options.

The exact definition-level policy distinguishing:

```text
CONTROLLED
FREE_FORM
```

must be represented explicitly before free-form MULTI_VALUE production use.

Until that policy is added:

```text
production MULTI_VALUE should default to controlled vocabulary
```

rather than silently accepting arbitrary strings.

---

# 102. Option Retirement Safety

An option may become unavailable for new current facts without erasing historical values.

Therefore:

```text
active = false
```

means:

```text
not permitted for new ordinary selection
```

not:

```text
historical value invalidated
```

Historical RegulatoryFactValue and AssessmentRegulatoryFactSnapshot rows retain their copied string value.

Option records referenced by historical regulatory meaning should normally be retired rather than physically deleted.

---

# 103. Provenance Stress-Test Resolution

A single:

```text
documentId
sourceReference
sourceDescription
```

cannot represent all valid regulatory fact provenance.

A fact assertion may depend on:

```text
multiple documents
multiple external sources
multiple declarations
multiple system inputs
multiple prior regulatory facts
```

Therefore provenance must support one-to-many source lineage.

---

# 104. Proposed RegulatoryFactValueSourceType Enum

```prisma
enum RegulatoryFactValueSourceType {
  DOCUMENT
  EXTERNAL_REFERENCE
  DECLARATION
  IMPORT
  ADMINISTRATIVE
  OTHER
}
```

This enum describes an individual provenance source attached to a fact-value version.

It does not replace:

```text
RegulatoryFactSourceType
```

which describes the overall origin mechanism of the RegulatoryFactValue.

---

# 105. Proposed RegulatoryFactValueSource Model

```prisma
model RegulatoryFactValueSource {
  id                    String                        @id @default(cuid())
  regulatoryFactValueId String
  sourceType            RegulatoryFactValueSourceType
  documentId            String?
  sourceReference       String?
  sourceDescription     String?
  capturedAt            DateTime                      @default(now())
  createdAt             DateTime                      @default(now())

  regulatoryFactValue   RegulatoryFactValue @relation(fields: [regulatoryFactValueId], references: [id], onDelete: Restrict)
  document              Document?           @relation(fields: [documentId], references: [id], onDelete: Restrict)

  @@index([regulatoryFactValueId])
  @@index([sourceType])
  @@index([documentId])
}
```

This model allows multiple provenance sources to support one fact-value version.

---

# 106. Provenance Source Validation

APPLICATION-ENFORCED examples:

```text
sourceType = DOCUMENT
→ documentId required

sourceType = EXTERNAL_REFERENCE
→ sourceReference required

sourceType = DECLARATION
→ sourceDescription and actor lineage must be sufficient to explain the declaration basis
```

The exact actor model for declaration provenance may reuse the fact-value establishment actor where appropriate.

No source row establishes fact authority merely by existing.

---

# 107. RegulatoryFactValue Provenance Revision

The original direct:

```prisma
documentId String?
document   Document?
```

on RegulatoryFactValue becomes redundant once first-class provenance sources exist.

The revised proposal removes direct `documentId` and `document` from RegulatoryFactValue.

RegulatoryFactValue retains:

```text
sourceType
sourceReference
sourceDescription
```

as summary/origin metadata where useful.

Detailed source lineage belongs in:

```text
RegulatoryFactValueSource[]
```

The revised RegulatoryFactValue relation includes:

```prisma
sources RegulatoryFactValueSource[]
```

The existing Document model therefore no longer requires:

```prisma
regulatoryFactValues RegulatoryFactValue[]
```

Instead it requires:

```prisma
regulatoryFactValueSources RegulatoryFactValueSource[]
```

---

# 108. Derived Fact Input Lineage Resolution

A SYSTEM_DERIVATION fact must preserve the exact regulatory fact values used as derivation inputs.

Textual derivation metadata alone is insufficient.

The proposal therefore adds a first-class derivation-input relation.

---

# 109. Proposed RegulatoryFactDerivationInput Model

```prisma
model RegulatoryFactDerivationInput {
  id                 String   @id @default(cuid())
  derivedFactValueId String
  inputFactValueId   String
  inputOrder         Int?
  createdAt          DateTime @default(now())

  derivedFactValue   RegulatoryFactValue @relation("DerivedFactInputs", fields: [derivedFactValueId], references: [id], onDelete: Restrict)
  inputFactValue     RegulatoryFactValue @relation("FactValueUsedAsDerivationInput", fields: [inputFactValueId], references: [id], onDelete: Restrict)

  @@unique([derivedFactValueId, inputFactValueId])
  @@index([derivedFactValueId])
  @@index([inputFactValueId])
}
```

RegulatoryFactValue therefore gains:

```prisma
derivationInputs      RegulatoryFactDerivationInput[] @relation("DerivedFactInputs")
usedAsDerivationInput RegulatoryFactDerivationInput[] @relation("FactValueUsedAsDerivationInput")
```

---

# 110. Derived Fact Safety

APPLICATION-ENFORCED:

```text
sourceType = SYSTEM_DERIVATION
→ derivationKey required
→ derivationVersion required
→ required derivation inputs preserved where the derivation consumes regulatory facts
```

A derived fact may also depend on non-fact sources.

Those sources remain represented through RegulatoryFactValueSource.

A derivation result does not automatically inherit VERIFIED authority from its inputs.

---

# 111. Derivation Cycle Safety

The derivation graph must not permit a fact-value version to depend directly or indirectly on itself.

APPLICATION-ENFORCED:

```text
derivedFactValueId != inputFactValueId
```

and the service must prevent transitive derivation cycles.

A simple local foreign-key constraint cannot prove global acyclicity.

The future derivation service must validate the graph transactionally.

---
# 112. Snapshot Source-Lineage Resolution

The original snapshot proposal used:

```text
sourceRegulatoryFact onDelete: SetNull
sourceFactValue onDelete: SetNull
```

The stress test rejects this as the normal production policy.

Assessment snapshots preserve copied historical meaning, but source regulatory fact lineage remains part of regulatory auditability.

The revised proposal uses:

```prisma
sourceRegulatoryFact RegulatoryFact?      @relation(fields: [sourceRegulatoryFactId], references: [id], onDelete: Restrict)
sourceFactValue      RegulatoryFactValue? @relation(fields: [sourceFactValueId], references: [id], onDelete: Restrict)
```

Nullable source IDs remain necessary because an UNKNOWN snapshot may legitimately have no source authoritative fact/value.

Nullable does not imply deletable.

---

# 113. Actor Lineage Resolution

Actor relations currently use:

```text
onDelete: SetNull
```

This avoids permanently preventing User deletion solely because the user performed a regulatory action.

However, SetNull can weaken historical actor lineage.

The proposal therefore distinguishes:

```text
live account relation
```

from:

```text
historical actor identity
```

Before production implementation of regulatory authority workflows, historical records that depend on actor attribution must preserve sufficient copied actor metadata or immutable audit identity to remain intelligible if the User row is later removed or anonymized.

The exact privacy-safe actor snapshot structure is DEFERRED to the retention/privacy schema review.

SetNull does not authorize silent loss of audit meaning.

---

# 114. Current-Authority Target Uniqueness Resolution

The following target-side uniqueness constraints are retained:

```prisma
CurrentRegulatoryFactAuthority.regulatoryFactValueId @unique

CurrentApplicabilityDefinitionAuthority.applicabilityDefinitionId @unique

CurrentApplicabilityResolutionAuthority.revisionId @unique
```

They are logically redundant with target ownership in several normal paths, but they make the intended one-to-one current-authority relationship explicit.

They prevent one target version from being selected by multiple authority rows.

The storage/index cost is acceptable relative to the clarity of the invariant.

The application must still verify that each selected target belongs to the stable identity referenced by the same authority row.

---

# 115. Generic AuthorityTransition Stress-Test Result

The generic AuthorityTransition model fails the preferred relational-integrity standard for the applicability domain.

Its polymorphic:

```text
authorityRecordId
previousTargetId
newTargetId
```

cannot be protected by ordinary foreign keys to the correct domain tables.

This creates an avoidable possibility of audit rows referencing nonexistent or incorrect targets.

The generic model is therefore withdrawn from the exact implementation proposal.

---

# 116. Typed Authority Transition Strategy

Applicability persistence will use domain-specific typed transition models for the three new applicability authority domains:

```text
RegulatoryFactAuthorityTransition
ApplicabilityDefinitionAuthorityTransition
ApplicabilityResolutionAuthorityTransition
```

Each transition preserves real foreign keys to:

```text
stable authority subject
previous target where one existed
new target
actor where available
transition reason
transition time
```

Assessment authority remains a separate locked domain.

No change to CurrentAssessmentAuthority behavior is authorized here.

---

# 117. Proposed RegulatoryFactAuthorityTransition Model

```prisma
model RegulatoryFactAuthorityTransition {
  id                  String   @id @default(cuid())
  regulatoryFactId    String
  previousFactValueId String?
  newFactValueId      String
  establishedById     String?
  reason              String?
  transitionedAt      DateTime @default(now())
  createdAt           DateTime @default(now())

  regulatoryFact      RegulatoryFact      @relation(fields: [regulatoryFactId], references: [id], onDelete: Restrict)
  previousFactValue   RegulatoryFactValue? @relation("PreviousRegulatoryFactAuthorityValue", fields: [previousFactValueId], references: [id], onDelete: Restrict)
  newFactValue        RegulatoryFactValue  @relation("NewRegulatoryFactAuthorityValue", fields: [newFactValueId], references: [id], onDelete: Restrict)
  establishedBy       User?                @relation("RegulatoryFactAuthorityTransitionEstablishedBy", fields: [establishedById], references: [id], onDelete: SetNull)

  @@index([regulatoryFactId, transitionedAt])
  @@index([previousFactValueId])
  @@index([newFactValueId])
  @@index([establishedById])
}
```

APPLICATION-ENFORCED:

```text
previousFactValue, when present, belongs to regulatoryFactId
newFactValue belongs to regulatoryFactId
transition is created atomically with current-authority change
```

---

# 118. RegulatoryFactValue Transition Inverses

RegulatoryFactValue gains:

```prisma
previousAuthorityTransitions RegulatoryFactAuthorityTransition[] @relation("PreviousRegulatoryFactAuthorityValue")
newAuthorityTransitions      RegulatoryFactAuthorityTransition[] @relation("NewRegulatoryFactAuthorityValue")
```

RegulatoryFact gains:

```prisma
authorityTransitions RegulatoryFactAuthorityTransition[]
```

User gains:

```prisma
regulatoryFactAuthorityTransitionsEstablished RegulatoryFactAuthorityTransition[] @relation("RegulatoryFactAuthorityTransitionEstablishedBy")
```

---

# 119. Proposed ApplicabilityDefinitionAuthorityTransition Model

```prisma
model ApplicabilityDefinitionAuthorityTransition {
  id                                String   @id @default(cuid())
  requirementId                     String
  previousApplicabilityDefinitionId String?
  newApplicabilityDefinitionId      String
  establishedById                   String?
  reason                            String?
  transitionedAt                    DateTime @default(now())
  createdAt                         DateTime @default(now())

  requirement                     ComplianceRequirement    @relation(fields: [requirementId], references: [id], onDelete: Restrict)
  previousApplicabilityDefinition ApplicabilityDefinition? @relation("PreviousApplicabilityDefinitionAuthority", fields: [previousApplicabilityDefinitionId], references: [id], onDelete: Restrict)
  newApplicabilityDefinition      ApplicabilityDefinition  @relation("NewApplicabilityDefinitionAuthority", fields: [newApplicabilityDefinitionId], references: [id], onDelete: Restrict)
  establishedBy                  User?                     @relation("ApplicabilityDefinitionAuthorityTransitionEstablishedBy", fields: [establishedById], references: [id], onDelete: SetNull)

  @@index([requirementId, transitionedAt])
  @@index([previousApplicabilityDefinitionId])
  @@index([newApplicabilityDefinitionId])
  @@index([establishedById])
}
```

APPLICATION-ENFORCED:

```text
previous definition, when present, belongs to requirementId
new definition belongs to requirementId
new definition satisfies current-rule governance
transition is atomic with authority change
```

---

# 120. ApplicabilityDefinition Transition Inverses

ApplicabilityDefinition gains:

```prisma
previousAuthorityTransitions ApplicabilityDefinitionAuthorityTransition[] @relation("PreviousApplicabilityDefinitionAuthority")
newAuthorityTransitions      ApplicabilityDefinitionAuthorityTransition[] @relation("NewApplicabilityDefinitionAuthority")
```

ComplianceRequirement gains:

```prisma
applicabilityDefinitionAuthorityTransitions ApplicabilityDefinitionAuthorityTransition[]
```

User gains:

```prisma
applicabilityDefinitionAuthorityTransitionsEstablished ApplicabilityDefinitionAuthorityTransition[] @relation("ApplicabilityDefinitionAuthorityTransitionEstablishedBy")
```

---

# 121. Proposed ApplicabilityResolutionAuthorityTransition Model

```prisma
model ApplicabilityResolutionAuthorityTransition {
  id                 String   @id @default(cuid())
  applicabilityId    String
  previousRevisionId String?
  newRevisionId      String
  establishedById    String?
  reason             String?
  transitionedAt     DateTime @default(now())
  createdAt          DateTime @default(now())

  applicability    AssessmentRequirementApplicability          @relation(fields: [applicabilityId], references: [id], onDelete: Restrict)
  previousRevision AssessmentRequirementApplicabilityRevision? @relation("PreviousApplicabilityResolutionAuthority", fields: [previousRevisionId], references: [id], onDelete: Restrict)
  newRevision      AssessmentRequirementApplicabilityRevision  @relation("NewApplicabilityResolutionAuthority", fields: [newRevisionId], references: [id], onDelete: Restrict)
  establishedBy    User?                                       @relation("ApplicabilityResolutionAuthorityTransitionEstablishedBy", fields: [establishedById], references: [id], onDelete: SetNull)

  @@index([applicabilityId, transitionedAt])
  @@index([previousRevisionId])
  @@index([newRevisionId])
  @@index([establishedById])
}
```

APPLICATION-ENFORCED:

```text
previous revision, when present, belongs to applicabilityId
new revision belongs to applicabilityId
assessment lifecycle permits authority transition
transition is atomic with current-authority change
```

---

# 122. Applicability Resolution Transition Inverses

AssessmentRequirementApplicabilityRevision gains:

```prisma
previousAuthorityTransitions ApplicabilityResolutionAuthorityTransition[] @relation("PreviousApplicabilityResolutionAuthority")
newAuthorityTransitions      ApplicabilityResolutionAuthorityTransition[] @relation("NewApplicabilityResolutionAuthority")
```

AssessmentRequirementApplicability gains:

```prisma
authorityTransitions ApplicabilityResolutionAuthorityTransition[]
```

User gains:

```prisma
applicabilityResolutionAuthorityTransitionsEstablished ApplicabilityResolutionAuthorityTransition[] @relation("ApplicabilityResolutionAuthorityTransitionEstablishedBy")
```

---

# 123. Existing Generic AuthorityTransition Withdrawal

Sections 39–41 proposed:

```text
AuthorityDomain
AuthorityTransition
```

Those structures are superseded by Sections 115–122.

They are retained earlier in this document only as design history until the final proposal normalization pass.

They are NOT part of the revised implementation candidate.

The final normalization pass must remove:

```text
AuthorityDomain
AuthorityTransition
Organization.authorityTransitions
Framework.authorityTransitions
User.authorityTransitionsActor
```

and replace the relevant existing-model inverse additions with the typed transition relations defined in this Part.

No implementation may use the superseded generic model.

---

# 124. Assessment Authority Audit Boundary

CurrentAssessmentAuthority remains locked and separate.

This Part does not add an AssessmentAuthorityTransition table.

The need for typed transition history in the assessment-authority domain should be evaluated as a controlled extension of that already-locked milestone.

The absence of that extension does not permit the three new applicability authority domains to use weak polymorphic audit identifiers.

---
# 125. Revised New Model Inventory

The revised applicability proposal consists of the original 13 core persistence models plus six supporting integrity and provenance models:

```text
RegulatoryFactDefinitionOption
RegulatoryFactValueSource
RegulatoryFactDerivationInput
RegulatoryFactAuthorityTransition
ApplicabilityDefinitionAuthorityTransition
ApplicabilityResolutionAuthorityTransition
```

Therefore the revised implementation candidate contains:

```text
13 core applicability models
+
6 supporting integrity/provenance models
=
19 applicability-related models
```

The superseded generic:

```text
AuthorityTransition
```

is not included in the canonical implementation candidate.

---

# 126. Revised Enum Inventory

The original applicability proposal contained 11 applicability-domain enums.

The revised proposal adds:

```text
RegulatoryFactValueSourceType
```

Therefore the revised applicability implementation candidate contains:

```text
12 applicability-domain enums
```

The superseded:

```text
AuthorityDomain
```

is not included in the canonical implementation candidate.

---

# 127. Normalized Tenant Integrity Resolution

The stress test does not require redundant organizationId or frameworkId columns on every proposed historical model in V1.

The normalized relation graph is retained.

High-risk equality invariants remain mandatory transactional application checks.

Examples include:

```text
RegulatoryFact.organizationId
=
ApplicabilityContext.organizationId

RegulatoryFactDefinition.frameworkId
=
ApplicabilityContext.frameworkId

Assessment.organizationId
=
AssessmentRequirementApplicability.context.organizationId

Assessment.frameworkId
=
AssessmentRequirementApplicability.requirement.frameworkId
=
AssessmentRequirementApplicability.context.frameworkId

ApplicabilityDefinition.requirementId
=
AssessmentRequirementApplicability.requirementId
for the definition used by a resolution revision
```

This decision may later be strengthened with composite database constraints where:

```text
Prisma compatibility
migration complexity
query cost
operational value
```

justify the redundancy.

No cross-tenant invariant is weakened merely because V1 enforcement occurs transactionally.

---

# 128. Database Immutability Resolution

The proposal continues to require append-only behavior for:

```text
RegulatoryFactValue

AssessmentRegulatoryFactSnapshot once relied upon

AssessmentRequirementApplicabilityRevision

DeterminationFactBasis

RegulatoryFactAuthorityTransition

ApplicabilityDefinitionAuthorityTransition

ApplicabilityResolutionAuthorityTransition
```

The exact use of:

```text
PostgreSQL triggers
restricted database roles
service-only write paths
```

is deferred to migration and deployment design.

The requirement itself is NOT deferred.

Only its physical enforcement mechanism is deferred.

Mutable current-authority pointers remain separate from immutable historical records.

---

# 129. Version Allocation Resolution

The schema retains explicit integer:

```text
version
revision
```

fields.

Allocation must be concurrency-safe.

The future service must not use an unprotected:

```text
MAX(version) + 1
```

or:

```text
MAX(revision) + 1
```

outside a concurrency-safe transaction.

The exact transaction isolation, retry, locking, or advisory-lock strategy belongs to service implementation design.

Database uniqueness remains the final collision guard.

A failed version allocation must not silently overwrite or reinterpret an existing historical version.

---

# 130. Idempotency Resolution

No persisted idempotency-key model is required during this schema-foundation proposal.

Before externally retryable public mutation APIs are introduced, mutation design must determine whether persisted idempotency keys are required.

Internal unique identities and transactions provide structural protection but are not automatically equivalent to API idempotency.

Repeated client requests must never create contradictory authority history merely because a network response was lost.

This remains an API and service-boundary gate.

---

# 131. Multiple-Context Scoring Resolution

Persistence supports multiple applicability contexts for one Assessment × Requirement.

For example, one requirement may become applicable through:

```text
multiple security events
multiple data-subject matters
multiple transfers
multiple relationships
multiple automated-decision systems
```

This proposal deliberately does not decide how several APPLICABLE contexts collapse into one requirement-level score contribution.

Until that integration rule is separately approved:

```text
applicability persistence may exist
```

but:

```text
multiple-context applicability must not be connected to production scoring
```

in a way that changes the locked Evidence Engine denominator.

This remains a hard production gate.

---

# 132. Framework Cascade Resolution

The existing Framework → ComplianceRequirement cascade is not modified by this documentation milestone.

New historical applicability relations using Restrict may naturally prevent destructive cascades where historical regulatory state exists.

The migration stress test must verify actual PostgreSQL and Prisma behavior before implementation.

No service should expose physical Framework deletion while regulatory history depends on it.

Catalogue retirement is preferable to destructive deletion once historical assessment meaning exists.

---

# 133. Organization Deletion Resolution

Organization physical deletion remains unresolved because it intersects:

```text
privacy
retention
legal hold
regulatory audit
anonymization
tenant lifecycle
```

New applicability persistence remains preservation-first.

No migration may silently copy existing cascade behavior into historical regulatory records.

Until a retention and privacy policy explicitly resolves physical deletion:

```text
historical regulatory integrity takes precedence over convenient destructive cascade behavior
```

This does not decide permanent retention.

It prevents accidental deletion policy from being embedded in the schema without governance review.

---

# 134. Revised Evidence Engine Boundary

Nothing in this stress-test revision changes the locked Evidence Engine.

The integration contract remains:

```text
authoritative applicability determination
        ↓
APPLICABLE only
        ↓
locked evidence-driven compliance engine
```

NOT_APPLICABLE is excluded.

UNDETERMINED is excluded from the compliance denominator but surfaced through applicability coverage.

No provenance, option, derivation, or authority-transition model changes this rule.

Applicability filtering remains upstream of evidence scoring.

---

# 135. Revised AI Authority Boundary

AI may:

```text
suggest facts
extract candidate facts
identify possible sources
propose applicability reasoning
explain deterministic resolutions
flag uncertainty
```

AI may not:

```text
invent regulatory facts
convert UNKNOWN to false
self-verify a fact
self-approve a regulatory rule
self-establish legal applicability authority
silently satisfy required human regulatory review
```

Typed provenance and derivation lineage strengthen explainability but do not increase AI legal authority.

AI remains advisory.

---

# 136. Revised Migration Zero-Truth Rule

The future migration may create:

```text
tables
foreign keys
indexes
enums
local database constraints
```

It must not manufacture:

```text
organization regulatory facts
KNOWN values
VERIFIED authority
current fact authority
current rule authority
assessment fact snapshots
applicability determinations
current applicability resolution authority
compliance score changes
trust score changes
```

No silent regulatory backfill is permitted.

Production truth begins only through authorized fact and resolution workflows.

Empty persistence structures remain preferable to fabricated regulatory certainty.

---

# 137. Proposal Normalization Requirement

Before 8A.3.4B may be locked, the proposal must undergo one final normalization pass.

That pass must:

```text
remove superseded generic AuthorityTransition proposal blocks
remove superseded AuthorityDomain enum

remove:
Organization.authorityTransitions
Framework.authorityTransitions
User.authorityTransitionsActor

replace the Document inverse relation

add RegulatoryFactDefinition.allowedContextTypes
add RegulatoryFactDefinition.options

add @default([]) to both canonical MULTI_VALUE arrays

remove direct RegulatoryFactValue.documentId
remove direct RegulatoryFactValue.document

add RegulatoryFactValue.sources

add RegulatoryFactValue derivation inverse relations

apply snapshot source Restrict semantics

add RegulatoryFactDefinitionOption

add RegulatoryFactValueSource

add RegulatoryFactDerivationInput

add RegulatoryFactAuthorityTransition

add ApplicabilityDefinitionAuthorityTransition

add ApplicabilityResolutionAuthorityTransition

add all typed transition inverse relations

reconcile all User relation names

reconcile all self-relation names

verify exactly one canonical proposal per model

verify exactly one canonical proposal per enum
```

The normalization pass remains documentation-only.

It does not edit `schema.prisma`.

It does not create migrations.

---

# 138. Stress-Test Release Gate

The revised proposal may advance only if the normalized document proves:

```text
19 canonical applicability-related model declarations

12 canonical applicability-domain enum declarations

one canonical proposal per model

one canonical proposal per enum

no superseded generic AuthorityTransition model

no superseded AuthorityDomain enum

all Prisma relation pairs represented

typed transition foreign keys preserved

fact context scope explicit

MULTI_VALUE uncertainty semantics explicit

controlled option vocabulary explicit

multi-source provenance explicit

derived-fact lineage explicit

historical source lineage preservation explicit

current authority remains explicit

latest version remains non-authoritative

tenant boundaries remain explicit

completed assessment history remains protected

Evidence Engine remains unchanged

AI remains non-authoritative

migration remains zero-truth

no silent regulatory backfill

schema.prisma remains untouched

migrations remain untouched
```

Any failed critical item blocks locking.

Passing document structure alone is insufficient.

The canonical proposal must also survive the final relational consistency audit.

---

# 139. Stress-Test Conclusion

The persistence architecture remains viable after stress testing.

The stress test strengthens the proposal in five important dimensions:

```text
scope
typed-value semantics
provenance
derivation lineage
authority audit integrity
```

The revised architecture continues to preserve:

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

LATEST VERSION ≠ CURRENT AUTHORITY
```

No implementation is authorized yet.

The next operation is proposal normalization, followed by the final consistency gate.

Only after that gate passes may Milestone 8A.3.4B be considered for lock and commit.

---
