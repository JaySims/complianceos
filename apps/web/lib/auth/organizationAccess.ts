import {
  OrganizationMemberRole,
  UserRole,
} from "@prisma/client";

import type {
  NextRequest,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

/*
 * ============================================================
 * COMPLIANCEOS ORGANIZATION ACCESS AUTHORITY
 * ============================================================
 *
 * PURPOSE
 *
 * This module establishes the authoritative server-side
 * organization boundary for authenticated ComplianceOS
 * requests.
 *
 * SECURITY MODEL
 *
 * JWT
 *   ↓
 * authenticated user identity
 *   ↓
 * database User
 *   ↓
 * active OrganizationMember
 *   ↓
 * Organization
 *   ↓
 * organization-scoped authorization context
 *
 * IMPORTANT
 *
 * organizationId stored inside a JWT is NOT treated as the
 * final authorization authority.
 *
 * PostgreSQL OrganizationMember records are authoritative.
 * ============================================================
 */

type TokenPayload = {
  id?: unknown;
  email?: unknown;
  organizationId?: unknown;
  role?: unknown;
};

export type OrganizationAccessContext = {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
  };

  organization: {
    id: string;
    name: string;
  };

  membership: {
    id: string;
    role: OrganizationMemberRole;
    active: boolean;
  };
};

export type OrganizationAccessFailureReason =
  | "MISSING_TOKEN"
  | "INVALID_TOKEN"
  | "INVALID_IDENTITY"
  | "USER_NOT_FOUND"
  | "NO_ACTIVE_MEMBERSHIP"
  | "ORGANIZATION_NOT_FOUND";

export type OrganizationAccessResult =
  | {
      authorized: true;
      context: OrganizationAccessContext;
    }
  | {
      authorized: false;
      reason: OrganizationAccessFailureReason;
    };

/*
 * ============================================================
 * TOKEN EXTRACTION
 * ============================================================
 */

function getToken(
  request: NextRequest
): string | null {
  return (
    request.cookies.get(
      "token"
    )?.value ?? null
  );
}

/*
 * ============================================================
 * TOKEN VERIFICATION
 * ============================================================
 */

function decodeToken(
  token: string
): TokenPayload | null {
  try {
    return verifyToken(
      token
    ) as TokenPayload;
  } catch {
    return null;
  }
}

/*
 * ============================================================
 * IDENTITY VALIDATION
 * ============================================================
 */

function getUserId(
  payload: TokenPayload
): string | null {
  if (
    typeof payload.id !== "string" ||
    payload.id.trim().length === 0
  ) {
    return null;
  }

  return payload.id;
}

/*
 * ============================================================
 * ACTIVE MEMBERSHIP RESOLUTION
 * ============================================================
 *
 * During the current compatibility phase User.organizationId
 * identifies the user's selected/primary organization.
 *
 * However, access to that organization is granted ONLY when
 * PostgreSQL confirms an active OrganizationMember record.
 *
 * This prevents possession of a stale or manipulated
 * organizationId claim from granting organization access.
 *
 * Later, ComplianceOS can replace User.organizationId with a
 * dedicated active-organization/session selection mechanism
 * without changing the authorization principle.
 * ============================================================
 */

async function resolveActiveMembership(
  userId: string,
  primaryOrganizationId: string | null
) {
  /*
   * Prefer the user's current primary organization when one
   * exists.
   */

  if (primaryOrganizationId) {
    const primaryMembership =
      await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId:
              primaryOrganizationId,
          },
        },

        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    if (
      primaryMembership &&
      primaryMembership.active
    ) {
      return primaryMembership;
    }

    /*
     * A configured primary organization without a matching
     * active membership is an authorization failure.
     *
     * We deliberately do NOT silently fall through to another
     * organization because doing so could move a request into
     * an unintended tenant.
     */

    return null;
  }

  /*
   * Compatibility fallback for users created before a primary
   * organization was assigned.
   *
   * Only resolve automatically when exactly one active
   * membership exists.
   *
   * Multiple memberships require explicit organization
   * selection in a future tenant-switching layer.
   */

  const memberships =
    await prisma.organizationMember.findMany({
      where: {
        userId,
        active: true,
      },

      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        joinedAt: "asc",
      },

      take: 2,
    });

  if (memberships.length !== 1) {
    return null;
  }

  return memberships[0];
}

/*
 * ============================================================
 * ORGANIZATION ACCESS RESOLUTION
 * ============================================================
 */

export async function resolveOrganizationAccess(
  request: NextRequest
): Promise<OrganizationAccessResult> {
  const token =
    getToken(
      request
    );

  if (!token) {
    return {
      authorized: false,
      reason: "MISSING_TOKEN",
    };
  }

  const payload =
    decodeToken(
      token
    );

  if (!payload) {
    return {
      authorized: false,
      reason: "INVALID_TOKEN",
    };
  }

  const userId =
    getUserId(
      payload
    );

  if (!userId) {
    return {
      authorized: false,
      reason: "INVALID_IDENTITY",
    };
  }

  /*
   * Reload the user from PostgreSQL.
   *
   * JWT identity proves who presented the request.
   * PostgreSQL determines the user's current account,
   * organization and membership authority.
   */

  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organizationId: true,
      },
    });

  if (!user) {
    return {
      authorized: false,
      reason: "USER_NOT_FOUND",
    };
  }

  const membership =
    await resolveActiveMembership(
      user.id,
      user.organizationId
    );

  if (!membership) {
    return {
      authorized: false,
      reason: "NO_ACTIVE_MEMBERSHIP",
    };
  }

  if (!membership.organization) {
    return {
      authorized: false,
      reason: "ORGANIZATION_NOT_FOUND",
    };
  }

  return {
    authorized: true,

    context: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },

      organization: {
        id:
          membership.organization.id,

        name:
          membership.organization.name,
      },

      membership: {
        id:
          membership.id,

        role:
          membership.role,

        active:
          membership.active,
      },
    },
  };
}

/*
 * ============================================================
 * ROLE AUTHORIZATION
 * ============================================================
 */

export function hasOrganizationRole(
  context: OrganizationAccessContext,
  allowedRoles: readonly OrganizationMemberRole[]
): boolean {
  return allowedRoles.includes(
    context.membership.role
  );
}

/*
 * ============================================================
 * MANAGEMENT AUTHORITY
 * ============================================================
 *
 * OWNER and ADMIN represent organization-level management
 * authority.
 * ============================================================
 */

export function canManageOrganization(
  context: OrganizationAccessContext
): boolean {
  return hasOrganizationRole(
    context,
    [
      OrganizationMemberRole.OWNER,
      OrganizationMemberRole.ADMIN,
    ]
  );
}

/*
 * ============================================================
 * WORKFLOW WRITE AUTHORITY
 * ============================================================
 *
 * OWNER, ADMIN, MANAGER and MEMBER may currently advance
 * organization workflows.
 *
 * AUDITOR is intentionally excluded from write operations.
 *
 * This policy can become more granular as ComplianceOS gains
 * dedicated permission tables.
 * ============================================================
 */

export function canWriteOrganizationWorkflow(
  context: OrganizationAccessContext
): boolean {
  return hasOrganizationRole(
    context,
    [
      OrganizationMemberRole.OWNER,
      OrganizationMemberRole.ADMIN,
      OrganizationMemberRole.MANAGER,
      OrganizationMemberRole.MEMBER,
    ]
  );
}

/*
 * ============================================================
 * WORKFLOW READ AUTHORITY
 * ============================================================
 *
 * All current organization membership roles may read
 * organization workflow state.
 * ============================================================
 */

export function canReadOrganizationWorkflow(
  context: OrganizationAccessContext
): boolean {
  return hasOrganizationRole(
    context,
    [
      OrganizationMemberRole.OWNER,
      OrganizationMemberRole.ADMIN,
      OrganizationMemberRole.MANAGER,
      OrganizationMemberRole.AUDITOR,
      OrganizationMemberRole.MEMBER,
    ]
  );
}
