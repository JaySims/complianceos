export type ExecutiveReasoning = {
  summary: string;
  evidence: string[];
  impact: string[];
};

export function buildExecutiveReasoning(
  trustScore: number,
  governanceComplete: boolean,
  complianceComplete: boolean,
  fundingReady: boolean,
  procurementReady: boolean
): ExecutiveReasoning {

  const evidence: string[] = [];
  const impact: string[] = [];

  if (!governanceComplete) {
    evidence.push(
      "Governance Verification has not been completed."
    );

    impact.push(
      "Completing governance will increase organisational credibility."
    );
  }

  if (!complianceComplete) {
    evidence.push(
      "Compliance profile is incomplete."
    );

    impact.push(
      "Completing compliance improves supplier eligibility."
    );
  }

  if (!fundingReady) {
    evidence.push(
      "Funding readiness requirements remain outstanding."
    );

    impact.push(
      "Funding readiness unlocks investment opportunities."
    );
  }

  if (!procurementReady) {
    evidence.push(
      "Procurement profile has not reached Executive standard."
    );

    impact.push(
      "Procurement readiness improves access to enterprise opportunities."
    );
  }

  if (
    governanceComplete &&
    complianceComplete &&
    fundingReady &&
    procurementReady
  ) {
    evidence.push(
      "All Executive readiness checks have been completed."
    );

    impact.push(
      "Organisation is positioned for accelerated growth."
    );
  }

  return {

    summary:
      trustScore >= 85
        ? "Executive AI believes the organisation is performing strongly with targeted optimisation opportunities remaining."
        : "Executive AI has identified several high-impact improvements that will significantly strengthen organisational readiness.",

    evidence,

    impact,

  };
}
