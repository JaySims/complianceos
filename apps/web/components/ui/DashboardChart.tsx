type DashboardChartProps = {
  title: string;
  value: string;
  percentage: number;
  color?: "blue" | "cyan" | "emerald";
};

export default function DashboardChart({
  title,
  value,
  percentage,
  color = "blue",
}: DashboardChartProps) {
  const colors = {
    blue: "from-blue-500 to-cyan-400",
    cyan: "from-cyan-400 to-sky-300",
    emerald: "from-emerald-500 to-green-300",
  };

  return (
    <div>

      <div className="mb-3 flex items-center justify-between">

        <span className="text-slate-300">
          {title}
        </span>

        <span className="font-bold text-white">
          {value}
        </span>

      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-800">

        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors[color]} transition-all duration-1000`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}