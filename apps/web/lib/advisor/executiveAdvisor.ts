import type { ExecutiveMission } from "@/lib/missions/missionEngine";
import type { Opportunity } from "@/lib/opportunities/opportunityEngine";

export type ExecutiveAdvisorInput = {
  trustScore: number;
  businessRisk: string;
  mission: ExecutiveMission;
  opportunities: Opportunity[];
};

export type ExecutiveAdvisorOutput = {
  greeting: string;
  executiveSummary: string;
  recommendation: string;
  expectedImpact: string;
  confidence: number;
  priority: string;
  actionButton: string;
};

export function buildExecutiveAdvisor(
  input: ExecutiveAdvisorInput
): ExecutiveAdvisorOutput {

  const totalOpportunity =
    input.opportunities.reduce(
      (sum, opportunity) => sum + opportunity.value,
      0
    );

  return {

    greeting:
      "Good morning, Simphiwe.",

    executiveSummary:

      `Your organisation currently has a Digital Trust™ score of ${input.trustScore}% with an overall business risk classified as ${input.businessRisk}. Executive AI has analysed your organisation and identified today's highest-value executive action.`,

    recommendation:

      input.mission.description,

    expectedImpact:

      `${input.mission.impact} Total opportunity currently available: R${totalOpportunity.toLocaleString()}.`,

    confidence:

      input.mission.confidence,

    priority:

      input.mission.priority,

    actionButton:

      "Start Executive Mission",

  };

}

