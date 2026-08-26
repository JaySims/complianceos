"use client";

import { useEffect } from "react";
import { useTrust } from "@/contexts/TrustContext";

type RegistrationStatus = {
  companyCompleted: boolean;
  directorsCompleted: boolean;
  governanceCompleted: boolean;
  complianceCompleted: boolean;
  documentsUploaded: number;
};

export function useTrustRegistration(
  status: RegistrationStatus
) {
  const { updateFactor } = useTrust();

  useEffect(() => {
    updateFactor(
      "companyRegistered",
      status.companyCompleted
    );
  }, [status.companyCompleted, updateFactor]);

  useEffect(() => {
    updateFactor(
      "directorsVerified",
      status.directorsCompleted
    );
  }, [status.directorsCompleted, updateFactor]);

  useEffect(() => {
    updateFactor(
      "governanceCompleted",
      status.governanceCompleted
    );
  }, [status.governanceCompleted, updateFactor]);

  useEffect(() => {
    updateFactor(
      "complianceCompleted",
      status.complianceCompleted
    );
  }, [status.complianceCompleted, updateFactor]);

  useEffect(() => {
    updateFactor(
      "documentsUploaded",
      status.documentsUploaded
    );
  }, [status.documentsUploaded, updateFactor]);
}
