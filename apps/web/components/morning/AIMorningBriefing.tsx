"use client";

import React from "react";

import {
  BrainCircuit,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import {
  buildExecutiveDemo,
} from "@/lib/demo/buildExecutiveDemo";

import {
  buildExecutiveSessionSummary,
} from "@/lib/session/executiveSessionEngine";

export default function AIMorningBriefing() {
  const hour =
    new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const executive =
    buildExecutiveDemo();

  const session =
    buildExecutiveSessionSummary({
      previousTrust: 89,

      currentTrust:
        executive.forecast.projectedTrust,

      previousConfidence: 95,

      currentConfidence:
        executive.confidence.overallConfidence,

      completedMission:
        "Governance Verification",

      newOpportunityValue:
        executive.forecast.projectedValue,

      nextMission:
        "Supplier Verification",
    });

  return (
    <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl">

      {/* Ambient Background */}

      <div className="absolute inset-0">

        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[160px]" />

        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-[140px]" />

      </div>

      <div className="relative z-10 p-10">

        {/* Header */}

        <div className="flex flex-wrap items-center justify-between gap-6">

          <div>

            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              AI Morning Briefing™
            </p>

            <h1 className="mt-4 text-5xl font-black text-white">
              {greeting}, Simphiwe.
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Executive AI completed its overnight organisational analysis.
            </p>

          </div>

          <div className="flex items-center gap-3 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-5 py-3">

            <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />

            <span className="font-semibold text-emerald-300">
              Executive AI Online
            </span>

          </div>

        </div>

        {/* Executive Status */}

        <div className="mt-10 grid gap-6 md:grid-cols-4">

          <StatusCard
            icon={
              <ShieldCheck className="h-7 w-7" />
            }
            title="Digital Trust™"
            value={`${executive.forecast.projectedTrust}%`}
            colour="from-emerald-500 to-green-400"
          />

          <StatusCard
            icon={
              <AlertTriangle className="h-7 w-7" />
            }
            title="Business Risk"
            value={
              executive.forecast.projectedRisk
            }
            colour="from-orange-500 to-red-500"
          />

          <StatusCard
            icon={
              <BrainCircuit className="h-7 w-7" />
            }
            title="Executive Confidence"
            value={`${executive.confidence.overallConfidence}%`}
            colour="from-blue-500 to-cyan-400"
          />

          <StatusCard
            icon={
              <Sparkles className="h-7 w-7" />
            }
            title="Organisation Health"
            value={`${executive.forecast.projectedTrust}%`}
            colour="from-violet-500 to-indigo-500"
          />

        </div>

        {/* Executive Brief */}

        <div className="mt-10 rounded-[32px] border border-cyan-400/10 bg-white/[0.04] p-8 backdrop-blur-xl">

          <div className="flex flex-wrap items-start justify-between gap-8">

            <div className="max-w-4xl">

              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
                Today's Executive Brief
              </p>

              <h2 className="mt-5 text-4xl font-black text-white">
                {executive.learning.strongestMission}
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-300">
                {executive.narrative}
              </p>

            </div>

            <div className="min-w-[320px] rounded-[28px] border border-cyan-400/10 bg-slate-900/70 p-6">

              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                Executive Snapshot
              </p>

              <div className="mt-6 space-y-5">

                <SnapshotRow
                  label="Today's Mission"
                  value={
                    executive.learning.strongestMission
                  }
                />

                <SnapshotRow
                  label="Projected Trust"
                  value={`${executive.forecast.projectedTrust}%`}
                />

                <SnapshotRow
                  label="Opportunity Value"
                  value={`R${executive.forecast.projectedValue.toLocaleString(
                    "en-ZA"
                  )}`}
                />

                <SnapshotRow
                  label="Business Risk"
                  value={
                    executive.forecast.projectedRisk
                  }
                />

                <SnapshotRow
                  label="Executive Confidence"
                  value={`${executive.confidence.overallConfidence}%`}
                />

              </div>

              <button
                type="button"
                className="mt-8 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 font-bold text-white transition-all duration-300 hover:scale-[1.02]"
              >
                Begin Today's Mission
              </button>

            </div>

          </div>

        </div>

        {/* Since Your Last Session */}

        <div className="mt-10 rounded-[32px] border border-emerald-400/10 bg-gradient-to-br from-emerald-950/30 to-slate-900/60 p-8 backdrop-blur-xl">

          <p className="text-sm font-bold uppercase tracking-[0.35em] text-emerald-300">
            Since Your Last Session
          </p>

          <div className="mt-8 grid gap-8 md:grid-cols-2">

            <div>

              <p className="whitespace-pre-line text-lg leading-8 text-slate-300">
                {session.summary}
              </p>

            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-6">

              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Session Progress
              </p>

              <div className="mt-6 space-y-5">

                <SnapshotRow
                  label="Trust Change"
                  value={`${session.trustChange}%`}
                />

                <SnapshotRow
                  label="Confidence Change"
                  value={`${session.confidenceChange}%`}
                />

                <SnapshotRow
                  label="New Opportunity"
                  value={`R${executive.forecast.projectedValue.toLocaleString(
                    "en-ZA"
                  )}`}
                />

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

type StatusCardProps = {
  icon: React.ReactNode;
  title: string;
  value: string;
  colour: string;
};

function StatusCard({
  icon,
  title,
  value,
  colour,
}: StatusCardProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/20">

      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colour} text-white shadow-lg`}
      >
        {icon}
      </div>

      <p className="mt-5 text-xs uppercase tracking-[0.25em] text-slate-400">
        {title}
      </p>

      <h2 className="mt-3 text-4xl font-black text-white">
        {value}
      </h2>

    </div>
  );
}

type SnapshotRowProps = {
  label: string;
  value: string;
};

function SnapshotRow({
  label,
  value,
}: SnapshotRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3">

      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="font-bold text-white">
        {value}
      </span>

    </div>
  );
}
