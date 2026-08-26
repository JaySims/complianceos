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

export type ActiveExecutiveMission = {
  id: string;

  actionId: ExecutiveActionId;

  title: string;

  workflowId: ExecutiveWorkflowId;

  route: string;

  status:
    | "active"
    | "paused"
    | "completed";

  progress: number;

  startedAt: string;

  updatedAt: string;
};

type ExecutiveMissionApiResponse = {
  success: boolean;

  mission?:
    | ActiveExecutiveMission
    | null;

  message?: string;
};

/*
 * ============================================================
 * LOCAL CACHE
 * ============================================================
 *
 * PostgreSQL is becoming the durable source
 * of truth.
 *
 * localStorage remains as a fast browser cache
 * and temporary offline/fallback layer.
 */

const STORAGE_KEY =
  "complianceos.executive.active-mission";

/*
 * ============================================================
 * LEGACY WORKFLOW IDENTITIES
 * ============================================================
 */

const LEGACY_WORKFLOW_IDS: Record<
  string,
  ExecutiveWorkflowId
> = {
  "governance-verification":
    "governance",

  "compliance-review":
    "compliance",

  "funding-readiness":
    "funding",

  "procurement-readiness":
    "procurement",
};

/*
 * ============================================================
 * VALIDATION
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

function isExecutiveActionId(
  value: string
): value is ExecutiveActionId {
  return value in EXECUTIVE_ACTIONS;
}

function resolveWorkflowId(
  workflowId: string
): ExecutiveWorkflowId | null {
  if (
    isExecutiveWorkflowId(
      workflowId
    )
  ) {
    return workflowId;
  }

  return (
    LEGACY_WORKFLOW_IDS[
      workflowId
    ] ?? null
  );
}

function normalizeProgress(
  progress: number
): number {
  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        progress
      )
    )
  );
}

/*
 * ============================================================
 * MISSION NORMALIZATION
 * ============================================================
 *
 * All persisted mission data is treated as
 * untrusted until validated against the
 * Workflow Registry.
 */

function normalizeMission(
  value: unknown
): ActiveExecutiveMission | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const parsed =
    value as {
      id?: unknown;
      actionId?: unknown;
      title?: unknown;
      workflowId?: unknown;
      route?: unknown;
      status?: unknown;
      progress?: unknown;
      startedAt?: unknown;
      updatedAt?: unknown;
    };

  if (
    typeof parsed.id !== "string" ||
    typeof parsed.actionId !== "string" ||
    typeof parsed.title !== "string" ||
    typeof parsed.workflowId !== "string" ||
    typeof parsed.route !== "string" ||
    typeof parsed.progress !== "number" ||
    typeof parsed.startedAt !== "string" ||
    typeof parsed.updatedAt !== "string"
  ) {
    return null;
  }

  if (
    parsed.status !== "active" &&
    parsed.status !== "paused" &&
    parsed.status !== "completed"
  ) {
    return null;
  }

  if (
    !isExecutiveActionId(
      parsed.actionId
    )
  ) {
    return null;
  }

  const workflowId =
    resolveWorkflowId(
      parsed.workflowId
    );

  if (!workflowId) {
    return null;
  }

  const workflow =
    getExecutiveWorkflow(
      workflowId
    );

  /*
   * Critical identity check.
   *
   * A valid action must belong to
   * the specified workflow.
   */

  if (
    workflow.actionId !==
    parsed.actionId
  ) {
    return null;
  }

  return {
    id:
      parsed.id,

    actionId:
      workflow.actionId,

    title:
      parsed.title,

    workflowId:
      workflow.id,

    route:
      workflow.route,

    status:
      parsed.status,

    progress:
      normalizeProgress(
        parsed.progress
      ),

    startedAt:
      parsed.startedAt,

    updatedAt:
      parsed.updatedAt,
  };
}

/*
 * ============================================================
 * LOCAL CACHE OPERATIONS
 * ============================================================
 */

export function saveActiveExecutiveMission(
  mission: ActiveExecutiveMission
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      mission
    )
  );
}

function removeLocalMission():
  void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );
}

/*
 * ============================================================
 * LOAD LOCAL MISSION
 * ============================================================
 *
 * This remains synchronous because existing
 * UI components depend on synchronous reads.
 */

export function loadActiveExecutiveMission():
  | ActiveExecutiveMission
  | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(
        raw
      );

    const mission =
      normalizeMission(
        parsed
      );

    if (!mission) {
      removeLocalMission();

      return null;
    }

    /*
     * Rewrite stale or legacy browser data
     * into canonical representation.
     */

    saveActiveExecutiveMission(
      mission
    );

    return mission;
  } catch {
    removeLocalMission();

    return null;
  }
}

/*
 * ============================================================
 * SERVER SYNCHRONIZATION
 * ============================================================
 *
 * Loads the durable mission from PostgreSQL
 * and hydrates the local cache.
 */

export async function syncActiveExecutiveMission():
  Promise<
    ActiveExecutiveMission | null
  > {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const response =
      await fetch(
        "/api/executive-missions",
        {
          method: "GET",

          credentials:
            "include",

          cache:
            "no-store",
        }
      );

    if (!response.ok) {
      return (
        loadActiveExecutiveMission()
      );
    }

    const result =
      await response.json() as
        ExecutiveMissionApiResponse;

    if (
      !result.success
    ) {
      return (
        loadActiveExecutiveMission()
      );
    }

    if (!result.mission) {
      removeLocalMission();

      return null;
    }

    const mission =
      normalizeMission(
        result.mission
      );

    if (!mission) {
      return (
        loadActiveExecutiveMission()
      );
    }

    saveActiveExecutiveMission(
      mission
    );

    return mission;
  } catch {
    /*
     * Network failure should not destroy
     * the local mission cache.
     */

    return (
      loadActiveExecutiveMission()
    );
  }
}

/*
 * ============================================================
 * START MISSION
 * ============================================================
 *
 * Maintains the existing synchronous API
 * so current UI callers do not break.
 *
 * 1. Validate against Workflow Registry.
 * 2. Create optimistic local mission.
 * 3. Persist asynchronously to PostgreSQL.
 * 4. Replace temporary local identity with
 *    the authoritative database mission.
 */

export function startExecutiveMission(
  input: {
    actionId: ExecutiveActionId;

    title: string;

    workflowId: ExecutiveWorkflowId;

    route: string;
  }
): ActiveExecutiveMission {
  const workflow =
    getExecutiveWorkflow(
      input.workflowId
    );

  if (
    input.actionId !==
    workflow.actionId
  ) {
    throw new Error(
      `Executive action "${input.actionId}" cannot launch workflow "${workflow.id}". Expected action "${workflow.actionId}".`
    );
  }

  const now =
    new Date().toISOString();

  const mission:
    ActiveExecutiveMission = {
      id:
        typeof crypto !==
          "undefined" &&
        "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${input.actionId}-${Date.now()}`,

      actionId:
        workflow.actionId,

      title:
        input.title,

      workflowId:
        workflow.id,

      route:
        workflow.route,

      status:
        "active",

      progress:
        0,

      startedAt:
        now,

      updatedAt:
        now,
    };

  /*
   * Immediate optimistic cache.
   */

  saveActiveExecutiveMission(
    mission
  );

  /*
   * Durable persistence.
   */

  void persistNewMission(
    mission
  );

  return mission;
}

/*
 * ============================================================
 * PERSIST NEW MISSION
 * ============================================================
 */

async function persistNewMission(
  mission: ActiveExecutiveMission
): Promise<void> {
  try {
    const response =
      await fetch(
        "/api/executive-missions",
        {
          method: "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              actionId:
                mission.actionId,

              workflowId:
                mission.workflowId,

              title:
                mission.title,
            }),
        }
      );

    if (!response.ok) {
      return;
    }

    const result =
      await response.json() as
        ExecutiveMissionApiResponse;

    if (
      !result.success ||
      !result.mission
    ) {
      return;
    }

    const serverMission =
      normalizeMission(
        result.mission
      );

    if (!serverMission) {
      return;
    }

    /*
     * PostgreSQL identity replaces the
     * optimistic browser-generated ID.
     */

    saveActiveExecutiveMission(
      serverMission
    );
  } catch {
    /*
     * Keep optimistic local mission.
     *
     * A future synchronization can recover
     * the durable state.
     */
  }
}

/*
 * ============================================================
 * UPDATE PROGRESS
 * ============================================================
 */

export function updateExecutiveMissionProgress(
  progress: number
):
  | ActiveExecutiveMission
  | null {
  const mission =
    loadActiveExecutiveMission();

  if (!mission) {
    return null;
  }

  const normalizedProgress =
    normalizeProgress(
      progress
    );

  const updated:
    ActiveExecutiveMission = {
      ...mission,

      progress:
        normalizedProgress,

      status:
        normalizedProgress >= 100
          ? "completed"
          : "active",

      updatedAt:
        new Date().toISOString(),
    };

  saveActiveExecutiveMission(
    updated
  );

  void persistMissionUpdate(
    updated
  );

  return updated;
}

/*
 * ============================================================
 * PAUSE
 * ============================================================
 */

export function pauseExecutiveMission():
  | ActiveExecutiveMission
  | null {
  const mission =
    loadActiveExecutiveMission();

  if (!mission) {
    return null;
  }

  const updated:
    ActiveExecutiveMission = {
      ...mission,

      status:
        "paused",

      updatedAt:
        new Date().toISOString(),
    };

  saveActiveExecutiveMission(
    updated
  );

  void persistMissionUpdate(
    updated
  );

  return updated;
}

/*
 * ============================================================
 * RESUME
 * ============================================================
 */

export function resumeExecutiveMission():
  | ActiveExecutiveMission
  | null {
  const mission =
    loadActiveExecutiveMission();

  if (!mission) {
    return null;
  }

  const updated:
    ActiveExecutiveMission = {
      ...mission,

      status:
        "active",

      updatedAt:
        new Date().toISOString(),
    };

  saveActiveExecutiveMission(
    updated
  );

  void persistMissionUpdate(
    updated
  );

  return updated;
}

/*
 * ============================================================
 * PERSIST UPDATE
 * ============================================================
 */

async function persistMissionUpdate(
  mission: ActiveExecutiveMission
): Promise<void> {
  try {
    const response =
      await fetch(
        "/api/executive-missions",
        {
          method:
            "PATCH",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              missionId:
                mission.id,

              progress:
                mission.progress,

              status:
                mission.status,
            }),
        }
      );

    if (!response.ok) {
      return;
    }

    const result =
      await response.json() as
        ExecutiveMissionApiResponse;

    if (
      !result.success ||
      !result.mission
    ) {
      return;
    }

    const serverMission =
      normalizeMission(
        result.mission
      );

    if (!serverMission) {
      return;
    }

    saveActiveExecutiveMission(
      serverMission
    );
  } catch {
    /*
     * Local state remains available.
     */
  }
}

/*
 * ============================================================
 * CLEAR / CANCEL
 * ============================================================
 */

export function clearActiveExecutiveMission():
  void {
  removeLocalMission();

  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  void fetch(
    "/api/executive-missions",
    {
      method:
        "DELETE",

      credentials:
        "include",
    }
  ).catch(
    () => {
      /*
       * Local clear remains successful
       * even if server is temporarily
       * unreachable.
       */
    }
  );
}
