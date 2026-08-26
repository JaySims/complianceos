"use client";

import ExecutiveInput from "@/components/ui/ExecutiveInput";
import ExecutiveSelect from "@/components/ui/ExecutiveSelect";

type Props = {
  formData: any;
  setFormData: any;
};

export default function OrganisationIdentity({
  formData,
  setFormData,
}: Props) {
  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "Mining",
    "Manufacturing",
    "Retail",
    "Education",
    "Government",
    "Agriculture",
    "Construction",
    "Transport",
    "Energy",
    "Other",
  ];

  return (
    <div className="space-y-10">

      <div>

        <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          Organisation Identity
        </div>

        <h2 className="mt-5 text-4xl font-bold text-slate-900">
          Tell us about your organisation
        </h2>

        <p className="mt-3 max-w-3xl text-lg text-slate-600">
          This information establishes your organisation&apos;s Digital Trust
          profile and forms the foundation of your ComplianceOS workspace.
        </p>

      </div>

      <div className="grid gap-8 md:grid-cols-2">

        <ExecutiveInput
          label="Registered Company Name"
          placeholder="ComplianceOS (Pty) Ltd"
          value={formData.companyName}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              companyName: e.target.value,
            })
          }
        />

        <ExecutiveInput
          label="Registration Number"
          placeholder="2026/123456/07"
          value={formData.registrationNumber}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              registrationNumber: e.target.value,
            })
          }
        />

        <ExecutiveInput
          label="Trading Name"
          placeholder="ComplianceOS"
          value={formData.tradingName}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              tradingName: e.target.value,
            })
          }
        />

        <ExecutiveInput
          label="Website"
          placeholder="https://company.com"
          value={formData.website}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              website: e.target.value,
            })
          }
        />

        <ExecutiveSelect
          label="Industry"
          value={formData.industry}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              industry: e.target.value,
            })
          }
        >
          <option value="">
            Select an industry
          </option>

          {industries.map((industry) => (
            <option
              key={industry}
              value={industry}
            >
              {industry}
            </option>
          ))}
        </ExecutiveSelect>

        <ExecutiveInput
          label="Number of Employees"
          type="number"
          placeholder="50"
          value={formData.employees}
          onChange={(e: any) =>
            setFormData({
              ...formData,
              employees: Number(e.target.value),
            })
          }
        />

      </div>

      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">

        <h3 className="text-lg font-semibold text-emerald-800">
          AI Executive Insight
        </h3>

        <p className="mt-2 text-emerald-700">
          Your organisation profile contributes to your Digital Trust Score,
          procurement readiness, funding eligibility, and AI compliance
          recommendations throughout ComplianceOS.
        </p>

      </div>

    </div>
  );
}
