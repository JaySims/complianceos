import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/*
 * ============================================================
 * WORKFLOW CONFIGURATION
 * ============================================================
 */

const VALID_WORKFLOW_IDS = new Set<string>([
  "governance",
  "compliance",
  "funding",
  "procurement",
]);

function isValidWorkflowId(
  workflowId: string
): boolean {
  return VALID_WORKFLOW_IDS.has(workflowId);
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
 * GET WORKFLOW PROGRESS
 * ============================================================
 */

export async function GET(
  _req: NextRequest,
  context: {
    params: Promise<{
      workflowId: string;
    }>;
  }
) {
  try {
    /*
     * Resolve authenticated user.
     *
     * Organisation identity is determined by
     * server-side authentication state.
     */

    const user = await getCurrentUser();

    if (!user) {
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

    /*
     * Resolve workflow ID.
     */

    const {
      workflowId,
    } = await context.params;

    if (!isValidWorkflowId(workflowId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid workflow.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Load workflow progress belonging only
     * to the authenticated organisation.
     */

    const progress =
      await prisma.workflowProgress.findUnique({
        where: {
          organizationId_workflowId: {
            organizationId:
              user.organizationId,

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
     * Resolve authenticated user.
     */

    const user = await getCurrentUser();

    if (!user) {
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

    /*
     * Resolve workflow ID.
     */

    const {
      workflowId,
    } = await context.params;

    if (!isValidWorkflowId(workflowId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid workflow.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Parse request body as untrusted input.
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
      body as Record<string, unknown>;

    /*
     * ========================================================
     * VALIDATE COMPLETED STEP IDS
     * ========================================================
     *
     * Browser input must never be passed directly
     * into Prisma.
     *
     * Only non-empty strings are accepted.
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
            typeof value === "string" &&
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
      typeof input.progress === "number" &&
      Number.isFinite(input.progress)
        ? normalizeProgress(
            input.progress
          )
        : 0;

    /*
     * Workflow completion can be explicitly
     * requested or inferred from 100% progress.
     */

    const completed =
      input.completed === true ||
      requestedProgress >= 100;

    const now = new Date();

    /*
     * ========================================================
     * PERSIST WORKFLOW PROGRESS
     * ========================================================
     *
     * organizationId + workflowId forms the
     * organisation-scoped unique boundary.
     */

    const progress =
      await prisma.workflowProgress.upsert({
        where: {
          organizationId_workflowId: {
            organizationId:
              user.organizationId,

            workflowId,
          },
        },

        create: {
          organizationId:
            user.organizationId,

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
     *
     * Keep this compatible with the CURRENT
     * AuditLog database model:
     *
     * action
     * entity
     * entityId
     * userEmail
     *
     * Additional structured audit fields can
     * be introduced in a later migration.
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
          user.email,
      },
    });

    /*
     * Return persisted state.
     */

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
  _req: NextRequest,
  context: {
    params: Promise<{
      workflowId: string;
    }>;
  }
) {
  try {
    /*
     * Resolve authenticated user.
     */

    const user = await getCurrentUser();

    if (!user) {
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

    /*
     * Resolve workflow ID.
     */

    const {
      workflowId,
    } = await context.params;

    if (!isValidWorkflowId(workflowId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid workflow.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Locate workflow state inside the
     * authenticated organisation boundary.
     */

    const existing =
      await prisma.workflowProgress.findUnique({
        where: {
          organizationId_workflowId: {
            organizationId:
              user.organizationId,

            workflowId,
          },
        },
      });

    /*
     * If the workflow has never been started,
     * reset is still considered successful.
     */

    if (!existing) {
      return NextResponse.json({
        success: true,
      });
    }

    /*
     * Delete persisted workflow progress.
     */

    await prisma.workflowProgress.delete({
      where: {
        id:
          existing.id,
      },
    });

    /*
     * Record the reset operation using fields
     * supported by the current AuditLog model.
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
          user.email,
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
