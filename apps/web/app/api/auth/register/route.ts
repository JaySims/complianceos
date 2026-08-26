
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import {
  hashPassword,
} from "@/lib/auth";

import {
  createToken,
} from "@/lib/jwt";

/*
 * ============================================================
 * REGISTRATION REQUEST
 * ============================================================
 */

type RegistrationRequest = {
  fullName?: unknown;
  email?: unknown;
  password?: unknown;

  companyName?: unknown;
  tradingName?: unknown;
  registrationNumber?: unknown;
  website?: unknown;
  industry?: unknown;
  country?: unknown;
  employees?: unknown;
};

/*
 * ============================================================
 * NORMALIZATION HELPERS
 * ============================================================
 */

function normalizeRequiredString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeOptionalString(
  value: unknown
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeEmployeeCount(
  value: unknown
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return Math.max(
      0,
      Math.floor(value)
    );
  }

  if (
    typeof value === "string" &&
    value.trim().length > 0
  ) {
    const parsed =
      Number(value);

    if (
      Number.isFinite(parsed)
    ) {
      return Math.max(
        0,
        Math.floor(parsed)
      );
    }
  }

  return 0;
}

/*
 * ============================================================
 * POST /api/auth/register
 * ============================================================
 *
 * This endpoint represents the final
 * ComplianceOS onboarding launch.
 *
 * A successful transaction creates:
 *
 * 1. Organisation
 * 2. User
 * 3. OWNER membership
 *
 * Because this endpoint is reached from
 * the final Launch ComplianceOS action,
 * the organisation is persisted with:
 *
 * onboardingCompleted = true
 *
 * All related records are created inside
 * one PostgreSQL transaction.
 * ============================================================
 */

export async function POST(
  req: NextRequest
) {
  try {
    /*
     * ========================================================
     * REQUEST BODY
     * ========================================================
     */

    const body =
      (await req.json()) as
        RegistrationRequest;

    const fullName =
      normalizeRequiredString(
        body.fullName
      );

    const email =
      normalizeRequiredString(
        body.email
      ).toLowerCase();

    const password =
      normalizeRequiredString(
        body.password
      );

    const companyName =
      normalizeRequiredString(
        body.companyName
      );

    const tradingName =
      normalizeOptionalString(
        body.tradingName
      );

    const registrationNumber =
      normalizeOptionalString(
        body.registrationNumber
      );

    const website =
      normalizeOptionalString(
        body.website
      );

    const industry =
      normalizeOptionalString(
        body.industry
      );

    const country =
      normalizeOptionalString(
        body.country
      ) ?? "South Africa";

    const employeeCount =
      normalizeEmployeeCount(
        body.employees
      );

    /*
     * ========================================================
     * REQUIRED FIELD VALIDATION
     * ========================================================
     */

    if (
      !fullName ||
      !email ||
      !password ||
      !companyName
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Please complete all required fields before launching ComplianceOS.",
        },

        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * PASSWORD VALIDATION
     * ========================================================
     */

    if (
      password.length < 8
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Password must contain at least 8 characters.",
        },

        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * DUPLICATE USER CHECK
     * ========================================================
     */

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,

          message:
            "An account with this email already exists.",
        },

        {
          status: 409,
        }
      );
    }

    /*
     * ========================================================
     * PASSWORD HASH
     * ========================================================
     */

    const hashedPassword =
      await hashPassword(
        password
      );

    /*
     * ========================================================
     * ATOMIC REGISTRATION TRANSACTION
     * ========================================================
     *
     * Organisation, user and OWNER membership
     * must succeed together.
     *
     * We do not want:
     *
     * - orphan organisations
     * - users without ownership
     * - memberships without users
     *
     * If any operation fails, PostgreSQL
     * rolls the transaction back.
     * ========================================================
     */

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * --------------------------------------------------
           * ORGANISATION
           * --------------------------------------------------
           */

          const organization =
            await tx.organization.create({
              data: {
                name:
                  companyName,

                tradingName,

                registrationNumber,

                website,

                industry,

                country,

                employeeCount,

                /*
                 * Initial trust state.
                 *
                 * These values remain compatible
                 * with the current Trust Engine
                 * implementation.
                 */

                trustScore:
                  45,

                complianceScore:
                  35,

                /*
                 * This API is executed by the
                 * final onboarding launch.
                 *
                 * Therefore a successful database
                 * transaction means onboarding has
                 * completed.
                 */

                onboardingCompleted:
                  true,
              },
            });

          /*
           * --------------------------------------------------
           * USER
           * --------------------------------------------------
           */

          const user =
            await tx.user.create({
              data: {
                fullName,

                email,

                password:
                  hashedPassword,

                organizationId:
                  organization.id,
              },
            });

          /*
           * --------------------------------------------------
           * ORGANISATION OWNER MEMBERSHIP
           * --------------------------------------------------
           *
           * The first user who creates the
           * organisation becomes its OWNER.
           * --------------------------------------------------
           */

          const membership =
            await tx.organizationMember.create({
              data: {
                userId:
                  user.id,

                organizationId:
                  organization.id,

                role:
                  "OWNER",

                active:
                  true,
              },
            });

          return {
            organization,
            user,
            membership,
          };
        }
      );

    /*
     * ========================================================
     * AUTHENTICATION TOKEN
     * ========================================================
     */

    const token =
      createToken({
        id:
          result.user.id,

        email:
          result.user.email,

        organizationId:
          result.organization.id,

        role:
          result.user.role,
      });

    /*
     * ========================================================
     * SAFE RESPONSE
     * ========================================================
     *
     * Never return password hashes to
     * the browser.
     * ========================================================
     */

    const response =
      NextResponse.json(
        {
          success: true,

          user: {
            id:
              result.user.id,

            fullName:
              result.user.fullName,

            email:
              result.user.email,

            role:
              result.user.role,
          },

          organization:
            result.organization,

          membership: {
            id:
              result.membership.id,

            role:
              result.membership.role,

            active:
              result.membership.active,
          },
        },

        {
          status: 201,
        }
      );

    /*
     * ========================================================
     * AUTH COOKIE
     * ========================================================
     */

    response.cookies.set({
      name:
        "token",

      value:
        token,

      httpOnly:
        true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite:
        "lax",

      path:
        "/",

      maxAge:
        60 *
        60 *
        24 *
        7,
    });

    return response;
  } catch (error) {
    /*
     * ========================================================
     * KNOWN PRISMA CONFLICT
     * ========================================================
     *
     * P2002 = unique constraint violation.
     *
     * This protects against concurrent
     * registration attempts even if both
     * requests pass the earlier duplicate
     * email check.
     * ========================================================
     */

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "This email address or organisation registration number is already registered.",
        },

        {
          status: 409,
        }
      );
    }

    console.error(
      "Registration failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Registration failed. Please try again.",
      },

      {
        status: 500,
      }
    );
  }
}
