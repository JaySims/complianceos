export type StrategicMilestone = {
  period: "Today" | "This Week" | "This Month" | "This Quarter" | "This Year";
  objective: string;
  outcome: string;
};

export function buildStrategicPlan(
  governanceComplete: boolean,
  complianceComplete: boolean,
  fundingReady: boolean,
  procurementReady: boolean
): StrategicMilestone[] {

  return [

    {
      period: "Today",
      objective: governanceComplete
        ? "Maintain Executive Standards"
        : "Complete Governance Verification",
      outcome:
        "Increase organisational credibility and Digital Trust™.",
    },

    {
      period: "This Week",
      objective: complianceComplete
        ? "Strengthen Executive Compliance"
        : "Complete Compliance Profile",
      outcome:
        "Improve organisational readiness.",
    },

    {
      period: "This Month",
      objective: procurementReady
        ? "Expand Procurement Opportunities"
        : "Become Procurement Ready",
      outcome:
        "Unlock enterprise procurement opportunities.",
    },

    {
      period: "This Quarter",
      objective: fundingReady
        ? "Prepare Strategic Growth"
        : "Become Funding Ready",
      outcome:
        "Increase investment readiness.",
    },

    {
      period: "This Year",
      objective: "Executive Grade Organisation",
      outcome:
        "Operate as a trusted, investment-ready, AI-powered enterprise.",
    },

  ];

}
