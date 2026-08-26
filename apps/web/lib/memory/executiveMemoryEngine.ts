export type ExecutiveSnapshot = {
  date: string;

  trustScore: number;

  procurementReadiness: number;

  fundingReadiness: number;

  businessRisk: string;

  completedMission: string;
};

export type ExecutiveMemory = {
  history: ExecutiveSnapshot[];
};

export type ExecutiveMemoryInsight = {
  trustTrend: string;

  procurementTrend: string;

  fundingTrend: string;

  biggestImprovement: string;

  aiObservation: string;
};

export function analyseExecutiveMemory(
  memory: ExecutiveMemory
): ExecutiveMemoryInsight {

  if (memory.history.length < 2) {

    return {

      trustTrend:
        "Not enough historical data.",

      procurementTrend:
        "Not enough historical data.",

      fundingTrend:
        "Not enough historical data.",

      biggestImprovement:
        "Awaiting additional activity.",

      aiObservation:
        "Executive Memory™ has started learning your organisation.",

    };

  }

  const previous =
    memory.history[memory.history.length - 2];

  const current =
    memory.history[memory.history.length - 1];

  const trustDiff =
    current.trustScore -
    previous.trustScore;

  const procurementDiff =
    current.procurementReadiness -
    previous.procurementReadiness;

  const fundingDiff =
    current.fundingReadiness -
    previous.fundingReadiness;

  return {

    trustTrend:
      trustDiff >= 0
        ? `+${trustDiff}%`
        : `${trustDiff}%`,

    procurementTrend:
      procurementDiff >= 0
        ? `+${procurementDiff}%`
        : `${procurementDiff}%`,

    fundingTrend:
      fundingDiff >= 0
        ? `+${fundingDiff}%`
        : `${fundingDiff}%`,

    biggestImprovement:
      current.completedMission,

    aiObservation:

      `Executive AI determined that "${current.completedMission}" produced the largest organisational improvement since ${previous.date}.`,

  };

}
