import type {
  ExecutiveActionId,
} from "@/lib/actions/executiveActionRegistry";

export type ExecutiveWorkflowId =
  | "governance"
  | "compliance"
  | "funding"
  | "procurement";

export type ExecutiveWorkflowCompletionEffect =
  | "governanceComplete"
  | "complianceComplete"
  | "fundingReady"
  | "procurementReady";

export type ExecutiveWorkflowStep = {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
};

export type ExecutiveWorkflow = {
  id: ExecutiveWorkflowId;

  actionId: ExecutiveActionId;

  completionEffect:
    ExecutiveWorkflowCompletionEffect;

  title: string;

  subtitle: string;

  trustGain: number;

  estimatedCompletion: string;

  route: string;

  steps: ExecutiveWorkflowStep[];
};

export const executiveWorkflowDefinitions: Record<
  ExecutiveWorkflowId,
  ExecutiveWorkflow
> = {
  governance: {
    id: "governance",

    actionId:
      "governance-verification",

    completionEffect:
      "governanceComplete",

    title:
      "Governance Verification",

    subtitle:
      "Strengthen Digital Trust™ by validating governance maturity.",

    trustGain: 8,

    estimatedCompletion:
      "2 Days",

    route:
      "/workspace/governance",

    steps: [
      {
        id:
          "company-registration",

        title:
          "Company Registration",

        description:
          "Verify legal company registration.",

        estimatedMinutes: 10,
      },

      {
        id:
          "director-information",

        title:
          "Director Information",

        description:
          "Confirm directors and responsible officers.",

        estimatedMinutes: 20,
      },

      {
        id:
          "ownership-structure",

        title:
          "Ownership Structure",

        description:
          "Validate ownership and beneficiaries.",

        estimatedMinutes: 15,
      },

      {
        id:
          "governance-documents",

        title:
          "Governance Documents",

        description:
          "Upload governance evidence.",

        estimatedMinutes: 30,
      },
    ],
  },

  compliance: {
    id: "compliance",

    actionId:
      "compliance-review",

    completionEffect:
      "complianceComplete",

    title:
      "Compliance Review",

    subtitle:
      "Verify regulatory compliance across the organisation.",

    trustGain: 6,

    estimatedCompletion:
      "1 Day",

    route:
      "/workspace/compliance",

    steps: [
      {
        id: "tax",

        title:
          "Tax Compliance",

        description:
          "Review tax compliance.",

        estimatedMinutes: 20,
      },

      {
        id: "labour",

        title:
          "Labour Compliance",

        description:
          "Review employment compliance.",

        estimatedMinutes: 20,
      },

      {
        id: "industry",

        title:
          "Industry Compliance",

        description:
          "Validate industry regulations.",

        estimatedMinutes: 25,
      },
    ],
  },

  funding: {
    id: "funding",

    actionId:
      "funding-readiness",

    completionEffect:
      "fundingReady",

    title:
      "Funding Readiness",

    subtitle:
      "Prepare the organisation for investment and funding.",

    trustGain: 5,

    estimatedCompletion:
      "3 Days",

    route:
      "/workspace/funding",

    steps: [
      {
        id:
          "financials",

        title:
          "Financial Statements",

        description:
          "Prepare financial records.",

        estimatedMinutes: 30,
      },

      {
        id:
          "business-plan",

        title:
          "Business Plan",

        description:
          "Review investment documentation.",

        estimatedMinutes: 40,
      },

      {
        id:
          "pitch-deck",

        title:
          "Pitch Deck",

        description:
          "Prepare investor presentation.",

        estimatedMinutes: 30,
      },
    ],
  },

  procurement: {
    id: "procurement",

    actionId:
      "procurement-readiness",

    completionEffect:
      "procurementReady",

    title:
      "Procurement Readiness",

    subtitle:
      "Prepare the organisation for enterprise and public-sector procurement opportunities.",

    trustGain: 5,

    estimatedCompletion:
      "2 Days",

    route:
      "/workspace/procurement",

    steps: [
      {
        id:
          "supplier-profile",

        title:
          "Supplier Profile",

        description:
          "Confirm core supplier information and organisational capability.",

        estimatedMinutes: 20,
      },

      {
        id:
          "bbbee-readiness",

        title:
          "B-BBEE Readiness",

        description:
          "Review transformation and procurement-readiness information.",

        estimatedMinutes: 25,
      },

      {
        id:
          "tax-clearance",

        title:
          "Tax and Compliance Evidence",

        description:
          "Confirm required tax and compliance evidence for procurement.",

        estimatedMinutes: 20,
      },

      {
        id:
          "capability-pack",

        title:
          "Enterprise Capability Pack",

        description:
          "Prepare the organisation profile and supporting procurement documentation.",

        estimatedMinutes: 30,
      },
    ],
  },
};

export function getExecutiveWorkflow(
  workflowId: ExecutiveWorkflowId
): ExecutiveWorkflow {
  return executiveWorkflowDefinitions[
    workflowId
  ];
}

export function getExecutiveWorkflowByActionId(
  actionId: ExecutiveActionId
): ExecutiveWorkflow | undefined {
  return Object.values(
    executiveWorkflowDefinitions
  ).find(
    (workflow) =>
      workflow.actionId ===
      actionId
  );
}
