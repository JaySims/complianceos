"use client";

import ExecutiveInput from "@/components/ui/ExecutiveInput";

type Props = {
  formData: any;
  setFormData: any;
};

export default function Governance({
  formData,
  setFormData,
}: Props) {
  return (
    <div className="space-y-10">

      {/* Header */}

      <div>

        <div className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
          Corporate Governance
        </div>

        <h2 className="mt-5 text-4xl font-bold text-slate-900">
          Executive Leadership Structure
        </h2>

        <p className="mt-3 text-lg text-slate-600 max-w-3xl">
          ComplianceOS evaluates your governance structure to determine
          organisational maturity, accountability and executive readiness.
        </p>

      </div>

      {/* Form */}

      <div className="grid gap-8 md:grid-cols-2">

        <ExecutiveInput
          label="Chief Executive Officer"
          placeholder="CEO Name"
          value={formData.ceo ?? ""}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              ceo: e.target.value,
            })
          }
        />

        <ExecutiveInput
          label="Chief Financial Officer"
          placeholder="CFO Name"
          value={formData.cfo ?? ""}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              cfo: e.target.value,
            })
          }
        />

        <ExecutiveInput
          label="Compliance Officer"
          placeholder="Compliance Officer"
          value={formData.complianceOfficer ?? ""}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              complianceOfficer: e.target.value,
            })
          }
        />

        <ExecutiveInput
          label="Company Secretary"
          placeholder="Company Secretary"
          value={formData.companySecretary ?? ""}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              companySecretary: e.target.value,
            })
          }
        />

        <ExecutiveInput
          label="Number of Directors"
          type="number"
          placeholder="5"
          value={formData.directorCount ?? ""}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              directorCount: Number(e.target.value),
            })
          }
        />

        <ExecutiveInput
          label="Board Meeting Frequency"
          placeholder="Quarterly"
          value={formData.boardMeetings ?? ""}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              boardMeetings: e.target.value,
            })
          }
        />

      </div>

      {/* AI Insight */}

      <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6">

        <h3 className="text-lg font-semibold text-indigo-800">
          AI Governance Insight
        </h3>

        <p className="mt-3 text-indigo-700 leading-7">
          Strong governance increases your Digital Trust Score and
          demonstrates organisational maturity to procurement teams,
          investors and financial institutions. ComplianceOS continuously
          analyses governance indicators and recommends improvements.
        </p>

      </div>

    </div>
  );
}
