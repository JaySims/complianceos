export type ExecutivePriority = {
  title: string;
  reason: string;
  impact: string;
  urgency: "Critical" | "High" | "Medium" | "Low";
};

type StrategyInput = {
  trustScore: number;
  governanceComplete: boolean;
  complianceComplete: boolean;
  fundingReady: boolean;
  procurementReady: boolean;
};

export function determineExecutivePriority(
  input: StrategyInput
): ExecutivePriority {

  if (!input.governanceComplete) {

    return {

      title: "Complete Governance Verification",

      reason:
        "Governance remains the largest constraint preventing Digital Trust™ growth.",

      impact:
        "Expected Trust increase and improved procurement eligibility.",

      urgency: "Critical",

    };

  }

  if (!input.complianceComplete) {

    return {

      title: "Complete Compliance Profile",

      reason:
        "Compliance readiness is preventing strategic expansion.",

      impact:
        "Unlock supplier and enterprise opportunities.",

      urgency: "High",

    };

  }

  if (!input.fundingReady) {

    return {

      title: "Improve Funding Readiness",

      reason:
        "Investment readiness remains below Executive standard.",

      impact:
        "Increase funding attractiveness.",

      urgency: "Medium",

    };

  }

  if (!input.procurementReady) {

    return {

      title: "Improve Procurement Readiness",

      reason:
        "Enterprise procurement opportunities remain inaccessible.",

      impact:
        "Increase market reach.",

      urgency: "Medium",

    };

  }

  return {

    title: "Accelerate Growth",

    reason:
      "Executive AI believes the organisation is now ready to focus on strategic expansion.",

    impact:
      "Maximise organisational growth.",

    urgency: "Low",

  };

}
