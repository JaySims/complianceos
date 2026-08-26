import type {
  ExecutiveActionId,
} from "@/lib/actions/executiveActionRegistry";

import {
  getExecutiveWorkflowByActionId,
  type ExecutiveWorkflowId,
} from "@/lib/workflows/executiveWorkflowDefinitions";

export type ExecutiveWorkflowDispatchResult = {
  type: "workflow";

  actionId: ExecutiveActionId;

  workflowId: ExecutiveWorkflowId;

  route: string;

  status: "ready";

  message: string;
};

export type ExecutiveNavigationDispatchResult = {
  type: "navigation";

  actionId: ExecutiveActionId;

  route: string;

  status: "ready";

  message: string;
};

export type ExecutiveActionDispatchResult =
  | ExecutiveWorkflowDispatchResult
  | ExecutiveNavigationDispatchResult;

/*
 * Dispatch an Executive Action.
 *
 * Workflow actions use the canonical
 * Workflow Registry.
 *
 * Navigation actions route directly
 * without creating an Executive Mission.
 */

export function dispatchExecutiveAction(
  actionId: ExecutiveActionId
): ExecutiveActionDispatchResult {
  switch (actionId) {

    /*
     * Workflow-backed actions
     */

    case "governance-verification":

    case "compliance-review":

    case "funding-readiness":

    case "procurement-readiness": {
      const workflow =
        getExecutiveWorkflowByActionId(
          actionId
        );

      /*
       * These actions are required to have
       * a registered workflow.
       *
       * If this ever fails, the Workflow
       * Registry and Action Registry have
       * fallen out of sync.
       */

      if (!workflow) {
        throw new Error(
          `No Executive Workflow is registered for action "${actionId}".`
        );
      }

      return {
        type:
          "workflow",

        actionId,

        workflowId:
          workflow.id,

        route:
          workflow.route,

        status:
          "ready",

        message:
          `${workflow.title} workflow is ready to launch.`,
      };
    }

    /*
     * Navigation-only actions
     */

    case "view-opportunities":
      return {
        type:
          "navigation",

        actionId,

        route:
          "/workspace/opportunities",

        status:
          "ready",

        message:
          "Executive Opportunity Radar is ready.",
      };

    case "view-risks":
      return {
        type:
          "navigation",

        actionId,

        route:
          "/workspace/risks",

        status:
          "ready",

        message:
          "Executive Risk Review is ready.",
      };

    case "generate-report":
      return {
        type:
          "navigation",

        actionId,

        route:
          "/workspace/reports",

        status:
          "ready",

        message:
          "Executive Report workspace is ready.",
      };

    /*
     * Compile-time exhaustiveness protection.
     *
     * If ExecutiveActionId gains a new
     * member and this dispatcher is not
     * updated, TypeScript will fail here.
     */

    default: {
      const exhaustiveCheck:
        never = actionId;

      throw new Error(
        `Unsupported Executive Action: ${exhaustiveCheck}`
      );
    }
  }
}
