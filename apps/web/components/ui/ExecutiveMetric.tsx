"use client";

import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "violet" | "orange";
  trend?: number;
};

export default function ExecutiveMetric({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
}: Props) {
  const colors = {
    blue: {
      icon: "text-blue-400",
      glow: "from-blue-500/20 to-cyan-500/10",
      border: "border-blue-500/20",
    },
    green: {
      icon: "text-emerald-400",
      glow: "from-emerald-500/20 to-green-500/10",
      border: "border-emerald-500/20",
    },
    violet: {
      icon: "text-violet-400",
      glow: "from-violet-500/20 to-purple-500/10",
      border: "border-violet-500/20",
    },
    orange: {
      icon: "text-orange-400",
      glow: "from-orange-500/20 to-yellow-500/10",
      border: "border-orange-500/20",
    },
  };

  const theme = colors[color];

  return (
    <div
      className={`
      relative
      overflow-hidden
      rounded-3xl
      border
      ${theme.border}
      bg-[#111827]
      p-7
      shadow-xl
      transition-all
      duration-300
      hover:-translate-y-1
      hover:shadow-2xl
      `}
    >
      <div
        className={`
        absolute
        inset-0
        bg-gradient-to-br
        ${theme.glow}
        opacity-70
        pointer-events-none
        `}
      />

      <div className="relative">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
              {title}
            </p>

            <h2 className="mt-4 text-5xl font-bold text-white">
              {value}
            </h2>

          </div>

          <div
            className="
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            bg-white/5
            "
          >
            <Icon
              className={theme.icon}
              size={30}
            />
          </div>

        </div>

        {subtitle && (
          <p className="mt-5 text-slate-400">
            {subtitle}
          </p>
        )}

        {trend !== undefined && (

          <div className="mt-8 flex items-center gap-2">

            {trend >= 0 ? (
              <ArrowUpRight
                className="text-emerald-400"
                size={18}
              />
            ) : (
              <ArrowDownRight
                className="text-red-400"
                size={18}
              />
            )}

            <span
              className={`font-semibold ${
                trend >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {Math.abs(trend)}%
            </span>

            <span className="text-slate-500">
              this month
            </span>

          </div>

        )}

      </div>

    </div>
  );
}
