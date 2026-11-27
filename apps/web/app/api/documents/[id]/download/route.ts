
import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

import {
  canReadOrganizationWorkflow,
  resolveOrganizationAccess,
} from "@/lib/auth/organizationAccess";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function safeDownloadName(fileName: string) {
  return fileName
    .replace(/[\r\n"]/g, "_")
    .replace(/[\\/]/g, "_")
    .slice(0, 180) || "document";
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    if (!id || id.length > 128) {
      return errorResponse("Invalid document ID.", 400);
    }

    const document = await prisma.document.findFirst({
      where: {
        id,
        organizationId: access.context.organization.id,
      },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        mimeType: true,
        fileSize: true,
      },
    });

    if (!document) {
      return errorResponse("Document not found.", 404);
    }

    const result = await get(document.filePath, {
      access: "private",
      useCache: false,
    });

    if (
      !result ||
      result.statusCode !== 200 ||
      result.blob.pathname !== document.filePath ||
      !Number.isSafeInteger(result.blob.size) ||
      result.blob.size !== document.fileSize
    ) {
      return errorResponse("Document content is unavailable.", 404);
    }

    const contentType =
      document.mimeType &&
      result.blob.contentType === document.mimeType
        ? document.mimeType
        : "application/octet-stream";

    const headers = new Headers();

    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${safeDownloadName(document.fileName)}"`,
    );
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Cache-Control", "private, no-store, max-age=0");
    headers.set("Pragma", "no-cache");

    headers.set("Content-Length", String(result.blob.size));

    return new Response(result.stream, {
      status: 200,
      headers,
    });
  } catch {
    return errorResponse(
      "Unable to download this document. Please try again.",
      500,
    );
  }
}
