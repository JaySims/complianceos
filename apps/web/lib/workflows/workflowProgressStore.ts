import type {
  ExecutiveWorkflowId,
} from "@/lib/workflows/executiveWorkflowDefinitions";

export type WorkflowProgressState = {
  workflowId:
    ExecutiveWorkflowId;

  completedStepIds:
    string[];

  updatedAt:
    string;
};

type WorkflowProgressApiRecord = {
  id: string;

  organizationId: string;

  workflowId: string;

  completedStepIds:
    string[];

  progress:
    number;

  completed:
    boolean;

  startedAt:
    string | null;

  completedAt:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;
};

type WorkflowProgressApiResponse = {
  success: boolean;

  progress?:
    | WorkflowProgressApiRecord
    | null;

  message?: string;
};

const STORAGE_PREFIX =
  "complianceos.workflow.progress.";

/*
 * ============================================================
 * STORAGE KEY
 * ============================================================
 */

function storageKey(
  workflowId:
    ExecutiveWorkflowId
): string {
  return `${STORAGE_PREFIX}${workflowId}`;
}

/*
 * ============================================================
 * EMPTY WORKFLOW STATE
 * ============================================================
 */

function emptyWorkflowProgress(
  workflowId:
    ExecutiveWorkflowId
): WorkflowProgressState {
  return {
    workflowId,

    completedStepIds:
      [],

    updatedAt:
      new Date(0).toISOString(),
  };
}

/*
 * ============================================================
 * NORMALIZE STEP IDS
 * ============================================================
 */

function normalizeStepIds(
  values: unknown
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const valid =
    values.filter(
      (
        value: unknown
      ): value is string =>
        typeof value === "string" &&
        value.trim().length > 0
    );

  return Array.from(
    new Set<string>(
      valid
    )
  );
}

/*
 * ============================================================
 * LOCAL CACHE
 * ============================================================
 *
 * localStorage is no longer the authoritative database.
 *
 * It exists only as:
 *
 * - immediate UI cache
 * - temporary offline resilience
 * - migration compatibility
 *
 * PostgreSQL is the durable source of truth.
 */

export function loadWorkflowProgress(
  workflowId:
    ExecutiveWorkflowId
): WorkflowProgressState {
  if (
    typeof window ===
    "undefined"
  ) {
    return emptyWorkflowProgress(
      workflowId
    );
  }

  const raw =
    localStorage.getItem(
      storageKey(
        workflowId
      )
    );

  if (!raw) {
    return emptyWorkflowProgress(
      workflowId
    );
  }

  try {
    const parsed =
      JSON.parse(
        raw
      ) as Partial<
        WorkflowProgressState
      >;

    return {
      workflowId,

      completedStepIds:
        normalizeStepIds(
          parsed.completedStepIds
        ),

      updatedAt:
        typeof parsed.updatedAt ===
        "string"
          ? parsed.updatedAt
          : new Date(
              0
            ).toISOString(),
    };
  } catch {
    return emptyWorkflowProgress(
      workflowId
    );
  }
}

/*
 * ============================================================
 * SAVE LOCAL CACHE
 * ============================================================
 *
 * Server persistence is handled separately
 * by persistWorkflowProgress().
 */

export function saveWorkflowProgress(
  state:
    WorkflowProgressState
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    storageKey(
      state.workflowId
    ),

    JSON.stringify(
      state
    )
  );
}

/*
 * ============================================================
 * CALCULATE WORKFLOW PERCENTAGE
 * ============================================================
 */

function normalizePercentage(
  value: number
): number {
  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        value
      )
    )
  );
}

/*
 * ============================================================
 * LOAD AUTHORITATIVE SERVER STATE
 * ============================================================
 */

export async function loadWorkflowProgressFromServer(
  workflowId:
    ExecutiveWorkflowId
): Promise<WorkflowProgressState | null> {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  console.log(
    "[WorkflowDebug] loading workflow from server",
    {
      workflowId,
    }
  );

  try {
    const response =
      await fetch(
        `/api/workflows/${workflowId}`,
        {
          method:
            "GET",

          credentials:
            "include",

          headers: {
            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );

    console.log(
      "[WorkflowDebug] GET response",
      {
        workflowId,

        status:
          response.status,

        ok:
          response.ok,
      }
    );

    if (
      response.status ===
      401
    ) {
      console.warn(
        "[WorkflowDebug] workflow GET unauthorized",
        {
          workflowId,
        }
      );

      return null;
    }

    if (!response.ok) {
      console.error(
        "Unable to load workflow progress from server:",
        response.status
      );

      return null;
    }

    const result =
      await response.json() as
        WorkflowProgressApiResponse;

    console.log(
      "[WorkflowDebug] GET payload",
      result
    );

    if (
      !result.success
    ) {
      return null;
    }

    /*
     * No database record means the workflow
     * has not yet been persisted.
     *
     * Preserve any local legacy/cache state so
     * it can later be uploaded.
     */

    if (!result.progress) {
      console.log(
        "[WorkflowDebug] no server workflow record exists yet",
        {
          workflowId,
        }
      );

      return null;
    }

    const state:
      WorkflowProgressState = {
        workflowId,

        completedStepIds:
          normalizeStepIds(
            result.progress.completedStepIds
          ),

        updatedAt:
          result.progress.updatedAt,
      };

    /*
     * Refresh local cache with authoritative
     * PostgreSQL state.
     */

    saveWorkflowProgress(
      state
    );

    console.log(
      "[WorkflowDebug] server workflow hydrated",
      state
    );

    return state;
  } catch (error) {
    console.error(
      "[WorkflowDebug] workflow server hydration failed",
      error
    );

    return null;
  }
}

/*
 * ============================================================
 * PERSIST STATE TO SERVER
 * ============================================================
 */

export async function persistWorkflowProgress(
  state:
    WorkflowProgressState,

  progress:
    number,

  completed:
    boolean = false
): Promise<boolean> {
  console.log(
    "[WorkflowDebug] persistWorkflowProgress entered",
    {
      workflowId:
        state.workflowId,

      completedStepIds:
        state.completedStepIds,

      progress,

      completed,

      browser:
        typeof window !==
        "undefined",
    }
  );

  if (
    typeof window ===
    "undefined"
  ) {
    console.error(
      "[WorkflowDebug] persistence aborted because window is undefined"
    );

    return false;
  }

  try {
    const normalizedProgress =
      normalizePercentage(
        progress
      );

    const requestBody = {
      completedStepIds:
        normalizeStepIds(
          state.completedStepIds
        ),

      progress:
        normalizedProgress,

      completed:
        completed ||
        normalizedProgress >=
          100,
    };

    const endpoint =
      `/api/workflows/${state.workflowId}`;

    console.log(
      "[WorkflowDebug] sending PUT",
      {
        endpoint,

        requestBody,
      }
    );

    const response =
      await fetch(
        endpoint,
        {
          method:
            "PUT",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify(
              requestBody
            ),
        }
      );

    console.log(
      "[WorkflowDebug] PUT response",
      {
        workflowId:
          state.workflowId,

        status:
          response.status,

        ok:
          response.ok,
      }
    );

    /*
     * Read the response body once.
     *
     * This also lets us inspect API errors
     * during this diagnostic phase.
     */

    let result:
      WorkflowProgressApiResponse;

    try {
      result =
        await response.json() as
          WorkflowProgressApiResponse;
    } catch (error) {
      console.error(
        "[WorkflowDebug] PUT response was not valid JSON",
        error
      );

      return false;
    }

    console.log(
      "[WorkflowDebug] PUT payload",
      result
    );

    if (!response.ok) {
      console.error(
        "[WorkflowDebug] unable to persist workflow progress",
        {
          status:
            response.status,

          message:
            result.message,
        }
      );

      return false;
    }

    if (
      !result.success
    ) {
      console.error(
        "[WorkflowDebug] workflow API returned success=false",
        result
      );

      return false;
    }

    /*
     * If the server returned authoritative state,
     * refresh the local cache timestamp and
     * completed step collection.
     */

    if (result.progress) {
      const authoritativeState:
        WorkflowProgressState = {
          workflowId:
            state.workflowId,

          completedStepIds:
            normalizeStepIds(
              result.progress.completedStepIds
            ),

          updatedAt:
            result.progress.updatedAt,
        };

      saveWorkflowProgress(
        authoritativeState
      );

      console.log(
        "[WorkflowDebug] authoritative workflow saved to local cache",
        authoritativeState
      );
    }

    console.log(
      "[WorkflowDebug] persistence completed successfully",
      {
        workflowId:
          state.workflowId,
      }
    );

    return true;
  } catch (error) {
    console.error(
      "[WorkflowDebug] workflow persistence failed",
      error
    );

    return false;
  }
}

/*
 * ============================================================
 * COMPLETE STEP
 * ============================================================
 */

export function completeWorkflowStep(
  workflowId:
    ExecutiveWorkflowId,

  stepId:
    string
): WorkflowProgressState {
  console.log(
    "[WorkflowDebug] completeWorkflowStep entered",
    {
      workflowId,

      stepId,
    }
  );

  const current =
    loadWorkflowProgress(
      workflowId
    );

  const completedStepIds =
    current.completedStepIds.includes(
      stepId
    )
      ? current.completedStepIds
      : [
          ...current.completedStepIds,
          stepId,
        ];

  const updated:
    WorkflowProgressState = {
      workflowId,

      completedStepIds,

      updatedAt:
        new Date().toISOString(),
    };

  /*
   * Immediate local cache update.
   */

  saveWorkflowProgress(
    updated
  );

  console.log(
    "[WorkflowDebug] workflow step saved locally",
    updated
  );

  return updated;
}

/*
 * ============================================================
 * REOPEN STEP
 * ============================================================
 */

export function reopenWorkflowStep(
  workflowId:
    ExecutiveWorkflowId,

  stepId:
    string
): WorkflowProgressState {
  const current =
    loadWorkflowProgress(
      workflowId
    );

  const updated:
    WorkflowProgressState = {
      workflowId,

      completedStepIds:
        current.completedStepIds.filter(
          (id) =>
            id !== stepId
        ),

      updatedAt:
        new Date().toISOString(),
    };

  saveWorkflowProgress(
    updated
  );

  return updated;
}

/*
 * ============================================================
 * RESET WORKFLOW
 * ============================================================
 */

export function resetWorkflowProgress(
  workflowId:
    ExecutiveWorkflowId
): WorkflowProgressState {
  const reset:
    WorkflowProgressState = {
      workflowId,

      completedStepIds:
        [],

      updatedAt:
        new Date().toISOString(),
    };

  saveWorkflowProgress(
    reset
  );

  return reset;
}

/*
 * ============================================================
 * RESET SERVER WORKFLOW
 * ============================================================
 */

export async function resetWorkflowProgressOnServer(
  workflowId:
    ExecutiveWorkflowId
): Promise<boolean> {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  try {
    console.log(
      "[WorkflowDebug] sending DELETE",
      {
        workflowId,
      }
    );

    const response =
      await fetch(
        `/api/workflows/${workflowId}`,
        {
          method:
            "DELETE",

          credentials:
            "include",

          headers: {
            Accept:
              "application/json",
          },
        }
      );

    console.log(
      "[WorkflowDebug] DELETE response",
      {
        workflowId,

        status:
          response.status,

        ok:
          response.ok,
      }
    );

    if (!response.ok) {
      console.error(
        "Unable to reset workflow on server:",
        response.status
      );

      return false;
    }

    const result =
      await response.json() as {
        success?: boolean;
      };

    return result.success ===
      true;
  } catch (error) {
    console.error(
      "[WorkflowDebug] workflow server reset failed",
      error
    );

    return false;
  }
}
