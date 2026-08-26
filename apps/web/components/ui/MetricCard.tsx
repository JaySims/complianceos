import GlassPanel from "./GlassPanel";

type MetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  color?: "blue" | "cyan" | "emerald" | "amber" | "rose";
};

export default function MetricCard({
  title,
  value,
  subtitle,
  color = "blue",
}: MetricCardProps) {
  const colors = {
    blue: "text-blue-400",
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };

  return (
    <GlassPanel>

      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
        {title}
      </p>

      <div className={`mt-5 text-5xl font-black ${colors[color]}`}>
        {value}
      </div>

      {subtitle && (
        <p className="mt-4 text-slate-300">
          {subtitle}
        </p>
      )}

    </GlassPanel>
  );
}