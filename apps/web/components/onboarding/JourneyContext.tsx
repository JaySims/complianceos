"use client";

import {
  createContext,
  useContext,
  useState,
} from "react";

type JourneyContextType = {
  currentStep: number;
  setCurrentStep: (step: number) => void;
};

const JourneyContext =
  createContext<JourneyContextType | null>(null);

export function JourneyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentStep, setCurrentStep] =
    useState(1);

  return (
    <JourneyContext.Provider
      value={{
        currentStep,
        setCurrentStep,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const context = useContext(JourneyContext);

  if (!context) {
    throw new Error(
      "useJourney must be used inside JourneyProvider"
    );
  }

  return context;
}
