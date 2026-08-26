"use client";

import AIStatusIndicator from "../ui/AIStatusIndicator";

export default function MissionHeader() {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">

      {/* Background Glow */}

      <div className="absolute inset-0">

        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="absolute left-0 bottom-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-[100px]" />

      </div>

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

        {/* LEFT */}

        <div>

          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-300">
            Executive Mission Control™
          </p>

          <h1 className="mt-4 text-5xl font-black tracking-tight text-white">
            AI Executive Dashboard
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Real-time compliance intelligence, funding opportunities,
            Digital Trust Score™, predictive analytics and AI-powered
            business monitoring.
          </p>

        </div>

        {/* RIGHT */}

        <div className="grid grid-cols-2 gap-5">

          <StatusCard
            title="Business"
            value="Verified"
            color="emerald"
          />

          <StatusCard
            title="Trust Score"
            value="94%"
            color="blue"
          />

          <StatusCard
            title="AI Status"
            value="ONLINE"
            color="cyan"
          />

          <StatusCard
            title="Last Sync"
            value="Just Now"
            color="purple"
          />

        </div>

      </div>

      <div className="relative z-10 mt-8">

        <AIStatusIndicator status="online" />

      </div>

    </div>
  );
}

function StatusCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: "blue" | "cyan" | "emerald" | "purple";
}) {

  const colours = {
    blue: "text-blue-400",
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    purple: "text-violet-400",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4">

      <p className="text-xs uppercase tracking-widest text-slate-500">
        {title}
      </p>

      <p className={`mt-2 text-xl font-bold ${colours[color]}`}>
        {value}
      </p>

    </div>
  );
}