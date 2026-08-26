export type ExecutiveDecision = {
  recommendationId: string;
  accepted: boolean;
  timestamp: string;
};

const STORAGE_KEY = "complianceos.executive.learning";

export function recordExecutiveDecision(
  decision: ExecutiveDecision
): void {

  if (typeof window === "undefined") return;

  const existing = loadExecutiveLearning();

  existing.push(decision);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(existing)
  );

}

export function loadExecutiveLearning(): ExecutiveDecision[] {

  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return [];

  try {

    return JSON.parse(raw);

  } catch {

    return [];

  }

}

export function learningStatistics() {

  const decisions = loadExecutiveLearning();

  const accepted =
    decisions.filter(d => d.accepted).length;

  const rejected =
    decisions.length - accepted;

  const acceptanceRate =
    decisions.length === 0
      ? 0
      : Math.round(
          (accepted / decisions.length) * 100
        );

  return {

    total: decisions.length,

    accepted,

    rejected,

    acceptanceRate,

  };

}
