export interface BusinessOpportunity {

  id: string;

  title: string;

  category:
    | "Funding"
    | "Procurement"
    | "Investment"
    | "Partnership";

  confidence: number;

  description: string;

  requirements: string[];

}

export class OpportunityEngine {

  generate() : BusinessOpportunity[] {

    return [

      {

        id: "idc",

        title: "IDC SME Funding",

        category: "Funding",

        confidence: 91,

        description:
          "Your current business profile indicates potential eligibility for Industrial Development Corporation funding.",

        requirements: [

          "Governance Verification",

          "Financial Statements",

          "Tax Clearance"

        ]

      },

      {

        id: "sefa",

        title: "SEFA Business Finance",

        category: "Funding",

        confidence: 88,

        description:
          "Your organisation appears suitable for SEFA funding programmes.",

        requirements: [

          "Business Registration",

          "Bank Confirmation",

          "Compliance Verification"

        ]

      },

      {

        id: "procurement",

        title: "Government Procurement",

        category: "Procurement",

        confidence: 82,

        description:
          "Complete your compliance profile to become procurement-ready.",

        requirements: [

          "Digital Trust 80%+",

          "Tax Clearance",

          "CSD Registration"

        ]

      },

      {

        id: "partnership",

        title: "Enterprise Supplier Development",

        category: "Partnership",

        confidence: 79,

        description:
          "Your organisation may qualify for supplier development partnerships.",

        requirements: [

          "Governance",

          "Compliance",

          "Verified Documents"

        ]

      }

    ];

  }

}
