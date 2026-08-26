"use client";

import { RegistrationData } from "@/components/registration/RegistrationWizard";
import { getBusinessIntelligence } from "@/lib/ai/business-intelligence";

export default function AIBusinessPanel({
  formData,
}: {
  formData: RegistrationData;
}) {

  const prediction = getBusinessIntelligence({
    companyName: formData.companyName,
    industry: formData.industry,
    employees: formData.employees,
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8">

      <h2 className="text-2xl font-bold">
        AI Business Intelligence
      </h2>

      <p className="text-slate-500 mt-2">
        Live analysis as you register.
      </p>

      <div className="space-y-6 mt-8">

        <div className="flex justify-between">
          <span>Business Size</span>
          <strong>{prediction.businessSize}</strong>
        </div>

        <div className="flex justify-between">
          <span>Digital Trust</span>
          <strong>{prediction.trustScore}%</strong>
        </div>

        <div className="flex justify-between">
          <span>Compliance</span>
          <strong>{prediction.complianceScore}%</strong>
        </div>

        <div className="flex justify-between">
          <span>Funding Potential</span>
          <strong>{prediction.fundingPotential}</strong>
        </div>

        <div className="flex justify-between">
          <span>Risk Level</span>
          <strong>{prediction.riskLevel}</strong>
        </div>

      </div>

      <hr className="my-8"/>

      <h3 className="font-bold mb-4">
        Recommended Standards
      </h3>

      <div className="space-y-3">

        {prediction.standards.map((item)=>(
          <div
            key={item}
            className="rounded-xl bg-blue-50 border border-blue-100 p-3"
          >
            ✓ {item}
          </div>
        ))}

      </div>

    </div>
  );
}
