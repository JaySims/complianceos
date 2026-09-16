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

import {
  establishOrganizationFramework,
} from "@/lib/compliance/organizationFrameworkEstablishmentService";

import {
  canEstablishOrganizationFrameworkFromHttp,
  invalidOrganizationFrameworkEstablishmentRequest,
  organizationFrameworkEstablishmentAccessFailure,
  organizationFrameworkEstablishmentForbidden,
  organizationFrameworkEstablishmentHttpResponse,
  validateOrganizationFrameworkEstablishmentHttpInput,
} from "@/lib/compliance/organizationFrameworkEstablishmentHttp";


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
 * GET performs no persistence and no authority mutation.
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


/*
 * ============================================================
 * GET /api/compliance/frameworks
 * ============================================================
 *
 * Returns the authenticated organization's authoritative
 * compliance framework portfolio.
 *
 * Portfolio membership comes only from explicit
 * CurrentAssessmentAuthority.
 * ============================================================
 */

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


/*
 * ============================================================
 * POST /api/compliance/frameworks
 * ============================================================
 *
 * Establishes one compliance framework inside the authenticated
 * organization's authoritative compliance portfolio.
 *
 * SECURITY
 *
 * - organizationId comes only from OrganizationAccessContext;
 * - userId comes only from OrganizationAccessContext;
 * - browser supplies only frameworkId and optional title;
 * - OWNER or ADMIN management authority is required;
 * - unsupported request fields are rejected.
 *
 * PERSISTENCE
 *
 * The establishment service owns the SERIALIZABLE transaction
 * that creates both the DRAFT Assessment and matching
 * CurrentAssessmentAuthority.
 * ============================================================
 */

export async function POST(
  req: NextRequest
) {
  const access =
    await resolveOrganizationAccess(
      req
    );

  if (!access.authorized) {
    return organizationFrameworkEstablishmentAccessFailure(
      access.reason
    );
  }

  if (
    !canEstablishOrganizationFrameworkFromHttp(
      access.context
    )
  ) {
    return organizationFrameworkEstablishmentForbidden();
  }

  let body: unknown;

  try {
    body =
      await req.json();
  } catch {
    return invalidOrganizationFrameworkEstablishmentRequest();
  }

  const validation =
    validateOrganizationFrameworkEstablishmentHttpInput(
      body
    );

  if (!validation.success) {
    return invalidOrganizationFrameworkEstablishmentRequest(
      validation.message
    );
  }

  const result =
    await establishOrganizationFramework({
      organizationId:
        access.context.organization.id,

      frameworkId:
        validation.value.frameworkId,

      userId:
        access.context.user.id,

      title:
        validation.value.title ??
        "Compliance Assessment",
    });

  return organizationFrameworkEstablishmentHttpResponse(
    result
  );
}
