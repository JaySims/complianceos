"use client";

import { ReactNode } from "react";

type ExecutiveLayoutProps = {
  children: ReactNode;
};

export default function ExecutiveLayout({
  children,
}: ExecutiveLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-100">

      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 shadow-sm">

        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold text-slate-900">
              ComplianceOS AI
            </h1>

            <p className="text-sm text-slate-500">
              Executive Command Center
            </p>

          </div>

          <div className="flex items-center gap-6">

            <button className="relative text-2xl hover:scale-110 transition">
              🔔

              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span>

            </button>

            <div className="flex items-center gap-3">

              <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                S
              </div>

              <div>

                <p className="font-semibold text-slate-900">
                  Simphiwe
                </p>

                <p className="text-sm text-slate-500">
                  Account Owner
                </p>

              </div>

            </div>

          </div>

        </div>

      </header>

      {/* Dashboard Content */}

      <section className="max-w-7xl mx-auto p-8">

        {children}

      </section>

    </main>
  );
}
