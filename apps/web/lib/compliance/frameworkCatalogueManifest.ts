import { createHash } from "node:crypto";

export const FRAMEWORK_CATALOGUE_MANIFEST_ALGORITHM_VERSION = 1 as const;

export const CANONICAL_APPLICABILITY_CONTEXT_TYPE_ORDER = [
  "ORGANIZATION",
  "EVENT",
  "MATTER",
  "ACTIVITY",
  "RELATIONSHIP",
  "TRANSFER",
  "SYSTEM",
  "AUTOMATED_DECISION",
] as const;

export type CanonicalJsonPrimitive = string | number | boolean | null;
export type CanonicalJsonValue =
  | CanonicalJsonPrimitive
  | CanonicalJsonValue[]
  | { [key: string]: CanonicalJsonValue };

export function compareUnicodeScalarValues(a: string, b: string): number {
  const aCodePoints = Array.from(a, (character) => character.codePointAt(0)!);
  const bCodePoints = Array.from(b, (character) => character.codePointAt(0)!);
  const length = Math.min(aCodePoints.length, bCodePoints.length);

  for (let index = 0; index < length; index += 1) {
    if (aCodePoints[index] !== bCodePoints[index]) {
      return aCodePoints[index] - bCodePoints[index];
    }
  }

  return aCodePoints.length - bCodePoints.length;
}

export function canonicalizeJson(value: CanonicalJsonValue): CanonicalJsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("NON_FINITE_NUMBER");
    }

    return Object.is(value, -0) ? 0 : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeJson(item));
  }

  const canonicalObject: { [key: string]: CanonicalJsonValue } = {};

  for (const key of Object.keys(value).sort(compareUnicodeScalarValues)) {
    canonicalObject[key] = canonicalizeJson(value[key]);
  }

  return canonicalObject;
}

export function serializeCanonicalJson(value: CanonicalJsonValue): string {
  return JSON.stringify(canonicalizeJson(value));
}

export function hashCanonicalManifest(contentManifest: string): string {
  return createHash("sha256")
    .update(contentManifest, "utf8")
    .digest("hex");
}

export type FrameworkCatalogueManifestOption = {
  value: string;
  label: string;
  description: string | null;
  sortOrder: number | null;
  active: boolean;
};

export type FrameworkCatalogueManifestFact = {
  key: string;
  name: string;
  description: string | null;
  valueType: string;
  allowedContextTypes: string[];
  sourceTitle: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  effectiveFrom: string | null;
  active: boolean;
  options: FrameworkCatalogueManifestOption[];
};

export type FrameworkCatalogueManifestDependency = {
  factKey: string;
  required: boolean;
};

export type FrameworkCatalogueManifestApplicability = {
  requirementCode: string;
  version: number;
  applicabilityClass: string;
  resolutionPattern: string;
  ruleAst: CanonicalJsonValue;
  ruleSchemaVersion: string;
  sourceTitle: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  dependencies: FrameworkCatalogueManifestDependency[];
};

export type FrameworkCatalogueManifestRequirement = {
  code: string;
  title: string;
  description: string | null;
  category: string;
  authority: string | null;
  sourceTitle: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  effectiveFrom: string | null;
  mandatory: boolean;
  weight: number;
  active: boolean;
  currentApplicability: FrameworkCatalogueManifestApplicability | null;
};

export type FrameworkCatalogueManifestV1 = {
  manifestAlgorithmVersion: typeof FRAMEWORK_CATALOGUE_MANIFEST_ALGORITHM_VERSION;
  framework: {
    name: string;
    version: string | null;
    description: string | null;
  };
  requirements: FrameworkCatalogueManifestRequirement[];
  regulatoryFacts: FrameworkCatalogueManifestFact[];
};

export type FrameworkCatalogueManifestFingerprint = {
  contentManifest: string;
  contentHash: string;
  manifestAlgorithmVersion: typeof FRAMEWORK_CATALOGUE_MANIFEST_ALGORITHM_VERSION;
};

export type FrameworkCatalogueGovernedOption = {
  value: string;
  label: string;
  description: string | null;
  sortOrder: number | null;
  active: boolean;
};

export type FrameworkCatalogueGovernedFact = {
  id: string;
  frameworkId: string;
  key: string;
  name: string;
  description: string | null;
  valueType: string;
  allowedContextTypes: string[];
  sourceTitle: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  effectiveFrom: Date | null;
  active: boolean;
  options: FrameworkCatalogueGovernedOption[];
};

export type FrameworkCatalogueGovernedDependency = {
  factDefinitionId: string;
  required: boolean;
};

export type FrameworkCatalogueGovernedApplicability = {
  requirementId: string;
  version: number;
  status: string;
  applicabilityClass: string;
  resolutionPattern: string;
  ruleAst: CanonicalJsonValue;
  ruleSchemaVersion: string;
  sourceTitle: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
  dependencies: FrameworkCatalogueGovernedDependency[];
};

export type FrameworkCatalogueGovernedRequirement = {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string | null;
  category: string;
  authority: string | null;
  sourceTitle: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  effectiveFrom: Date | null;
  mandatory: boolean;
  weight: number;
  active: boolean;
  currentApplicability: FrameworkCatalogueGovernedApplicability | null;
};

export type FrameworkCatalogueGovernedState = {
  framework: {
    id: string;
    name: string;
    version: string | null;
    description: string | null;
  };
  requirements: FrameworkCatalogueGovernedRequirement[];
  regulatoryFacts: FrameworkCatalogueGovernedFact[];
};
export function canonicalizeApplicabilityContextTypes(
  values: readonly string[]
): string[] {
  const allowed = new Set<string>(
    CANONICAL_APPLICABILITY_CONTEXT_TYPE_ORDER
  );
  const seen = new Set<string>();

  for (const value of values) {
    if (!allowed.has(value)) {
      throw new Error("INVALID_APPLICABILITY_CONTEXT_TYPE");
    }

    if (seen.has(value)) {
      throw new Error("DUPLICATE_APPLICABILITY_CONTEXT_TYPE");
    }

    seen.add(value);
  }

  return CANONICAL_APPLICABILITY_CONTEXT_TYPE_ORDER.filter(
    (value) => seen.has(value)
  );
}

function assertUniqueStableIdentities(
  values: readonly string[],
  failureReason: string
): void {
  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(failureReason);
    }
    seen.add(value);
  }
}

export function validateFrameworkCatalogueGovernedState(
  state: FrameworkCatalogueGovernedState
): void {
  const frameworkId = state.framework.id;

  assertUniqueStableIdentities(
    state.requirements.map((requirement) => requirement.code),
    "DUPLICATE_REQUIREMENT_CODE"
  );
  assertUniqueStableIdentities(
    state.regulatoryFacts.map((fact) => fact.key),
    "DUPLICATE_REGULATORY_FACT_KEY"
  );

  const factsById = new Map(
    state.regulatoryFacts.map((fact) => [fact.id, fact])
  );

  for (const requirement of state.requirements) {
    if (requirement.frameworkId !== frameworkId) {
      throw new Error("REQUIREMENT_FRAMEWORK_MISMATCH");
    }

    const applicability = requirement.currentApplicability;

    if (requirement.active && applicability === null) {
      throw new Error("ACTIVE_REQUIREMENT_MISSING_CURRENT_APPLICABILITY");
    }

    if (applicability === null) {
      continue;
    }

    if (applicability.requirementId !== requirement.id) {
      throw new Error("CURRENT_APPLICABILITY_REQUIREMENT_MISMATCH");
    }

    if (applicability.status !== "APPROVED") {
      throw new Error("CURRENT_APPLICABILITY_NOT_APPROVED");
    }

    assertUniqueStableIdentities(
      applicability.dependencies.map(
        (dependency) => dependency.factDefinitionId
      ),
      "DUPLICATE_APPLICABILITY_DEPENDENCY"
    );

    for (const dependency of applicability.dependencies) {
      const fact = factsById.get(dependency.factDefinitionId);

      if (!fact) {
        throw new Error("APPLICABILITY_DEPENDENCY_FACT_NOT_FOUND");
      }

      if (fact.frameworkId !== frameworkId) {
        throw new Error("APPLICABILITY_DEPENDENCY_FRAMEWORK_MISMATCH");
      }
    }
  }

  for (const fact of state.regulatoryFacts) {
    if (fact.frameworkId !== frameworkId) {
      throw new Error("REGULATORY_FACT_FRAMEWORK_MISMATCH");
    }

    assertUniqueStableIdentities(
      fact.options.map((option) => option.value),
      "DUPLICATE_REGULATORY_FACT_OPTION_VALUE"
    );
  }
}

export function canonicalizeManifestNumber(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("NON_FINITE_MANIFEST_NUMBER");
  }

  return Object.is(value, -0) ? 0 : value;
}

export function serializeManifestDate(value: Date | null): string | null {
  if (value === null) {
    return null;
  }

  if (!Number.isFinite(value.getTime())) {
    throw new Error("INVALID_MANIFEST_DATE");
  }

  return value.toISOString();
}

function sortByStableString<T>(
  values: readonly T[],
  select: (value: T) => string
): T[] {
  return [...values].sort((left, right) =>
    compareUnicodeScalarValues(select(left), select(right))
  );
}

export function buildFrameworkCatalogueManifest(
  state: FrameworkCatalogueGovernedState
): FrameworkCatalogueManifestV1 {
  validateFrameworkCatalogueGovernedState(state);

  const factsById = new Map(
    state.regulatoryFacts.map((fact) => [fact.id, fact])
  );

  const regulatoryFacts = sortByStableString(
    state.regulatoryFacts,
    (fact) => fact.key
  ).map((fact): FrameworkCatalogueManifestFact => ({
    key: fact.key,
    name: fact.name,
    description: fact.description,
    valueType: fact.valueType,
    allowedContextTypes: canonicalizeApplicabilityContextTypes(
      fact.allowedContextTypes
    ),
    sourceTitle: fact.sourceTitle,
    sourceReference: fact.sourceReference,
    sourceUrl: fact.sourceUrl,
    effectiveFrom: serializeManifestDate(fact.effectiveFrom),
    active: fact.active,
    options: sortByStableString(
      fact.options,
      (option) => option.value
    ).map((option) => ({
      value: option.value,
      label: option.label,
      description: option.description,
      sortOrder: option.sortOrder === null ? null : canonicalizeManifestNumber(option.sortOrder),
      active: option.active,
    })),
  }));

  const requirements = sortByStableString(
    state.requirements,
    (requirement) => requirement.code
  ).map((requirement): FrameworkCatalogueManifestRequirement => {
    const applicability = requirement.currentApplicability;

    const currentApplicability = applicability === null
      ? null
      : {
          requirementCode: requirement.code,
          version: canonicalizeManifestNumber(applicability.version),
          applicabilityClass: applicability.applicabilityClass,
          resolutionPattern: applicability.resolutionPattern,
          ruleAst: canonicalizeJson(applicability.ruleAst),
          ruleSchemaVersion: applicability.ruleSchemaVersion,
          sourceTitle: applicability.sourceTitle,
          sourceReference: applicability.sourceReference,
          sourceUrl: applicability.sourceUrl,
          effectiveFrom: serializeManifestDate(applicability.effectiveFrom),
          effectiveUntil: serializeManifestDate(applicability.effectiveUntil),
          dependencies: sortByStableString(
            applicability.dependencies,
            (dependency) => factsById.get(dependency.factDefinitionId)!.key
          ).map((dependency) => ({
            factKey: factsById.get(dependency.factDefinitionId)!.key,
            required: dependency.required,
          })),
        };

    return {
      code: requirement.code,
      title: requirement.title,
      description: requirement.description,
      category: requirement.category,
      authority: requirement.authority,
      sourceTitle: requirement.sourceTitle,
      sourceReference: requirement.sourceReference,
      sourceUrl: requirement.sourceUrl,
      effectiveFrom: serializeManifestDate(requirement.effectiveFrom),
      mandatory: requirement.mandatory,
      weight: canonicalizeManifestNumber(requirement.weight),
      active: requirement.active,
      currentApplicability,
    };
  });

  return {
    manifestAlgorithmVersion: FRAMEWORK_CATALOGUE_MANIFEST_ALGORITHM_VERSION,
    framework: {
      name: state.framework.name,
      version: state.framework.version,
      description: state.framework.description,
    },
    requirements,
    regulatoryFacts,
  };
}

export function serializeFrameworkCatalogueManifest(
  manifest: FrameworkCatalogueManifestV1
): string {
  return JSON.stringify(manifest);
}

export function buildFrameworkCatalogueManifestFingerprint(
  state: FrameworkCatalogueGovernedState
): FrameworkCatalogueManifestFingerprint {
  const manifest = buildFrameworkCatalogueManifest(state);
  const contentManifest = serializeFrameworkCatalogueManifest(manifest);

  return {
    contentManifest,
    contentHash: hashCanonicalManifest(contentManifest),
    manifestAlgorithmVersion: FRAMEWORK_CATALOGUE_MANIFEST_ALGORITHM_VERSION,
  };
}
