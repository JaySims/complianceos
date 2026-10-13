import fs from "node:fs";
import path from "node:path";

type TestResult = {
  name: string;
  passed: boolean;
};

const results: TestResult[] = [];

const record = (name: string, passed: boolean) =>
  results.push({ name, passed });

const sourcePath = path.resolve(
  process.cwd(),
  "lib/compliance/organizationFrameworkEstablishmentService.ts"
);

const source = fs.readFileSync(sourcePath, "utf8");

function indexOfOrFail(pattern: string): number {
  return source.indexOf(pattern);
}

const transactionFunctionStart = indexOfOrFail(
  "export async function establishOrganizationFrameworkInTransaction"
);

const publicFunctionStart = indexOfOrFail(
  "export async function establishOrganizationFramework("
);

const transactionFunction =
  transactionFunctionStart >= 0 &&
  publicFunctionStart > transactionFunctionStart
    ? source.slice(
        transactionFunctionStart,
        publicFunctionStart
      )
    : "";

const publicFunction =
  publicFunctionStart >= 0
    ? source.slice(publicFunctionStart)
    : "";

record(
  "transaction-scoped establishment function remains exported",
  transactionFunctionStart >= 0
);

record(
  "public establishment function remains exported",
  publicFunctionStart >= 0
);

record(
  "framework existence is checked explicitly",
  transactionFunction.includes(
    "transaction.framework.findUnique"
  )
);

record(
  "current framework catalogue authority is resolved inside establishment transaction",
  transactionFunction.includes(
    "transaction.currentFrameworkCatalogueAuthority.findUnique"
  )
);

record(
  "catalogue authority lookup is framework scoped",
  transactionFunction.includes(
    "frameworkId: framework.id"
  )
);

record(
  "authority-selected immutable approval is projected",
  transactionFunction.includes(
    "frameworkCatalogueApproval:"
  ) &&
    transactionFunction.includes(
      "contentManifest: true"
    ) &&
    transactionFunction.includes(
      "contentHash: true"
    ) &&
    transactionFunction.includes(
      "manifestAlgorithmVersion: true"
    )
);

record(
  "missing current catalogue authority has explicit unpublished failure",
  transactionFunction.includes(
    '"FRAMEWORK_NOT_PUBLISHED"'
  )
);

record(
  "governed state is loaded during establishment",
  transactionFunction.includes(
    "loadFrameworkCatalogueGovernedState("
  )
);

record(
  "governed-state loader receives same transaction client",
  transactionFunction.includes(
    "loadFrameworkCatalogueGovernedState(\n      transaction,"
  )
);

record(
  "publication integrity is revalidated during establishment",
  transactionFunction.includes(
    "validateFrameworkCataloguePublicationIntegrity("
  )
);

record(
  "publication integrity receives authority-selected approval",
  transactionFunction.includes(
    "catalogueAuthority.frameworkCatalogueApproval"
  )
);

record(
  "invalid publication has explicit fail-closed reason",
  transactionFunction.includes(
    '"FRAMEWORK_PUBLICATION_INVALID"'
  )
);

const catalogueAuthorityIndex =
  transactionFunction.indexOf(
    "transaction.currentFrameworkCatalogueAuthority.findUnique"
  );

const governedStateIndex =
  transactionFunction.indexOf(
    "loadFrameworkCatalogueGovernedState("
  );

const publicationIntegrityIndex =
  transactionFunction.indexOf(
    "validateFrameworkCataloguePublicationIntegrity("
  );

const assessmentCreateIndex =
  transactionFunction.indexOf(
    "transaction.assessment.create"
  );

const assessmentAuthorityCreateIndex =
  transactionFunction.indexOf(
    "transaction.currentAssessmentAuthority.create"
  );

record(
  "catalogue authority resolution precedes governed-state loading",
  catalogueAuthorityIndex >= 0 &&
    governedStateIndex > catalogueAuthorityIndex
);

record(
  "governed-state loading precedes publication-integrity validation",
  governedStateIndex >= 0 &&
    publicationIntegrityIndex > governedStateIndex
);

record(
  "publication-integrity validation precedes assessment creation",
  publicationIntegrityIndex >= 0 &&
    assessmentCreateIndex > publicationIntegrityIndex
);

record(
  "publication-integrity validation precedes assessment-authority creation",
  publicationIntegrityIndex >= 0 &&
    assessmentAuthorityCreateIndex >
      publicationIntegrityIndex
);

record(
  "assessment creation precedes assessment-authority creation",
  assessmentCreateIndex >= 0 &&
    assessmentAuthorityCreateIndex >
      assessmentCreateIndex
);

record(
  "public establishment wrapper opens Prisma transaction",
  publicFunction.includes("prisma.$transaction")
);

record(
  "public establishment wrapper uses SERIALIZABLE isolation",
  publicFunction.includes(
    "Prisma.TransactionIsolationLevel.Serializable"
  )
);

record(
  "public wrapper delegates through transaction-scoped establishment function",
  publicFunction.includes(
    "establishOrganizationFrameworkInTransaction("
  ) &&
    publicFunction.includes("transaction,")
);

record(
  "establishment service does not discover approval through findMany",
  !transactionFunction.includes(
    "frameworkCatalogueApproval.findMany"
  )
);

record(
  "establishment service does not discover approval through findFirst",
  !transactionFunction.includes(
    "frameworkCatalogueApproval.findFirst"
  )
);

record(
  "establishment service does not infer publication from latest approval",
  !transactionFunction.includes("latestApproval")
);

record(
  "establishment service does not infer publication from approvedAt ordering",
  !transactionFunction.includes(
    "orderBy: { approvedAt"
  )
);

record(
  "establishment service contains no framework catalogue authority mutation",
  !transactionFunction.includes(
    "currentFrameworkCatalogueAuthority.create"
  ) &&
    !transactionFunction.includes(
      "currentFrameworkCatalogueAuthority.update"
    ) &&
    !transactionFunction.includes(
      "currentFrameworkCatalogueAuthority.delete"
    ) &&
    !transactionFunction.includes(
      "currentFrameworkCatalogueAuthority.upsert"
    )
);

record(
  "establishment service contains no framework catalogue approval mutation",
  !transactionFunction.includes(
    "frameworkCatalogueApproval.create"
  ) &&
    !transactionFunction.includes(
      "frameworkCatalogueApproval.update"
    ) &&
    !transactionFunction.includes(
      "frameworkCatalogueApproval.delete"
    ) &&
    !transactionFunction.includes(
      "frameworkCatalogueApproval.upsert"
    )
);

record(
  "establishment service contains no raw SQL publication bypass",
  !source.includes("$executeRaw") &&
    !source.includes("$queryRaw")
);

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