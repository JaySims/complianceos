import type {
  ExecutiveDNA,
} from "@/lib/dna/executiveDNAEngine";

import type {
  ExecutiveForecast,
} from "@/lib/forecast/executiveForecastEngine";

import type {
  ExecutiveLearningInsight,
} from "@/lib/orchestrator/executiveIntelligenceOrchestrator";

type NarrativeInput = {
  dna: ExecutiveDNA;

  forecast: ExecutiveForecast;

  learning: ExecutiveLearningInsight;
};

export function buildExecutiveNarrative(
  input: NarrativeInput
): string {
  const trustMovement =
    input.forecast.projectedTrust -
    input.forecast.currentTrust;

  const trustNarrative =
    trustMovement > 0
      ? `Digital Trust™ is projected to improve by ${trustMovement} percentage points, moving from ${input.forecast.currentTrust}% to ${input.forecast.projectedTrust}%.`
      : trustMovement < 0
      ? `Digital Trust™ is projected to decline by ${Math.abs(
          trustMovement
        )} percentage points, moving from ${input.forecast.currentTrust}% to ${input.forecast.projectedTrust}%.`
      : `Digital Trust™ is projected to remain stable at ${input.forecast.projectedTrust}%.`;

  const riskNarrative =
    `Business risk is currently ${input.forecast.currentRisk} and is projected to be ${input.forecast.projectedRisk}.`;

  const valueNarrative =
    `Projected enterprise value is R${input.forecast.projectedValue.toLocaleString(
      "en-ZA"
    )}.`;

  const learningNarrative =
    `Executive Learning™ identifies "${input.learning.strongestMission}" as the strongest current mission. ${input.learning.executiveInsight}`;

  const dnaNarrative =
    `Executive DNA™ confidence is ${input.learning.confidence}%.`;

  return [
    learningNarrative,
    trustNarrative,
    riskNarrative,
    valueNarrative,
    dnaNarrative,
  ].join(" ");
}
