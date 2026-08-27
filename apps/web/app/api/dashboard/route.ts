import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  canReadOrganizationWorkflow,
  resolveOrganizationAccess,
  type OrganizationAccessFailureReason,
} from "@/lib/auth/organizationAccess";

/*
 * ============================================================
 * COMPLIANCEOS DASHBOARD API
 * ============================================================
 *
 * SECURITY MODEL
 *
 * The dashboard never trusts organizationId supplied by the
 * browser or stored inside the JWT as organization authority.
 *
 * Authorization chain:
 *
 * JWT
 *   ↓
 * authenticated database User
 *   ↓
 * active OrganizationMember
 *   ↓
 * authorized Organization
 *   ↓
 * organization-scoped dashboard data
 *
 * PostgreSQL organization membership is authoritative.
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

      message: unauthenticated
        ? "Unauthorized"
        : "Organisation access denied.",

      reason,
    },
    {
      status: unauthenticated
        ? 401
        : 403,
    }
  );
}

/*
 * ============================================================
 * GET
 * ============================================================
 *
 * Returns dashboard information only for the organization
 * resolved through the authenticated user's active database
 * membership.
 *
 * READ AUTHORITY
 *
 * OWNER
 * ADMIN
 * MANAGER
 * AUDITOR
 * MEMBER
 * ============================================================
 */

export async function GET(
  req: NextRequest
) {
  try {
    /*
     * Resolve authenticated organization authority.
     */

    const access =
      await resolveOrganizationAccess(
        req
      );

    if (!access.authorized) {
      return organizationAccessFailure(
        access.reason
      );
    }

    /*
     * Dashboard access is currently aligned with organization
     * workflow read authority.
     *
     * This means AUDITOR may inspect organization dashboard
     * state while remaining unable to perform protected write
     * operations elsewhere.
     */

    if (
      !canReadOrganizationWorkflow(
        access.context
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You do not have permission to read organisation dashboard data.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      user,
      organization:
        authorizedOrganization,
    } = access.context;

    /*
     * ========================================================
     * TENANT-SCOPED ORGANIZATION QUERY
     * ========================================================
     *
     * The organization ID comes exclusively from the
     * PostgreSQL-backed authorization context.
     *
     * Never use an organizationId supplied by:
     *
     * - request body
     * - query parameters
     * - headers
     * - JWT organization claims
     *
     * as authorization authority here.
     * ========================================================
     */

    const organization =
      await prisma.organization.findUnique({
        where: {
          id:
            authorizedOrganization.id,
        },

        select: {
          id: true,
          name: true,
          tradingName: true,
          registrationNumber: true,
          website: true,
          industry: true,
          country: true,
          employeeCount: true,
          trustScore: true,
          complianceScore: true,
          onboardingCompleted: true,
          createdAt: true,
          updatedAt: true,

          documents: {
            select: {
              id: true,
              documentType: true,
              fileName: true,
              filePath: true,
              fileSize: true,
              mimeType: true,
              verified: true,
              uploadedAt: true,
              organizationId: true,
            },

            orderBy: {
              uploadedAt: "desc",
            },
          },

          assessments: {
            select: {
              id: true,
              title: true,
              score: true,
              status: true,
              organizationId: true,
              frameworkId: true,
              userId: true,
              createdAt: true,
              updatedAt: true,
            },

            orderBy: {
              createdAt: "desc",
            },
          },

          /*
           * Never return complete User records from this
           * endpoint.
           *
           * In particular, password hashes must remain
           * server-side.
           *
           * Memberships provide the correct organization-
           * scoped representation of people belonging to the
           * tenant.
           */

          members: {
            where: {
              active: true,
            },

            select: {
              id: true,
              role: true,
              active: true,
              joinedAt: true,

              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                },
              },
            },

            orderBy: {
              joinedAt: "asc",
            },
          },
        },
      });

    if (!organization) {
      /*
       * This should normally be unreachable because
       * resolveOrganizationAccess() already resolved an
       * organization through an active membership.
       *
       * Keep the check as a defensive database boundary.
       */

      return NextResponse.json(
        {
          success: false,
          message:
            "Organization not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Recommendations are user-specific rather than
     * organization-specific in the current Prisma schema.
     *
     * Therefore they must be scoped to the authenticated
     * database user resolved by the authorization layer.
     */

    const recommendations =
      await prisma.recommendation.findMany({
        where: {
          userId:
            user.id,
        },

        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          completed: true,
          userId: true,
          createdAt: true,
        },

        orderBy: [
          {
            completed: "asc",
          },
          {
            priority: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      });

    return NextResponse.json({
      success: true,

      organization,

      recommendations,
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load dashboard.",
      },
      {
        status: 500,
      }
    );
  }
}
