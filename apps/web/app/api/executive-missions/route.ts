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
  canWriteOrganizationWorkflow,
  type OrganizationAccessFailureReason,
} from "@/lib/auth/organizationAccess";

import {
  EXECUTIVE_ACTIONS,
  type ExecutiveActionId,
} from "@/lib/actions/executiveActionRegistry";

import {
  getExecutiveWorkflow,
  type ExecutiveWorkflowId,
} from "@/lib/workflows/executiveWorkflowDefinitions";

/*
 * ============================================================
 * COMPLIANCEOS EXECUTIVE MISSION API
 * ============================================================
 *
 * SECURITY MODEL
 *
 * JWT
 *   ↓
 * authenticated user
 *   ↓
 * PostgreSQL User
 *   ↓
 * active OrganizationMember
 *   ↓
 * Organization
 *   ↓
 * role authorization
 *   ↓
 * Executive Mission
 *
 * IMPORTANT
 *
 * The organizationId contained inside the JWT is NOT used as
 * the authoritative tenant boundary.
 *
 * Organization access is resolved through
 * resolveOrganizationAccess(), which verifies the current
 * database User and active OrganizationMember relationship.
 * ============================================================
 */

/*
 * ============================================================
 * REQUEST TYPES
 * ============================================================
 */

type CreateMissionBody = {
  actionId?: unknown;
  workflowId?: unknown;
  title?: unknown;
};

type UpdateMissionBody = {
  missionId?: unknown;
  progress?: unknown;
  status?: unknown;
};

/*
 * ============================================================
 * ORGANIZATION ACCESS FAILURE RESPONSE
 * ============================================================
 */

function organizationAccessFailure(
  reason: OrganizationAccessFailureReason
) {
  const authenticationFailure =
    reason === "MISSING_TOKEN" ||
    reason === "INVALID_TOKEN" ||
    reason === "INVALID_IDENTITY" ||
    reason === "USER_NOT_FOUND";

  return NextResponse.json(
    {
      success: false,

      message:
        authenticationFailure
          ? "Unauthorized"
          : "Organisation access denied.",

      reason,
    },
    {
      status:
        authenticationFailure
          ? 401
          : 403,
    }
  );
}

/*
 * ============================================================
 * EXECUTIVE ACTION VALIDATION
 * ============================================================
 */

function isExecutiveActionId(
  value: string
): value is ExecutiveActionId {
  return value in EXECUTIVE_ACTIONS;
}

/*
 * ============================================================
 * EXECUTIVE WORKFLOW VALIDATION
 * ============================================================
 */

function isExecutiveWorkflowId(
  value: string
): value is ExecutiveWorkflowId {
  return (
    value === "governance" ||
    value === "compliance" ||
    value === "funding" ||
    value === "procurement"
  );
}

/*
 * ============================================================
 * CLIENT STATUS SERIALIZATION
 * ============================================================
 */

function toClientStatus(
  status: ExecutiveMissionStatus
):
  | "active"
  | "paused"
  | "completed" {
  switch (status) {
    case ExecutiveMissionStatus.PAUSED:
      return "paused";

    case ExecutiveMissionStatus.COMPLETED:
      return "completed";

    case ExecutiveMissionStatus.ACTIVE:
    default:
      return "active";
  }
}

/*
 * ============================================================
 * DATABASE STATUS CONVERSION
 * ============================================================
 */

function toDatabaseStatus(
  status: string
): ExecutiveMissionStatus | null {
  switch (status) {
    case "active":
      return ExecutiveMissionStatus.ACTIVE;

    case "paused":
      return ExecutiveMissionStatus.PAUSED;

    case "completed":
      return ExecutiveMissionStatus.COMPLETED;

    default:
      return null;
  }
}

/*
 * ============================================================
 * MISSION SERIALIZATION
 * ============================================================
 */

function serializeMission(
  mission: {
    id: string;
    actionId: string;
    title: string;
    workflowId: string;
    route: string;
    status: ExecutiveMissionStatus;
    progress: number;
    startedAt: Date;
    updatedAt: Date;
  }
) {
  return {
    id:
      mission.id,

    actionId:
      mission.actionId,

    title:
      mission.title,

    workflowId:
      mission.workflowId,

    route:
      mission.route,

    status:
      toClientStatus(
        mission.status
      ),

    progress:
      mission.progress,

    startedAt:
      mission.startedAt.toISOString(),

    updatedAt:
      mission.updatedAt.toISOString(),
  };
}

/*
 * ============================================================
 * GET
 * ============================================================
 *
 * Returns the current organization's most recent ACTIVE or
 * PAUSED Executive Mission.
 *
 * READ AUTHORITY
 *
 * OWNER
 * ADMIN
 * MANAGER
 * AUDITOR
 * MEMBER
 *
 * Tenant identity comes from the authoritative active
 * OrganizationMember relationship.
 * ============================================================
 */

export async function GET(
  req: NextRequest
) {
  try {
    /*
     * Resolve authenticated organization access.
     */

    const access =
      await resolveOrganizationAccess(
        req
      );

    if (!access.authorized) {
      return organizationAccessFailure(
        access.reason
      );
    }

    /*
     * Apply workflow read authorization.
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
            "You do not have permission to read Executive Missions.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      organization,
    } = access.context;

    /*
     * Mission lookup is organization-scoped.
     */

    const mission =
      await prisma.executiveMission.findFirst({
        where: {
          organizationId:
            organization.id,

          status: {
            in: [
              ExecutiveMissionStatus.ACTIVE,
              ExecutiveMissionStatus.PAUSED,
            ],
          },
        },

        orderBy: {
          updatedAt:
            "desc",
        },
      });

    /*
     * No active mission is a valid state.
     */

    if (!mission) {
      return NextResponse.json({
        success: true,
        mission: null,
      });
    }

    return NextResponse.json({
      success: true,

      mission:
        serializeMission(
          mission
        ),
    });
  } catch (error) {
    console.error(
      "GET /api/executive-missions failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load Executive Mission.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * POST
 * ============================================================
 *
 * Starts a new Executive Mission.
 *
 * WRITE AUTHORITY
 *
 * OWNER
 * ADMIN
 * MANAGER
 * MEMBER
 *
 * AUDITOR is intentionally excluded.
 *
 * The Workflow Registry remains authoritative for:
 *
 * - workflow identity
 * - action identity
 * - workflow route
 *
 * Cancellation of an existing mission and creation of the new
 * mission occur in one database transaction.
 * ============================================================
 */

export async function POST(
  req: NextRequest
) {
  try {
    /*
     * Resolve organization authority.
     */

    const access =
      await resolveOrganizationAccess(
        req
      );

    if (!access.authorized) {
      return organizationAccessFailure(
        access.reason
      );
    }

    /*
     * Apply write authorization.
     */

    if (
      !canWriteOrganizationWorkflow(
        access.context
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You do not have permission to start Executive Missions.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      user,
      organization,
    } = access.context;

    /*
     * Parse request.
     */

    const body =
      await req.json() as CreateMissionBody;

    /*
     * Validate primitive request values.
     *
     * This narrowing happens BEFORE the asynchronous Prisma
     * transaction so values used by the transaction have
     * concrete string types.
     */

    if (
      typeof body.actionId !==
        "string" ||
      typeof body.workflowId !==
        "string" ||
      typeof body.title !==
        "string"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid Executive Mission request.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Copy validated values into concrete local strings.
     *
     * This is deliberate. TypeScript does not need to preserve
     * narrowing of mutable object properties across the
     * asynchronous transaction callback.
     */

    const actionId =
      body.actionId;

    const workflowId =
      body.workflowId;

    const requestedTitle =
      body.title;

    /*
     * Validate registry identities.
     */

    if (
      !isExecutiveActionId(
        actionId
      ) ||
      !isExecutiveWorkflowId(
        workflowId
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Unknown Executive Mission identity.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Resolve authoritative workflow definition.
     */

    const workflow =
      getExecutiveWorkflow(
        workflowId
      );

    /*
     * Prevent an action from launching an unrelated workflow.
     */

    if (
      workflow.actionId !==
      actionId
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `Executive action "${actionId}" cannot launch workflow "${workflow.id}".`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Resolve mission title BEFORE entering the asynchronous
     * Prisma transaction.
     */

    const missionTitle =
      requestedTitle.trim() ||
      workflow.title;

    /*
     * ========================================================
     * ATOMIC MISSION REPLACEMENT
     * ========================================================
     *
     * The old active mission is cancelled and the replacement
     * is created in the SAME transaction.
     *
     * If mission creation fails, cancellation is rolled back.
     * ========================================================
     */

    const mission =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Cancel previous active/paused missions belonging
           * ONLY to this organization.
           */

          await tx.executiveMission.updateMany({
            where: {
              organizationId:
                organization.id,

              status: {
                in: [
                  ExecutiveMissionStatus.ACTIVE,
                  ExecutiveMissionStatus.PAUSED,
                ],
              },
            },

            data: {
              status:
                ExecutiveMissionStatus.CANCELLED,
            },
          });

          /*
           * Create replacement mission.
           */

          return tx.executiveMission.create({
            data: {
              organizationId:
                organization.id,

              workflowId:
                workflow.id,

              actionId:
                workflow.actionId,

              title:
                missionTitle,

              route:
                workflow.route,

              status:
                ExecutiveMissionStatus.ACTIVE,

              progress:
                0,

              startedByUserId:
                user.id,
            },
          });
        }
      );

    /*
     * ========================================================
     * AUDIT TRAIL
     * ========================================================
     */

    await prisma.auditLog.create({
      data: {
        action:
          "EXECUTIVE_MISSION_STARTED",

        entity:
          "ExecutiveMission",

        entityId:
          mission.id,

        userEmail:
          user.email,
      },
    });

    return NextResponse.json(
      {
        success: true,

        mission:
          serializeMission(
            mission
          ),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/executive-missions failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to start Executive Mission.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * PATCH
 * ============================================================
 *
 * Updates mission progress and/or status.
 *
 * Mission lookup is constrained by BOTH:
 *
 * mission ID
 * organization ID
 *
 * This prevents possession of another tenant's mission ID from
 * becoming an authorization bypass.
 *
 * WRITE AUTHORITY
 *
 * OWNER
 * ADMIN
 * MANAGER
 * MEMBER
 *
 * AUDITOR is intentionally excluded.
 * ============================================================
 */

export async function PATCH(
  req: NextRequest
) {
  try {
    /*
     * Resolve organization authority.
     */

    const access =
      await resolveOrganizationAccess(
        req
      );

    if (!access.authorized) {
      return organizationAccessFailure(
        access.reason
      );
    }

    /*
     * Apply write authorization.
     */

    if (
      !canWriteOrganizationWorkflow(
        access.context
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You do not have permission to modify Executive Missions.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      organization,
    } = access.context;

    /*
     * Parse request.
     */

    const body =
      await req.json() as UpdateMissionBody;

    /*
     * Mission ID is mandatory.
     */

    if (
      typeof body.missionId !==
        "string" ||
      body.missionId.trim().length ===
        0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Mission ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const missionId =
      body.missionId.trim();

    /*
     * ========================================================
     * TENANT-SCOPED MISSION LOOKUP
     * ========================================================
     *
     * Never authorize an update using missionId alone.
     * ========================================================
     */

    const existingMission =
      await prisma.executiveMission.findFirst({
        where: {
          id:
            missionId,

          organizationId:
            organization.id,
        },
      });

    if (!existingMission) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Executive Mission not found.",
        },
        {
          status: 404,
        }
      );
    }

    let progress:
      number | undefined;

    let status:
      ExecutiveMissionStatus | undefined;

    /*
     * ========================================================
     * PROGRESS VALIDATION
     * ========================================================
     */

    if (
      body.progress !==
      undefined
    ) {
      if (
        typeof body.progress !==
          "number" ||
        !Number.isFinite(
          body.progress
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Mission progress must be a number.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Normalize progress to integer range 0–100.
       */

      progress =
        Math.min(
          100,
          Math.max(
            0,
            Math.round(
              body.progress
            )
          )
        );

      /*
       * Progress reaching 100 automatically completes the
       * mission.
       */

      status =
        progress >= 100
          ? ExecutiveMissionStatus.COMPLETED
          : ExecutiveMissionStatus.ACTIVE;
    }

    /*
     * ========================================================
     * STATUS VALIDATION
     * ========================================================
     */

    if (
      body.status !==
      undefined
    ) {
      if (
        typeof body.status !==
          "string"
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Invalid mission status.",
          },
          {
            status: 400,
          }
        );
      }

      const requestedStatus =
        toDatabaseStatus(
          body.status
        );

      if (!requestedStatus) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Unsupported mission status.",
          },
          {
            status: 400,
          }
        );
      }

      status =
        requestedStatus;
    }

    /*
     * A completed mission must always represent 100%.
     */

    if (
      status ===
      ExecutiveMissionStatus.COMPLETED
    ) {
      progress = 100;
    }

    /*
     * ========================================================
     * DATABASE UPDATE
     * ========================================================
     */

    const mission =
      await prisma.executiveMission.update({
        where: {
          id:
            existingMission.id,
        },

        data: {
          ...(progress !== undefined
            ? {
                progress,
              }
            : {}),

          ...(status !== undefined
            ? {
                status,

                completedAt:
                  status ===
                  ExecutiveMissionStatus.COMPLETED
                    ? new Date()
                    : null,
              }
            : {}),
        },
      });

    return NextResponse.json({
      success: true,

      mission:
        serializeMission(
          mission
        ),
    });
  } catch (error) {
    console.error(
      "PATCH /api/executive-missions failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to update Executive Mission.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * DELETE
 * ============================================================
 *
 * Cancels the organization's current active/paused Executive
 * Missions.
 *
 * WRITE AUTHORITY
 *
 * OWNER
 * ADMIN
 * MANAGER
 * MEMBER
 *
 * AUDITOR is intentionally excluded.
 * ============================================================
 */

export async function DELETE(
  req: NextRequest
) {
  try {
    /*
     * Resolve organization authority.
     */

    const access =
      await resolveOrganizationAccess(
        req
      );

    if (!access.authorized) {
      return organizationAccessFailure(
        access.reason
      );
    }

    /*
     * Apply write authorization.
     */

    if (
      !canWriteOrganizationWorkflow(
        access.context
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You do not have permission to cancel Executive Missions.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      organization,
    } = access.context;

    /*
     * Cancel missions ONLY inside the resolved organization.
     */

    await prisma.executiveMission.updateMany({
      where: {
        organizationId:
          organization.id,

        status: {
          in: [
            ExecutiveMissionStatus.ACTIVE,
            ExecutiveMissionStatus.PAUSED,
          ],
        },
      },

      data: {
        status:
          ExecutiveMissionStatus.CANCELLED,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE /api/executive-missions failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to clear Executive Mission.",
      },
      {
        status: 500,
      }
    );
  }
}
