"use client";

const metrics = [
  {
    title: "Funding Matches",
    value: "16",
    subtitle: "+4 New Today",
    colour: "blue",
  },
  {
    title: "Compliance Health",
    value: "98%",
    subtitle: "Excellent",
    colour: "emerald",
  },
  {
    title: "Business Risk",
    value: "LOW",
    subtitle: "AI Monitored",
    colour: "amber",
  },
  {
    title: "AI Confidence",
    value: "96%",
    subtitle: "Learning Continuously",
    colour: "cyan",
  },
];

export default function HeroMetrics() {
  return (
    <div className="grid grid-cols-2 gap-5">

      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}

    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  colour,
}: {
  title: string;
  value: string;
  subtitle: string;
  colour: string;
}) {

  const glow = {
    blue: "shadow-blue-500/20 border-blue-500/20",
    emerald: "shadow-emerald-500/20 border-emerald-500/20",
    amber: "shadow-amber-500/20 border-amber-500/20",
    cyan: "shadow-cyan-500/20 border-cyan-500/20",
  };

  const dot = {
    blue: "bg-blue-400",
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    cyan: "bg-cyan-400",
  };

  return (

    <div
      className={`group rounded-[24px] border bg-slate-900/70 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl ${glow[colour as keyof typeof glow]}`}
    >

      <div className="flex items-center justify-between">

        <div
          className={`h-3 w-3 rounded-full animate-pulse ${
            dot[colour as keyof typeof dot]
          }`}
        />

        <span className="text-xs uppercase tracking-[0.20em] text-slate-500">
          LIVE
        </span>

      </div>

      <p className="mt-6 text-sm font-medium text-slate-400">
        {title}
      </p>

      <h3 className="mt-3 text-4xl font-black tracking-tight text-white">
        {value}
      </h3>

      <div className="mt-6 flex items-center justify-between">

        <p className="text-sm text-slate-500">
          {subtitle}
        </p>

        <svg
          className="h-5 w-5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>

      </div>

    </div>

  );
}