import type {
  ExecutiveContext,
} from "@/lib/executive/context";

/*
 * ============================================================
 * COMPLIANCEOS EXECUTIVE INSIGHT ENGINE
 * ============================================================
 *
 * PURPOSE
 *
 * Converts authoritative organization-scoped ExecutiveContext
 * into deterministic executive insights.
 *
 * SECURITY / INTELLIGENCE PRINCIPLE
 *
 * This engine does not:
 *
 * - authenticate users
 * - resolve organizations
 * - trust client-supplied organization IDs
 * - manufacture demo organization state
 *
 * It reasons only over context supplied by the authenticated
 * server-side Executive AI boundary.
 * ============================================================
 */

export type ExecutiveInsight = {
  priority:
    | "critical"
    | "high"
    | "medium"
    | "low";

  category:
    | "governance"
    | "compliance"
    | "funding"
    | "procurement"
    | "growth";

  title: string;

  explanation: string;

  expectedImpact: string;
};

/*
 * ============================================================
 * WORKFLOW HELPERS
 * ============================================================
 */

function findWorkflow(
  context: ExecutiveContext,
  workflowId: string
) {
  return context.workflows.find(
    (workflow) =>
      workflow.workflowId ===
      workflowId
  );
}

/*
 * ============================================================
 * ACTIVE MISSION HELPER
 * ============================================================
 *
 * Determines whether an insight directly represents an
 * Executive Mission that is still open.
 *
 * This signal is deliberately used only as a tie-breaker
 * between insights with equal executive severity.
 * ============================================================
 */

function isActiveMissionInsight(
  context: ExecutiveContext,
  insight: ExecutiveInsight
): boolean {
  return context.missions.some(
    (mission) =>
      mission.title ===
        insight.title &&
      (
        mission.status ===
          "ACTIVE" ||
        mission.status ===
          "PAUSED"
      )
  );
}

/*
 * ============================================================
 * GENERATE EXECUTIVE INSIGHTS
 * ============================================================
 */

export function generateExecutiveInsights(
  context: ExecutiveContext
): ExecutiveInsight[] {
  const insights:
    ExecutiveInsight[] = [];

  /*
   * ========================================================
   * GOVERNANCE
   * ========================================================
   */

  const governance =
    findWorkflow(
      context,
      "governance"
    );

  if (
    !governance ||
    !governance.completed
  ) {
    const progress =
      governance?.progress ?? 0;

    insights.push({
      priority: "critical",

      category: "governance",

      title:
        "Complete Governance Verification",

      explanation:
        progress > 0
          ? `Governance Verification is ${progress}% complete and remains an important organisational control priority.`
          : "Governance Verification has not yet been completed and remains an important organisational control priority.",

      expectedImpact:
        "Strengthen organisational trust, compliance readiness and decision confidence.",
    });
  }

  /*
   * ========================================================
   * COMPLIANCE
   * ========================================================
   */

  const compliance =
    findWorkflow(
      context,
      "compliance"
    );

  if (
    context.organization
      .complianceScore < 80 ||
    (
      compliance &&
      !compliance.completed
    )
  ) {
    insights.push({
      priority:
        context.organization
          .complianceScore < 60
          ? "critical"
          : "high",

      category: "compliance",

      title:
        "Strengthen Compliance Readiness",

      explanation:
        `Current compliance score is ${Math.round(
          context.organization
            .complianceScore
        )}. Outstanding compliance work should be resolved before it becomes a material organisational risk.`,

      expectedImpact:
        "Improve regulatory readiness and reduce unresolved compliance exposure.",
    });
  }

  /*
   * ========================================================
   * FUNDING
   * ========================================================
   */

  const funding =
    findWorkflow(
      context,
      "funding"
    );

  if (
    funding &&
    !funding.completed
  ) {
    insights.push({
      priority: "high",

      category: "funding",

      title:
        "Advance Funding Readiness",

      explanation:
        `Funding readiness workflow is ${funding.progress}% complete.`,

      expectedImpact:
        "Improve the organisation's readiness for appropriate funding opportunities.",
    });
  }

  /*
   * ========================================================
   * PROCUREMENT
   * ========================================================
   */

  const procurement =
    findWorkflow(
      context,
      "procurement"
    );

  if (
    procurement &&
    !procurement.completed
  ) {
    insights.push({
      priority: "high",

      category: "procurement",

      title:
        "Advance Procurement Readiness",

      explanation:
        `Procurement readiness workflow is ${procurement.progress}% complete.`,

      expectedImpact:
        "Improve readiness for procurement and supplier opportunities.",
    });
  }

  /*
   * ========================================================
   * ACTIVE MISSION CONTINUITY
   * ========================================================
   */

  const activeMission =
    context.missions.find(
      (mission) =>
        mission.status ===
          "ACTIVE" ||
        mission.status ===
          "PAUSED"
    );

  if (
    activeMission &&
    !insights.some(
      (insight) =>
        insight.title ===
        activeMission.title
    )
  ) {
    insights.push({
      priority: "medium",

      category:
        activeMission.workflowId ===
          "funding"
          ? "funding"
          : activeMission.workflowId ===
              "procurement"
            ? "procurement"
            : activeMission.workflowId ===
                "compliance"
              ? "compliance"
              : "governance",

      title:
        activeMission.title,

      explanation:
        `Executive Mission is currently ${activeMission.progress}% complete.`,

      expectedImpact:
        "Maintain execution continuity on an active organisational priority.",
    });
  }

  /*
   * ========================================================
   * ORGANISATIONAL TRUST
   * ========================================================
   */

  if (
    context.organization
      .trustScore < 70
  ) {
    insights.push({
      priority: "high",

      category: "growth",

      title:
        "Increase Organisational Trust",

      explanation:
        `Current Trust Score is ${Math.round(
          context.organization
            .trustScore
        )}. Improving verified organisational readiness should remain an executive priority.`,

      expectedImpact:
        "Strengthen organisational credibility and readiness for future opportunities.",
    });
  }

  /*
   * ========================================================
   * FALLBACK
   * ========================================================
   *
   * A healthy organization should still receive a useful
   * executive signal instead of an empty insight array.
   * ========================================================
   */

  if (
    insights.length === 0
  ) {
    insights.push({
      priority: "low",

      category: "growth",

      title:
        "Maintain Organisational Readiness",

      explanation:
        "No immediate high-priority workflow gaps were identified from the currently available organisational state.",

      expectedImpact:
        "Preserve compliance, governance and organisational readiness.",
    });
  }

  /*
   * ========================================================
   * DETERMINISTIC PRIORITY ORDERING
   * ========================================================
   *
   * Executive severity is authoritative.
   *
   * Ordering rules:
   *
   * 1. CRITICAL
   * 2. HIGH
   * 3. MEDIUM
   * 4. LOW
   *
   * Active Executive Missions are used only as a tie-breaker
   * between insights with the same executive severity.
   *
   * This prevents a MEDIUM active mission from outranking a
   * CRITICAL organisational risk.
   * ========================================================
   */

  const priorityWeight: Record<
    ExecutiveInsight["priority"],
    number
  > = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return insights.sort(
    (left, right) => {
      /*
       * Severity always wins first.
       */

      const priorityDifference =
        priorityWeight[
          right.priority
        ] -
        priorityWeight[
          left.priority
        ];

      if (
        priorityDifference !== 0
      ) {
        return priorityDifference;
      }

      /*
       * If both insights have the same severity, prefer an
       * insight representing an open Executive Mission.
       */

      const leftMissionActive =
        isActiveMissionInsight(
          context,
          left
        );

      const rightMissionActive =
        isActiveMissionInsight(
          context,
          right
        );

      if (
        leftMissionActive !==
        rightMissionActive
      ) {
        return leftMissionActive
          ? -1
          : 1;
      }

      /*
       * Preserve original generation order when severity and
       * active-mission state are equal.
       */

      return 0;
    }
  );
}
