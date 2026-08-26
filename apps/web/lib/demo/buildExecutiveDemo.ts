import {
  buildExecutiveForecast,
} from "@/lib/forecast/executiveForecastEngine";

import {
  buildExecutiveDNA,
} from "@/lib/dna/executiveDNAEngine";

import {
  buildExecutiveBrain,
} from "@/lib/orchestrator/buildExecutiveIntelligence";

export function buildExecutiveDemo() {
  const forecast =
    buildExecutiveForecast(
      91,
      true,
      true,
      true,
      false
    );

  const dna =
    buildExecutiveDNA({
      averageTrustIncrease: 8,
      averageProcurementIncrease: 12,
      averageFundingIncrease: 6,
      confidence: 97,
    });

  const learning = {
    strongestMission:
      "Governance Verification",

    executiveInsight:
      "Governance Verification consistently delivers the strongest organisational improvement.",

    confidence: 97,
  };

  const memory = {
    totalMissions: 42,

    completedMissions: 39,

    averageTrustIncrease: 8,

    executiveMemory:
      "Organisation has demonstrated consistently improving governance behaviour.",
  };

  return buildExecutiveBrain({
    forecast,
    dna,
    learning,
    memory,
  });
}
