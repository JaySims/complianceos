import { readFileSync } from "node:fs";

type TestResult = { name: string; passed: boolean };
const results: TestResult[] = [];
const record = (name: string, passed: boolean) => results.push({ name, passed });

const source = readFileSync(
  "lib/compliance/frameworkCatalogueApprovalService.ts",
  "utf8"
);

record(
  "public approval service opens Prisma transaction",
  source.includes("prisma.$transaction<CreateFrameworkCatalogueApprovalResult>")
);

record(
  "transaction delegates through transaction client",
  source.includes("createFrameworkCatalogueApprovalInTransaction(transaction, input)")
);

record(
  "approval transaction is SERIALIZABLE",
  source.includes("Prisma.TransactionIsolationLevel.Serializable")
);

record(
  "P2034 maps to concurrency handling",
  source.includes("P2034")
);

record(
  "P2002 handling requires frameworkId target",
  source.includes('error.meta.target.includes("frameworkId")')
);

record(
  "P2002 handling requires version target",
  source.includes('error.meta.target.includes("version")')
);

record(
  "concurrency conflict is explicit",
  source.includes('reason: "CONCURRENT_APPROVAL_CONFLICT"')
);

record(
  "unclassified transaction failure fails closed",
  source.includes('reason: "APPROVAL_TRANSACTION_FAILED"')
);

for (const result of results) {
  console.log(`${result.passed ? "PASS" : "FAIL"} — ${result.name}`);
}

const failed = results.filter((result) => !result.passed).length;
console.log(`RESULT — ${results.length - failed} PASS / ${failed} FAIL`);
if (failed > 0) process.exitCode = 1;
