"use client";

type Props = {
  formData: any;
};

export default function AIReview({ formData }: Props) {
  return (
    <div className="space-y-10">

      <div>

        <div className="inline-flex items-center rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
          AI Executive Review
        </div>

        <h2 className="mt-5 text-4xl font-bold text-slate-900">
          ComplianceOS AI Assessment
        </h2>

        <p className="mt-3 text-lg text-slate-600 max-w-3xl">
          Before your organisation is created, ComplianceOS performs an
          executive-level review of your information and estimates your
          Digital Trust readiness.
        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-6">

          <h3 className="text-lg font-semibold text-slate-900">
            Organisation
          </h3>

          <div className="mt-4 space-y-2 text-slate-600">

            <p>
              <strong>Company:</strong> {formData.companyName || "-"}
            </p>

            <p>
              <strong>Industry:</strong> {formData.industry || "-"}
            </p>

            <p>
              <strong>Registration:</strong> {formData.registrationNumber || "-"}
            </p>

          </div>

        </div>

        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">

          <h3 className="text-lg font-semibold text-blue-900">
            AI Readiness Assessment
          </h3>

          <div className="mt-5 space-y-4">

            <div className="flex justify-between">
              <span>Digital Trust</span>
              <span className="font-semibold text-blue-700">78%</span>
            </div>

            <div className="flex justify-between">
              <span>Compliance</span>
              <span className="font-semibold text-emerald-700">81%</span>
            </div>

            <div className="flex justify-between">
              <span>Funding Readiness</span>
              <span className="font-semibold text-amber-700">72%</span>
            </div>

            <div className="flex justify-between">
              <span>Procurement Readiness</span>
              <span className="font-semibold text-violet-700">84%</span>
            </div>

          </div>

        </div>

      </div>

      <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6">

        <h3 className="text-lg font-semibold text-violet-800">
          AI Recommendation
        </h3>

        <p className="mt-3 leading-7 text-violet-700">
          Your organisation has a strong onboarding profile. Completing
          document verification and governance records will significantly
          improve your Digital Trust Score and unlock procurement,
          funding and investor opportunities.
        </p>

      </div>

    </div>
  );
}
