"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  buildExecutiveBrainState,
  type ExecutiveBrainState,
} from "@/lib/brain/executiveBrainState";

import {
  DEFAULT_EXECUTIVE_ORGANISATION_STATE,
  loadExecutiveOrganisationState,
  type ExecutiveOrganisationState,
} from "@/lib/organisation/executiveOrganisationState";

type ExecutiveStateContextType = {
  brain: ExecutiveBrainState;

  organisationState:
    ExecutiveOrganisationState;

  refreshExecutiveState: () => void;
};

const ExecutiveStateContext =
  createContext<
    ExecutiveStateContextType | undefined
  >(undefined);

type ExecutiveStateProviderProps = {
  children: ReactNode;
};

/*
 * Calculate Digital Trust™
 *
 * This replaces the old hardcoded score.
 *
 * The score is currently derived from
 * readiness completion. Later we can plug
 * in the full Trust Engine without changing
 * the UI architecture.
 */

function calculateTrustScore(
  state: ExecutiveOrganisationState
): number {
  let score = 40;

  if (
    state.governanceComplete
  ) {
    score += 20;
  }

  if (
    state.complianceComplete
  ) {
    score += 20;
  }

  if (
    state.fundingReady
  ) {
    score += 10;
  }

  if (
    state.procurementReady
  ) {
    score += 10;
  }

  return Math.min(
    score,
    100
  );
}

export function ExecutiveStateProvider({
  children,
}: ExecutiveStateProviderProps) {
  const [
    organisationState,
    setOrganisationState,
  ] =
    useState<ExecutiveOrganisationState>(
      DEFAULT_EXECUTIVE_ORGANISATION_STATE
    );

  /*
   * Load persisted organisation readiness
   * after hydration.
   */

  useEffect(() => {
    const savedState =
      loadExecutiveOrganisationState();

    setOrganisationState(
      savedState
    );
  }, []);

  /*
   * Refresh state after workflow changes.
   */

  function refreshExecutiveState() {
    const savedState =
      loadExecutiveOrganisationState();

    setOrganisationState(
      savedState
    );
  }

  /*
   * Live Digital Trust™
   */

  const trustScore =
    useMemo(
      () =>
        calculateTrustScore(
          organisationState
        ),
      [
        organisationState.governanceComplete,
        organisationState.complianceComplete,
        organisationState.fundingReady,
        organisationState.procurementReady,
      ]
    );

  /*
   * Rebuild Executive Brain
   */

  const brain =
    useMemo(
      () =>
        buildExecutiveBrainState({
          trustScore,

          governanceComplete:
            organisationState.governanceComplete,

          complianceComplete:
            organisationState.complianceComplete,

          fundingReady:
            organisationState.fundingReady,

          procurementReady:
            organisationState.procurementReady,
        }),
      [
        trustScore,
        organisationState.governanceComplete,
        organisationState.complianceComplete,
        organisationState.fundingReady,
        organisationState.procurementReady,
      ]
    );

  const value =
    useMemo(
      () => ({
        brain,
        organisationState,
        refreshExecutiveState,
      }),
      [
        brain,
        organisationState,
      ]
    );

  return (
    <ExecutiveStateContext.Provider
      value={value}
    >
      {children}
    </ExecutiveStateContext.Provider>
  );
}

export function useExecutiveState() {
  const context =
    useContext(
      ExecutiveStateContext
    );

  if (!context) {
    throw new Error(
      "useExecutiveState must be used inside ExecutiveStateProvider"
    );
  }

  return context;
}
