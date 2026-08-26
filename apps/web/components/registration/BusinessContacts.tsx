"use client";

import { RegistrationData } from "./RegistrationWizard";

type Props = {
  formData: RegistrationData;
  setFormData: React.Dispatch<
    React.SetStateAction<RegistrationData>
  >;
};

export default function BusinessContacts({
  formData,
  setFormData,
}: Props) {
  return (
    <div className="space-y-8">

      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Account Owner
        </h2>

        <p className="text-gray-500 mt-2">
          Create the administrator account for your ComplianceOS workspace.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">
            Full Name
          </label>

          <input
            type="text"
            placeholder="John Smith"
            className="w-full border rounded-lg p-3"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({
                ...formData,
                fullName: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email Address
          </label>

          <input
            type="email"
            placeholder="john@company.com"
            className="w-full border rounded-lg p-3"
            value={formData.email}
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Password
          </label>

          <input
            type="password"
            placeholder="Create Password"
            className="w-full border rounded-lg p-3"
            value={formData.password}
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value,
              })
            }
          />
        </div>

      </div>

    </div>
  );
}
