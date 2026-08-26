"use client";

import type {
  Dispatch,
  SetStateAction,
} from "react";

import ExecutiveInput from "@/components/ui/ExecutiveInput";

import type {
  RegistrationData,
} from "@/components/onboarding/ExecutiveRegistrationWizard";

type Props = {
  formData: RegistrationData;

  setFormData: Dispatch<
    SetStateAction<RegistrationData>
  >;
};

export default function BusinessContacts({
  formData,
  setFormData,
}: Props) {
  const passwordMismatch =
    formData.confirmPassword.length > 0 &&
    formData.password !==
      formData.confirmPassword;

  return (
    <div className="space-y-10">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div>

        <div className="inline-flex items-center rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
          Business Contacts
        </div>

        <h2 className="mt-5 text-4xl font-bold text-slate-900">
          Executive Contact Information
        </h2>

        <p className="mt-3 max-w-3xl text-lg text-slate-600">
          Establish the primary executive identity and secure
          access credentials ComplianceOS will use for your
          organisation workspace.
        </p>

      </div>

      {/* ======================================================
          EXECUTIVE IDENTITY
          ====================================================== */}

      <div>

        <h3 className="text-xl font-bold text-slate-900">
          Executive Identity
        </h3>

        <p className="mt-2 text-slate-600">
          These details identify the primary account owner for
          this organisation.
        </p>

        <div className="mt-6 grid gap-8 md:grid-cols-2">

          <ExecutiveInput
            label="Primary Contact"
            placeholder="John Smith"
            value={
              formData.fullName
            }
            onChange={(e: any) =>
              setFormData(
                (current) => ({
                  ...current,

                  fullName:
                    e.target.value,
                })
              )
            }
          />

          <ExecutiveInput
            label="Business Email"
            type="email"
            placeholder="admin@company.com"
            value={
              formData.email
            }
            onChange={(e: any) =>
              setFormData(
                (current) => ({
                  ...current,

                  email:
                    e.target.value,
                })
              )
            }
          />

        </div>

      </div>

      {/* ======================================================
          SECURE WORKSPACE ACCESS
          ====================================================== */}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:p-8">

        <div>

          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-700">
            Secure Workspace Access
          </p>

          <h3 className="mt-2 text-xl font-bold text-slate-900">
            Create Your ComplianceOS Password
          </h3>

          <p className="mt-2 text-slate-600">
            This password protects access to your organisation&apos;s
            ComplianceOS workspace.
          </p>

        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-2">

          <ExecutiveInput
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={
              formData.password
            }
            onChange={(e: any) =>
              setFormData(
                (current) => ({
                  ...current,

                  password:
                    e.target.value,
                })
              )
            }
          />

          <ExecutiveInput
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            value={
              formData.confirmPassword
            }
            onChange={(e: any) =>
              setFormData(
                (current) => ({
                  ...current,

                  confirmPassword:
                    e.target.value,
                })
              )
            }
          />

        </div>

        {formData.password.length > 0 &&
          formData.password.length < 8 && (

          <p className="mt-4 text-sm font-medium text-amber-700">
            Your password must contain at least 8 characters.
          </p>

        )}

        {passwordMismatch && (

          <p className="mt-4 text-sm font-medium text-red-700">
            Your passwords do not match.
          </p>

        )}

      </div>

      {/* ======================================================
          ORGANISATION CONTACTS
          ====================================================== */}

      <div>

        <h3 className="text-xl font-bold text-slate-900">
          Organisation Contacts
        </h3>

        <div className="mt-6 grid gap-8 md:grid-cols-2">

          <ExecutiveInput
            label="Organisation Phone"
            placeholder="+27 11 123 4567"
            value={
              formData.phone ?? ""
            }
            onChange={(e: any) =>
              setFormData(
                (current) => ({
                  ...current,

                  phone:
                    e.target.value,
                })
              )
            }
          />

          <ExecutiveInput
            label="Compliance Officer"
            placeholder="Compliance Manager"
            value={
              formData.complianceOfficer ??
              ""
            }
            onChange={(e: any) =>
              setFormData(
                (current) => ({
                  ...current,

                  complianceOfficer:
                    e.target.value,
                })
              )
            }
          />

          <ExecutiveInput
            label="Finance Contact"
            placeholder="Finance Director"
            value={
              formData.financeContact ??
              ""
            }
            onChange={(e: any) =>
              setFormData(
                (current) => ({
                  ...current,

                  financeContact:
                    e.target.value,
                })
              )
            }
          />

          <ExecutiveInput
            label="Physical Address"
            placeholder="123 Business Street, Johannesburg"
            value={
              formData.address ?? ""
            }
            onChange={(e: any) =>
              setFormData(
                (current) => ({
                  ...current,

                  address:
                    e.target.value,
                })
              )
            }
          />

        </div>

      </div>

      {/* ======================================================
          AI INSIGHT
          ====================================================== */}

      <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6">

        <h3 className="text-lg font-semibold text-cyan-800">
          AI Executive Insight
        </h3>

        <p className="mt-2 text-cyan-700">
          Verified executive contacts improve your Digital Trust
          Score and ensure ComplianceOS can deliver governance
          alerts, procurement opportunities, funding updates and
          regulatory notifications to the correct decision-makers.
        </p>

      </div>

    </div>
  );
}
