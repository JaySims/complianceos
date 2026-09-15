import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  resolveOrganizationAccess,
  type OrganizationAccessFailureReason,
} from "@/lib/auth/organizationAccess";

import {
  getCurrentAssessmentComplianceRead,
  type AssessmentComplianceReadFailureReason,
} from "@/lib/compliance/assessmentComplianceReadService";

/*
 * ============================================================
 * COMPLIANCEOS — AUTHORITATIVE COMPLIANCE ASSESSMENT API
 * ============================================================
 *
 * GET
 * /api/compliance/assessment?frameworkId=<frameworkId>
 *
 * SECURITY
 *
 * Organization authority comes exclusively from the
 * PostgreSQL-backed authenticated OrganizationMember context.
 *
 * The browser may identify the Framework it wants to inspect,
 * but it never supplies organization authority.
 *
 * READ AUTHORITY
 *
 * Current Assessment selection is delegated to the compliance
 * read model, which resolves explicit CurrentAssessmentAuthority.
 *
 * This HTTP route never selects:
 *
 * - the latest Assessment;
 * - the newest Assessment;
 * - the highest-scoring Assessment;
 * - an Assessment based on lifecycle status.
 *
 * PRODUCT SEMANTICS
 *
 * Compliance Score and Applicability Coverage remain distinct.
 *
 * Mutable authoritative Assessments may expose live score and
 * live Applicability Coverage.
 *
 * COMPLETED authoritative Assessments expose persisted historical
 * score and explicitly report historical coverage unavailable.
 *
 * This route performs no compliance persistence and no authority
 * mutation.
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

function invalidRequest(
  message: string
) {
  return NextResponse.json(
    {
      success: false,
      reason: "INVALID_REQUEST",
      message,
    },
    {
      status: 400,
    }
  );
}

function complianceReadFailureStatus(
  reason: AssessmentComplianceReadFailureReason
): number {
  switch (reason) {
    case "CURRENT_AUTHORITY_NOT_FOUND":
    case "ASSESSMENT_NOT_FOUND":
      return 404;

    case "ASSESSMENT_ACCESS_DENIED":
      return 403;

    case "CURRENT_AUTHORITY_INTEGRITY_VIOLATION":
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

  const frameworkId =
    req.nextUrl.searchParams.get(
      "frameworkId"
    );

  if (
    typeof frameworkId !== "string" ||
    frameworkId.trim().length === 0
  ) {
    return invalidRequest(
      "frameworkId is required."
    );
  }

  const result =
    await getCurrentAssessmentComplianceRead(
      access.context.organization.id,
      frameworkId.trim()
    );

  if (!result.success) {
    return NextResponse.json(
      result,
      {
        status:
          complianceReadFailureStatus(
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
