"use client";

import { ReactNode } from "react";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "premium";

type ExecutiveBadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
};

const styles: Record<BadgeVariant, string> = {
  success:
    "bg-emerald-100 text-emerald-700 border border-emerald-200",

  warning:
    "bg-amber-100 text-amber-700 border border-amber-200",

  danger:
    "bg-red-100 text-red-700 border border-red-200",

  info:
    "bg-blue-100 text-blue-700 border border-blue-200",

  neutral:
    "bg-slate-100 text-slate-700 border border-slate-200",

  premium:
    "bg-gradient-to-r from-indigo-600 to-blue-600 text-white border border-transparent",
};

export default function ExecutiveBadge({
  children,
  variant = "neutral",
}: ExecutiveBadgeProps) {
  return (
    <span
      className={`
        inline-flex
        items-center
        justify-center
        rounded-full
        px-4
        py-1.5
        text-sm
        font-semibold
        tracking-wide
        whitespace-nowrap
        ${styles[variant]}
      `}
    >
      {children}
    </span>
  );
}
