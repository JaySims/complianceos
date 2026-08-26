"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ProgressBar from "./ProgressBar";
import CompanyInformation from "./CompanyInformation";
import BusinessContacts from "./BusinessContacts";
import Directors from "./Directors";
import Compliance from "./Compliance";
import Documents from "./Documents";
import Review from "./Review";

export interface RegistrationData {
  fullName: string;
  email: string;
  password: string;

  companyName: string;
  registrationNumber: string;
  tradingName: string;
  website: string;
  industry: string;
  employees: number;
}

export default function RegistrationWizard() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<RegistrationData>({
    fullName: "",
    email: "",
    password: "",

    companyName: "",
    registrationNumber: "",
    tradingName: "",
    website: "",
    industry: "",
    employees: 0,
  });

  const totalSteps = 7;

  function nextStep() {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  }

  function previousStep() {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  async function finishRegistration() {
    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Registration Failed");
        return;
      }

      router.replace("/dashboard");
      router.refresh();

    } catch (error) {
      console.error(error);
      alert("Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (

    <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 p-12">

      <h1 className="text-4xl font-bold text-slate-900">
        Register Your Business
      </h1>

      <p className="text-slate-500 mt-3 mb-10">
        Build your AI-powered ComplianceOS Workspace.
      </p>

      <ProgressBar
        currentStep={step}
        totalSteps={totalSteps}
      />

      <div className="mt-12">

        {step === 1 && (
          <CompanyInformation
            formData={formData}
            setFormData={setFormData}
          />
        )}

        {step === 2 && (
          <BusinessContacts
            formData={formData}
            setFormData={setFormData}
          />
        )}

        {step === 3 && (
          <Directors
            formData={formData}
            setFormData={setFormData}
          />
        )}

        {step === 4 && (
          <Compliance
            formData={formData}
            setFormData={setFormData}
          />
        )}

        {step === 5 && (
          <Documents
            formData={formData}
            setFormData={setFormData}
          />
        )}

        {step === 6 && (
          <Review
            formData={formData}
          />
        )}

        {step === 7 && (

          <div className="text-center py-16">

            <div className="text-6xl mb-6">
              🚀
            </div>

            <h2 className="text-3xl font-bold">
              Ready to Launch ComplianceOS
            </h2>

            <p className="mt-4 text-slate-500">
              Your AI Workspace will now be created.
            </p>

          </div>

        )}

      </div>

      <div className="flex justify-between items-center mt-14">

        <button
          onClick={previousStep}
          disabled={step === 1 || loading}
          className={`px-7 py-3 rounded-xl font-semibold transition-all border ${
            step === 1 || loading
              ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow"
          }`}
        >
          Previous
        </button>

        {step < totalSteps ? (

          <button
            onClick={nextStep}
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition-all"
          >
            Next
          </button>

        ) : (

          <button
            onClick={finishRegistration}
            disabled={loading}
            className={`px-9 py-3 rounded-xl text-white font-semibold transition-all ${
              loading
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-lg"
            }`}
          >
            {loading
              ? "Creating Workspace..."
              : "Finish Registration"}
          </button>

        )}

      </div>

    </div>

  );
}
