import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ExecutiveMissionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

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
 * TYPES
 * ============================================================
 */

type AuthenticatedUser = {
  id: string;
  email: string;
  organizationId?: string | null;
  role?: string;
};

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
 * AUTHENTICATION
 * ============================================================
 */

function getAuthenticatedUser(
  req: NextRequest
): AuthenticatedUser | null {
  const token =
    req.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyToken(
      token
    ) as AuthenticatedUser;
  } catch {
    return null;
  }
}

/*
 * ============================================================
 * IDENTITY VALIDATION
 * ============================================================
 */

function isExecutiveActionId(
  value: string
): value is ExecutiveActionId {
  return value in EXECUTIVE_ACTIONS;
}

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
 * STATUS CONVERSION
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
 * SERIALIZATION
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
 *
 * Return the current organisation's most recent
 * active or paused Executive Mission.
 * ============================================================
 */

export async function GET(
  req: NextRequest
) {
  try {
    const user =
      getAuthenticatedUser(
        req
      );

    if (
      !user ||
      !user.organizationId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const mission =
      await prisma.executiveMission.findFirst({
        where: {
          organizationId:
            user.organizationId,

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
 *
 * Start a new Executive Mission.
 *
 * The Workflow Registry remains authoritative for:
 *
 * - workflow identity
 * - action identity
 * - route
 * ============================================================
 */

export async function POST(
  req: NextRequest
) {
  try {
    const user =
      getAuthenticatedUser(
        req
      );

    if (
      !user ||
      !user.organizationId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await req.json() as CreateMissionBody;

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

    if (
      !isExecutiveActionId(
        body.actionId
      ) ||
      !isExecutiveWorkflowId(
        body.workflowId
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

    const workflow =
      getExecutiveWorkflow(
        body.workflowId
      );

    /*
     * Prevent an action from launching
     * an unrelated workflow.
     */

    if (
      workflow.actionId !==
      body.actionId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Executive action "${body.actionId}" cannot launch workflow "${workflow.id}".`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * An organisation should have only
     * one current active mission.
     *
     * Previous active/paused missions are
     * cancelled before the new mission starts.
     */

    await prisma.$transaction(
      async (tx) => {
        await tx.executiveMission.updateMany({
          where: {
            organizationId:
              user.organizationId!,

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
      }
    );

    const mission =
      await prisma.executiveMission.create({
        data: {
          organizationId:
            user.organizationId,

          workflowId:
            workflow.id,

          actionId:
            workflow.actionId,

          title:
            body.title.trim() ||
            workflow.title,

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

    /*
     * Record the mission launch.
     *
     * We intentionally use only fields
     * guaranteed by the current AuditLog
     * Prisma model.
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
 *
 * Update mission progress or mission status.
 * ============================================================
 */

export async function PATCH(
  req: NextRequest
) {
  try {
    const user =
      getAuthenticatedUser(
        req
      );

    if (
      !user ||
      !user.organizationId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await req.json() as UpdateMissionBody;

    if (
      typeof body.missionId !==
      "string"
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

    const existingMission =
      await prisma.executiveMission.findFirst({
        where: {
          id:
            body.missionId,

          organizationId:
            user.organizationId,
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

      status =
        progress >= 100
          ? ExecutiveMissionStatus.COMPLETED
          : ExecutiveMissionStatus.ACTIVE;
    }

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
     * Completion always means 100%.
     */

    if (
      status ===
      ExecutiveMissionStatus.COMPLETED
    ) {
      progress = 100;
    }

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
 *
 * Cancel the current mission.
 * ============================================================
 */

export async function DELETE(
  req: NextRequest
) {
  try {
    const user =
      getAuthenticatedUser(
        req
      );

    if (
      !user ||
      !user.organizationId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    await prisma.executiveMission.updateMany({
      where: {
        organizationId:
          user.organizationId,

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
