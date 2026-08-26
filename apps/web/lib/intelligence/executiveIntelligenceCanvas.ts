export type ExecutiveCanvas = {
  title: string;
  summary: string;
  priority: string;
  confidence: number;
};

export function buildExecutiveCanvas(
  trustScore: number,
  governanceComplete: boolean,
  complianceComplete: boolean,
  fundingReady: boolean,
  procurementReady: boolean
): ExecutiveCanvas {

  let priority = "Continue Executive Mission";

  if (!governanceComplete) {
    priority = "Complete Governance Verification";
  } else if (!complianceComplete) {
    priority = "Complete Compliance Profile";
  } else if (!fundingReady) {
    priority = "Improve Funding Readiness";
  } else if (!procurementReady) {
    priority = "Improve Procurement Readiness";
  }

  return {

    title: "Executive Intelligence™",

    summary:
      trustScore >= 85
        ? "The organisation is performing strongly. Executive AI recommends focused optimisation to maximise strategic opportunities."
        : "Executive AI has identified several high-impact improvements that will significantly strengthen organisational readiness and future growth.",

    priority,

    confidence: 97,

  };

}
