import type { ExecutiveApplicationState } from "@/lib/state/executiveApplicationState";
import { buildExecutiveNarrative } from "@/lib/narrative/executiveNarrativeEngine";

export type ExecutiveBriefing = {
  greeting: string;
  title: string;
  summary: string;
  recommendation: string;
};

export function buildExecutiveBriefing(
  state: ExecutiveApplicationState
): ExecutiveBriefing {

  const narrative =
    buildExecutiveNarrative(state);

  const trust =
    state.workspace.brain.trustScore;

  const mission =
    state.workspace.organisation.mission;

  const insights =
    state.workspace.organisation.insights;

  const highest =
    insights.length > 0
      ? insights[0].title
      : "Continue Executive Mission";

  return {

    greeting:
      "Good morning.",

    title:
      "Executive Morning Briefing",

    summary:
`Digital Trust™ currently stands at ${trust}%.

Mission Progress: ${mission.progress}%.

Today's highest executive priority:

${highest}`,

    recommendation:
      narrative.body,

  };

}
