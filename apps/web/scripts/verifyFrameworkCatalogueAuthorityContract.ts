import { readFileSync } from "node:fs";

type TestResult = { name: string; passed: boolean };
const results: TestResult[] = [];
const record = (name: string, passed: boolean) =>
  results.push({ name, passed });

const source = readFileSync(
  "lib/compliance/frameworkCatalogueAuthorityService.ts",
  "utf8"
);

function section(start: string, end?: string): string {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) return "";

  if (!end) return source.slice(startIndex);

  const endIndex = source.indexOf(end, startIndex + start.length);
  return endIndex < 0
    ? source.slice(startIndex)
    : source.slice(startIndex, endIndex);
}

const establish = section(
  "export async function establishFrameworkCatalogueAuthority(",
  "export type ReplaceFrameworkCatalogueAuthorityInput"
);

const replace = section(
  "export async function replaceFrameworkCatalogueAuthority(",
  "export type WithdrawFrameworkCatalogueAuthorityInput"
);

const withdraw = section(
  "export async function withdrawFrameworkCatalogueAuthority("
);

record("ESTABLISH public wrapper exists", establish.length > 0);
record("REPLACE public wrapper exists", replace.length > 0);
record("WITHDRAW public wrapper exists", withdraw.length > 0);

record(
  "ESTABLISH wrapper is SERIALIZABLE",
  establish.includes("Prisma.TransactionIsolationLevel.Serializable")
);
record(
  "REPLACE wrapper is SERIALIZABLE",
  replace.includes("Prisma.TransactionIsolationLevel.Serializable")
);
record(
  "WITHDRAW wrapper is SERIALIZABLE",
  withdraw.includes("Prisma.TransactionIsolationLevel.Serializable")
);

for (const [name, body] of [
  ["ESTABLISH", establish],
  ["REPLACE", replace],
  ["WITHDRAW", withdraw],
] as const) {
  record(`${name} handles P2034`, body.includes('error.code === "P2034"'));
  record(`${name} handles P2002`, body.includes('error.code === "P2002"'));
  record(
    `${name} maps concurrency conflict explicitly`,
    body.includes('reason: "CONCURRENT_AUTHORITY_CONFLICT"')
  );
  record(
    `${name} maps generic transaction failure explicitly`,
    body.includes('reason: "AUTHORITY_TRANSACTION_FAILED"')
  );
}

record(
  "ESTABLISH transition explicit",
  source.includes('transitionType: "ESTABLISH"')
);
record(
  "REPLACE transition explicit",
  source.includes('transitionType: "REPLACE"')
);
record(
  "WITHDRAW transition explicit",
  source.includes('transitionType: "WITHDRAW"')
);

for (const result of results) {
  console.log(`${result.passed ? "PASS" : "FAIL"} — ${result.name}`);
}

const failed = results.filter((result) => !result.passed).length;
console.log(`RESULT — ${results.length - failed} PASS / ${failed} FAIL`);

if (failed > 0) process.exitCode = 1;
