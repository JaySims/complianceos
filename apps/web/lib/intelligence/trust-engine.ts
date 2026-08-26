export interface TrustFactor {

  name: string;

  score: number;

  maxScore: number;

  explanation: string;

}

export interface TrustReport {

  totalScore: number;

  maxScore: number;

  percentage: number;

  factors: TrustFactor[];

}

export class TrustEngine {

  generateReport() : TrustReport {

    const factors: TrustFactor[] = [

      {

        name: "Organisation Identity",

        score: 20,

        maxScore: 20,

        explanation:
          "Your organisation identity has been verified."

      },

      {

        name: "Business Contacts",

        score: 12,

        maxScore: 15,

        explanation:
          "Primary business contacts have been provided."

      },

      {

        name: "Governance",

        score: 18,

        maxScore: 25,

        explanation:
          "Governance is partially complete. Director verification remains."

      },

      {

        name: "Compliance",

        score: 16,

        maxScore: 20,

        explanation:
          "Core compliance requirements are progressing."

      },

      {

        name: "Documents",

        score: 8,

        maxScore: 20,

        explanation:
          "Supporting documents are still required."

      }

    ];

    const totalScore = factors.reduce(
      (sum, factor) => sum + factor.score,
      0
    );

    const maxScore = factors.reduce(
      (sum, factor) => sum + factor.maxScore,
      0
    );

    return {

      totalScore,

      maxScore,

      percentage: Math.round(
        (totalScore / maxScore) * 100
      ),

      factors

    };

  }

}
