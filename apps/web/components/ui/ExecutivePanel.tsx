"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type ExecutivePanelProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function ExecutivePanel({
  title,
  subtitle,
  icon: Icon,
  children,
  actions,
  className = "",
}: ExecutivePanelProps) {
  return (
    <section
      className={`
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-white/10
        bg-gradient-to-br
        from-[#151A25]
        via-[#111827]
        to-[#0B1220]
        shadow-2xl
        backdrop-blur-xl
        transition-all
        duration-300
        hover:border-blue-500/20
        hover:shadow-blue-900/20
        ${className}
      `}
    >
      {/* Ambient Glow */}

      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5 pointer-events-none" />

      {/* Header */}

      <div className="relative flex items-center justify-between border-b border-white/5 px-8 py-6">

        <div className="flex items-center gap-4">

          {Icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10">

              <Icon
                size={24}
                className="text-blue-400"
              />

            </div>
          )}

          <div>

            <h2 className="text-xl font-semibold text-white">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-sm text-slate-400">
                {subtitle}
              </p>
            )}

          </div>

        </div>

        {actions && (
          <div>

            {actions}

          </div>
        )}

      </div>

      {/* Content */}

      <div className="relative p-8">

        {children}

      </div>
    </section>
  );

}
