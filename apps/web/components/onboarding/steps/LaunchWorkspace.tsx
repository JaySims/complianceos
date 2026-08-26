"use client";

type Props = {
  formData: any;
};

export default function LaunchWorkspace({ formData }: Props) {
  return (
    <div className="space-y-12">

      {/* Success Header */}

      <div className="text-center">

        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-cyan-500 text-5xl text-white shadow-xl">
          🚀
        </div>

        <h1 className="mt-8 text-5xl font-bold text-slate-900">
          Ready to Launch
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-slate-600">
          Your organisation profile has been prepared successfully.
          ComplianceOS is ready to create your Enterprise Digital Trust
          Workspace.
        </p>

      </div>

      {/* Executive Summary */}

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            Organisation Summary
          </h2>

          <div className="mt-6 space-y-4">

            <div className="flex justify-between">
              <span className="text-slate-500">Company</span>
              <span className="font-semibold">
                {formData.companyName || "-"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Industry</span>
              <span className="font-semibold">
                {formData.industry || "-"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Registration</span>
              <span className="font-semibold">
                {formData.registrationNumber || "-"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Employees</span>
              <span className="font-semibold">
                {formData.employees || "-"}
              </span>
            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8">

          <h2 className="text-2xl font-bold text-emerald-900">
            Enterprise Workspace
          </h2>

          <div className="mt-6 space-y-4 text-emerald-800">

            <p>✅ AI Compliance Brain Activated</p>

            <p>✅ Digital Trust Engine Ready</p>

            <p>✅ Governance Monitoring Enabled</p>

            <p>✅ Document Intelligence Ready</p>

            <p>✅ Procurement Intelligence Ready</p>

            <p>✅ Funding Intelligence Ready</p>

          </div>

        </div>

      </div>

      {/* AI Executive Message */}

      <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-8">

        <h2 className="text-2xl font-bold text-blue-900">
          AI Executive Briefing
        </h2>

        <p className="mt-4 text-lg leading-8 text-blue-800">
          Congratulations. Your organisation is now ready to enter the
          ComplianceOS ecosystem. Once launched, your Executive Dashboard
          will continuously monitor compliance, strengthen your Digital
          Trust Score, identify funding and procurement opportunities,
          and provide AI-powered governance recommendations.
        </p>

      </div>

    </div>
  );
}
