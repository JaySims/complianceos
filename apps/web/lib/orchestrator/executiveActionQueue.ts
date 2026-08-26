export type ExecutiveAction = {
  title: string;

  timeframe: "Today" | "This Week" | "This Month" | "Next Quarter";

  businessValue: number;

  confidence: number;

  impact: number;
};

export function buildExecutiveActionQueue(
  actions: ExecutiveAction[]
): ExecutiveAction[] {

  const timeframeWeight = {
    "Today": 4,
    "This Week": 3,
    "This Month": 2,
    "Next Quarter": 1,
  };

  return [...actions].sort((a, b) => {

    const scoreA =
      timeframeWeight[a.timeframe] * 100 +
      a.impact * 20 +
      a.confidence +
      a.businessValue / 100000;

    const scoreB =
      timeframeWeight[b.timeframe] * 100 +
      b.impact * 20 +
      b.confidence +
      b.businessValue / 100000;

    return scoreB - scoreA;

  });

}
