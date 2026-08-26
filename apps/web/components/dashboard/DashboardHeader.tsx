"use client";

export default function DashboardHeader() {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-3xl p-10 text-white shadow-2xl">

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-8">

        <div>

          <p className="uppercase tracking-[0.3em] text-blue-300 text-sm font-semibold">
            ComplianceOS Executive Dashboard
          </p>

          <h1 className="text-5xl font-bold mt-3">
            Welcome back 👋
          </h1>

          <h2 className="text-2xl font-semibold mt-2 text-blue-100">
            Demo Company (Pty) Ltd
          </h2>

          <p className="mt-5 text-slate-300 max-w-2xl leading-7">
            Your AI Compliance Executive has analysed your organisation.
            Overall business health is strong, but completing the remaining
            compliance requirements could significantly improve your
            Digital Trust Score and unlock additional funding and procurement
            opportunities.
          </p>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <button className="bg-blue-600 hover:bg-blue-700 transition rounded-xl px-6 py-4 font-semibold">
            Upload Documents
          </button>

          <button className="bg-emerald-600 hover:bg-emerald-700 transition rounded-xl px-6 py-4 font-semibold">
            AI Assessment
          </button>

          <button className="bg-purple-600 hover:bg-purple-700 transition rounded-xl px-6 py-4 font-semibold">
            Opportunities
          </button>

          <button className="bg-orange-600 hover:bg-orange-700 transition rounded-xl px-6 py-4 font-semibold">
            Executive Report
          </button>

        </div>

      </div>

      <div className="grid md:grid-cols-4 gap-6 mt-10">

        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur">

          <p className="text-sm text-blue-200">
            Digital Trust
          </p>

          <h3 className="text-4xl font-bold mt-2">
            82%
          </h3>

        </div>

        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur">

          <p className="text-sm text-blue-200">
            Compliance
          </p>

          <h3 className="text-4xl font-bold mt-2">
            74%
          </h3>

        </div>

        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur">

          <p className="text-sm text-blue-200">
            AI Recommendations
          </p>

          <h3 className="text-4xl font-bold mt-2">
            12
          </h3>

        </div>

        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur">

          <p className="text-sm text-blue-200">
            Opportunities
          </p>

          <h3 className="text-4xl font-bold mt-2">
            8
          </h3>

        </div>

      </div>

    </div>
  );
}
