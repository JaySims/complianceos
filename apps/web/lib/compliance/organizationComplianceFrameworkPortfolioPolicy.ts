/*
 * ============================================================
 * ORGANISATION COMPLIANCE FRAMEWORK PORTFOLIO POLICY
 * ============================================================
 *
 * Pure policy for converting explicit CurrentAssessmentAuthority
 * records into product-facing organisation framework portfolio
 * entries.
 *
 * Authority doctrine:
 *
 * - Framework existence does not imply organisation applicability.
 * - Assessment existence does not imply current authority.
 * - Assessment recency does not imply current authority.
 * - Assessment lifecycle status does not imply current authority.
 * - Assessment score does not imply current authority.
 * - Only explicit CurrentAssessmentAuthority establishes membership
 *   in this authoritative portfolio.
 * ============================================================
 */

export type ComplianceFrameworkPortfolioAuthorityInput = {
  authorityId: string;
  authorityOrganizationId: string;
  authorityFrameworkId: string;
  authorityAssessmentId: string;

  assessmentId: string;
  assessmentOrganizationId: string;
  assessmentFrameworkId: string;

  frameworkId: string;
  frameworkName: string;
  frameworkVersion: string | null;
  frameworkDescription: string | null;
};

export type ComplianceFrameworkPortfolioEntry = {
  authorityId: string;
  organizationId: string;

  framework: {
    id: string;
    name: string;
    version: string | null;
    description: string | null;
  };

  assessmentId: string;
};

export type ComplianceFrameworkPortfolioPolicyResult =
  | {
      success: true;
      entries: ComplianceFrameworkPortfolioEntry[];
    }
  | {
      success: false;
      reason: "CURRENT_AUTHORITY_INTEGRITY_VIOLATION";
      message: string;
    };

export function buildComplianceFrameworkPortfolio(
  organizationId: string,
  inputs: ComplianceFrameworkPortfolioAuthorityInput[]
): ComplianceFrameworkPortfolioPolicyResult {
  const entries: ComplianceFrameworkPortfolioEntry[] = [];

  const seenFrameworkIds =
    new Set<string>();

  const seenAssessmentIds =
    new Set<string>();

  for (const input of inputs) {
    if (
      input.authorityOrganizationId !==
      organizationId
    ) {
      return {
        success: false,
        reason:
          "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
        message:
          "Current assessment authority belongs to a different organisation.",
      };
    }

    if (
      input.authorityAssessmentId !==
      input.assessmentId
    ) {
      return {
        success: false,
        reason:
          "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
        message:
          "Current assessment authority references a different assessment.",
      };
    }

    if (
      input.assessmentOrganizationId !==
      organizationId
    ) {
      return {
        success: false,
        reason:
          "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
        message:
          "Authoritative assessment belongs to a different organisation.",
      };
    }

    if (
      input.authorityFrameworkId !==
        input.assessmentFrameworkId ||
      input.authorityFrameworkId !==
        input.frameworkId
    ) {
      return {
        success: false,
        reason:
          "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
        message:
          "Current assessment authority, assessment, and framework do not share the same framework identity.",
      };
    }

    if (
      seenFrameworkIds.has(
        input.frameworkId
      )
    ) {
      return {
        success: false,
        reason:
          "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
        message:
          "Multiple current assessment authorities exist for the same organisation and framework.",
      };
    }

    if (
      seenAssessmentIds.has(
        input.assessmentId
      )
    ) {
      return {
        success: false,
        reason:
          "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
        message:
          "One assessment is referenced by multiple current framework authorities.",
      };
    }

    seenFrameworkIds.add(
      input.frameworkId
    );

    seenAssessmentIds.add(
      input.assessmentId
    );

    entries.push({
      authorityId:
        input.authorityId,

      organizationId,

      framework: {
        id:
          input.frameworkId,

        name:
          input.frameworkName,

        version:
          input.frameworkVersion,

        description:
          input.frameworkDescription,
      },

      assessmentId:
        input.assessmentId,
    });
  }

  entries.sort((left, right) => {
    const nameComparison =
      left.framework.name.localeCompare(
        right.framework.name
      );

    if (nameComparison !== 0) {
      return nameComparison;
    }

    return left.framework.id.localeCompare(
      right.framework.id
    );
  });

  return {
    success: true,
    entries,
  };
}
