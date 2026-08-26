import { ExecutiveIntelligence } from "@/lib/intelligence/executiveEngine";

export interface ExecutiveDecision {

  executiveHealth: number;

  organisationStatus:
    | "Startup"
    | "Growing"
    | "Investment Ready"
    | "Executive Ready";

  investmentReadiness: number;

  procurementReadiness: number;

  recommendation: string;

}

export function calculateExecutiveDecision(
  intelligence: ExecutiveIntelligence
): ExecutiveDecision {

  const executiveHealth = Math.round(

    (

      intelligence.digitalTrust +

      intelligence.complianceHealth +

      intelligence.procurementReadiness +

      intelligence.fundingReadiness +

      intelligence.aiConfidence

    ) / 5

  );

  let organisationStatus:
    | "Startup"
    | "Growing"
    | "Investment Ready"
    | "Executive Ready";

  if (executiveHealth >= 90) {

    organisationStatus = "Executive Ready";

  } else if (executiveHealth >= 75) {

    organisationStatus = "Investment Ready";

  } else if (executiveHealth >= 55) {

    organisationStatus = "Growing";

  } else {

    organisationStatus = "Startup";

  }

  let recommendation = "";

  if (intelligence.businessRisk === "High") {

    recommendation =
      "Reduce business risk before pursuing funding.";

  } else if (intelligence.complianceHealth < 80) {

    recommendation =
      "Complete compliance activities.";

  } else if (intelligence.procurementReadiness < 80) {

    recommendation =
      "Improve procurement readiness.";

  } else if (intelligence.fundingReadiness < 80) {

    recommendation =
      "Increase investment readiness.";

  } else {

    recommendation =
      "Organisation is operating at Executive level.";

  }

  return {

    executiveHealth,

    organisationStatus,

    investmentReadiness:
      intelligence.fundingReadiness,

    procurementReadiness:
      intelligence.procurementReadiness,

    recommendation,

  };

}
