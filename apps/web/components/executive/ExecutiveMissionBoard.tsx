"use client";

import {
  Target,
  Clock3,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

type ExecutiveMissionBoardProps = {
  title: string;
  progress: number;
  estimatedCompletion: string;
  trustGain: number;
  revenueOpportunity: number;
};

export default function ExecutiveMissionBoard({
  title,
  progress,
  estimatedCompletion,
  trustGain,
  revenueOpportunity,
}: ExecutiveMissionBoardProps) {

  return (

    <section className="rounded-[36px] border border-white/10 bg-white p-8 shadow-sm">

      <div className="flex items-center gap-4">

        <Target className="h-8 w-8 text-cyan-600" />

        <div>

          <p className="text-xs uppercase tracking-[0.35em] text-cyan-600">

            Active Mission

          </p>

          <h2 className="text-3xl font-black text-slate-900">

            Executive Mission Board™

          </h2>

        </div>

      </div>

      <div className="mt-10 rounded-3xl bg-slate-50 p-6">

        <h3 className="text-2xl font-bold text-slate-900">

          {title}

        </h3>

        <div className="mt-8">

          <div className="mb-3 flex justify-between">

            <span className="text-sm font-medium text-slate-500">

              Progress

            </span>

            <span className="font-bold text-slate-900">

              {progress}%

            </span>

          </div>

          <div className="h-4 overflow-hidden rounded-full bg-slate-200">

            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />

          </div>

        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">

          <Metric
            icon={<Clock3 className="h-5 w-5 text-orange-500" />}
            label="Estimated Completion"
            value={estimatedCompletion}
          />

          <Metric
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            label="Trust Gain"
            value={`+${trustGain}%`}
          />

          <Metric
            icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
            label="Revenue Opportunity"
            value={`R${revenueOpportunity.toLocaleString()}`}
          />

        </div>

        <button className="mt-10 flex w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-5 text-lg font-bold text-white transition hover:scale-[1.01]">

          Continue Mission

          <ArrowRight className="h-5 w-5" />

        </button>

      </div>

    </section>

  );

}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-2xl bg-white p-5">

      <div className="flex items-center gap-2">

        {icon}

        <span className="text-xs uppercase tracking-wide text-slate-500">

          {label}

        </span>

      </div>

      <p className="mt-3 text-xl font-bold text-slate-900">

        {value}

      </p>

    </div>

  );

}
