import { prisma } from "@/lib/prisma";

import {
  buildComplianceFrameworkPortfolio,
  type ComplianceFrameworkPortfolioEntry,
  type ComplianceFrameworkPortfolioAuthorityInput,
} from "@/lib/compliance/organizationComplianceFrameworkPortfolioPolicy";

/*
 * ============================================================
 * ORGANISATION COMPLIANCE FRAMEWORK PORTFOLIO SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Read the authenticated Organisation's authoritative compliance
 * framework portfolio.
 *
 * AUTHORITY RULE
 *
 * Portfolio membership comes ONLY from CurrentAssessmentAuthority.
 *
 * This service never infers portfolio membership from:
 *
 * - Framework catalogue existence;
 * - Assessment existence;
 * - Assessment creation time;
 * - Assessment update time;
 * - Assessment lifecycle status;
 * - Assessment score.
 *
 * Frameworks without explicit CurrentAssessmentAuthority for the
 * requested Organisation are not returned.
 *
 * AUTHORIZATION BOUNDARY
 *
 * organizationId must already originate from the ComplianceOS
 * organisation authorization boundary.
 *
 * READ-ONLY BOUNDARY
 *
 * This service performs no persistence or authority mutation.
 * ============================================================
 */

export type OrganizationComplianceFrameworkPortfolioFailureReason =
  | "ORGANIZATION_NOT_FOUND"
  | "CURRENT_AUTHORITY_INTEGRITY_VIOLATION"
  | "FRAMEWORK_PORTFOLIO_READ_FAILED";

export type OrganizationComplianceFrameworkPortfolioResult =
  | {
      success: true;
      organizationId: string;
      entries: ComplianceFrameworkPortfolioEntry[];
    }
  | {
      success: false;
      reason: OrganizationComplianceFrameworkPortfolioFailureReason;
      message: string;
    };

export async function getOrganizationComplianceFrameworkPortfolio(
  organizationId: string
): Promise<OrganizationComplianceFrameworkPortfolioResult> {
  try {
    /*
     * ----------------------------------------------------------
     * 1. Prove Organisation exists.
     * ----------------------------------------------------------
     */

    const organization =
      await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },

        select: {
          id: true,
        },
      });

    if (!organization) {
      return {
        success: false,
        reason: "ORGANIZATION_NOT_FOUND",
        message:
          "Organization not found.",
      };
    }

    /*
     * ----------------------------------------------------------
     * 2. Load ONLY explicit current assessment authorities.
     *
     * Assessment and Framework identities are loaded through the
     * authority row so the pure policy can independently prove
     * tenant and framework integrity.
     * ----------------------------------------------------------
     */

    const authorities =
      await prisma.currentAssessmentAuthority.findMany({
        where: {
          organizationId,
        },

        orderBy: [
          {
            frameworkId: "asc",
          },
          {
            id: "asc",
          },
        ],

        select: {
          id: true,
          organizationId: true,
          frameworkId: true,
          assessmentId: true,

          assessment: {
            select: {
              id: true,
              organizationId: true,
              frameworkId: true,
            },
          },

          framework: {
            select: {
              id: true,
              name: true,
              version: true,
              description: true,
            },
          },
        },
      });

    /*
     * ----------------------------------------------------------
     * 3. Normalize database records into pure policy inputs.
     * ----------------------------------------------------------
     */

    const inputs:
      ComplianceFrameworkPortfolioAuthorityInput[] =
      authorities.map((authority) => ({
        authorityId:
          authority.id,

        authorityOrganizationId:
          authority.organizationId,

        authorityFrameworkId:
          authority.frameworkId,

        authorityAssessmentId:
          authority.assessmentId,

        assessmentId:
          authority.assessment.id,

        assessmentOrganizationId:
          authority.assessment.organizationId,

        assessmentFrameworkId:
          authority.assessment.frameworkId,

        frameworkId:
          authority.framework.id,

        frameworkName:
          authority.framework.name,

        frameworkVersion:
          authority.framework.version,

        frameworkDescription:
          authority.framework.description,
      }));

    /*
     * ----------------------------------------------------------
     * 4. Apply deterministic authority/integrity policy.
     * ----------------------------------------------------------
     */

    const policy =
      buildComplianceFrameworkPortfolio(
        organizationId,
        inputs
      );

    if (!policy.success) {
      return policy;
    }

    return {
      success: true,
      organizationId,
      entries:
        policy.entries,
    };
  } catch {
    return {
      success: false,
      reason:
        "FRAMEWORK_PORTFOLIO_READ_FAILED",
      message:
        "Unable to read the organisation compliance framework portfolio.",
    };
  }
}
