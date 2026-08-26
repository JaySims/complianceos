"use client";

import {
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  BrainCircuit,
} from "lucide-react";

type DigitalTrustCommandCardProps = {
  trustScore: number;
  executiveConfidence: number;
  businessRisk: "Low" | "Medium" | "High";
  organisationStatus: string;
  trustChange?: number;
  commentary: string;
};

export default function DigitalTrustCommandCard({
  trustScore,
  executiveConfidence,
  businessRisk,
  organisationStatus,
  trustChange = 0,
  commentary,
}: DigitalTrustCommandCardProps) {
  const riskColour =
    businessRisk === "Low"
      ? "text-emerald-400"
      : businessRisk === "Medium"
      ? "text-amber-400"
      : "text-red-400";

  return (
    <section className="overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Digital Trust™
          </p>

          <h2 className="mt-3 text-6xl font-black text-white">
            {trustScore}%
          </h2>

          <div className="mt-4 flex items-center gap-2">

            <ArrowUpRight className="h-5 w-5 text-emerald-400" />

            <span className="font-semibold text-emerald-400">
              +{trustChange}% today
            </span>

          </div>

        </div>

        <div className="rounded-3xl bg-cyan-500/10 p-6">

          <ShieldCheck className="h-16 w-16 text-cyan-300" />

        </div>

      </div>

      <div className="mt-10 grid grid-cols-3 gap-5">

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">

          <div className="flex items-center gap-3">

            <TrendingUp className="h-5 w-5 text-cyan-300" />

            <span className="text-sm text-slate-400">
              Business Risk
            </span>

          </div>

          <p className={`mt-4 text-2xl font-bold ${riskColour}`}>
            {businessRisk}
          </p>

        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">

          <div className="flex items-center gap-3">

            <BrainCircuit className="h-5 w-5 text-cyan-300" />

            <span className="text-sm text-slate-400">
              AI Confidence
            </span>

          </div>

          <p className="mt-4 text-2xl font-bold text-white">
            {executiveConfidence}%
          </p>

        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">

          <div className="flex items-center gap-3">

            <ShieldCheck className="h-5 w-5 text-cyan-300" />

            <span className="text-sm text-slate-400">
              Organisation
            </span>

          </div>

          <p className="mt-4 text-lg font-bold text-cyan-300">
            {organisationStatus}
          </p>

        </div>

      </div>

      <div className="mt-10 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">

        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
          Executive AI Commentary
        </p>

        <p className="mt-5 text-lg leading-8 text-slate-200">
          {commentary}
        </p>

      </div>

    </section>
  );
}
