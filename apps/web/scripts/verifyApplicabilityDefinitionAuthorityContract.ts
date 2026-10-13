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

const servicePath = path.resolve(
  process.cwd(),
  "lib/compliance/applicabilityDefinitionAuthorityService.ts"
);

const schemaPath = path.resolve(
  process.cwd(),
  "prisma/schema.applicability-candidate.prisma"
);

const source = fs.readFileSync(servicePath, "utf8");
const schema = fs.readFileSync(schemaPath, "utf8");

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

const normalizedSource = normalize(source);
const normalizedSchema = normalize(schema);

function section(start: string, end?: string): string {
  const startIndex = source.indexOf(start);

  if (startIndex === -1) {
    return "";
  }

  if (!end) {
    return source.slice(startIndex);
  }

  const endIndex = source.indexOf(
    end,
    startIndex + start.length
  );

  return endIndex === -1
    ? source.slice(startIndex)
    : source.slice(startIndex, endIndex);
}

function assertContains(
  name: string,
  haystack: string,
  needle: string
) {
  record(
    name,
    normalize(haystack).includes(normalize(needle))
  );
}

function assertOrdered(
  name: string,
  haystack: string,
  first: string,
  second: string
) {
  const normalizedHaystack = normalize(haystack);
  const firstNeedle = normalize(first);
  const secondNeedle = normalize(second);

  const firstIndex =
    normalizedHaystack.indexOf(firstNeedle);

  const secondIndex =
    normalizedHaystack.indexOf(secondNeedle);

  record(
    name,
    firstIndex !== -1 &&
      secondIndex !== -1 &&
      firstIndex < secondIndex
  );
}

function assertOrderedAfter(
  name: string,
  haystack: string,
  first: string,
  second: string,
  occurrence = 0
) {
  const normalizedHaystack = normalize(haystack);
  const firstNeedle = normalize(first);
  const secondNeedle = normalize(second);

  let cursor = 0;
  let firstIndex = -1;

  for (let i = 0; i <= occurrence; i += 1) {
    firstIndex = normalizedHaystack.indexOf(
      firstNeedle,
      cursor
    );

    if (firstIndex === -1) {
      break;
    }

    cursor = firstIndex + firstNeedle.length;
  }

  const secondIndex = normalizedHaystack.indexOf(
    secondNeedle,
    firstIndex === -1
      ? 0
      : firstIndex + firstNeedle.length
  );

  record(
    name,
    firstIndex !== -1 &&
      secondIndex !== -1 &&
      firstIndex < secondIndex
  );
}

const establish = section(
  "export async function establishInitialApplicabilityDefinitionAuthority",
  "export async function supersedeApplicabilityDefinitionAuthority"
);

const supersede = section(
  "export async function supersedeApplicabilityDefinitionAuthority"
);

const establishPolicy = section(
  "export function canEstablishApplicabilityDefinitionAuthority",
  "export function canSupersedeApplicabilityDefinitionAuthority"
);

const supersedePolicy = section(
  "export function canSupersedeApplicabilityDefinitionAuthority",
  "type DatabaseClient"
);

const contextValidator = section(
  "async function validateApplicabilityDefinitionAuthorityContext",
  "const applicabilityDefinitionAuthoritySelect"
);

const currentReader = section(
  "async function readCurrentApplicabilityDefinitionAuthority",
  "export async function getCurrentApplicabilityDefinitionAuthority"
);

const getter = section(
  "export async function getCurrentApplicabilityDefinitionAuthority",
  "export type EstablishInitialApplicabilityDefinitionAuthorityInput"
);

// ============================================================
// SERVICE / API SURFACE
// ============================================================

assertContains(
  "ESTABLISH public API exported",
  source,
  "export async function establishInitialApplicabilityDefinitionAuthority"
);

assertContains(
  "SUPERSEDE public API exported",
  source,
  "export async function supersedeApplicabilityDefinitionAuthority"
);

assertContains(
  "CURRENT authority getter exported",
  source,
  "export async function getCurrentApplicabilityDefinitionAuthority"
);

assertContains(
  "Transaction-capable database client declared",
  source,
  "type DatabaseClient ="
);

assertContains(
  "Transaction client supported",
  source,
  "Prisma.TransactionClient"
);

assertContains(
  "Global Prisma client supported",
  source,
  "typeof prisma"
);

// ============================================================
// AUTHORITY STATE MODEL
// ============================================================

assertContains(
  "Authority record contains requirement",
  source,
  "requirementId: string;"
);

assertContains(
  "Authority record contains applicability definition",
  source,
  "applicabilityDefinitionId: string;"
);

assertContains(
  "Authority snapshot is definition-based",
  source,
  "ApplicabilityDefinitionAuthoritySnapshot"
);

record(
  "Current authority lookup is requirement-scoped",
  normalize(currentReader).includes(
    "where: { requirementId, }"
  ) ||
    normalize(currentReader).includes(
      "where: { requirementId }"
    )
);

assertContains(
  "Current authority uses unique requirement lookup",
  normalizedSchema,
  "requirementId String @unique"
);

assertContains(
  "Current authority uses unique definition lookup",
  normalizedSchema,
  "applicabilityDefinitionId String @unique"
);

// ============================================================
// POLICY — ESTABLISH
// ============================================================

assertContains(
  "Establish policy exported",
  source,
  "export function canEstablishApplicabilityDefinitionAuthority"
);

assertContains(
  "Establish requires requirement match",
  establishPolicy,
  "candidate.requirementId !== requirementId"
);

assertContains(
  "Establish rejects requirement mismatch explicitly",
  establishPolicy,
  '"APPLICABILITY_DEFINITION_REQUIREMENT_MISMATCH"'
);

assertContains(
  "Establish requires APPROVED definition",
  establishPolicy,
  "candidate.status !== ApplicabilityDefinitionStatus.APPROVED"
);

assertContains(
  "Establish rejects non-approved definition explicitly",
  establishPolicy,
  '"APPLICABILITY_DEFINITION_NOT_APPROVED"'
);

assertContains(
  "Establish blocks existing current authority",
  establishPolicy,
  "current !== null"
);

assertContains(
  "Establish rejects duplicate current authority explicitly",
  establishPolicy,
  '"CURRENT_AUTHORITY_ALREADY_EXISTS"'
);

// ============================================================
// POLICY — SUPERSEDE
// ============================================================

assertContains(
  "Supersede policy exported",
  source,
  "export function canSupersedeApplicabilityDefinitionAuthority"
);

assertContains(
  "Supersede requires requirement match",
  supersedePolicy,
  "candidate.requirementId !== requirementId"
);

assertContains(
  "Supersede rejects requirement mismatch explicitly",
  supersedePolicy,
  '"APPLICABILITY_DEFINITION_REQUIREMENT_MISMATCH"'
);

assertContains(
  "Supersede requires APPROVED definition",
  supersedePolicy,
  "candidate.status !== ApplicabilityDefinitionStatus.APPROVED"
);

assertContains(
  "Supersede rejects non-approved definition explicitly",
  supersedePolicy,
  '"APPLICABILITY_DEFINITION_NOT_APPROVED"'
);

assertContains(
  "Supersede requires existing current authority",
  supersedePolicy,
  "current === null"
);

assertContains(
  "Supersede rejects missing current authority explicitly",
  supersedePolicy,
  '"CURRENT_AUTHORITY_NOT_FOUND"'
);

assertContains(
  "Supersede blocks same definition",
  supersedePolicy,
  "current.applicabilityDefinitionId === candidate.id"
);

assertContains(
  "Supersede rejects same definition explicitly",
  supersedePolicy,
  '"SAME_DEFINITION_ALREADY_AUTHORITATIVE"'
);

// ============================================================
// CONTEXT VALIDATION
// ============================================================

assertContains(
  "Authority context validator exists",
  source,
  "async function validateApplicabilityDefinitionAuthorityContext"
);

assertContains(
  "Authority context accepts organization",
  contextValidator,
  "organizationId: string"
);

assertContains(
  "Authority context accepts requirement",
  contextValidator,
  "requirementId: string"
);

assertContains(
  "Authority context accepts candidate definition",
  contextValidator,
  "applicabilityDefinitionId: string"
);

assertContains(
  "Authority context accepts actor",
  contextValidator,
  "actorUserId: string"
);

assertContains(
  "Active organization membership is required",
  contextValidator,
  "organizationMember.findUnique"
);

assertContains(
  "Membership is scoped to actor",
  contextValidator,
  "userId_organizationId"
);

assertContains(
  "Membership must be active",
  contextValidator,
  "active: true"
);

assertContains(
  "Inactive/missing membership fails explicitly",
  contextValidator,
  '"USER_NOT_ACTIVE_ORGANIZATION_MEMBER"'
);

assertContains(
  "Requirement is resolved explicitly",
  contextValidator,
  "complianceRequirement.findUnique"
);

assertContains(
  "Missing requirement fails explicitly",
  contextValidator,
  '"REQUIREMENT_NOT_FOUND"'
);

assertContains(
  "Applicability definition is resolved explicitly",
  contextValidator,
  "applicabilityDefinition.findUnique"
);

assertContains(
  "Missing definition fails explicitly",
  contextValidator,
  '"APPLICABILITY_DEFINITION_NOT_FOUND"'
);

assertContains(
  "Candidate requirement identity is retained",
  contextValidator,
  "requirementId: true"
);

assertContains(
  "Candidate status is retained",
  contextValidator,
  "status: true"
);

// ============================================================
// CURRENT AUTHORITY READ
// ============================================================

assertContains(
  "Dedicated current authority reader exists",
  source,
  "async function readCurrentApplicabilityDefinitionAuthority"
);

assertContains(
  "Current reader accepts database client",
  currentReader,
  "db: DatabaseClient"
);

assertContains(
  "Current reader accepts requirement id",
  currentReader,
  "requirementId: string"
);

assertContains(
  "Current reader reads current authority model",
  currentReader,
  "db.currentApplicabilityDefinitionAuthority.findUnique"
);

assertContains(
  "Public getter reads current authority",
  getter,
  "readCurrentApplicabilityDefinitionAuthority"
);

assertContains(
  "Missing current authority has explicit failure",
  getter,
  '"CURRENT_AUTHORITY_NOT_FOUND"'
);

// ============================================================
// ESTABLISH TRANSACTION
// ============================================================

assertContains(
  "Establish owns Prisma transaction",
  establish,
  "prisma.$transaction"
);

assertContains(
  "Establish receives Prisma transaction client",
  establish,
  "transaction: Prisma.TransactionClient"
);

record(
  "Establish passes transaction client into context validation",
  normalize(establish).includes(
    "validateApplicabilityDefinitionAuthorityContext("
  ) &&
    normalize(establish).includes(
      "transaction, input"
    )
);

record(
  "Establish reads current authority inside transaction",
  normalize(establish).includes(
    "readCurrentApplicabilityDefinitionAuthority("
  ) &&
    normalize(establish).includes(
      "transaction, input.requirementId"
    )
);

assertContains(
  "Establish uses SERIALIZABLE isolation",
  establish,
  "Prisma.TransactionIsolationLevel.Serializable"
);

assertOrdered(
  "Establish validates context before reading current authority",
  establish,
  "validateApplicabilityDefinitionAuthorityContext",
  "readCurrentApplicabilityDefinitionAuthority"
);

assertOrdered(
  "Establish reads current authority before policy",
  establish,
  "readCurrentApplicabilityDefinitionAuthority",
  "canEstablishApplicabilityDefinitionAuthority"
);

assertOrdered(
  "Establish policy precedes authority mutation",
  establish,
  "canEstablishApplicabilityDefinitionAuthority",
  "currentApplicabilityDefinitionAuthority.create"
);

assertContains(
  "Establish creates current authority",
  establish,
  "currentApplicabilityDefinitionAuthority.create"
);

assertContains(
  "Establish persists requirement identity",
  establish,
  "requirementId: input.requirementId"
);

assertContains(
  "Establish persists candidate definition identity",
  establish,
  "applicabilityDefinitionId: input.applicabilityDefinitionId"
);

assertContains(
  "Establish persists actor",
  establish,
  "establishedById: input.actorUserId"
);

assertContains(
  "Establish persists reason",
  establish,
  "reason: input.reason ?? null"
);

assertContains(
  "Establish creates immutable transition",
  establish,
  "applicabilityDefinitionAuthorityTransition.create"
);

assertContains(
  "Initial transition has no previous authority",
  establish,
  "previousApplicabilityDefinitionId: null"
);

assertContains(
  "Initial transition records new authority",
  establish,
  "newApplicabilityDefinitionId: input.applicabilityDefinitionId"
);

assertContains(
  "Initial transition records actor",
  establish,
  "establishedById: input.actorUserId"
);

assertContains(
  "Initial transition records reason",
  establish,
  "reason: input.reason ?? null"
);

assertOrdered(
  "Initial transition follows authority creation",
  establish,
  "currentApplicabilityDefinitionAuthority.create",
  "applicabilityDefinitionAuthorityTransition.create"
);

assertOrderedAfter(
  "Initial confirmation follows transition",
  establish,
  "applicabilityDefinitionAuthorityTransition.create",
  "readCurrentApplicabilityDefinitionAuthority"
);

assertContains(
  "Initial authority is post-write confirmed",
  establish,
  "confirmed.id !== authority.id"
);

assertContains(
  "Initial authority confirms candidate definition",
  establish,
  "confirmed.applicabilityDefinitionId !== input.applicabilityDefinitionId"
);

assertContains(
  "Initial authority confirmation fails closed",
  establish,
  '"AUTHORITY_TRANSACTION_FAILED"'
);

// ============================================================
// SUPERSEDE TRANSACTION
// ============================================================

assertContains(
  "Supersede owns Prisma transaction",
  supersede,
  "prisma.$transaction"
);

assertContains(
  "Supersede receives Prisma transaction client",
  supersede,
  "transaction: Prisma.TransactionClient"
);

record(
  "Supersede passes transaction client into context validation",
  normalize(supersede).includes(
    "validateApplicabilityDefinitionAuthorityContext("
  ) &&
    normalize(supersede).includes(
      "transaction, input"
    )
);

record(
  "Supersede reads current authority inside transaction",
  normalize(supersede).includes(
    "readCurrentApplicabilityDefinitionAuthority("
  ) &&
    normalize(supersede).includes(
      "transaction, input.requirementId"
    )
);

assertContains(
  "Supersede uses SERIALIZABLE isolation",
  supersede,
  "Prisma.TransactionIsolationLevel.Serializable"
);

assertContains(
  "Supersede creates explicit authority snapshot",
  supersede,
  "const snapshot: ApplicabilityDefinitionAuthoritySnapshot"
);

assertContains(
  "Supersede snapshot captures current definition",
  supersede,
  "applicabilityDefinitionId: current.applicabilityDefinitionId"
);

assertOrdered(
  "Supersede validates context before current lookup",
  supersede,
  "validateApplicabilityDefinitionAuthorityContext",
  "readCurrentApplicabilityDefinitionAuthority"
);

assertOrdered(
  "Supersede reads current before policy",
  supersede,
  "readCurrentApplicabilityDefinitionAuthority",
  "canSupersedeApplicabilityDefinitionAuthority"
);

assertOrdered(
  "Supersede policy precedes authority update",
  supersede,
  "canSupersedeApplicabilityDefinitionAuthority",
  "currentApplicabilityDefinitionAuthority.updateMany"
);

assertContains(
  "Supersede requires current authority before mutation",
  supersede,
  "if (!current)"
);

assertContains(
  "Supersede updates current authority",
  supersede,
  "currentApplicabilityDefinitionAuthority.updateMany"
);

assertContains(
  "Supersede guards update by requirement",
  supersede,
  "requirementId: input.requirementId"
);

assertContains(
  "Supersede guards update by exact previous definition",
  supersede,
  "applicabilityDefinitionId: current.applicabilityDefinitionId"
);

assertContains(
  "Supersede assigns candidate definition",
  supersede,
  "applicabilityDefinitionId: input.applicabilityDefinitionId"
);

assertContains(
  "Supersede updates establishment time",
  supersede,
  "establishedAt: new Date()"
);

assertContains(
  "Supersede updates establishing actor",
  supersede,
  "establishedById: input.actorUserId"
);

assertContains(
  "Supersede updates reason",
  supersede,
  "reason: input.reason ?? null"
);

assertContains(
  "Supersede requires exactly one guarded row",
  supersede,
  "update.count !== 1"
);

assertContains(
  "Concurrent current-authority change fails explicitly",
  supersede,
  '"CURRENT_AUTHORITY_CHANGED"'
);

assertContains(
  "Supersede creates immutable transition",
  supersede,
  "applicabilityDefinitionAuthorityTransition.create"
);

assertContains(
  "Supersede transition records previous definition",
  supersede,
  "previousApplicabilityDefinitionId: current.applicabilityDefinitionId"
);

assertContains(
  "Supersede transition records new definition",
  supersede,
  "newApplicabilityDefinitionId: input.applicabilityDefinitionId"
);

assertOrdered(
  "Supersede transition follows guarded authority update",
  supersede,
  "currentApplicabilityDefinitionAuthority.updateMany",
  "applicabilityDefinitionAuthorityTransition.create"
);

assertOrderedAfter(
  "Supersede confirmation follows transition",
  supersede,
  "applicabilityDefinitionAuthorityTransition.create",
  "readCurrentApplicabilityDefinitionAuthority"
);

assertContains(
  "Supersede confirms candidate is current",
  supersede,
  "confirmed.applicabilityDefinitionId !== input.applicabilityDefinitionId"
);

assertContains(
  "Supersede confirmation fails closed",
  supersede,
  '"AUTHORITY_TRANSACTION_FAILED"'
);

// ============================================================
// CONCURRENCY / FAILURE HANDLING
// ============================================================

assertContains(
  "Establish maps P2034 to concurrency conflict",
  establish,
  'error.code === "P2034"'
);

assertContains(
  "Establish maps P2002 to concurrency conflict",
  establish,
  'error.code === "P2002"'
);

assertContains(
  "Establish exposes concurrency failure reason",
  establish,
  '"CONCURRENT_AUTHORITY_CONFLICT"'
);

assertContains(
  "Establish generic failure is fail-closed",
  establish,
  '"AUTHORITY_TRANSACTION_FAILED"'
);

assertContains(
  "Supersede maps P2034 to concurrency conflict",
  supersede,
  'error.code === "P2034"'
);

assertContains(
  "Supersede maps P2002 to concurrency conflict",
  supersede,
  'error.code === "P2002"'
);

assertContains(
  "Supersede exposes concurrency failure reason",
  supersede,
  '"CONCURRENT_AUTHORITY_CONFLICT"'
);

assertContains(
  "Supersede generic failure is fail-closed",
  supersede,
  '"AUTHORITY_TRANSACTION_FAILED"'
);

// ============================================================
// ARCHITECTURAL BOUNDARIES
// ============================================================

record(
  "Authority service does not mutate applicability definitions",
  !normalizedSource.includes(
    "applicabilityDefinition.create"
  ) &&
    !normalizedSource.includes(
      "applicabilityDefinition.update"
    ) &&
    !normalizedSource.includes(
      "applicabilityDefinition.updateMany"
    ) &&
    !normalizedSource.includes(
      "applicabilityDefinition.delete"
    ) &&
    !normalizedSource.includes(
      "applicabilityDefinition.deleteMany"
    )
);

record(
  "Authority service does not establish authority during approval",
  !normalizedSource.includes(
    "CurrentApplicabilityDefinitionAuthority.create"
  )
);

record(
  "Authority service does not create applicability resolutions",
  !normalizedSource.includes(
    "applicabilityResolution.create"
  ) &&
    !normalizedSource.includes(
      "applicabilityResolution.update"
    ) &&
    !normalizedSource.includes(
      "applicabilityResolution.updateMany"
    )
);

record(
  "Authority service does not mutate regulatory fact values",
  !normalizedSource.includes(
    "regulatoryFactValue.create"
  ) &&
    !normalizedSource.includes(
      "regulatoryFactValue.update"
    ) &&
    !normalizedSource.includes(
      "regulatoryFactValue.updateMany"
    )
);

record(
  "Authority service does not use raw SQL",
  !normalizedSource.includes("$queryRaw") &&
    !normalizedSource.includes("$executeRaw")
);

record(
  "Authority transition history is append-only",
  !normalizedSource.includes(
    "applicabilityDefinitionAuthorityTransition.update"
  ) &&
    !normalizedSource.includes(
      "applicabilityDefinitionAuthorityTransition.updateMany"
    ) &&
    !normalizedSource.includes(
      "applicabilityDefinitionAuthorityTransition.delete"
    ) &&
    !normalizedSource.includes(
      "applicabilityDefinitionAuthorityTransition.deleteMany"
    )
);

record(
  "No withdrawal operation is invented in V1 authority service",
  !normalizedSource.includes(
    "withdrawApplicabilityDefinitionAuthority"
  )
);

record(
  "No latest-definition inference is used for current authority",
  !normalizedSource.includes(
    'orderBy: { version: "desc" }'
  )
);

assertContains(
  "Current authority has one row per requirement",
  schema,
  "requirementId             String   @unique"
);

assertContains(
  "Current authority points to exactly one definition",
  schema,
  "applicabilityDefinitionId String   @unique"
);

assertContains(
  "Transition stores previous authority",
  schema,
  "previousApplicabilityDefinitionId String?"
);

assertContains(
  "Transition stores required new authority",
  schema,
  "newApplicabilityDefinitionId      String"
);

assertContains(
  "Transition stores actor",
  schema,
  "establishedById                   String?"
);

assertContains(
  "Transition stores reason",
  schema,
  "reason                            String?"
);

assertContains(
  "Transition has transition timestamp",
  schema,
  "transitionedAt                    DateTime"
);

assertContains(
  "Transition model exists",
  schema,
  "model ApplicabilityDefinitionAuthorityTransition"
);

// ============================================================
// OUTPUT
// ============================================================

let passCount = 0;
let failCount = 0;

for (const result of results) {
  if (result.passed) {
    passCount += 1;
    console.log(`PASS — ${result.name}`);
  } else {
    failCount += 1;
    console.log(`FAIL — ${result.name}`);
  }
}

console.log("");
console.log(
  `RESULT — ${passCount} PASS / ${failCount} FAIL`
);

if (failCount > 0) {
  process.exitCode = 1;
}