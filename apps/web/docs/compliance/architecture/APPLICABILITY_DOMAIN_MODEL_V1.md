# ComplianceOS Applicability Domain Model v1

## Milestone

Milestone 8A.3.2 — Applicability Domain Model Design

## Status

ARCHITECTURE DRAFT — NOT YET IMPLEMENTED

This document defines the domain architecture required for regulatory
applicability resolution in ComplianceOS.

It does not authorize:

- Prisma schema changes;
- database migrations;
- production catalogue provisioning;
- compliance-engine changes;
- automated legal determinations;
- production scoring of conditional, sector-specific, or
  event-triggered requirements.

---

# 1. Purpose

ComplianceOS must distinguish between:

1. whether a regulatory requirement exists in the authoritative
   catalogue;
2. whether that requirement applies to a particular organization in a
   particular assessment context;
3. whether evidence exists for an applicable requirement;
4. whether that evidence has been verified; and
5. whether the applicable requirement is satisfied.

These are different questions and must not be collapsed into a single
status or Boolean value.

The applicability foundation sits between the regulatory catalogue and
the evidence-driven compliance engine.

Target architecture:

Regulatory Catalogue
→ Applicability Definition
→ Regulatory Facts
→ Applicability Resolution
→ Applicable Requirements
→ Evidence
→ Verification
→ Requirement Compliance Status
→ Compliance Score

---

# 2. Core Domain Invariants

The following invariants are mandatory.

## 2.1 Active is not Applicable

`ComplianceRequirement.active` describes catalogue participation.

It does not establish that the requirement applies to every
organization or assessment.

ACTIVE ≠ APPLICABLE

---

## 2.2 Mandatory is not Universal

`mandatory = true` means that the requirement is mandatory once it is
legally applicable.

It must never mean that the requirement applies universally.

MANDATORY ≠ UNIVERSAL

---

## 2.3 Missing Evidence is not Non-Applicability

The absence of evidence for a requirement does not prove that the
requirement does not apply.

MISSING EVIDENCE ≠ NOT_APPLICABLE

If an applicable requirement has no qualifying evidence, its evidence
status may correctly be MISSING.

Applicability must already have been established independently.

---

## 2.4 Unknown is not False

If ComplianceOS lacks the facts required to determine whether a
requirement applies, the system must preserve uncertainty.

UNKNOWN FACT ≠ FALSE

The system must not infer NOT_APPLICABLE merely because an organization
has not supplied the relevant information.

---

## 2.5 Undetermined is not Compliance

An applicability result of UNDETERMINED must not be represented as
either compliant or non-compliant.

UNDETERMINED ≠ COMPLIANT
UNDETERMINED ≠ NON_COMPLIANT

It represents unresolved regulatory scope.

---

## 2.6 Applicability is Historical

Applicability may change when:

- organizational activities change;
- processing activities change;
- regulatory facts change;
- triggering events occur;
- legislation or regulations change;
- regulatory interpretation changes.

Historical assessments must preserve the applicability determinations
that governed those assessments.

A later change must not silently rewrite an earlier assessment.

---

# 3. Applicability Class

ComplianceOS requires a catalogue-level classification describing the
general applicability behaviour of a regulatory requirement.

Conceptual enum:

ApplicabilityClass

- GENERAL
- CONDITIONAL
- SECTOR_SPECIFIC
- EVENT_TRIGGERED

This classification belongs to regulatory catalogue semantics.

It does not itself determine whether a requirement applies to a
specific organization.

---

# 4. Applicability Rule

Every regulatory requirement must have a human-readable applicability
rule.

Examples include:

- General;
- where personal information is processed further;
- where operators process personal information;
- where the organization processes special personal information;
- where the organization processes children's personal information;
- where processing requires prior authorisation;
- where electronic direct marketing occurs;
- where qualifying automated decision-making occurs;
- where personal information is transferred internationally;
- where a qualifying security-compromise event occurs.

The applicability rule describes the legal or regulatory condition.

It must remain distinct from the organization's factual answer.

---

# 5. Applicability Definition

A future applicability definition represents the catalogue-side
information required to resolve a requirement.

Conceptually:

ApplicabilityDefinition

- requirementId
- applicabilityClass
- rule
- requiredFacts
- resolutionStrategy
- provenance
- version

The exact persistence model is intentionally not decided by this
document.

The architecture must first establish the domain semantics before a
Prisma representation is selected.

---

# 6. Regulatory Facts

ComplianceOS requires a dedicated regulatory-fact domain.

Regulatory facts represent facts about an organization, its processing
activities, its regulatory scope, or relevant events that may affect
legal applicability.

Examples discovered during the POPIA catalogue audit include:

- whether personal information is processed;
- whether personal information is processed further;
- whether information is collected directly or indirectly;
- whether operators process information for the organization;
- whether a qualifying security compromise has occurred;
- whether special personal information is processed;
- which categories of special personal information are processed;
- whether children's personal information is processed;
- whether contemplated processing may fall within prior-authorisation
  rules;
- whether prior authorisation is required;
- whether electronic direct marketing is conducted;
- whether personal information is processed for direct marketing;
- whether decisions are based solely on automated processing;
- whether qualifying legal effects or significant effects arise from
  automated decisions;
- whether personal information is transferred to a third party in a
  foreign country;
- whether a qualifying data-subject request or dispute exists.

This vocabulary will expand as additional frameworks are introduced.

Therefore POPIA-specific Boolean columns must not be added directly to
the Organization model merely for convenience.

---

# 7. Regulatory Fact Identity

Regulatory facts require stable machine-readable identities.

Conceptually:

RegulatoryFactDefinition

- key
- name
- description
- valueType
- scope
- framework relevance
- provenance requirements

Example keys could eventually resemble:

PROCESSES_PERSONAL_INFORMATION

PERFORMS_FURTHER_PROCESSING

USES_OPERATORS

PROCESSES_SPECIAL_PERSONAL_INFORMATION

PROCESSES_CHILDRENS_INFORMATION

CONDUCTS_ELECTRONIC_DIRECT_MARKETING

USES_QUALIFYING_AUTOMATED_DECISION_PROCESSING

TRANSFERS_PERSONAL_INFORMATION_ABROAD

These names are illustrative architecture vocabulary only.

They are not yet approved production identifiers.

---

# 8. Regulatory Fact Values

A fact value must preserve more information than a Boolean answer.

Conceptually:

RegulatoryFactValue

- organizationId
- factDefinitionId
- value
- status
- source
- establishedAt
- reviewedAt
- establishedBy
- assessmentContext
- supportingBasis

A future implementation may support different fact value types,
including:

- BOOLEAN
- STRING
- NUMBER
- DATE
- ENUM
- MULTI_VALUE
- EVENT

The exact implementation remains subject to design verification.

---

# 9. Fact Knowledge State

The system must distinguish a factual value from whether that value is
known reliably.

At minimum the architecture must support the conceptual distinction:

KNOWN
UNKNOWN

A future implementation may require additional states such as:

DECLARED
VERIFIED
DISPUTED
STALE

These additional states are not approved by this document.

The important invariant is:

absence of a fact record must never automatically mean FALSE.

---

# 10. Fact Provenance

Regulatory facts can influence legal scope and therefore compliance
scores.

They require provenance.

A regulatory fact should eventually be capable of answering:

- What fact was established?
- What value was established?
- Who or what established it?
- When was it established?
- What source supports it?
- Has it been reviewed?
- Is it still current?
- Which assessment used it?
- Was it declared, derived, verified, or otherwise determined?

This prevents stale onboarding answers from silently controlling
future regulatory assessments.

---

# 11. Organization Facts vs Assessment Snapshot

The organization may maintain current regulatory facts.

However, an assessment requires historical stability.

Therefore the architecture must distinguish:

Current Organization Regulatory Facts

from:

Assessment Regulatory Fact Snapshot

An assessment must be reproducible from the regulatory facts and
applicability determinations that existed when that assessment was
performed.

Changes to current organization facts must not silently rewrite
historical assessment results.

The exact snapshot mechanism is deferred until persistence design.

---

# 12. Applicability Status

Applicability resolution requires a three-state minimum model.

Conceptual enum:

ApplicabilityStatus

- APPLICABLE
- NOT_APPLICABLE
- UNDETERMINED

## APPLICABLE

The available facts and applicable rule establish that the requirement
applies in the assessment context.

## NOT_APPLICABLE

The available facts and applicable rule establish that the requirement
does not apply in the assessment context.

NOT_APPLICABLE requires an affirmative basis.

It must never be inferred merely from missing information.

## UNDETERMINED

The system does not currently possess sufficient authoritative facts
or resolution certainty to establish APPLICABLE or NOT_APPLICABLE.

UNDETERMINED preserves uncertainty rather than inventing legal
certainty.

---

# 13. Assessment Requirement Applicability

The resolved applicability result belongs conceptually to the
intersection of:

Assessment × ComplianceRequirement

Conceptually:

AssessmentRequirementApplicability

- assessmentId
- requirementId
- status
- reason
- resolutionBasis
- resolvedAt
- resolvedBy
- factSnapshot / fact references
- rule/version reference

This allows the same regulatory requirement to be:

NOT_APPLICABLE in one assessment

and later:

APPLICABLE in another assessment

without rewriting historical truth.

---

# 14. Resolution Authority

Applicability may eventually be resolved through different authorities.

Potential sources include:

- deterministic rules;
- verified organization facts;
- authorized human review;
- regulatory interpretation;
- controlled system derivation.

AI must not independently manufacture authoritative legal
applicability.

AI may assist with:

- identifying missing facts;
- explaining applicability questions;
- suggesting likely relevant rules;
- summarizing supporting information;
- identifying inconsistencies for review.

Authoritative applicability must remain governed by deterministic,
auditable domain rules and authorized decisions.

---

# 15. Resolution Reason

Every NOT_APPLICABLE or UNDETERMINED determination should be
explainable.

Examples:

NOT_APPLICABLE

"Organization does not transfer personal information to a third party
in a foreign country."

UNDETERMINED

"International transfer activity has not yet been established."

APPLICABLE

"Organization declares and verifies that personal information is
transferred to an operator located outside South Africa."

The precise reason representation will be determined during
persistence design.

---

# 16. Scoring Eligibility

The applicability layer controls which active requirements may enter
the evidence-driven scoring engine.

Conceptual flow:

All Framework Requirements
→ Active Requirements
→ Applicability Resolution
→ APPLICABLE Active Requirements
→ Evidence Integrity
→ Evidence Evaluation
→ Weighted Compliance Score

Only APPLICABLE active requirements enter the compliance score
denominator.

NOT_APPLICABLE requirements are excluded from the denominator.

UNDETERMINED requirements are also excluded from the compliance score
denominator until applicability is resolved.

However, UNDETERMINED requirements must be surfaced separately as
unresolved regulatory scope.

They must not disappear from reporting.

---

# 17. Undetermined Coverage

A compliance score alone is insufficient when applicability remains
unresolved.

Example:

Compliance Score: 100%

Applicability Coverage:
27 of 35 requirements resolved

Unresolved:
8 requirements

Without this distinction, a system could display 100% compliance while
significant regulatory scope remains unknown.

Therefore future assessment output should distinguish:

Compliance Score

from:

Applicability Coverage / Resolution Coverage

The exact metric and presentation are deferred.

---

# 18. Evidence Engine Boundary

The existing evidence-driven compliance engine should remain focused
on evidence.

It should not become the primary legal-applicability resolver.

Its responsibility remains conceptually:

Given a set of applicable requirements and qualifying evidence,
determine requirement evidence status and weighted compliance score.

Applicability filtering should occur before requirements are supplied
to the evidence calculation.

This preserves separation of concerns:

Applicability Engine
→ determines regulatory scope

Evidence Engine
→ determines evidence-backed compliance within that scope

---

# 19. Evidence Status Remains Separate

Existing evidence-derived requirement statuses remain conceptually:

- MISSING
- PENDING
- VERIFIED
- REJECTED
- EXPIRED

NOT_APPLICABLE must not be added merely as another evidence status.

Applicability and evidence are separate dimensions.

Example:

Requirement:
POPIA-TBF-001

Applicability:
APPLICABLE

Evidence Status:
VERIFIED

versus:

Requirement:
POPIA-TBF-001

Applicability:
NOT_APPLICABLE

Evidence Status:
NOT EVALUATED

versus:

Requirement:
POPIA-TBF-001

Applicability:
UNDETERMINED

Evidence Status:
NOT EVALUATED

---

# 20. Event-Triggered Requirements

EVENT_TRIGGERED requirements require special treatment.

The absence of an event must not create a permanent compliance
penalty.

For example, a security-compromise response obligation should not be
scored as MISSING merely because no qualifying security compromise has
occurred.

The architecture must distinguish:

event capability / preparedness controls

from:

event-response obligations activated by an actual event.

Where the catalogue contains both concepts, they must not be
collapsed.

---

# 21. Conditional Requirements

CONDITIONAL requirements require affirmative scope resolution.

Examples include requirements concerning:

- special personal information;
- children's information;
- prior authorisation;
- electronic direct marketing;
- automated decision-making;
- transborder information flows.

A conditional requirement must not enter scoring until the condition
has been resolved as applicable.

---

# 22. Sector-Specific Requirements

SECTOR_SPECIFIC requirements require sufficient organization and
processing-scope facts before participation in scoring.

Industry alone may not be sufficient.

Applicability may depend on:

- organization type;
- sector;
- professional role;
- category of personal information;
- processing activity;
- regulatory instrument;
- purpose;
- statutory scope.

Therefore sector applicability must not be inferred solely from the
Organization.industry field.

---

# 23. General Requirements with Exceptions

Some generally applicable requirements contain statutory exceptions.

These must not automatically be modeled as simple CONDITIONAL
requirements without legal review.

Examples may include:

- direct versus indirect collection;
- further processing;
- collection notices;
- restriction requests or disputes.

The applicability class describes broad regulatory behaviour.

The applicability rule retains the legally relevant nuance.

The future resolver may therefore require rule-specific logic even for
requirements categorized as GENERAL.

---

# 24. Catalogue Normalization Requirement

The POPIA applicability audit identified 35 atomic requirements.

All 35 contain an Applicability rule.

However, only 11 currently contain an explicit
`Applicability Class: CONDITIONAL` declaration.

The remaining requirements must not be assigned classes mechanically.

Before production provisioning:

1. each requirement must receive an approved applicability class;
2. the existing human-readable applicability rule must be preserved;
3. exceptions and trigger semantics must be reviewed;
4. the class must not replace the detailed legal rule;
5. the resulting catalogue must pass structural and regulatory review.

---

# 25. No Silent Defaults

The following silent defaults are prohibited:

missing fact → FALSE

missing applicability determination → NOT_APPLICABLE

active requirement → APPLICABLE

mandatory requirement → universally applicable

no evidence → NOT_APPLICABLE

no triggering-event record → event definitely never occurred

industry mismatch → automatically outside legal scope

AI inference → authoritative legal determination

Each of these could produce false compliance.

---

# 26. Historical Integrity

Applicability records used by an assessment must be historically
traceable.

A future system must be able to explain:

- which requirement version was evaluated;
- which applicability rule was used;
- which facts were available;
- which fact values were relied upon;
- what status was resolved;
- who or what resolved it;
- when it was resolved;
- why it was resolved;
- whether later facts changed.

Historical assessments must remain interpretable after organization
facts or regulatory catalogue versions change.

---

# 27. Tenant Integrity

Regulatory facts and applicability determinations must remain within
the authorized organization boundary.

A future implementation must prevent:

- cross-organization fact references;
- cross-organization applicability records;
- assessment/organization mismatch;
- requirement/framework mismatch;
- evidence from one organization influencing another;
- unauthorized applicability overrides.

These controls must follow the existing organization membership and
assessment authority architecture.

---

# 28. Applicability Resolution Pipeline

Target conceptual pipeline:

Organization
+
Assessment
+
Framework
+
Active Compliance Requirements
+
Regulatory Facts
+
Applicability Definitions
        ↓
Applicability Resolver
        ↓
For each Requirement:
        ↓
APPLICABLE
NOT_APPLICABLE
UNDETERMINED
        ↓
APPLICABLE only
        ↓
Evidence Integrity
        ↓
Evidence Compliance Engine
        ↓
Assessment Score

In parallel:

UNDETERMINED
        ↓
Applicability Coverage
        ↓
Missing-Fact / Review Queue

NOT_APPLICABLE
        ↓
Exclusion Register
        ↓
Reason + provenance

---

# 29. Future Service Boundaries

The architecture is expected eventually to require service boundaries
similar to:

RegulatoryFactService

Responsibilities:

- read current organization regulatory facts;
- establish or update authorized facts;
- preserve provenance;
- validate fact ownership;
- provide facts to trusted applicability services.

ApplicabilityResolutionService

Responsibilities:

- load assessment and framework context;
- load active requirements;
- load applicability definitions;
- obtain relevant regulatory facts;
- resolve applicability deterministically where possible;
- preserve UNDETERMINED where facts are insufficient;
- return explainable resolution results.

AssessmentApplicabilityService

Responsibilities:

- establish assessment-scoped applicability state;
- preserve historical resolution;
- enforce assessment/organization/framework integrity;
- expose applicable requirements to compliance calculation.

The exact file structure is not approved by this document.

---

# 30. Future API Boundary

No public applicability API is approved yet.

Future HTTP boundaries must not permit clients to:

- choose another organization's applicability state;
- directly manipulate assessment ownership;
- silently mark requirements NOT_APPLICABLE;
- bypass resolution authority;
- alter historical assessment applicability without authorization.

The server must derive organization authority from active database
membership.

---

# 31. Relationship to Current Assessment Authority

CurrentAssessmentAuthority determines which assessment is currently
authoritative for an Organization × Framework pair.

Applicability belongs to the assessment context.

Therefore:

historical assessment
→ preserves historical applicability

current authoritative assessment
→ supplies current applicability-backed compliance result

Changing CurrentAssessmentAuthority must not mutate the historical
applicability records of either assessment.

---

# 32. Relationship to Organization Compliance Aggregation

Organization compliance aggregation currently consumes authoritative
framework assessment scores.

Applicability must therefore be resolved before an assessment score is
considered trustworthy.

Organization aggregation must not independently determine regulatory
applicability.

Its responsibility remains aggregation of authoritative assessment
results.

---

# 33. Relationship to Executive AI

Executive AI must consume applicability-aware compliance results only
after this foundation is implemented and validated.

Future AI context may distinguish:

- applicable compliant obligations;
- applicable non-compliant obligations;
- unresolved applicability;
- excluded requirements;
- missing regulatory facts.

AI must not convert UNDETERMINED into either APPLICABLE or
NOT_APPLICABLE without an authorized resolution process.

---

# 34. Relationship to Trust Score

Trust scoring must not interpret an unresolved applicability scope as
verified regulatory compliance.

Any future Trust Score integration must distinguish:

verified compliance within resolved scope

from:

unresolved regulatory applicability.

Trust integration remains outside this milestone.

---

# 35. POPIA Applicability Fact Families

The current POPIA catalogue suggests the following initial fact
families.

## 35.1 Processing Scope

Potential facts concerning:

- whether personal information is processed;
- collection;
- further processing;
- processing purposes;
- collection source.

## 35.2 Operator Relationships

Potential facts concerning:

- whether operators are used;
- what processing operators perform;
- operator authority;
- contractual relationships.

## 35.3 Special Information

Potential facts concerning:

- whether special personal information is processed;
- categories of special personal information;
- statutory or regulatory authorization.

## 35.4 Children's Information

Potential facts concerning:

- whether children's personal information is processed;
- authorization basis;
- competent-person involvement where relevant.

## 35.5 Prior Authorisation

Potential facts concerning:

- processing contemplated under section 57;
- whether prior authorisation is required;
- authorization status;
- processing commencement.

## 35.6 Direct Marketing

Potential facts concerning:

- whether direct marketing occurs;
- communication channel;
- electronic communication;
- consent or existing-customer context where relevant;
- objections and withdrawals.

## 35.7 Automated Decision-Making

Potential facts concerning:

- whether decisions are automated;
- whether processing is solely automated;
- legal or significant effects;
- statutory exception or permission;
- safeguards.

## 35.8 Transborder Processing

Potential facts concerning:

- whether information is transferred;
- destination;
- recipient;
- whether recipient is in a foreign country;
- transfer condition.

## 35.9 Security Events

Potential facts concerning:

- whether a security event occurred;
- whether there are reasonable grounds for the statutory trigger;
- affected information;
- event timing;
- response state.

## 35.10 Data Subject Events

Potential facts concerning:

- qualifying requests;
- disputes;
- objections;
- withdrawals;
- restriction circumstances.

These are domain families, not approved database columns.

---

# 36. Architecture Decision Summary

The applicability foundation adopts the following conceptual
architecture:

1. Applicability is separate from evidence.
2. Applicability is separate from catalogue activation.
3. Applicability is separate from mandatory status.
4. Applicability uses APPLICABLE, NOT_APPLICABLE and UNDETERMINED.
5. Applicability is resolved at Assessment × Requirement scope.
6. Regulatory facts require provenance.
7. Current organization facts and historical assessment context must
   remain distinguishable.
8. Missing facts must preserve uncertainty.
9. Only applicable active requirements participate in evidence-based
   compliance scoring.
10. Undetermined requirements are excluded from the compliance score
    but explicitly reported as unresolved scope.
11. Evidence statuses remain unchanged.
12. AI is advisory and must not silently manufacture authoritative
    legal applicability.
13. Historical assessments must preserve the applicability basis used
    at the time.
14. POPIA-specific processing facts must not be embedded directly into
    Organization merely for implementation convenience.
15. Persistence design must follow domain architecture rather than
    dictate it.

---

# 37. Open Questions Before Persistence Design

The following questions remain deliberately unresolved:

1. Should ApplicabilityDefinition be persisted separately or stored as
   structured ComplianceRequirement metadata?

2. Should regulatory fact definitions be global, framework-scoped, or
   reusable across frameworks?

3. How should typed fact values be represented without creating an
   unsafe generic-value model?

4. Should assessment fact snapshots duplicate values or reference
   immutable fact versions?

5. Which applicability resolutions may be deterministic and which
   require human authorization?

6. What authority is required to override an applicability resolution?

7. How should stale facts affect existing and future assessments?

8. Should EVENT_TRIGGERED applicability be represented as ordinary
   applicability or through a related event domain?

9. How should general requirements with statutory exceptions be
   classified?

10. How should applicability coverage be calculated and presented?

11. How should applicability definitions be versioned when regulatory
    interpretation changes?

12. What exact provenance must be retained for automated,
    organization-declared and human-reviewed facts?

These questions must be resolved before the Prisma model is approved.

---

# 38. Implementation Gate

No applicability persistence implementation may begin until:

- this architecture has been reviewed;
- the 35-requirement applicability taxonomy has been normalized;
- regulatory fact families have been mapped to actual requirements;
- resolution authority has been defined;
- historical preservation semantics have been approved;
- scoring eligibility behaviour has been tested conceptually;
- tenant-integrity requirements have been defined;
- the persistence model has been separately stress-tested.

---

# 39. Milestone Boundary

Milestone 8A.3.2 defines the applicability domain architecture.

It does not implement it.

Expected next work:

8A.3.3 — POPIA Applicability Fact Matrix and Resolution Mapping

followed by:

8A.3.4 — Applicability Persistence Architecture

Only after those designs pass review should Prisma implementation be
considered.

---

# 40. Final Principle

ComplianceOS must never obtain a better compliance score merely
because it does not know whether a legal obligation applies.

Regulatory uncertainty must remain visible, explainable and auditable
until it is legitimately resolved.
