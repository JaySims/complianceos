export type ExecutiveContext = {

  organisation: {

    name: string;

    trustScore: number;

    complianceScore: number;

    procurementScore: number;

    fundingScore: number;

  };

  executive: {

    name: string;

    role: string;

  };

  priorities: string[];

};

export function getExecutiveContext(): ExecutiveContext {

  return {

    organisation: {

      name: "ComplianceOS Demo Organisation",

      trustScore: 82,

      complianceScore: 91,

      procurementScore: 68,

      fundingScore: 74,

    },

    executive: {

      name: "Simphiwe",

      role: "Founder & CEO",

    },

    priorities: [

      "Complete Governance Verification",

      "Increase Digital Trust",

      "Unlock Procurement",

      "Prepare for Funding",

    ],

  };

}
