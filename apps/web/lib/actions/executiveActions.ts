import type {
  ExecutiveActionId,
} from "@/lib/actions/executiveActionRegistry";

export type ExecutiveActionRecommendation = {
  actionId: ExecutiveActionId;
  variant: "primary" | "secondary";
};

export function buildExecutiveActions(
  question: string
): ExecutiveActionRecommendation[] {
  const query = question
    .trim()
    .toLowerCase();

  if (
    query.includes("trust") ||
    query.includes("governance")
  ) {
    return [
      {
        actionId: "governance-verification",
        variant: "primary",
      },
      {
        actionId: "view-risks",
        variant: "secondary",
      },
    ];
  }

  if (
    query.includes("compliance")
  ) {
    return [
      {
        actionId: "compliance-review",
        variant: "primary",
      },
      {
        actionId: "generate-report",
        variant: "secondary",
      },
    ];
  }

  if (
    query.includes("funding") ||
    query.includes("investment")
  ) {
    return [
      {
        actionId: "funding-readiness",
        variant: "primary",
      },
      {
        actionId: "view-opportunities",
        variant: "secondary",
      },
    ];
  }

  if (
    query.includes("procurement") ||
    query.includes("supplier")
  ) {
    return [
      {
        actionId: "procurement-readiness",
        variant: "primary",
      },
      {
        actionId: "view-opportunities",
        variant: "secondary",
      },
    ];
  }

  if (
    query.includes("opportunity") ||
    query.includes("revenue") ||
    query.includes("value")
  ) {
    return [
      {
        actionId: "view-opportunities",
        variant: "primary",
      },
      {
        actionId: "funding-readiness",
        variant: "secondary",
      },
    ];
  }

  if (
    query.includes("risk") ||
    query.includes("threat") ||
    query.includes("danger")
  ) {
    return [
      {
        actionId: "view-risks",
        variant: "primary",
      },
      {
        actionId: "compliance-review",
        variant: "secondary",
      },
    ];
  }

  if (
    query.includes("report") ||
    query.includes("briefing")
  ) {
    return [
      {
        actionId: "generate-report",
        variant: "primary",
      },
    ];
  }

  return [
    {
      actionId: "governance-verification",
      variant: "primary",
    },
    {
      actionId: "view-opportunities",
      variant: "secondary",
    },
  ];
}
