export type ExecutiveMission = {
  title: string;
  description: string;
  impact: string;
  estimatedTime: string;
  confidence: number;
  priority: "Critical" | "High" | "Medium";
};

type MissionInput = {
  trustScore: number;
  governanceComplete: boolean;
  complianceComplete: boolean;
  fundingReady: boolean;
  procurementReady: boolean;
};

export function buildExecutiveMission(
  input: MissionInput
): ExecutiveMission {

  if (!input.governanceComplete) {

    return {
      title: "Complete Governance Verification",
      description:
        "Verify governance information to unlock procurement and funding readiness.",
      impact: "Unlock up to R21,200,000 in opportunities.",
      estimatedTime: "18 mins",
      confidence: 97,
      priority: "Critical",
    };

  }

  if (!input.complianceComplete) {

    return {
      title: "Complete Compliance Centre",
      description:
        "Finish compliance requirements to increase organisational trust.",
      impact: "Increase Digital Trust™ by approximately 8%.",
      estimatedTime: "25 mins",
      confidence: 94,
      priority: "High",
    };

  }

  if (!input.procurementReady) {

    return {
      title: "Prepare Procurement Profile",
      description:
        "Complete supplier readiness for enterprise procurement.",
      impact: "Unlock enterprise supplier opportunities.",
      estimatedTime: "15 mins",
      confidence: 91,
      priority: "High",
    };

  }

  if (!input.fundingReady) {

    return {
      title: "Complete Funding Readiness",
      description:
        "Improve investor readiness and funding eligibility.",
      impact: "Increase investment readiness.",
      estimatedTime: "20 mins",
      confidence: 89,
      priority: "Medium",
    };

  }

  return {

    title: "Maintain Executive Excellence",

    description:
      "All major readiness indicators are complete. Continue monitoring opportunities.",

    impact:
      "Focus on growth, partnerships and expansion.",

    estimatedTime: "10 mins",

    confidence: 99,

    priority: "Medium",

  };

}
