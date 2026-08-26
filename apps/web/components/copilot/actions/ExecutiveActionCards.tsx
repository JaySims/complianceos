"use client";

import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import type {
  ExecutiveActionRecommendation,
} from "@/lib/actions/executiveActions";

import {
  getExecutiveAction,
  type ExecutiveAction,
} from "@/lib/actions/executiveActionRegistry";

import {
  dispatchExecutiveAction,
} from "@/lib/actions/executiveActionDispatcher";

import {
  startExecutiveMission,
} from "@/lib/missions/executiveMissionLauncher";

type ExecutiveActionCardsProps = {
  actions: ExecutiveActionRecommendation[];
};

export default function ExecutiveActionCards({
  actions,
}: ExecutiveActionCardsProps) {
  const router = useRouter();

  if (actions.length === 0) {
    return null;
  }

  function launchAction(
    recommendation: ExecutiveActionRecommendation
  ) {
    const action =
      getExecutiveAction(
        recommendation.actionId
      );

    const dispatch =
      dispatchExecutiveAction(
        recommendation.actionId
      );

    /*
     * Workflow-backed actions create
     * an Executive Mission before
     * navigating.
     */

    if (
      dispatch.type === "workflow"
    ) {
      const mission =
        startExecutiveMission({
          actionId:
            recommendation.actionId,

          title:
            action.title,

          workflowId:
            dispatch.workflowId,

          route:
            dispatch.route,
        });

      console.log(
        "Executive Mission Started:",
        mission
      );

      router.push(
        mission.route
      );

      return;
    }

    /*
     * Navigation-only actions do not
     * create missions.
     */

    console.log(
      "Executive Navigation Action:",
      dispatch
    );

    router.push(
      dispatch.route
    );
  }

  return (
    <section className="mt-8">

      <div className="mb-4 flex items-center gap-3">

        <Sparkles className="h-5 w-5 text-cyan-300" />

        <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
          Recommended Executive Actions
        </p>

      </div>

      <div className="grid gap-4">

        {actions.map(
          (recommendation) => {
            const action =
              getExecutiveAction(
                recommendation.actionId
              );

            return (
              <ActionCard
                key={`${recommendation.actionId}-${recommendation.variant}`}
                action={action}
                variant={
                  recommendation.variant
                }
                onClick={() =>
                  launchAction(
                    recommendation
                  )
                }
              />
            );
          }
        )}

      </div>

    </section>
  );
}

type ActionCardProps = {
  action: ExecutiveAction;

  variant:
    | "primary"
    | "secondary";

  onClick: () => void;
};

function ActionCard({
  action,
  variant,
  onClick,
}: ActionCardProps) {
  const primary =
    variant === "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-3xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 ${
        primary
          ? "border-cyan-400/30 bg-cyan-500/10 hover:border-cyan-300/50 hover:bg-cyan-500/15"
          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >

      <div className="flex items-start justify-between gap-5">

        <div className="flex min-w-0 items-start gap-4">

          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              primary
                ? "bg-cyan-500/15 text-cyan-300"
                : "bg-white/[0.06] text-slate-300"
            }`}
          >

            <ActionIcon
              action={action}
            />

          </div>

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-3">

              <h3 className="font-bold text-white">
                {action.title}
              </h3>

              {primary && (

                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
                  Recommended
                </span>

              )}

            </div>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {action.description}
            </p>

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {action.category}
            </p>

          </div>

        </div>

        <ArrowRight
          className={`mt-3 h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${
            primary
              ? "text-cyan-300"
              : "text-slate-400"
          }`}
        />

      </div>

    </button>
  );
}

function ActionIcon({
  action,
}: {
  action: ExecutiveAction;
}) {
  switch (action.icon) {
    case "shield":
      return (
        <ShieldCheck className="h-6 w-6" />
      );

    case "check":
      return (
        <CheckCircle2 className="h-6 w-6" />
      );

    case "banknote":
      return (
        <Banknote className="h-6 w-6" />
      );

    case "briefcase":
      return (
        <BriefcaseBusiness className="h-6 w-6" />
      );

    case "trending-up":
      return (
        <TrendingUp className="h-6 w-6" />
      );

    case "triangle-alert":
      return (
        <TriangleAlert className="h-6 w-6" />
      );

    case "file-text":
      return (
        <FileText className="h-6 w-6" />
      );

    default:
      return (
        <Sparkles className="h-6 w-6" />
      );
  }
}
