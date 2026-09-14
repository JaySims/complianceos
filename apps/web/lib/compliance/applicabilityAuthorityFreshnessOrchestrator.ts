import {
  establishInitialApplicabilityDefinitionAuthority,
  supersedeApplicabilityDefinitionAuthority,
  type ApplicabilityDefinitionAuthorityResult,
  type EstablishInitialApplicabilityDefinitionAuthorityInput,
  type SupersedeApplicabilityDefinitionAuthorityInput,
} from "./applicabilityDefinitionAuthorityService";

import {
  establishInitialApplicabilityResolutionAuthority,
  supersedeApplicabilityResolutionAuthority,
  type ApplicabilityResolutionAuthorityResult,
  type EstablishInitialApplicabilityResolutionAuthorityInput,
  type SupersedeApplicabilityResolutionAuthorityInput,
} from "./applicabilityResolutionAuthorityService";

import {
  refreshAfterDefinitionAuthorityCommit,
  refreshAfterResolutionAuthorityCommit,
  type ApplicabilityFreshnessResult,
} from "./applicabilityComplianceFreshnessService";

/**
 * Authority mutation and compliance freshness are deliberately separate
 * transaction boundaries.
 *
 * If authority mutation fails, freshness MUST NOT run.
 *
 * If authority mutation succeeds, the authority transaction is already
 * committed before freshness begins. A later freshness failure therefore
 * MUST NOT be represented as an authority rollback.
 */

export type ApplicabilityDefinitionAuthorityFreshnessResult =
  | {
      success: false;
      authorityCommitted: false;
      authorityResult: Extract<
        ApplicabilityDefinitionAuthorityResult,
        { success: false }
      >;
      freshnessResult: null;
    }
  | {
      success: true;
      authorityCommitted: true;
      authorityResult: Extract<
        ApplicabilityDefinitionAuthorityResult,
        { success: true }
      >;
      freshnessResult: Extract<
        ApplicabilityFreshnessResult,
        { success: true }
      >;
    }
  | {
      success: false;
      authorityCommitted: true;
      authorityResult: Extract<
        ApplicabilityDefinitionAuthorityResult,
        { success: true }
      >;
      freshnessResult: Extract<
        ApplicabilityFreshnessResult,
        { success: false }
      >;
    };

export type ApplicabilityResolutionAuthorityFreshnessResult =
  | {
      success: false;
      authorityCommitted: false;
      authorityResult: Extract<
        ApplicabilityResolutionAuthorityResult,
        { success: false }
      >;
      freshnessResult: null;
    }
  | {
      success: true;
      authorityCommitted: true;
      authorityResult: Extract<
        ApplicabilityResolutionAuthorityResult,
        { success: true }
      >;
      freshnessResult: Extract<
        ApplicabilityFreshnessResult,
        { success: true }
      >;
    }
  | {
      success: false;
      authorityCommitted: true;
      authorityResult: Extract<
        ApplicabilityResolutionAuthorityResult,
        { success: true }
      >;
      freshnessResult: Extract<
        ApplicabilityFreshnessResult,
        { success: false }
      >;
    };

async function finalizeDefinitionAuthorityFreshness(
  authorityResult: ApplicabilityDefinitionAuthorityResult
): Promise<ApplicabilityDefinitionAuthorityFreshnessResult> {
  if (!authorityResult.success) {
    return {
      success: false,
      authorityCommitted: false,
      authorityResult,
      freshnessResult: null,
    };
  }

  const freshnessResult =
    await refreshAfterDefinitionAuthorityCommit(
      authorityResult.authority.requirementId
    );

  if (!freshnessResult.success) {
    return {
      success: false,
      authorityCommitted: true,
      authorityResult,
      freshnessResult,
    };
  }

  return {
    success: true,
    authorityCommitted: true,
    authorityResult,
    freshnessResult,
  };
}

async function finalizeResolutionAuthorityFreshness(
  organizationId: string,
  authorityResult: ApplicabilityResolutionAuthorityResult
): Promise<ApplicabilityResolutionAuthorityFreshnessResult> {
  if (!authorityResult.success) {
    return {
      success: false,
      authorityCommitted: false,
      authorityResult,
      freshnessResult: null,
    };
  }

  const freshnessResult =
    await refreshAfterResolutionAuthorityCommit(
      organizationId,
      authorityResult.authority.applicabilityId
    );

  if (!freshnessResult.success) {
    return {
      success: false,
      authorityCommitted: true,
      authorityResult,
      freshnessResult,
    };
  }

  return {
    success: true,
    authorityCommitted: true,
    authorityResult,
    freshnessResult,
  };
}

export async function establishInitialApplicabilityDefinitionAuthorityWithFreshness(
  input: EstablishInitialApplicabilityDefinitionAuthorityInput
): Promise<ApplicabilityDefinitionAuthorityFreshnessResult> {
  const authorityResult =
    await establishInitialApplicabilityDefinitionAuthority(
      input
    );

  return finalizeDefinitionAuthorityFreshness(
    authorityResult
  );
}

export async function supersedeApplicabilityDefinitionAuthorityWithFreshness(
  input: SupersedeApplicabilityDefinitionAuthorityInput
): Promise<ApplicabilityDefinitionAuthorityFreshnessResult> {
  const authorityResult =
    await supersedeApplicabilityDefinitionAuthority(
      input
    );

  return finalizeDefinitionAuthorityFreshness(
    authorityResult
  );
}

export async function establishInitialApplicabilityResolutionAuthorityWithFreshness(
  input: EstablishInitialApplicabilityResolutionAuthorityInput
): Promise<ApplicabilityResolutionAuthorityFreshnessResult> {
  const authorityResult =
    await establishInitialApplicabilityResolutionAuthority(
      input
    );

  return finalizeResolutionAuthorityFreshness(
    input.organizationId,
    authorityResult
  );
}

export async function supersedeApplicabilityResolutionAuthorityWithFreshness(
  input: SupersedeApplicabilityResolutionAuthorityInput
): Promise<ApplicabilityResolutionAuthorityFreshnessResult> {
  const authorityResult =
    await supersedeApplicabilityResolutionAuthority(
      input
    );

  return finalizeResolutionAuthorityFreshness(
    input.organizationId,
    authorityResult
  );
}
