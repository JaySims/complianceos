export type ExecutiveOrganisationState = {
  governanceComplete: boolean;
  complianceComplete: boolean;
  fundingReady: boolean;
  procurementReady: boolean;
  updatedAt: string;
};

const STORAGE_KEY =
  "complianceos.executive.organisation-state";

export const DEFAULT_EXECUTIVE_ORGANISATION_STATE:
  ExecutiveOrganisationState = {
    governanceComplete: false,
    complianceComplete: false,
    fundingReady: false,
    procurementReady: false,
    updatedAt: new Date(0).toISOString(),
  };

/*
 * Load organisation readiness
 */

export function loadExecutiveOrganisationState():
  ExecutiveOrganisationState {
  if (typeof window === "undefined") {
    return DEFAULT_EXECUTIVE_ORGANISATION_STATE;
  }

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    return DEFAULT_EXECUTIVE_ORGANISATION_STATE;
  }

  try {
    const parsed =
      JSON.parse(raw) as
        Partial<ExecutiveOrganisationState>;

    return {
      governanceComplete:
        parsed.governanceComplete ??
        false,

      complianceComplete:
        parsed.complianceComplete ??
        false,

      fundingReady:
        parsed.fundingReady ??
        false,

      procurementReady:
        parsed.procurementReady ??
        false,

      updatedAt:
        parsed.updatedAt ??
        new Date().toISOString(),
    };
  } catch {
    return DEFAULT_EXECUTIVE_ORGANISATION_STATE;
  }
}

/*
 * Save organisation state
 */

export function saveExecutiveOrganisationState(
  state: ExecutiveOrganisationState
): ExecutiveOrganisationState {
  const updatedState: ExecutiveOrganisationState = {
    ...state,
    updatedAt:
      new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        updatedState
      )
    );
  }

  return updatedState;
}

/*
 * Update organisation state
 */

export function updateExecutiveOrganisationState(
  updates: Partial<
    Omit<
      ExecutiveOrganisationState,
      "updatedAt"
    >
  >
): ExecutiveOrganisationState {
  const current =
    loadExecutiveOrganisationState();

  return saveExecutiveOrganisationState({
    ...current,
    ...updates,
    updatedAt:
      new Date().toISOString(),
  });
}

/*
 * Governance
 */

export function markGovernanceComplete():
  ExecutiveOrganisationState {
  return updateExecutiveOrganisationState({
    governanceComplete: true,
  });
}

/*
 * Compliance
 */

export function markComplianceComplete():
  ExecutiveOrganisationState {
  return updateExecutiveOrganisationState({
    complianceComplete: true,
  });
}

/*
 * Funding
 */

export function markFundingReady():
  ExecutiveOrganisationState {
  return updateExecutiveOrganisationState({
    fundingReady: true,
  });
}

/*
 * Procurement
 */

export function markProcurementReady():
  ExecutiveOrganisationState {
  return updateExecutiveOrganisationState({
    procurementReady: true,
  });
}

/*
 * Reset organisation readiness
 */

export function resetExecutiveOrganisationState():
  ExecutiveOrganisationState {
  if (typeof window !== "undefined") {
    localStorage.removeItem(
      STORAGE_KEY
    );
  }

  return {
    ...DEFAULT_EXECUTIVE_ORGANISATION_STATE,
  };
}
