"use client";

import {
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Clock3,
  BrainCircuit,
} from "lucide-react";

import type { ExecutiveMission } from "@/lib/missions/missionEngine";

type Props = {
  mission: ExecutiveMission;
};

export default function ExecutiveHero({
  mission,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 shadow-[0_30px_120px_rgba(37,99,235,0.25)]">

      {/* Background */}

      <div className="absolute inset-0">

        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/20 blur-[140px]" />

        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />

      </div>

      <div className="relative z-10 px-10 py-10">

        {/* Top Bar */}

        <div className="flex flex-wrap items-center justify-between gap-6">

          <div>

            <p className="text-sm uppercase tracking-[0.35em] text-blue-300">
              Executive Operations Centre™
            </p>

            <h1 className="mt-4 text-5xl font-black text-white">
              Good Morning, Simphiwe
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Your organisation is currently outperforming
              <span className="font-bold text-cyan-300"> 81% </span>
              of organisations in your industry.

              Executive AI has identified today's highest-impact mission.
            </p>

          </div>

          <div className="flex items-center gap-3 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-5 py-3">

            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />

            <span className="font-semibold text-emerald-300">
              Executive AI Online
            </span>

          </div>

        </div>

        {/* Mission Card */}

        <div className="mt-12 rounded-[32px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-xl">

          <div className="flex flex-wrap items-start justify-between gap-8">

            <div className="max-w-3xl">

              <div className="flex items-center gap-3">

                <Sparkles className="h-6 w-6 text-cyan-400" />

                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                  Today's Executive Mission
                </p>

              </div>

              <h2 className="mt-5 text-4xl font-black text-white">
                {mission.title}
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-300">

                {mission.description}

                <br />
                <br />

                <strong className="text-cyan-300">
                  {mission.impact}
                </strong>

              </p>

            </div>

            <button className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/30">

              Start Mission

            </button>

          </div>

          {/* Executive Impact Grid */}

          <div className="mt-10 grid gap-6 md:grid-cols-4">

            <ImpactCard
              icon={<Clock3 className="h-6 w-6" />}
              title="Estimated Time"
              value={mission.estimatedTime}
              subtitle="Mission Completion"
              gradient="from-slate-700 to-slate-800"
            />

            <ImpactCard
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Digital Trust™"
              value="+8%"
              subtitle="Expected Increase"
              gradient="from-emerald-500 to-green-400"
            />

            <ImpactCard
              icon={<ArrowUpRight className="h-6 w-6" />}
              title="Procurement"
              value="+12%"
              subtitle="Readiness Increase"
              gradient="from-blue-500 to-cyan-400"
            />

            <ImpactCard
              icon={<BrainCircuit className="h-6 w-6" />}
              title="AI Confidence"
              value={`${mission.confidence}%`}
              subtitle="Mission Confidence"
              gradient="from-violet-500 to-purple-500"
            />

          </div>

        </div>

      </div>

    </section>
  );
}

type ImpactCardProps = {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
};

function ImpactCard({
  icon,
  title,
  value,
  subtitle,
  gradient,
}: ImpactCardProps) {
  return (

    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:shadow-[0_20px_60px_rgba(59,130,246,0.25)]">

      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
      >
        {icon}
      </div>

      <p className="mt-6 text-sm uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>

      <h3 className="mt-3 text-4xl font-black text-white">
        {value}
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        {subtitle}
      </p>

    </div>

  );
}
