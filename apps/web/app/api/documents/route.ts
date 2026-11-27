
import { NextRequest, NextResponse } from "next/server";

import {
  canReadOrganizationWorkflow,
  resolveOrganizationAccess,
} from "@/lib/auth/organizationAccess";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}

export async function GET(request: NextRequest) {
  try {
    const access = await resolveOrganizationAccess(request);

    if (!access.authorized) {
      return errorResponse(
        "Authentication or organisation access required.",
        401,
      );
    }

    if (!canReadOrganizationWorkflow(access.context)) {
      return errorResponse(
        "You do not have permission to read organisation documents.",
        403,
      );
    }

    const documents = await prisma.document.findMany({
      where: {
        organizationId: access.context.organization.id,
      },
      orderBy: [
        {
          uploadedAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      select: {
        id: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        verified: true,
        status: true,
        issuedAt: true,
        expiresAt: true,
        verifiedAt: true,
        uploadedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        documents,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch {
    return errorResponse(
      "Unable to retrieve organisation documents. Please try again.",
      500,
    );
  }
}
