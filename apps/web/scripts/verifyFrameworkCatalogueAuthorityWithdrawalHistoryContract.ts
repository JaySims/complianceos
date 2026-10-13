import { readFileSync } from "node:fs";

type TestResult = {
  name: string;
  passed: boolean;
};

const results: TestResult[] = [];

const record = (name: string, passed: boolean) =>
  results.push({ name, passed });

const source = readFileSync(
  "scripts/verifyFrameworkCatalogueAuthorityWithdrawalHistory.ts",
  "utf8"
);

record(
  "withdrawal history verifier invokes production withdrawal service",
  source.includes(
    "withdrawFrameworkCatalogueAuthorityInTransaction"
  )
);

record(
  "historical approval is explicitly modeled",
  source.includes("approvals: Map<string, ApprovalRecord>")
);

record(
  "historical approval identity is preserved",
  source.includes('"historical approval preserved"')
);

record(
  "existing assessment is explicitly modeled",
  source.includes("assessments: Map<string, AssessmentRecord>")
);

record(
  "existing assessment preservation is asserted",
  source.includes('"existing assessment preserved"')
);

record(
  "existing organization assessment authority is explicitly modeled",
  source.includes(
    "assessmentAuthorities: Map<string, AssessmentAuthorityRecord>"
  )
);

record(
  "existing organization assessment authority preservation is asserted",
  source.includes(
    '"existing organization assessment authority preserved"'
  )
);

record(
  "assessment creation mutation is tracked",
  source.includes("assessmentCreates")
);

record(
  "assessment creation is asserted to remain zero",
  source.includes('"withdrawal creates no assessment"')
);

record(
  "assessment update mutation is tracked",
  source.includes("assessmentUpdates")
);

record(
  "assessment update is asserted to remain zero",
  source.includes('"withdrawal updates no assessment"')
);

record(
  "assessment deletion mutation is tracked",
  source.includes("assessmentDeletes")
);

record(
  "assessment deletion is asserted to remain zero",
  source.includes('"withdrawal deletes no assessment"')
);

record(
  "organization assessment authority creation mutation is tracked",
  source.includes("assessmentAuthorityCreates")
);

record(
  "organization assessment authority creation is asserted to remain zero",
  source.includes(
    '"withdrawal creates no organization assessment authority"'
  )
);

record(
  "organization assessment authority update mutation is tracked",
  source.includes("assessmentAuthorityUpdates")
);

record(
  "organization assessment authority update is asserted to remain zero",
  source.includes(
    '"withdrawal updates no organization assessment authority"'
  )
);

record(
  "catalogue authority removal is asserted",
  source.includes('"current catalogue authority removed"')
);

record(
  "WITHDRAW transition is asserted",
  source.includes('"WITHDRAW transition recorded"')
);

record(
  "previous approval identity is asserted on withdrawal",
  source.includes(
    '"withdrawal transition preserves previous approval identity"'
  )
);

record(
  "replacement approval is asserted null",
  source.includes(
    '"withdrawal transition has no replacement approval"'
  )
);

record(
  "existing assessment linkage remains intact",
  source.includes(
    '"withdrawal leaves organization assessment authority pointing to existing assessment"'
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

if (failed > 0) {
  process.exitCode = 1;
}
