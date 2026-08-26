"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";

import {
  calculateTrustScore,
  TrustFactors,
} from "@/lib/trust/trustEngine";

type TrustContextType = {
  factors: TrustFactors;

  updateFactor: (
    key: keyof TrustFactors,
    value: boolean | number
  ) => void;

  score: number;

  grade: string;

  level: string;
};

const TrustContext =
  createContext<TrustContextType | null>(null);

export function TrustProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [factors, setFactors] =
    useState<TrustFactors>({
      companyRegistered: false,
      directorsVerified: false,
      governanceCompleted: false,
      complianceCompleted: false,
      documentsUploaded: 0,
      fundingReady: false,
      procurementReady: false,
      aiValidated: false,
    });

  const trust = useMemo(
    () => calculateTrustScore(factors),
    [factors]
  );

  const updateFactor = useCallback(
    (
      key: keyof TrustFactors,
      value: boolean | number
    ) => {

      setFactors((prev) => {

        if (prev[key] === value) {
          return prev;
        }

        return {
          ...prev,
          [key]: value,
        };

      });

    },
    []
  );

  return (
    <TrustContext.Provider
      value={{
        factors,
        updateFactor,
        score: trust.score,
        grade: trust.grade,
        level: trust.level,
      }}
    >
      {children}
    </TrustContext.Provider>
  );
}

export function useTrust() {

  const context = useContext(TrustContext);

  if (!context) {
    throw new Error(
      "useTrust must be used inside TrustProvider"
    );
  }

  return context;
}
