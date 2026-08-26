export type ExecutiveInsight = {
  priority: "critical" | "high" | "medium" | "low";
  category:
    | "governance"
    | "compliance"
    | "funding"
    | "procurement"
    | "growth";

  title: string;
  explanation: string;
  expectedImpact: string;
};

export function generateExecutiveInsights() {
  const insights: ExecutiveInsight[] = [
    {
      priority: "critical",
      category: "governance",
      title: "Complete Governance Verification",
      explanation:
        "Director verification is the single highest-impact task remaining.",
      expectedImpact:
        "+9 Trust Score • Procurement eligibility • Funding readiness",
    },
    {
      priority: "high",
      category: "funding",
      title: "Prepare Funding Documents",
      explanation:
        "Your organisation is approaching investment readiness.",
      expectedImpact:
        "Unlock SEFA, IDC and private funding opportunities",
    },
  ];

  return insights;
}
