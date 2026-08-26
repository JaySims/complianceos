"use client";

export default function HeroAssistant() {
  return (
    <div className="rounded-[30px] border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-slate-900/90 to-slate-950 p-8 backdrop-blur-xl">

      {/* Header */}

      <div className="flex items-center gap-5">

        <div className="relative">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-xl shadow-blue-500/30">

            <span className="text-3xl">
              🤖
            </span>

          </div>

          <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full border-2 border-slate-950 bg-emerald-400 animate-pulse" />

        </div>

        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.30em] text-blue-300">
            AI Executive Assistant™
          </p>

          <h3 className="mt-2 text-2xl font-black text-white">
            Good Evening, Simphiwe
          </h3>

        </div>

      </div>

      {/* Message */}

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

        <p className="leading-8 text-slate-300">
          Based on your latest compliance profile,
          I recommend uploading your latest
          <strong className="text-white">
            {" "}B-BBEE Certificate{" "}
          </strong>
          this week.

          Doing so is predicted to improve your
          Digital Trust Score™ and unlock additional
          funding and supplier opportunities.
        </p>

      </div>

      {/* Prediction */}

      <div className="mt-8 grid grid-cols-2 gap-5">

        <div className="rounded-2xl bg-slate-900/70 p-5">

          <p className="text-sm text-slate-500">
            Trust Score
          </p>

          <h2 className="mt-3 text-4xl font-black text-white">
            94%
          </h2>

          <p className="mt-2 text-emerald-400 font-semibold">
            → 98%
          </p>

        </div>

        <div className="rounded-2xl bg-slate-900/70 p-5">

          <p className="text-sm text-slate-500">
            Funding Potential
          </p>

          <h2 className="mt-3 text-4xl font-black text-white">
            +R4.2M
          </h2>

          <p className="mt-2 text-blue-400 font-semibold">
            Estimated
          </p>

        </div>

      </div>

      {/* Footer */}

      <div className="mt-8 flex items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/10 px-6 py-5">

        <div>

          <p className="text-sm text-blue-300">
            AI Confidence
          </p>

          <h3 className="mt-2 text-2xl font-black text-white">
            96%
          </h3>

        </div>

        <button className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white transition hover:scale-105 hover:shadow-xl">

          View Full Report

        </button>

      </div>

    </div>
  );
}