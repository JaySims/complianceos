
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { issueSignedToken, presignUrl } from "@vercel/blob";

import {
  canWriteOrganizationWorkflow,
  resolveOrganizationAccess,
} from "@/lib/auth/organizationAccess";

import { createUploadIntentToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

import {
  isAllowedDocumentFileExtension,
} from "@/lib/documents/documentFilePolicy";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const UPLOAD_URL_LIFETIME_MS = 5 * 60 * 1000;
const UPLOAD_INTENT_LIFETIME_MS = 10 * 60 * 1000;

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const ALLOWED_DOCUMENT_TYPES = [
  "Company Registration Certificate",
  "Tax Clearance Certificate",
  "VAT Registration",
  "B-BBEE Certificate",
  "Memorandum of Incorporation (MOI)",
  "Shareholder Register",
  "Directors Register",
  "POPIA Policy",
] as const;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const access = await resolveOrganizationAccess(request);

    if (!access.authorized) {
      return errorResponse(
        "Authentication or organisation access required.",
        401,
      );
    }

    if (!canWriteOrganizationWorkflow(access.context)) {
      return errorResponse(
        "You do not have permission to upload documents.",
        403,
      );
    }

    const body: unknown = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Invalid request body.", 400);
    }

    const input = body as Record<string, unknown>;

    const fileName =
      typeof input.fileName === "string"
        ? input.fileName.trim()
        : "";

    const contentType =
      typeof input.contentType === "string"
        ? input.contentType.trim()
        : "";

    const fileSize = input.fileSize;
    const documentType = input.documentType;

    if (
      !fileName ||
      fileName.length > 180 ||
      fileName.includes("/") ||
      fileName.includes("\\") ||
      fileName === "." ||
      fileName === ".."
    ) {
      return errorResponse("Invalid file name.", 400);
    }

    if (
      typeof fileSize !== "number" ||
      !Number.isSafeInteger(fileSize) ||
      fileSize < 1 ||
      fileSize > MAX_FILE_SIZE
    ) {
      return errorResponse(
        "File size must be between 1 byte and 25 MB.",
        400,
      );
    }

    if (
      !ALLOWED_CONTENT_TYPES.includes(
        contentType as (typeof ALLOWED_CONTENT_TYPES)[number],
      )
    ) {
      return errorResponse("Unsupported file type.", 400);
    }

    if (
      !isAllowedDocumentFileExtension(
        fileName,
        contentType,
      )
    ) {
      return errorResponse(
        "The file extension does not match the selected file type.",
        400,
      );
    }

    if (
      typeof documentType !== "string" ||
      !ALLOWED_DOCUMENT_TYPES.includes(
        documentType as (typeof ALLOWED_DOCUMENT_TYPES)[number],
      )
    ) {
      return errorResponse("Unsupported document type.", 400);
    }

    const { user, organization } = access.context;

    const pathname =
      `organizations/${organization.id}/documents/${randomUUID()}`;

    const intentExpiresAt = new Date(
      Date.now() + UPLOAD_INTENT_LIFETIME_MS,
    );

    // Persist the intent before creating or returning upload credentials.
    const uploadIntent = await prisma.documentUploadIntent.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        filePath: pathname,
        fileName,
        documentType,
        mimeType: contentType,
        fileSize,
        status: "PENDING",
        expiresAt: intentExpiresAt,
      },
      select: {
        id: true,
      },
    });

    const intentToken = createUploadIntentToken({
      purpose: "compliance-document-upload",
      intentId: uploadIntent.id,
      userId: user.id,
      organizationId: organization.id,
      pathname,
      fileName,
      contentType,
      fileSize,
      documentType,
    });

    const validUntil =
      Date.now() + UPLOAD_URL_LIFETIME_MS;

    const signedToken = await issueSignedToken({
      pathname,
      operations: ["put"],
      validUntil,
      allowedContentTypes: [contentType],
      maximumSizeInBytes: fileSize,
    });

    const { presignedUrl } = await presignUrl(
      signedToken,
      {
        operation: "put",
        pathname,
        access: "private",
        validUntil,
        allowedContentTypes: [contentType],
        maximumSizeInBytes: fileSize,
        allowOverwrite: false,
        addRandomSuffix: false,
      },
    );

    return NextResponse.json({
      uploadUrl: presignedUrl,
      pathname,
      intentToken,
      expiresAt: new Date(validUntil).toISOString(),
      maxFileSize: fileSize,
    });
  } catch {
    return errorResponse(
      "Unable to prepare a secure upload. Please try again.",
      500,
    );
  }
}
