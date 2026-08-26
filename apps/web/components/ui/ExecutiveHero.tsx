"use client";

import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";

export default function ExecutiveHero() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111827] via-[#0F172A] to-[#09090B] p-10 shadow-2xl">

      {/* Background Glow */}

      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -bottom-20 left-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">

        {/* Left */}

        <div className="max-w-3xl">

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">

            <Sparkles size={16} />

            ComplianceOS Executive AI

          </div>

          <h1 className="mt-8 text-5xl font-bold leading-tight text-white">

            Good Morning,

            <br />

            Simphiwe.

          </h1>

          <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-300">

            Your organisation is progressing well.

            AI predicts that completing Governance today
            will increase Procurement Readiness by

            <span className="font-semibold text-white">
              {" "}18%
            </span>.

          </p>

          <div className="mt-8 flex flex-wrap gap-4">

            <button className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-4 font-semibold text-white shadow-xl transition hover:scale-[1.02]">

              Continue Onboarding

            </button>

            <button className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition hover:bg-white/10">

              View AI Report

            </button>

          </div>

        </div>

        {/* Right */}

        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

          <div className="flex items-center justify-between">

            <span className="text-slate-400">
              Digital Trust
            </span>

            <ShieldCheck
              className="text-emerald-400"
              size={22}
            />

          </div>

          <div className="mt-4 text-6xl font-bold text-white">

            82%

          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">

            <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />

          </div>

          <div className="mt-8 space-y-5">

            <div className="flex items-center justify-between">

              <span className="text-slate-400">
                Compliance
              </span>

              <span className="font-semibold text-white">
                91%
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-400">
                Funding
              </span>

              <span className="font-semibold text-white">
                74%
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-slate-400">
                Procurement
              </span>

              <span className="font-semibold text-white">
                68%
              </span>

            </div>

          </div>

          <div className="mt-8 flex items-center gap-2 text-sm font-medium text-emerald-400">

            <ArrowUpRight size={16} />

            +12% this month

          </div>

        </div>

      </div>

    </section>
  );
}
