"use client";

import ExecutiveBadge from "@/components/ui/ExecutiveBadge";

export default function ExecutiveHeader() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

        <div>

          <ExecutiveBadge>
            ComplianceOS Enterprise
          </ExecutiveBadge>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            Executive Business Onboarding
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600 leading-7">
            Create your organisation's secure AI-powered ComplianceOS
            workspace. Complete the onboarding journey to unlock
            Digital Trust, Compliance Intelligence, Funding Readiness,
            Procurement Intelligence and Executive Analytics.
          </p>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">

            <p className="text-sm text-slate-500">
              Estimated Time
            </p>

            <h3 className="mt-2 text-xl font-bold text-slate-900">
              8–10 min
            </h3>

          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">

            <p className="text-sm text-slate-500">
              Security
            </p>

            <h3 className="mt-2 text-xl font-bold text-emerald-600">
              AES-256
            </h3>

          </div>

        </div>

      </div>

    </div>
  );
}
