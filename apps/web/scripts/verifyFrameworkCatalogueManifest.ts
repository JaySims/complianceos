import {
  buildFrameworkCatalogueManifest,
  buildFrameworkCatalogueManifestFingerprint,
  canonicalizeManifestNumber,
  canonicalizeApplicabilityContextTypes,
  compareUnicodeScalarValues,
  hashCanonicalManifest,
  validateFrameworkCatalogueGovernedState,
  serializeCanonicalJson,
  serializeManifestDate,
  type FrameworkCatalogueGovernedState,
} from "../lib/compliance/frameworkCatalogueManifest";
import { createValidGovernedState } from "./frameworkCatalogueTestFixtures";

type TestResult = {
  name: string;
  passed: boolean;
  detail: string;
};

function record(results: TestResult[], name: string, passed: boolean, detail: string): void {
  results.push({ name, passed, detail });
}

function expectEqual(results: TestResult[], name: string, actual: unknown, expected: unknown, detail: string): void {
  record(results, name, Object.is(actual, expected), detail);
}

function createOrderingGovernedState(): FrameworkCatalogueGovernedState {
  const state = createValidGovernedState();

  state.regulatoryFacts[0].options = [
    {
      value: "Z",
      label: "Zulu",
      description: null,
      sortOrder: 2,
      active: true,
    },
    {
      value: "A",
      label: "Alpha",
      description: null,
      sortOrder: 1,
      active: true,
    },
  ];

  state.regulatoryFacts.push({
    id: "fact-2",
    frameworkId: "framework-1",
    key: "alpha_fact",
    name: "Alpha Fact",
    description: null,
    valueType: "STRING",
    allowedContextTypes: ["SYSTEM", "ORGANIZATION"],
    sourceTitle: null,
    sourceReference: null,
    sourceUrl: null,
    effectiveFrom: null,
    active: true,
    options: [],
  });

  state.requirements[0].currentApplicability!.dependencies.push({
    factDefinitionId: "fact-2",
    required: false,
  });

  state.requirements.push({
    id: "requirement-2",
    frameworkId: "framework-1",
    code: "AAA-001",
    title: "Inactive Requirement",
    description: null,
    category: "OTHER",
    authority: null,
    sourceTitle: null,
    sourceReference: null,
    sourceUrl: null,
    effectiveFrom: null,
    mandatory: false,
    weight: 0,
    active: false,
    currentApplicability: null,
  });

  return state;
}

function expectGovernedStateFailure(
  results: TestResult[],
  name: string,
  state: FrameworkCatalogueGovernedState,
  expectedReason: string
): void {
  let actualReason = "NO_ERROR";

  try {
    validateFrameworkCatalogueGovernedState(state);
  } catch (error) {
    actualReason =
      error instanceof Error ? error.message : "UNKNOWN_ERROR";
  }

  expectEqual(results, name, actualReason, expectedReason, expectedReason);
}

function run(): void {
  const results: TestResult[] = [];

  const bmpPrivateUse = "\uE000";
  const supplementary = "\u{10000}";

  record(
    results,
    "1. Unicode ordering uses scalar values rather than UTF-16 code units",
    compareUnicodeScalarValues(bmpPrivateUse, supplementary) < 0,
    "U+E000 must sort before U+10000 by Unicode scalar value."
  );

  expectEqual(
    results,
    "2. Object keys are canonical regardless of insertion order",
    serializeCanonicalJson({ b: 2, a: 1 }),
    "{\"a\":1,\"b\":2}",
    "Canonical object keys must be deterministically ordered."
  );

  expectEqual(
    results,
    "3. Nested object keys are canonicalized recursively",
    serializeCanonicalJson({ outer: { z: true, a: null } }),
    "{\"outer\":{\"a\":null,\"z\":true}}",
    "Nested governed JSON must use the same canonical ordering."
  );

  expectEqual(
    results,
    "4. Array semantic order is preserved",
    serializeCanonicalJson({ values: [3, 1, 2] }),
    "{\"values\":[3,1,2]}",
    "Canonicalization must not reorder semantic arrays."
  );

  expectEqual(
    results,
    "5. Negative zero serializes as zero",
    serializeCanonicalJson({ value: -0 }),
    "{\"value\":0}",
    "V1 numeric canonicalization requires -0 to become 0."
  );

  for (const [label, value] of [["NaN", NaN], ["positive Infinity", Infinity], ["negative Infinity", -Infinity]] as const) {
    let rejected = false;
    try {
      serializeCanonicalJson({ value });
    } catch {
      rejected = true;
    }
    record(results, "6. Non-finite number fails closed: " + label, rejected, label + " must never enter a V1 manifest.");
  }

  const manifest = serializeCanonicalJson({ b: 2, a: 1 });
  expectEqual(results, "7. SHA-256 fingerprint is deterministic", hashCanonicalManifest(manifest), hashCanonicalManifest(manifest), "Identical canonical bytes must produce identical lowercase SHA-256.");

  expectEqual(
    results,
    "8. Applicability context types use canonical enum order",
    canonicalizeApplicabilityContextTypes(["SYSTEM", "ORGANIZATION", "EVENT"]).join(","),
    "ORGANIZATION,EVENT,SYSTEM",
    "Context order must follow the frozen V1 enum order."
  );

  for (const [name, values] of [
    ["9. Duplicate applicability context fails closed", ["EVENT", "EVENT"]],
    ["10. Unknown applicability context fails closed", ["EVENT", "UNKNOWN_CONTEXT"]],
  ] as const) {
    let rejected = false;
    try {
      canonicalizeApplicabilityContextTypes(values);
    } catch {
      rejected = true;
    }
    record(results, name, rejected, "Invalid context sets must be rejected rather than repaired.");
  }

  const missingCurrent = createValidGovernedState();
  missingCurrent.requirements[0].currentApplicability = null;
  expectGovernedStateFailure(
    results,
    "11. Active requirement without current applicability fails closed",
    missingCurrent,
    "ACTIVE_REQUIREMENT_MISSING_CURRENT_APPLICABILITY"
  );

  const wrongRequirement = createValidGovernedState();
  wrongRequirement.requirements[0].currentApplicability!.requirementId =
    "requirement-other";
  expectGovernedStateFailure(
    results,
    "12. Current applicability must belong to the same requirement",
    wrongRequirement,
    "CURRENT_APPLICABILITY_REQUIREMENT_MISMATCH"
  );

  const notApproved = createValidGovernedState();
  notApproved.requirements[0].currentApplicability!.status = "DRAFT";
  expectGovernedStateFailure(
    results,
    "13. Current applicability must be APPROVED",
    notApproved,
    "CURRENT_APPLICABILITY_NOT_APPROVED"
  );

  const missingDependencyFact = createValidGovernedState();
  missingDependencyFact.requirements[0].currentApplicability!.dependencies[0].factDefinitionId =
    "fact-missing";
  expectGovernedStateFailure(
    results,
    "14. Missing applicability dependency fact fails closed",
    missingDependencyFact,
    "APPLICABILITY_DEPENDENCY_FACT_NOT_FOUND"
  );

  const foreignDependencyFact = createValidGovernedState();
  foreignDependencyFact.regulatoryFacts[0].frameworkId = "framework-other";
  expectGovernedStateFailure(
    results,
    "15. Cross-framework applicability dependency fails closed",
    foreignDependencyFact,
    "APPLICABILITY_DEPENDENCY_FRAMEWORK_MISMATCH"
  );

  const duplicateDependency = createValidGovernedState();
  duplicateDependency.requirements[0].currentApplicability!.dependencies.push({
    factDefinitionId: "fact-1",
    required: false,
  });
  expectGovernedStateFailure(
    results,
    "16. Duplicate applicability dependency fails closed",
    duplicateDependency,
    "DUPLICATE_APPLICABILITY_DEPENDENCY"
  );

  expectEqual(
    results,
    "17. Manifest dates serialize as UTC ISO-8601 with milliseconds",
    serializeManifestDate(new Date("2026-09-29T08:35:12.345Z")),
    "2026-09-29T08:35:12.345Z",
    "Manifest DateTime values must use the frozen UTC millisecond representation."
  );

  let invalidDateRejected = false;
  try {
    serializeManifestDate(new Date("invalid"));
  } catch {
    invalidDateRejected = true;
  }
  record(
    results,
    "18. Invalid manifest date fails closed",
    invalidDateRejected,
    "Invalid Date values must never enter a V1 manifest."
  );

  const builtManifest = buildFrameworkCatalogueManifest(
    createValidGovernedState()
  );

  const builtManifestJson = JSON.stringify(builtManifest);
  record(
    results,
    "19. Manifest excludes internal persisted identifiers",
    !builtManifestJson.includes("framework-1") &&
      !builtManifestJson.includes("requirement-1") &&
      !builtManifestJson.includes("fact-1"),
    "Generated IDs and foreign keys must not enter the governed manifest."
  );

  const inactiveWithoutAuthority = createValidGovernedState();
  inactiveWithoutAuthority.requirements[0].active = false;
  inactiveWithoutAuthority.requirements[0].currentApplicability = null;
  const inactiveManifest = buildFrameworkCatalogueManifest(
    inactiveWithoutAuthority
  );
  expectEqual(
    results,
    "20. Inactive requirement preserves explicit null current applicability",
    inactiveManifest.requirements[0].currentApplicability,
    null,
    "Inactive requirements remain represented and authority absence must be explicit."
  );

  const orderingState = createOrderingGovernedState();
  const orderedManifest = buildFrameworkCatalogueManifest(orderingState);

  expectEqual(
    results,
    "21. Requirements are ordered by stable code",
    orderedManifest.requirements.map((requirement) => requirement.code).join(","),
    "AAA-001,REQ-001",
    "Requirements must use deterministic code ordering."
  );

  expectEqual(
    results,
    "22. Regulatory facts are ordered by stable key",
    orderedManifest.regulatoryFacts.map((fact) => fact.key).join(","),
    "alpha_fact,test_fact",
    "Regulatory facts must use deterministic key ordering."
  );

  const testFact = orderedManifest.regulatoryFacts.find(
    (fact) => fact.key === "test_fact"
  )!;
  expectEqual(
    results,
    "23. Regulatory fact options are ordered by stable value",
    testFact.options.map((option) => option.value).join(","),
    "A,Z",
    "Options must use deterministic value ordering."
  );

  const req = orderedManifest.requirements.find(
    (requirement) => requirement.code === "REQ-001"
  )!;
  expectEqual(
    results,
    "24. Applicability dependencies are ordered by resolved fact key",
    req.currentApplicability!.dependencies.map((dependency) => dependency.factKey).join(","),
    "alpha_fact,test_fact",
    "Dependencies must use deterministic resolved fact-key ordering."
  );

  const shuffledState = createOrderingGovernedState();
  shuffledState.requirements.reverse();
  shuffledState.regulatoryFacts.reverse();
  shuffledState.regulatoryFacts.forEach((fact) => fact.options.reverse());
  shuffledState.requirements.forEach((requirement) =>
    requirement.currentApplicability?.dependencies.reverse()
  );

  expectEqual(
    results,
    "25. Equivalent governed states produce identical manifest structure",
    JSON.stringify(buildFrameworkCatalogueManifest(shuffledState)),
    JSON.stringify(orderedManifest),
    "Input collection order must not affect the governed manifest."
  );

  expectEqual(
    results,
    "26. Manifest numeric negative zero canonicalizes to zero",
    canonicalizeManifestNumber(-0),
    0,
    "All governed manifest numbers must canonicalize negative zero."
  );

  for (const [label, value] of [
    ["NaN", Number.NaN],
    ["positive Infinity", Number.POSITIVE_INFINITY],
    ["negative Infinity", Number.NEGATIVE_INFINITY],
  ] as const) {
    let failedClosed = false;
    try {
      canonicalizeManifestNumber(value);
    } catch (error) {
      failedClosed =
        error instanceof Error &&
        error.message === "NON_FINITE_MANIFEST_NUMBER";
    }
    record(
      results,
      "27. Manifest non-finite number fails closed: " + label,
      failedClosed,
      "Non-finite governed numbers must never reach JSON serialization."
    );
  }

  const numericState = createOrderingGovernedState();
  numericState.requirements[0].weight = -0;
  numericState.requirements[0].currentApplicability!.version = -0;
  numericState.regulatoryFacts[0].options[0].sortOrder = -0;
  const numericManifest = buildFrameworkCatalogueManifest(numericState);

  record(
    results,
    "28. Builder canonicalizes governed numeric fields",
    Object.is(numericManifest.requirements.find((r) => r.code === "REQ-001")!.weight, 0) &&
      Object.is(numericManifest.requirements.find((r) => r.code === "REQ-001")!.currentApplicability!.version, 0) &&
      Object.is(numericManifest.regulatoryFacts.find((f) => f.key === "test_fact")!.options.find((o) => o.value === "Z")!.sortOrder, 0),
    "Weight, applicability version, and option sort order must use manifest numeric canonicalization."
  );

  const ruleAstState = createValidGovernedState();
  ruleAstState.requirements[0].currentApplicability!.ruleAst = {
    "": { z: 1, a: 2 },
    "𐀀": [
      { second: 2, first: 1 },
      { first: 3, second: 4 },
    ],
  };

  const ruleAstManifest = buildFrameworkCatalogueManifest(ruleAstState);
  const canonicalRuleAst =
    ruleAstManifest.requirements[0].currentApplicability!.ruleAst;

  expectEqual(
    results,
    "29. Builder canonicalizes ruleAst recursively by Unicode scalar value",
    JSON.stringify(canonicalRuleAst),
    "{\"\":{\"a\":2,\"z\":1},\"𐀀\":[{\"first\":1,\"second\":2},{\"first\":3,\"second\":4}]}",
    "ruleAst object keys must use scalar-value ordering recursively while arrays retain semantic order."
  );

  const fingerprintState = createOrderingGovernedState();
  const fingerprint = buildFrameworkCatalogueManifestFingerprint(
    fingerprintState
  );

  const shuffledFingerprintState = createOrderingGovernedState();
  shuffledFingerprintState.requirements.reverse();
  shuffledFingerprintState.regulatoryFacts.reverse();
  shuffledFingerprintState.regulatoryFacts.forEach((fact) =>
    fact.options.reverse()
  );
  shuffledFingerprintState.requirements.forEach((requirement) =>
    requirement.currentApplicability?.dependencies.reverse()
  );
  const shuffledFingerprint =
    buildFrameworkCatalogueManifestFingerprint(shuffledFingerprintState);

  expectEqual(
    results,
    "30. Equivalent governed states produce byte-identical contentManifest",
    shuffledFingerprint.contentManifest,
    fingerprint.contentManifest,
    "Canonical manifest bytes must not depend on governed collection input order."
  );

  expectEqual(
    results,
    "31. contentHash is SHA-256 of exact persisted contentManifest",
    fingerprint.contentHash,
    hashCanonicalManifest(fingerprint.contentManifest),
    "Fingerprint verification must hash the exact persisted manifest string."
  );

  record(
    results,
    "32. contentHash is lowercase 64-character hexadecimal",
    /^[0-9a-f]{64}$/.test(fingerprint.contentHash),
    "V1 fingerprints must use lowercase hexadecimal SHA-256."
  );

  expectEqual(
    results,
    "33. Fingerprint records manifest algorithm version 1",
    fingerprint.manifestAlgorithmVersion,
    1,
    "V1 approval evidence must record manifest algorithm version 1."
  );

  record(
    results,
    "34. Serialized manifest preserves explicit null current applicability",
    fingerprint.contentManifest.includes(
      "\"currentApplicability\":null"
    ),
    "Required nullable governed fields must remain explicit JSON null."
  );

  const persistedManifest = fingerprint.contentManifest;
  expectEqual(
    results,
    "35. Historical verification hashes persisted manifest bytes directly",
    hashCanonicalManifest(persistedManifest),
    fingerprint.contentHash,
    "Historical verification must not require parsing or reserializing contentManifest."
  );

  const fieldOrderManifest = buildFrameworkCatalogueManifest(
    createValidGovernedState()
  );

  expectEqual(
    results,
    "36. Root manifest fields use fixed V1 declared order",
    Object.keys(fieldOrderManifest).join(","),
    "manifestAlgorithmVersion,framework,requirements,regulatoryFacts",
    "Root manifest object keys must use the fixed V1 field order."
  );

  expectEqual(
    results,
    "37. Framework fields use fixed V1 declared order",
    Object.keys(fieldOrderManifest.framework).join(","),
    "name,version,description",
    "Framework manifest fields must use the fixed V1 field order."
  );

  expectEqual(
    results,
    "38. Requirement fields use fixed V1 declared order",
    Object.keys(fieldOrderManifest.requirements[0]).join(","),
    "code,title,description,category,authority,sourceTitle,sourceReference,sourceUrl,effectiveFrom,mandatory,weight,active,currentApplicability",
    "Requirement manifest fields must use the fixed V1 field order."
  );

  expectEqual(
    results,
    "39. Regulatory fact fields use fixed V1 declared order",
    Object.keys(fieldOrderManifest.regulatoryFacts[0]).join(","),
    "key,name,description,valueType,allowedContextTypes,sourceTitle,sourceReference,sourceUrl,effectiveFrom,active,options",
    "Regulatory fact manifest fields must use the fixed V1 field order."
  );

  expectEqual(
    results,
    "40. Option fields use fixed V1 declared order",
    Object.keys(buildFrameworkCatalogueManifest(createOrderingGovernedState()).regulatoryFacts.find((fact) => fact.key === "test_fact")!.options[0]).join(","),
    "value,label,description,sortOrder,active",
    "Option governed fields must match the fixed V1 manifest field order."
  );

  expectEqual(
    results,
    "41. Current applicability fields use fixed V1 declared order",
    Object.keys(fieldOrderManifest.requirements[0].currentApplicability!).join(","),
    "requirementCode,version,applicabilityClass,resolutionPattern,ruleAst,ruleSchemaVersion,sourceTitle,sourceReference,sourceUrl,effectiveFrom,effectiveUntil,dependencies",
    "Current applicability manifest fields must use the fixed V1 field order."
  );

  expectEqual(
    results,
    "42. Dependency fields use fixed V1 declared order",
    Object.keys(fieldOrderManifest.requirements[0].currentApplicability!.dependencies[0]).join(","),
    "factKey,required",
    "Dependency manifest fields must use the fixed V1 field order."
  );

  for (const result of results) {
    console.log(`${result.passed ? "PASS" : "FAIL"} — ${result.name}`);
  }

  const failed = results.filter((result) => !result.passed).length;
  console.log(`Passed: ${results.length - failed}  Failed: ${failed}`);

  if (failed > 0) process.exitCode = 1;
}

run();
