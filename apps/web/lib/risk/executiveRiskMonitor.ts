export type ExecutiveRisk = {
  id: string;
  level: "Low" | "Medium" | "High" | "Critical";
  title: string;
  description: string;
  recommendation: string;
};

type RiskInput = {
  trustScore: number;
  governanceComplete: boolean;
  complianceComplete: boolean;
  fundingReady: boolean;
  procurementReady: boolean;
};

export function buildExecutiveRisks(
  input: RiskInput
): ExecutiveRisk[] {

  const risks: ExecutiveRisk[] = [];

  if (!input.governanceComplete) {

    risks.push({

      id: "governance",

      level: "Critical",

      title: "Governance Risk",

      description:
        "Governance Verification remains incomplete and is the primary blocker to organisational trust growth.",

      recommendation:
        "Complete Governance Verification immediately.",

    });

  }

  if (!input.complianceComplete) {

    risks.push({

      id: "compliance",

      level: "High",

      title: "Compliance Risk",

      description:
        "Compliance readiness is below Executive standard.",

      recommendation:
        "Complete Compliance Profile.",

    });

  }

  if (!input.procurementReady) {

    risks.push({

      id: "procurement",

      level: "Medium",

      title: "Procurement Risk",

      description:
        "Organisation remains ineligible for several procurement opportunities.",

      recommendation:
        "Improve Procurement Readiness.",

    });

  }

  if (!input.fundingReady) {

    risks.push({

      id: "funding",

      level: "Medium",

      title: "Funding Risk",

      description:
        "Funding readiness limits investment opportunities.",

      recommendation:
        "Prepare funding documentation.",

    });

  }

  if (risks.length === 0) {

    risks.push({

      id: "healthy",

      level: "Low",

      title: "Healthy Organisation",

      description:
        "Executive AI has not detected any significant operational risks.",

      recommendation:
        "Focus on strategic expansion.",

    });

  }

  return risks;

}
