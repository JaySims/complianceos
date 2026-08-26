"use client";

import { RegistrationData } from "./RegistrationWizard";

type Props = {
  formData: RegistrationData;
  setFormData: React.Dispatch<
    React.SetStateAction<RegistrationData>
  >;
};

export default function Directors({
  formData,
  setFormData,
}: Props) {
  return (
    <div className="space-y-8">

      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Directors & Ownership
        </h2>

        <p className="text-gray-500 mt-2">
          Tell us who owns and manages the business.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        <div>
          <label className="block text-sm font-medium mb-2">
            Director Name
          </label>

          <input
            type="text"
            placeholder="John Smith"
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Position
          </label>

          <input
            type="text"
            placeholder="Managing Director"
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email Address
          </label>

          <input
            type="email"
            placeholder="john@company.co.za"
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Ownership Percentage
          </label>

          <input
            type="number"
            placeholder="100"
            className="w-full border rounded-lg p-3"
          />
        </div>

      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">

        <h3 className="text-lg font-semibold">
          Future Feature
        </h3>

        <p className="mt-2 text-gray-600">
          In future releases ComplianceOS will support multiple
          directors, shareholders, beneficial owners, and digital
          identity verification.
        </p>

      </div>

    </div>
  );
}
