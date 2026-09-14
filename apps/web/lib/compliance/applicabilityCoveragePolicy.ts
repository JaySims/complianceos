/*
 * ============================================================
 * COMPLIANCEOS — APPLICABILITY COVERAGE POLICY
 * ============================================================
 *
 * PURPOSE
 *
 * Derive visibility metadata describing how much authoritative
 * regulatory applicability scope has been resolved.
 *
 * This policy is intentionally separate from Compliance Score.
 *
 * LOCKED DOCTRINE
 *
 *   APPLICABLE      = resolved regulatory scope
 *   NOT_APPLICABLE  = resolved regulatory scope
 *   UNDETERMINED    = unresolved regulatory scope
 *
 * Compliance Score and Applicability Coverage MUST remain
 * separate concepts.
 *
 * This policy:
 *
 *   - does not mutate persistence;
 *   - does not establish authority;
 *   - does not change Compliance Score;
 *   - does not infer applicability;
 *   - does not convert UNDETERMINED into NOT_APPLICABLE;
 *   - does not collapse multiple applicability contexts into a
 *     requirement-level legal conclusion.
 *
 * ============================================================
 */

export type ApplicabilityCoverageInput = {
  applicableRequirementIds: readonly string[];
  notApplicableRequirementIds: readonly string[];
  undeterminedRequirementIds: readonly string[];
};

export type ApplicabilityCoverage = {
  applicableRequirementIds: string[];
  notApplicableRequirementIds: string[];
  undeterminedRequirementIds: string[];

  applicableCount: number;
  notApplicableCount: number;
  undeterminedCount: number;

  resolvedCount: number;
  totalDeterminationCount: number;

  coverageRatio: number | null;
  coveragePercentage: number | null;
  fullyResolved: boolean;
};

/*
 * ============================================================
 * INTERNAL HELPERS
 * ============================================================
 */

function uniqueSorted(
  values: readonly string[]
): string[] {
  return [...new Set(values)].sort();
}

function assertDisjoint(
  applicableRequirementIds: readonly string[],
  notApplicableRequirementIds: readonly string[],
  undeterminedRequirementIds: readonly string[]
): void {
  const seen = new Map<string, string>();

  const groups: Array<
    [string, readonly string[]]
  > = [
    [
      "APPLICABLE",
      applicableRequirementIds,
    ],
    [
      "NOT_APPLICABLE",
      notApplicableRequirementIds,
    ],
    [
      "UNDETERMINED",
      undeterminedRequirementIds,
    ],
  ];

  for (const [status, ids] of groups) {
    for (const requirementId of ids) {
      const existing = seen.get(requirementId);

      if (existing !== undefined) {
        throw new Error(
          [
            "Applicability coverage input is not disjoint.",
            `Requirement ${requirementId} appears as both`,
            `${existing} and ${status}.`,
          ].join(" ")
        );
      }

      seen.set(requirementId, status);
    }
  }
}

/*
 * ============================================================
 * DERIVE APPLICABILITY COVERAGE
 * ============================================================
 */

export function deriveApplicabilityCoverage(
  input: ApplicabilityCoverageInput
): ApplicabilityCoverage {
  const applicableRequirementIds =
    uniqueSorted(
      input.applicableRequirementIds
    );

  const notApplicableRequirementIds =
    uniqueSorted(
      input.notApplicableRequirementIds
    );

  const undeterminedRequirementIds =
    uniqueSorted(
      input.undeterminedRequirementIds
    );

  assertDisjoint(
    applicableRequirementIds,
    notApplicableRequirementIds,
    undeterminedRequirementIds
  );

  const applicableCount =
    applicableRequirementIds.length;

  const notApplicableCount =
    notApplicableRequirementIds.length;

  const undeterminedCount =
    undeterminedRequirementIds.length;

  const resolvedCount =
    applicableCount +
    notApplicableCount;

  const totalDeterminationCount =
    resolvedCount +
    undeterminedCount;

  /*
   * No determinations means there is no meaningful coverage
   * denominator. Do not manufacture 0% or 100% certainty.
   */
  const coverageRatio =
    totalDeterminationCount === 0
      ? null
      : resolvedCount /
        totalDeterminationCount;

  const coveragePercentage =
    coverageRatio === null
      ? null
      : coverageRatio * 100;

  const fullyResolved =
    totalDeterminationCount > 0 &&
    undeterminedCount === 0;

  return {
    applicableRequirementIds,
    notApplicableRequirementIds,
    undeterminedRequirementIds,

    applicableCount,
    notApplicableCount,
    undeterminedCount,

    resolvedCount,
    totalDeterminationCount,

    coverageRatio,
    coveragePercentage,
    fullyResolved,
  };
}
