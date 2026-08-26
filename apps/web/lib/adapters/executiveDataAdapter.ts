import { buildExecutiveApplicationState } from "@/lib/state/executiveApplicationState";

export type ExecutiveDashboardData = {
  trustScore: number;
  organisationStatus: string;
  executiveConfidence: number;
  missionProgress: number;
  insightCount: number;
  riskCount: number;
};

type Input = {
  trustScore: number;
  governanceComplete: boolean;
  complianceComplete: boolean;
  fundingReady: boolean;
  procurementReady: boolean;
};

export function buildExecutiveDashboardData(
  input: Input
): ExecutiveDashboardData {

  const appState =
    buildExecutiveApplicationState(input);

  return {

    trustScore:
      appState.workspace.brain.trustScore,

    organisationStatus:
      appState.workspace.brain.organisationStatus,

    executiveConfidence:
      appState.workspace.brain.executiveConfidence,

    missionProgress:
      appState.workspace.organisation.mission.progress,

    insightCount:
      appState.workspace.organisation.insights.length,

    riskCount:
      appState.workspace.organisation.risks.length,

  };

}
