import { NextResponse } from "next/server";

import type {
  OrganizationAccessFailureReason,
  OrganizationAccessContext,
} from "@/lib/auth/organizationAccess";

import { canManageOrganization } from "@/lib/auth/organizationAccess";

import type {
  OrganizationFrameworkEstablishmentResult,
} from "@/lib/compliance/organizationFrameworkEstablishmentService";


type UnknownRecord =
  Record<string, unknown>;

export type OrganizationFrameworkEstablishmentHttpInput = {
  frameworkId: string;
  title?: string;
};

export type OrganizationFrameworkEstablishmentHttpValidationResult =
  | {
      success: true;
      value: OrganizationFrameworkEstablishmentHttpInput;
    }
  | {
      success: false;
      message: string;
    };


function isRecord(
  value: unknown
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


export function validateOrganizationFrameworkEstablishmentHttpInput(
  body: unknown
): OrganizationFrameworkEstablishmentHttpValidationResult {
  if (!isRecord(body)) {
    return {
      success: false,
      message: "Invalid request body.",
    };
  }

  const allowedKeys =
    new Set([
      "frameworkId",
      "title",
    ]);

  if (
    Object.keys(body).some(
      (key) => !allowedKeys.has(key)
    )
  ) {
    return {
      success: false,
      message:
        "Request body contains unsupported fields.",
    };
  }

  if (
    typeof body.frameworkId !== "string" ||
    body.frameworkId.trim().length === 0
  ) {
    return {
      success: false,
      message:
        "frameworkId is required.",
    };
  }

  if (
    body.title !== undefined &&
    (
      typeof body.title !== "string" ||
      body.title.trim().length === 0
    )
  ) {
    return {
      success: false,
      message:
        "title must be a non-empty string.",
    };
  }

  const value:
    OrganizationFrameworkEstablishmentHttpInput = {
      frameworkId:
        body.frameworkId.trim(),
    };

  if (typeof body.title === "string") {
    value.title =
      body.title.trim();
  }

  return {
    success: true,
    value,
  };
}


export function canEstablishOrganizationFrameworkFromHttp(
  context: OrganizationAccessContext
): boolean {
  return canManageOrganization(
    context
  );
}


export function organizationFrameworkEstablishmentAccessFailure(
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
      message:
        unauthenticated
          ? "Unauthorized"
          : "Organisation access denied.",
      reason,
    },
    {
      status:
        unauthenticated
          ? 401
          : 403,
    }
  );
}


export function organizationFrameworkEstablishmentForbidden() {
  return NextResponse.json(
    {
      success: false,
      reason:
        "FRAMEWORK_ESTABLISHMENT_FORBIDDEN",
      message:
        "Organisation management authority is required.",
    },
    {
      status: 403,
    }
  );
}


export function invalidOrganizationFrameworkEstablishmentRequest(
  message = "Invalid request body."
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status: 400,
    }
  );
}


export function organizationFrameworkEstablishmentFailureStatus(
  result: Extract<
    OrganizationFrameworkEstablishmentResult,
    { success: false }
  >
): number {
  switch (result.reason) {
    case "FRAMEWORK_NOT_FOUND":
      return 404;

    case "USER_NOT_ACTIVE_ORGANIZATION_MEMBER":
    case "CURRENT_AUTHORITY_ALREADY_EXISTS":
      return 409;

    case "USER_NOT_FOUND":
    case "ESTABLISHMENT_TRANSACTION_FAILED":
    default:
      return 500;
  }
}


export function organizationFrameworkEstablishmentHttpResponse(
  result: OrganizationFrameworkEstablishmentResult
) {
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        reason:
          result.reason,
        message:
          result.message,
      },
      {
        status:
          organizationFrameworkEstablishmentFailureStatus(
            result
          ),
      }
    );
  }

  return NextResponse.json(
    {
      success: true,
      assessment:
        result.assessment,
      authority:
        result.authority,
    },
    {
      status: 201,
    }
  );
}