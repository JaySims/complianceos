"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

import ExecutiveWorkflowRenderer from "@/components/workflows/ExecutiveWorkflowRenderer";

import {
  getExecutiveWorkflow,
  type ExecutiveWorkflowCompletionEffect,
  type ExecutiveWorkflowId,
} from "@/lib/workflows/executiveWorkflowDefinitions";

import {
  completeWorkflowStep,
  loadWorkflowProgress,
  loadWorkflowProgressFromServer,
  persistWorkflowProgress,
} from "@/lib/workflows/workflowProgressStore";

import {
  loadActiveExecutiveMission,
  updateExecutiveMissionProgress,
} from "@/lib/missions/executiveMissionLauncher";

import {
  updateExecutiveOrganisationState,
} from "@/lib/organisation/executiveOrganisationState";

type Props = {
  workflowId: ExecutiveWorkflowId;
};

export default function ExecutiveWorkflowPage({
  workflowId,
}: Props) {
  const workflow =
    getExecutiveWorkflow(
      workflowId
    );

  const [
    completedStepIds,
    setCompletedStepIds,
  ] = useState<string[]>([]);

  const [
    missionCompleted,
    setMissionCompleted,
  ] = useState(false);

  const [
    persistenceError,
    setPersistenceError,
  ] = useState<string | null>(
    null
  );

  const applyCompletion =
    useCallback(() => {
      setMissionCompleted(
        true
      );

      applyWorkflowCompletionEffect(
        workflow.completionEffect
      );
    }, [
      workflow.completionEffect,
    ]);

  /*
   * ============================================================
   * HYDRATE + MIGRATE LEGACY WORKFLOW STATE
   * ============================================================
   *
   * PostgreSQL is authoritative.
   *
   * If PostgreSQL has no record but localStorage
   * contains older workflow progress, migrate that
   * state automatically into PostgreSQL.
   */

  useEffect(() => {
    let cancelled =
      false;

    async function hydrate() {
      const localProgress =
        loadWorkflowProgress(
          workflow.id
        );

      if (!cancelled) {
        setCompletedStepIds(
          localProgress.completedStepIds
        );
      }

      console.log(
        "[WorkflowDebug] local hydration",
        {
          workflowId:
            workflow.id,

          completedStepIds:
            localProgress.completedStepIds,
        }
      );

      const serverProgress =
        await loadWorkflowProgressFromServer(
          workflow.id
        );

      if (cancelled) {
        return;
      }

      /*
       * Server already has authoritative state.
       */

      if (serverProgress) {
        console.log(
          "[WorkflowDebug] PostgreSQL state found",
          serverProgress
        );

        setCompletedStepIds(
          serverProgress.completedStepIds
        );

        return;
      }

      /*
       * PostgreSQL has no workflow record.
       *
       * If legacy local progress exists,
       * migrate it automatically.
       */

      if (
        localProgress.completedStepIds.length ===
        0
      ) {
        console.log(
          "[WorkflowDebug] no legacy workflow state to migrate",
          {
            workflowId:
              workflow.id,
          }
        );

        return;
      }

      const validCompletedSteps =
        workflow.steps.filter(
          (step) =>
            localProgress.completedStepIds.includes(
              step.id
            )
        ).length;

      const migratedProgress =
        workflow.steps.length ===
        0
          ? 0
          : Math.round(
              (
                validCompletedSteps /
                workflow.steps.length
              ) * 100
            );

      console.log(
        "[WorkflowDebug] migrating legacy workflow state",
        {
          workflowId:
            workflow.id,

          completedStepIds:
            localProgress.completedStepIds,

          migratedProgress,
        }
      );

      const persisted =
        await persistWorkflowProgress(
          localProgress,
          migratedProgress,
          migratedProgress >= 100
        );

      if (cancelled) {
        return;
      }

      console.log(
        "[WorkflowDebug] legacy migration result",
        {
          persisted,
        }
      );

      if (!persisted) {
        setPersistenceError(
          "ComplianceOS found progress saved on this device, but could not migrate it to your organisation account."
        );

        return;
      }

      /*
       * Re-read authoritative server state
       * after successful migration.
       */

      const migratedServerState =
        await loadWorkflowProgressFromServer(
          workflow.id
        );

      if (
        cancelled ||
        !migratedServerState
      ) {
        return;
      }

      setCompletedStepIds(
        migratedServerState.completedStepIds
      );
    }

    void hydrate();

    return () => {
      cancelled =
        true;
    };
  }, [
    workflow.id,
    workflow.steps,
  ]);

  /*
   * ============================================================
   * CALCULATE PROGRESS
   * ============================================================
   */

  const progress =
    useMemo(() => {
      if (
        workflow.steps.length ===
        0
      ) {
        return 0;
      }

      const validCompletedSteps =
        workflow.steps.filter(
          (step) =>
            completedStepIds.includes(
              step.id
            )
        ).length;

      return Math.round(
        (
          validCompletedSteps /
          workflow.steps.length
        ) * 100
      );
    }, [
      completedStepIds,
      workflow.steps,
    ]);

  /*
   * ============================================================
   * EXECUTIVE MISSION SYNCHRONISATION
   * ============================================================
   */

  useEffect(() => {
    const activeMission =
      loadActiveExecutiveMission();

    if (!activeMission) {
      return;
    }

    if (
      activeMission.workflowId !==
      workflow.id
    ) {
      return;
    }

    const updatedMission =
      updateExecutiveMissionProgress(
        progress
      );

    if (
      updatedMission?.status !==
      "completed"
    ) {
      return;
    }

    applyCompletion();
  }, [
    progress,
    workflow.id,
    applyCompletion,
  ]);

  /*
   * ============================================================
   * COMPLETE NEW WORKFLOW STEP
   * ============================================================
   */

  async function handleContinue(
    stepId: string
  ) {
    console.log(
      "[WorkflowDebug] handleContinue fired",
      {
        workflowId:
          workflow.id,

        stepId,
      }
    );

    setPersistenceError(
      null
    );

    const updated =
      completeWorkflowStep(
        workflow.id,
        stepId
      );

    setCompletedStepIds(
      updated.completedStepIds
    );

    const validCompletedSteps =
      workflow.steps.filter(
        (step) =>
          updated.completedStepIds.includes(
            step.id
          )
      ).length;

    const nextProgress =
      workflow.steps.length ===
      0
        ? 0
        : Math.round(
            (
              validCompletedSteps /
              workflow.steps.length
            ) * 100
          );

    const completed =
      nextProgress >= 100;

    console.log(
      "[WorkflowDebug] persisting new workflow state",
      {
        workflowId:
          workflow.id,

        completedStepIds:
          updated.completedStepIds,

        nextProgress,

        completed,
      }
    );

    const persisted =
      await persistWorkflowProgress(
        updated,
        nextProgress,
        completed
      );

    console.log(
      "[WorkflowDebug] new persistence result",
      {
        persisted,
      }
    );

    if (!persisted) {
      setPersistenceError(
        "Your progress was saved on this device, but ComplianceOS could not confirm the server save. Please try again."
      );

      return;
    }

    if (completed) {
      applyCompletion();
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-10">

      <div className="mx-auto max-w-6xl">

        <Link
          href="/workspace"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Executive Workspace
        </Link>

        {persistenceError && (
          <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6">

            <p className="font-semibold text-amber-900">
              Server persistence warning
            </p>

            <p className="mt-2 leading-7 text-amber-800">
              {persistenceError}
            </p>

          </section>
        )}

        {missionCompleted && (
          <section className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">

            <div className="flex items-start gap-4">

              <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-emerald-600" />

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
                  Executive Mission Complete
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  {workflow.title} Completed
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  This workflow is now recorded as complete in the organisation&apos;s readiness state. Executive Intelligence will use the result when recalculating Digital Trust™, risks, forecasts, opportunities, and future priorities.
                </p>

              </div>

            </div>

          </section>
        )}

        <div className="mt-8">

          <ExecutiveWorkflowRenderer
            workflow={
              workflow
            }
            completedStepIds={
              completedStepIds
            }
            onContinue={
              handleContinue
            }
          />

        </div>

      </div>

    </main>
  );
}

function applyWorkflowCompletionEffect(
  effect:
    ExecutiveWorkflowCompletionEffect
): void {
  updateExecutiveOrganisationState({
    [effect]:
      true,
  });
}
