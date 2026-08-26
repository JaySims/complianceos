"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import ExecutiveWorkspace from "./ExecutiveWorkspace";

import OrganisationIdentity from "./steps/OrganisationIdentity";
import BusinessContacts from "./steps/BusinessContacts";
import Governance from "./steps/Governance";
import ComplianceCentre from "./steps/ComplianceCentre";
import DocumentVault from "./steps/DocumentVault";
import AIReview from "./steps/AIReview";
import LaunchWorkspace from "./steps/LaunchWorkspace";

import {
  useTrustRegistration,
} from "@/hooks/useTrustRegistration";

import {
  useMission,
} from "@/contexts/MissionContext";

/*
 * ============================================================
 * REGISTRATION DATA
 * ============================================================
 */

export interface RegistrationData {
  companyName: string;
  registrationNumber: string;
  tradingName: string;
  website: string;

  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;

  industry: string;
  employees: number;

  phone?: string;
  complianceOfficer?: string;
  financeContact?: string;
  address?: string;
}

type RegistrationResponse = {
  success: boolean;
  message?: string;
};

/*
 * ============================================================
 * EXECUTIVE REGISTRATION WIZARD
 * ============================================================
 */

export default function ExecutiveRegistrationWizard() {
  const router =
    useRouter();

  /*
   * ============================================================
   * MISSION ENGINE
   * ============================================================
   */

  const {
    step,
    totalSteps,
    mission,
    nextStep,
    previousStep,
  } = useMission();

  /*
   * ============================================================
   * REGISTRATION STATE
   * ============================================================
   */

  const [
    formData,
    setFormData,
  ] = useState<RegistrationData>({
    companyName: "",
    registrationNumber: "",
    tradingName: "",
    website: "",

    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",

    industry: "",
    employees: 0,

    phone: "",
    complianceOfficer: "",
    financeContact: "",
    address: "",
  });

  /*
   * ============================================================
   * LAUNCH STATE
   * ============================================================
   */

  const [
    launching,
    setLaunching,
  ] = useState(false);

  const [
    launchError,
    setLaunchError,
  ] = useState<string | null>(
    null
  );

  /*
   * ============================================================
   * TRUST ENGINE
   * ============================================================
   */

  useTrustRegistration({
    companyCompleted:
      formData.companyName
        .trim()
        .length > 0,

    directorsCompleted:
      step >= 3,

    governanceCompleted:
      step >= 4,

    complianceCompleted:
      step >= 5,

    documentsUploaded:
      step >= 5
        ? 5
        : 0,
  });

  /*
   * ============================================================
   * FINAL REGISTRATION VALIDATION
   * ============================================================
   */

  function validateRegistration():
    string | null {

    /*
     * Organisation
     */

    if (
      !formData.companyName.trim()
    ) {
      return "Please provide your registered company name.";
    }

    /*
     * Account owner
     */

    if (
      !formData.fullName.trim()
    ) {
      return "Please provide your full name.";
    }

    /*
     * Email
     */

    if (
      !formData.email.trim()
    ) {
      return "Please provide your email address.";
    }

    /*
     * Password
     */

    if (
      !formData.password
    ) {
      return "Please create your ComplianceOS password.";
    }

    if (
      formData.password.length < 8
    ) {
      return "Your password must contain at least 8 characters.";
    }

    /*
     * Password confirmation
     */

    if (
      !formData.confirmPassword
    ) {
      return "Please confirm your ComplianceOS password.";
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      return "Your passwords do not match.";
    }

    return null;
  }

  /*
   * ============================================================
   * LAUNCH COMPLIANCEOS
   * ============================================================
   *
   * The first six steps collect onboarding information.
   *
   * Step seven converts that onboarding session into the
   * durable ComplianceOS account.
   *
   * Server registration is responsible for creating:
   *
   * - Organization
   * - User
   * - OrganizationMember
   * - OWNER membership
   * - authenticated session cookie
   */

  async function launchComplianceOS() {
    if (launching) {
      return;
    }

    setLaunchError(
      null
    );

    /*
     * Validate everything before making
     * a database request.
     */

    const validationError =
      validateRegistration();

    if (validationError) {
      setLaunchError(
        validationError
      );

      return;
    }

    setLaunching(
      true
    );

    try {
      /*
       * Register the organisation and
       * primary account owner.
       */

      const response =
        await fetch(
          "/api/auth/register",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify({
                fullName:
                  formData.fullName
                    .trim(),

                email:
                  formData.email
                    .trim()
                    .toLowerCase(),

                password:
                  formData.password,

                companyName:
                  formData.companyName
                    .trim(),

                tradingName:
                  formData.tradingName
                    .trim(),

                registrationNumber:
                  formData.registrationNumber
                    .trim(),

                website:
                  formData.website
                    .trim(),

                industry:
                  formData.industry
                    .trim(),

                employees:
                  formData.employees,

                phone:
                  formData.phone?.trim() ||
                  "",

                complianceOfficer:
                  formData.complianceOfficer?.trim() ||
                  "",

                financeContact:
                  formData.financeContact?.trim() ||
                  "",

                address:
                  formData.address?.trim() ||
                  "",
              }),
          }
        );

      /*
       * Parse registration response.
       */

      let result:
        RegistrationResponse;

      try {
        result =
          await response.json() as
            RegistrationResponse;
      } catch {
        setLaunchError(
          "ComplianceOS received an invalid response from the registration service."
        );

        return;
      }

      /*
       * Registration failed.
       */

      if (
        !response.ok ||
        !result.success
      ) {
        setLaunchError(
          result.message ||
          "ComplianceOS could not complete registration."
        );

        return;
      }

      /*
       * ========================================================
       * REGISTRATION SUCCESS
       * ========================================================
       *
       * The server has now created the account and
       * authentication cookie.
       */

      router.push(
        "/workspace"
      );

      router.refresh();

    } catch (error) {
      console.error(
        "ComplianceOS launch failed:",
        error
      );

      setLaunchError(
        "ComplianceOS could not connect to the registration service. Please try again."
      );

    } finally {
      setLaunching(
        false
      );
    }
  }

  /*
   * ============================================================
   * NEXT BUTTON
   * ============================================================
   *
   * Steps 1–6:
   * advance the onboarding mission.
   *
   * Step 7:
   * create the actual ComplianceOS account.
   */

  function handleNext() {
    if (
      step === totalSteps
    ) {
      void launchComplianceOS();

      return;
    }

    nextStep();
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <ExecutiveWorkspace
      currentStep={
        step
      }

      totalSteps={
        totalSteps
      }

      title={
        mission.title
      }

      onPrevious={
        previousStep
      }

      onNext={
        handleNext
      }

      previousDisabled={
        step === 1 ||
        launching
      }

      nextDisabled={
        launching
      }

      nextLabel={
        step === totalSteps
          ? launching
            ? "Launching ComplianceOS..."
            : "Launch ComplianceOS"
          : "Continue Mission"
      }
    >

      {/* ======================================================
          LAUNCH ERROR
          ====================================================== */}

      {launchError && (

        <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-6">

          <p className="font-semibold text-red-900">
            Unable to launch ComplianceOS
          </p>

          <p className="mt-2 leading-7 text-red-700">
            {launchError}
          </p>

        </div>

      )}

      {/* ======================================================
          STEP 1 — ORGANISATION IDENTITY
          ====================================================== */}

      {step === 1 && (

        <OrganisationIdentity
          formData={
            formData
          }

          setFormData={
            setFormData
          }
        />

      )}

      {/* ======================================================
          STEP 2 — BUSINESS CONTACTS + ACCOUNT SECURITY
          ====================================================== */}

      {step === 2 && (

        <BusinessContacts
          formData={
            formData
          }

          setFormData={
            setFormData
          }
        />

      )}

      {/* ======================================================
          STEP 3 — GOVERNANCE
          ====================================================== */}

      {step === 3 && (

        <Governance
          formData={
            formData
          }

          setFormData={
            setFormData
          }
        />

      )}

      {/* ======================================================
          STEP 4 — COMPLIANCE
          ====================================================== */}

      {step === 4 && (

        <ComplianceCentre
          formData={
            formData
          }

          setFormData={
            setFormData
          }
        />

      )}

      {/* ======================================================
          STEP 5 — DOCUMENT VAULT
          ====================================================== */}

      {step === 5 && (

        <DocumentVault
          formData={
            formData
          }

          setFormData={
            setFormData
          }
        />

      )}

      {/* ======================================================
          STEP 6 — AI REVIEW
          ====================================================== */}

      {step === 6 && (

        <AIReview
          formData={
            formData
          }
        />

      )}

      {/* ======================================================
          STEP 7 — LAUNCH WORKSPACE
          ====================================================== */}

      {step === 7 && (

        <LaunchWorkspace
          formData={
            formData
          }
        />

      )}

    </ExecutiveWorkspace>
  );
}
