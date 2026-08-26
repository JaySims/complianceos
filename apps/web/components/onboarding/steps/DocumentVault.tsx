"use client";

type Props = {
  formData: any;
  setFormData: any;
};

export default function DocumentVault({
  formData,
  setFormData,
}: Props) {
  const documents = [
    "Company Registration Certificate",
    "Tax Clearance Certificate",
    "VAT Registration",
    "B-BBEE Certificate",
    "Memorandum of Incorporation (MOI)",
    "Shareholder Register",
    "Directors Register",
    "POPIA Policy",
  ];

  return (
    <div className="space-y-10">

      {/* Header */}

      <div>

        <div className="inline-flex items-center rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
          Document Vault
        </div>

        <h2 className="mt-5 text-4xl font-bold text-slate-900">
          Secure Business Documents
        </h2>

        <p className="mt-3 text-lg text-slate-600 max-w-3xl">
          Upload your organisation's key compliance documents.
          ComplianceOS securely stores, analyses and continuously monitors
          document validity.
        </p>

      </div>

      {/* Required Documents */}

      <div className="grid gap-4">

        {documents.map((doc) => (

          <div
            key={doc}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300 transition"
          >
            <div>

              <h3 className="font-semibold text-slate-900">
                {doc}
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Upload PDF, DOCX or Image
              </p>

            </div>

            <button
              className="
                rounded-xl
                bg-blue-600
                px-5
                py-3
                font-semibold
                text-white
                hover:bg-blue-700
                transition
              "
            >
              Upload
            </button>

          </div>

        ))}

      </div>

      {/* AI Insight */}

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">

        <h3 className="text-lg font-semibold text-amber-800">
          AI Document Intelligence
        </h3>

        <p className="mt-3 leading-7 text-amber-700">
          ComplianceOS automatically detects expired certificates,
          missing governance documents, compliance gaps and upcoming
          renewal dates. Your Digital Trust Score increases as verified
          documentation is added.
        </p>

      </div>

    </div>
  );
}
