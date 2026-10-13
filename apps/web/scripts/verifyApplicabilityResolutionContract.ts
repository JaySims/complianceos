
import fs from "node:fs";
import path from "node:path";

type TestResult = {
  name: string;
  passed: boolean;
};

const results: TestResult[] = [];

const record = (name: string, passed: boolean) => {
  results.push({ name, passed });
};

const sourcePath = path.resolve(
  process.cwd(),
  "lib/compliance/applicabilityResolutionService.ts"
);

const source = fs.readFileSync(sourcePath, "utf8");

function section(start: string, end: string): string {
  const startIndex = source.indexOf(start);

  if (startIndex < 0) {
    return "";
  }

  const endIndex = source.indexOf(end, startIndex + start.length);

  return endIndex < 0
    ? source.slice(startIndex)
    : source.slice(startIndex, endIndex);
}

function has(text: string, pattern: RegExp | string): boolean {
  return typeof pattern === "string"
    ? text.includes(pattern)
    : pattern.test(text);
}

function precedes(
  text: string,
  first: string,
  second: string
): boolean {
  const firstIndex = text.indexOf(first);
  const secondIndex = text.indexOf(second);

  return (
    firstIndex >= 0 &&
    secondIndex >= 0 &&
    firstIndex < secondIndex
  );
}

const contextLoader = section(
  "async function loadResolutionContext(",
  "type ResolvedFactInput"
);

const factResolver = section(
  "async function resolveAuthoritativeFactInputs(",
  "SYSTEM RESOLUTION PERSISTENCE"
);

const persistence = section(
  "async function persistSystemResolution(",
  "export async function resolveAssessmentRequirementApplicability("
);

const publicResolver = section(
  "export async function resolveAssessmentRequirementApplicability(",
  "\u0000END_OF_FILE"
);

const transactionClientType =
  "type ResolutionTransaction = Prisma.TransactionClient";

const mutableStatuses = section(
  "const MUTABLE_ASSESSMENT_STATUSES",
  "function failure("
);

const statusMapper = section(
  "function mapRuleResolutionToApplicabilityStatus(",
  "function reviewStateForSystemResolution("
);

const reviewMapper = section(
  "function reviewStateForSystemResolution(",
  "type ResolutionContext"
);

/*
 * 1. Public contract and resolver identity
 */

record(
  "public applicability resolver remains exported",
  has(source, "export async function resolveAssessmentRequirementApplicability(")
);

record(
  "resolver input identifies assessment, requirement, context, organization, actor and reason",
  [
    "assessmentId: string;",
    "requirementId: string;",
    "contextId: string;",
    "organizationId: string;",
    "userId: string;",
    "reason: string;",
  ].every((field) => has(source, field))
);

record(
  "resolver exposes a typed success/failure result",
  has(source, "type ApplicabilityResolutionResult =") &&
    has(source, "success: true;") &&
    has(source, "success: false;")
);

record(
  "resolver version is explicitly identified",
  has(source, 'export const APPLICABILITY_RESOLVER_VERSION =') &&
    has(source, '"complianceos-applicability-resolver-v1"')
);

record(
  "database helper uses Prisma transaction client",
  has(source, transactionClientType)
);

record(
  "ordinary resolution permits only DRAFT, IN_PROGRESS and REVIEW",
  [
    "AssessmentStatus.DRAFT",
    "AssessmentStatus.IN_PROGRESS",
    "AssessmentStatus.REVIEW",
  ].every((status) => has(mutableStatuses, status)) &&
    !has(mutableStatuses, "AssessmentStatus.COMPLETED")
);

/*
 * 2. Input and assessment authorization
 */

record(
  "resolver trims the supplied reason",
  has(publicResolver, "const normalizedReason = input.reason.trim();")
);

record(
  "resolver rejects an empty reason before opening its transaction",
  precedes(
    publicResolver,
    "if (normalizedReason.length === 0)",
    "return await prisma.$transaction("
  )
);

record(
  "context loader checks organization membership",
  has(contextLoader, "db.organizationMember.findUnique(")
);

record(
  "context loader requires active organization membership",
  has(contextLoader, "if (!membership || !membership.active)")
);

record(
  "context loader resolves the assessment by supplied ID",
  has(contextLoader, "db.assessment.findUnique(") &&
    has(contextLoader, "id: input.assessmentId")
);

record(
  "context loader checks assessment organization ownership",
  has(contextLoader, "assessment.organizationId !== input.organizationId")
);

record(
  "context loader rejects non-mutable assessments",
  has(contextLoader, "!MUTABLE_ASSESSMENT_STATUSES.has(assessment.status)")
);

record(
  "context loader resolves the requirement explicitly",
  has(contextLoader, "db.complianceRequirement.findUnique(")
);

record(
  "context loader enforces requirement-framework consistency",
  has(contextLoader, "requirement.frameworkId !== assessment.frameworkId")
);

record(
  "context loader resolves the requested applicability context",
  has(contextLoader, "db.applicabilityContext.findUnique(") &&
    has(contextLoader, "id: input.contextId")
);

record(
  "context loader checks context organization and framework",
  has(contextLoader, "context.organizationId !== assessment.organizationId") &&
    has(contextLoader, "context.frameworkId !== assessment.frameworkId")
);

record(
  "context loader rejects inactive applicability contexts",
  has(contextLoader, "if (!context.active)")
);

/*
 * 3. Explicit applicability-definition authority
 */

record(
  "resolver reads explicit current definition authority",
  has(contextLoader, "db.currentApplicabilityDefinitionAuthority.findUnique(")
);

record(
  "definition authority lookup is scoped by requirement ID",
  has(contextLoader, "requirementId: requirement.id")
);

record(
  "resolver rejects missing current definition authority",
  has(contextLoader, '"CURRENT_DEFINITION_AUTHORITY_NOT_FOUND"')
);

record(
  "resolver loads the definition referenced by current authority",
  has(contextLoader, "id: authority.applicabilityDefinitionId")
);

record(
  "resolver verifies definition ownership by requirement",
  has(contextLoader, "definition.requirementId !== requirement.id")
);

record(
  "resolver requires the current definition to be APPROVED",
  has(contextLoader, "ApplicabilityDefinitionStatus.APPROVED")
);

record(
  "resolver revalidates the stored rule through shared validation",
  has(contextLoader, "validateApplicabilityDefinitionRule(") &&
    has(contextLoader, "ruleAst: definition.ruleAst")
);

record(
  "resolver passes the stored rule schema version to validation",
  has(contextLoader, "ruleSchemaVersion:") &&
    has(contextLoader, "definition.ruleSchemaVersion")
);

record(
  "resolver checks persisted dependency count against validated rule",
  has(contextLoader, "definition.dependencies.length !==") &&
    has(contextLoader, "expectedDependencyIds.length")
);

record(
  "resolver rejects dependencies that are not required",
  has(contextLoader, "dependency.required !== true")
);

record(
  "resolver rejects dependencies outside the validated rule set",
  has(contextLoader, "!expectedDependencySet.has(")
);

record(
  "resolver does not select a definition by latest or highest version",
  !has(contextLoader, 'orderBy: { version: "desc" }') &&
    !has(contextLoader, 'orderBy: { version: "asc" }')
);

/*
 * 4. Authoritative regulatory fact resolution
 */

record(
  "fact resolver iterates validated definition dependencies",
  has(factResolver, "for (const dependency of context.definition.dependencies)")
);

record(
  "fact resolver requires an active fact definition in the assessment framework",
  has(factResolver, "!factDefinition.active") &&
    has(factResolver, "factDefinition.frameworkId !==") &&
    has(factResolver, "context.assessment.frameworkId")
);

record(
  "fact resolver checks fact-definition compatibility with context type",
  has(factResolver, "factDefinition.allowedContextTypes.includes(") &&
    has(factResolver, "applicabilityContext.contextType")
);

record(
  "fact resolver finds facts in the organization-definition-context domain",
  [
    "organizationId_factDefinitionId_contextId",
    "organizationId:",
    "factDefinitionId:",
    "contextId:",
  ].every((field) => has(factResolver, field))
);

record(
  "fact resolver requires an active regulatory fact",
  has(factResolver, "!regulatoryFact || !regulatoryFact.active")
);

record(
  "fact resolver verifies regulatory fact ownership and context",
  has(factResolver, "regulatoryFact.organizationId !==") &&
    has(factResolver, "regulatoryFact.factDefinitionId !==") &&
    has(factResolver, "regulatoryFact.contextId !==")
);

record(
  "fact resolver reads explicit current regulatory fact authority",
  has(factResolver, "db.currentRegulatoryFactAuthority.findUnique(")
);

record(
  "fact authority lookup is scoped by regulatory fact ID",
  has(factResolver, "regulatoryFactId: regulatoryFact.id")
);

record(
  "fact resolver rejects missing current fact authority",
  has(factResolver, '"CURRENT_FACT_AUTHORITY_NOT_FOUND"')
);

record(
  "fact resolver loads the value referenced by current authority",
  has(factResolver, "id: currentAuthority.regulatoryFactValueId")
);

record(
  "fact resolver verifies fact-value ownership",
  has(factResolver, "factValue.regulatoryFactId !== regulatoryFact.id")
);

record(
  "fact resolver does not select the newest fact value as authority",
  !has(factResolver, 'orderBy: { createdAt: "desc" }') &&
    !has(factResolver, 'orderBy: { version: "desc" }')
);

/*
 * 5. Snapshot policy and evaluator inputs
 */

record(
  "fact values pass through the assessment snapshot policy",
  has(factResolver, "buildAssessmentRegulatoryFactSnapshotMaterial(")
);

record(
  "snapshot material includes source fact and value identities",
  has(factResolver, "regulatoryFactId: regulatoryFact.id") &&
    has(factResolver, "regulatoryFactValueId: factValue.id")
);

record(
  "snapshot material carries authority and knowledge states",
  has(factResolver, "authorityState: factValue.authorityState") &&
    has(factResolver, "knowledgeState: factValue.knowledgeState")
);

record(
  "decimal fact values are normalized for snapshot material",
  has(factResolver, "normalizePrismaDecimalForSnapshot(")
);

record(
  "snapshot policy failure stops resolution",
  has(factResolver, "if (!snapshotResult.success)") &&
    has(factResolver, '"SNAPSHOT_POLICY_VIOLATION"')
);

record(
  "evaluator inputs are derived from validated snapshot material",
  has(factResolver, "toApplicabilityRuleFactInput(") &&
    precedes(
      factResolver,
      "buildAssessmentRegulatoryFactSnapshotMaterial(",
      "toApplicabilityRuleFactInput("
    )
);

record(
  "evaluator input failure stops resolution",
  has(factResolver, "if (!evaluatorResult.success)") &&
    has(factResolver, '"EVALUATOR_INPUT_VIOLATION"')
);

record(
  "duplicate fact keys are rejected",
  has(factResolver, "Object.prototype.hasOwnProperty.call(") &&
    has(factResolver, "Duplicate applicability dependency fact key")
);

/*
 * 6. Stable identity, revision and historical evidence
 */

record(
  "persistence upserts stable assessment-requirement-context identity",
  has(persistence, "db.assessmentRequirementApplicability.upsert(") &&
    has(persistence, "assessmentId_requirementId_contextId")
);

record(
  "stable identity is checked against validated context",
  has(persistence, "stableApplicability.assessmentId !==") &&
    has(persistence, "stableApplicability.requirementId !==") &&
    has(persistence, "stableApplicability.contextId !==")
);

record(
  "next revision is derived from existing revision history",
  has(persistence, "db.assessmentRequirementApplicabilityRevision.findFirst(") &&
    has(persistence, 'orderBy: {') &&
    has(persistence, 'revision: "desc"') &&
    has(persistence, "(latestRevision?.revision ?? 0) + 1")
);

record(
  "persistence creates assessment-time fact snapshots",
  has(persistence, "db.assessmentRegulatoryFactSnapshot.create(")
);

record(
  "snapshot persistence retains source identities and provenance",
  [
    "sourceRegulatoryFactId:",
    "sourceFactValueId:",
    "sourceType:",
    "sourceReference:",
    "sourceDescription:",
    "sourceEstablishedAt:",
    "sourceReviewedAt:",
  ].every((field) => has(persistence, field))
);

record(
  "snapshot persistence retains typed values and validity dates",
  [
    "booleanValue:",
    "stringValue:",
    "numberValue:",
    "dateValue:",
    "enumValue:",
    "multiValue:",
    "validFrom:",
    "validUntil:",
  ].every((field) => has(persistence, field))
);

record(
  "revision records the approved definition identity",
  has(persistence, "applicabilityDefinitionId:") &&
    has(persistence, "input.context.definition.id")
);

record(
  "system-generated revision records SYSTEM resolution authority",
  has(persistence, "resolutionAuthority:") &&
    has(persistence, "ApplicabilityResolutionAuthority.SYSTEM")
);

record(
  "revision records review state and resolver version",
  has(persistence, "reviewState:") &&
    has(persistence, "resolverVersion:") &&
    has(persistence, "APPLICABILITY_RESOLVER_VERSION")
);

record(
  "revision records reason and resolving actor",
  has(persistence, "reason:") &&
    has(persistence, "resolvedById:")
);

record(
  "determination fact basis links each snapshot to the new revision",
  has(persistence, "db.determinationFactBasis.createMany(") &&
    has(persistence, "revisionId:") &&
    has(persistence, "factSnapshotId,")
);

record(
  "empty snapshot sets do not create an empty fact-basis batch",
  has(persistence, "if (snapshotIds.length > 0)")
);

record(
  "persistence rereads the revision and fact-basis records",
  has(persistence, "db.assessmentRequirementApplicabilityRevision.findUnique(") &&
    has(persistence, "factBasis:") &&
    has(persistence, "factSnapshotId: true")
);

record(
  "persistence confirms revision identity, status and authority",
  [
    "confirmation.applicabilityId !==",
    "confirmation.revision !==",
    "confirmation.applicabilityDefinitionId !==",
    "confirmation.status !==",
    "confirmation.resolutionAuthority !==",
    "confirmation.reviewState !==",
    "confirmation.resolverVersion !==",
  ].every((condition) => has(persistence, condition))
);

record(
  "persistence confirms the exact set of linked snapshot IDs",
  has(persistence, "expectedSnapshotIds.length !==") &&
   has(persistence, "confirmedSnapshotIds.length") &&
    has(persistence, "expectedSnapshotIds.some(") &&
    has(persistence, "snapshotId !==") &&
    has(persistence, "confirmedSnapshotIds[index]")
);

record(
  "persistence returns the persisted revision identity and snapshot IDs",
  has(persistence, "applicabilityId:") &&
    has(persistence, "revisionId:") &&
    has(persistence, "factSnapshotIds:")
);

record(
  "persistence does not promote a revision to current authority",
  !has(persistence, "db.currentApplicabilityResolutionAuthority.")
);

/*
 * 7. Rule evaluation and transaction orchestration
 */

record(
  "rule resolution maps all three supported outcomes",
  [
    '"APPLICABLE"',
    '"NOT_APPLICABLE"',
    '"UNDETERMINED"',
  ].every((outcome) => has(statusMapper, outcome))
);

record(
  "UNDETERMINED requires review",
  has(reviewMapper, "ApplicabilityStatus.UNDETERMINED") &&
    has(reviewMapper, "ApplicabilityReviewState.REQUIRED")
);

record(
  "determinate system results do not require review",
  has(reviewMapper, "ApplicabilityReviewState.NOT_REQUIRED")
);

record(
  "public resolver opens a Prisma transaction",
  has(publicResolver, "prisma.$transaction(")
);

record(
  "context validation precedes authoritative fact resolution",
  precedes(
    publicResolver,
    "loadResolutionContext(",
    "resolveAuthoritativeFactInputs("
  )
);

record(
  "fact resolution precedes rule evaluation",
  precedes(
    publicResolver,
    "resolveAuthoritativeFactInputs(",
    "evaluateApplicabilityRule("
  )
);

record(
  "rule evaluation precedes status mapping",
  precedes(
    publicResolver,
    "evaluateApplicabilityRule(",
    "mapRuleResolutionToApplicabilityStatus("
  )
);

record(
  "status mapping precedes persistence",
  precedes(
    publicResolver,
    "mapRuleResolutionToApplicabilityStatus(",
    "persistSystemResolution("
  )
);

record(
  "rule-evaluation exceptions return an explicit failure",
  has(publicResolver, "catch {") &&
    has(publicResolver, '"RULE_EVALUATION_FAILED"')
);

record(
  "resolver uses SERIALIZABLE transaction isolation",
  has(publicResolver, "Prisma.TransactionIsolationLevel.Serializable")
);

record(
  "P2002 and P2034 are mapped to concurrency conflict",
  has(publicResolver, 'error.code === "P2002"') &&
    has(publicResolver, 'error.code === "P2034"') &&
    has(publicResolver, '"CONCURRENCY_CONFLICT"')
);

record(
  "unexpected transaction errors fail closed",
  has(publicResolver, '"PERSISTENCE_ERROR"') &&
    has(publicResolver, "Applicability resolution could not be persisted safely.")
);

/*
 * RESULT
 */

for (const result of results) {
  console.log(
    `${result.passed ? "PASS" : "FAIL"} — ${result.name}`
  );
}

const passed = results.filter((result) => result.passed).length;
const failed = results.length - passed;

console.log(`RESULT — ${passed} PASS / ${failed} FAIL`);

if (failed > 0) {
  process.exitCode = 1;
}