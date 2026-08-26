"use client";

export default function HeroHeader() {
  return (
    <div>

      {/* Top Row */}

      <div className="flex items-center justify-between">

        {/* Left */}

        <div>

          <div className="flex items-center gap-3">

            <div className="relative">

              <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />

              <div className="absolute inset-0 rounded-full bg-emerald-400 blur-md opacity-60 animate-ping" />

            </div>

            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              AI ONLINE
            </span>

          </div>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-white">
            Executive Intelligence Dashboard
          </h2>

          <p className="mt-3 max-w-md text-base leading-7 text-slate-400">
            Your AI Business Operating System continuously monitors
            compliance, funding readiness, procurement opportunities,
            and business growth in real time.
          </p>

        </div>

        {/* Right */}

        <div className="text-right">

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-3">

            <p className="text-xs uppercase tracking-[0.25em] text-blue-300">
              Last Updated
            </p>

            <p className="mt-2 text-lg font-bold text-white">
              Just Now
            </p>

          </div>

        </div>

      </div>

      {/* Divider */}

      <div className="mt-10 h-px bg-gradient-to-r from-blue-500/40 via-white/10 to-transparent" />

    </div>
  );
}