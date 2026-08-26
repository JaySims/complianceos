import { TrustReport } from "./trust-engine";

export interface ExecutiveRecommendation {

  id: string;

  title: string;

  description: string;

  impact: number;

  priority: "Critical" | "High" | "Medium" | "Low";

  estimatedMinutes: number;

  unlocks: string[];

}

export class RecommendationEngine {

  generate(report: TrustReport): ExecutiveRecommendation {

    const governance = report.factors.find(
      factor => factor.name === "Governance"
    );

    const documents = report.factors.find(
      factor => factor.name === "Documents"
    );

    if (
      governance &&
      governance.score < governance.maxScore
    ) {

      return {

        id: "governance",

        title: "Complete Governance Verification",

        description:
          "Director verification is the single highest-impact activity available.",

        impact: 12,

        priority: "Critical",

        estimatedMinutes: 4,

        unlocks: [

          "Digital Trust",

          "Government Procurement",

          "Investor Confidence",

          "Funding"

        ]

      };

    }

    if (
      documents &&
      documents.score < documents.maxScore
    ) {

      return {

        id: "documents",

        title: "Upload Outstanding Documents",

        description:
          "Supporting documentation increases trust and compliance readiness.",

        impact: 10,

        priority: "High",

        estimatedMinutes: 5,

        unlocks: [

          "Compliance",

          "Funding",

          "Verification"

        ]

      };

    }

    return {

      id: "optimise",

      title: "Continue Executive Journey",

      description:
        "Your organisation is progressing well. Continue improving your Digital Trust profile.",

      impact: 5,

      priority: "Medium",

      estimatedMinutes: 3,

      unlocks: [

        "Business Growth"

      ]

    };

  }

}
