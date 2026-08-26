export type ExecutiveRisk =
  | "Low"
  | "Medium"
  | "High";

export type ExecutiveForecast = {
  currentTrust: number;

  projectedTrust: number;

  currentRisk:
    ExecutiveRisk;

  projectedRisk:
    ExecutiveRisk;

  currentValue: number;

  projectedValue: number;
};

export function buildExecutiveForecast(
  trust: number,
  governanceComplete: boolean,
  complianceComplete: boolean,
  fundingReady: boolean,
  procurementReady: boolean
): ExecutiveForecast {
  let projectedTrust =
    trust;

  if (
    !governanceComplete
  ) {
    projectedTrust += 5;
  }

  if (
    !complianceComplete
  ) {
    projectedTrust += 5;
  }

  if (
    !fundingReady
  ) {
    projectedTrust += 4;
  }

  if (
    !procurementReady
  ) {
    projectedTrust += 4;
  }

  if (
    projectedTrust > 100
  ) {
    projectedTrust = 100;
  }

  const currentValue =
    18_000_000;

  const projectedValue =
    Math.round(
      currentValue *
        (
          1 +
          (
            projectedTrust -
            trust
          ) /
            100
        )
    );

  const currentRisk:
    ExecutiveRisk =
      trust >= 85
        ? "Low"
        : trust >= 60
        ? "Medium"
        : "High";

  const projectedRisk:
    ExecutiveRisk =
      projectedTrust >= 85
        ? "Low"
        : projectedTrust >= 60
        ? "Medium"
        : "High";

  return {
    currentTrust:
      trust,

    projectedTrust,

    currentRisk,

    projectedRisk,

    currentValue,

    projectedValue,
  };
}
