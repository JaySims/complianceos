"use client";

export default function HeroTrustScore() {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-300">
            Digital Trust Score™
          </p>

          <h3 className="mt-3 text-2xl font-black text-white">
            Business Reputation
          </h3>

        </div>

        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">

          <span className="font-semibold text-emerald-400">
            Healthy
          </span>

        </div>

      </div>

      {/* Score */}

      <div className="mt-10 flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-400">
            Current Score
          </p>

          <h1 className="mt-2 text-7xl font-black tracking-tight text-white">
            94
          </h1>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2">

            <svg
              className="h-4 w-4 text-emerald-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 3l5 6h-3v8H8V9H5l5-6z" />
            </svg>

            <span className="font-semibold text-emerald-400">
              +4 This Week
            </span>

          </div>

        </div>

        {/* Circular Progress */}

        <div className="relative flex h-40 w-40 items-center justify-center">

          <svg
            className="absolute h-full w-full -rotate-90"
            viewBox="0 0 160 160"
          >
            <circle
              cx="80"
              cy="80"
              r="68"
              stroke="rgb(30 41 59)"
              strokeWidth="10"
              fill="none"
            />

            <circle
              cx="80"
              cy="80"
              r="68"
              stroke="url(#gradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="427"
              strokeDashoffset="26"
              fill="none"
            />

            <defs>

              <linearGradient
                id="gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >

                <stop
                  offset="0%"
                  stopColor="#2563eb"
                />

                <stop
                  offset="100%"
                  stopColor="#22d3ee"
                />

              </linearGradient>

            </defs>

          </svg>

          <div className="text-center">

            <p className="text-sm text-slate-400">
              Trust
            </p>

            <h2 className="text-3xl font-black text-white">
              94%
            </h2>

          </div>

        </div>

      </div>

      {/* Progress */}

      <div className="mt-10">

        <div className="flex justify-between text-sm text-slate-400">

          <span>Growth Progress</span>

          <span>94%</span>

        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">

          <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />

        </div>

      </div>

      {/* Footer */}

      <div className="mt-8 grid grid-cols-2 gap-6">

        <div>

          <p className="text-sm text-slate-500">
            AI Confidence
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            96%
          </h3>

        </div>

        <div>

          <p className="text-sm text-slate-500">
            Next Milestone
          </p>

          <h3 className="mt-2 text-2xl font-bold text-emerald-400">
            98%
          </h3>

        </div>

      </div>

    </div>
  );
}