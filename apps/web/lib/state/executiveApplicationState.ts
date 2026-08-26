import { buildExecutiveWorkspaceState } from "@/lib/workspace/executiveWorkspaceController";

export type ExecutiveApplicationState = {
  workspace: ReturnType<typeof buildExecutiveWorkspaceState>;
  loadedAt: string;
};

type Input = {
  trustScore: number;
  governanceComplete: boolean;
  complianceComplete: boolean;
  fundingReady: boolean;
  procurementReady: boolean;
};

export function buildExecutiveApplicationState(
  input: Input
): ExecutiveApplicationState {

  return {

    workspace:
      buildExecutiveWorkspaceState(input),

    loadedAt:
      new Date().toISOString(),

  };

}
