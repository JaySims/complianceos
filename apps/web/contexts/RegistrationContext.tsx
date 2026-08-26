"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

export type RegistrationData = {
  companyName: string;
  registrationNumber: string;
  tradingName: string;
  website: string;
  industry: string;
  employees: string;

  contactName: string;
  contactEmail: string;
  contactPhone: string;

  directors: any[];

  compliance: {
    popia: boolean;
    kingIV: boolean;
    iso27001: boolean;
  };

  documents: File[];
};

type RegistrationContextType = {
  data: RegistrationData;

  updateData: (values: Partial<RegistrationData>) => void;

  reset: () => void;
};

const initialData: RegistrationData = {
  companyName: "",
  registrationNumber: "",
  tradingName: "",
  website: "",
  industry: "",
  employees: "",

  contactName: "",
  contactEmail: "",
  contactPhone: "",

  directors: [],

  compliance: {
    popia: false,
    kingIV: false,
    iso27001: false,
  },

  documents: [],
};

const RegistrationContext =
  createContext<RegistrationContextType | null>(null);

export function RegistrationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [data, setData] =
    useState<RegistrationData>(initialData);

  function updateData(values: Partial<RegistrationData>) {
    setData((previous) => ({
      ...previous,
      ...values,
    }));
  }

  function reset() {
    setData(initialData);
  }

  return (
    <RegistrationContext.Provider
      value={{
        data,
        updateData,
        reset,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const context = useContext(RegistrationContext);

  if (!context) {
    throw new Error(
      "useRegistration must be used inside RegistrationProvider"
    );
  }

  return context;
}
