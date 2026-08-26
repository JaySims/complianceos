export type ConfidenceInput = {
  historicalConfidence: number;

  dnaConfidence: number;

  forecastConfidence: number;

  learningConfidence: number;
};

export type ExecutiveConfidenceMatrix = {
  overallConfidence: number;

  level: "Very High" | "High" | "Medium" | "Low";

  explanation: string;
};

export function buildExecutiveConfidenceMatrix(
  input: ConfidenceInput
): ExecutiveConfidenceMatrix {

  const overallConfidence = Math.round(
    (
      input.historicalConfidence +
      input.dnaConfidence +
      input.forecastConfidence +
      input.learningConfidence
    ) / 4
  );

  const level =
    overallConfidence >= 95
      ? "Very High"
      : overallConfidence >= 85
      ? "High"
      : overallConfidence >= 70
      ? "Medium"
      : "Low";

  return {

    overallConfidence,

    level,

    explanation:

      `Executive AI confidence is ${overallConfidence}% based on organisational history, Executive DNA™, predictive forecasting and behavioural learning.`,

  };

}
