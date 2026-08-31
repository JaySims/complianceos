# ComplianceOS POPIA Applicability Resolution Grammar v1

## Milestone

Milestone 8A.3.3 — POPIA Applicability Fact Matrix and Resolution Mapping

Substage:

8A.3.3A — Applicability Resolution Grammar

## Status

ARCHITECTURE DRAFT — NOT YET IMPLEMENTED

This document defines the deterministic applicability-resolution grammar
that must be used when mapping POPIA requirements to regulatory facts.

It does not authorize:

- Prisma schema changes;
- database migrations;
- production catalogue provisioning;
- compliance-engine changes;
- automated legal conclusions;
- production applicability resolution;
- production scoring changes.

---

# 1. Purpose

The POPIA requirement catalogue contains 35 candidate atomic
requirements.

Each requirement has an applicability rule.

However, those rules do not all have the same legal or logical
structure.

ComplianceOS must therefore not resolve every requirement using a
generic Boolean expression such as:

`fact == true → APPLICABLE`

The system must first understand the resolution grammar of the
requirement.

This document defines that grammar.

---

# 2. Governing Architecture

Applicability resolution follows the locked ComplianceOS architecture:

Regulatory Catalogue
→ Applicability Definition
→ Regulatory Facts
→ Applicability Resolution
→ Applicable Requirements
→ Evidence
→ Verification
→ Requirement Compliance Status
→ Compliance Score

Applicability is resolved before evidence evaluation.

The evidence engine must not decide legal scope.

---

# 3. Core Invariants

The following invariants remain mandatory:

ACTIVE ≠ APPLICABLE

MANDATORY ≠ UNIVERSAL

MISSING EVIDENCE ≠ NOT_APPLICABLE

UNKNOWN FACT ≠ FALSE

UNDETERMINED ≠ COMPLIANT

UNDETERMINED ≠ NON_COMPLIANT

A missing fact must never silently become a negative fact.

A missing fact must never silently remove a legal obligation.

---

# 4. Applicability Result States

Every assessment-level requirement applicability determination must
resolve to exactly one of:

## APPLICABLE

The requirement governs the organization in the relevant assessment
context.

## NOT_APPLICABLE

The system has sufficient authoritative facts and rule basis to
establish that the requirement does not govern the organization in the
relevant assessment context.

## UNDETERMINED

The system does not yet have sufficient authoritative facts or legal
resolution to determine applicability safely.

UNDETERMINED is a scope-resolution state.

It is not an evidence status.

---

# 5. Applicability Class

The high-level catalogue applicability classes are:

- GENERAL
- CONDITIONAL
- SECTOR_SPECIFIC
- EVENT_TRIGGERED

These classes describe the broad nature of the obligation.

They do not replace the detailed Applicability Rule.

---

# 6. Resolution Pattern

Applicability Class and Resolution Pattern are separate concepts.

A requirement may belong to a broad applicability class while requiring
a more specific resolution pattern.

The initial resolution patterns are:

1. GENERAL_UNCONDITIONAL
2. GENERAL_WITH_EXCEPTION
3. ACTIVITY_CONDITIONAL
4. RELATIONSHIP_CONDITIONAL
5. PROCESSING_CATEGORY_CONDITIONAL
6. EVENT_TRIGGERED
7. REQUEST_OR_DISPUTE_TRIGGERED
8. PRIOR_AUTHORISATION_CONDITIONAL
9. SECTOR_SPECIFIC
10. COMPOUND_CONDITIONAL

These are architecture-level patterns.

They are not yet approved database enums.

---

# 7. GENERAL_UNCONDITIONAL

## Definition

The requirement applies generally to organizations within the
framework's governing scope and does not require an additional
organization-specific triggering fact.

## Resolution

If:

- the requirement is active;
- the framework governs the organization; and
- no catalogue-level exclusion applies;

then:

→ APPLICABLE

No organization-specific positive applicability fact is required merely
to establish ordinary applicability.

## Unknown Organization Facts

Unknown unrelated organization facts do not convert a genuinely general
requirement into UNDETERMINED.

## Safety Rule

A requirement must not be classified as GENERAL_UNCONDITIONAL merely
because its current catalogue rule says "General".

Its source and legal structure must support that interpretation.

---

# 8. GENERAL_WITH_EXCEPTION

## Definition

A requirement may express a general obligation while legislation also
provides one or more statutory exceptions.

ComplianceOS must distinguish between:

1. an exception that changes whether the requirement itself applies;
   and
2. an exception that changes how an already-applicable requirement may
   lawfully be satisfied.

These are different legal effects.

## Applicability Exception

Where the legal rule establishes that a statutory exception removes the
requirement itself from the relevant organization, processing activity,
event, or assessment context:

exception affirmatively established

→ NOT_APPLICABLE

only where the authoritative legal rule makes non-applicability the
correct result.

## Compliance or Control Exception

Where the underlying requirement remains applicable but an exception
changes the permitted method, control, conduct, or evidence required:

→ APPLICABLE

The exception must then be evaluated within the requirement's
compliance or control logic.

It must not be used to remove the requirement from the compliance-score
denominator merely because an alternative lawful route exists.

## Unknown Exception Facts

Unknown facts about a possible exception must never silently remove a
general obligation.

Where the underlying obligation is general:

general obligation established
+
exception unknown or not established

→ APPLICABLE

unless authoritative legal analysis establishes that the exception
changes applicability itself.

## Example — Direct Collection

A rule requiring personal information to be collected directly unless
a statutory exception permits indirect collection may remain an
applicable requirement even when indirect collection is permitted.

In that case:

requirement applicability

→ APPLICABLE

while:

direct collection
or
lawful statutory exception permitting indirect collection

belongs to compliance evaluation.

The existence of a lawful alternative does not automatically make the
requirement NOT_APPLICABLE.

## Safety Rule

Every statutory exception encountered during applicability mapping must
be classified as either:

- APPLICABILITY_EXCEPTION; or
- COMPLIANCE_CONTROL_EXCEPTION.

If its legal effect is unclear:

→ REGULATORY_REVIEW

ComplianceOS must not infer NOT_APPLICABLE merely from the existence of
an exception.

---

# 9. ACTIVITY_CONDITIONAL

## Definition

The requirement applies only when the organization performs a specified
activity.

Examples may include:

- further processing;
- electronic direct marketing;
- processing for direct marketing;
- international transfer activity.

## Activity Established

Qualifying activity = TRUE

→ APPLICABLE

## Activity Authoritatively Absent

Qualifying activity = FALSE

→ NOT_APPLICABLE

## Activity Unknown

Qualifying activity = UNKNOWN

→ UNDETERMINED

---

# 10. RELATIONSHIP_CONDITIONAL

## Definition

The requirement applies when a specified regulatory relationship exists.

An important POPIA example is the use of an operator to process personal
information.

## Relationship Established

Qualifying relationship = TRUE

→ APPLICABLE

## Relationship Authoritatively Absent

Qualifying relationship = FALSE

→ NOT_APPLICABLE

## Relationship Unknown

Qualifying relationship = UNKNOWN

→ UNDETERMINED

## Safety Rule

The absence of an operator contract is not proof that no operator
relationship exists.

The system must resolve the underlying relationship, not merely the
presence or absence of documentation.

---

# 11. PROCESSING_CATEGORY_CONDITIONAL

## Definition

The requirement applies because the organization processes a particular
category of personal information or data subject information.

Examples include:

- special personal information;
- regulated categories of special personal information;
- children's personal information.

## Processing Established

Qualifying processing = TRUE

→ APPLICABLE

## Processing Authoritatively Absent

Qualifying processing = FALSE

→ NOT_APPLICABLE

## Processing Unknown

Qualifying processing = UNKNOWN

→ UNDETERMINED

## Safety Rule

A missing data inventory must not be interpreted as proof that the
organization does not process the category.

---

# 12. EVENT_TRIGGERED

## Definition

The requirement becomes operational because a qualifying event has
occurred or qualifying grounds exist.

## Event Established

Qualifying event = TRUE

→ APPLICABLE

for the relevant event context.

## Event Authoritatively Absent

Qualifying event = FALSE

→ NOT_APPLICABLE

for the event-response obligation in the relevant assessment/event
context.

## Event Unknown

Qualifying event = UNKNOWN

→ UNDETERMINED

## Event Scope

Event-triggered requirements require special care because an
organization may experience:

- zero events;
- one event;
- multiple events;
- unresolved suspected events.

A single assessment-level Boolean may therefore be insufficient for
future persistence.

Event-instance architecture remains an open persistence question.

## Preparedness vs Response

ComplianceOS must distinguish:

1. standing preparedness obligations; and
2. activated event-response obligations.

The absence of an event must not be interpreted as proof that
preparedness controls are compliant.

---

# 13. REQUEST_OR_DISPUTE_TRIGGERED

## Definition

The requirement applies when a qualifying data-subject request,
objection, correction matter, restriction matter, or dispute exists.

## Qualifying Matter Established

Qualifying request/dispute = TRUE

→ APPLICABLE

for the relevant matter.

## Qualifying Matter Authoritatively Absent

Qualifying request/dispute = FALSE

→ NOT_APPLICABLE

for the triggered response obligation in the relevant context.

## Qualifying Matter Unknown

Qualifying request/dispute = UNKNOWN

→ UNDETERMINED

## Matter Instances

Like security events, multiple requests or disputes may exist.

Future persistence may therefore require matter-level instances rather
than only an organization-level Boolean.

---

# 14. PRIOR_AUTHORISATION_CONDITIONAL

## Definition

The requirement depends on whether contemplated or actual processing
falls within the statutory prior-authorisation regime.

This pattern must not be reduced to:

organization processes personal information = TRUE.

It requires a more specific legal-scope determination.

## Potential Prior-Authorisation Processing Established

Where facts indicate that contemplated processing may fall within the
relevant statutory category:

the requirement may require further legal resolution.

This may produce:

→ UNDETERMINED

until the relevant processing characteristics are resolved.

## Prior Authorisation Required

Where authoritative facts and legal rule establish that prior
authorisation is required:

→ APPLICABLE

## Prior Authorisation Not Required

Where authoritative facts and legal rule establish that the processing
does not require prior authorisation:

→ NOT_APPLICABLE

for the prior-authorisation requirement.

## Safety Rule

Uncertainty must not become NOT_APPLICABLE.

---

# 15. SECTOR_SPECIFIC

## Definition

The requirement applies only where the organization, activity,
processing category, profession, industry, or regulatory context falls
within a defined sector-specific scope.

## Sector Scope Established

Qualifying sector scope = TRUE

→ APPLICABLE

## Sector Scope Authoritatively Absent

Qualifying sector scope = FALSE

→ NOT_APPLICABLE

## Sector Scope Unknown

Qualifying sector scope = UNKNOWN

→ UNDETERMINED

## Safety Rule

`Organization.industry` may assist resolution but must not automatically
be treated as sufficient regulatory proof.

Sector applicability may require more precise facts than a commercial
industry label.

---

# 16. COMPOUND_CONDITIONAL

## Definition

Some requirements depend on more than one regulatory fact or condition.

A compound rule may use:

- AND;
- OR;
- NOT;
- threshold;
- category membership;
- temporal conditions;
- event conditions;
- relationship conditions.

## Example Structure

Fact A
AND
Fact B

→ APPLICABLE

But the system must use explicit three-valued logic.

---

# 17. Three-Valued Logic

ComplianceOS must not use ordinary two-valued Boolean logic where facts
may be unknown.

Each required Boolean-like regulatory fact conceptually has:

TRUE

FALSE

UNKNOWN

UNKNOWN is a first-class knowledge state.

It is not equivalent to FALSE.

---

# 18. Three-Valued AND

For applicability conditions:

TRUE AND TRUE
→ TRUE

TRUE AND FALSE
→ FALSE

FALSE AND TRUE
→ FALSE

FALSE AND FALSE
→ FALSE

TRUE AND UNKNOWN
→ UNKNOWN

UNKNOWN AND TRUE
→ UNKNOWN

UNKNOWN AND UNKNOWN
→ UNKNOWN

FALSE AND UNKNOWN
→ FALSE only where the known FALSE fact is independently sufficient to
make the complete legal condition impossible.

UNKNOWN AND FALSE
→ FALSE only under the same rule.

## Safety Qualification

Logical short-circuiting may only be used when the legal rule confirms
that the known fact is independently dispositive.

---

# 19. Three-Valued OR

TRUE OR TRUE
→ TRUE

TRUE OR FALSE
→ TRUE

FALSE OR TRUE
→ TRUE

TRUE OR UNKNOWN
→ TRUE only where the known TRUE fact independently satisfies the legal
condition.

UNKNOWN OR TRUE
→ TRUE under the same rule.

FALSE OR FALSE
→ FALSE

FALSE OR UNKNOWN
→ UNKNOWN

UNKNOWN OR FALSE
→ UNKNOWN

UNKNOWN OR UNKNOWN
→ UNKNOWN

---

# 20. Negation

NOT TRUE
→ FALSE

NOT FALSE
→ TRUE

NOT UNKNOWN
→ UNKNOWN

Negation must not be used to infer facts merely from missing evidence.

---

# 21. Fact Knowledge vs Fact Value

ComplianceOS must distinguish:

- the value of a regulatory fact; and
- whether that value is sufficiently known and authoritative.

For example:

`usesOperators = false`

is materially different from:

`usesOperators = unknown`

The first is an affirmative factual determination.

The second means the system lacks sufficient knowledge.

---

# 22. Fact Provenance

A fact used for applicability should have a defensible basis.

Potential sources include:

- organization declaration;
- verified organization profile;
- contract or agreement;
- system integration;
- verified document;
- authorized human review;
- regulatory determination;
- controlled deterministic derivation.

The matrix must identify expected provenance where material.

---

# 23. Fact Freshness

Some regulatory facts may become stale.

Examples:

- organization begins electronic direct marketing;
- organization appoints an operator;
- organization begins processing children's information;
- organization starts international transfers;
- a security compromise occurs;
- a new automated decision process is introduced.

Applicability resolution must not assume that an old fact remains true
forever.

Fact freshness policy will be designed before persistence.

---

# 24. Assessment Snapshot

Applicability must remain historically interpretable.

An assessment must therefore preserve or reference the regulatory facts
and rule version used when applicability was resolved.

Later organization changes must not silently rewrite historical
assessment applicability.

---

# 25. Resolution Authority

Applicability may eventually be resolved through:

- deterministic rules;
- authoritative regulatory facts;
- authorized human review;
- controlled legal interpretation.

AI may:

- identify missing facts;
- explain why a fact matters;
- suggest likely applicability;
- summarize supporting material;
- assist reviewers.

AI must not independently manufacture authoritative legal applicability.

---

# 26. Resolution Reason

Every applicability result must be explainable.

A future resolution should be able to answer:

- which requirement was evaluated;
- which applicability rule was used;
- which facts were evaluated;
- what their values were;
- whether any facts were unknown;
- which rule version was used;
- what result was produced;
- why that result followed;
- who or what authorized the determination.

---

# 27. Scoring Boundary

Only active requirements resolved as:

APPLICABLE

may enter the locked evidence-driven compliance scoring engine.

NOT_APPLICABLE requirements are excluded.

UNDETERMINED requirements are excluded from the compliance denominator
but must remain visible as unresolved regulatory scope.

A compliance score must not be represented as complete regulatory
coverage when unresolved applicability remains.

Applicability Coverage must accompany or qualify the compliance score
where unresolved scope exists.

---

# 28. Score Qualification Invariant

A mathematically valid compliance score is not necessarily a complete
regulatory-compliance representation.

Example:

Resolved applicable requirements: 10

Verified applicable requirements: 10

Unresolved applicability requirements: 8

Compliance score over resolved applicable scope:

100%

Applicability coverage:

27 / 35 resolved

The system must not communicate this merely as:

"100% compliant"

without qualification.

The unresolved scope must remain visible.

---

# 29. Current POPIA Catalogue Inventory

The locked POPIA candidate catalogue contains:

35 atomic requirements.

All 35 contain an applicability rule.

Current explicit applicability-class declarations:

- CONDITIONAL: 11
- UNCLASSIFIED: 24

UNCLASSIFIED does not mean GENERAL.

The 24 requirements must be normalized through legal and architectural
review.

---

# 30. Known Resolution-Pattern Candidates

The following are architectural candidates derived from the current
catalogue wording.

They are not yet final legal classifications.

## Likely General

Candidate examples include requirements whose current applicability rule
is:

`General`

These require source verification before being assigned
GENERAL_UNCONDITIONAL.

## Exception-Bearing Requirements

Candidate example:

- POPIA-PLM-004

POPIA-PLM-004 expresses a general direct-collection rule with statutory
exceptions.

Its statutory exceptions may affect compliance with the collection
method rather than removing applicability of the underlying
requirement.

It therefore requires explicit classification of the exception as an
APPLICABILITY_EXCEPTION or COMPLIANCE_CONTROL_EXCEPTION.

POPIA-OPN-002 should not be grouped here merely because its notification
rule contains statutory exceptions.

Its primary applicability trigger is the activity of collecting
personal information.

It is therefore a candidate for ACTIVITY_CONDITIONAL resolution, with
its statutory exceptions separately analyzed at the control level.

## Activity Conditional

Candidate examples include:

- POPIA-FPL-001
- POPIA-DM-001
- POPIA-DM-002
- POPIA-DM-003
- POPIA-TBF-001

## Relationship Conditional

Candidate examples include:

- POPIA-SEC-003
- POPIA-SEC-004

## Processing Category Conditional

Candidate examples include:

- POPIA-SPI-001
- POPIA-SPI-002
- POPIA-CHD-001

## Event Triggered

Candidate example:

- POPIA-SEC-005

## Request or Dispute Triggered

Candidate example:

- POPIA-DSP-003

## Prior Authorisation Conditional

Candidate examples include:

- POPIA-PA-001
- POPIA-PA-002

## Automated Decision Compound Conditions

Candidate examples include:

- POPIA-ADM-001
- POPIA-ADM-002

These may require COMPOUND_CONDITIONAL resolution because section 71
scope depends on more than the mere use of automation.

---

# 31. No Mechanical Classification

The matrix must not classify a requirement solely from keywords.

Examples:

"General"

does not automatically prove GENERAL_UNCONDITIONAL.

"Where"

does not automatically prove CONDITIONAL.

"Subject to exceptions"

does not automatically prove NOT_APPLICABLE when an exception exists.

Each requirement must be mapped according to its actual regulatory
structure.

---

# 32. Exception Classification

Statutory exceptions must not be treated as a single applicability
concept.

Each exception encountered during requirement mapping must be classified
according to its actual legal effect.

## APPLICABILITY_EXCEPTION

An exception is an APPLICABILITY_EXCEPTION only where the authoritative
legal rule removes the requirement itself from the relevant scope.

Where affirmatively established:

→ NOT_APPLICABLE

may be the correct applicability result.

## COMPLIANCE_CONTROL_EXCEPTION

An exception is a COMPLIANCE_CONTROL_EXCEPTION where the underlying
requirement remains applicable but the exception changes:

- the permitted conduct;
- the required control;
- the lawful method;
- the evidence required; or
- the manner in which compliance may be demonstrated.

In this case:

→ APPLICABLE

remains the applicability result.

The exception belongs to compliance evaluation rather than requirement
exclusion.

## Unclear Legal Effect

Where it is unclear whether an exception changes applicability or only
changes compliance:

→ REGULATORY_REVIEW

The system must not guess.

---

# 33. Fact Matrix Requirements

The 8A.3.3 fact matrix must contain, at minimum:

- requirement code;
- requirement title;
- catalogue applicability rule;
- normalized applicability class;
- resolution pattern;
- required regulatory fact keys;
- fact meaning;
- fact value possibilities;
- TRUE resolution;
- FALSE resolution;
- UNKNOWN resolution;
- exception classification;
- exception logic;
- event or matter scope where relevant;
- expected provenance;
- freshness sensitivity;
- resolution authority;
- scoring eligibility;
- unresolved-scope behavior;
- notes requiring regulatory review.

---

# 34. Regulatory Fact Naming

Fact keys should describe real regulatory facts rather than UI fields.

Preferred conceptual style:

`processing.special_personal_information`

`processing.children_personal_information`

`processing.further_processing`

`processing.collects_personal_information`

`relationships.uses_operator`

`marketing.electronic_direct_marketing`

`marketing.personal_information_for_direct_marketing`

`transfers.foreign_country_third_party`

`automation.solely_automated_decision`

`security.qualifying_compromise`

`data_subject.qualifying_request_or_dispute`

Fact names remain conceptual until the complete matrix is reviewed.

---

# 35. Fact Reuse

Multiple requirements may depend on the same regulatory fact.

The system should reuse shared facts where their legal meaning is
identical.

It must not create duplicate facts merely because multiple requirements
reference them.

However, superficially similar facts must not be merged where their
legal meaning differs.

---

# 36. Derived Facts

Some applicability facts may be deterministically derived from more
primitive facts.

Example concept:

specific automated-processing characteristics
→ qualifying section 71 processing

Derived facts must:

- identify their inputs;
- preserve derivation logic;
- preserve rule version;
- preserve provenance;
- remain explainable.

Derived facts must not hide uncertainty.

---

# 37. Human Review

Some applicability questions may require authorized review.

Human review must not be used as an excuse to abandon deterministic
logic where the law and facts support deterministic resolution.

Conversely, deterministic automation must not be forced where legal
interpretation remains necessary.

---

# 38. Event and Matter Instances

The following areas may require future instance-level architecture:

- security compromises;
- data-subject requests;
- disputes;
- prior-authorisation matters;
- possibly international-transfer arrangements.

The 8A.3.3 matrix must identify where organization-level facts are
insufficient.

---

# 39. Tenant Integrity

Facts used to resolve applicability for an assessment must belong to or
be validly associated with the same organization.

The system must reject:

- cross-organization fact references;
- assessment/organization mismatch;
- requirement/framework mismatch;
- event/organization mismatch;
- matter/organization mismatch.

---

# 40. Historical Integrity

Changing a current organization fact must not rewrite historical
assessment applicability.

Changing a future applicability rule must not silently reinterpret an
old assessment.

Applicability definitions and resolution logic therefore require
version-aware historical semantics.

---

# 41. Catalogue Integrity

Applicability metadata must remain subordinate to the authoritative
regulatory requirement.

A requirement's applicability definition must not:

- change the underlying legal obligation;
- invent an obligation;
- remove a statutory obligation;
- broaden scope without authority;
- narrow scope without authority.

---

# 42. Regulatory Review Flag

The fact matrix must support explicit identification of rows requiring:

REGULATORY_REVIEW

This is preferable to guessing.

A requirement requiring legal clarification must remain unresolved for
production purposes until reviewed.

---

# 43. Production Safety

No candidate requirement may become production-scoring eligible merely
because a matrix row exists.

Production scoring requires:

1. authoritative requirement approval;
2. applicability-definition approval;
3. regulatory-fact model approval;
4. resolution-rule approval;
5. persistence architecture approval;
6. deterministic provisioning;
7. integrity verification;
8. explicit production authorization.

---

# 44. 8A.3.3 Mapping Sequence

The mapping work should proceed in controlled groups.

Recommended sequence:

1. genuinely general requirements;
2. exception-bearing requirements;
3. operator/relationship requirements;
4. special-information requirements;
5. children's-information requirements;
6. prior-authorisation requirements;
7. direct-marketing requirements;
8. automated-decision requirements;
9. transborder requirements;
10. event-triggered security requirements;
11. request/dispute-triggered requirements;
12. remaining activity-dependent requirements.

Each group should be reviewed before final normalization.

---

# 45. Persistence Boundary

This document deliberately does not decide:

- Prisma models;
- database tables;
- database enums;
- JSON structures;
- indexes;
- uniqueness constraints;
- API contracts.

Those decisions belong to:

Milestone 8A.3.4 — Applicability Persistence Architecture

after the fact matrix demonstrates the actual domain requirements.

---

# 46. Implementation Boundary

No Prisma applicability implementation may begin during 8A.3.3.

No migration may be created.

No production database operation may occur.

No existing compliance-engine behavior may be modified.

No Trust Score or Executive AI integration may occur.

---

# 47. 8A.3.3A Exit Criteria

The Resolution Grammar may advance when:

- three-state applicability is preserved;
- general requirements are distinguished from conditional ones;
- applicability exceptions are distinguished from compliance/control
  exceptions;
- statutory exceptions cannot silently remove requirements;
- event-triggered obligations are distinguished from preparedness;
- request/dispute triggers are recognized;
- prior-authorisation complexity is recognized;
- compound conditions support three-valued logic;
- unknown facts cannot silently become false;
- score qualification is preserved;
- fact provenance is preserved;
- fact freshness is recognized;
- historical integrity is preserved;
- AI authority remains bounded;
- no persistence design has been prematurely selected.

---

# 48. Next Deliverable

After this grammar passes review, create:

POPIA_APPLICABILITY_FACT_MATRIX_V1.md

That document will map all 35 POPIA candidate requirements to:

Requirement
→ Applicability Class
→ Resolution Pattern
→ Regulatory Facts
→ Three-State Resolution
→ Exception Classification
→ Provenance
→ Freshness
→ Resolution Authority
→ Scoring Eligibility

Only after the complete matrix passes review may ComplianceOS proceed
toward applicability persistence architecture.

---

# 49. Final Principle

ComplianceOS must know the difference between:

an obligation that applies,

an obligation that does not apply,

an obligation whose applicability has not yet been safely determined,

and an exception that changes how an applicable obligation may lawfully
be satisfied.

Uncertainty must remain visible until it is resolved.

The existence of a statutory exception must not automatically remove a
requirement from scope.

The system must never obtain a better compliance result merely because
it lacks the facts needed to determine regulatory scope.
