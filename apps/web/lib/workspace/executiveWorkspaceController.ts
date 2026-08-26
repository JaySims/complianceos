import { buildExecutiveBrain } from "@/lib/brain/unifiedExecutiveBrain";
import { buildExecutiveIntegrationState } from "@/lib/integration/executiveIntegrationService";

export type ExecutiveWorkspaceState = {
  brain: ReturnType<typeof buildExecutiveBrain>;
  organisation: ReturnType<typeof buildExecutiveIntegrationState>;
};

type Input = {
  trustScore: number;
  governanceComplete: boolean;
  complianceComplete: boolean;
  fundingReady: boolean;
  procurementReady: boolean;
};

export function buildExecutiveWorkspaceState(
  input: Input
): ExecutiveWorkspaceState {

  const organisation =
    buildExecutiveIntegrationState(input);

  const brain =
    buildExecutiveBrain({
      trustScore: input.trustScore,
      missionProgress: organisation.mission.progress,
    });

  return {
    brain,
    organisation,
  };
}
