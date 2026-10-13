import { buildFrameworkCatalogueManifestFingerprint } from "@/lib/compliance/frameworkCatalogueManifest";
import { validateFrameworkCataloguePublicationIntegrity } from "@/lib/compliance/frameworkCataloguePublicationIntegrity";
import { createValidGovernedState } from "./frameworkCatalogueTestFixtures";

type TestResult = { name: string; passed: boolean };
const results: TestResult[] = [];
const record = (name: string, passed: boolean) => results.push({ name, passed });

const state = createValidGovernedState();
const approval = {
  frameworkId: state.framework.id,
  ...buildFrameworkCatalogueManifestFingerprint(state),
};

record(
  "1. Matching approved and live catalogue passes",
  validateFrameworkCataloguePublicationIntegrity({ governedState: state, approval }).success
);

const unsupported = validateFrameworkCataloguePublicationIntegrity({
  governedState: state,
  approval: { ...approval, manifestAlgorithmVersion: 2 },
});
record(
  "2. Unsupported manifest algorithm fails closed",
  !unsupported.success && unsupported.reason === "UNSUPPORTED_MANIFEST_ALGORITHM_VERSION"
);

const corrupted = validateFrameworkCataloguePublicationIntegrity({
  governedState: state,
  approval: { ...approval, contentManifest: approval.contentManifest + " " },
});
record(
  "3. Corrupted approval evidence fails closed",
  !corrupted.success && corrupted.reason === "APPROVAL_MANIFEST_HASH_MISMATCH"
);

const invalidState = createValidGovernedState();
invalidState.requirements[0].currentApplicability = null;
const invalid = validateFrameworkCataloguePublicationIntegrity({
  governedState: invalidState,
  approval,
});
record(
  "4. Structurally invalid live catalogue fails closed",
  !invalid.success && invalid.reason === "INVALID_GOVERNED_CATALOGUE_STATE"
);

const driftedState = createValidGovernedState();
driftedState.requirements[0].title = "Changed after approval";
const drifted = validateFrameworkCataloguePublicationIntegrity({
  governedState: driftedState,
  approval,
});
record(
  "5. Valid but drifted live catalogue fails closed",
  !drifted.success && drifted.reason === "LIVE_CATALOGUE_FINGERPRINT_MISMATCH"
);

const wrongFramework = validateFrameworkCataloguePublicationIntegrity({
  governedState: state,
  approval: { ...approval, frameworkId: "framework-2" },
});
record(
  "6. Approval must belong to the live framework",
  !wrongFramework.success &&
    wrongFramework.reason === "APPROVAL_FRAMEWORK_MISMATCH"
);

for (const result of results) {
  console.log(`${result.passed ? "PASS" : "FAIL"} — ${result.name}`);
}

const passed = results.filter((result) => result.passed).length;
const failed = results.length - passed;
console.log(`Passed: ${passed}  Failed: ${failed}`);
if (failed > 0) process.exitCode = 1;
