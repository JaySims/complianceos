import type { ExecutiveApplicationState } from "@/lib/state/executiveApplicationState";

export type ExecutiveNarrative = {
  title: string;
  body: string;
};

export function buildExecutiveNarrative(
  state: ExecutiveApplicationState
): ExecutiveNarrative {

  const trust =
    state.workspace.brain.trustScore;

  const confidence =
    state.workspace.brain.executiveConfidence;

  const organisation =
    state.workspace.brain.organisationStatus;

  const mission =
    state.workspace.organisation.mission;

  const insights =
    state.workspace.organisation.insights;

  const priority =
    insights.length > 0
      ? insights[0].title
      : "Continue Executive Mission";

  return {

    title:
      "Executive Morning Briefing",

    body: `Good morning.

Digital Trust™ currently stands at ${trust}%.

Organisation Status:
${organisation}

Mission Progress:
${mission.progress}%

Executive AI has identified the following priority:

${priority}

Executive Confidence:

${confidence}%

Today's recommendation is to complete your Executive Mission before pursuing new opportunities.`,

  };

}
