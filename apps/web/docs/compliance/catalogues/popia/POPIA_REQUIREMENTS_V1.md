# ComplianceOS POPIA Requirement Specification

**Document:** POPIA_REQUIREMENTS_V1  
**Milestone:** 8A.2 — POPIA Requirement Specification  
**Status:** DRAFT — REGULATORY REVIEW REQUIRED  
**Framework:** Protection of Personal Information Act 4 of 2013 (POPIA)  
**Jurisdiction:** Republic of South Africa  
**Catalogue Version:** 1.0-draft  
**Production Status:** NOT PROVISIONED

---

## 1. Purpose

This document defines the regulatory specification for the first
ComplianceOS POPIA compliance catalogue.

It is the design contract between authoritative South African privacy
law and the ComplianceOS Evidence-Driven Compliance Engine.

The catalogue must not reduce POPIA to a generic checklist.

Each ComplianceRequirement must represent a sufficiently clear,
assessable obligation that can ultimately be supported by evidence,
reviewed, verified, scored, and traced to an authoritative source.

The intended compliance chain is:

POPIA / Regulatory Instrument  
→ Compliance Requirement  
→ Expected Evidence  
→ Organization Evidence  
→ Verification  
→ Requirement Status  
→ Assessment Score  
→ Organization Compliance Score

No requirement defined in this document is production data until the
catalogue has completed legal-source review, integrity verification,
provisioning review, and controlled production deployment.

---

## 2. Source Authority Hierarchy

ComplianceOS will use the following source hierarchy for POPIA:

1. Protection of Personal Information Act 4 of 2013.
2. Regulations made under POPIA.
3. Official instruments, notices, codes, guidance notes, forms and
   regulatory material issued by the Information Regulator.
4. Other official South African government material where necessary
   for contextual interpretation.

Commercial summaries, blogs, consultants' checklists and secondary
legal commentary must not constitute the authoritative source of a
ComplianceRequirement.

They may be used for research only and must never replace authoritative
provenance.

---

## 3. Requirement Identification Standard

ComplianceOS requirement codes are stable internal identifiers.

They are not substitutes for statutory section numbers.

Format:

POPIA-{DOMAIN}-{NUMBER}

Examples:

POPIA-ACC-001
POPIA-PLM-001
POPIA-PUR-001
POPIA-SEC-001

The sourceReference field records the actual statutory or regulatory
reference.

A future change in legislation must therefore not require historical
ComplianceOS requirement identifiers to be rewritten unless the
underlying requirement itself is retired and replaced.

---

## 4. POPIA Domain Codes

| Code | Domain |
| --- | --- |
| ACC | Accountability |
| PLM | Processing Limitation |
| PUR | Purpose Specification |
| FPL | Further Processing Limitation |
| IQ | Information Quality |
| OPN | Openness |
| SEC | Security Safeguards |
| DSP | Data Subject Participation |
| SPI | Special Personal Information |
| CHD | Personal Information of Children |
| IO | Information Officer and Governance |
| PA | Prior Authorisation |
| DM | Direct Marketing |
| ADM | Automated Decision-Making |
| TBF | Transborder Information Flows |
| REG | Regulatory and Incident Obligations |

---

## 5. Catalogue Modelling Rules

Every requirement must satisfy the following rules before production
provisioning:

- It must have a stable ComplianceOS code.
- It must describe one assessable compliance obligation.
- It must have an authoritative legal or regulatory source.
- It must preserve the relevant statutory or regulatory reference.
- It must be expressed in language understandable to an organization.
- It must not falsely broaden the wording of POPIA.
- It must not turn guidance into legislation.
- It must distinguish universal obligations from conditional
  obligations.
- It must be capable of being supported by one or more forms of
  Evidence.
- Evidence expectations are examples of proof, not automatic legal
  conclusions.
- Verification of evidence must remain separate from mere document
  upload.
- Requirement status must continue to be calculated by the locked
  Evidence-Driven Compliance Engine.
- Workflow completion must never be treated as proof of compliance.

---

## 6. Weighting Policy — Version 1

All initial POPIA requirements will use:

weight = 1

This is deliberate.

ComplianceOS will not claim that one statutory duty is mathematically
more important than another without a defensible weighting methodology.

Future risk-based weighting may be introduced through a separately
reviewed milestone.

No requirement in Version 1 receives additional score solely because
it appears operationally important.

---

## 7. Mandatory, Conditional and Applicability Requirements

The `mandatory` field describes whether an applicable requirement is
mandatory once that requirement applies.

It must not be interpreted as meaning that every requirement applies
to every organization.

ComplianceOS distinguishes four applicability classes:

| Class | Meaning |
| --- | --- |
| GENERAL | Normally applicable across organizations subject to the relevant POPIA obligation |
| CONDITIONAL | Applies only when defined processing activities or circumstances exist |
| SECTOR_SPECIFIC | Applies only to organizations or processing activities within a defined regulatory or sector scope |
| EVENT_TRIGGERED | Becomes operational when a defined event occurs |

Examples of conditional processing include:

- special personal information;
- children's personal information;
- processing requiring prior authorisation;
- direct marketing;
- automated decision-making;
- transborder information flows.

A security-compromise response obligation is event-triggered.

Sector-specific regulations must not be treated as universal POPIA
requirements merely because they were made under POPIA.

Regulatory instruments governing particular categories of personal
information, responsible parties, sectors or processing activities must
therefore be evaluated against their defined scope before they can
participate in an organization's compliance assessment or score.

Health-information regulations are an example of regulatory material
that may require sector- or processing-specific applicability analysis
rather than universal application across all organizations.

### 7.1 Scoring Safety Rule

The current ComplianceOS scoring engine evaluates active requirements.

The current Prisma ComplianceRequirement model does not yet encode a
complete applicability expression.

Therefore:

- GENERAL requirements may proceed through ordinary catalogue review;
- CONDITIONAL requirements must not participate in an organization's
  score until applicability has been affirmatively established;
- SECTOR_SPECIFIC requirements must not participate unless the
  organization falls within the defined scope;
- EVENT_TRIGGERED requirements must not create a permanent scoring
  penalty merely because the triggering event has never occurred.

No conditional, sector-specific or event-triggered requirement may be
provisioned into production in a manner that causes an inapplicable
requirement to reduce an organization's compliance score.

Applicability architecture will be designed before such requirements
are admitted into production scoring.

---

# 8. Core Lawful Processing Conditions

POPIA section 4 identifies eight conditions for lawful processing.

These conditions form the core of the first catalogue.

---

## 8.1 Accountability

### POPIA-ACC-001 — Ensure compliance with POPIA processing conditions

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 8  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

The responsible party must ensure that the lawful-processing
conditions and measures giving effect to those conditions are complied
with when determining the purpose and means of processing and during
the processing itself.

### Example Evidence

- approved privacy governance framework;
- privacy policy;
- assigned privacy responsibilities;
- documented compliance controls;
- compliance monitoring records;
- management oversight records.

### Review Note

Evidence must demonstrate actual accountability mechanisms rather than
the mere existence of a policy document.

---

# 8.2 Processing Limitation

## POPIA-PLM-001 — Process personal information lawfully and reasonably

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 9  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

Personal information processing must be lawful and reasonable and must
not infringe the privacy of the data subject.

### Example Evidence

- processing register;
- privacy impact or risk assessments;
- approved processing procedures;
- records showing lawful processing controls.

---

## POPIA-PLM-002 — Apply data minimisation

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 10  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

Personal information processed must be adequate, relevant and not
excessive in relation to the purpose for which it is processed.

### Example Evidence

- data inventory;
- field-level collection specifications;
- application or onboarding forms;
- data minimisation review records;
- privacy impact assessments.

---

## POPIA-PLM-003 — Establish a lawful justification for processing

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 11  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

Each processing activity must be supported by an applicable lawful
justification under POPIA.

### Example Evidence

- processing activity register;
- lawful-processing basis register;
- consent records where consent is relied upon;
- contracts;
- statutory obligation records;
- documented legitimate-interest assessment where applicable.

### Review Note

Consent must not be treated as the only possible lawful basis.

---

## POPIA-PLM-004 — Collect personal information directly where required

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 12  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General with statutory exceptions

### Requirement

Personal information must be collected directly from the data subject
unless an applicable POPIA exception permits indirect collection.

### Example Evidence

- data-source inventory;
- collection forms;
- third-party data acquisition procedures;
- documented justification for indirect collection.

---

# 8.3 Purpose Specification

## POPIA-PUR-001 — Define a specific lawful collection purpose

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 13  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

Personal information must be collected for a specific, explicitly
defined and lawful purpose related to the functions or activities of
the responsible party.

### Example Evidence

- processing register;
- privacy notices;
- collection forms;
- purpose statements;
- processing specifications.

---

## POPIA-PUR-002 — Control retention and destruction of personal information

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 14  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

Personal information records must not be retained longer than
authorised or necessary, subject to applicable statutory exceptions,
and must be destroyed, deleted or de-identified as required.

### Example Evidence

- retention schedule;
- records-management policy;
- deletion procedures;
- destruction certificates;
- automated retention rules;
- archival justification.

---

# 8.4 Further Processing Limitation

## POPIA-FPL-001 — Ensure further processing is compatible with original purpose

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 15  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** When personal information is processed further

### Requirement

Further processing of personal information must be compatible with the
purpose for which the information was originally collected unless an
applicable statutory basis permits otherwise.

### Example Evidence

- secondary-use assessments;
- change-of-purpose approvals;
- processing register;
- consent records where relevant;
- compatibility assessments.

---

# 8.5 Information Quality

## POPIA-IQ-001 — Maintain information quality

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 16  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

Reasonably practicable steps must be taken to ensure personal
information is complete, accurate, not misleading and updated where
necessary, having regard to the purpose for which it is collected or
further processed.

### Example Evidence

- data-quality procedures;
- data correction workflows;
- validation controls;
- periodic data reviews;
- customer or employee update mechanisms.

---

# 8.6 Openness

## POPIA-OPN-001 — Maintain documentation of processing operations

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 17  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

The responsible party must maintain documentation of processing
operations as required by POPIA read with the applicable PAIA
documentation obligations.

### Example Evidence

- processing activity register;
- PAIA manual;
- information inventory;
- processing-system documentation.

---

## POPIA-OPN-002 — Provide required notification when collecting information

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 18  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** Collection of personal information, subject to statutory exceptions

### Requirement

Data subjects must receive the information required by POPIA when
their personal information is collected, subject to the exceptions
provided by the Act.

### Example Evidence

- privacy notices;
- application forms;
- website privacy notices;
- employee privacy notices;
- collection scripts;
- notification records.

---

# 8.7 Security Safeguards

## POPIA-SEC-001 — Maintain appropriate security safeguards

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 19  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

Appropriate, reasonable technical and organisational measures must be
established to secure the integrity and confidentiality of personal
information and protect it against loss, damage, unauthorised
destruction, unlawful access or unlawful processing.

### Example Evidence

- information-security policy;
- access-control policy;
- security risk assessment;
- asset inventory;
- security architecture;
- vulnerability management records;
- backup controls;
- incident response procedures.

---

## POPIA-SEC-002 — Identify and manage information-security risks

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 19  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

The responsible party must identify reasonably foreseeable internal
and external risks to personal information and establish, maintain,
verify and update safeguards against those risks.

### Example Evidence

- risk register;
- security assessments;
- penetration-test reports;
- vulnerability scans;
- mitigation plans;
- security review records.

---

## POPIA-SEC-003 — Ensure operators process information only with authority

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 20  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** Where operators process personal information

### Requirement

An operator or person acting under the authority of a responsible
party or operator must process personal information only with the
knowledge or authorisation of the responsible party and must treat
that information as confidential.

### Example Evidence

- operator agreements;
- confidentiality agreements;
- processor instructions;
- third-party access controls;
- supplier processing procedures.

---

## POPIA-SEC-004 — Maintain compliant operator agreements

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 21  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** Where an operator processes personal information

### Requirement

Processing by an operator must be governed by a written contract or
other binding legal act requiring appropriate security measures and
compliance with the responsible party's security obligations.

### Example Evidence

- data-processing agreement;
- supplier contract;
- security schedule;
- operator due-diligence records;
- third-party security assessment.

---

## POPIA-SEC-005 — Manage and notify security compromises

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 22  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** When there are reasonable grounds to believe personal information has been accessed or acquired by an unauthorised person

### Requirement

Security compromises involving personal information must be handled
and notified in accordance with POPIA and applicable Information
Regulator requirements.

### Example Evidence

- breach-response procedure;
- incident register;
- investigation records;
- Information Regulator notification records;
- data-subject notification records;
- breach-response decisions.

### Review Note

Operational notification requirements must be checked against the
current Information Regulator process before production provisioning.

---

# 8.8 Data Subject Participation

## POPIA-DSP-001 — Enable access to personal information

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 23  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

A data subject must be able to request confirmation of whether their
personal information is held and request access to that information in
accordance with POPIA.

### Example Evidence

- data-subject request procedure;
- access request register;
- response records;
- identity verification procedures.

---

## POPIA-DSP-002 — Enable correction, deletion or destruction requests

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 24  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

The organization must provide mechanisms for a data subject to request
correction or deletion of inaccurate, irrelevant, excessive,
out-of-date, incomplete, misleading or unlawfully obtained personal
information and destruction or deletion of information that may no
longer be retained.

### Example Evidence

- correction request procedure;
- deletion request workflow;
- request register;
- completed correction records;
- completed deletion records.

---

## POPIA-DSP-003 — Maintain restriction controls for disputed information

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 14(6)-(8)  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** Where a qualifying request or dispute exists

### Requirement

The organization must be capable of restricting processing where
POPIA requires disputed personal information to be restricted while
the relevant matter is resolved.

### Example Evidence

- restriction procedure;
- system restriction controls;
- dispute-management records;
- request tracking records.

### Review Note

This requirement was remapped during regulatory source review from
section 24 to section 14(6)-(8).

Its final placement within the ComplianceOS domain taxonomy remains
subject to catalogue review because restriction arises within POPIA's
retention and restriction provisions rather than the section 24
correction/deletion provision.

---

# 9. Conditional and Extended POPIA Domains

The requirements in this section are conditional.

They must not automatically participate in an organization's
compliance score merely because they exist in the POPIA catalogue.

Applicability must first be affirmatively established.

---

## 9.1 Special Personal Information

POPIA sections 26 to 33 regulate special personal information.

The statutory structure includes a general prohibition, general
authorisations and additional authorisations for particular categories
of special personal information.

### POPIA-SPI-001 — Establish lawful authority before processing special personal information

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Sections 26-27  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability Class:** CONDITIONAL  
**Applicability:** Where the organization processes special personal information

### Requirement

The organization must not process special personal information unless
the processing is permitted by an applicable authorisation under
POPIA or an applicable authorisation granted through the regulatory
framework.

### Example Evidence

- special-information processing register;
- documented statutory authorisation;
- consent records where applicable;
- regulatory authorisation where applicable;
- processing-purpose documentation;
- privacy impact or risk assessment.

### Review Note

The existence of special personal information does not itself prove
that processing is unlawful. Verification must establish the
applicable statutory authorisation.

---

### POPIA-SPI-002 — Apply category-specific safeguards and authorisations

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Sections 28-33  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability Class:** CONDITIONAL  
**Applicability:** Where a category of special personal information regulated by sections 28-33 is processed

### Requirement

Where the organization processes a regulated category of special
personal information, it must establish that the processing falls
within the applicable category-specific authorisation and observe the
conditions attached to that processing.

### Example Evidence

- category-specific processing register;
- processing procedures;
- access restrictions;
- statutory-authorisation analysis;
- professional or legal obligations where relevant;
- confidentiality controls;
- health-information controls where relevant;
- special-information inventory;
- classification standard;
- access-control matrix;
- approval records;
- periodic compliance reviews.

### Control Guidance

Verification should establish that the organization can identify
special personal information, determine the applicable authorisation
and demonstrate that processing remains within the permitted scope.

This guidance supports POPIA-SPI-001 and POPIA-SPI-002. It is not an
independent scored statutory requirement.

---

## 9.2 Personal Information of Children

POPIA sections 34 and 35 establish special restrictions and
authorisations for processing personal information concerning
children.

### POPIA-CHD-001 — Establish lawful authority before processing children's personal information

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Sections 34-35  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability Class:** CONDITIONAL  
**Applicability:** Where the organization processes personal information concerning a child

### Requirement

The organization must not process personal information concerning a
child unless an applicable authorisation under POPIA permits that
processing.

### Example Evidence

- children's-information processing register;
- competent-person consent records where applicable;
- statutory-authorisation analysis;
- collection procedures;
- age or status determination controls where appropriate;
- access controls;
- privacy notices;
- processing procedures;
- periodic review records.

### Control Guidance

Where children's personal information is processed under an applicable
authorisation, verification should establish the applicable
authorisation, purpose and scope of the processing.

This guidance supports POPIA-CHD-001. It does not create an independent
statutory condition or separate scored requirement.

---

## 9.3 Information Officer and Governance

POPIA section 55 establishes duties and responsibilities of Information
Officers.

Regulation 4 of the Regulations relating to the Protection of Personal
Information adds specific governance responsibilities concerning the
compliance framework, personal information impact assessment,
request-processing systems, internal awareness and related Information
Officer responsibilities.

The amended Regulation 4 deletes former Regulation 4(1)(c). The PAIA
manual obligation must therefore not be represented as a current
independent POPIA Regulation 4(1)(c) requirement. Applicable PAIA manual
duties remain part of the separate PAIA regulatory framework.

The Information Regulator also requires Information Officers to be
registered before taking up their POPIA duties.

The requirements below distinguish POPIA governance from independent
PAIA obligations. Where Regulation 4 expressly incorporates PAIA
responsibilities into the Information Officer's POPIA regulatory
responsibilities, the provenance must remain explicit.

### POPIA-IO-001 — Register the Information Officer before POPIA duties are undertaken

**Category:** GOVERNANCE  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 55(2)  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

The responsible party must ensure that its Information Officer is
registered with the Information Regulator before the Information
Officer takes up duties under POPIA.

### Example Evidence

- Information Regulator registration confirmation;
- Information Officer registration certificate or reference;
- eServices registration record;
- responsible-party governance record identifying the Information Officer.

### Review Note

Registration establishes the regulatory status required before the
Information Officer takes up POPIA duties. Internal appointment or
identification alone must not be treated as proof of registration.

---

### POPIA-IO-002 — Maintain Information Officer oversight of POPIA compliance

**Category:** GOVERNANCE  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 55(1)  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

The Information Officer must perform the statutory oversight functions
required by section 55, including encouraging compliance with the
conditions for lawful processing, dealing with requests made pursuant
to POPIA, working with the Information Regulator in relation to
applicable investigations and ensuring compliance by the body with
POPIA.

### Example Evidence

- Information Officer governance mandate;
- POPIA compliance oversight records;
- data-subject request procedures;
- regulatory correspondence;
- compliance review records;
- documented escalation and accountability procedures.

### Review Note

This requirement captures the section 55 oversight function without
creating separate scored requirements for every administrative activity
performed by the Information Officer.

---

### POPIA-IO-003 — Develop, implement, monitor, maintain and continually improve a POPIA compliance framework

**Category:** GOVERNANCE  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Regulations relating to the Protection of Personal Information, 2018  
**Source Reference:** Regulation 4(1)(a)  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

The Information Officer must ensure that a compliance framework is
developed, implemented, monitored, maintained and continually improved.

### Example Evidence

- approved POPIA compliance framework;
- compliance implementation plan;
- governance policies;
- monitoring records;
- periodic compliance reviews;
- remediation records;
- framework approval and revision history.

### Review Note

The existence of a policy document alone is insufficient. Verification
should establish implementation, monitoring, maintenance and continual
improvement of the compliance framework.

### Amendment Note

The current wording reflects the amendment to Regulation 4(1)(a), which
adds the requirement that the compliance framework be continually
improved.

---

### POPIA-IO-004 — Ensure that a personal information impact assessment is conducted

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Regulations relating to the Protection of Personal Information, 2018  
**Source Reference:** Regulation 4(1)(b)  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

The Information Officer must ensure that a personal information impact
assessment is conducted to establish that adequate measures and
standards exist for compliance with the conditions for lawful
processing of personal information.

### Example Evidence

- personal information impact assessment;
- processing inventory;
- data-flow analysis;
- risk assessment;
- identified control gaps;
- remediation plan;
- assessment review or approval records.

### Review Note

This requirement concerns the Regulation 4 governance-level personal
information impact assessment. It should not automatically be
interpreted as requiring a separate assessment for every individual
processing activity unless another applicable legal or regulatory
requirement requires that result.

---

### POPIA-IO-005 — Maintain required request-processing systems and internal POPIA awareness

**Category:** GOVERNANCE  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Regulations relating to the Protection of Personal Information, 2018  
**Source Reference:** Regulation 4(1)(d)-(f), as amended  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability:** General

### Requirement

The Information Officer must ensure that the body maintains the
current governance measures required by Regulation 4 concerning
internal measures and adequate systems for processing requests for
information or access, internal awareness regarding POPIA and related
regulatory instruments, and the remaining applicable responsibilities
under Regulation 4(1)(d)-(f).

### Example Evidence

- information/access request procedure;
- request register or case-management records;
- documented internal request-processing measures;
- internal awareness programme;
- awareness-session attendance or completion records;
- procedures and records supporting the remaining Regulation 4(1)(d)-(f)
  responsibilities.

### Review Note

This requirement is limited to the current responsibilities retained
under Regulation 4(1)(d)-(f).

Former Regulation 4(1)(c) has been deleted and must not be treated as a
current POPIA regulatory basis for scoring the PAIA manual obligation.

Applicable PAIA manual duties remain legally relevant but should be
modelled independently within a future PAIA compliance framework rather
than imported into the POPIA score.

### Amendment Note

The current provenance reflects the amendment deleting Regulation
4(1)(c). Historical guidance based on the earlier Regulation 4 structure
must not override the amended regulatory text.

---

## 9.4 Prior Authorisation

POPIA sections 57 to 59 regulate processing that requires prior
authorisation from the Information Regulator.

### POPIA-PA-001 — Identify processing subject to prior authorisation

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 57  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability Class:** CONDITIONAL  
**Applicability:** Where contemplated processing may fall within section 57

### Requirement

The organization must determine whether contemplated processing falls
within a category requiring prior authorisation from the Information
Regulator.

### Example Evidence

- prior-authorisation screening assessment;
- processing register;
- data-flow analysis;
- legal or compliance review;
- documented applicability decision.

---

### POPIA-PA-002 — Obtain required prior authorisation before commencing restricted processing

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Sections 57-58  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability Class:** CONDITIONAL  
**Applicability:** Where processing requires prior authorisation

### Requirement

Where prior authorisation is required, the organization must follow
the statutory notification and authorisation process and must not
commence the affected processing contrary to the applicable statutory
restriction.

### Example Evidence

- prior-authorisation application;
- submission confirmation;
- Information Regulator correspondence;
- authorisation decision;
- project approval gate;
- processing commencement records;
- applicability assessment;
- processing specification;
- governance review records.

### Control Guidance

Verification should preserve sufficient evidence to demonstrate the
organization's prior-authorisation assessment, regulatory submissions,
regulatory outcome and the scope within which affected processing is
conducted.

This guidance supports POPIA-PA-001 and POPIA-PA-002. It is not an
independent scored statutory requirement.

---

## 9.5 Direct Marketing

Electronic direct marketing is specifically regulated by POPIA
section 69.

### POPIA-DM-001 — Establish lawful authority for unsolicited electronic direct marketing

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 69  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability Class:** CONDITIONAL  
**Applicability:** Where the organization conducts direct marketing by electronic communication

### Requirement

The organization must not process personal information for unsolicited
electronic direct marketing unless the processing falls within the
conditions permitted by section 69.

### Example Evidence

- marketing consent records;
- customer relationship records;
- campaign eligibility rules;
- marketing database controls;
- lawful-processing assessment.

---

### POPIA-DM-002 — Provide compliant direct-marketing identification and opt-out mechanisms

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 69  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability Class:** CONDITIONAL  
**Applicability:** Where electronic direct marketing communications are sent

### Requirement

Electronic direct-marketing communications must satisfy the applicable
POPIA requirements concerning sender identification and the data
subject's ability to refuse or stop further communications.

### Example Evidence

- marketing message templates;
- unsubscribe mechanism;
- suppression list;
- opt-out logs;
- sender-identification controls;
- campaign procedures.

---

### POPIA-DM-003 — Honour marketing objections and consent withdrawals

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Sections 11 and 69  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability Class:** CONDITIONAL  
**Applicability:** Where personal information is processed for direct marketing

### Requirement

The organization must maintain controls to give effect to applicable
objections, withdrawals of consent and direct-marketing opt-outs.

### Example Evidence

- suppression register;
- objection workflow;
- consent withdrawal records;
- campaign exclusion controls;
- completed opt-out requests.

---

## 9.6 Automated Decision-Making

POPIA section 71 regulates certain decisions based solely on automated
processing.

### POPIA-ADM-001 — Identify decisions subject to automated-decision protections

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 71  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability Class:** CONDITIONAL  
**Applicability:** Where decisions are based solely on automated processing and have the effects contemplated by section 71

### Requirement

The organization must identify automated decision processes that fall
within section 71 and determine whether an applicable statutory
exception permits the processing.

### Example Evidence

- automated-system inventory;
- decision-flow documentation;
- algorithmic processing register;
- applicability assessment;
- human-review design;
- contractual or consent records where relevant.

---

### POPIA-ADM-002 — Maintain safeguards for qualifying automated decisions

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 71  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability Class:** CONDITIONAL  
**Applicability:** Where section 71 permits qualifying automated decision-making subject to safeguards

### Requirement

Where qualifying automated decision-making is permitted subject to
safeguards, the organization must maintain measures capable of giving
the data subject an appropriate opportunity to make representations
and must provide sufficient information about the underlying logic as
required by POPIA.

### Example Evidence

- human-review procedure;
- representation or appeal process;
- decision explanation;
- automated-decision notice;
- system documentation;
- review records.

---

## 9.7 Transborder Information Flows

POPIA section 72 regulates transfers of personal information to third
parties in foreign countries.

### POPIA-TBF-001 — Establish a lawful basis for transborder transfers

**Category:** DATA_PROTECTION  
**Authority:** Information Regulator (South Africa)  
**Source Title:** Protection of Personal Information Act 4 of 2013  
**Source Reference:** Section 72  
**Mandatory:** true  
**Weight:** 1  
**Active:** true  
**Applicability Class:** CONDITIONAL  
**Applicability:** Where personal information is transferred to a third party in a foreign country

### Requirement

Before transferring personal information to a third party in a
foreign country, the organization must establish that at least one
applicable transfer condition under section 72 is satisfied.

### Example Evidence

- international data-transfer register;
- destination assessment;
- contractual safeguards;
- binding corporate rules where relevant;
- consent records where applicable;
- statutory transfer analysis;
- data-processing agreement;
- transfer assessment;
- periodic safeguard review.

### Control Guidance

Verification should preserve sufficient evidence to demonstrate the
section 72 condition and safeguards relied upon for the relevant
transborder transfer.

This guidance supports POPIA-TBF-001. It is not an independent scored
statutory requirement.

---

## 9.8 Regulatory and Instrument-Specific Obligations

Domain code:

REG

This domain is reserved for requirements arising from regulations,
notices, codes of conduct, prescribed processes and other regulatory
instruments that require instrument-specific provenance.

Instrument-specific obligations must not automatically be represented
as universally applicable POPIA requirements.

Examples include regulatory instruments governing particular categories
of personal information, responsible parties, sectors, processing
activities or prescribed regulatory procedures.

Before an instrument-specific requirement can participate in scoring,
ComplianceOS must establish:

- the authoritative instrument and source;
- its commencement or effective date where applicable;
- the organizations, sectors or processing activities within scope;
- the triggering facts or conditions;
- the atomic obligation to be evaluated;
- the evidence capable of proving or disproving compliance; and
- the relationship between the instrument and the underlying POPIA
  requirement.

Health-information regulations and other sector- or processing-specific
instruments therefore require dedicated provenance and applicability
review before catalogue provisioning.

No REG requirement is approved for production scoring in this version.

**Status:** DEFERRED PENDING REGULATORY-INSTRUMENT AND APPLICABILITY FOUNDATION

---

# 10. Initial Requirement Register

| Code | Source | Applicability | Status |
| --- | --- | --- | --- |
| POPIA-ACC-001 | Section 8 | General | Draft |
| POPIA-PLM-001 | Section 9 | General | Draft |
| POPIA-PLM-002 | Section 10 | General | Draft |
| POPIA-PLM-003 | Section 11 | General | Draft |
| POPIA-PLM-004 | Section 12 | General / exceptions | Draft |
| POPIA-PUR-001 | Section 13 | General | Draft |
| POPIA-PUR-002 | Section 14 | General | Draft |
| POPIA-FPL-001 | Section 15 | Further processing | Draft |
| POPIA-IQ-001 | Section 16 | General | Draft |
| POPIA-OPN-001 | Section 17 | General | Draft |
| POPIA-OPN-002 | Section 18 | Collection / exceptions | Draft |
| POPIA-SEC-001 | Section 19 | General | Draft |
| POPIA-SEC-002 | Section 19 | General | Draft |
| POPIA-SEC-003 | Section 20 | Operator use | Draft |
| POPIA-SEC-004 | Section 21 | Operator use | Draft |
| POPIA-SEC-005 | Section 22 | Event-triggered | Draft |
| POPIA-DSP-001 | Section 23 | General | Draft |
| POPIA-DSP-002 | Section 24 | General | Draft |
| POPIA-DSP-003 | Section 14(6)-(8) | Conditional | Source corrected; taxonomy review pending |
| POPIA-SPI-001 | Sections 26-27 | Conditional | Draft |
| POPIA-SPI-002 | Sections 28-33 | Conditional | Draft |
| POPIA-CHD-001 | Sections 34-35 | Conditional | Draft |
| POPIA-IO-001 | Section 55(2) | General | Draft |
| POPIA-IO-002 | Section 55(1) | General | Draft |
| POPIA-IO-003 | Regulation 4(1)(a) | General | Draft |
| POPIA-IO-004 | Regulation 4(1)(b) | General | Draft |
| POPIA-IO-005 | Regulation 4(1)(d)-(f), as amended | General | Draft |
| POPIA-PA-001 | Section 57 | Conditional | Draft |
| POPIA-PA-002 | Sections 57-58 | Conditional | Draft |
| POPIA-DM-001 | Section 69 | Conditional | Draft |
| POPIA-DM-002 | Section 69 | Conditional | Draft |
| POPIA-DM-003 | Sections 11 and 69 | Conditional | Draft |
| POPIA-ADM-001 | Section 71 | Conditional | Draft |
| POPIA-ADM-002 | Section 71 | Conditional | Draft |
| POPIA-TBF-001 | Section 72 | Conditional | Draft |

Initial atomic requirement count:

35

Production-approved requirement count:

0

---

# 11. Provenance Mapping

The Prisma ComplianceRequirement fields map as follows:

code
→ stable ComplianceOS regulatory requirement identifier

title
→ concise organization-facing obligation

description
→ operational explanation of the obligation

category
→ ComplianceRequirementCategory

authority
→ regulator, legislature or institutional authority

sourceTitle
→ authoritative legal, regulatory or standards instrument

sourceReference
→ section, regulation, clause, principle or official reference

sourceUrl
→ authoritative source location

effectiveFrom
→ date from which the represented catalogue requirement applies where
  a defensible date is established

mandatory
→ requirement characteristic, subject to future applicability logic

weight
→ scoring weight

active
→ whether requirement is part of the currently assessable catalogue

---

# 12. Evidence Doctrine

A Document is an organization-owned artifact.

Evidence is the compliance meaning assigned to an artifact or other
verifiable proof.

A Document must not automatically satisfy a ComplianceRequirement.

Example:

Document:
Information Security Policy.pdf

Possible Evidence relationships:

→ POPIA-SEC-001
→ POPIA-SEC-002

Each Evidence relationship must be independently reviewable.

Uploading a document does not constitute verification.

Workflow completion does not constitute verification.

Only verified Evidence may satisfy a requirement under the locked
ComplianceOS compliance engine.

---

# 13. Legal Interpretation Boundary

ComplianceOS is a compliance-support and evidence system.

It must distinguish:

- statutory text;
- regulatory requirements;
- official regulatory guidance;
- ComplianceOS operational interpretation;
- organization evidence;
- reviewer verification.

The platform must not represent ComplianceOS-generated operational
guidance as though it were statutory text.

Where legal applicability depends on facts or interpretation,
ComplianceOS must preserve that uncertainty and should support
professional or legal review rather than fabricate certainty.

---

# 14. Versioning Doctrine

This catalogue will evolve.

A requirement must not be silently rewritten where a regulatory change
materially alters the obligation.

Future catalogue management must support:

- source changes;
- requirement retirement;
- successor requirements;
- effective dates;
- historical assessments;
- preservation of previously evaluated Evidence;
- reproducibility of historical compliance positions.

The current Prisma model provides `effectiveFrom` and `active`.

More advanced regulatory versioning may require a later schema
milestone.

---

# 15. Outstanding Review Work

The candidate POPIA requirement specification now contains 35 atomic
requirements and has passed structural catalogue-integrity verification.

This does not authorize production provisioning.

Before the catalogue can be provisioned for production use:

1. Complete final source-by-source regulatory verification of every
   candidate requirement against authoritative POPIA and regulatory
   instruments.
2. Establish authoritative source URLs for provisioned requirements.
3. Establish defensible effectiveFrom values where applicable.
4. Design and implement applicability resolution for GENERAL,
   CONDITIONAL, SECTOR_SPECIFIC and EVENT_TRIGGERED obligations before
   requirements whose applicability is not universal participate in
   scoring.
5. Complete the regulatory-instrument applicability foundation before
   REG requirements are introduced into production scoring.
6. Review current security-compromise notification procedures and
   prescribed regulatory processes against authoritative current
   instruments.
7. Resolve the remaining POPIA-DSP-003 domain-taxonomy review without
   changing its corrected statutory provenance.
8. Define catalogue versioning and supersession behavior sufficient to
   preserve historical assessments when legal or regulatory obligations
   materially change.
9. Build deterministic catalogue provisioning and catalogue-integrity
   verification.
10. Verify production catalogue state immediately before provisioning.
11. Obtain explicit milestone approval before any production catalogue
    records are created.

Completed candidate-specification work includes:

- the eight POPIA conditions for lawful processing;
- special personal information;
- children's personal information;
- Information Officer and governance responsibilities;
- prior authorisation;
- direct marketing;
- automated decision-making; and
- transborder information flows.

Instrument-specific REG obligations remain deliberately deferred until
their provenance and applicability can be represented without
distorting organization compliance scores.

---

# 16. Production Gate

This specification is not authority to provision production.

Production provisioning is prohibited until:

- regulatory source review passes;
- requirement semantics pass;
- applicability policy is defined;
- source provenance is complete;
- deterministic integrity verification passes;
- production provisioning mechanism is reviewed;
- migration/catalogue state is verified;
- explicit milestone approval is given.

---

## Current Milestone Position

Milestone 8A.1 — Regulatory Catalogue Model Foundation:

LOCKED

Milestone 8A.2 — POPIA Requirement Specification:

IN PROGRESS

Production POPIA catalogue:

EMPTY
