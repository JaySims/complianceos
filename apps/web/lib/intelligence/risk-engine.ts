export type RiskLevel =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

export interface BusinessRisk {

  id: string;

  title: string;

  level: RiskLevel;

  impact: string;

  recommendation: string;

  estimatedTrustLoss: number;

}

export class RiskEngine {

  generate(): BusinessRisk[] {

    return [

      {

        id: "governance",

        title: "Governance Verification Incomplete",

        level: "High",

        impact:
          "Government procurement and investor confidence may be reduced.",

        recommendation:
          "Complete director verification immediately.",

        estimatedTrustLoss: 12

      },

      {

        id: "documents",

        title: "Supporting Documents Outstanding",

        level: "Medium",

        impact:
          "Verification cannot be completed until all required documents are uploaded.",

        recommendation:
          "Upload remaining supporting documents.",

        estimatedTrustLoss: 8

      },

      {

        id: "tax",

        title: "Tax Compliance Not Confirmed",

        level: "High",

        impact:
          "Funding applications and procurement opportunities may be restricted.",

        recommendation:
          "Upload a valid Tax Clearance Certificate.",

        estimatedTrustLoss: 10

      },

      {

        id: "popia",

        title: "POPIA Documentation Missing",

        level: "Low",

        impact:
          "Data protection readiness cannot yet be verified.",

        recommendation:
          "Complete POPIA compliance documentation.",

        estimatedTrustLoss: 4

      }

    ];

  }

}
