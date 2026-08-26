import { buildExecutiveForecast } from "@/lib/forecast/executiveForecastEngine";
import { buildMissionProgress } from "@/lib/missions/missionProgressEngine";
import { buildExecutiveInsights } from "@/lib/insights/executiveInsightEngine";
import { buildExecutiveRisks } from "@/lib/risk/executiveRiskMonitor";
import { buildOpportunityRadar } from "@/lib/opportunities/opportunityEngine";
import { buildExecutiveMission } from "@/lib/missions/missionEngine";

export type ExecutiveBrainState = {

  trustScore: number;

  executiveConfidence: number;

  businessRisk: "Low" | "Medium" | "High";

  organisationStatus: string;

  activeMission: string;

  predictedTrust: number;

  trustGain: number;

  estimatedCompletion: string;

  revenueOpportunity: number;

  fundingReadiness: number;

  complianceReadiness: number;

  procurementReadiness: number;

  governanceMaturity: number;

  riskCount: number;

  opportunityCount: number;

  forecast: ReturnType<typeof buildExecutiveForecast>;

  mission: ReturnType<typeof buildExecutiveMission>;

  missionProgress: ReturnType<typeof buildMissionProgress>;

  insights: ReturnType<typeof buildExecutiveInsights>;

  risks: ReturnType<typeof buildExecutiveRisks>;

  opportunities: ReturnType<typeof buildOpportunityRadar>;

};

type Input = {

  trustScore: number;

  governanceComplete: boolean;

  complianceComplete: boolean;

  fundingReady: boolean;

  procurementReady: boolean;

};

export function buildExecutiveBrainState(
  input: Input
): ExecutiveBrainState {

  const forecast = buildExecutiveForecast(
    input.trustScore,
    input.governanceComplete,
    input.complianceComplete,
    input.fundingReady,
    input.procurementReady
  );

  const mission = buildExecutiveMission({
    trustScore: input.trustScore,
    governanceComplete: input.governanceComplete,
    complianceComplete: input.complianceComplete,
    fundingReady: input.fundingReady,
    procurementReady: input.procurementReady,
  });

  const missionProgress = buildMissionProgress(
    input.governanceComplete,
    input.complianceComplete,
    input.fundingReady,
    input.procurementReady
  );

  const insights = buildExecutiveInsights({
    trustScore: input.trustScore,
    governanceComplete: input.governanceComplete,
    complianceComplete: input.complianceComplete,
    fundingReady: input.fundingReady,
    procurementReady: input.procurementReady,
  });

  const risks = buildExecutiveRisks({
    trustScore: input.trustScore,
    governanceComplete: input.governanceComplete,
    complianceComplete: input.complianceComplete,
    fundingReady: input.fundingReady,
    procurementReady: input.procurementReady,
  });

  const opportunities = buildOpportunityRadar({
    trustScore: input.trustScore,
    governanceComplete: input.governanceComplete,
    complianceComplete: input.complianceComplete,
    fundingReady: input.fundingReady,
    procurementReady: input.procurementReady,
  });

  const fundingReadiness =
    input.fundingReady ? 100 : 40;

  const complianceReadiness =
    input.complianceComplete ? 100 : 35;

  const procurementReadiness =
    input.procurementReady ? 100 : 35;

  const governanceMaturity =
    input.governanceComplete ? 100 : 35;

  return {

    trustScore: input.trustScore,

    executiveConfidence: mission.confidence,

    businessRisk: forecast.currentRisk,

    organisationStatus:
      forecast.currentRisk === "Low"
        ? "Investment Ready"
        : forecast.currentRisk === "Medium"
        ? "Growth Ready"
        : "Improvement Required",

    activeMission: mission.title,

    predictedTrust: forecast.projectedTrust,

    trustGain:
      forecast.projectedTrust -
      input.trustScore,

    estimatedCompletion: "2 Days",

    revenueOpportunity:
      opportunities.reduce(
        (sum, opportunity) => sum + opportunity.value,
        0
      ),

    fundingReadiness,

    complianceReadiness,

    procurementReadiness,

    governanceMaturity,

    riskCount:
      risks.length,

    opportunityCount:
      opportunities.length,

    forecast,

    mission,

    missionProgress,

    insights,

    risks,

    opportunities,

  };

}
