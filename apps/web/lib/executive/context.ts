import type {
  OrganizationMemberRole,
  UserRole,
} from "@prisma/client";

/*
 * ============================================================
 * COMPLIANCEOS EXECUTIVE AI CONTEXT
 * ============================================================
 *
 * PURPOSE
 *
 * Defines the trusted organization-scoped context supplied to
 * the ComplianceOS Executive AI.
 *
 * SECURITY PRINCIPLE
 *
 * Executive AI must never determine tenant identity from:
 *
 * - client input
 * - organizationId supplied in request JSON
 * - stale JWT organization claims
 * - hard-coded demo organization data
 *
 * The API layer must first resolve authenticated organization
 * authority through PostgreSQL-backed membership validation.
 *
 * Only then may an ExecutiveContext be constructed.
 * ============================================================
 */

export type ExecutiveContext = {
  executive: {
    id: string;
    fullName: string;
    email: string;
    userRole: UserRole;
    organizationRole: OrganizationMemberRole;
  };

  organization: {
    id: string;
    name: string;
    tradingName: string | null;
    industry: string | null;
    country: string | null;
    trustScore: number;
    complianceScore: number;
    onboardingCompleted: boolean;
  };

  workflows: Array<{
    workflowId: string;
    progress: number;
    completed: boolean;
    completedStepIds: string[];
    startedAt: Date | null;
    completedAt: Date | null;
    updatedAt: Date;
  }>;

  missions: Array<{
    id: string;
    workflowId: string;
    actionId: string;
    title: string;
    route: string;
    status:
      | "ACTIVE"
      | "PAUSED"
      | "COMPLETED"
      | "CANCELLED";
    progress: number;
    startedAt: Date;
    completedAt: Date | null;
    updatedAt: Date;
  }>;
};

/*
 * ============================================================
 * CONTEXT BUILDER INPUT
 * ============================================================
 *
 * This builder does not perform authentication itself.
 *
 * Authentication and tenant resolution belong at the HTTP
 * boundary.
 *
 * The builder receives only already-authorized data.
 * ============================================================
 */

export type BuildExecutiveContextInput = {
  executive: ExecutiveContext["executive"];
  organization: ExecutiveContext["organization"];
  workflows: ExecutiveContext["workflows"];
  missions: ExecutiveContext["missions"];
};

/*
 * ============================================================
 * BUILD EXECUTIVE CONTEXT
 * ============================================================
 */

export function buildExecutiveContext(
  input: BuildExecutiveContextInput
): ExecutiveContext {
  return {
    executive: {
      ...input.executive,
    },

    organization: {
      ...input.organization,
    },

    workflows:
      input.workflows.map(
        (workflow) => ({
          ...workflow,

          completedStepIds: [
            ...workflow.completedStepIds,
          ],
        })
      ),

    missions:
      input.missions.map(
        (mission) => ({
          ...mission,
        })
      ),
  };
}
