export type ExecutiveInsight = {
  id: string;
  priority: "high" | "medium" | "low";
  category:
    | "trust"
    | "risk"
    | "growth"
    | "funding"
    | "procurement"
    | "compliance";

  title: string;
  description: string;
};

type InsightInput = {
  trustScore: number;
  governanceComplete: boolean;
  complianceComplete: boolean;
  fundingReady: boolean;
  procurementReady: boolean;
};

export function buildExecutiveInsights(
  input: InsightInput
): ExecutiveInsight[] {

  const insights: ExecutiveInsight[] = [];

  if (!input.governanceComplete) {

    insights.push({
      id: "governance",
      priority: "high",
      category: "trust",
      title: "Governance is limiting Digital Trust™",
      description:
        "Completing Governance Verification is expected to produce the highest Trust™ improvement.",
    });

  }

  if (!input.complianceComplete) {

    insights.push({
      id: "compliance",
      priority: "high",
      category: "compliance",
      title: "Compliance profile remains incomplete",
      description:
        "Several strategic opportunities remain inaccessible until compliance readiness improves.",
    });

  }

  if (!input.fundingReady) {

    insights.push({
      id: "funding",
      priority: "medium",
      category: "funding",
      title: "Funding readiness can be improved",
      description:
        "Preparing funding documentation will increase investment readiness.",
    });

  }

  if (!input.procurementReady) {

    insights.push({
      id: "procurement",
      priority: "medium",
      category: "procurement",
      title: "Procurement opportunities remain locked",
      description:
        "Improving procurement readiness increases enterprise eligibility.",
    });

  }

  if (input.trustScore >= 90) {

    insights.push({
      id: "growth",
      priority: "low",
      category: "growth",
      title: "Executive growth opportunity identified",
      description:
        "Digital Trust™ is now strong enough to focus on strategic expansion.",
    });

  }

  return insights.sort((a, b) => {

    const weight = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return weight[b.priority] - weight[a.priority];

  });

}
