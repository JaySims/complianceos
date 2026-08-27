import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  canReadOrganizationWorkflow,
  canWriteOrganizationWorkflow,
  resolveOrganizationAccess,
  type OrganizationAccessFailureReason,
} from "@/lib/auth/organizationAccess";

/*
 * ============================================================
 * WORKFLOW CONFIGURATION
 * ============================================================
 */

const VALID_WORKFLOW_IDS =
  new Set<string>([
    "governance",
    "compliance",
    "funding",
    "procurement",
  ]);

function isValidWorkflowId(
  workflowId: string
): boolean {
  return VALID_WORKFLOW_IDS.has(
    workflowId
  );
}

function normalizeProgress(
  value: number
): number {
  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value)
    )
  );
}

/*
 * ============================================================
 * AUTHORIZATION FAILURE RESPONSE
 * ============================================================
 */

function organizationAccessFailure(
  reason:
    OrganizationAccessFailureReason
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
 * GET WORKFLOW PROGRESS
 * ============================================================
 */

export async function GET(
  req: NextRequest,

  context: {
    params: Promise<{
      workflowId: string;
    }>;
  }
) {
  try {
    /*
     * ========================================================
     * AUTHENTICATION + ORGANISATION AUTHORIZATION
     * ========================================================
     *
     * JWT proves identity.
     *
     * PostgreSQL OrganizationMember proves
     * organisation access.
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

    if (
      !canReadOrganizationWorkflow(
        access.context
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You do not have permission to read organisation workflows.",
        },

        {
          status: 403,
        }
      );
    }

    /*
     * ========================================================
     * WORKFLOW IDENTITY
     * ========================================================
     */

    const {
      workflowId,
    } = await context.params;

    if (
      !isValidWorkflowId(
        workflowId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid workflow.",
        },

        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * LOAD WORKFLOW PROGRESS
     * ========================================================
     *
     * The organisation boundary comes from
     * verified active membership.
     */

    const progress =
      await prisma.workflowProgress.findUnique({
        where: {
          organizationId_workflowId: {
            organizationId:
              access.context.organization.id,

            workflowId,
          },
        },
      });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error(
      "Unable to load workflow progress:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load workflow progress.",
      },

      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * CREATE / UPDATE WORKFLOW PROGRESS
 * ============================================================
 */

export async function PUT(
  req: NextRequest,

  context: {
    params: Promise<{
      workflowId: string;
    }>;
  }
) {
  try {
    /*
     * ========================================================
     * AUTHENTICATION + ORGANISATION AUTHORIZATION
     * ========================================================
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

    if (
      !canWriteOrganizationWorkflow(
        access.context
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You do not have permission to modify organisation workflows.",
        },

        {
          status: 403,
        }
      );
    }

    /*
     * ========================================================
     * WORKFLOW IDENTITY
     * ========================================================
     */

    const {
      workflowId,
    } = await context.params;

    if (
      !isValidWorkflowId(
        workflowId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid workflow.",
        },

        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * PARSE UNTRUSTED REQUEST BODY
     * ========================================================
     */

    const body: unknown =
      await req.json();

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid request body.",
        },

        {
          status: 400,
        }
      );
    }

    const input =
      body as Record<
        string,
        unknown
      >;

    /*
     * ========================================================
     * VALIDATE COMPLETED STEP IDS
     * ========================================================
     */

    let completedStepIds:
      | string[]
      | null = null;

    if (
      Array.isArray(
        input.completedStepIds
      )
    ) {
      const validStepIds =
        input.completedStepIds.filter(
          (
            value: unknown
          ): value is string =>
            typeof value ===
              "string" &&
            value.trim().length > 0
        );

      completedStepIds =
        Array.from(
          new Set<string>(
            validStepIds
          )
        );
    }

    if (!completedStepIds) {
      return NextResponse.json(
        {
          success: false,

          message:
            "completedStepIds must be an array.",
        },

        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * VALIDATE PROGRESS
     * ========================================================
     */

    const requestedProgress =
      typeof input.progress ===
        "number" &&
      Number.isFinite(
        input.progress
      )
        ? normalizeProgress(
            input.progress
          )
        : 0;

    /*
     * Workflow completion may be explicitly
     * requested or inferred from 100%.
     */

    const completed =
      input.completed === true ||
      requestedProgress >= 100;

    const now =
      new Date();

    /*
     * ========================================================
     * PERSIST WORKFLOW PROGRESS
     * ========================================================
     *
     * organizationId now comes exclusively from
     * verified OrganizationMember access.
     */

    const progress =
      await prisma.workflowProgress.upsert({
        where: {
          organizationId_workflowId: {
            organizationId:
              access.context.organization.id,

            workflowId,
          },
        },

        create: {
          organizationId:
            access.context.organization.id,

          workflowId,

          completedStepIds,

          progress:
            requestedProgress,

          completed,

          startedAt:
            now,

          completedAt:
            completed
              ? now
              : null,
        },

        update: {
          completedStepIds,

          progress:
            requestedProgress,

          completed,

          completedAt:
            completed
              ? now
              : null,
        },
      });

    /*
     * ========================================================
     * AUDIT TRAIL
     * ========================================================
     */

    await prisma.auditLog.create({
      data: {
        action:
          "WORKFLOW_PROGRESS_UPDATED",

        entity:
          "WorkflowProgress",

        entityId:
          progress.id,

        userEmail:
          access.context.user.email,
      },
    });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error(
      "Unable to update workflow progress:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to update workflow progress.",
      },

      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * RESET WORKFLOW PROGRESS
 * ============================================================
 */

export async function DELETE(
  req: NextRequest,

  context: {
    params: Promise<{
      workflowId: string;
    }>;
  }
) {
  try {
    /*
     * ========================================================
     * AUTHENTICATION + ORGANISATION AUTHORIZATION
     * ========================================================
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

    if (
      !canWriteOrganizationWorkflow(
        access.context
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You do not have permission to reset organisation workflows.",
        },

        {
          status: 403,
        }
      );
    }

    /*
     * ========================================================
     * WORKFLOW IDENTITY
     * ========================================================
     */

    const {
      workflowId,
    } = await context.params;

    if (
      !isValidWorkflowId(
        workflowId
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid workflow.",
        },

        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * LOCATE WORKFLOW STATE
     * ========================================================
     */

    const existing =
      await prisma.workflowProgress.findUnique({
        where: {
          organizationId_workflowId: {
            organizationId:
              access.context.organization.id,

            workflowId,
          },
        },
      });

    /*
     * Reset is intentionally idempotent.
     */

    if (!existing) {
      return NextResponse.json({
        success: true,
      });
    }

    /*
     * ========================================================
     * DELETE WORKFLOW PROGRESS
     * ========================================================
     */

    await prisma.workflowProgress.delete({
      where: {
        id:
          existing.id,
      },
    });

    /*
     * ========================================================
     * AUDIT TRAIL
     * ========================================================
     */

    await prisma.auditLog.create({
      data: {
        action:
          "WORKFLOW_PROGRESS_RESET",

        entity:
          "WorkflowProgress",

        entityId:
          existing.id,

        userEmail:
          access.context.user.email,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Unable to reset workflow progress:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to reset workflow progress.",
      },

      {
        status: 500,
      }
    );
  }
}
