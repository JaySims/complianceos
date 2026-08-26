export type ExecutiveDNAInput = {
  averageTrustIncrease: number;

  averageProcurementIncrease: number;

  averageFundingIncrease: number;

  confidence: number;
};

export type ExecutiveDNA = {
  growthStyle: string;

  executionStyle: string;

  complianceBehaviour: string;

  procurementBehaviour: string;

  fundingBehaviour: string;

  executiveConfidence: number;

  executiveProfile: string;
};

export function buildExecutiveDNA(
  input: ExecutiveDNAInput
): ExecutiveDNA {

  const growthStyle =
    input.averageTrustIncrease >= 7
      ? "Accelerating"
      : input.averageTrustIncrease >= 4
      ? "Growing"
      : "Developing";

  const executionStyle =
    input.confidence >= 90
      ? "Fast Execution"
      : input.confidence >= 75
      ? "Consistent Execution"
      : "Emerging Execution";

  const complianceBehaviour =
    input.averageTrustIncrease >= 6
      ? "Highly Consistent"
      : "Improving";

  const procurementBehaviour =
    input.averageProcurementIncrease >= 8
      ? "Enterprise Ready"
      : "Improving";

  const fundingBehaviour =
    input.averageFundingIncrease >= 8
      ? "High Potential"
      : "Growing";

  return {

    growthStyle,

    executionStyle,

    complianceBehaviour,

    procurementBehaviour,

    fundingBehaviour,

    executiveConfidence:
      input.confidence,

    executiveProfile:

      `Executive AI has identified a ${growthStyle.toLowerCase()} organisation with ${executionStyle.toLowerCase()}, ${complianceBehaviour.toLowerCase()} compliance behaviour and ${fundingBehaviour.toLowerCase()} funding potential.`,

  };

}
