import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ExecutiveMissionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  resolveOrganizationAccess,
  canReadOrganizationWorkflow,
  type OrganizationAccessFailureReason,
} from "@/lib/auth/organizationAccess";

import {
  buildExecutiveContext,
} from "@/lib/executive/context";

import {
  executeExecutiveAI,
} from "@/lib/orchestrator/aiOrchestrator";

/*
 * ============================================================
 * COMPLIANCEOS EXECUTIVE AI API
 * ============================================================
 *
 * SECURITY MODEL
 *
 * JWT
 *   ↓
 * authenticated database User
 *   ↓
 * active OrganizationMember
 *   ↓
 * authorized Organization
 *   ↓
 * organization-scoped ExecutiveContext
 *   ↓
 * Executive AI Orchestrator
 *
 * IMPORTANT
 *
 * The browser cannot choose the organization used by
 * Executive AI.
 *
 * organizationId from request JSON, query parameters, headers,
 * or JWT organization claims is never treated as authorization
 * authority.
 *
 * PostgreSQL membership is authoritative.
 * ============================================================
 */

type ExecutiveAIRequestBody = {
  message?: unknown;
};

/*
 * ============================================================
 * AUTHORIZATION FAILURE RESPONSE
 * ============================================================
 */

function organizationAccessFailure(
  reason: OrganizationAccessFailureReason
) {
  const unauthenticated =
    reason === "MISSING_TOKEN" ||
    reason === "INVALID_TOKEN" ||
    reason === "INVALID_IDENTITY" ||
    reason === "USER_NOT_FOUND";

  return NextResponse.json(
    {
      success: false,

      message:
        unauthenticated
          ? "Unauthorized"
          : "Organisation access denied.",

      reason,
    },
    {
      status:
        unauthenticated
          ? 401
          : 403,
    }
  );
}

/*
 * ============================================================
 * POST
 * ============================================================
 */

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * Resolve authenticated organization authority.
     */

    const access =
      await resolveOrganizationAccess(
        request
      );

    if (!access.authorized) {
      return organizationAccessFailure(
        access.reason
      );
    }

    /*
     * Executive AI currently requires organization read
     * authority.
     *
     * AUDITOR may therefore consume advisory intelligence but
     * still cannot execute protected workflow mutations.
     */

    if (
      !canReadOrganizationWorkflow(
        access.context
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You do not have permission to access Executive AI.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Parse and validate message.
     */

    const body =
      await request.json() as ExecutiveAIRequestBody;

    const message =
      typeof body.message ===
        "string"
        ? body.message.trim()
        : "";

    if (
      message.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Executive AI message is required.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      user,
      organization:
        authorizedOrganization,
      membership,
    } = access.context;

    /*
     * ========================================================
     * LOAD AUTHORITATIVE ORGANIZATION STATE
     * ========================================================
     */

    const organization =
      await prisma.organization.findUnique({
        where: {
          id:
            authorizedOrganization.id,
        },

        select: {
          id: true,
          name: true,
          tradingName: true,
          industry: true,
          country: true,
          trustScore: true,
          complianceScore: true,
          onboardingCompleted: true,
        },
      });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Organization not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ========================================================
     * LOAD ORGANIZATION WORKFLOW STATE
     * ========================================================
     */

    const workflows =
      await prisma.workflowProgress.findMany({
        where: {
          organizationId:
            organization.id,
        },

        select: {
          workflowId: true,
          progress: true,
          completed: true,
          completedStepIds: true,
          startedAt: true,
          completedAt: true,
          updatedAt: true,
        },

        orderBy: {
          updatedAt:
            "desc",
        },
      });

    /*
     * ========================================================
     * LOAD ORGANIZATION EXECUTIVE MISSIONS
     * ========================================================
     */

    const missions =
      await prisma.executiveMission.findMany({
        where: {
          organizationId:
            organization.id,

          status: {
            in: [
              ExecutiveMissionStatus.ACTIVE,
              ExecutiveMissionStatus.PAUSED,
              ExecutiveMissionStatus.COMPLETED,
            ],
          },
        },

        select: {
          id: true,
          workflowId: true,
          actionId: true,
          title: true,
          route: true,
          status: true,
          progress: true,
          startedAt: true,
          completedAt: true,
          updatedAt: true,
        },

        orderBy: {
          updatedAt:
            "desc",
        },

        take: 20,
      });

    /*
     * ========================================================
     * BUILD AUTHORITY-DERIVED EXECUTIVE CONTEXT
     * ========================================================
     */

    const context =
      buildExecutiveContext({
        executive: {
          id:
            user.id,

          fullName:
            user.fullName,

          email:
            user.email,

          userRole:
            user.role,

          organizationRole:
            membership.role,
        },

        organization: {
          id:
            organization.id,

          name:
            organization.name,

          tradingName:
            organization.tradingName,

          industry:
            organization.industry,

          country:
            organization.country,

          trustScore:
            organization.trustScore,

          complianceScore:
            organization.complianceScore,

          onboardingCompleted:
            organization.onboardingCompleted,
        },

        workflows:
          workflows.map(
            (workflow) => ({
              workflowId:
                workflow.workflowId,

              progress:
                workflow.progress,

              completed:
                workflow.completed,

              completedStepIds:
                workflow.completedStepIds,

              startedAt:
                workflow.startedAt,

              completedAt:
                workflow.completedAt,

              updatedAt:
                workflow.updatedAt,
            })
          ),

        missions:
          missions.map(
            (mission) => ({
              id:
                mission.id,

              workflowId:
                mission.workflowId,

              actionId:
                mission.actionId,

              title:
                mission.title,

              route:
                mission.route,

              status:
                mission.status,

              progress:
                mission.progress,

              startedAt:
                mission.startedAt,

              completedAt:
                mission.completedAt,

              updatedAt:
                mission.updatedAt,
            })
          ),
      });

    /*
     * ========================================================
     * EXECUTE EXECUTIVE AI
     * ========================================================
     */

    const result =
      await executeExecutiveAI({
        message,
        context,
      });

    return NextResponse.json({
      success: true,

      organization: {
        id:
          organization.id,

        name:
          organization.name,
      },

      result,
    });
  } catch (error) {
    console.error(
      "POST /api/executive-ai failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to process Executive AI request.",
      },
      {
        status: 500,
      }
    );
  }
}
