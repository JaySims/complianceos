import {
  FRAMEWORK_CATALOGUE_MANIFEST_ALGORITHM_VERSION,
  buildFrameworkCatalogueManifestFingerprint,
  hashCanonicalManifest,
  validateFrameworkCatalogueGovernedState,
  type FrameworkCatalogueGovernedState,
} from "@/lib/compliance/frameworkCatalogueManifest";

export type FrameworkCatalogueApprovalEvidence = {
  frameworkId: string;
  contentManifest: string;
  contentHash: string;
  manifestAlgorithmVersion: number;
};

export type FrameworkCataloguePublicationIntegrityFailureReason =
  | "APPROVAL_FRAMEWORK_MISMATCH"
  | "UNSUPPORTED_MANIFEST_ALGORITHM_VERSION"
  | "APPROVAL_MANIFEST_HASH_MISMATCH"
  | "LIVE_CATALOGUE_FINGERPRINT_MISMATCH"
  | "INVALID_GOVERNED_CATALOGUE_STATE";

export type FrameworkCataloguePublicationIntegrityResult =
  | { success: true }
  | {
      success: false;
      reason: FrameworkCataloguePublicationIntegrityFailureReason;
      message: string;
    };

export function validateFrameworkCataloguePublicationIntegrity(input: {
  governedState: FrameworkCatalogueGovernedState;
  approval: FrameworkCatalogueApprovalEvidence;
}): FrameworkCataloguePublicationIntegrityResult {
  if (input.approval.frameworkId !== input.governedState.framework.id) {
    return {
      success: false,
      reason: "APPROVAL_FRAMEWORK_MISMATCH",
      message: "Framework catalogue approval does not belong to the live framework.",
    };
  }

  if (
    input.approval.manifestAlgorithmVersion !==
    FRAMEWORK_CATALOGUE_MANIFEST_ALGORITHM_VERSION
  ) {
    return {
      success: false,
      reason: "UNSUPPORTED_MANIFEST_ALGORITHM_VERSION",
      message: "Framework catalogue approval uses an unsupported manifest algorithm version.",
    };
  }

  if (
    hashCanonicalManifest(input.approval.contentManifest) !==
    input.approval.contentHash
  ) {
    return {
      success: false,
      reason: "APPROVAL_MANIFEST_HASH_MISMATCH",
      message: "Stored framework catalogue approval manifest does not match its recorded fingerprint.",
    };
  }

  try {
    validateFrameworkCatalogueGovernedState(input.governedState);
  } catch {
    return {
      success: false,
      reason: "INVALID_GOVERNED_CATALOGUE_STATE",
      message: "Live framework catalogue state fails structural eligibility validation.",
    };
  }

  const liveFingerprint =
    buildFrameworkCatalogueManifestFingerprint(input.governedState);

  if (liveFingerprint.contentHash !== input.approval.contentHash) {
    return {
      success: false,
      reason: "LIVE_CATALOGUE_FINGERPRINT_MISMATCH",
      message: "Live framework catalogue content differs from the approved catalogue content.",
    };
  }

  return { success: true };
}
