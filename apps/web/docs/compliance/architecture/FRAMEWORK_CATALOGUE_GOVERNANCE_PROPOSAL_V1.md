# ComplianceOS Framework Catalogue Governance Proposal V1

**Milestone:** 8L — Governed Regulatory Catalogue Provisioning
**Status:** ARCHITECTURE PROPOSAL — NO DATABASE CHANGE

## 1. Foundational Governance Invariants

Framework existence does not establish regulatory approval.
Framework approval does not establish production publication.
Production publication does not establish organisation adoption.
Organisation adoption does not establish compliance.

Only explicit current framework catalogue authority may make a framework visible for organisation establishment.

Publication must never be inferred from createdAt, updatedAt, version, framework existence, requirement existence, or approval state alone.

## 2. Regulatory Catalogue Boundary

The V1 regulatory catalogue aggregate is rooted at the stable Framework identity.

Regulatory catalogue content includes ComplianceRequirement, RegulatoryFactDefinition, RegulatoryFactDefinitionOption, and governed ApplicabilityDefinition revisions.

ApplicabilityContext, RegulatoryFact, RegulatoryFactValue, Assessment, and AssessmentRequirementApplicability are organisation or assessment runtime state and are not framework catalogue publication records.

V1 must not move organisation-specific runtime state into framework catalogue governance.

## 3. Framework Approval Semantics

Framework approval means the regulatory catalogue has passed the required legal-source, integrity, and provisioning review gates for the approved scope.

Approval is an explicit governance event. It must never be inferred from framework existence, timestamps, version labels, active requirements, or successful validation alone.

Approval alone must not expose a framework to organisations.

Completed framework catalogue approval does not mean CURRENT.
Completed framework catalogue approval does not mean PUBLISHED.

## 4. Current Framework Catalogue Authority

Production catalogue visibility must be established through an explicit current framework catalogue authority.

Only a framework that has satisfied the required approval gates may receive current catalogue authority.

Current catalogue authority is the sole V1 authority for exposing a framework through the SME framework catalogue.

Catalogue visibility must not fall back to Framework existence when current authority is absent.

## 5. Withdrawal and Historical Integrity

Withdrawal of current catalogue authority prevents new organisation establishment but must not erase the Framework or historical organisation assessments.

Existing CurrentAssessmentAuthority records and completed historical assessments must not be silently deleted or rewritten solely because catalogue publication authority is withdrawn.

Framework retirement and catalogue withdrawal are distinct governance events.

Historical regulatory provenance, assessment snapshots, authority transitions, and compliance results must remain auditable after withdrawal.

## 6. Effect of Catalogue Withdrawal on Existing Organisations

Catalogue withdrawal governs future framework establishment.

It must not by itself revoke an existing organisation CurrentAssessmentAuthority or mutate an existing Assessment.

A mutable assessment must not be silently completed, frozen, deleted, reassigned, or recalculated solely because framework catalogue authority is withdrawn.

Any future rule requiring reassessment, suspension, migration, or organisation notification after catalogue withdrawal must be explicit and independently governed.

Completed assessments remain historical records.

Catalogue withdrawal must not cause current regulatory state to be retroactively applied to completed historical assessments.

## 7. Minimum V1 Persistence Responsibility

The persistence model must represent framework regulatory approval separately from current production catalogue authority.

It must preserve who established governance state, when it was established, and the reason where applicable.

Current catalogue authority must be explicit and queryable.

Catalogue authority changes must be historically auditable rather than inferred from mutable Framework fields.

V1 must not require a wholesale rewrite of existing requirement, applicability, assessment, evidence, or regulatory-fact ownership.

## 8. Candidate V1 Governance Model

Framework remains the stable framework identity.

FrameworkCatalogueApproval represents an explicit reviewed and approved regulatory catalogue state for a Framework.

CurrentFrameworkCatalogueAuthority identifies the FrameworkCatalogueApproval currently authorized for production catalogue exposure.

FrameworkCatalogueAuthorityTransition preserves typed history whenever current catalogue authority is established, replaced, or withdrawn.

## 9. Approval Version and Identity Semantics

Each FrameworkCatalogueApproval belongs to exactly one Framework and carries an explicit monotonically increasing version within that Framework.

Approval version identifies a governance revision; it must not be inferred from createdAt or updatedAt.

Only a completed FrameworkCatalogueApproval may become current catalogue authority.

Creating a newer approval revision must not automatically replace current catalogue authority.

LATEST does not mean CURRENT.

## 10. Approval Attestation Boundary

A FrameworkCatalogueApproval records that the controlled review process for its declared catalogue scope completed successfully.

It must record the approving user, approval time, and a governance reason or review reference sufficient for audit.

Approval must be rejected if required production gates are unresolved.

The approval service, not timestamps or row existence, is responsible for enforcing those gates.

Approval does not replace requirement provenance, applicability-definition approval, or regulatory-fact-definition integrity validation.

## 11. Candidate Relational Shape

The candidate V1 persistence shape contains three governance models:

1. FrameworkCatalogueApproval
2. CurrentFrameworkCatalogueAuthority
3. FrameworkCatalogueAuthorityTransition

FrameworkCatalogueApproval:
- belongs to exactly one Framework;
- has a version unique within that Framework;
- represents a completed approval event;
- records approvedAt and approvedById;
- records a governance reason or review reference;
- is immutable after creation in V1;

CurrentFrameworkCatalogueAuthority:
- has exactly one current row per published Framework;
- references exactly one FrameworkCatalogueApproval;
- requires the approval to belong to the same Framework;
- requires the referenced approval to represent a completed approval artifact;
- records establishedAt, establishedById, and reason;
- must never be selected by newest-version or timestamp inference.

FrameworkCatalogueAuthorityTransition:
- belongs to exactly one Framework;
- records the previous approval authority when one existed;
- records the new approval authority when authority is established or replaced;
- records the actor, reason, and transition time;
- must preserve same-Framework integrity across previous and new approvals.

## 12. Explicit Withdrawal Representation

Catalogue withdrawal must be representable without creating a synthetic replacement approval.

For a withdrawal transition, previousFrameworkCatalogueApprovalId is required and newFrameworkCatalogueApprovalId is null.

For initial establishment, previousFrameworkCatalogueApprovalId is null and newFrameworkCatalogueApprovalId is required.

For replacement, both previousFrameworkCatalogueApprovalId and newFrameworkCatalogueApprovalId are required.

A transition with both approval identifiers null is invalid.

## 13. Authority Cardinality and Integrity

CurrentFrameworkCatalogueAuthority.frameworkId must be unique.

CurrentFrameworkCatalogueAuthority.frameworkCatalogueApprovalId must be unique.

The referenced approval frameworkId must equal the authority frameworkId.

Cross-Framework catalogue authority is forbidden.

Absence of CurrentFrameworkCatalogueAuthority means the Framework is not currently published for new organisation establishment.

## 14. Authority Mutation Transaction Boundary

Establishment, replacement, and withdrawal of current catalogue authority must each execute atomically.

The authority pointer mutation and corresponding FrameworkCatalogueAuthorityTransition creation must succeed or fail together.

Withdrawal must record its transition before the transaction commits without current authority.

A failed transition-history write must roll back the authority mutation.

No operation may leave catalogue visibility changed without corresponding typed transition history.

## 15. Framework Establishment Publication Gate

Organisation framework establishment must require current framework catalogue authority for the requested Framework.

Framework existence alone is insufficient for establishment.

The establishment transaction must fail closed when current catalogue authority is absent, withdrawn, cross-Framework, or points to an invalid FrameworkCatalogueApproval.

The SME framework catalogue read model and framework establishment write model must enforce the same publication-authority boundary.

## 16. Candidate Prisma Declaration Map

FrameworkCatalogueApproval candidate fields:
- id: stable immutable approval identity;
- frameworkId: owning Framework;
- version: monotonically increasing approval version within the Framework;
- contentManifest: immutable canonical approved manifest snapshot;
- contentHash: SHA-256 fingerprint of contentManifest;
- manifestAlgorithmVersion: canonicalization and hashing algorithm version;
- approvedAt: required approval timestamp;
- approvedById: required approving User;
- reason: required governance reason or review reference;
- createdAt: persistence creation timestamp;

CurrentFrameworkCatalogueAuthority candidate fields:
- id: stable authority-pointer identity;
- frameworkId: unique Framework authority domain;
- frameworkCatalogueApprovalId: unique currently authoritative approval;
- establishedAt: explicit authority-establishment timestamp;
- establishedById: required User who established current authority;
- reason: authority-establishment reason;

FrameworkCatalogueAuthorityTransition candidate fields:
- id: stable transition identity;
- frameworkId: Framework authority domain;
- previousFrameworkCatalogueApprovalId: nullable previous authority;
- newFrameworkCatalogueApprovalId: nullable new authority;

- transitionType: ESTABLISH, REPLACE, or WITHDRAW;
- transitionedAt: explicit transition timestamp;
- transitionedById: required User responsible for the transition;
- reason: required governance reason;

Candidate relational constraints:
- FrameworkCatalogueApproval @@unique([frameworkId, version]);
- CurrentFrameworkCatalogueAuthority frameworkId unique;
- CurrentFrameworkCatalogueAuthority frameworkCatalogueApprovalId unique;
- every authority and transition approval reference must remain inside frameworkId;

Transition nullability is application-enforced:
- ESTABLISH: previous null, new required;
- REPLACE: previous required, new required;
- WITHDRAW: previous required, new null;
- previous null and new null: forbidden.

## 17. Approved Catalogue Content Integrity

Framework catalogue approval must bind to the exact regulatory catalogue content reviewed by the approval process.

An approval of Framework identity alone is insufficient because Framework-owned regulatory content remains independently mutable.

FrameworkCatalogueApproval must therefore preserve a deterministic content manifest fingerprint representing the approved catalogue state.

The approval fingerprint must be immutable from FrameworkCatalogueApproval creation.

Current catalogue authority must not authorize catalogue content whose deterministic fingerprint differs from the fingerprint recorded by its authoritative approval.

## 18. Approved Content Drift Semantics

If live regulatory catalogue content differs from the authoritative approval fingerprint, the Framework must fail closed for new catalogue exposure and organisation establishment.

Content drift must not silently mutate, replace, withdraw, or recreate current catalogue authority.

Restoring production eligibility requires an explicit governed correction or a newly approved catalogue revision followed by explicit authority establishment or replacement.

Existing organisation assessments and historical authority transitions must remain intact when drift is detected.

## 19. Deterministic Approval Manifest Boundary

The approval manifest must include regulatory catalogue definition state owned by the Framework that can materially change catalogue meaning.

The manifest must exclude organisation-specific runtime state, assessments, evidence, regulatory fact values, current organisation authorities, and other SME execution state.

At minimum the manifest scope must account for Framework catalogue identity, ComplianceRequirement regulatory fields, RegulatoryFactDefinition and option definitions, and the explicitly current approved ApplicabilityDefinition for each governed requirement where applicable.

Document provenance may contribute referenced regulatory metadata but must not be treated as independent proof of regulatory truth.

## 20. Canonical Manifest Serialization

The approval manifest must be constructed from a deterministic canonical representation before hashing.

Equivalent regulatory catalogue state must produce byte-for-byte identical canonical manifest input.

Canonical object keys must use a fixed declared order.

Collections must be sorted by explicit stable keys before serialization and must never depend on database return order.

Null must remain explicit null; it must not be silently converted to an empty string, omitted value, false, zero, or empty collection.

## 21. Manifest Stability Boundary

Operational timestamps, approval metadata, transition metadata, database query order, and other non-regulatory volatile state must not affect the catalogue fingerprint.

Runtime organisation identifiers and assessment state must not affect the catalogue fingerprint.

Stable database identities may be included only where identity itself is part of the governed regulatory relationship.

The manifest must prioritize regulatory meaning and stable relationship identity rather than incidental persistence metadata.

## 22. Fingerprint Algorithm Versioning

V1 catalogue fingerprints use SHA-256 over the UTF-8 bytes of the canonical serialized manifest.

FrameworkCatalogueApproval must record the manifest algorithm version used to calculate its fingerprint.

Fingerprint comparison must use the algorithm version recorded by the approval rather than silently applying a newer algorithm.

A future canonicalization change requires an explicit new manifest algorithm version and must not reinterpret historical approval fingerprints.

## 23. Authority-Time Fingerprint Revalidation

Before an approval becomes current catalogue authority, its stored fingerprint must be compared with a freshly calculated fingerprint of the live governed catalogue state.

Authority establishment or replacement must fail closed when those fingerprints differ.

Organisation framework establishment must also validate current catalogue authority against the governed live catalogue state inside its transaction boundary.

Catalogue read exposure must apply the same integrity rule so that read and write paths cannot disagree about publication eligibility.

## 23A. Publication Structural Eligibility

Fingerprint equality is necessary but is not sufficient for production catalogue eligibility.

Approval creation, catalogue authority establishment or replacement, catalogue read exposure, and organisation framework establishment must fail closed unless the live governed catalogue state also satisfies the V1 structural eligibility contract.

For every active ComplianceRequirement in the Framework, exactly one CurrentApplicabilityDefinitionAuthority must exist and must resolve to an ApplicabilityDefinition belonging to that same requirement with status APPROVED.

The absence of current applicability authority for an active requirement is invalid production catalogue state. An APPROVED ApplicabilityDefinition that is not explicitly current does not satisfy this requirement.

All ComplianceRequirements owned by the Framework, including inactive requirements, must remain represented in the manifest. All RegulatoryFactDefinitions and their options, including inactive definitions and options, must remain represented. Inactive state is expressed through the governed active field rather than by filtering the record out of the manifest.

Where an inactive requirement has current applicability authority, that authoritative definition and its governed dependencies remain represented in the manifest. Where an inactive requirement has no current applicability authority, the manifest must represent current applicability explicitly as null rather than inventing authority.

Every selected current applicability definition must satisfy same-requirement authority integrity, and every ApplicabilityRuleFactDependency must resolve to a RegulatoryFactDefinition owned by the same Framework.

Structural eligibility validation and fingerprint comparison are independent mandatory gates. Matching contentHash does not override invalid authority structure, invalid approval status, missing required current applicability authority, cross-Framework references, or any other structural-governance failure.

## 24. V1 Manifest Identity and Field Map

The V1 manifest represents governed catalogue relationships using stable regulatory identities wherever the live schema provides them.

ComplianceRequirement identity is represented by code.
RegulatoryFactDefinition identity is represented by key within the Framework.
ApplicabilityDefinition identity is represented by requirement code plus definition version.
RegulatoryFactDefinitionOption identity is represented by parent fact-definition key plus option value.

Framework manifest fields:
- name, version, description.

ComplianceRequirement manifest fields:
- code, title, description, category;
- authority, sourceTitle, sourceReference, sourceUrl, effectiveFrom;
- mandatory, weight, active.

Each ComplianceRequirement manifest object also contains a currentApplicability field. currentApplicability is either the canonical object for the ApplicabilityDefinition selected through CurrentApplicabilityDefinitionAuthority or explicit JSON null. It must never be omitted.

RegulatoryFactDefinition manifest fields:
- key, name, description, valueType;
- allowedContextTypes, sourceTitle, sourceReference, sourceUrl, effectiveFrom;
- active.

RegulatoryFactDefinitionOption manifest fields:
- value, label, description, sortOrder, active.

Options are nested under their RegulatoryFactDefinition and sorted by value.

allowedContextTypes must be serialized in canonical enum-value order and must not depend on database array order.

Current applicability manifest fields:
- requirement code and authoritative ApplicabilityDefinition version;
- applicabilityClass, resolutionPattern, ruleAst, ruleSchemaVersion;
- sourceTitle, sourceReference, sourceUrl, effectiveFrom, effectiveUntil.

The applicability definition included in the manifest must be selected only through CurrentApplicabilityDefinitionAuthority.

For an active ComplianceRequirement, currentApplicability must not be null; absence of valid current authority is a structural eligibility failure before approval or publication. For an inactive ComplianceRequirement, currentApplicability may be null when no current authority exists.

Its target must belong to the same requirement and must have status APPROVED; APPROVED status alone must never select the manifest definition.

ApplicabilityRuleFactDependency manifest fields:
- referenced RegulatoryFactDefinition key;
- required.

Dependencies are nested under the authoritative applicability definition and sorted by referenced fact-definition key.

Every manifest dependency must reference a RegulatoryFactDefinition owned by the same Framework.

A cross-Framework dependency is invalid governed catalogue state and must fail catalogue approval and publication integrity validation.

V1 manifest exclusions:
- generated database ids and relation foreign-key ids where stable regulatory identities are available;
- createdAt and updatedAt operational timestamps;
- approvedAt, approvedById, retiredAt and other approval-lifecycle metadata;
- authority establishment timestamps, actors and reasons;
- assessments, evidence, organisation runtime contexts, regulatory facts and values;
- assessment snapshots, resolutions, scores, coverage and organisation authority state.

V1 collection inclusion:
- ComplianceRequirements: include all Framework-owned requirements, active and inactive;
- RegulatoryFactDefinitions: include all Framework-owned definitions, active and inactive;
- RegulatoryFactDefinitionOptions: include all options of included fact definitions, active and inactive;

V1 collection ordering:
- ComplianceRequirements: ascending code;
- RegulatoryFactDefinitions: ascending key;
- RegulatoryFactDefinitionOptions: ascending value within parent fact definition;
- ApplicabilityRuleFactDependencies: ascending referenced fact-definition key.

Canonical ordering is part of manifest algorithm V1 and must not be inferred from Prisma or database return order.

## 25. Immutable Approval Evidence

FrameworkCatalogueApproval must preserve the exact canonical manifest that was reviewed and approved, not only its fingerprint.

The stored manifest is immutable approval evidence and is not an alternative operational regulatory catalogue.

Live Framework-owned regulatory records remain the operational catalogue state.

Each approved FrameworkCatalogueApproval must preserve:
- contentManifest: the canonical approved manifest snapshot;
- contentHash: the SHA-256 fingerprint of that exact canonical manifest;
- manifestAlgorithmVersion: the canonicalization and hashing algorithm version.

contentHash must equal the fingerprint produced from contentManifest using manifestAlgorithmVersion.

Approval creation must fail closed if the stored manifest, calculated fingerprint, and recorded fingerprint disagree.

From FrameworkCatalogueApproval creation, contentManifest, contentHash, manifestAlgorithmVersion, frameworkId, and approval version are immutable.

A change to approved regulatory content requires a new FrameworkCatalogueApproval version rather than mutation of historical approval evidence.

Historical approval evidence must remain interpretable without reconstructing the old catalogue from the current mutable operational tables.

The immutable manifest snapshot records what regulatory catalogue state was approved at that approval version.

The fingerprint provides deterministic integrity verification of that snapshot; it is an integrity fingerprint and must not be described as a cryptographic signature or independent proof of regulatory truth.

Publication integrity compares a freshly generated live canonical manifest against the authoritative approval contentHash using the approval manifestAlgorithmVersion.

The persisted contentManifest remains historical approval evidence and must never be rewritten to match later live catalogue state.

Live drift therefore changes publication eligibility, not historical approval evidence.

FrameworkCatalogueApproval candidate persistence is therefore refined to include contentManifest, contentHash, and manifestAlgorithmVersion in addition to the approval identity and attestation fields defined earlier.

## 26. Approval Artifact Lifecycle Reconciliation

FrameworkCatalogueApproval is an immutable completed approval artifact, not a mutable regulatory-review workflow record.

The V1 approval artifact is created only after all required regulatory review and approval gates succeed.

Draft or in-progress regulatory review state, if persisted in the future, must use a separate workflow responsibility and must not weaken the semantics of FrameworkCatalogueApproval.

FrameworkCatalogueApproval therefore does not require a mutable status field in V1.

Existence of the approval artifact records completed approval; it does not establish publication authority.

APPROVED does not mean CURRENT remains a semantic invariant: completed approval is represented by FrameworkCatalogueApproval existence, while CURRENT is represented only by CurrentFrameworkCatalogueAuthority.

approvedAt and approvedById are required on every FrameworkCatalogueApproval because the artifact cannot exist before approval succeeds.

reason or review reference is required governance attestation for the approval event.

Reconciled FrameworkCatalogueApproval V1 responsibilities:
- id: stable immutable approval identity;
- frameworkId: owning Framework;
- version: monotonically increasing approval version within the Framework;
- contentManifest: immutable canonical approved manifest snapshot;

- contentHash: SHA-256 fingerprint of contentManifest;
- manifestAlgorithmVersion: algorithm used to canonicalize and fingerprint the manifest;
- approvedAt: required approval timestamp;
- approvedById: required approving User;
- reason: required governance reason or review reference;
- createdAt: persistence creation timestamp.

FrameworkCatalogueApproval records are immutable after creation in V1.

Retirement, withdrawal, replacement, or loss of publication eligibility must not rewrite historical approval evidence.

Catalogue publication remains a separate authority concern: only CurrentFrameworkCatalogueAuthority may establish which completed approval artifact is currently exposed for new organisation establishment.

This reconciliation supersedes the earlier Section 16 candidate status field and its nullable-until-approved semantics.

Section 16 must be normalized to this reconciled contract before literal Prisma declarations are produced.

## 27. Canonical Manifest Persistence Representation

In V1, contentManifest is persisted as the exact canonical serialized manifest string used as the input to fingerprinting.

contentManifest is not persisted as a database JSON value in V1 because the approval artifact must preserve the canonical serialized representation whose UTF-8 bytes are fingerprinted.

For manifest algorithm V1:
- canonicalBytes = UTF-8(contentManifest);
- contentHash = lowercase hexadecimal SHA-256(canonicalBytes).

Live governed catalogue state is first converted into the canonical manifest representation defined by the recorded manifestAlgorithmVersion, then serialized to contentManifest, then fingerprinted.

Verification of historical approval evidence hashes the persisted contentManifest bytes directly using the recorded manifestAlgorithmVersion rules; it must not depend on database JSON reserialization.

## 28. Manifest Algorithm V1 Determinism Contract

Manifest algorithm V1 serializes the governed manifest as canonical JSON text encoded as UTF-8.

Canonical JSON object keys are emitted in the fixed manifest field order defined by this specification; nested generic JSON objects, including objects inside ruleAst, use ascending Unicode scalar-value (code-point) order, comparing successive Unicode scalar values numerically rather than UTF-16 code units.

Null is serialized explicitly as JSON null. Optional governed fields must not be silently omitted when the manifest field map requires them.

Strings use standard JSON string escaping and are not trimmed, case-folded, or otherwise normalized by the manifest algorithm.

DateTime values are serialized in UTC using ISO 8601 with millisecond precision and the Z suffix: YYYY-MM-DDTHH:mm:ss.sssZ.

Numeric governed values must be finite JSON numbers. NaN, positive infinity, and negative infinity are invalid manifest inputs and fail closed.

Manifest algorithm V1 serializes finite numeric governed values using ECMAScript JSON.stringify number serialization semantics. Negative zero is canonicalized to JSON number 0. NaN, positive infinity, and negative infinity remain invalid inputs and must fail closed. Numeric values must never be emitted as locale-formatted strings.

Arrays preserve semantic order unless this specification defines an explicit canonical ordering for that field or collection.

Governed catalogue collections use the explicit ordering rules in Section 24 and never database return order.

For manifest algorithm V1, allowedContextTypes canonical order is: ORGANIZATION, EVENT, MATTER, ACTIVITY, RELATIONSHIP, TRANSFER, SYSTEM, AUTOMATED_DECISION.

allowedContextTypes is set-like governed input in V1. Duplicate enum values are invalid and must fail closed before serialization; canonical ordering must not silently deduplicate or otherwise repair invalid input.

ruleAst objects are recursively canonicalized by ascending Unicode scalar-value (code-point) order, comparing successive Unicode scalar values numerically rather than UTF-16 code units.

ruleAst arrays preserve their validated array order in V1; the manifest algorithm must not reorder rule operands based on inferred logical equivalence.

The same governed catalogue state processed under manifest algorithm V1 must produce byte-for-byte identical contentManifest output and therefore the same contentHash.

Any canonicalization rule change requires a new manifestAlgorithmVersion and must not reinterpret historical approval artifacts.


## 29. V1 Persistence Enforcement Boundary

V1 distinguishes database-enforced relational invariants from application-enforced governance invariants.

The database must enforce:
- primary identity and foreign-key existence;
- FrameworkCatalogueApproval uniqueness by frameworkId and version;
- at most one CurrentFrameworkCatalogueAuthority per Framework;
- at most one current authority pointer to a FrameworkCatalogueApproval;
- required versus nullable scalar fields declared by the V1 persistence contract;
- restrictive deletion for governed Framework and approval relationships.

The governed application services must enforce inside their required transaction boundaries:
- every FrameworkCatalogueApproval referenced by current authority belongs to the same Framework as that authority;
- every previous or new approval referenced by a FrameworkCatalogueAuthorityTransition belongs to the transition Framework;
- ESTABLISH requires previous approval null and new approval present;
- REPLACE requires previous and new approvals present;
- WITHDRAW requires previous approval present and new approval null;
- previous and new approval identifiers may not both be null;
- FrameworkCatalogueApproval is immutable after creation;
- approval version allocation is monotonic within the Framework;
- approval manifest construction, fingerprint verification, structural eligibility, and publication-integrity validation;
- current authority mutation and transition-history creation are atomic.

V1 does not claim that same-Framework approval-reference integrity or the transition nullability matrix is enforced by a composite database foreign key or database CHECK constraint.

Those invariants remain mandatory application-level governance rules and must fail closed.

The authority services must execute the relevant read, validation, authority mutation, and transition-history write inside the governed SERIALIZABLE transaction where required by this specification.

## 30. Candidate Prisma Declaration V1

The following declaration is the V1 persistence candidate. It is specification text only and does not authorize modification of the live Prisma schema or database.

```prisma
enum FrameworkCatalogueAuthorityTransitionType {
  ESTABLISH
  REPLACE
  WITHDRAW
}

model FrameworkCatalogueApproval {
  id                       String   @id @default(cuid())
  frameworkId              String
  version                  Int
  contentManifest          String
  contentHash              String
  manifestAlgorithmVersion Int
  approvedAt               DateTime
  approvedById             String
  reason                   String
  createdAt                DateTime @default(now())

  framework                    Framework                               @relation(fields: [frameworkId], references: [id], onDelete: Restrict)
  approvedBy                   User                                    @relation("FrameworkCatalogueApprovalApprovedBy", fields: [approvedById], references: [id], onDelete: Restrict)
  currentAuthority             CurrentFrameworkCatalogueAuthority?
  previousAuthorityTransitions FrameworkCatalogueAuthorityTransition[] @relation("PreviousFrameworkCatalogueApprovalAuthority")
  newAuthorityTransitions      FrameworkCatalogueAuthorityTransition[] @relation("NewFrameworkCatalogueApprovalAuthority")

  @@unique([frameworkId, version])
  @@index([frameworkId])
  @@index([approvedById])
  @@index([contentHash])
}

model CurrentFrameworkCatalogueAuthority {
  id                           String   @id @default(cuid())
  frameworkId                  String   @unique
  frameworkCatalogueApprovalId String   @unique
  establishedAt                DateTime @default(now())
  establishedById              String
  reason                       String
  createdAt                    DateTime @default(now())
  updatedAt                    DateTime @updatedAt

  framework                  Framework                  @relation(fields: [frameworkId], references: [id], onDelete: Restrict)
  frameworkCatalogueApproval FrameworkCatalogueApproval @relation(fields: [frameworkCatalogueApprovalId], references: [id], onDelete: Restrict)
  establishedBy              User                       @relation("CurrentFrameworkCatalogueAuthorityEstablishedBy", fields: [establishedById], references: [id], onDelete: Restrict)

  @@index([establishedById])
}

model FrameworkCatalogueAuthorityTransition {
  id                                   String                                    @id @default(cuid())
  frameworkId                          String
  previousFrameworkCatalogueApprovalId String?
  newFrameworkCatalogueApprovalId      String?
  transitionType                       FrameworkCatalogueAuthorityTransitionType
  transitionedAt                       DateTime                                  @default(now())
  transitionedById                     String
  reason                               String
  createdAt                            DateTime                                  @default(now())

  framework                        Framework                   @relation(fields: [frameworkId], references: [id], onDelete: Restrict)
  previousFrameworkCatalogueApproval FrameworkCatalogueApproval? @relation("PreviousFrameworkCatalogueApprovalAuthority", fields: [previousFrameworkCatalogueApprovalId], references: [id], onDelete: Restrict)
  newFrameworkCatalogueApproval      FrameworkCatalogueApproval? @relation("NewFrameworkCatalogueApprovalAuthority", fields: [newFrameworkCatalogueApprovalId], references: [id], onDelete: Restrict)
  transitionedBy                    User                        @relation("FrameworkCatalogueAuthorityTransitionTransitionedBy", fields: [transitionedById], references: [id], onDelete: Restrict)

  @@index([frameworkId, transitionedAt])
  @@index([previousFrameworkCatalogueApprovalId])
  @@index([newFrameworkCatalogueApprovalId])
  @@index([transitionedById])
}



Required Framework inverse relations:

```prisma
frameworkCatalogueApprovals            FrameworkCatalogueApproval[]
currentFrameworkCatalogueAuthority     CurrentFrameworkCatalogueAuthority?
frameworkCatalogueAuthorityTransitions FrameworkCatalogueAuthorityTransition[]
```

Required User inverse relations:

```prisma
frameworkCatalogueApprovalsApproved               FrameworkCatalogueApproval[]            @relation("FrameworkCatalogueApprovalApprovedBy")
currentFrameworkCatalogueAuthoritiesEstablished   CurrentFrameworkCatalogueAuthority[]     @relation("CurrentFrameworkCatalogueAuthorityEstablishedBy")
frameworkCatalogueAuthorityTransitionsEstablished FrameworkCatalogueAuthorityTransition[]  @relation("FrameworkCatalogueAuthorityTransitionTransitionedBy")
```

The declaration intentionally does not encode same-Framework approval-reference integrity or the ESTABLISH / REPLACE / WITHDRAW nullability matrix as composite foreign keys or database CHECK constraints. Section 29 governs those mandatory service-enforced invariants.
