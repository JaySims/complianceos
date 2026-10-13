
import fs from "node:fs";
import path from "node:path";

type TestResult = {
  name: string;
  passed: boolean;
};

const results: TestResult[] = [];

const record = (name: string, passed: boolean) =>
  results.push({ name, passed });

const creationSourcePath = path.resolve(
  process.cwd(),
  "lib/compliance/applicabilityDefinitionService.ts"
);

const approvalSourcePath = path.resolve(
  process.cwd(),
  "lib/compliance/applicabilityDefinitionApprovalService.ts"
);

const creationSource = fs.readFileSync(
  creationSourcePath,
  "utf8"
);

const approvalSource = fs.readFileSync(
  approvalSourcePath,
  "utf8"
);

const creationPublicStart = creationSource.indexOf(
  "export async function createApplicabilityDefinition("
);

const approvalPublicStart = approvalSource.indexOf(
  "export async function approveApplicabilityDefinition("
);

const creationTransactionStart = creationSource.indexOf(
  "export async function createApplicabilityDefinitionInTransaction("
);

const approvalTransactionStart = approvalSource.indexOf(
  "export async function approveApplicabilityDefinitionInTransaction("
);

const creationPublicFunction =
  creationPublicStart >= 0
    ? creationSource.slice(creationPublicStart)
    : "";

const approvalPublicFunction =
  approvalPublicStart >= 0
    ? approvalSource.slice(approvalPublicStart)
    : "";

const creationTransactionFunction =
  creationTransactionStart >= 0 &&
  creationPublicStart > creationTransactionStart
    ? creationSource.slice(
        creationTransactionStart,
        creationPublicStart
      )
    : "";

const approvalTransactionFunction =
  approvalTransactionStart >= 0 &&
  approvalPublicStart > approvalTransactionStart
    ? approvalSource.slice(
        approvalTransactionStart,
        approvalPublicStart
      )
    : "";

const creationPrepareStart = creationSource.indexOf(
  "async function prepareApplicabilityDefinitionCreation("
);

const creationPersistStart = creationSource.indexOf(
  "async function persistApplicabilityDefinitionDraft("
);

const creationPrepareFunction =
  creationPrepareStart >= 0 &&
  creationPersistStart > creationPrepareStart
    ? creationSource.slice(
        creationPrepareStart,
        creationPersistStart
      )
    : "";

const creationPersistFunction =
  creationPersistStart >= 0 &&
  creationPublicStart > creationPersistStart
    ? creationSource.slice(
        creationPersistStart,
        creationPublicStart
      )
    : "";

const approvalContextStart = approvalSource.indexOf(
  "async function validateApplicabilityDefinitionApprovalContext("
);

const approvalRuleValidationStart = approvalSource.indexOf(
  "async function validateStoredApplicabilityDefinitionRuleForApproval("
);

const approvalPersistStart = approvalSource.indexOf(
  "async function persistApplicabilityDefinitionApproval("
);

const approvalContextFunction =
  approvalContextStart >= 0 &&
  approvalRuleValidationStart > approvalContextStart
    ? approvalSource.slice(
        approvalContextStart,
        approvalRuleValidationStart
      )
    : "";

const approvalRuleValidationFunction =
  approvalRuleValidationStart >= 0 &&
  approvalPersistStart > approvalRuleValidationStart
    ? approvalSource.slice(
        approvalRuleValidationStart,
        approvalPersistStart
      )
    : "";

const approvalPersistFunction =
  approvalPersistStart >= 0 &&
  approvalPublicStart > approvalPersistStart
    ? approvalSource.slice(
        approvalPersistStart,
        approvalPublicStart
      )
    : "";

/*
 * ============================================================
 * CREATION CONTRACT
 * ============================================================
 */

record(
  "public applicability-definition creation API remains exported",
  creationPublicStart >= 0
);

record(
  "creation service defines a transaction-capable database client",
  creationSource.includes("Prisma.TransactionClient") &&
    creationSource.includes("typeof prisma")
);

record(
  "creation validates effective date range before persistence",
  creationPublicFunction.includes(
    "validateApplicabilityDefinitionEffectiveRange("
  )
);

record(
  "creation opens a Prisma transaction",
  creationPublicFunction.includes("prisma.$transaction")
);

record(
  "creation transaction uses SERIALIZABLE isolation",
  creationPublicFunction.includes(
    "Prisma.TransactionIsolationLevel.Serializable"
  )
);

record(
  "creation delegates validation through the transaction client",
  /prepareApplicabilityDefinitionCreation\(\s*tx\s*,\s*input\s*\)/.test(
    creationTransactionFunction
  )
);

record(
  "creation delegates persistence through the transaction client",
  /persistApplicabilityDefinitionDraft\(\s*tx\s*,\s*input\s*,\s*preparationResult\.prepared\s*\)/.test(
    creationTransactionFunction
  )
);

record(
  "creation checks active organization membership",
  creationSource.includes("db.organizationMember.findUnique") &&
    creationSource.includes("userId: input.actorUserId") &&
    creationSource.includes("organizationId: input.organizationId")
);

record(
  "creation rejects inactive organization membership",
  creationSource.includes('"USER_NOT_ACTIVE_ORGANIZATION_MEMBER"')
);

record(
  "creation resolves requirement explicitly",
  creationSource.includes("db.complianceRequirement.findUnique")
);

record(
  "creation rejects missing requirements",
  creationSource.includes('"REQUIREMENT_NOT_FOUND"')
);

record(
  "creation rejects inactive requirements",
  creationSource.includes('"REQUIREMENT_INACTIVE"')
);

record(
  "creation derives framework identity from the requirement",
  creationPrepareFunction.includes(
    "contextResult.context.frameworkId"
  )
);

record(
  "creation delegates rule validation to shared applicability rule validation",
  creationPrepareFunction.includes(
    "validateApplicabilityDefinitionRule("
  )
);

record(
  "creation passes requirement framework into shared rule validation",
  creationPrepareFunction.includes("frameworkId:")
);

record(
  "creation persists the validated rule rather than the raw input AST",
  creationPersistFunction.includes(
    "prepared.rule as Prisma.InputJsonValue"
  )
);

record(
  "creation persists the supplied rule schema version",
  creationPersistFunction.includes("ruleSchemaVersion:")
);

record(
  "creation derives the next version from the requirement's latest definition",
  creationPersistFunction.includes(
    "tx.applicabilityDefinition.findFirst"
  ) &&
    creationPersistFunction.includes("requirementId:") &&
    creationPersistFunction.includes("orderBy:") &&
    creationPersistFunction.includes('version: "desc"')
);

record(
  "creation starts the first definition at version 1",
  creationPersistFunction.includes(
    "(latestDefinition?.version ?? 0) + 1"
  )
);

record(
  "creation persists definitions as DRAFT",
  creationPersistFunction.includes(
    "ApplicabilityDefinitionStatus.DRAFT"
  )
);

record(
  "creation persists rule dependencies derived from validated rule semantics",
  creationPersistFunction.includes("prepared.factDefinitionIds.map")
);

record(
  "creation persists dependencies as required",
  creationPersistFunction.includes("required: true")
);

record(
  "creation performs post-write definition confirmation",
  creationPersistFunction.includes(
    "tx.applicabilityDefinition.findUnique"
  ) &&
    creationPersistFunction.includes("post-write confirmation")
);

record(
  "creation confirms persisted version and DRAFT status",
  creationPersistFunction.includes(
    "confirmation.version !== created.version"
  ) &&
    creationPersistFunction.includes("confirmation.status !==")
);

record(
  "creation confirms the exact persisted dependency set",
  creationPersistFunction.includes("expectedDependencyIds") &&
    creationPersistFunction.includes("confirmedDependencyIds")
);

record(
  "creation rejects non-required persisted dependencies",
  creationPersistFunction.includes("if (!dependency.required)")
);

record(
  "creation maps P2002 and P2034 to version concurrency conflict",
  creationPublicFunction.includes('error.code === "P2002"') &&
    creationPublicFunction.includes('error.code === "P2034"') &&
    creationPublicFunction.includes('"CONCURRENT_VERSION_CONFLICT"')
);

record(
  "creation fails closed on generic persistence errors",
  creationPublicFunction.includes('"PERSISTENCE_FAILED"')
);

/*
 * ============================================================
 * APPROVAL CONTRACT
 * ============================================================
 */

record(
  "public applicability-definition approval API remains exported",
  approvalPublicStart >= 0
);

record(
  "approval service defines a transaction-capable database client",
  approvalSource.includes("Prisma.TransactionClient") &&
    approvalSource.includes("typeof prisma")
);

record(
  "approval opens a Prisma transaction",
  approvalPublicFunction.includes("prisma.$transaction")
);

record(
  "approval transaction uses SERIALIZABLE isolation",
  approvalPublicFunction.includes(
    "Prisma.TransactionIsolationLevel.Serializable"
  )
);

record(
  "approval validates context through the transaction client",
  /validateApplicabilityDefinitionApprovalContext\(\s*transaction\s*,\s*input\s*\)/.test(
    approvalTransactionFunction
  )
);

record(
  "approval context validates active organization membership",
  approvalContextFunction.includes(
    "db.organizationMember.findUnique"
  )
);

record(
  "approval context resolves the stored applicability definition",
  approvalContextFunction.includes(
    "db.applicabilityDefinition.findUnique"
  )
);

record(
  "approval context resolves the definition's requirement",
  approvalContextFunction.includes(
    "db.complianceRequirement.findUnique"
  )
);

record(
  "approval rejects missing applicability definitions",
  approvalContextFunction.includes(
    '"APPLICABILITY_DEFINITION_NOT_FOUND"'
  )
);

record(
  "approval rejects missing requirements",
  approvalContextFunction.includes('"REQUIREMENT_NOT_FOUND"')
);

record(
  "approval rejects inactive requirements",
  approvalContextFunction.includes('"REQUIREMENT_INACTIVE"')
);

record(
  "approval policy explicitly permits only DRAFT",
  approvalSource.includes(
    "case ApplicabilityDefinitionStatus.DRAFT"
  ) &&
    approvalSource.includes("return {\n        success: true,")
);

record(
  "approval policy rejects already-approved definitions explicitly",
  approvalSource.includes('"DEFINITION_ALREADY_APPROVED"')
);

record(
  "approval policy rejects retired definitions",
  approvalSource.includes('"INVALID_DEFINITION_STATUS"')
);

record(
  "approval revalidates the persisted rule",
  approvalRuleValidationFunction.includes(
    "validateApplicabilityDefinitionRule("
  )
);

record(
  "approval revalidation uses the persisted rule schema version",
  approvalRuleValidationFunction.includes(
    "context.definition.ruleSchemaVersion"
  )
);

record(
  "approval revalidation uses the persisted rule AST",
  approvalRuleValidationFunction.includes(
    "context.definition.ruleAst"
  )
);

record(
  "approval verifies dependency count against canonical ruledependencies",
  approvalRuleValidationFunction.includes(
    "persistedDependencies.length !== expectedIds.length"
  )
);

record(
  "approval verifies every persisted dependency is required",
  approvalRuleValidationFunction.includes(
    "dependency.required !== true"
  )
);

record(
  "approval verifies every persisted dependency belongs to the canonical set",
  approvalRuleValidationFunction.includes(
    "!expectedSet.has(dependency.factDefinitionId)"
  )
);

record(
  "approval fails closed on dependency corruption",
  approvalRuleValidationFunction.includes(
    '"DEPENDENCY_INTEGRITY_VIOLATION"'
  )
);

record(
  "approval uses a guarded DRAFT-only update",
  approvalPersistFunction.includes(
    "tx.applicabilityDefinition.updateMany"
  ) &&
    approvalPersistFunction.includes(
      "status: ApplicabilityDefinitionStatus.DRAFT"
    )
);

record(
  "approval changes lifecycle state to APPROVED",
  approvalPersistFunction.includes(
    "status: ApplicabilityDefinitionStatus.APPROVED"
  )
);

record(
  "approval records the approving actor",
  approvalPersistFunction.includes("approvedById: input.actorUserId")
);

record(
  "approval records approval time",
  approvalPersistFunction.includes("approvedAt")
);

record(
  "approval requires exactly one guarded row to change",
  approvalPersistFunction.includes("update.count !== 1")
);

record(
  "approval detects concurrent lifecycle change",
  approvalPersistFunction.includes(
    '"DEFINITION_CHANGED_DURING_APPROVAL"'
  )
);

record(
  "approval rereads the persisted definition after mutation",
  approvalPersistFunction.includes(
    "tx.applicabilityDefinition.findUnique"
  )
);

record(
  "approval confirms APPROVED state after persistence",
  approvalPersistFunction.includes(
    "definition.status !== ApplicabilityDefinitionStatus.APPROVED"
  )
);

record(
  "approval confirms the approving actor after persistence",
  approvalPersistFunction.includes(
    "definition.approvedById !== input.actorUserId"
  )
);

record(
  "approval confirms approval timestamp after persistence",
  approvalPersistFunction.includes("definition.approvedAt === null")
);

record(
  "approval maps P2034 to explicit concurrency conflict",
  approvalPublicFunction.includes('error.code === "P2034"') &&
    approvalPublicFunction.includes('"CONCURRENT_APPROVAL_CONFLICT"')
);

record(
  "approval fails closed on generic transaction failure",
  approvalPublicFunction.includes('"APPROVAL_TRANSACTION_FAILED"')
);

/*
 * ============================================================
 * GOVERNANCE BOUNDARY
 * ============================================================
 */

record(
  "approval service does not establish current applicability authority",
  !approvalSource.includes(
    "currentApplicabilityDefinitionAuthority.create"
  ) &&
    !approvalSource.includes(
      "currentApplicabilityDefinitionAuthority.update"
    ) &&
    !approvalSource.includes(
      "currentApplicabilityDefinitionAuthority.delete"
    ) &&
    !approvalSource.includes(
      "currentApplicabilityDefinitionAuthority.upsert"
    )
);

record(
  "approval service does not discover or select current authority",
  !approvalSource.includes(
    "currentApplicabilityDefinitionAuthority.findFirst"
  ) &&
    !approvalSource.includes(
      "currentApplicabilityDefinitionAuthority.findMany"
    )
);

record(
  "creation service does not mutate current applicability authority",
  !creationSource.includes(
    "currentApplicabilityDefinitionAuthority.create"
  ) &&
    !creationSource.includes(
      "currentApplicabilityDefinitionAuthority.update"
    ) &&
    !creationSource.includes(
      "currentApplicabilityDefinitionAuthority.delete"
    ) &&
    !creationSource.includes(
      "currentApplicabilityDefinitionAuthority.upsert"
    )
);

record(
  "creation service contains no raw SQL bypass",
  !creationSource.includes("$executeRaw") &&
    !creationSource.includes("$queryRaw")
);

record(
  "approval service contains no raw SQL bypass",
  !approvalSource.includes("$executeRaw") &&
    !approvalSource.includes("$queryRaw")
);

/*
 * ============================================================
 * ORDERING CONTRACTS
 * ============================================================
 */

const creationValidationIndex =
  creationTransactionFunction.indexOf(
    "prepareApplicabilityDefinitionCreation("
  );

const creationPersistenceIndex =
  creationTransactionFunction.indexOf(
    "persistApplicabilityDefinitionDraft("
  );

record(
  "creation preparation precedes definition persistence",
  creationValidationIndex >= 0 &&
    creationPersistenceIndex > creationValidationIndex
);

const approvalContextIndex =
  approvalTransactionFunction.indexOf(
    "validateApplicabilityDefinitionApprovalContext("
  );

const approvalPolicyIndex =
  approvalTransactionFunction.indexOf(
    "canApproveApplicabilityDefinition("
  );

const approvalSemanticIndex =
  approvalTransactionFunction.indexOf(
    "validateStoredApplicabilityDefinitionRuleForApproval("
  );

const approvalPersistenceIndex =
  approvalTransactionFunction.indexOf(
    "persistApplicabilityDefinitionApproval("
  );

record(
  "approval context validation precedes approval policy",
  approvalContextIndex >= 0 &&
    approvalPolicyIndex > approvalContextIndex
);

record(
  "approval policy precedes persisted-rule revalidation",
  approvalPolicyIndex >= 0 &&
    approvalSemanticIndex > approvalPolicyIndex
);

record(
  "persisted-rule revalidation precedes approval persistence",
  approvalSemanticIndex >= 0 &&
    approvalPersistenceIndex > approvalSemanticIndex
);

/*
 * ============================================================
 * RESULT
 * ============================================================
 */

for (const result of results) {
  console.log(
    `${result.passed ? "PASS" : "FAIL"} — ${result.name}`
  );
}

const passed = results.filter(
  (result) => result.passed
).length;

const failed = results.length - passed;

console.log(
  `RESULT — ${passed} PASS / ${failed} FAIL`
);

if (failed > 0) {
  process.exitCode = 1;
}