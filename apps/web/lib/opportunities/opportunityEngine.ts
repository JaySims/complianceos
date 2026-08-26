export type Opportunity = {
  id: string;
  title: string;
  category: "Funding" | "Procurement" | "Growth" | "Investment";
  value: number;
  confidence: number;
  priority: "Critical" | "High" | "Medium";
  estimatedTime: string;
};

type OpportunityInput = {
  trustScore: number;
  governanceComplete: boolean;
  complianceComplete: boolean;
  fundingReady: boolean;
  procurementReady: boolean;
};

export function buildOpportunityRadar(
  input: OpportunityInput
): Opportunity[] {

  const opportunities: Opportunity[] = [];

  if (!input.procurementReady) {

    opportunities.push({
      id: "supplier",
      title: "Enterprise Supplier Programme",
      category: "Procurement",
      value: 18000000,
      confidence: 95,
      priority: "Critical",
      estimatedTime: "18 mins",
    });

  }

  if (!input.fundingReady) {

    opportunities.push({
      id: "funding",
      title: "SME Growth Funding",
      category: "Funding",
      value: 9500000,
      confidence: 92,
      priority: "High",
      estimatedTime: "25 mins",
    });

  }

  if (!input.governanceComplete) {

    opportunities.push({
      id: "governance",
      title: "Unlock Enterprise Governance",
      category: "Growth",
      value: 3200000,
      confidence: 97,
      priority: "Critical",
      estimatedTime: "18 mins",
    });

  }

  if (input.trustScore >= 80) {

    opportunities.push({
      id: "investment",
      title: "Investor Readiness",
      category: "Investment",
      value: 50000000,
      confidence: 88,
      priority: "Medium",
      estimatedTime: "45 mins",
    });

  }

  return opportunities.sort(
    (a, b) => b.value - a.value
  );

}
