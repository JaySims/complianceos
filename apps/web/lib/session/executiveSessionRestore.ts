import {
  loadExecutiveState,
} from "@/lib/state/executiveStateEngine";

export type ExecutiveSession = {
  greeting: string;
  resumeAvailable: boolean;
  mission: string;
  workflow: string;
};

export function restoreExecutiveSession(): ExecutiveSession {

  const state = loadExecutiveState();

  if (!state) {

    return {

      greeting:
        "Welcome to ComplianceOS Executive™.",

      resumeAvailable: false,

      mission: "",

      workflow: "",

    };

  }

  return {

    greeting:
      "Welcome back. Executive AI has restored your previous session.",

    resumeAvailable: true,

    mission:
      state.activeMission,

    workflow:
      state.activeWorkflow,

  };

}
