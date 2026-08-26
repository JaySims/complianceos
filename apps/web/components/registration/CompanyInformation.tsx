"use client";

import { RegistrationData } from "./RegistrationWizard";

type Props = {
  formData: RegistrationData;
  setFormData: React.Dispatch<React.SetStateAction<RegistrationData>>;
};

export default function CompanyInformation({
  formData,
  setFormData,
}: Props) {
  return (
    <div className="space-y-8">

      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Company Information
        </h2>

        <p className="text-gray-500 mt-2">
          Tell us about your business.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        <div>
          <label className="block text-sm font-medium mb-2">
            Company Name
          </label>

          <input
            value={formData.companyName}
            onChange={(e) =>
              setFormData({
                ...formData,
                companyName: e.target.value,
              })
            }
            type="text"
            placeholder="ComplianceOS (Pty) Ltd"
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Registration Number
          </label>

          <input
            value={formData.registrationNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                registrationNumber: e.target.value,
              })
            }
            type="text"
            placeholder="2026/123456/07"
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Trading Name
          </label>

          <input
            value={formData.tradingName}
            onChange={(e) =>
              setFormData({
                ...formData,
                tradingName: e.target.value,
              })
            }
            type="text"
            placeholder="ComplianceOS"
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Website
          </label>

          <input
            value={formData.website}
            onChange={(e) =>
              setFormData({
                ...formData,
                website: e.target.value,
              })
            }
            type="url"
            placeholder="https://example.com"
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Industry
          </label>

          <select
            value={formData.industry}
            onChange={(e) =>
              setFormData({
                ...formData,
                industry: e.target.value,
              })
            }
            className="w-full border rounded-lg p-3"
          >
            <option value="">Select Industry</option>
            <option>Finance</option>
            <option>Healthcare</option>
            <option>Technology</option>
            <option>Manufacturing</option>
            <option>Mining</option>
            <option>Retail</option>
            <option>Government</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Number of Employees
          </label>

          <input
            type="number"
            value={formData.employees}
            onChange={(e) =>
              setFormData({
                ...formData,
                employees: Number(e.target.value),
              })
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

      </div>

    </div>
  );
}