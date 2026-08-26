import { cookies } from "next/headers";

import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  organizationId: string;
};

type TokenPayload = {
  id?: unknown;
  email?: unknown;
  role?: unknown;
  organizationId?: unknown;
};

/**
 * Read and verify the current authentication token.
 *
 * The token establishes identity, but database state remains
 * authoritative for the user's current organisation.
 */
async function getTokenPayload(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyToken(token) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Resolve the currently authenticated user.
 *
 * SECURITY:
 * Never trust an organisation ID supplied by the browser.
 *
 * We verify the JWT, then reload the user from the database so
 * organisation membership is derived from authoritative server state.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const payload = await getTokenPayload();

  if (
    !payload ||
    typeof payload.id !== "string" ||
    typeof payload.email !== "string"
  ) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.id,
    },
    select: {
      id: true,
      email: true,
      role: true,
      organizationId: true,
    },
  });

  if (!user || !user.organizationId) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
}

/**
 * Compatibility helper for existing application code.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();

  return user?.id ?? null;
}

/**
 * Resolve the authenticated user's organisation.
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const user = await getCurrentUser();

  return user?.organizationId ?? null;
}
