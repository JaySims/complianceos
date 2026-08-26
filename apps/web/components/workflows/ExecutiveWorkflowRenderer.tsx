"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Circle,
  ShieldCheck,
} from "lucide-react";

import type {
  ExecutiveWorkflow,
} from "@/lib/workflows/executiveWorkflowDefinitions";

type Props = {
  workflow: ExecutiveWorkflow;
  completedStepIds?: string[];
  onContinue?: (stepId: string) => void;
};

export default function ExecutiveWorkflowRenderer({
  workflow,
  completedStepIds = [],
  onContinue,
}: Props) {
  const completedCount =
    workflow.steps.filter((step) =>
      completedStepIds.includes(step.id)
    ).length;

  const progress =
    workflow.steps.length === 0
      ? 0
      : Math.round(
          (completedCount /
            workflow.steps.length) *
            100
        );

  return (
    <div className="space-y-8">

      {/* Workflow Header */}

      <section className="rounded-[36px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-8 shadow-[0_30px_90px_rgba(0,0,0,0.35)] lg:p-10">

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-5">

            <div className="rounded-3xl bg-cyan-500/15 p-4">
              <ShieldCheck className="h-9 w-9 text-cyan-300" />
            </div>

            <div>

              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                Executive Workflow™
              </p>

              <h1 className="mt-3 text-4xl font-black text-white">
                {workflow.title}
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                {workflow.subtitle}
              </p>

            </div>

          </div>

          <div className="grid min-w-[280px] grid-cols-2 gap-4">

            <Metric
              label="Trust Gain"
              value={`+${workflow.trustGain}%`}
            />

            <Metric
              label="Estimated"
              value={workflow.estimatedCompletion}
            />

          </div>

        </div>

        {/* Progress */}

        <div className="mt-10">

          <div className="mb-3 flex items-center justify-between">

            <span className="text-sm font-medium text-slate-400">
              Workflow Progress
            </span>

            <span className="font-bold text-white">
              {progress}%
            </span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-800">

            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

        </div>

      </section>

      {/* Workflow Steps */}

      <section className="grid gap-6">

        {workflow.steps.map((step, index) => {
          const completed =
            completedStepIds.includes(
              step.id
            );

          return (
            <div
              key={step.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-start gap-4">

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      completed
                        ? "bg-emerald-50"
                        : "bg-slate-100"
                    }`}
                  >

                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-500" />
                    )}

                  </div>

                  <div>

                    <div className="flex flex-wrap items-center gap-3">

                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Step {index + 1}
                      </span>

                      {completed && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Completed
                        </span>
                      )}

                    </div>

                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                      {step.title}
                    </h2>

                    <p className="mt-2 leading-7 text-slate-600">
                      {step.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">

                      <Clock3 className="h-4 w-4" />

                      Approximately {step.estimatedMinutes} minutes

                    </div>

                  </div>

                </div>

                <button
                  type="button"
                  disabled={completed}
                  onClick={() =>
                    onContinue?.(step.id)
                  }
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold transition ${
                    completed
                      ? "cursor-default bg-emerald-50 text-emerald-700"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >

                  {completed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Completed
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}

                </button>

              </div>

            </div>
          );
        })}

      </section>

    </div>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({
  label,
  value,
}: MetricProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">

      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-white">
        {value}
      </p>

    </div>
  );
}
