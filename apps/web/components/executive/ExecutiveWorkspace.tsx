"use client";

import { useExecutiveState } from "@/contexts/ExecutiveStateContext";

import ExecutiveCommandCentre from "./ExecutiveCommandCentre";
import ExecutiveDecisionCentre, {
  ExecutiveDecision,
} from "./ExecutiveDecisionCentre";
import ExecutiveMissionBoard from "./ExecutiveMissionBoard";
import ExecutiveTimeline, {
  ExecutiveTimelineEvent,
} from "./ExecutiveTimeline";
import ExecutiveIntelligenceCanvas from "./ExecutiveIntelligenceCanvas";

export default function ExecutiveWorkspace() {
  const { brain } = useExecutiveState();

  const timeline: ExecutiveTimelineEvent[] = [
    {
      id: "registration",
      title: "Business Registered",
      description:
        "Organisation successfully onboarded to ComplianceOS.",
      date: "Completed",
      status: "completed",
    },
    {
      id: "active-mission",
      title: brain.activeMission,
      description:
        "Executive AI has identified this as the organisation's current strategic priority.",
      date: "Today",
      status: "active",
    },
    {
      id: "next-milestone",
      title:
        brain.insights[1]?.title ??
        "Continue Executive Readiness",
      description:
        brain.insights[1]?.description ??
        "Executive AI will identify the next milestone after the active mission is completed.",
      date: "Upcoming",
      status: "upcoming",
    },
  ];

  const decisions: ExecutiveDecision[] =
    brain.insights.slice(0, 3).map((insight, index) => {
      const trustGain =
        index === 0
          ? brain.trustGain
          : Math.max(brain.trustGain - index * 2, 1);

      const revenueGain =
        brain.opportunities[index]?.value ??
        Math.round(
          brain.revenueOpportunity /
            Math.max(brain.opportunityCount, 1)
        );

      const confidence =
        Math.max(
          brain.executiveConfidence - index * 3,
          0
        );

      return {
        id: insight.id,
        title: insight.title,
        impact:
          insight.priority === "high"
            ? 5
            : insight.priority === "medium"
            ? 4
            : 3,
        trustGain,
        revenueGain,
        duration:
          insight.priority === "high"
            ? "2 Days"
            : insight.priority === "medium"
            ? "4 Days"
            : "7 Days",
        confidence,
      };
    });

  const fallbackDecisions: ExecutiveDecision[] = [
    {
      id: "active-mission",
      title: brain.activeMission,
      impact: 5,
      trustGain: brain.trustGain,
      revenueGain: brain.revenueOpportunity,
      duration: brain.estimatedCompletion,
      confidence: brain.executiveConfidence,
    },
  ];

  return (
    <div className="space-y-10">
      <ExecutiveCommandCentre
        trustScore={brain.trustScore}
        executiveConfidence={brain.executiveConfidence}
        businessRisk={brain.businessRisk}
        organisationStatus={brain.organisationStatus}
        fundingReadiness={brain.fundingReadiness}
        complianceReadiness={brain.complianceReadiness}
        procurementReadiness={brain.procurementReadiness}
        governanceMaturity={brain.governanceMaturity}
      />

      <ExecutiveIntelligenceCanvas
        trustScore={brain.trustScore}
        executiveConfidence={brain.executiveConfidence}
        activeMission={brain.activeMission}
        predictedTrust={brain.predictedTrust}
        riskCount={brain.riskCount}
        opportunityCount={brain.opportunityCount}
      />

      <ExecutiveDecisionCentre
        decisions={
          decisions.length > 0
            ? decisions
            : fallbackDecisions
        }
      />

      <ExecutiveMissionBoard
        title={brain.activeMission}
        progress={brain.missionProgress.progress}
        estimatedCompletion={brain.estimatedCompletion}
        trustGain={brain.trustGain}
        revenueOpportunity={brain.revenueOpportunity}
      />

      <ExecutiveTimeline events={timeline} />
    </div>
  );
}
