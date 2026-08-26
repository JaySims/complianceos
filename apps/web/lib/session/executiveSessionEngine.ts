export type ExecutiveSessionSummaryInput = {
  previousTrust: number;

  currentTrust: number;

  previousConfidence: number;

  currentConfidence: number;

  completedMission: string;

  newOpportunityValue: number;

  nextMission: string;
};

export type ExecutiveSessionSummary = {
  summary: string;

  trustChange: number;

  confidenceChange: number;
};

/*
 * Build the Executive AI summary shown
 * when an organisation returns to
 * ComplianceOS.
 *
 * This engine is intentionally pure:
 *
 * input
 *   ↓
 * comparison
 *   ↓
 * executive narrative
 *
 * It does not read localStorage,
 * mutate state, or control navigation.
 */

export function buildExecutiveSessionSummary(
  input: ExecutiveSessionSummaryInput
): ExecutiveSessionSummary {
  const trustChange =
    calculateChange(
      input.previousTrust,
      input.currentTrust
    );

  const confidenceChange =
    calculateChange(
      input.previousConfidence,
      input.currentConfidence
    );

  const summary =
    buildSessionNarrative({
      ...input,

      trustChange,

      confidenceChange,
    });

  return {
    summary,

    trustChange,

    confidenceChange,
  };
}

type SessionNarrativeInput =
  ExecutiveSessionSummaryInput & {
    trustChange: number;

    confidenceChange: number;
  };

function buildSessionNarrative(
  input: SessionNarrativeInput
): string {
  const statements: string[] = [];

  /*
   * Completed mission.
   */

  if (
    input.completedMission.trim()
  ) {
    statements.push(
      `${input.completedMission} was completed since your previous executive session.`
    );
  }

  /*
   * Digital Trust movement.
   */

  if (
    input.trustChange > 0
  ) {
    statements.push(
      `Digital Trust™ improved by ${input.trustChange} percentage points and now stands at ${normalizeScore(
        input.currentTrust
      )}%.`
    );
  } else if (
    input.trustChange < 0
  ) {
    statements.push(
      `Digital Trust™ decreased by ${Math.abs(
        input.trustChange
      )} percentage points and now stands at ${normalizeScore(
        input.currentTrust
      )}%.`
    );
  } else {
    statements.push(
      `Digital Trust™ remains stable at ${normalizeScore(
        input.currentTrust
      )}%.`
    );
  }

  /*
   * Executive confidence movement.
   */

  if (
    input.confidenceChange > 0
  ) {
    statements.push(
      `Executive confidence increased by ${input.confidenceChange} percentage points to ${normalizeScore(
        input.currentConfidence
      )}%.`
    );
  } else if (
    input.confidenceChange < 0
  ) {
    statements.push(
      `Executive confidence decreased by ${Math.abs(
        input.confidenceChange
      )} percentage points to ${normalizeScore(
        input.currentConfidence
      )}%.`
    );
  } else {
    statements.push(
      `Executive confidence remains stable at ${normalizeScore(
        input.currentConfidence
      )}%.`
    );
  }

  /*
   * Newly identified opportunity.
   */

  if (
    Number.isFinite(
      input.newOpportunityValue
    ) &&
    input.newOpportunityValue > 0
  ) {
    statements.push(
      `Executive AI identified R${formatCurrency(
        input.newOpportunityValue
      )} in new opportunity value.`
    );
  }

  /*
   * Recommended next mission.
   */

  if (
    input.nextMission.trim()
  ) {
    statements.push(
      `Your recommended next mission is ${input.nextMission}.`
    );
  }

  return statements.join(
    "\n\n"
  );
}

/*
 * Calculate movement between two
 * percentage-based Executive metrics.
 */

function calculateChange(
  previousValue: number,
  currentValue: number
): number {
  if (
    !Number.isFinite(
      previousValue
    ) ||
    !Number.isFinite(
      currentValue
    )
  ) {
    return 0;
  }

  return Math.round(
    currentValue -
      previousValue
  );
}

/*
 * Prevent malformed demo/state values
 * from producing impossible percentages
 * in the narrative.
 */

function normalizeScore(
  value: number
): number {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        value
      )
    )
  );
}

/*
 * Format South African Rand values
 * consistently for Executive narrative.
 */

function formatCurrency(
  value: number
): string {
  return Math.round(
    value
  ).toLocaleString(
    "en-ZA"
  );
}
