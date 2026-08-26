"use client";

import { ReactNode } from "react";

import {
  ArrowUpRight,
  Activity,
  CheckCircle2,
} from "lucide-react";

type ExecutiveStatProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
};

export default function ExecutiveStat({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendDirection = "neutral",
}: ExecutiveStatProps) {

  const trendColor =
    trendDirection === "up"
      ? "text-emerald-600"
      : trendDirection === "down"
      ? "text-red-600"
      : "text-slate-500";

  return (

    <div
      className="
      rounded-[28px]
      bg-white
      border
      border-slate-200
      shadow-sm
      hover:shadow-xl
      transition-all
      duration-300
      p-7
    "
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">

            {title}

          </p>

          <h2 className="mt-4 text-5xl font-black text-slate-900">

            {value}

          </h2>

          {subtitle && (

            <p className="mt-3 text-sm text-slate-500">

              {subtitle}

            </p>

          )}

        </div>

        <div
          className="
          h-14
          w-14
          rounded-2xl
          bg-gradient-to-br
          from-blue-600
          to-cyan-500
          text-white
          flex
          items-center
          justify-center
          shadow-lg
        "
        >

          {icon ?? <Activity className="h-6 w-6" />}

        </div>

      </div>

      <div className="mt-7 flex items-center justify-between">

        <div className="flex items-center gap-2">

          <CheckCircle2 className="h-4 w-4 text-emerald-600" />

          <span className="text-xs font-semibold text-emerald-700">

            LIVE

          </span>

        </div>

        {trend && (

          <div
            className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}
          >

            <ArrowUpRight className="h-4 w-4" />

            {trend}

          </div>

        )}

      </div>

      <div className="mt-6 h-2 rounded-full bg-slate-200 overflow-hidden">

        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-700"
          style={{
            width: `${String(value).replace("%", "")}%`,
          }}
        />

      </div>

    </div>

  );

}
