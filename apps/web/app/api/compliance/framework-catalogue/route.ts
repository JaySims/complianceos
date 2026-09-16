import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  resolveOrganizationAccess,
  type OrganizationAccessFailureReason,
} from "@/lib/auth/organizationAccess";

import {
  getComplianceFrameworkCatalogue,
} from "@/lib/compliance/complianceFrameworkCatalogueService";

/*
 * ============================================================
 * COMPLIANCEOS — COMPLIANCE FRAMEWORK CATALOGUE API
 * ============================================================
 *
 * GET
 * /api/compliance/framework-catalogue
 *
 * SECURITY
 *
 * Access requires a PostgreSQL-backed authenticated
 * OrganizationMember context.
 *
 * CATALOGUE SEMANTICS
 *
 * The catalogue is global ComplianceOS reference data.
 *
 * Framework catalogue existence does NOT establish:
 *
 * - organisation applicability;
 * - organisation adoption;
 * - Assessment existence;
 * - Current Assessment Authority;
 * - compliance status;
 * - compliance score.
 *
 * Organisation authoritative framework membership remains
 * exclusively represented by CurrentAssessmentAuthority.
 *
 * This route performs no persistence, authority mutation,
 * applicability inference, or catalogue provisioning.
 *
 * An empty catalogue is a valid successful response.
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
    await getComplianceFrameworkCatalogue();

  if (!result.success) {
    return NextResponse.json(
      result,
      {
        status: 409,
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
