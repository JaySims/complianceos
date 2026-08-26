import type {
  ExecutiveForecast,
} from "@/lib/forecast/executiveForecastEngine";

import type {
  ExecutiveDNA,
} from "@/lib/dna/executiveDNAEngine";

import type {
  ExecutiveMemoryInsight,
} from "@/lib/memory/executiveMemoryEngine";

/*
 * Executive Learning Insight
 *
 * This is the intelligence shape consumed
 * by the orchestrator.
 *
 * It is separate from the persisted
 * ExecutiveDecision type used by the
 * learning history engine.
 */

export type ExecutiveLearningInsight = {
  strongestMission: string;

  executiveInsight: string;

  confidence: number;
};

export type ExecutiveDecision = {
  title: string;

  recommendation: string;

  reasoning: string;

  confidence: number;

  projectedTrust: number;

  projectedOpportunityValue: number;

  businessRisk: string;

  priority:
    | "Critical"
    | "High"
    | "Medium"
    | "Low";
};

export type ExecutiveIntelligence = {
  executiveSummary: string;

  decision:
    ExecutiveDecision;

  forecast:
    ExecutiveForecast;

  dna:
    ExecutiveDNA;

  learning:
    ExecutiveLearningInsight;

  memory:
    ExecutiveMemoryInsight;
};

type OrchestratorInput = {
  forecast:
    ExecutiveForecast;

  dna:
    ExecutiveDNA;

  learning:
    ExecutiveLearningInsight;

  memory:
    ExecutiveMemoryInsight;
};

export function buildExecutiveIntelligence(
  input: OrchestratorInput
): ExecutiveIntelligence {
  /*
   * Determine executive priority
   * from the projected risk position.
   */

  const priority:
    ExecutiveDecision["priority"] =
      input.forecast.projectedRisk === "High"
        ? "Critical"
        : input.forecast.projectedRisk === "Medium"
        ? "High"
        : "Medium";

  /*
   * Build forecast reasoning using the
   * current ExecutiveForecast contract.
   */

  const forecastReasoning =
    `Digital Trust™ is projected to move from ${input.forecast.currentTrust}% to ${input.forecast.projectedTrust}%. ` +
    `Business risk is projected to move from ${input.forecast.currentRisk} to ${input.forecast.projectedRisk}. ` +
    `Projected enterprise value is R${input.forecast.projectedValue.toLocaleString(
      "en-ZA"
    )}.`;

  const decision:
    ExecutiveDecision = {
      title:
        "Executive AI Recommendation",

      recommendation:
        `Prioritise "${input.learning.strongestMission}" as the organisation's next executive action.`,

      reasoning:
        `${input.learning.executiveInsight} ${forecastReasoning}`,

      confidence:
        input.learning.confidence,

      projectedTrust:
        input.forecast.projectedTrust,

      projectedOpportunityValue:
        input.forecast.projectedValue,

      businessRisk:
        input.forecast.projectedRisk,

      priority,
    };

  return {
    executiveSummary:
      "Executive AI predicts continued organisational development based on Executive Memory™, Executive Learning™, Executive DNA™ and Executive Forecast™.",

    decision,

    forecast:
      input.forecast,

    dna:
      input.dna,

    learning:
      input.learning,

    memory:
      input.memory,
  };
}
