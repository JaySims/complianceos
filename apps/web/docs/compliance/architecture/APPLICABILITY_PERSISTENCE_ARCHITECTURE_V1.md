# Applicability Persistence Architecture V1

## 1. Document Status

**Milestone:** 8A.3.4 — Applicability Persistence Architecture
**Status:** DESIGN DRAFT — NOT YET IMPLEMENTED
**Domain:** Regulatory Applicability Persistence
**Primary Framework Context:** POPIA
**Architecture Scope:** Framework-agnostic applicability persistence

**Depends on:**

- `APPLICABILITY_DOMAIN_MODEL_V1.md`
- `POPIA_APPLICABILITY_RESOLUTION_GRAMMAR_V1.md`
- `POPIA_APPLICABILITY_FACT_MATRIX_V1.md`

This document defines the persistence architecture required to support
regulatory applicability in ComplianceOS.

It translates the locked applicability doctrine into durable domain
boundaries without yet creating database models.

This document does not:

- modify `prisma/schema.prisma`;
- create Prisma models;
- create database migrations;
- provision POPIA catalogue records;
- create production regulatory facts;
- create production applicability rules;
- create API routes;
- create service implementations;
- modify the evidence engine;
- modify requirement-status precedence;
- modify compliance scoring;
- modify assessment lifecycle rules;
- modify Current Assessment Authority;
- modify organization compliance aggregation;
- modify Trust Score;
- modify Executive AI;
- authorize AI to establish legal applicability;
- authorize production applicability resolution; or
- authorize production scoring from applicability.

Implementation requires a separately reviewed and approved milestone.

---

# 2. Purpose

ComplianceOS already has durable persistence for:

```text
Organization
Framework
ComplianceRequirement
Assessment
CurrentAssessmentAuthority
Evidence
Document
```

The locked applicability architecture establishes that an active
catalogue requirement must not automatically enter an assessment's
compliance-score denominator.

Applicability must first be resolved.

The required conceptual pipeline is:

```text
Regulatory Catalogue
        ↓
Applicability Definition
        ↓
Regulatory Facts
        ↓
Applicability Resolution
        ↓
Applicable Requirements
        ↓
Evidence
        ↓
Verification
        ↓
Requirement Compliance Status
        ↓
Compliance Score
```

Persistence must therefore support the regulatory state that exists
between the catalogue and the evidence engine.

The persistence architecture must answer:

1. What regulatory facts exist?
2. Which organization owns a fact?
3. What was the fact value at assessment time?
4. Where did the fact come from?
5. Is the fact sufficiently authoritative?
6. Is the fact still current?
7. Which applicability rule applies to a requirement?
8. Which version of that rule was used?
9. What context was the rule evaluated within?
10. What applicability result was reached?
11. Why was that result reached?
12. Can the historical determination be reproduced later?
13. Can unresolved scope remain visible without distorting compliance?
14. Can event and matter obligations be represented safely?
15. Can tenant boundaries be enforced structurally?

---

# 3. Governing Doctrine

The persistence model must preserve the following locked invariants:

```text
ACTIVE ≠ APPLICABLE
MANDATORY ≠ UNIVERSAL
MISSING EVIDENCE ≠ NOT_APPLICABLE
UNKNOWN FACT ≠ FALSE
UNDETERMINED ≠ COMPLIANT
```

It must also preserve:

```text
Applicability precedes evidence scoring.
```

and:

```text
Only APPLICABLE requirements may enter
the evidence-driven compliance engine.
```

`NOT_APPLICABLE` requirements are excluded from the applicable
requirement set.

`UNDETERMINED` requirements are excluded from the compliance-score
denominator but remain visible as unresolved regulatory scope.

Persistence must never create a mechanism by which missing facts can
silently improve an organization's compliance result.

---

# 4. Existing Persistence Baseline

The current Prisma schema already establishes the following important
ownership boundaries.

## 4.1 Organization

`Organization` is the tenant-level business entity.

It currently owns or relates to:

- assessments;
- current assessment authorities;
- documents;
- users;
- organization memberships;
- workflow progress; and
- executive missions.

Applicability persistence must preserve `Organization` as the primary
tenant boundary for organization-specific regulatory facts.

## 4.2 Framework

`Framework` represents a compliance framework.

It currently owns:

```text
ComplianceRequirement[]
Assessment[]
CurrentAssessmentAuthority[]
```

Framework is therefore the natural parent boundary for framework-level
regulatory fact definitions.

## 4.3 ComplianceRequirement

`ComplianceRequirement` represents an atomic regulatory obligation.

It already stores:

- code;
- title;
- description;
- category;
- authority;
- regulatory source title;
- source reference;
- source URL;
- effective date;
- mandatory status;
- weight;
- active status;
- framework relation;
- evidence relation.

Applicability definitions must bind to a specific
`ComplianceRequirement`.

## 4.4 Assessment

`Assessment` already binds:

```text
Organization
+
Framework
+
User
+
Assessment lifecycle
+
Assessment score
+
Evidence
```

Assessment is therefore the correct historical evaluation context for
assessment-time regulatory fact snapshots and requirement applicability
determinations.

## 4.5 CurrentAssessmentAuthority

`CurrentAssessmentAuthority` separately determines which assessment is
currently authoritative for an:

```text
Organization × Framework
```

Applicability persistence must not collapse this authority concept into
the applicability domain.

Authority selection and applicability resolution remain separate.

## 4.6 Evidence

Evidence currently belongs to an assessment and may reference a
requirement and document.

Evidence remains downstream of applicability.

Applicability persistence must not change Evidence into a scope
determination mechanism.

---

# 5. Persistence Domain Overview

The proposed persistence domain contains six primary concepts:

```text
RegulatoryFactDefinition
RegulatoryFactValue
ApplicabilityDefinition
ApplicabilityContext
AssessmentRegulatoryFactSnapshot
AssessmentRequirementApplicability
```

Conceptually:

```text
Framework
   │
   ├──────── RegulatoryFactDefinition
   │                    │
   │                    ▼
   │            RegulatoryFactValue
   │                    │
   │                    ▼
   │       AssessmentRegulatoryFactSnapshot
   │
   └── ComplianceRequirement
              │
              ▼
      ApplicabilityDefinition
              │
              │
Assessment ───┼──── ApplicabilityContext
              │
              ▼
AssessmentRequirementApplicability
              │
              ▼
      APPLICABLE only
              │
              ▼
Existing Evidence-Driven Compliance Engine
```

These names are conceptual architecture names.

They are not approved Prisma model names until the persistence
implementation milestone explicitly approves them.

---

# 6. RegulatoryFactDefinition

## 6.1 Purpose

`RegulatoryFactDefinition` describes a type of regulatory fact that
ComplianceOS may establish.

Examples from the POPIA matrix include:

```text
processing.collects_personal_information
processing.special_personal_information
processing.children_personal_information
relationships.operator_processes_personal_information
security.qualifying_compromise
marketing.electronic_direct_marketing
automation.solely_automated_decision
transfers.personal_information_to_foreign_country_third_party
```

A fact definition describes the question.

It does not store an organization's answer.

## 6.2 Ownership

A fact definition should belong to a `Framework`.

Conceptually:

```text
Framework
    1
    │
    └── *
RegulatoryFactDefinition
```

This prevents unrelated frameworks from accidentally sharing a fact
definition merely because they use similar terminology.

Future architecture may explicitly support cross-framework reusable
facts.

That is outside V1.

## 6.3 Conceptual attributes

A future definition may require:

```text
id
frameworkId
key
name
description
valueType
scopeType
active
sourceTitle
sourceReference
sourceUrl
effectiveFrom
version
createdAt
updatedAt
```

This list is architectural, not a Prisma schema.

## 6.4 Fact key

The fact key must be stable and machine-readable.

Example:

```text
processing.special_personal_information
```

Within a framework, the fact key should be unique.

Conceptually:

```text
UNIQUE(frameworkId, key)
```

Global uniqueness is not required by this architecture.

## 6.5 Value type

Potential fact value types include:

```text
BOOLEAN
STRING
NUMBER
DATE
ENUM
MULTI_VALUE
EVENT
```

The final persistence representation is deferred.

The architecture must not assume that all regulatory facts are Boolean.

## 6.6 Scope type

A fact definition should indicate the kind of context in which the fact
is meaningful.

Potential conceptual scopes include:

```text
ORGANIZATION
ASSESSMENT
PROCESSING_ACTIVITY
RELATIONSHIP
EVENT
MATTER
TRANSFER
SYSTEM
OTHER
```

The final vocabulary requires implementation review.

## 6.7 Definition versioning

Fact definitions may evolve.

A later change to:

- meaning;
- legal source;
- expected value;
- scope;
- authority requirements; or
- interpretation

must not silently rewrite historical assessments.

Definition versioning must therefore be supported conceptually.

---

# 7. RegulatoryFactValue

## 7.1 Purpose

`RegulatoryFactValue` represents the organization's current known
regulatory state for a defined fact.

Conceptually:

```text
Organization
+
RegulatoryFactDefinition
+
Context
+
Value
+
Knowledge State
+
Provenance
+
Freshness
```

## 7.2 Ownership

Every organization fact value must belong to exactly one
`Organization`.

Conceptually:

```text
Organization
    1
    │
    └── *
RegulatoryFactValue
```

This is a primary tenant-integrity boundary.

## 7.3 Definition relation

Every fact value must reference an approved
`RegulatoryFactDefinition`.

A value must not exist as an arbitrary unregistered fact key.

This protects:

- validation;
- rule execution;
- framework integrity;
- provenance;
- explainability; and
- versioning.

## 7.4 Conceptual attributes

A future fact value may require:

```text
id
organizationId
factDefinitionId
contextId?
value
knowledgeState
authorityState
sourceType
sourceReference?
establishedAt
reviewedAt?
validFrom?
validUntil?
establishedByUserId?
supportingBasis?
createdAt
updatedAt
```

Exact field names and data representation are deferred.

## 7.5 Current fact state

A `RegulatoryFactValue` represents current or currently accepted
organizational regulatory state.

It is not itself the historical assessment snapshot.

This distinction is fundamental.

## 7.6 Unknown is explicit

Unknown regulatory state must not be represented merely by the absence
of a row if that absence would be interpreted as false.

The domain must be capable of distinguishing:

```text
Known TRUE
Known FALSE
Unknown
```

Potential future authority states may include:

```text
DECLARED
VERIFIED
DISPUTED
STALE
```

The final state vocabulary remains deferred.

## 7.7 No evidence inference shortcut

The absence of compliance evidence must not create a false regulatory
fact.

Example:

```text
No operator agreement
```

must not automatically produce:

```text
relationships.operator_processes_personal_information = FALSE
```

Likewise:

```text
No consent record
```

must not produce:

```text
marketing.electronic_direct_marketing = FALSE
```

Fact establishment and compliance evidence remain separate.

---

# 8. Fact Provenance

## 8.1 Requirement

Every authoritative fact must be explainable.

The system should be capable of answering:

> Why does ComplianceOS believe this fact?

## 8.2 Potential provenance sources

A fact may originate from:

```text
organization declaration
authorized user declaration
processing inventory
data-flow register
operator register
contract register
system inventory
marketing register
security incident
data-subject matter
legal review
compliance review
verified document
verified evidence
approved integration
authorized derived fact
other approved source
```

## 8.3 Provenance is not optional metadata

Where a fact can affect whether a legal obligation enters or leaves the
compliance-score denominator, provenance is part of the regulatory
decision record.

A production applicability system must not rely on unexplained Boolean
values.

## 8.4 Actor provenance

Where a human establishes, verifies, disputes, or reviews a fact, the
architecture should preserve the responsible actor where appropriate.

A future implementation may reference a user or another authority
record.

Exact actor modeling is deferred.

---

# 9. Fact Freshness

## 9.1 Regulatory reality changes

Organization facts may become stale.

Examples include:

```text
operator relationships
processing activities
marketing activities
international transfers
automated decision systems
security events
```

A fact established during onboarding must not silently remain
authoritative forever.

## 9.2 Freshness metadata

Future persistence should be capable of representing:

```text
establishedAt
reviewedAt
validFrom
validUntil
freshness policy
stale state
```

Not every fact requires all of these fields.

## 9.3 Stale does not mean false

If a fact becomes stale:

```text
STALE ≠ FALSE
```

A stale fact may cause applicability to become:

```text
UNDETERMINED
```

until reviewed.

It must not silently produce `NOT_APPLICABLE`.

---

# 10. Fact History

The architecture must preserve the ability to understand how regulatory
facts changed over time.

Two possible implementation strategies exist:

```text
A. mutable current row + separate history
B. append-only/versioned fact values
```

This document does not select the final strategy.

However, the chosen implementation must satisfy:

- current state is identifiable;
- historical state is recoverable;
- assessment snapshots remain stable;
- provenance is retained;
- tenant boundaries remain intact; and
- changes are auditable.

---

# 11. ApplicabilityDefinition

## 11.1 Purpose

`ApplicabilityDefinition` represents the approved applicability rule
associated with a `ComplianceRequirement`.

It answers:

> How should ComplianceOS determine whether this requirement applies?

## 11.2 Ownership

Every applicability definition belongs to exactly one
`ComplianceRequirement`.

Conceptually:

```text
ComplianceRequirement
       1
       │
       └── *
ApplicabilityDefinition
```

Multiple definitions may exist historically because rules can be
versioned.

Only an explicitly approved version may be used for new resolution.

## 11.3 Conceptual attributes

A future applicability definition may require:

```text
id
requirementId
version
applicabilityClass
resolutionPattern
ruleRepresentation
requiredFactDefinitions
effectiveFrom
effectiveUntil?
active
sourceTitle?
sourceReference?
sourceUrl?
reviewStatus
createdAt
updatedAt
```

This is conceptual only.

## 11.4 Rule versioning

Applicability rules must be versioned.

Historical assessments must not ask:

> What does the applicability rule mean today?

They must be able to establish:

> Which rule version was used when this assessment was resolved?

## 11.5 Rule immutability

Once a rule version has been used in an authoritative assessment
determination, its historical meaning must not be mutated in place.

A substantive legal or logic change should create a new version.

## 11.6 Required facts

An applicability definition may depend on:

- zero facts;
- one fact;
- multiple facts;
- event context;
- matter context;
- a compound expression;
- human legal determination; or
- another approved resolution basis.

The architecture must not assume one fact per requirement.

---

# 12. Applicability Rule Representation

The persistence layer must support deterministic rule identity without
prematurely embedding arbitrary executable code into the database.

Potential approaches include:

```text
structured rule expression
rule type + parameters
versioned domain configuration
approved rule identifier
```

Raw executable JavaScript or arbitrary user-authored expressions should
not become the default persistence strategy.

The implementation milestone must choose a representation that is:

- deterministic;
- validated;
- versioned;
- explainable;
- testable;
- non-arbitrary;
- tenant-safe; and
- suitable for regulatory review.

---

# 13. ApplicabilityContext

## 13.1 Purpose

Applicability is not always organization-wide.

Some requirements depend on a particular:

- event;
- matter;
- processing activity;
- operator relationship;
- transfer;
- system;
- decision process; or
- other bounded regulatory context.

`ApplicabilityContext` provides identity for that scope.

## 13.2 Why context must be first-class

Consider:

```text
POPIA-SEC-005
```

A qualifying security compromise may occur in one incident.

That does not mean the organization permanently has an active security
breach.

Likewise:

```text
POPIA-DSP-003
```

may apply because of a particular data-subject request or dispute.

A permanent organization-wide Boolean cannot represent these cases
safely.

## 13.3 Conceptual context types

Potential types include:

```text
ORGANIZATION
ASSESSMENT
PROCESSING_ACTIVITY
RELATIONSHIP
EVENT
MATTER
TRANSFER
SYSTEM
AUTOMATED_DECISION
OTHER
```

The final enum is deferred.

## 13.4 Ownership

Every applicability context must be tenant-bound.

Conceptually:

```text
Organization
    1
    │
    └── *
ApplicabilityContext
```

Assessment-specific contexts may additionally reference an
`Assessment`.

## 13.5 Conceptual attributes

A future context may require:

```text
id
organizationId
assessmentId?
type
externalReference?
name?
description?
occurredAt?
openedAt?
closedAt?
createdAt
updatedAt
```

Exact persistence is deferred.

## 13.6 No arbitrary context trust

A client-supplied context ID must not establish authority.

Services must verify that the context belongs to:

```text
the active organization
+
the relevant assessment where applicable
```

before using it for resolution.

---

# 14. Event Context

Event-triggered applicability requires special treatment.

For example:

```text
security.qualifying_compromise
```

must be evaluated in relation to a specific event.

Conceptually:

```text
Organization
    ↓
Security Event Context
    ↓
security.qualifying_compromise
    ↓
POPIA-SEC-005 applicability
```

No event must not be represented as a permanent false statement about
the organization.

An event's closure also must not erase historical applicability.

---

# 15. Matter Context

Request or dispute triggered obligations may require a matter identity.

Conceptually:

```text
Organization
    ↓
Data Subject Matter
    ↓
data_subject.qualifying_request_or_dispute
    ↓
POPIA-DSP-003 applicability
```

The matter may have:

- opening date;
- status;
- relevant data subject;
- request type;
- dispute type;
- resolution date; and
- supporting records.

This document does not design a complete case-management subsystem.

It only establishes that applicability persistence must not destroy
matter-level identity.

---

# 16. AssessmentRegulatoryFactSnapshot

## 16.1 Purpose

`AssessmentRegulatoryFactSnapshot` preserves the regulatory fact state
actually relied upon by an assessment.

It is a historical record.

## 16.2 Core principle

An assessment must not depend exclusively on mutable current fact rows.

Unsafe design:

```text
Assessment
    ↓
reference current RegulatoryFactValue
    ↓
fact changes later
    ↓
historical assessment meaning changes
```

Required design:

```text
Current RegulatoryFactValue
        ↓
assessment resolution
        ↓
COPY relevant historical state
        ↓
AssessmentRegulatoryFactSnapshot
        ↓
immutable assessment history
```

## 16.3 Snapshot ownership

Every snapshot belongs to exactly one assessment.

Conceptually:

```text
Assessment
    1
    │
    └── *
AssessmentRegulatoryFactSnapshot
```

## 16.4 Snapshot definition relation

A snapshot should retain identity of the fact definition used.

However, historical interpretation must not depend solely on the
current mutable state of that definition.

The snapshot must preserve enough copied metadata to explain the fact
as understood at assessment time.

## 16.5 Conceptual attributes

A future snapshot may require:

```text
id
assessmentId
factDefinitionId
sourceFactValueId?
contextId?
factKeySnapshot
factDefinitionVersion
valueSnapshot
knowledgeStateSnapshot
authorityStateSnapshot
provenanceSnapshot
establishedAtSnapshot
reviewedAtSnapshot?
capturedAt
createdAt
```

Exact representation is deferred.

## 16.6 Source lineage

A snapshot may retain a reference to the source
`RegulatoryFactValue`.

That reference provides lineage.

It must not be the only historical record.

## 16.7 Snapshot immutability

Once relied upon for a persisted applicability determination, the
snapshot must be treated as immutable historical state.

Corrections should not silently overwrite history.

A correction may require:

- a new snapshot;
- a new applicability resolution;
- assessment lifecycle rules; or
- another controlled correction mechanism.

The exact correction workflow is deferred.

---

# 17. Why Copy Instead of Reference Only

Suppose:

```text
August:
marketing.electronic_direct_marketing = FALSE
```

An assessment is completed.

In October the organization begins electronic direct marketing:

```text
marketing.electronic_direct_marketing = TRUE
```

If the August assessment merely references the mutable current fact,
the historical record becomes ambiguous.

A copied snapshot preserves:

```text
August assessment:
FALSE as known at August resolution time
```

while the current organization fact can correctly become:

```text
October current state:
TRUE
```

This is required for regulatory defensibility.

---

# 18. AssessmentRequirementApplicability

## 18.1 Purpose

`AssessmentRequirementApplicability` records the resolved applicability
of one requirement within one assessment and relevant context.

Conceptually:

```text
Assessment
+
ComplianceRequirement
+
ApplicabilityContext
+
Rule Version
+
Fact Snapshot Basis
=
Applicability Determination
```

## 18.2 Status

The authoritative V1 result vocabulary is:

```text
APPLICABLE
NOT_APPLICABLE
UNDETERMINED
```

No evidence verification status may substitute for these states.

## 18.3 Ownership

Every determination belongs to an `Assessment`.

It also references the relevant `ComplianceRequirement`.

Conceptually:

```text
Assessment
    1
    │
    └── *
AssessmentRequirementApplicability
             *
             │
             1
ComplianceRequirement
```

## 18.4 Context

Where applicability is organization-wide, a context may be represented
through an explicit organization/assessment context according to the
final persistence strategy.

Where applicability is event-, matter-, activity-, or
relationship-specific, context identity must be preserved.

## 18.5 Conceptual attributes

A future determination may require:

```text
id
assessmentId
requirementId
contextId?
status
reason
resolutionBasis
applicabilityDefinitionId
ruleVersionSnapshot
ruleSnapshot?
resolvedAt
resolvedByUserId?
resolutionAuthority
createdAt
```

The final schema is deferred.

## 18.6 Explainability

A determination must be capable of answering:

```text
Which requirement?
Which assessment?
Which context?
Which facts?
Which fact values?
Which fact provenance?
Which rule?
Which rule version?
Which result?
Why?
When?
By whom or by what approved authority?
```

---

# 19. Determination Immutability

Once an applicability determination has contributed to an assessment
result, its historical meaning must not silently change.

The architecture must avoid:

```text
UPDATE historical determination
SET status = ...
```

as an uncontrolled correction mechanism.

Changes may require a new resolution record or another explicitly
versioned correction strategy.

The implementation milestone must define the lifecycle.

---

# 20. Fact-to-Determination Lineage

An applicability determination must retain sufficient lineage to the
fact snapshots used in resolution.

Potential implementation approaches include:

```text
join table between determination and snapshots
```

or:

```text
structured immutable resolution basis
```

The final design is deferred.

The architecture requirement is:

> A determination must be able to identify the historical fact inputs
> that produced it.

---

# 21. Rule-to-Determination Lineage

A determination must identify the applicability rule version used.

A mere reference to the current active rule is insufficient.

The historical record must preserve:

```text
rule identity
+
rule version
+
sufficient rule meaning
```

so that later rule changes do not rewrite the past.

---

# 22. Historical Reproducibility Equation

A defensible applicability determination requires:

```text
FACT STATE AT TIME T
+
RULE STATE AT TIME T
+
CONTEXT AT TIME T
=
APPLICABILITY RESULT AT TIME T
```

All four components must remain historically explainable.

This is a core persistence invariant.

---

# 23. General Requirements

`GENERAL_UNCONDITIONAL` requirements normally require no
requirement-specific organization fact once framework scope has been
established.

However, their assessment applicability result should still be
persistable.

Conceptually:

```text
Framework scope established
        ↓
GENERAL_UNCONDITIONAL
        ↓
APPLICABLE
```

This preserves a complete assessment applicability record rather than
implicitly assuming that missing determination rows mean applicable.

Missing determination rows must not acquire ambiguous semantics.

---

# 24. Framework Scope

The POPIA matrix assumes governing framework scope has already been
established.

Persistence architecture must therefore leave room for future explicit
framework-level applicability.

This document does not design that complete domain.

However:

```text
absence of framework-scope architecture
```

must not be solved by treating all frameworks as universally applicable.

A future milestone may introduce framework-level scope determination.

---

# 25. Conditional Requirements

Conditional requirements require fact-based resolution.

Simple pattern:

```text
Known TRUE
→ APPLICABLE

Known authoritative FALSE
→ NOT_APPLICABLE

Unknown / stale / disputed / insufficient
→ UNDETERMINED
```

Persistence must preserve the fact state that justified the result.

---

# 26. Compound Requirements

Compound applicability rules may depend on multiple facts.

Example:

```text
automation.solely_automated_decision
AND
automation.section_71_effect
```

The persistence model must not flatten a compound determination into a
single unexplained Boolean.

The resolution basis must preserve the contributing facts and approved
logic.

---

# 27. Three-Valued Logic Persistence

Three-valued applicability is not optional presentation logic.

It is part of the regulatory domain.

The persistence architecture must support:

```text
APPLICABLE
NOT_APPLICABLE
UNDETERMINED
```

Likewise, regulatory fact persistence must preserve the distinction
between:

```text
known false
```

and:

```text
unknown
```

A nullable Boolean interpreted casually by application code is not
sufficient architecture unless the implementation proves that unknown
semantics cannot be lost.

---

# 28. Exception Classification

The locked grammar distinguishes:

```text
APPLICABILITY_EXCEPTION
```

from:

```text
COMPLIANCE_CONTROL_EXCEPTION
```

Persistence must not create one generic:

```text
exception = true
```

field whose meaning is ambiguous.

Where exceptions affect applicability, the legal effect must be
represented through an approved rule.

Where exceptions merely alter compliance controls, they remain
downstream of applicability.

Unknown legal effect requires:

```text
REGULATORY_REVIEW
```

rather than automatic non-applicability.

---

# 29. Regulatory Review State

Certain facts or rules may require regulatory or legal review before
production use.

The persistence architecture should support the concept of review
status for:

- fact definitions;
- applicability definitions;
- rule versions; and
- potentially specific determinations.

Potential conceptual states include:

```text
DRAFT
REVIEW_REQUIRED
APPROVED
RETIRED
```

The final vocabulary is deferred.

A draft or review-required rule must not silently become production
authority.

---

# 30. ADM-002 Regulatory Boundary

The current POPIA applicability matrix contains the conceptual fact:

```text
automation.permitted_subject_to_safeguards
```

for:

```text
POPIA-ADM-002
```

This concept requires explicit regulatory review before persistence
implementation.

The architecture must distinguish between:

```text
legal scope / statutory permission condition
```

and:

```text
actual satisfaction of required safeguards
```

The latter belongs to compliance evidence.

Therefore:

```text
automation.permitted_subject_to_safeguards
```

must not be implemented as a production regulatory fact until its legal
meaning and boundary have been formally reviewed.

This document does not modify the locked 8A.3.3 matrix.

It establishes an implementation safety gate.

---

# 31. Prior Authorisation Boundary

The following facts must remain distinct:

```text
prior_authorisation.processing_may_fall_within_section_57
prior_authorisation.required
```

The first supports the screening obligation.

The second represents the authoritative determination that prior
authorisation is required.

The absence of:

- a screening document;
- an application;
- Regulator correspondence; or
- authorization

must not be used to infer either fact as false.

Those artifacts are compliance evidence.

---

# 32. Event-Triggered Persistence

Event-triggered requirements require contextual persistence.

For example:

```text
POPIA-SEC-005
```

must be capable of producing determinations such as:

```text
Assessment A
+
Security Event X
+
SEC-005
=
APPLICABLE
```

without implying:

```text
Organization permanently has SEC-005 triggered
```

Multiple events may exist.

Therefore uniqueness cannot be based only on:

```text
assessmentId + requirementId
```

for all requirement types.

Context must be considered.

---

# 33. Matter-Triggered Persistence

Likewise:

```text
POPIA-DSP-003
```

may have multiple relevant matters.

Conceptually:

```text
Assessment A
+
DSP-003
+
Matter 1
=
APPLICABLE

Assessment A
+
DSP-003
+
Matter 2
=
APPLICABLE
```

A persistence design that permits only one row per:

```text
assessmentId + requirementId
```

would destroy this distinction.

---

# 34. Uniqueness Architecture

Potential uniqueness rules differ by domain object.

## 34.1 RegulatoryFactDefinition

Conceptually:

```text
UNIQUE(frameworkId, key, version)
```

or an equivalent version-safe identity.

The final rule depends on definition versioning strategy.

## 34.2 ApplicabilityDefinition

Conceptually:

```text
UNIQUE(requirementId, version)
```

## 34.3 RegulatoryFactValue

Current fact uniqueness depends on context and history strategy.

A simplistic:

```text
UNIQUE(organizationId, factDefinitionId)
```

is insufficient for:

- events;
- matters;
- activities;
- relationships;
- history; and
- versioned facts.

## 34.4 Assessment snapshot

Snapshot uniqueness must allow all facts actually required by the
assessment while preventing accidental duplicate representations of the
same fact/context/version.

## 34.5 Requirement applicability

Potential conceptual uniqueness:

```text
assessmentId
+
requirementId
+
context identity
+
resolution version/lifecycle identity
```

The final rule depends on whether determinations are append-only or
mutable before finalization.

---

# 35. Index Architecture

Future persistence should support efficient access by:

```text
organizationId
frameworkId
assessmentId
requirementId
factDefinitionId
contextId
applicability status
rule version
fact freshness/review state
```

Indexes must follow actual service access patterns.

This document does not authorize speculative over-indexing.

---

# 36. Delete Semantics

Delete behavior is safety-critical.

## 36.1 Catalogue definitions

Deleting a framework or requirement must not silently destroy
historical assessment meaning.

The current schema uses cascade behavior for some catalogue relations.

Applicability persistence must be designed carefully around that
existing behavior.

Historical regulatory records may require:

- Restrict;
- soft retirement;
- historical snapshot copies; or
- another preservation mechanism.

## 36.2 Current organization facts

Deleting a current fact must not destroy assessment snapshots that
already relied on it.

## 36.3 Assessment snapshots

Snapshots that support historical assessment determinations should not
be casually deleted independently.

## 36.4 Applicability determinations

Determinations that contributed to completed assessment results require
historical protection.

## 36.5 Context

Deleting an event or matter context must not orphan or erase
historically relied-upon applicability without an explicit lifecycle
policy.

The implementation milestone must define exact Prisma `onDelete`
behavior.

---

# 37. Tenant Integrity

Tenant safety is mandatory.

Every organization-specific applicability path must ultimately prove
ownership by the active organization.

A safe resolution must establish consistency among:

```text
Organization
Assessment.organizationId
RegulatoryFactValue.organizationId
ApplicabilityContext.organizationId
Assessment snapshot
Requirement.frameworkId
Assessment.frameworkId
ApplicabilityDefinition.requirementId
```

A client-supplied ID is not authority.

---

# 38. Framework Integrity

A POPIA assessment must not resolve a requirement belonging to another
framework.

Conceptually:

```text
Assessment.frameworkId
=
ComplianceRequirement.frameworkId
```

must be validated by the domain service.

Likewise:

```text
RegulatoryFactDefinition.frameworkId
```

must be compatible with the rule and assessment framework.

---

# 39. Assessment Integrity

Assessment snapshots and applicability determinations must belong to
the same organization and framework context as the assessment.

The persistence architecture must not permit a snapshot from
Organization A to support an assessment for Organization B.

---

# 40. Current Assessment Authority

`CurrentAssessmentAuthority` remains unchanged conceptually.

Its role is:

```text
Organization
+
Framework
→
Current authoritative Assessment
```

It does not:

- resolve applicability;
- own regulatory facts;
- own snapshots;
- change historical applicability;
- modify rules; or
- determine evidence status.

When authority changes from Assessment A to Assessment B:

```text
Assessment A applicability history remains unchanged.
Assessment B applicability history remains unchanged.
```

Only which assessment contributes to organization-level aggregation
changes.

---

# 41. Assessment Lifecycle Interaction

The existing assessment lifecycle is:

```text
DRAFT
→
IN_PROGRESS
→
REVIEW
→
COMPLETED
```

Applicability persistence must integrate with this lifecycle without
redefining it.

Potential future behavior may include:

```text
DRAFT
- facts may be gathered
- scope may be unresolved

IN_PROGRESS
- facts may be reviewed
- applicability may be recalculated

REVIEW
- unresolved scope highlighted
- human review may occur

COMPLETED
- assessment fact snapshot frozen
- applicability determinations frozen
- score persisted
```

This is conceptual behavior.

The exact lifecycle integration requires a later implementation
milestone.

---

# 42. Recalculation Boundary

Current organization facts may change.

Applicability may therefore require recalculation before an assessment
is finalized.

However, recalculation must not silently rewrite completed historical
assessments.

Conceptually:

```text
Current facts change
        ↓
Active assessment may become stale
        ↓
controlled applicability recalculation
        ↓
new snapshots / determinations
```

Completed historical assessments remain reproducible.

---

# 43. Evidence Engine Boundary

The locked evidence engine currently derives requirement status from
Evidence verification state.

That engine must remain unchanged during applicability persistence
implementation unless a later integration milestone explicitly
authorizes the boundary change.

Applicability persistence initially establishes:

```text
Which requirements are eligible to enter the engine?
```

It does not redefine:

```text
How the engine evaluates evidence.
```

---

# 44. Scoring Boundary

The locked scoring rule remains:

```text
VERIFIED
→ full requirement weight

all other evidence-derived statuses
→ zero
```

Applicability changes the input requirement set.

Conceptually:

```text
active requirements
        ↓
applicability
        ↓
APPLICABLE requirements
        ↓
existing evidence engine
        ↓
existing weighted score
```

This document does not implement that integration.

---

# 45. Unresolved Scope Boundary

`UNDETERMINED` requirements must remain visible.

The persistence architecture must support queries such as:

```text
How many requirements are APPLICABLE?
How many are NOT_APPLICABLE?
How many are UNDETERMINED?
Why are they undetermined?
Which facts are missing?
Which facts are stale?
Which determinations require review?
```

This information will later support applicability coverage.

---

# 46. Applicability Coverage

Applicability coverage is separate from compliance score.

A future calculation may measure how much regulatory scope has been
resolved.

The exact formula remains deferred.

Persistence must nevertheless retain enough information to distinguish:

```text
resolved scope
```

from:

```text
unresolved scope
```

without reconstructing uncertainty from missing rows.

---

# 47. Human Authority

Some facts and determinations may require human authority.

Potential examples include:

- legal classification;
- disputed facts;
- prior-authorisation scope;
- statutory exceptions;
- automated decision-making scope;
- complex international transfers.

Future persistence should preserve:

```text
who resolved
what authority they had
when they resolved it
what basis they used
```

Exact authorization policy is deferred to service architecture.

---

# 48. AI Authority Boundary

AI may assist with:

- extracting candidate facts;
- identifying missing facts;
- identifying contradictions;
- proposing questions;
- explaining applicability;
- summarizing provenance;
- recommending human review.

AI must not independently persist an authoritative legal fact merely
because it inferred one.

AI must not:

```text
UNKNOWN → FALSE
```

AI must not:

```text
missing evidence → NOT_APPLICABLE
```

AI must not manufacture:

- legal scope;
- statutory exceptions;
- prior-authorisation determinations;
- legal permissions;
- event occurrence;
- matter occurrence; or
- authoritative regulatory review.

Any future AI-originated fact must pass an approved authority boundary.

---

# 49. Auditability

Applicability is sufficiently consequential that changes should be
auditable.

The system should eventually be capable of identifying:

```text
fact created
fact changed
fact reviewed
fact disputed
fact became stale
rule version approved
rule version retired
applicability resolved
applicability re-resolved
human override/review
assessment frozen
```

The existing generic `AuditLog` may not be sufficient by itself for
regulatory history.

This document does not redesign `AuditLog`.

It establishes the auditability requirement.

---

# 50. Current-State Versus Historical-State Rule

The architecture distinguishes:

```text
CURRENT ORGANIZATION STATE
```

from:

```text
HISTORICAL ASSESSMENT STATE
```

Current state may evolve.

Historical assessment state must remain reproducible.

Therefore:

```text
RegulatoryFactValue
```

and:

```text
AssessmentRegulatoryFactSnapshot
```

serve different purposes and must not be collapsed.

---

# 51. Catalogue Evolution

Compliance requirements may evolve because:

- law changes;
- regulations change;
- guidance changes;
- interpretation changes;
- catalogue errors are corrected;
- requirements are split or merged;
- provenance changes.

Historical applicability must remain explainable after catalogue
evolution.

This reinforces the need for:

```text
rule version snapshot
fact definition version snapshot
requirement identity
historical explanation
```

A later catalogue-versioning milestone may strengthen this further.

---

# 52. Rule Evolution

When an applicability rule changes:

```text
Rule V1
→ retired/superseded

Rule V2
→ approved for future resolution
```

Historical assessment determinations using V1 remain V1.

They must not silently become V2 determinations.

---

# 53. Fact Definition Evolution

Likewise, when a fact definition changes meaning:

```text
Fact Definition V1
→ historical

Fact Definition V2
→ current
```

Historical snapshots must retain enough information to explain the V1
meaning.

---

# 54. No Silent Defaults

The implementation must not introduce defaults such as:

```text
missing fact = false
```

or:

```text
missing applicability row = applicable
```

or:

```text
missing applicability row = not applicable
```

or:

```text
stale fact = false
```

or:

```text
AI confidence > threshold = authoritative fact
```

Regulatory uncertainty must remain explicit.

---

# 55. No Organization Boolean Explosion

The persistence architecture explicitly rejects adding dozens of
POPIA-specific Boolean fields directly to `Organization`.

Rejected pattern:

```text
Organization {
  usesOperators Boolean
  processesChildrenData Boolean
  doesDirectMarketing Boolean
  transfersDataOverseas Boolean
  ...
}
```

This would:

- couple Organization to POPIA;
- scale poorly across frameworks;
- lose provenance;
- lose history;
- lose fact definition versioning;
- make unknown semantics difficult;
- make event context difficult;
- make matter context difficult; and
- encourage stale onboarding facts.

The dedicated regulatory-fact domain is required.

---

# 56. No Requirement Applicability Boolean

The persistence architecture also rejects:

```text
ComplianceRequirement {
  applicable Boolean
}
```

Applicability is not a global property of a requirement.

It varies by:

```text
organization
assessment
context
facts
time
rule version
```

---

# 57. No Assessment JSON Shortcut

The architecture should not default to storing the entire applicability
domain as one opaque JSON field on `Assessment`.

While structured snapshots may use JSON for carefully bounded values,
an opaque assessment blob would weaken:

- referential integrity;
- querying;
- tenant validation;
- rule lineage;
- fact lineage;
- indexing;
- review workflows; and
- explainability.

Structured persistence is preferred.

---

# 58. Value Storage Boundary

Regulatory facts may have heterogeneous value types.

The implementation milestone must determine whether values use:

- typed nullable columns;
- structured JSON;
- normalized typed value tables;
- another controlled representation.

The chosen approach must preserve:

- validation;
- type safety;
- unknown semantics;
- deterministic comparison;
- queryability; and
- historical snapshots.

This document does not select the final representation.

---

# 59. Provenance Storage Boundary

Likewise, provenance may require more than a single free-text field.

Potential future design may distinguish:

```text
source type
source entity
source document
source evidence
source user
source integration
supporting explanation
verification authority
```

The implementation milestone must determine the appropriate structure.

---

# 60. Context Storage Boundary

`ApplicabilityContext` may eventually interact with domain-specific
entities such as:

```text
SecurityIncident
DataSubjectRequest
ProcessingActivity
OperatorRelationship
InternationalTransfer
AutomatedDecisionSystem
```

Those entities do not currently exist in the persistence baseline.

Therefore V1 applicability persistence must not pretend they already
exist.

The context architecture should allow later attachment without forcing
premature creation of complete operational subsystems.

---

# 61. Relationship Summary

Conceptually:

```text
Framework
  ├── ComplianceRequirement
  │       └── ApplicabilityDefinition
  │
  └── RegulatoryFactDefinition

Organization
  ├── RegulatoryFactValue
  └── ApplicabilityContext

Assessment
  ├── AssessmentRegulatoryFactSnapshot
  └── AssessmentRequirementApplicability

RegulatoryFactDefinition
  ├── RegulatoryFactValue
  └── AssessmentRegulatoryFactSnapshot

ComplianceRequirement
  ├── ApplicabilityDefinition
  └── AssessmentRequirementApplicability

ApplicabilityContext
  ├── RegulatoryFactValue where context-specific
  ├── AssessmentRegulatoryFactSnapshot where context-specific
  └── AssessmentRequirementApplicability where context-specific
```

---

# 62. Cardinality Summary

Conceptually:

```text
Framework
1 → many RegulatoryFactDefinition

ComplianceRequirement
1 → many ApplicabilityDefinition versions

Organization
1 → many RegulatoryFactValue

Organization
1 → many ApplicabilityContext

Assessment
1 → many AssessmentRegulatoryFactSnapshot

Assessment
1 → many AssessmentRequirementApplicability

RegulatoryFactDefinition
1 → many RegulatoryFactValue

RegulatoryFactDefinition
1 → many AssessmentRegulatoryFactSnapshot

ComplianceRequirement
1 → many AssessmentRequirementApplicability

ApplicabilityContext
1 → many context-bound facts/determinations
```

Exact Prisma cardinality requires implementation review.

---

# 63. Potential Enums

Future persistence may require conceptual enums such as:

```text
ApplicabilityStatus
RegulatoryFactValueType
RegulatoryFactKnowledgeState
RegulatoryFactAuthorityState
ApplicabilityClass
ApplicabilityResolutionPattern
ApplicabilityContextType
RegulatoryReviewStatus
ResolutionAuthorityType
```

This document does not authorize these exact Prisma enums.

Before implementation, each enum must be tested for:

- legal meaning;
- lifecycle completeness;
- migration safety;
- future extensibility; and
- compatibility with the locked grammar.

---

# 64. Potential Model Set

The minimum conceptual model set is:

```text
RegulatoryFactDefinition
RegulatoryFactValue
ApplicabilityDefinition
ApplicabilityContext
AssessmentRegulatoryFactSnapshot
AssessmentRequirementApplicability
```

Additional supporting persistence may later be required for:

```text
fact history
fact provenance
determination-to-snapshot lineage
rule-to-fact dependencies
human review
regulatory review
```

The implementation milestone must determine whether these require
separate models or controlled embedded structures.

---

# 65. Minimum Persistence Capability

Before applicability can safely influence production scoring,
persistence must support at least:

1. framework-bound fact definitions;
2. organization-bound fact values;
3. explicit unknown semantics;
4. fact provenance;
5. fact freshness;
6. requirement-bound applicability definitions;
7. rule versioning;
8. applicability context;
9. assessment-time fact snapshots;
10. applicability status persistence;
11. rule-version lineage;
12. fact-input lineage;
13. historical reproducibility;
14. tenant integrity;
15. framework integrity;
16. unresolved scope visibility; and
17. regulatory review gates.

---

# 66. Migration Safety

No migration should be generated until:

- conceptual models are approved;
- enums are approved;
- value representation is approved;
- uniqueness rules are approved;
- delete semantics are approved;
- context strategy is approved;
- snapshot strategy is approved;
- provenance strategy is approved;
- rule representation is approved; and
- existing production data is assessed.

Migration generation must not be used as a design tool.

Architecture comes first.

---

# 67. Existing Data Preservation

The current production database may contain existing organizations,
users, memberships, assessments, evidence, documents, workflow state,
and executive missions.

Applicability persistence must be additive.

It must not require destructive recreation of existing business data.

New required relations must be designed so deployment does not
invalidate existing records.

---

# 68. Migration Shadow Database Safety

Previous migration work established an important operational rule:

> `DATABASE_URL` or `DIRECT_URL` must never be reused as a Prisma shadow
> database unless the target has been explicitly proven to be a
> separate disposable shadow database.

Future applicability migrations must preserve this rule.

Production or production-like data must never be used as disposable
shadow state.

---

# 69. Service Boundary Preview

Persistence should eventually be accessed through dedicated domain
services.

Conceptual service boundaries include:

```text
RegulatoryFactService
ApplicabilityResolutionService
AssessmentApplicabilityService
```

Potential responsibilities:

### RegulatoryFactService

- establish facts;
- review facts;
- retrieve current facts;
- enforce provenance;
- enforce freshness;
- enforce tenant ownership.

### ApplicabilityResolutionService

- load approved rule;
- load required facts;
- apply three-valued logic;
- produce explainable result;
- preserve rule identity.

### AssessmentApplicabilityService

- snapshot assessment facts;
- resolve requirement applicability;
- preserve historical determinations;
- expose unresolved scope;
- prepare applicable requirement set.

These services are not implemented by this milestone.

---

# 70. API Boundary

No public API is approved by this document.

Future APIs must not permit clients to directly write authoritative:

```text
applicability status
```

without passing through approved domain authority.

For example, a client must not be allowed to send:

```json
{
  "requirementId": "...",
  "status": "NOT_APPLICABLE"
}
```

and have that become authoritative merely because the request is
authenticated.

The system must establish the regulatory basis.

---

# 71. Authorization Boundary

Future write permissions must distinguish:

- fact declaration;
- fact verification;
- regulatory review;
- applicability resolution;
- human override where legally permitted;
- read access.

Existing organization membership roles provide the tenant membership
foundation.

The exact applicability permission matrix requires a separate design.

---

# 72. Security Boundary

Applicability persistence may contain sensitive information about:

- processing activities;
- children;
- special personal information;
- security incidents;
- data-subject disputes;
- international transfers;
- automated decisions.

Future persistence and APIs must therefore apply appropriate access
controls and avoid unnecessary exposure.

This document does not design field-level security.

It establishes that applicability data must be treated as potentially
sensitive compliance data.

---

# 73. Performance Boundary

Applicability persistence should support assessment resolution without
requiring uncontrolled N+1 database access.

Future service design should allow efficient loading of:

```text
assessment
framework
requirements
applicability definitions
required fact snapshots
existing determinations
```

Performance optimization must not weaken regulatory correctness.

---

# 74. Transaction Boundary

Assessment snapshot creation and applicability resolution may require
transactional guarantees.

A future implementation must evaluate whether:

```text
snapshot facts
+
resolve applicability
+
persist determinations
```

must occur in one transaction or controlled staged transactions.

Partial historical state must not masquerade as a completed resolution.

---

# 75. Concurrency Boundary

Two users or processes may attempt to update regulatory facts or resolve
an assessment concurrently.

Future persistence must consider:

- lost updates;
- stale fact versions;
- duplicate determinations;
- conflicting reviews;
- concurrent assessment completion;
- rule-version changes during resolution.

The exact concurrency strategy is deferred.

---

# 76. Determinism Requirement

Given the same:

```text
fact snapshots
rule version
context
```

the deterministic applicability engine must produce the same result.

Persistence must retain enough information to verify that property.

AI-generated nondeterministic reasoning must not become the authoritative
resolution algorithm.

---

# 77. Explainability Requirement

Every persisted applicability result should eventually be explainable
in human-readable terms.

Example:

```text
POPIA-SEC-003 is APPLICABLE because the organization has an
authoritatively established operator relationship in which an operator
processes personal information.
```

Or:

```text
POPIA-TBF-001 is UNDETERMINED because ComplianceOS does not have a
sufficiently current authoritative fact establishing whether personal
information is transferred to a third party in a foreign country.
```

The explanation must derive from persisted facts and rules.

It must not be invented after the fact.

---

# 78. Production Readiness Gate

Applicability persistence must not affect production compliance scores
until all of the following have passed:

```text
schema review
migration review
migration safety test
tenant integrity test
framework integrity test
fact provenance test
fact freshness test
snapshot immutability test
rule versioning test
three-valued logic test
event-context test
matter-context test
compound-rule test
regulatory-review gate test
assessment lifecycle test
historical reproducibility test
evidence-engine regression test
scoring regression test
organization aggregation regression test
Current Assessment Authority regression test
AI authority regression test
```

---

# 79. Explicit Non-Goals

This architecture does not yet design:

- framework-level applicability in full;
- complete processing-activity inventory;
- complete operator-management subsystem;
- security incident management;
- data-subject request management;
- international transfer register;
- automated decision system register;
- legal opinion management;
- regulator case management;
- Trust Score integration;
- Executive AI integration;
- public reporting;
- customer-facing applicability UI.

Those domains may later connect to the applicability context layer.

---

# 80. Persistence Stress-Test Questions

Before Prisma implementation, the architecture must survive the
following questions.

### Unknown fact

Can the database distinguish:

```text
FALSE
```

from:

```text
UNKNOWN
```

### Stale fact

Can a stale onboarding declaration become unresolved rather than false?

### Historical fact

Can an August assessment preserve an August fact after the current fact
changes in October?

### Rule change

Can an assessment preserve Rule V1 after Rule V2 becomes current?

### Event

Can two security events produce separate SEC-005 applicability
contexts?

### Matter

Can two data-subject matters produce separate DSP-003 applicability
contexts?

### Tenant

Can Organization A's fact ever be used for Organization B?

The answer must be no.

### Framework

Can a POPIA fact or rule accidentally resolve a requirement from another
framework?

The answer must be no.

### Evidence

Can missing evidence cause `NOT_APPLICABLE`?

The answer must be no.

### AI

Can AI confidence alone create an authoritative fact?

The answer must be no.

### Score

Can unknown scope silently improve the compliance score?

The answer must be no.

---

# 81. Proposed Implementation Sequence

After this architecture is locked, implementation should proceed in
controlled sub-milestones.

Conceptually:

```text
8A.3.4A
Persistence model specification

8A.3.4B
Prisma schema proposal

8A.3.4C
Schema stress test

8A.3.4D
Migration design

8A.3.4E
Migration execution and verification

8A.3.4F
Persistence integrity fixtures

8A.3.4G
Regulatory fact service

8A.3.4H
Applicability resolution service

8A.3.4I
Assessment applicability service

8A.3.4J
Integration regression gate
```

The exact milestone numbering may be refined before implementation.

---

# 82. Prisma Implementation Gate

No Prisma model should be added merely because it appears in this
document.

Before modifying `schema.prisma`, we must explicitly decide:

1. exact model names;
2. exact enums;
3. exact value representation;
4. exact fact history strategy;
5. exact context strategy;
6. exact provenance strategy;
7. exact snapshot representation;
8. exact rule representation;
9. exact rule dependency representation;
10. exact determination lineage;
11. exact unique constraints;
12. exact indexes;
13. exact `onDelete` behavior;
14. exact lifecycle behavior;
15. exact tenant validation strategy; and
16. exact migration safety strategy.

---

# 83. Architecture Acceptance Criteria

This persistence architecture is acceptable only if it preserves all
locked applicability doctrine.

It must support:

```text
Fact definition
Fact value
Fact provenance
Fact freshness
Fact history
Rule definition
Rule version
Context identity
Assessment snapshot
Applicability determination
Fact lineage
Rule lineage
Historical reproducibility
Tenant integrity
Framework integrity
Unresolved scope
Regulatory review
```

It must not weaken:

```text
ACTIVE ≠ APPLICABLE
MANDATORY ≠ UNIVERSAL
MISSING EVIDENCE ≠ NOT_APPLICABLE
UNKNOWN FACT ≠ FALSE
UNDETERMINED ≠ COMPLIANT
```

---

# 84. Exit Criteria

Milestone 8A.3.4 architecture may be considered complete only when:

1. the existing persistence baseline has been audited;
2. tenant ownership is explicit;
3. framework ownership is explicit;
4. fact-definition persistence is defined;
5. current fact persistence is defined;
6. provenance requirements are defined;
7. freshness requirements are defined;
8. history requirements are defined;
9. applicability-definition persistence is defined;
10. rule versioning is defined;
11. context persistence is defined;
12. event/matter safety is defined;
13. assessment snapshots are defined;
14. snapshot immutability is defined;
15. applicability determinations are defined;
16. fact lineage is defined;
17. rule lineage is defined;
18. three-valued logic is preserved;
19. exception classification is preserved;
20. ADM-002 regulatory ambiguity is gated;
21. prior-authorisation circularity is prevented;
22. tenant integrity is defined;
23. framework integrity is defined;
24. Current Assessment Authority remains separate;
25. evidence-engine boundaries remain intact;
26. scoring boundaries remain intact;
27. AI authority remains constrained;
28. migration safety is defined;
29. production authorization remains explicitly denied;
30. persistence stress tests pass; and
31. no implementation changes are introduced.

---

# 85. Next Deliverable

After this architecture document passes review and is locked, the next
deliverable should specify the exact persistence model.

That deliverable should transform the conceptual entities into an
implementation proposal containing:

```text
exact model names
exact fields
exact enums
exact relations
exact uniqueness constraints
exact indexes
exact delete semantics
exact snapshot strategy
exact provenance representation
exact versioning strategy
```

Only after that proposal passes stress testing should
`prisma/schema.prisma` be modified.

---

# 86. Final Principle

Applicability persistence exists to preserve the truth that ComplianceOS
knew, the rule it used, the context in which it reasoned, and the
result it reached.

The durable chain is:

```text
REGULATORY FACT DEFINITION
        ↓
CURRENT ORGANIZATION FACT
        ↓
ASSESSMENT FACT SNAPSHOT
        ↓
VERSIONED APPLICABILITY RULE
        ↓
CONTEXTUAL APPLICABILITY DETERMINATION
        ↓
APPLICABLE REQUIREMENTS
        ↓
LOCKED EVIDENCE ENGINE
```

The historical guarantee is:

```text
FACT AT TIME T
+
RULE AT TIME T
+
CONTEXT AT TIME T
=
APPLICABILITY RESULT AT TIME T
```

The governing safety rule remains:

> ComplianceOS must never improve an organization's compliance result
> merely because the system lacks sufficient facts to determine scope.

Applicability persistence must therefore remain:

**tenant-bound, framework-bound, provenance-aware, freshness-aware,
three-valued, context-aware, versioned, explainable, historically
reproducible, evidence-independent, and conservative under
uncertainty.**
