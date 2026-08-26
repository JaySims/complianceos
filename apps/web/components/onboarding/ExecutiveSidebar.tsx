"use client";

import React from "react";

import {
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CircleDot,
} from "lucide-react";

export default function ExecutiveSidebar() {
  return (
    <aside className="space-y-6">

      {/* ========================= */}
      {/* AI STATUS */}
      {/* ========================= */}

      <section className="executive-card p-6">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs uppercase tracking-widest text-slate-500">

              Executive AI

            </p>

            <h3 className="text-white font-bold text-xl mt-2">

              ComplianceOS

            </h3>

          </div>

          <div className="flex items-center gap-2">

            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />

            <span className="text-emerald-400 text-sm">

              Online

            </span>

          </div>

        </div>

        <div className="mt-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4">

          <div className="flex items-start gap-3">

            <BrainCircuit className="h-6 w-6 text-blue-400 mt-1"/>

            <p className="text-sm leading-7 text-slate-300">

              I'm continuously analysing your organisation.

              Every document, compliance requirement,
              funding opportunity and procurement
              requirement is being evaluated in real time.

            </p>

          </div>

        </div>

      </section>

      {/* ========================= */}
      {/* CURRENT MISSION */}
      {/* ========================= */}

      <section className="executive-card p-6">

        <div className="flex items-center gap-3">

          <Sparkles className="h-5 w-5 text-yellow-400"/>

          <h3 className="text-white font-bold">

            Current Mission

          </h3>

        </div>

        <div className="mt-5 rounded-xl bg-white/5 p-4">

          <p className="text-white font-semibold">

            Governance Verification

          </p>

          <p className="text-slate-400 text-sm mt-2">

            Completing this step is projected to increase your
            Digital Trust Score by 9 points.

          </p>

        </div>

      </section>

      {/* ========================= */}
      {/* AI OBSERVATIONS */}
      {/* ========================= */}

      <section className="executive-card p-6">

        <h3 className="text-white font-bold mb-5">

          AI Observations

        </h3>

        <div className="space-y-4">

          <Observation
            icon={<ShieldCheck className="h-5 w-5"/>}
            color="text-emerald-400"
            title="Compliance"

            text="Organisation registration appears healthy."
          />

          <Observation
            icon={<TrendingUp className="h-5 w-5"/>}
            color="text-cyan-400"
            title="Funding"

            text="You are likely eligible for multiple funding programmes."
          />

          <Observation
            icon={<AlertTriangle className="h-5 w-5"/>}
            color="text-amber-400"
            title="Governance"

            text="Director information still requires completion."
          />

        </div>

      </section>

      {/* ========================= */}
      {/* NEXT ACTION */}
      {/* ========================= */}

      <section className="executive-card p-6">

        <div className="flex items-center justify-between">

          <h3 className="text-white font-bold">

            Recommended

          </h3>

          <ArrowRight className="h-5 w-5 text-blue-400"/>

        </div>

        <button className="mt-5 w-full rounded-2xl executive-gradient py-4 font-semibold text-white transition hover:scale-[1.02]">

          Continue Executive Journey

        </button>

      </section>

      {/* ========================= */}
      {/* ASK AI */}
      {/* ========================= */}

      <section className="executive-card p-6">

        <div className="flex items-center gap-2 mb-3">

          <CircleDot className="h-5 w-5 text-blue-400"/>

          <h3 className="text-white font-bold">

            Ask ComplianceOS

          </h3>

        </div>

        <div className="rounded-xl bg-[#0F172A] border border-white/10 p-4">

          <input
            placeholder="Ask anything..."
            className="w-full bg-transparent outline-none text-white placeholder:text-slate-500"
          />

        </div>

      </section>

    </aside>
  );
}

type ObservationProps = {
  icon: React.ReactNode;
  color: string;
  title: string;
  text: string;
};

function Observation({
  icon,
  color,
  title,
  text,
}: ObservationProps) {
  return (
    <div className="flex gap-3">

      <div className={color}>

        {icon}

      </div>

      <div>

        <p className="text-white font-medium">

          {title}

        </p>

        <p className="text-sm text-slate-400 mt-1 leading-6">

          {text}

        </p>

      </div>

    </div>
  );
}
