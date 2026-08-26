"use client";

import { ReactNode } from "react";

type ExecutivePageProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export default function ExecutivePage({
  title,
  subtitle,
  children,
  actions,
}: ExecutivePageProps) {
  return (
    <main className="min-h-screen bg-slate-50">

      {/* Top Header */}
      <section className="border-b border-slate-200 bg-white">

        <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-3 text-lg text-slate-600 max-w-3xl">
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

      </section>

      {/* Main Content */}
      <section>

        <div className="max-w-7xl mx-auto px-8 py-10">

          {children}

        </div>

      </section>

    </main>
  );
}
