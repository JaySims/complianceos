export interface ExecutiveState {

  digitalTrust: number;

  complianceReadiness: number;

  procurementReadiness: number;

  fundingReadiness: number;

  governanceReadiness: number;

  completedSteps: number;

  totalSteps: number;

}

export interface ExecutiveRecommendation {

  title: string;

  description: string;

  impact: number;

  estimatedMinutes: number;

}

export class ExecutiveEngine {

  calculateTrust(state: ExecutiveState) {

    return Math.min(

      100,

      Math.round(

        (
          state.complianceReadiness +

          state.procurementReadiness +

          state.fundingReadiness +

          state.governanceReadiness

        ) / 4

      )

    );

  }

  getHighestPriority(state: ExecutiveState): ExecutiveRecommendation {

    if (state.governanceReadiness < 60) {

      return {

        title: "Complete Governance Verification",

        description:

          "Verifying directors unlocks procurement and increases organisational trust.",

        impact: 12,

        estimatedMinutes: 4,

      };

    }

    if (state.complianceReadiness < 60) {

      return {

        title: "Finish Compliance Setup",

        description:

          "Completing compliance increases trust and funding readiness.",

        impact: 10,

        estimatedMinutes: 5,

      };

    }

    if (state.fundingReadiness < 60) {

      return {

        title: "Improve Funding Readiness",

        description:

          "Complete financial information to unlock funding opportunities.",

        impact: 8,

        estimatedMinutes: 3,

      };

    }

    return {

      title: "Excellent Progress",

      description:

        "Continue your Executive Journey to maximise your Digital Trust Score.",

      impact: 5,

      estimatedMinutes: 2,

    };

  }

}
