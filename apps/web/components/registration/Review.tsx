"use client";

import { RegistrationData } from "./RegistrationWizard";

type Props = {
  formData: RegistrationData;
};

export default function Review({
  formData,
}: Props) {
  return (
    <div className="space-y-10">

      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Review Registration
        </h2>

        <p className="text-gray-500 mt-2">
          Review your information before creating your ComplianceOS workspace.
        </p>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm p-8">

        <h3 className="text-xl font-semibold mb-6">
          Company Summary
        </h3>

        <div className="grid md:grid-cols-2 gap-6">

          <Info
            label="Company Name"
            value={formData.companyName}
          />

          <Info
            label="Trading Name"
            value={formData.tradingName}
          />

          <Info
            label="Registration Number"
            value={formData.registrationNumber}
          />

          <Info
            label="Website"
            value={formData.website}
          />

          <Info
            label="Industry"
            value={formData.industry}
          />

          <Info
            label="Employees"
            value={String(formData.employees)}
          />

        </div>

      </div>

      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-blue-700 text-white p-8">

        <h3 className="text-2xl font-bold">
          Preliminary AI Assessment
        </h3>

        <div className="flex items-center gap-8 mt-8">

          <div className="text-6xl font-bold">
            82%
          </div>

          <div>

            <p className="text-xl font-semibold">
              Estimated Digital Trust Score
            </p>

            <p className="opacity-90 mt-2">
              This score is calculated using your registration information.
              After document verification ComplianceOS AI will generate your
              official Trust Score.
            </p>

          </div>

        </div>

      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8">

        <h3 className="text-xl font-bold text-blue-700">
          What Happens Next?
        </h3>

        <ul className="mt-6 space-y-3 text-gray-700">

          <li>✅ Organization profile created</li>

          <li>✅ AI document verification begins</li>

          <li>✅ Digital Trust Score generated</li>

          <li>✅ Compliance Dashboard activated</li>

          <li>✅ Opportunity Engine unlocked</li>

          <li>✅ Executive Analytics available</li>

        </ul>

      </div>

    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="font-semibold text-lg mt-1">
        {value || "-"}
      </p>

    </div>
  );
}
