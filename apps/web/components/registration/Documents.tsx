"use client";

import { RegistrationData } from "./RegistrationWizard";

type Props = {
  formData: RegistrationData;
  setFormData: React.Dispatch<
    React.SetStateAction<RegistrationData>
  >;
};

export default function Documents({
  formData,
  setFormData,
}: Props) {
  return (
    <div className="space-y-8">

      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Company Documents
        </h2>

        <p className="text-gray-500 mt-2">
          Upload documents used to verify your business and calculate your Digital Trust Score.
        </p>
      </div>

      <div className="space-y-5">

        <UploadCard title="CIPC Registration Certificate" />

        <UploadCard title="SARS Tax Clearance Certificate" />

        <UploadCard title="B-BBEE Certificate / Affidavit" />

        <UploadCard title="Proof of Business Address" />

        <UploadCard title="Company Logo (Optional)" />

      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-200 p-6">

        <h3 className="font-semibold text-blue-700">
          AI Document Verification
        </h3>

        <p className="text-gray-600 mt-2">
          During registration ComplianceOS AI automatically validates every uploaded
          document and extracts compliance information to build your Digital Trust Profile.
        </p>

      </div>

    </div>
  );
}

function UploadCard({
  title,
}: {
  title: string;
}) {
  return (
    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-blue-500 transition">

      <h3 className="font-semibold mb-4">
        {title}
      </h3>

      <input
        type="file"
        className="block w-full text-sm"
      />

    </div>
  );
}
