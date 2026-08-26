"use client";

import { RegistrationData } from "./RegistrationWizard";

type Props = {
  formData: RegistrationData;
  setFormData: React.Dispatch<
    React.SetStateAction<RegistrationData>
  >;
};

export default function Compliance({
  formData,
  setFormData,
}: Props) {
  return (
    <div className="space-y-8">

      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Compliance Profile
        </h2>

        <p className="text-gray-500 mt-2">
          Tell ComplianceOS about your current compliance status.
        </p>
      </div>

      <div className="space-y-4">

        <label className="flex items-center gap-4 border rounded-xl p-4 hover:bg-slate-50">
          <input type="checkbox" />
          <span>Registered with CIPC</span>
        </label>

        <label className="flex items-center gap-4 border rounded-xl p-4 hover:bg-slate-50">
          <input type="checkbox" />
          <span>Registered for SARS Tax</span>
        </label>

        <label className="flex items-center gap-4 border rounded-xl p-4 hover:bg-slate-50">
          <input type="checkbox" />
          <span>VAT Registered</span>
        </label>

        <label className="flex items-center gap-4 border rounded-xl p-4 hover:bg-slate-50">
          <input type="checkbox" />
          <span>PAYE Registered</span>
        </label>

        <label className="flex items-center gap-4 border rounded-xl p-4 hover:bg-slate-50">
          <input type="checkbox" />
          <span>UIF Registered</span>
        </label>

        <label className="flex items-center gap-4 border rounded-xl p-4 hover:bg-slate-50">
          <input type="checkbox" />
          <span>B-BBEE Certificate Available</span>
        </label>

        <label className="flex items-center gap-4 border rounded-xl p-4 hover:bg-slate-50">
          <input type="checkbox" />
          <span>POPIA Compliance Programme</span>
        </label>

      </div>

    </div>
  );
}
