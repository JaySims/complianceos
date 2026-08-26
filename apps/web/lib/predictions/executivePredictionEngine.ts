export type PredictionInput = {
  currentTrustScore: number;

  action: string;

  estimatedValue: number;

  governanceCompleted: boolean;

  complianceCompleted: boolean;

  documentsUploaded: number;
};


export type ExecutivePrediction = {
  currentState: string;

  recommendedAction: string;

  trustScoreProjection: number;

  trustScoreIncrease: number;

  financialImpact: string;

  riskProjection: string;

  reasoning: string[];

  evidence: string[];

  predictedOutcome: string;
};


export function buildExecutivePrediction(
  input: PredictionInput
): ExecutivePrediction {


  let trustIncrease = 0;


  const reasoning: string[] = [];

  const evidence: string[] = [];


  /*
   * Governance Impact
   */

  if (!input.governanceCompleted) {

    trustIncrease += 8;

    reasoning.push(
      "Governance verification increases organisational transparency and executive confidence."
    );

    evidence.push(
      "Governance completion is currently outstanding."
    );

  }


  /*
   * Compliance Impact
   */

  if (!input.complianceCompleted) {

    trustIncrease += 7;

    reasoning.push(
      "Compliance completion improves supplier credibility and investment readiness."
    );

    evidence.push(
      "Compliance profile requires additional verification."
    );

  }


  /*
   * Document Impact
   */

  if (input.documentsUploaded < 5) {

    trustIncrease += 5;

    reasoning.push(
      "Additional verified documents strengthen Digital Trust™."
    );

    evidence.push(
      `${input.documentsUploaded}/5 required documents currently available.`
    );

  }


  const projectedScore =
    Math.min(
      input.currentTrustScore + trustIncrease,
      100
    );


  const risk =
    projectedScore >= 85
      ? "Low"
      : projectedScore >= 60
      ? "Medium"
      : "High";


  return {

    currentState:

      `Current Digital Trust™ Score is ${input.currentTrustScore}%.`,



    recommendedAction:

      input.action,



    trustScoreProjection:

      projectedScore,



    trustScoreIncrease:

      projectedScore - input.currentTrustScore,



    financialImpact:

      `R${input.estimatedValue.toLocaleString()} estimated opportunity value.`,



    riskProjection:

      risk,



    reasoning,



    evidence,



    predictedOutcome:

      `Completing this action is projected to increase Digital Trust™ from ${input.currentTrustScore}% to ${projectedScore}% and improve organisational readiness.`,

  };

}
