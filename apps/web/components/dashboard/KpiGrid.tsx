"use client";

const metrics = [
  {
    title: "Digital Trust Score™",
    value: "94%",
    change: "+4 This Month",
    color: "blue",
    progress: 94,
  },
  {
    title: "Compliance Health",
    value: "98%",
    change: "Excellent",
    color: "emerald",
    progress: 98,
  },
  {
    title: "Funding Readiness",
    value: "91%",
    change: "16 Opportunities",
    color: "cyan",
    progress: 91,
  },
  {
    title: "AI Confidence",
    value: "96%",
    change: "Learning Continuously",
    color: "violet",
    progress: 96,
  },
];

export default function KpiGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  color,
  progress,
}: {
  title: string;
  value: string;
  change: string;
  color: string;
  progress: number;
}) {
  const colors = {
    blue: "from-blue-500 to-cyan-400",
    emerald: "from-emerald-500 to-green-400",
    cyan: "from-cyan-500 to-sky-400",
    violet: "from-violet-500 to-purple-400",
  };

  return (
    <div className="group rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.20)]">

      <div className="flex items-center justify-between">

        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          {title}
        </span>

        <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></div>

      </div>

      <div className="mt-6 text-5xl font-black text-white">
        {value}
      </div>

      <div className="mt-2 text-sm font-semibold text-emerald-400">
        {change}
      </div>

      <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-800">

        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors[color as keyof typeof colors]}`}
          style={{ width: `${progress}%` }}
        />

      </div>

      <div className="mt-3 flex justify-between text-xs text-slate-500">

        <span>Progress</span>

        <span>{progress}%</span>

      </div>

    </div>
  );
}