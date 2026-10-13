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
  "lib/compliance/complianceFrameworkCatalogueService.ts"
);

const source = fs.readFileSync(sourcePath, "utf8");

record(
  "catalogue discovery originates from current framework catalogue authority",
  source.includes(
    "db.currentFrameworkCatalogueAuthority.findMany"
  )
);

record(
  "catalogue read does not expose frameworks through unrestricted framework findMany",
  !source.includes("db.framework.findMany") &&
    !source.includes("prisma.framework.findMany")
);

record(
  "catalogue read does not discover publication through approval findMany",
  !source.includes(
    "frameworkCatalogueApproval.findMany"
  )
);

record(
  "catalogue read does not discover publication through approval findFirst",
  !source.includes(
    "frameworkCatalogueApproval.findFirst"
  )
);

record(
  "catalogue read does not infer publication from latest approval",
  !source.includes("latestApproval")
);

record(
  "catalogue read does not order approval authority by approvedAt",
  !source.includes("approvedAt:")
);

record(
  "catalogue read does not order publication authority by createdAt",
  !source.includes("createdAt:")
);

record(
  "catalogue read loads live governed framework state",
  source.includes(
    "loadFrameworkCatalogueGovernedState("
  )
);

record(
  "governed-state loader receives injected database client",
  source.includes(
    "loadFrameworkCatalogueGovernedState(\n          db,"
  )
);

record(
  "catalogue read validates publication integrity",
  source.includes(
    "validateFrameworkCataloguePublicationIntegrity({"
  )
);

record(
  "publication integrity receives authority-selected approval",
  source.includes(
    "approval: authority.frameworkCatalogueApproval"
  )
);

record(
  "catalogue entries are sourced from validated governed state",
  source.includes(
    "id: governedStateResult.governedState.framework.id"
  ) &&
    source.includes(
      "name: governedStateResult.governedState.framework.name"
    ) &&
    source.includes(
      "version: governedStateResult.governedState.framework.version"
    ) &&
    source.includes(
      "governedStateResult.governedState.framework.description"
    )
);

const mutationPatterns = [
  ".create(",
  ".createMany(",
  ".update(",
  ".updateMany(",
  ".delete(",
  ".deleteMany(",
  ".upsert(",
];

record(
  "catalogue service contains no Prisma mutation operation",
  mutationPatterns.every(
    (pattern) => !source.includes(pattern)
  )
);

record(
  "catalogue read contains no transaction-based repair path",
  !source.includes("$transaction")
);

record(
  "catalogue read contains no database push or raw SQL path",
  !source.includes("$executeRaw") &&
    !source.includes("$queryRaw")
);

record(
  "public catalogue API delegates through governed database-aware reader",
  source.includes(
    "return getComplianceFrameworkCatalogueWithDatabase(prisma);"
  )
);

record(
  "database-aware governed catalogue reader remains exported",
  source.includes(
    "export async function getComplianceFrameworkCatalogueWithDatabase("
  )
);

record(
  "public catalogue API remains exported",
  source.includes(
    "export async function getComplianceFrameworkCatalogue():"
  )
);

for (const result of results) {
  console.log(
    `${result.passed ? "PASS" : "FAIL"} — ${result.name}`
  );
}

const failed =
  results.filter((result) => !result.passed).length;

console.log(
  `RESULT — ${results.length - failed} PASS / ${failed} FAIL`
);

if (failed > 0) process.exitCode = 1;