import type {
  ExecutiveBrainState,
} from "@/lib/brain/executiveBrainState";

export function askExecutive(
  question: string,
  brain: ExecutiveBrainState
): string {
  const query = question
    .trim()
    .toLowerCase();

  const highestInsight =
    brain.insights[0];

  const highestRisk =
    brain.risks[0];

  const leadingOpportunity =
    brain.opportunities[0];

  if (
    query.includes("priority") ||
    query.includes("focus") ||
    query.includes("today")
  ) {
    return `Today's highest executive priority is ${brain.activeMission}.

Mission progress currently stands at ${brain.missionProgress.progress}%.

Completing this mission is projected to increase Digital Trust™ from ${brain.trustScore}% to ${brain.predictedTrust}%.

Executive confidence in this recommendation is ${brain.executiveConfidence}%.`;
  }

  if (
    query.includes("trust") ||
    query.includes("digital trust")
  ) {
    return `Digital Trust™ currently stands at ${brain.trustScore}%.

Executive Forecast™ projects the score reaching ${brain.predictedTrust}%, representing an expected gain of ${brain.trustGain}%.

The current business-risk classification is ${brain.businessRisk}.`;
  }

  if (
    query.includes("opportunity") ||
    query.includes("revenue") ||
    query.includes("value")
  ) {
    if (leadingOpportunity) {
      return `Executive AI has identified ${brain.opportunityCount} strategic opportunities with a combined estimated value of R${brain.revenueOpportunity.toLocaleString()}.

The leading opportunity is ${leadingOpportunity.title}, with an estimated value of R${leadingOpportunity.value.toLocaleString()}.`;
    }

    return `Executive AI has not identified an immediately available opportunity yet.

Completing ${brain.activeMission} is expected to improve opportunity eligibility.`;
  }

  if (
    query.includes("risk") ||
    query.includes("danger") ||
    query.includes("threat")
  ) {
    if (highestRisk) {
      return `The highest-priority risk is ${highestRisk.title}.

Risk level: ${highestRisk.level}.

${highestRisk.description}

Recommended response: ${highestRisk.recommendation}`;
    }

    return `Executive AI has not detected any significant strategic risks.

The organisation is currently classified as ${brain.organisationStatus}.`;
  }

  if (
    query.includes("confidence") ||
    query.includes("certain")
  ) {
    return `Executive confidence currently stands at ${brain.executiveConfidence}%.

This confidence is based on the organisation's current Trust™, mission, risk, readiness, and opportunity state.`;
  }

  if (
    query.includes("mission") ||
    query.includes("progress")
  ) {
    return `The active Executive Mission is ${brain.activeMission}.

Current progress: ${brain.missionProgress.progress}%.

Estimated completion: ${brain.estimatedCompletion}.

Expected Digital Trust™ gain: ${brain.trustGain}%.`;
  }

  if (
    query.includes("funding")
  ) {
    return `Funding readiness currently stands at ${brain.fundingReadiness}%.

Executive AI recommends completing the active mission and resolving outstanding funding-readiness requirements before pursuing additional investment opportunities.`;
  }

  if (
    query.includes("compliance")
  ) {
    return `Compliance readiness currently stands at ${brain.complianceReadiness}%.

${
  highestInsight?.category === "compliance"
    ? highestInsight.description
    : "Executive AI will continue monitoring compliance readiness and surface the highest-impact improvement."
}`;
  }

  if (
    query.includes("procurement")
  ) {
    return `Procurement readiness currently stands at ${brain.procurementReadiness}%.

Improving governance and compliance readiness is expected to increase enterprise procurement eligibility.`;
  }

  if (
    query.includes("governance")
  ) {
    return `Governance maturity currently stands at ${brain.governanceMaturity}%.

${brain.activeMission === "Governance Verification"
  ? "Governance Verification is the active executive priority."
  : "Executive AI is continuing to monitor governance maturity."}`;
  }

  if (
    query.includes("insight") ||
    query.includes("what changed")
  ) {
    if (highestInsight) {
      return `${highestInsight.title}

${highestInsight.description}

Priority level: ${highestInsight.priority}.`;
    }

    return "Executive AI has not detected a new high-priority insight.";
  }

  return `Executive AI has reviewed the organisation's current state.

Digital Trust™: ${brain.trustScore}%
Business Risk: ${brain.businessRisk}
Active Mission: ${brain.activeMission}
Mission Progress: ${brain.missionProgress.progress}%
Executive Confidence: ${brain.executiveConfidence}%

Ask about Trust™, risks, opportunities, readiness, mission progress, or today's priority for a more detailed assessment.`;
}
