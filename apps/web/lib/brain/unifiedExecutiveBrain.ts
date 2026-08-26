export type ExecutiveBrainState = {

  organisationStatus: "Excellent" | "Healthy" | "Needs Attention";

  executivePriority: string;

  executiveConfidence: number;

  trustScore: number;

  missionProgress: number;

};

type Input = {

  trustScore: number;

  missionProgress: number;

};

export function buildExecutiveBrain(
  input: Input
): ExecutiveBrainState {

  let organisationStatus:
    ExecutiveBrainState["organisationStatus"];

  if (input.trustScore >= 90) {

    organisationStatus = "Excellent";

  } else if (input.trustScore >= 70) {

    organisationStatus = "Healthy";

  } else {

    organisationStatus = "Needs Attention";

  }

  return {

    organisationStatus,

    executivePriority:
      "Complete Governance Verification",

    executiveConfidence: 97,

    trustScore: input.trustScore,

    missionProgress: input.missionProgress,

  };

}
