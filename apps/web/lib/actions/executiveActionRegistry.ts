export type ExecutiveActionId =
  | "governance-verification"
  | "compliance-review"
  | "funding-readiness"
  | "procurement-readiness"
  | "view-opportunities"
  | "view-risks"
  | "generate-report";

export type ExecutiveAction = {
  id: ExecutiveActionId;

  title: string;

  description: string;

  category:
    | "mission"
    | "compliance"
    | "funding"
    | "procurement"
    | "insight"
    | "report";

  icon: string;

  primary: boolean;
};

export const EXECUTIVE_ACTIONS: Record<
  ExecutiveActionId,
  ExecutiveAction
> = {

  "governance-verification": {

    id: "governance-verification",

    title: "Start Governance Verification",

    description:
      "Launch the Governance Verification workflow.",

    category: "mission",

    icon: "shield",

    primary: true,

  },

  "compliance-review": {

    id: "compliance-review",

    title: "Review Compliance",

    description:
      "Open the compliance improvement workspace.",

    category: "compliance",

    icon: "check",

    primary: true,

  },

  "funding-readiness": {

    id: "funding-readiness",

    title: "Improve Funding Readiness",

    description:
      "Review funding requirements and prepare documentation.",

    category: "funding",

    icon: "banknote",

    primary: false,

  },

  "procurement-readiness": {

    id: "procurement-readiness",

    title: "Improve Procurement Readiness",

    description:
      "Increase procurement eligibility.",

    category: "procurement",

    icon: "briefcase",

    primary: false,

  },

  "view-opportunities": {

    id: "view-opportunities",

    title: "View Opportunities",

    description:
      "Open strategic opportunities identified by Executive AI.",

    category: "insight",

    icon: "trending-up",

    primary: false,

  },

  "view-risks": {

    id: "view-risks",

    title: "View Risks",

    description:
      "Review active strategic risks.",

    category: "insight",

    icon: "triangle-alert",

    primary: false,

  },

  "generate-report": {

    id: "generate-report",

    title: "Generate Executive Report",

    description:
      "Produce an executive briefing document.",

    category: "report",

    icon: "file-text",

    primary: false,

  },

};

export function getExecutiveAction(
  id: ExecutiveActionId
): ExecutiveAction {

  return EXECUTIVE_ACTIONS[id];

}

export function getAllExecutiveActions(): ExecutiveAction[] {

  return Object.values(EXECUTIVE_ACTIONS);

}
