# POPIA Applicability Fact Matrix V1

## 1. Document Status

**Milestone:** 8A.3.3 — POPIA Applicability Fact Matrix and Resolution Mapping  
**Component:** 8A.3.3C — Applicability Fact Matrix  
**Status:** DESIGN DRAFT — NOT YET IMPLEMENTED  
**Framework:** Protection of Personal Information Act 4 of 2013 (POPIA)  
**Catalogue:** `docs/compliance/catalogues/popia/POPIA_REQUIREMENTS_V1.md`  
**Resolution Grammar:** `docs/compliance/architecture/POPIA_APPLICABILITY_RESOLUTION_GRAMMAR_V1.md`  
**Architecture Foundation:** `docs/compliance/architecture/APPLICABILITY_DOMAIN_MODEL_V1.md`

This document defines the regulatory facts and applicability-resolution
mapping required to determine whether each POPIA catalogue requirement
is:

- `APPLICABLE`;
- `NOT_APPLICABLE`; or
- `UNDETERMINED`.

This document is an architecture and regulatory-domain specification.

It does not:

- create Prisma models;
- create database migrations;
- provision production catalogue records;
- create organization regulatory facts;
- create assessment applicability records;
- modify the compliance engine;
- modify compliance scoring;
- create API routes;
- authorize AI to determine legal applicability;
- modify Trust Score logic;
- modify Executive AI logic; or
- authorize production scoring using these rules.

Implementation requires a separately reviewed and approved milestone.

---

# 2. Purpose

The ComplianceOS evidence-driven compliance engine requires a reliable
boundary between:

1. requirements that exist in the regulatory catalogue; and
2. requirements that actually apply to a particular organization or
   assessment context.

An active requirement is not automatically applicable.

A mandatory requirement is not automatically universal.

A requirement must not enter the compliance-score denominator merely
because it exists in the catalogue.

Applicability must first be resolved using authoritative regulatory
facts and an approved resolution rule.

The intended pipeline is:

```text
Regulatory Catalogue
        ↓
Applicability Definition
        ↓
Regulatory Facts
        ↓
Applicability Resolution
        ↓
APPLICABLE Requirements
        ↓
Evidence
        ↓
Verification
        ↓
Requirement Compliance Status
        ↓
Compliance Score
```

The purpose of this matrix is to make that applicability layer explicit
for the POPIA V1 candidate catalogue.

---

# 3. Governing Invariants

The following invariants are mandatory.

## 3.1 ACTIVE is not APPLICABLE

`ComplianceRequirement.active = true` means that the catalogue
requirement is active.

It does not establish that the requirement applies to every
organization.

## 3.2 MANDATORY is not UNIVERSAL

`mandatory = true` means that the requirement is mandatory once it is
applicable.

It does not mean that every organization is automatically subject to
the requirement.

## 3.3 Missing evidence is not non-applicability

Failure to find evidence of compliance must never establish
`NOT_APPLICABLE`.

Applicability is resolved from regulatory facts.

Compliance is evaluated from evidence after applicability is resolved.

## 3.4 Unknown facts are not false facts

Where a fact required for applicability cannot be established with
sufficient authority, the fact remains unknown.

Unknown must not be silently converted to false.

## 3.5 Undetermined is not compliant

`UNDETERMINED` means ComplianceOS does not yet possess sufficient
authoritative information to determine applicability.

It does not mean:

- compliant;
- not applicable;
- no risk;
- no obligation; or
- no further action required.

## 3.6 Applicability precedes evidence scoring

Only requirements resolved as `APPLICABLE` may enter the existing
evidence-driven requirement-status and scoring pipeline.

`NOT_APPLICABLE` requirements are excluded.

`UNDETERMINED` requirements are excluded from the compliance-score
denominator but must remain visible as unresolved regulatory scope.

## 3.7 Applicability must be historically reproducible

Assessment results must be explainable using the facts and rule version
that existed for the relevant assessment context.

Later changes to organization facts must not silently rewrite historical
assessment applicability.

## 3.8 No silent score improvement

ComplianceOS must never improve an organization's compliance result
merely because the system lacks sufficient facts to determine scope.

A high compliance score with unresolved applicability must therefore be
qualified by separate applicability-resolution coverage.

---

# 4. Applicability Status

The authoritative applicability-result vocabulary for this design is:

```text
APPLICABLE
NOT_APPLICABLE
UNDETERMINED
```

### APPLICABLE

Sufficient authoritative facts establish that the requirement applies
within the relevant organization, assessment, activity, relationship,
event, matter, processing category, or other regulatory context.

### NOT_APPLICABLE

Sufficient authoritative facts establish that the requirement does not
apply within the relevant context.

### UNDETERMINED

Required regulatory facts are missing, unknown, stale, disputed,
insufficiently authoritative, or otherwise incapable of supporting a
defensible determination.

---

# 5. High-Level Applicability Classes

The matrix uses:

```text
GENERAL
CONDITIONAL
SECTOR_SPECIFIC
EVENT_TRIGGERED
```

These classes describe broad applicability behavior.

They do not replace the more precise resolution patterns defined by the
resolution grammar.

---

# 6. Resolution Patterns Used by This Matrix

The POPIA V1 matrix recognizes:

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

Not every available grammar pattern must be used by the current
35-requirement catalogue.

The pattern is selected from the substantive applicability semantics of
the requirement, not merely from the catalogue's original label.

---

# 7. Regulatory Fact Principles

## 7.1 Facts describe regulatory reality

Regulatory facts describe characteristics of the organization or the
relevant processing, relationship, event, matter, or assessment
context.

Examples include:

```text
processing.collects_personal_information
relationships.operator_processes_personal_information
processing.special_personal_information
processing.children_personal_information
security.qualifying_compromise
marketing.electronic_direct_marketing
transfers.personal_information_to_foreign_country_third_party
```

## 7.2 Facts are not compliance evidence

A regulatory fact determines whether an obligation applies.

Evidence determines whether an applicable obligation is satisfied.

For example:

```text
relationships.operator_processes_personal_information = TRUE
```

may make an operator-related requirement applicable.

The existence of a compliant operator agreement is then evidence of
compliance.

The absence of the agreement must not be used to infer that no operator
relationship exists.

## 7.3 Facts require knowledge state

A Boolean fact must not be represented merely as:

```text
TRUE
FALSE
```

The architecture must preserve whether the value is actually known.

Conceptually:

```text
value = TRUE | FALSE
knowledge = KNOWN | UNKNOWN
```

Future implementation may support additional states such as:

```text
DECLARED
VERIFIED
DISPUTED
STALE
```

Those states are not approved by this document as final persistence
semantics.

## 7.4 Facts require provenance

A regulatory fact should be capable of recording sufficient provenance
to explain why ComplianceOS accepted it.

Potential provenance includes:

- organization declaration;
- processing inventory;
- contract or relationship register;
- policy or governance record;
- system inventory;
- incident record;
- data-flow analysis;
- legal review;
- compliance review;
- verified document;
- authorized human determination; or
- another approved authoritative source.

## 7.5 Facts may be freshness-sensitive

Some facts may change materially over time.

Examples include:

- processing activities;
- operator relationships;
- marketing activities;
- automated decision systems;
- international transfers;
- security incidents; and
- contemplated processing requiring prior-authorisation screening.

A stale historical fact must not silently control a later assessment.

---

# 8. Core Fact Dictionary

This section defines the primary fact vocabulary required by the current
POPIA applicability matrix.

The vocabulary is conceptual and does not authorize database schema.

## 8.1 Processing Activity Facts

### `processing.personal_information_processed_further`

Meaning:

Whether personal information is being processed further beyond the
original collection purpose within the relevant assessment context.

Primary consumer:

- `POPIA-FPL-001`

### `processing.collects_personal_information`

Meaning:

Whether the organization collects personal information in a context
within which the section 18 notification obligation must be considered.

Primary consumer:

- `POPIA-OPN-002`

Statutory notification exceptions must be evaluated separately from the
existence of the collection activity.

## 8.2 Operator Relationship Facts

### `relationships.operator_processes_personal_information`

Meaning:

Whether an operator processes personal information for, or under the
relevant authority of, the responsible party within the assessed
context.

Primary consumers:

- `POPIA-SEC-003`
- `POPIA-SEC-004`

The absence of an operator agreement does not establish this fact as
false.

## 8.3 Security Event Facts

### `security.qualifying_compromise`

Meaning:

Whether there are reasonable grounds within the relevant event context
to believe that personal information has been accessed or acquired by
an unauthorized person in circumstances engaging the section 22
obligation.

Primary consumer:

- `POPIA-SEC-005`

This fact is event-sensitive and requires event context.

## 8.4 Data Subject Matter Facts

### `data_subject.qualifying_request_or_dispute`

Meaning:

Whether a qualifying request, dispute, or related matter exists that
engages the restriction-of-processing obligation represented by
`POPIA-DSP-003`.

Primary consumer:

- `POPIA-DSP-003`

This fact may require matter-level context rather than organization-wide
persistence.

## 8.5 Special Personal Information Facts

### `processing.special_personal_information`

Meaning:

Whether the organization processes special personal information within
the scope relevant to sections 26 and 27.

Primary consumer:

- `POPIA-SPI-001`

Whether the processing is authorized is a compliance question and must
not be embedded in this applicability fact.

### `processing.section_28_33_special_category`

Meaning:

Whether the organization processes a category of special personal
information regulated by sections 28 to 33.

Primary consumer:

- `POPIA-SPI-002`

Future implementation may require category-specific or multi-value
detail.

This document does not authorize reducing all section 28 to 33
categories to independent database Boolean columns.

## 8.6 Children's Information Fact

### `processing.children_personal_information`

Meaning:

Whether the organization processes personal information concerning a
child within the relevant POPIA scope.

Primary consumer:

- `POPIA-CHD-001`

Whether an applicable authorization permits the processing is a
compliance question.

## 8.7 Prior Authorisation Facts

### `prior_authorisation.processing_may_fall_within_section_57`

Meaning:

Whether characteristics of contemplated processing establish a
sufficient basis for the organization to perform a section 57
prior-authorisation screening determination.

Primary consumer:

- `POPIA-PA-001`

This fact must not be inferred merely from the existence or absence of
a completed screening assessment.

The screening assessment is evidence of compliance with `PA-001`.

### `prior_authorisation.required`

Meaning:

Whether an authoritative applicability determination establishes that
the relevant processing requires prior authorisation.

Primary consumer:

- `POPIA-PA-002`

The existence of an authorization decision or application is evidence
related to compliance and must not be confused with the underlying
applicability fact.

## 8.8 Direct Marketing Facts

### `marketing.electronic_direct_marketing`

Meaning:

Whether the organization conducts direct marketing by electronic
communication within the relevant POPIA context.

Primary consumer:

- `POPIA-DM-001`

Consent, customer relationship, or another permitted section 69
condition concerns compliance and does not establish whether the
activity exists.

### `marketing.electronic_direct_marketing_communications_sent`

Meaning:

Whether electronic direct-marketing communications are sent within the
relevant context.

Primary consumer:

- `POPIA-DM-002`

The presence or absence of an unsubscribe mechanism does not establish
this fact.

### `marketing.personal_information_for_direct_marketing`

Meaning:

Whether personal information is processed for direct-marketing
purposes.

Primary consumer:

- `POPIA-DM-003`

Suppression controls, objections, consent withdrawals, and opt-out
records concern compliance after applicability is established.

## 8.9 Automated Decision-Making Facts

### `automation.solely_automated_decision`

Meaning:

Whether a relevant decision is based solely on automated processing.

Primary consumer:

- `POPIA-ADM-001`

### `automation.section_71_effect`

Meaning:

Whether the relevant solely automated decision has the effects
contemplated by section 71.

Primary consumer:

- `POPIA-ADM-001`

### `automation.qualifying_section_71_decision`

Meaning:

Whether the relevant decision has been authoritatively determined to
fall within the qualifying section 71 decision regime.

Primary consumer:

- `POPIA-ADM-002`

This fact may be derived from approved lower-level facts only where the
derivation rule is explicit, versioned, and legally defensible.

### `automation.permitted_subject_to_safeguards`

Meaning:

Whether the qualifying section 71 automated decision-making is
permitted under the relevant statutory position subject to safeguards.

Primary consumer:

- `POPIA-ADM-002`

The existence of a human-review process, representation mechanism, or
decision explanation is compliance evidence and must not establish this
fact.

## 8.10 Transborder Transfer Fact

### `transfers.personal_information_to_foreign_country_third_party`

Meaning:

Whether personal information is transferred to a third party in a
foreign country within the relevant assessment context.

Primary consumer:

- `POPIA-TBF-001`

Whether a section 72 transfer condition is satisfied is a compliance
question.

---

# 9. General Requirement Resolution

The following POPIA V1 requirements are treated as general
unconditional obligations subject to the governing scope of the
framework itself:

```text
POPIA-ACC-001
POPIA-PLM-001
POPIA-PLM-002
POPIA-PLM-003
POPIA-PLM-004
POPIA-PUR-001
POPIA-PUR-002
POPIA-IQ-001
POPIA-OPN-001
POPIA-SEC-001
POPIA-SEC-002
POPIA-DSP-001
POPIA-DSP-002
POPIA-IO-001
POPIA-IO-002
POPIA-IO-003
POPIA-IO-004
POPIA-IO-005
```

These requirements do not require an organization-specific conditional
fact merely to become applicable once the relevant POPIA framework
scope has been established.

Their normalized mapping is:

```text
Class: GENERAL
Pattern: GENERAL_UNCONDITIONAL
Resolution within established framework scope: APPLICABLE
```

This does not mean POPIA itself applies universally outside its legal
scope.

Framework-level scope remains a separate concern.

---

# 10. Exception-Bearing General Requirements

## 10.1 POPIA-PLM-004

`POPIA-PLM-004` establishes the direct-collection rule subject to
statutory exceptions.

For V1 applicability purposes:

```text
Class: GENERAL
Pattern: GENERAL_UNCONDITIONAL
```

The existence of a statutory exception is treated as a potential
compliance/control exception unless authoritative legal analysis proves
that a particular exception removes the requirement itself from scope.

Therefore:

```text
indirect collection
≠ NOT_APPLICABLE
```

and:

```text
missing direct-collection evidence
≠ NOT_APPLICABLE
```

The applicable exception and its legal effect belong to compliance
evaluation and regulatory review.

## 10.2 POPIA-PUR-002

The catalogue's reference to statutory retention exceptions does not,
by itself, convert the requirement into an applicability exception.

For V1:

```text
Class: GENERAL
Pattern: GENERAL_UNCONDITIONAL
```

Retention exceptions affect the permitted retention/control position.

They do not establish that the retention obligation itself is absent.

---

# 11. Collection Notification Requirement

## POPIA-OPN-002

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: ACTIVITY_CONDITIONAL
Primary Fact: processing.collects_personal_information
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / stale / insufficient
→ UNDETERMINED
```

Statutory notification exceptions must be evaluated separately.

The existence of an exception must not automatically be treated as
`NOT_APPLICABLE` unless authoritative legal analysis establishes that
the exception removes the obligation rather than changing the
compliance method.

---

# 12. Further Processing Requirement

## POPIA-FPL-001

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: ACTIVITY_CONDITIONAL
Primary Fact: processing.personal_information_processed_further
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / stale / insufficient
→ UNDETERMINED
```

Compatibility with the original purpose, or reliance on an applicable
statutory basis permitting otherwise, is evaluated after applicability.

The statutory basis is not evidence that further processing did not
occur.

---

# 13. Operator Requirements

## POPIA-SEC-003

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: RELATIONSHIP_CONDITIONAL
Primary Fact: relationships.operator_processes_personal_information
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / stale / insufficient
→ UNDETERMINED
```

## POPIA-SEC-004

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: RELATIONSHIP_CONDITIONAL
Primary Fact: relationships.operator_processes_personal_information
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / stale / insufficient
→ UNDETERMINED
```

The two requirements intentionally reuse the same relationship fact.

The operator contract, authorization controls, and confidentiality
controls are compliance evidence rather than applicability facts.

---

# 14. Security Compromise Requirement

## POPIA-SEC-005

Normalized mapping:

```text
Class: EVENT_TRIGGERED
Pattern: EVENT_TRIGGERED
Primary Fact: security.qualifying_compromise
Context: relevant security-compromise event
```

Resolution:

```text
KNOWN TRUE for event context
→ APPLICABLE

KNOWN authoritative FALSE for event context
→ NOT_APPLICABLE

UNKNOWN / unresolved event facts
→ UNDETERMINED
```

`SEC-005` must not become a permanent organization-wide compliance
penalty merely because no security compromise has occurred.

Standing security preparedness remains represented by the general
security requirements such as `SEC-001` and `SEC-002`.

Operational notification procedures must undergo current regulatory
review before production provisioning.

---

# 15. Data Subject Restriction Requirement

## POPIA-DSP-003

Normalized mapping:

```text
Class: EVENT_TRIGGERED
Pattern: REQUEST_OR_DISPUTE_TRIGGERED
Primary Fact: data_subject.qualifying_request_or_dispute
Context: relevant request, dispute, or matter
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE for the relevant matter

KNOWN authoritative FALSE
→ NOT_APPLICABLE for the triggered obligation

UNKNOWN / unresolved
→ UNDETERMINED
```

The wording describing the organization's capability to restrict
processing does not remove the explicit request-or-dispute trigger.

Future persistence may require matter-level applicability rather than
only organization-wide applicability.

---

# 16. Special Personal Information Requirements

## POPIA-SPI-001

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: PROCESSING_CATEGORY_CONDITIONAL
Primary Fact: processing.special_personal_information
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / stale / insufficient
→ UNDETERMINED
```

Whether processing is permitted by an applicable authorization is a
compliance question.

## POPIA-SPI-002

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: PROCESSING_CATEGORY_CONDITIONAL
Primary Fact: processing.section_28_33_special_category
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / insufficient category information
→ UNDETERMINED
```

`SPI-001` and `SPI-002` must not be collapsed into one regulatory fact.

The second requirement concerns category-specific obligations under
sections 28 to 33.

---

# 17. Children's Personal Information

## POPIA-CHD-001

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: PROCESSING_CATEGORY_CONDITIONAL
Primary Fact: processing.children_personal_information
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / stale / insufficient
→ UNDETERMINED
```

Whether an applicable authorization permits processing is a compliance
question rather than an applicability fact.

---

# 18. Prior Authorisation Requirements

## 18.1 POPIA-PA-001

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: PRIOR_AUTHORISATION_CONDITIONAL
Primary Fact:
prior_authorisation.processing_may_fall_within_section_57
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / insufficient processing characteristics
→ UNDETERMINED
```

`PA-001` concerns the obligation to identify whether contemplated
processing falls within a category requiring prior authorisation.

The system must avoid circular logic.

The absence of a completed prior-authorisation screening assessment
must not establish:

```text
prior_authorisation.processing_may_fall_within_section_57 = FALSE
```

The screening assessment is evidence of compliance with `PA-001`.

Applicability must instead arise from the relevant processing
characteristics.

## 18.2 POPIA-PA-002

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: PRIOR_AUTHORISATION_CONDITIONAL
Primary Fact: prior_authorisation.required
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / unresolved legal determination
→ UNDETERMINED
```

The existence of an application, submission confirmation, Regulator
correspondence, or authorization decision is compliance evidence.

It must not be substituted for the underlying applicability
determination.

## 18.3 Prior-authorisation stage separation

The following states must remain distinct:

```text
Potential section 57 scope
        ↓
PA-001 screening obligation
        ↓
Authoritative section 57 determination
        ↓
Prior authorisation required?
        ↓
PA-002 authorization obligation
```

The following facts therefore must not be collapsed:

```text
prior_authorisation.processing_may_fall_within_section_57
prior_authorisation.required
```

---

# 19. Direct Marketing Requirements

## 19.1 POPIA-DM-001

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: ACTIVITY_CONDITIONAL
Primary Fact: marketing.electronic_direct_marketing
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / stale / insufficient
→ UNDETERMINED
```

Consent, customer relationship, or another section 69 permission
condition concerns compliance.

## 19.2 POPIA-DM-002

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: ACTIVITY_CONDITIONAL
Primary Fact:
marketing.electronic_direct_marketing_communications_sent
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / stale / insufficient
→ UNDETERMINED
```

Sender identification and opt-out mechanisms are compliance controls.

## 19.3 POPIA-DM-003

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: ACTIVITY_CONDITIONAL
Primary Fact: marketing.personal_information_for_direct_marketing
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / stale / insufficient
→ UNDETERMINED
```

Objection workflows, consent-withdrawal controls, suppression registers,
and opt-out records are compliance evidence.

## 19.4 Direct-marketing fact separation

The following facts are related but must not initially be collapsed:

```text
marketing.personal_information_for_direct_marketing
marketing.electronic_direct_marketing
marketing.electronic_direct_marketing_communications_sent
```

Any future derivation between these facts must be explicit, versioned,
reviewable, and legally defensible.

---

# 20. Automated Decision-Making Requirements

## 20.1 POPIA-ADM-001

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: COMPOUND_CONDITIONAL
Required Facts:
- automation.solely_automated_decision
- automation.section_71_effect
Operator: AND
```

Core resolution:

```text
TRUE + TRUE
→ APPLICABLE

FALSE + TRUE
→ NOT_APPLICABLE

TRUE + FALSE
→ NOT_APPLICABLE

TRUE + UNKNOWN
→ UNDETERMINED

UNKNOWN + TRUE
→ UNDETERMINED

UNKNOWN + UNKNOWN
→ UNDETERMINED
```

A known false value may short-circuit only where that fact is legally
dispositive under the approved rule.

The existence of automation alone is insufficient.

The relevant decision must satisfy the section 71 conditions represented
by the compound rule.

The determination whether an applicable statutory exception permits the
processing is part of the compliance/legal determination after the
initial section 71 scope condition is established.

## 20.2 POPIA-ADM-002

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: COMPOUND_CONDITIONAL
Required Facts:
- automation.qualifying_section_71_decision
- automation.permitted_subject_to_safeguards
Operator: AND
```

Core resolution:

```text
TRUE + TRUE
→ APPLICABLE

FALSE + TRUE
→ NOT_APPLICABLE

TRUE + FALSE
→ NOT_APPLICABLE

TRUE + UNKNOWN
→ UNDETERMINED

UNKNOWN + TRUE
→ UNDETERMINED

UNKNOWN + UNKNOWN
→ UNDETERMINED
```

`ADM-001 APPLICABLE` does not automatically establish
`ADM-002 APPLICABLE`.

`ADM-002` concerns the narrower context in which qualifying automated
decision-making is permitted subject to safeguards.

Human review, representation processes, explanations, and system
documentation are compliance evidence and must not establish
non-applicability.

---

# 21. Transborder Information Flow

## POPIA-TBF-001

Normalized mapping:

```text
Class: CONDITIONAL
Pattern: ACTIVITY_CONDITIONAL
Primary Fact:
transfers.personal_information_to_foreign_country_third_party
```

Resolution:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN / stale / insufficient
→ UNDETERMINED
```

Once applicable, ComplianceOS evaluates whether at least one applicable
section 72 transfer condition and associated safeguards are established.

The absence of contractual safeguards, consent records, transfer
assessments, or destination assessments must not establish that no
foreign transfer occurs.

---

# 22. Complete 35-Requirement Applicability Matrix

| Requirement | Class | Resolution Pattern | Primary Fact / Rule | TRUE / Established Scope | FALSE / Established Non-Scope | Unknown |
|---|---|---|---|---|---|---|
| POPIA-ACC-001 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-PLM-001 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-PLM-002 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-PLM-003 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-PLM-004 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope; exceptions evaluated separately | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-PUR-001 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-PUR-002 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope; retention exceptions evaluated separately | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-FPL-001 | CONDITIONAL | ACTIVITY_CONDITIONAL | processing.personal_information_processed_further | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |
| POPIA-IQ-001 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-OPN-001 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-OPN-002 | CONDITIONAL | ACTIVITY_CONDITIONAL | processing.collects_personal_information | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |
| POPIA-SEC-001 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-SEC-002 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-SEC-003 | CONDITIONAL | RELATIONSHIP_CONDITIONAL | relationships.operator_processes_personal_information | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |
| POPIA-SEC-004 | CONDITIONAL | RELATIONSHIP_CONDITIONAL | relationships.operator_processes_personal_information | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |
| POPIA-SEC-005 | EVENT_TRIGGERED | EVENT_TRIGGERED | security.qualifying_compromise + event context | APPLICABLE | NOT_APPLICABLE for event obligation | UNDETERMINED |
| POPIA-DSP-001 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-DSP-002 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-DSP-003 | EVENT_TRIGGERED | REQUEST_OR_DISPUTE_TRIGGERED | data_subject.qualifying_request_or_dispute + matter context | APPLICABLE | NOT_APPLICABLE for triggered obligation | UNDETERMINED |
| POPIA-SPI-001 | CONDITIONAL | PROCESSING_CATEGORY_CONDITIONAL | processing.special_personal_information | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |
| POPIA-SPI-002 | CONDITIONAL | PROCESSING_CATEGORY_CONDITIONAL | processing.section_28_33_special_category | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |
| POPIA-CHD-001 | CONDITIONAL | PROCESSING_CATEGORY_CONDITIONAL | processing.children_personal_information | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |
| POPIA-IO-001 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-IO-002 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-IO-003 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-IO-004 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-IO-005 | GENERAL | GENERAL_UNCONDITIONAL | Framework scope | APPLICABLE | Framework-level non-scope | Framework scope unresolved |
| POPIA-PA-001 | CONDITIONAL | PRIOR_AUTHORISATION_CONDITIONAL | prior_authorisation.processing_may_fall_within_section_57 | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |
| POPIA-PA-002 | CONDITIONAL | PRIOR_AUTHORISATION_CONDITIONAL | prior_authorisation.required | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |
| POPIA-DM-001 | CONDITIONAL | ACTIVITY_CONDITIONAL | marketing.electronic_direct_marketing | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |
| POPIA-DM-002 | CONDITIONAL | ACTIVITY_CONDITIONAL | marketing.electronic_direct_marketing_communications_sent | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |
| POPIA-DM-003 | CONDITIONAL | ACTIVITY_CONDITIONAL | marketing.personal_information_for_direct_marketing | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |
| POPIA-ADM-001 | CONDITIONAL | COMPOUND_CONDITIONAL | solely_automated_decision AND section_71_effect | APPLICABLE | NOT_APPLICABLE where dispositive FALSE established | UNDETERMINED |
| POPIA-ADM-002 | CONDITIONAL | COMPOUND_CONDITIONAL | qualifying_section_71_decision AND permitted_subject_to_safeguards | APPLICABLE | NOT_APPLICABLE where dispositive FALSE established | UNDETERMINED |
| POPIA-TBF-001 | CONDITIONAL | ACTIVITY_CONDITIONAL | transfers.personal_information_to_foreign_country_third_party | APPLICABLE | NOT_APPLICABLE | UNDETERMINED |

Total requirements:

```text
35
```

Every POPIA V1 candidate requirement is represented exactly once in
this matrix.

---

# 23. Normalized Pattern Inventory

## GENERAL_UNCONDITIONAL

```text
POPIA-ACC-001
POPIA-PLM-001
POPIA-PLM-002
POPIA-PLM-003
POPIA-PLM-004
POPIA-PUR-001
POPIA-PUR-002
POPIA-IQ-001
POPIA-OPN-001
POPIA-SEC-001
POPIA-SEC-002
POPIA-DSP-001
POPIA-DSP-002
POPIA-IO-001
POPIA-IO-002
POPIA-IO-003
POPIA-IO-004
POPIA-IO-005
```

Count: **18**

## ACTIVITY_CONDITIONAL

```text
POPIA-FPL-001
POPIA-OPN-002
POPIA-DM-001
POPIA-DM-002
POPIA-DM-003
POPIA-TBF-001
```

Count: **6**

## RELATIONSHIP_CONDITIONAL

```text
POPIA-SEC-003
POPIA-SEC-004
```

Count: **2**

## EVENT_TRIGGERED

```text
POPIA-SEC-005
```

Count: **1**

## REQUEST_OR_DISPUTE_TRIGGERED

```text
POPIA-DSP-003
```

Count: **1**

## PROCESSING_CATEGORY_CONDITIONAL

```text
POPIA-SPI-001
POPIA-SPI-002
POPIA-CHD-001
```

Count: **3**

## PRIOR_AUTHORISATION_CONDITIONAL

```text
POPIA-PA-001
POPIA-PA-002
```

Count: **2**

## COMPOUND_CONDITIONAL

```text
POPIA-ADM-001
POPIA-ADM-002
```

Count: **2**

Total:

```text
18 + 6 + 2 + 1 + 1 + 3 + 2 + 2 = 35
```

No current POPIA V1 requirement is normalized to
`SECTOR_SPECIFIC`.

No current requirement requires `GENERAL_WITH_EXCEPTION` as its primary
V1 resolution pattern.

Exception-bearing requirements remain subject to the exception
classification rules defined by the resolution grammar.

---

# 24. Fact Reuse Matrix

| Fact | Requirement Consumers |
|---|---|
| processing.personal_information_processed_further | POPIA-FPL-001 |
| processing.collects_personal_information | POPIA-OPN-002 |
| relationships.operator_processes_personal_information | POPIA-SEC-003, POPIA-SEC-004 |
| security.qualifying_compromise | POPIA-SEC-005 |
| data_subject.qualifying_request_or_dispute | POPIA-DSP-003 |
| processing.special_personal_information | POPIA-SPI-001 |
| processing.section_28_33_special_category | POPIA-SPI-002 |
| processing.children_personal_information | POPIA-CHD-001 |
| prior_authorisation.processing_may_fall_within_section_57 | POPIA-PA-001 |
| prior_authorisation.required | POPIA-PA-002 |
| marketing.electronic_direct_marketing | POPIA-DM-001 |
| marketing.electronic_direct_marketing_communications_sent | POPIA-DM-002 |
| marketing.personal_information_for_direct_marketing | POPIA-DM-003 |
| automation.solely_automated_decision | POPIA-ADM-001 |
| automation.section_71_effect | POPIA-ADM-001 |
| automation.qualifying_section_71_decision | POPIA-ADM-002 |
| automation.permitted_subject_to_safeguards | POPIA-ADM-002 |
| transfers.personal_information_to_foreign_country_third_party | POPIA-TBF-001 |

This matrix deliberately avoids a one-Boolean-per-requirement design.

Facts may be reused only where the regulatory semantics genuinely
support reuse.

---

# 25. Fact Derivation Rules

A fact may be derived from other facts only where:

1. the derivation is explicit;
2. the derivation is versioned;
3. the source facts are sufficiently authoritative;
4. the derivation preserves unknown states;
5. the derivation does not convert missing information into false;
6. the derivation is legally defensible;
7. the derivation can be explained after the fact; and
8. the derivation is approved before production use.

For example, a future implementation may determine that:

```text
automation.qualifying_section_71_decision
```

can be derived from:

```text
automation.solely_automated_decision
AND
automation.section_71_effect
```

However, this document does not authorize that derivation as production
logic.

The fact remains conceptually distinct until the implementation rule is
reviewed.

---

# 26. Fact Provenance Requirements

Every non-general applicability determination should be capable of
identifying the basis on which the relevant fact was established.

At minimum, future persistence should be capable of supporting:

```text
fact key
organization
fact value
knowledge state
source or provenance
established time
review time where applicable
establishing authority or actor
assessment context where applicable
supporting basis
```

The final Prisma representation is intentionally deferred.

---

# 27. Fact Freshness

Facts must be reviewed according to how quickly the underlying
regulatory reality may change.

## 27.1 Higher-change facts

Examples:

```text
relationships.operator_processes_personal_information
processing.personal_information_processed_further
processing.collects_personal_information
marketing.electronic_direct_marketing
marketing.electronic_direct_marketing_communications_sent
marketing.personal_information_for_direct_marketing
automation.solely_automated_decision
automation.section_71_effect
transfers.personal_information_to_foreign_country_third_party
```

These facts should not be assumed permanent.

## 27.2 Event or matter facts

Examples:

```text
security.qualifying_compromise
data_subject.qualifying_request_or_dispute
```

These require event or matter context and must not be treated as
ordinary long-lived organization attributes.

## 27.3 Legal determination facts

Examples:

```text
prior_authorisation.required
automation.permitted_subject_to_safeguards
```

These require stronger provenance and may require regulatory or legal
review when circumstances or law change.

---

# 28. Assessment Fact Snapshot

Applicability used for an assessment must be historically stable.

The architecture therefore distinguishes:

```text
Current Organization Regulatory Facts
```

from:

```text
Assessment Regulatory Fact Snapshot
```

An assessment should preserve sufficient information to explain:

- which fact values were used;
- their knowledge state;
- their provenance;
- their relevant timestamps;
- the applicability rule version;
- the resulting applicability status; and
- the reason for the resolution.

Later changes to current organization facts must not silently alter the
historical assessment.

---

# 29. Assessment Requirement Applicability

Future persistence is expected conceptually to support a record similar
to:

```text
AssessmentRequirementApplicability
- assessmentId
- requirementId
- status
- reason
- resolutionBasis
- resolvedAt
- resolvedBy
- factSnapshot or fact references
- applicability rule/version
```

This is conceptual architecture only.

No Prisma model is authorized by this document.

---

# 30. Event and Matter Context

Some requirements cannot be represented safely by one permanent
organization-level applicability record.

Examples:

```text
POPIA-SEC-005
POPIA-DSP-003
```

Their applicability may depend on a particular:

- security incident;
- data-subject request;
- dispute;
- investigation;
- correction matter;
- restriction matter; or
- related event.

Future persistence must preserve the relevant context.

An event-triggered requirement must not become permanently
`NOT_APPLICABLE` merely because no triggering event existed at one
historical point.

---

# 31. Exception Classification

Where a statutory exception appears in a requirement, ComplianceOS must
determine what legal effect the exception has.

Two conceptual categories are relevant.

## 31.1 APPLICABILITY_EXCEPTION

The exception genuinely removes the requirement from scope for the
relevant context.

Only a defensible applicability exception may support
`NOT_APPLICABLE`.

## 31.2 COMPLIANCE_CONTROL_EXCEPTION

The requirement remains applicable, but the exception changes:

- the permitted processing basis;
- the required control;
- the required evidence;
- the permissible method;
- the relevant safeguard; or
- another compliance parameter.

A compliance/control exception must not be used to remove the
requirement from the applicability denominator.

Where the legal effect is uncertain:

```text
REGULATORY_REVIEW
```

is required.

---

# 32. Applicability and Compliance Separation Examples

## 32.1 Operator relationship

```text
Operator processes PI = TRUE
→ SEC-003 / SEC-004 APPLICABLE

No operator agreement
→ possible compliance failure

No operator agreement
≠ operator relationship FALSE
```

## 32.2 Special personal information

```text
Special PI processed = TRUE
→ SPI-001 APPLICABLE

No authorization evidence
→ possible compliance failure

No authorization evidence
≠ special PI not processed
```

## 32.3 Direct marketing

```text
Electronic direct marketing = TRUE
→ DM-001 APPLICABLE

No consent record
→ compliance question

No consent record
≠ electronic direct marketing FALSE
```

## 32.4 Transborder transfer

```text
Foreign-country third-party transfer = TRUE
→ TBF-001 APPLICABLE

No section 72 safeguard evidence
→ compliance question

No safeguard evidence
≠ no transfer
```

## 32.5 Prior authorisation

```text
Processing characteristics indicate possible §57 scope
→ PA-001 APPLICABLE

No screening assessment
→ possible compliance failure

No screening assessment
≠ §57 screening unnecessary
```

---

# 33. Three-Valued Resolution Safety

For simple conditional facts:

```text
KNOWN TRUE
→ APPLICABLE

KNOWN authoritative FALSE
→ NOT_APPLICABLE

UNKNOWN
→ UNDETERMINED
```

For compound conditions, standard Boolean shortcuts must not be applied
without considering whether a known false fact is legally dispositive.

A compound rule must preserve uncertainty where unresolved facts could
still change the legal applicability conclusion.

---

# 34. Applicability Coverage

Compliance Score and Applicability Coverage answer different questions.

Compliance Score asks:

> How well does the organization satisfy the requirements currently
> established as applicable?

Applicability Coverage asks:

> How much of the regulatory scope has been sufficiently resolved to
> support that compliance result?

A future metric may conceptually resemble:

```text
resolved requirements
---------------------
requirements requiring applicability resolution
```

The exact metric is deferred.

However, the product must visibly distinguish:

```text
95% compliance with 100% scope resolved
```

from:

```text
95% compliance with substantial unresolved scope
```

The second result must not be presented with equivalent confidence.

---

# 35. Score Qualification Invariant

The existing evidence-driven scoring engine remains locked.

Applicability is a pre-scoring filter.

Conceptually:

```text
active catalogue requirements
        ↓
applicability resolution
        ↓
APPLICABLE only
        ↓
locked evidence-driven engine
        ↓
requirement compliance status
        ↓
assessment score
```

`NOT_APPLICABLE` requirements do not enter the denominator.

`UNDETERMINED` requirements do not enter the denominator but must remain
visible as unresolved scope.

Therefore a score must eventually be accompanied by enough scope
information to prevent false confidence.

---

# 36. General Requirement Framework Scope

General requirements are not intended to imply that POPIA applies to
every entity or every processing context in existence.

The matrix assumes that the relevant POPIA framework scope has already
been established for the assessment.

Future architecture may require an explicit framework-level
applicability boundary.

Until then:

```text
GENERAL_UNCONDITIONAL
```

means:

> applicable without an additional requirement-specific conditional
> fact once the governing framework scope has been established.

---

# 37. Regulatory Review Flags

The following areas require heightened regulatory review before
production provisioning or automated applicability.

## 37.1 SEC-005

Current security-compromise notification procedures and operational
Regulator processes must be checked against current authoritative
requirements.

## 37.2 DSP-003

The requirement has been remapped to section 14(6)-(8).

Its final catalogue-domain taxonomy remains subject to regulatory
review.

## 37.3 PLM-004

Statutory direct-collection exceptions must be classified according to
their actual legal effect rather than assumed to remove applicability.

## 37.4 OPN-002

Section 18 notification exceptions must be analyzed separately from the
collection-activity trigger.

## 37.5 PA-001 / PA-002

Section 57 and 58 prior-authorisation categories and procedures require
authoritative rule mapping before automated production resolution.

## 37.6 ADM-001 / ADM-002

Section 71 qualifying effects, exceptions, and safeguards require
authoritative rule mapping before automated production resolution.

## 37.7 TBF-001

Section 72 transfer-condition logic requires authoritative rule mapping
before automated production resolution.

These flags do not invalidate the matrix.

They identify where implementation must not overstate regulatory
certainty.

---

# 38. Human Review Boundary

Some applicability determinations may require authorized human review.

Examples include:

- disputed processing facts;
- ambiguous operator relationships;
- complex special-information categorization;
- prior-authorisation scope;
- automated-decision legal effects;
- statutory exception classification; and
- ambiguous transborder arrangements.

The system may gather and structure facts.

It may explain the rule.

It may identify missing information.

It may recommend review.

It must not manufacture authoritative legal facts merely to force a
binary result.

---

# 39. AI Authority Boundary

AI may assist with:

- identifying potentially relevant facts;
- extracting candidate facts from evidence;
- asking targeted questions;
- identifying missing facts;
- explaining why a requirement may apply;
- identifying contradictory facts;
- recommending human review; and
- summarizing the resolution basis.

AI must not silently:

- invent regulatory facts;
- convert unknown to false;
- declare a disputed fact authoritative;
- create legal exceptions;
- manufacture prior-authorisation determinations;
- manufacture statutory permissions;
- suppress unresolved scope; or
- manipulate applicability to improve a compliance score.

Authoritative applicability must be produced through approved domain
rules and authorized fact sources.

---

# 40. Tenant Integrity

Every organization-specific regulatory fact and applicability result
must remain tenant-bound.

A fact belonging to Organization A must never determine applicability
for Organization B.

Future services must validate:

```text
organization
assessment
requirement
framework
fact
event or matter context
```

before resolving applicability.

Cross-tenant identifiers supplied by clients must not be trusted as
authority.

---

# 41. Catalogue Integrity

Applicability rules must bind to the intended catalogue requirement and
framework.

Future implementation must prevent:

- resolving a requirement from another framework;
- applying a POPIA fact rule to an unrelated catalogue requirement;
- silently changing the meaning of a rule without versioning;
- resolving inactive or superseded catalogue definitions without an
  explicit policy; or
- losing historical traceability when catalogue content changes.

---

# 42. Current Assessment Authority Boundary

Current Assessment Authority remains a separate domain concern.

Changing which assessment is authoritative for an organization and
framework must not mutate the historical applicability facts or
resolution results of another assessment.

Organization compliance aggregation consumes the scores of current
authoritative assessments.

It does not independently resolve requirement applicability.

---

# 43. Production Safety

This matrix is not permission to enable production applicability
resolution.

Before production use, ComplianceOS must have approved:

1. persistence architecture;
2. regulatory fact definitions;
3. fact provenance requirements;
4. fact freshness policy;
5. applicability rule versioning;
6. assessment snapshot behavior;
7. tenant-integrity enforcement;
8. human-review authority;
9. regulatory-review findings;
10. service boundaries;
11. test fixtures;
12. deterministic resolution tests;
13. score-boundary regression tests; and
14. production catalogue provisioning controls.

---

# 44. Persistence Boundary

This document deliberately does not decide final Prisma structures.

Potential concepts include:

```text
RegulatoryFactDefinition
RegulatoryFactValue
ApplicabilityDefinition
AssessmentRegulatoryFactSnapshot
AssessmentRequirementApplicability
ApplicabilityResolution
```

These names are conceptual.

They must not be treated as approved database model names until the
persistence-design milestone is completed.

---

# 45. Implementation Boundary

The next implementation phase must not bypass the architecture by
placing applicability logic directly inside:

- API routes;
- React components;
- the locked compliance engine;
- Trust Score;
- Executive AI;
- onboarding forms; or
- arbitrary Prisma queries.

Future implementation should preserve dedicated domain boundaries such
as:

```text
RegulatoryFactService
ApplicabilityResolutionService
AssessmentApplicabilityService
```

Exact service names remain subject to implementation review.

---

# 46. Matrix Integrity Checks

Before this document may be locked, verification must establish:

```text
Catalogue unique requirements = 35
Matrix requirements = 35
Duplicate matrix requirement IDs = 0
Missing catalogue requirements = 0
Unknown matrix requirements = 0
```

Pattern counts must reconcile to:

```text
GENERAL_UNCONDITIONAL = 18
ACTIVITY_CONDITIONAL = 6
RELATIONSHIP_CONDITIONAL = 2
EVENT_TRIGGERED = 1
REQUEST_OR_DISPUTE_TRIGGERED = 1
PROCESSING_CATEGORY_CONDITIONAL = 3
PRIOR_AUTHORISATION_CONDITIONAL = 2
COMPOUND_CONDITIONAL = 2

TOTAL = 35
```

The matrix must also preserve:

```text
ACTIVE ≠ APPLICABLE
MANDATORY ≠ UNIVERSAL
MISSING EVIDENCE ≠ NOT_APPLICABLE
UNKNOWN FACT ≠ FALSE
UNDETERMINED ≠ COMPLIANT
```

---

# 47. Exit Criteria

Milestone 8A.3.3 may be considered architecture-complete only when:

1. the resolution grammar is complete;
2. all 35 POPIA requirements are represented in this matrix;
3. every conditional requirement has a defensible fact or compound
   rule;
4. general requirements are explicitly distinguished from conditional
   requirements;
5. event and matter scope is preserved;
6. exception semantics do not silently remove obligations;
7. fact/evidence separation is preserved;
8. three-valued logic is preserved;
9. provenance requirements are defined;
10. freshness requirements are defined;
11. assessment historical behavior is defined;
12. regulatory-review areas are flagged;
13. tenant integrity is preserved;
14. the scoring boundary is preserved;
15. no implementation changes are introduced;
16. catalogue-to-matrix reconciliation passes; and
17. grammar-to-matrix regression review passes.

---

# 48. Next Architecture Milestone

After this matrix and the resolution grammar are reviewed, stress-tested,
and locked, the next architecture work should define the persistence and
service design required to implement applicability safely.

That later work may include:

- regulatory fact persistence;
- applicability-definition persistence;
- assessment fact snapshots;
- requirement applicability persistence;
- rule versioning;
- human-review authority;
- applicability resolution services;
- assessment integration; and
- deterministic verification fixtures.

No such implementation is authorized by this document.

---

# 49. Final Principle

The POPIA applicability layer exists to ensure that ComplianceOS scores
the obligations that genuinely apply without pretending that unknown
scope is the same as non-applicability.

The governing rule is:

> ComplianceOS must never improve an organization's compliance result
> merely because the system lacks sufficient facts to determine scope.

Applicability must therefore remain:

**fact-based, three-valued, explainable, historically reproducible,
tenant-safe, evidence-independent, and conservative under uncertainty.**
