import { buildExecutiveForecast } from "@/lib/forecast/executiveForecastEngine";
import { buildMissionProgress } from "@/lib/missions/missionProgressEngine";
import { buildExecutiveInsights } from "@/lib/insights/executiveInsightEngine";
import { buildExecutiveRisks } from "@/lib/risk/executiveRiskMonitor";
import { buildOpportunityRadar } from "@/lib/opportunities/opportunityEngine";

export type ExecutiveIntegrationState = {
  forecast: ReturnType<typeof buildExecutiveForecast>;
  mission: ReturnType<typeof buildMissionProgress>;
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

export function buildExecutiveIntegrationState(
  input: Input
): ExecutiveIntegrationState {

  const forecast = buildExecutiveForecast(
    input.trustScore,
    input.governanceComplete,
    input.complianceComplete,
    input.fundingReady,
    input.procurementReady
  );

  const mission = buildMissionProgress(
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

  return {
    forecast,
    mission,
    insights,
    risks,
    opportunities,
  };
}
