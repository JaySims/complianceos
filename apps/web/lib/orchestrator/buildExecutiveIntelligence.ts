import {
  buildExecutiveIntelligence,
} from "./executiveIntelligenceOrchestrator";

import {
  buildExecutiveConfidenceMatrix,
} from "./executiveConfidenceMatrix";

import {
  buildExecutiveActionQueue,
} from "./executiveActionQueue";

import {
  buildExecutiveNarrative,
} from "./executiveNarrativeEngine";

export function buildExecutiveBrain(input: any) {

  const confidence =
    buildExecutiveConfidenceMatrix({

      historicalConfidence:
        input.forecast.confidence,

      dnaConfidence:
        input.dna.executiveConfidence,

      forecastConfidence:
        input.forecast.confidence,

      learningConfidence:
        input.learning.confidence,

    });

  const queue =
    buildExecutiveActionQueue([
      {

        title:
          input.learning.strongestMission,

        timeframe:
          "Today",

        businessValue:
          input.forecast.projectedOpportunityValue,

        confidence:
          confidence.overallConfidence,

        impact:
          5,

      },
    ]);

  const narrative =
    buildExecutiveNarrative({

      dna:
        input.dna,

      learning:
        input.learning,

      forecast:
        input.forecast,

    });

  const executive =
    buildExecutiveIntelligence({

      forecast:
        input.forecast,

      dna:
        input.dna,

      learning:
        input.learning,

      memory:
        input.memory,

    });

  return {

    ...executive,

    confidence,

    queue,

    narrative,

  };

}
