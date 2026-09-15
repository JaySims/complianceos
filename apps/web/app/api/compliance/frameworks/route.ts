import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  resolveOrganizationAccess,
  type OrganizationAccessFailureReason,
} from "@/lib/auth/organizationAccess";

import {
  getOrganizationComplianceFrameworkPortfolio,
  type OrganizationComplianceFrameworkPortfolioFailureReason,
} from "@/lib/compliance/organizationComplianceFrameworkPortfolioService";

/*
 * ============================================================
 * COMPLIANCEOS — AUTHORITATIVE FRAMEWORK PORTFOLIO API
 * ============================================================
 *
 * GET
 * /api/compliance/frameworks
 *
 * SECURITY
 *
 * Organization authority comes exclusively from the
 * PostgreSQL-backed authenticated OrganizationMember context.
 *
 * The browser never supplies organization authority.
 *
 * PORTFOLIO AUTHORITY
 *
 * Framework portfolio membership is delegated to the portfolio
 * read model, which uses ONLY explicit CurrentAssessmentAuthority.
 *
 * This HTTP route never infers portfolio membership from:
 *
 * - Framework catalogue existence;
 * - Assessment existence;
 * - Assessment creation or update time;
 * - Assessment lifecycle status;
 * - Assessment score.
 *
 * An Organization with no explicit current authorities has a
 * valid empty authoritative portfolio.
 *
 * This route performs no persistence and no authority mutation.
 * ============================================================
 */

function organizationAccessFailure(
  reason: OrganizationAccessFailureReason
) {
  const unauthenticated =
    reason === "MISSING_TOKEN" ||
    reason === "INVALID_TOKEN" ||
    reason === "INVALID_IDENTITY" ||
    reason === "USER_NOT_FOUND";

  return NextResponse.json(
    {
      success: false,
      reason,
      message: unauthenticated
        ? "Unauthorized"
        : "Organisation access denied.",
    },
    {
      status: unauthenticated
        ? 401
        : 403,
    }
  );
}

function portfolioFailureStatus(
  reason: OrganizationComplianceFrameworkPortfolioFailureReason
): number {
  switch (reason) {
    case "ORGANIZATION_NOT_FOUND":
      return 404;

    case "CURRENT_AUTHORITY_INTEGRITY_VIOLATION":
    case "FRAMEWORK_PORTFOLIO_READ_FAILED":
      return 409;

    default:
      return 409;
  }
}

export async function GET(
  req: NextRequest
) {
  const access =
    await resolveOrganizationAccess(
      req
    );

  if (!access.authorized) {
    return organizationAccessFailure(
      access.reason
    );
  }

  const result =
    await getOrganizationComplianceFrameworkPortfolio(
      access.context.organization.id
    );

  if (!result.success) {
    return NextResponse.json(
      result,
      {
        status:
          portfolioFailureStatus(
            result.reason
          ),
      }
    );
  }

  return NextResponse.json(
    result,
    {
      status: 200,
    }
  );
}
