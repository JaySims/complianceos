export type ExecutivePriority = {
  title: string;

  businessValue: number;

  confidence: number;

  impact: number;

  priorityScore: number;
};

export function rankExecutivePriorities(
  priorities: ExecutivePriority[]
): ExecutivePriority[] {

  return [...priorities].sort((a, b) => {

    const scoreA =
      a.priorityScore +
      a.businessValue / 100000 +
      a.confidence +
      a.impact * 5;

    const scoreB =
      b.priorityScore +
      b.businessValue / 100000 +
      b.confidence +
      b.impact * 5;

    return scoreB - scoreA;

  });

}
