import fs from "node:fs";
import path from "node:path";

type TestResult = {
  name: string;
  passed: boolean;
};

const results: TestResult[] = [];

function record(name: string, passed: boolean) {
  results.push({ name, passed });
}

const sourcePath = path.resolve(
  process.cwd(),
  "lib/compliance/assessmentLifecycleService.ts"
);

const source = fs.readFileSync(sourcePath, "utf8");

const compact = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .replace(/\s*([{}(),:;.])\s*/g, "$1")
    .trim();

const normalized = compact(source);

function sectionBetween(startMarker: string, endMarker?: string) {
  const start = source.indexOf(startMarker);

  if (start < 0) {
    return "";
  }

  const end = endMarker
    ? source.indexOf(endMarker, start + startMarker.length)
    : -1;

  return end > start
    ? source.slice(start, end)
    : source.slice(start);
}

const completionSection = sectionBetween(
  "async function assertAssessmentCompletionIntegrity",
  "export async function transitionAssessmentStatus"
);

const transitionSection = sectionBetween(
  "export async function transitionAssessmentStatus"
);

const completion = compact(completionSection);
const transition = compact(transitionSection);

/*
 * ---------------------------------------------------------------------------
 * COMPLETION INTEGRITY FUNCTION
 * ---------------------------------------------------------------------------
 */

record(
  "Completion integrity function exists",
  completionSection.length > 0
);

record(
  "Completion integrity receives Prisma transaction client",
  /transaction\s*:\s*Prisma\.TransactionClient/.test(
    completionSection
  )
);

record(
  "Completion integrity receives assessment identity",
  /assessment\s*:\s*\{[\s\S]*?\bid\s*:\s*string/.test(
    completionSection
  )
);

record(
  "Completion integrity receives organization identity",
  /assessment\s*:\s*\{[\s\S]*?\borganizationId\s*:\s*string/.test(
    completionSection
  )
);

record(
  "Completion integrity receives framework identity",
  /assessment\s*:\s*\{[\s\S]*?\bframeworkId\s*:\s*string/.test(
    completionSection
  )
);

/*
 * ---------------------------------------------------------------------------
 * FRAMEWORK REQUIREMENTS
 * ---------------------------------------------------------------------------
 */

record(
  "Active framework requirements are resolved",
  /transaction\.complianceRequirement\.findMany\s*\(/.test(
    completionSection
  )
);

record(
  "Requirements are scoped to assessment framework",
  /where\s*:\s*\{[\s\S]*?frameworkId\s*:\s*assessment\.frameworkId/.test(
    completionSection
  )
);

record(
  "Only active requirements are included",
  /active\s*:\s*true/.test(completionSection)
);

/*
 * ---------------------------------------------------------------------------
 * CURRENT APPLICABILITY DEFINITION AUTHORITY
 * ---------------------------------------------------------------------------
 */

record(
  "Current Applicability Definition Authority is loaded",
  /currentApplicabilityAuthority\s*:/.test(
    completionSection
  )
);

record(
  "Current authority includes requirement identity",
  /currentApplicabilityAuthority[\s\S]*?requirementId\s*:\s*true/.test(
    completionSection
  )
);

record(
  "Current authority includes definition identity",
  /currentApplicabilityAuthority[\s\S]*?applicabilityDefinitionId\s*:\s*true/.test(
    completionSection
  )
);

record(
  "Authoritative definition is loaded",
  /currentApplicabilityAuthority[\s\S]*?applicabilityDefinition\s*:/.test(
    completionSection
  )
);

record(
  "Authoritative definition status is loaded",
  /applicabilityDefinition[\s\S]*?status\s*:\s*true/.test(
    completionSection
  )
);

record(
  "Authoritative resolution pattern is loaded",
  /applicabilityDefinition[\s\S]*?resolutionPattern\s*:\s*true/.test(
    completionSection
  )
);

record(
  "Missing current definition authority blocks completion",
  /ASSESSMENT_COMPLETION_DEFINITION_AUTHORITY_MISSING/.test(
    completionSection
  )
);

record(
  "Definition authority integrity failure exists",
  /ASSESSMENT_COMPLETION_DEFINITION_AUTHORITY_INTEGRITY_VIOLATION/.test(
    completionSection
  )
);

record(
  "Definition authority requirement identity is checked",
  /definitionAuthority[\s\S]*?requirementId[\s\S]*?requirement\.id/.test(
    completionSection
  )
);

record(
  "Definition authority definition identity is checked",
  /definitionAuthority[\s\S]*?applicabilityDefinition[\s\S]*?\.id[\s\S]*?!==[\s\S]*?applicabilityDefinitionId/.test(
    completionSection
  )
);

record(
  "Definition authority definition requirement identity is checked",
  /definitionAuthority[\s\S]*?applicabilityDefinition[\s\S]*?requirementId[\s\S]*?!==[\s\S]*?requirement\.id/.test(
    completionSection
  )
);

record(
  "Authoritative definition must be APPROVED",
  /applicabilityDefinition[\s\S]*?status[\s\S]*?!==[\s\S]*?ApplicabilityDefinitionStatus\.APPROVED/.test(
    completionSection
  )
);

record(
  "Definition authority map is constructed",
  /new\s+Map[\s\S]*?<\s*string\s*,\s*string\s*>[\s\S]*?\(\s*\)/.test(
    completionSection
  )
);

record(
  "Authoritative definition identity is stored by requirement",
  /authoritativeDefinitionByRequirement\.set\s*\(\s*requirement\.id[\s\S]*?definitionAuthority\.applicabilityDefinitionId/.test(
    completionSection
  )
);

/*
 * ---------------------------------------------------------------------------
 * ASSESSMENT APPLICABILITY
 * ---------------------------------------------------------------------------
 */

record(
  "Persisted assessment applicability is resolved",
  /transaction\.assessmentRequirementApplicability\.findMany\s*\(/.test(
    completionSection
  )
);

record(
  "Applicability is scoped to assessment",
  /transaction\.assessmentRequirementApplicability\.findMany\s*\([\s\S]*?where\s*:\s*\{[\s\S]*?assessmentId\s*:\s*assessment\.id/.test(
    completionSection
  )
);

record(
  "Applicability requirement identity is loaded",
  /assessmentId\s*:\s*true[\s\S]*?requirementId\s*:\s*true/.test(
    completionSection
  )
);

record(
  "Applicability context identity is loaded",
  /assessmentId\s*:\s*true[\s\S]*?contextId\s*:\s*true/.test(
    completionSection
  )
);

record(
  "Applicability is indexed by requirement",
  /new\s+Map[\s\S]*?typeof\s+applicability[\s\S]*?\(\s*\)/.test(
    completionSection
  ) &&
    /applicabilityByRequirement\.get/.test(
      completionSection
    ) &&
    /applicabilityByRequirement\.set/.test(
      completionSection
    )
);

record(
  "Missing applicability determination blocks completion",
  /ASSESSMENT_COMPLETION_SCOPE_INCOMPLETE/.test(
    completionSection
  )
);

record(
  "Missing applicability rows are not treated as implicit determination",
  /requirementApplicability\.length\s*===\s*0/.test(
    completionSection
  )
);

/*
 * ---------------------------------------------------------------------------
 * GENERAL UNCONDITIONAL / CANONICAL ORGANIZATION CONTEXT
 * ---------------------------------------------------------------------------
 */

record(
  "GENERAL_UNCONDITIONAL pattern is explicitly recognized",
  /ApplicabilityResolutionPattern\s*\.\s*GENERAL_UNCONDITIONAL/.test(
    completionSection
  )
);

record(
  "Canonical organization context is required",
  /ApplicabilityContextType\s*\.\s*ORGANIZATION/.test(
    completionSection
  )
);

record(
  "Canonical organization stable key is required",
  /stableContextKey\s*===\s*"ORGANIZATION"/.test(
    completionSection
  )
);

record(
  "Canonical organization context is tenant-scoped",
  /context\.organizationId\s*===\s*assessment\.organizationId/.test(
    completionSection
  )
);

record(
  "Canonical organization context is framework-scoped",
  /context\.frameworkId\s*===\s*assessment\.frameworkId/.test(
    completionSection
  )
);

/*
 * ---------------------------------------------------------------------------
 * APPLICABILITY DOMAIN BOUNDARIES
 * ---------------------------------------------------------------------------
 */

record(
  "Every applicability identity is checked against assessment",
  /item\.assessmentId\s*!==\s*assessment\.id/.test(
    completionSection
  )
);

record(
  "Requirement framework boundary is checked",
  /item\.requirement\.frameworkId\s*!==\s*assessment\.frameworkId/.test(
    completionSection
  )
);

record(
  "Context organization boundary is checked",
  /item\.context\.organizationId\s*!==\s*assessment\.organizationId/.test(
    completionSection
  )
);

record(
  "Context framework boundary is checked",
  /item\.context\.frameworkId\s*!==\s*assessment\.frameworkId/.test(
    completionSection
  )
);

record(
  "Cross-domain applicability fails closed",
  /ASSESSMENT_COMPLETION_AUTHORITY_INTEGRITY_VIOLATION/.test(
    completionSection
  ) &&
    /item\.requirement\.frameworkId/.test(
      completionSection
    ) &&
    /item\.context\.organizationId/.test(
      completionSection
    )
);

/*
 * ---------------------------------------------------------------------------
 * CURRENT APPLICABILITY RESOLUTION AUTHORITY
 * ---------------------------------------------------------------------------
 */

record(
  "Current applicability resolution authority is required",
  /const authority\s*=\s*item\.currentAuthority/.test(
    completionSection
  )
);

record(
  "Missing resolution authority blocks completion",
  /ASSESSMENT_COMPLETION_AUTHORITY_MISSING/.test(
    completionSection
  )
);

record(
  "Resolution authority applicability identity is checked",
  /authority\.applicabilityId\s*!==\s*item\.id/.test(
    completionSection
  )
);

record(
  "Resolution authority revision identity is checked",
  /authority\.revisionId\s*!==\s*authority\.revision\.id/.test(
    completionSection
  )
);

record(
  "Resolution revision applicability identity is checked",
  /authority\.revision\.applicabilityId\s*!==\s*item\.id/.test(
    completionSection
  )
);

/*
 * ---------------------------------------------------------------------------
 * RESOLUTION → DEFINITION AUTHORITY BINDING
 * ---------------------------------------------------------------------------
 */

record(
  "Applicability resolution definition identity is checked",
  /authority[\s\S]*?revision[\s\S]*?applicabilityDefinitionId/.test(
    completionSection
  )
);

record(
  "Current authoritative definition is resolved by requirement",
  /authoritativeDefinitionByRequirement\.get\s*\(\s*item\.requirementId\s*\)/.test(
    completionSection
  )
);

record(
  "Resolution must use current authoritative definition",
  /authority[\s\S]*?revision[\s\S]*?applicabilityDefinitionId[\s\S]*?!==[\s\S]*?authoritativeDefinitionId/.test(
    completionSection
  )
);

record(
  "Stale applicability resolution blocks completion",
  /ASSESSMENT_COMPLETION_RESOLUTION_STALE/.test(
    completionSection
  )
);

/*
 * ---------------------------------------------------------------------------
 * APPLICABILITY STATUS
 * ---------------------------------------------------------------------------
 */

record(
  "APPLICABLE status is permitted",
  /ApplicabilityStatus\.APPLICABLE/.test(
    completionSection
  )
);

record(
  "NOT_APPLICABLE status is permitted",
  /ApplicabilityStatus\.NOT_APPLICABLE/.test(
    completionSection
  )
);

record(
  "UNDETERMINED status is permitted",
  /ApplicabilityStatus\.UNDETERMINED/.test(
    completionSection
  )
);

record(
  "Unsupported applicability status fails closed",
  /ApplicabilityStatus\.APPLICABLE[\s\S]*?ApplicabilityStatus\.NOT_APPLICABLE[\s\S]*?ApplicabilityStatus\.UNDETERMINED[\s\S]*?ASSESSMENT_COMPLETION_AUTHORITY_INTEGRITY_VIOLATION/.test(
    completionSection
  )
);

/*
 * ---------------------------------------------------------------------------
 * REGULATORY REVIEW
 * ---------------------------------------------------------------------------
 */

record(
  "Applicability review state is loaded",
  /reviewState\s*:\s*true/.test(
    completionSection
  )
);

record(
  "REVIEW_REQUIRED state is explicitly recognized",
  /ApplicabilityReviewState\s*\.\s*REQUIRED/.test(
    completionSection
  )
);

record(
  "Required regulatory review blocks completion",
  /ASSESSMENT_COMPLETION_REVIEW_REQUIRED/.test(
    completionSection
  )
);

/*
 * ---------------------------------------------------------------------------
 * LIFECYCLE TRANSITION GATE
 * ---------------------------------------------------------------------------
 */

record(
  "Completion gate exists inside lifecycle transition",
  /await\s+assertAssessmentCompletionIntegrity\s*\(/.test(
    transitionSection
  )
);

record(
  "Completion gate is limited to REVIEW status",
  /assessment\.status\s*===\s*AssessmentStatus\.REVIEW/.test(
    transitionSection
  )
);

record(
  "Completion gate is limited to COMPLETED target",
  /nextStatus\s*===\s*AssessmentStatus\.COMPLETED/.test(
    transitionSection
  )
);

const gatePosition = transitionSection.indexOf(
  "await assertAssessmentCompletionIntegrity"
);

const mutationPosition = transitionSection.indexOf(
  "transaction.assessment.updateMany"
);

record(
  "Completion integrity executes before assessment mutation",
  gatePosition >= 0 &&
    mutationPosition >= 0 &&
    gatePosition < mutationPosition
);

/*
 * ---------------------------------------------------------------------------
 * OPTIMISTIC CONCURRENCY / MUTATION
 * ---------------------------------------------------------------------------
 */

record(
  "Assessment mutation is tenant-scoped",
  /organizationId/.test(transitionSection)
);

record(
  "Assessment mutation is status-guarded",
  /status\s*:\s*assessment\.status/.test(
    transitionSection
  )
);

record(
  "Exactly one lifecycle row must be updated",
  /update\.count\s*!==\s*1/.test(transitionSection)
);

record(
  "Concurrent lifecycle mutation has explicit failure",
  /ASSESSMENT_STATUS_CHANGED/.test(
    transitionSection
  )
);

record(
  "Updated assessment is re-read",
  /transaction\.assessment\.findFirst\s*\(/.test(
    transitionSection
  )
);

record(
  "Confirmation requires target status",
  /status\s*:\s*nextStatus/.test(
    transitionSection
  )
);

record(
  "Missing post-write confirmation fails closed",
  /if\s*\(\s*!updated\s*\)/.test(
    transitionSection
  ) &&
    /ASSESSMENT_STATUS_CHANGED/.test(
      transitionSection
    )
);

const updatePosition = transitionSection.indexOf(
  "transaction.assessment.updateMany"
);

const rereadPosition = transitionSection.indexOf(
  "transaction.assessment.findFirst"
);

record(
  "Post-write confirmation occurs after mutation",
  updatePosition >= 0 &&
    rereadPosition >= 0 &&
    updatePosition < rereadPosition
);

/*
 * ---------------------------------------------------------------------------
 * TRANSACTION / ISOLATION
 * ---------------------------------------------------------------------------
 */

record(
  "Assessment transition owns Prisma transaction",
  /prisma\.\$transaction\s*<AssessmentLifecycleResult>\s*\(/.test(
    transitionSection
  ) ||
    /prisma\.\$transaction\s*\(/.test(
      transitionSection
    )
);

record(
  "Assessment transition uses SERIALIZABLE isolation",
  /Prisma\.TransactionIsolationLevel\.Serializable/.test(
    transitionSection
  )
);

/*
 * ---------------------------------------------------------------------------
 * ERROR HANDLING
 * ---------------------------------------------------------------------------
 */

record(
  "Completion invariant failures are caught",
  /error\s+instanceof\s+AssessmentCompletionInvariantError/.test(
    transitionSection
  )
);

record(
  "Generic completion transaction failures fail closed",
  /ASSESSMENT_COMPLETION_TRANSACTION_FAILED/.test(
    transitionSection
  )
);

record(
  "P2034 concurrency conflict is handled",
  /error\.code\s*===\s*"P2034"/.test(
    transitionSection
  )
);

record(
  "P2002 concurrency conflict is handled",
  /error\.code\s*===\s*"P2002"/.test(
    transitionSection
  )
);

/*
 * ---------------------------------------------------------------------------
 * DOMAIN SEPARATION
 * ---------------------------------------------------------------------------
 */

/*
 * IMPORTANT:
 * score: true in a SELECT is a read projection, not a mutation.
 * Therefore inspect only actual assessment update mutation blocks.
 */

const assessmentMutationBlocks = [
  ...transitionSection.matchAll(
    /transaction\.assessment\.update(?:Many)?\s*\([\s\S]{0,1200}?\)/g
  ),
].map((match) => match[0]);

record(
  "Lifecycle service does not update Assessment score during completion",
  assessmentMutationBlocks.length > 0 &&
    assessmentMutationBlocks.every(
      (block) => !/\bscore\s*:/.test(block)
    )
);

record(
  "Lifecycle transition does not mutate Organization compliance score",
  !/transaction\.organization\.update(?:Many)?/.test(
    transitionSection
  )
);

record(
  "Lifecycle transition does not mutate Evidence",
  !/transaction\.evidence\.(?:create|update|updateMany|delete|deleteMany)/.test(
    transitionSection
  )
);

record(
  "Lifecycle transition does not mutate Workflow progress",
  !/transaction\.workflow\.update(?:Many)?/.test(
    transitionSection
  )
);

record(
  "Lifecycle completion does not establish Applicability Definition Authority",
  !/transaction\.currentApplicabilityDefinitionAuthority\.(?:create|update|updateMany)/.test(
    transitionSection
  )
);

/*
 * ---------------------------------------------------------------------------
 * OUTPUT
 * ---------------------------------------------------------------------------
 */

let passCount = 0;
let failCount = 0;

for (const result of results) {
  if (result.passed) {
    passCount++;
    console.log(`PASS — ${result.name}`);
  } else {
    failCount++;
    console.log(`FAIL — ${result.name}`);
  }
}

console.log("");
console.log(`RESULT — ${passCount} PASS / ${failCount} FAIL`);

if (failCount > 0) {
  process.exitCode = 1;
}