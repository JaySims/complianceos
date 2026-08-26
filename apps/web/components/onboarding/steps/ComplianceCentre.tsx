"use client";

import ExecutiveInput from "@/components/ui/ExecutiveInput";

type Props = {
  formData: any;
  setFormData: any;
};

export default function ComplianceCentre({
  formData,
  setFormData,
}: Props) {
  return (
    <div className="space-y-10">

      {/* Header */}

      <div>

        <div className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          Compliance Centre
        </div>

        <h2 className="mt-5 text-4xl font-bold text-slate-900">
          Regulatory & Compliance Profile
        </h2>

        <p className="mt-3 text-lg text-slate-600 max-w-3xl">
          Help ComplianceOS understand your current compliance position.
          This information powers your AI Compliance Brain and Digital
          Trust Score.
        </p>

      </div>

      {/* Form */}

      <div className="grid gap-8 md:grid-cols-2">

        <ExecutiveInput
          label="Tax Number"
          placeholder="SARS Tax Reference"
          value={formData.taxNumber ?? ""}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              taxNumber: e.target.value,
            })
          }
        />

        <ExecutiveInput
          label="VAT Number"
          placeholder="VAT Registration"
          value={formData.vatNumber ?? ""}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              vatNumber: e.target.value,
            })
          }
        />

        <ExecutiveInput
          label="B-BBEE Level"
          placeholder="Level 1"
          value={formData.bbeeLevel ?? ""}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              bbeeLevel: e.target.value,
            })
          }
        />

        <ExecutiveInput
          label="POPIA Officer"
          placeholder="Information Officer"
          value={formData.popiaOfficer ?? ""}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              popiaOfficer: e.target.value,
            })
          }
        />

        <ExecutiveInput
          label="Industry Regulator"
          placeholder="FSCA / CIDB / etc."
          value={formData.regulator ?? ""}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              regulator: e.target.value,
            })
          }
        />

        <ExecutiveInput
          label="Compliance Management System"
          placeholder="ISO 37301 / Internal"
          value={formData.complianceSystem ?? ""}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              complianceSystem: e.target.value,
            })
          }
        />

      </div>

      {/* AI Insight */}

      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">

        <h3 className="text-lg font-semibold text-emerald-800">
          AI Compliance Insight
        </h3>

        <p className="mt-3 text-emerald-700 leading-7">
          ComplianceOS will continuously monitor your regulatory profile,
          identify missing compliance requirements, recommend corrective
          actions, and improve your Digital Trust Score as your
          organisation matures.
        </p>

      </div>

    </div>
  );
}
