"use client";

import { ReactNode } from "react";

type ExecutiveSectionProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function ExecutiveSection({
  title,
  subtitle,
  children,
  actions,
  className = "",
}: ExecutiveSectionProps) {
  return (
    <section
      className={`
        bg-white
        rounded-3xl
        border
        border-slate-200
        shadow-sm
        p-8
        transition-all
        duration-300
        hover:shadow-lg
        ${className}
      `}
    >
      {(title || actions) && (
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">

          <div>

            {title && (
              <h2 className="text-2xl font-bold text-slate-900">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="mt-2 text-slate-600">
                {subtitle}
              </p>
            )}

          </div>

          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}

        </div>
      )}

      <div>
        {children}
      </div>

    </section>
  );
}
