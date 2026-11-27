
import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import {
  DocumentVerificationStatus,
} from "@prisma/client";
import jwt from "jsonwebtoken";

import {
  canWriteOrganizationWorkflow,
  resolveOrganizationAccess,
} from "@/lib/auth/organizationAccess";

import { prisma } from "@/lib/prisma";

import {
  validateDocumentFile,
} from "@/lib/documents/validateDocumentFile";

import {
  isAllowedDocumentFileExtension,
} from "@/lib/documents/documentFilePolicy";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const FINALIZATION_LEASE_MS = 5 * 60 * 1000;
const CLEANUP_DELAY_MS = 24 * 60 * 60 * 1000;

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

type UploadIntent = jwt.JwtPayload & {
  purpose: "compliance-document-upload";
  intentId: string;
  userId: string;
  organizationId: string;
  pathname: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  documentType: string;
};

type PersistedUploadIntent = {
  id: string;
  organizationId: string;
  userId: string;
  filePath: string;
  fileName: string;
  documentType: string;
  mimeType: string;
  fileSize: number;
  status: string;
  expiresAt: Date;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function verifyUploadIntent(
  token: unknown,
): UploadIntent | null {
  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      decoded.purpose !== "compliance-document-upload" ||
      typeof decoded.intentId !== "string" ||
      decoded.intentId.length === 0 ||
      typeof decoded.userId !== "string" ||
      typeof decoded.organizationId !== "string" ||
      typeof decoded.pathname !== "string" ||
      typeof decoded.fileName !== "string" ||
      typeof decoded.contentType !== "string" ||
      typeof decoded.fileSize !== "number" ||
      typeof decoded.documentType !== "string"
    ) {
      return null;
    }

    return decoded as UploadIntent;
  } catch {
    return null;
  }
}

async function readBlobStream(
  stream: ReadableStream<Uint8Array>,
  expectedSize: number,
): Promise<Buffer | null> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  let totalSize = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      totalSize += value.byteLength;

      if (
        totalSize > MAX_FILE_SIZE ||
        totalSize > expectedSize
      ) {
        await reader.cancel();
        return null;
      }

      chunks.push(Buffer.from(value));
    }

    if (totalSize !== expectedSize) {
      return null;
    }

    return Buffer.concat(chunks, totalSize);
  } finally {
    reader.releaseLock();
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function matchesPersistedIntent(
  intent: PersistedUploadIntent,
  token: UploadIntent,
): boolean {
  return (
    intent.id === token.intentId &&
    intent.userId === token.userId &&
    intent.organizationId === token.organizationId &&
    intent.filePath === token.pathname &&
    intent.fileName === token.fileName &&
    intent.documentType === token.documentType &&
    intent.mimeType === token.contentType &&
    intent.fileSize === token.fileSize
  );
}

async function markIntentFailed(
  intentId: string,
  leaseExpiresAt: Date,
): Promise<void> {
  try {
    await prisma.documentUploadIntent.updateMany({
      where: {
        id: intentId,
        status: "FINALIZING",
        finalizationLeaseExpiresAt: leaseExpiresAt,
      },
      data: {
        status: "FAILED",
        finalizationLeaseExpiresAt: null,
        cleanupAfter: new Date(
          Date.now() + CLEANUP_DELAY_MS,
        ),
      },
    });
  } catch {
    // The expired finalization lease allows later recovery
    // if this failure-state update cannot be persisted.
  }
}

async function failClaimedIntent(
  intentId: string,
  leaseExpiresAt: Date,
  message: string,
  status: number,
) {
  await markIntentFailed(intentId, leaseExpiresAt);
  return errorResponse(message, status);
}

export async function POST(request: NextRequest) {
  let claimedIntent: {
    id: string;
    leaseExpiresAt: Date;
  } | null = null;

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

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse("Invalid request body.", 400);
    }

    const input = body as Record<string, unknown>;
    const intent = verifyUploadIntent(input.intentToken);

    if (!intent) {
      return errorResponse(
        "The upload intent is invalid or expired. Please start again.",
        401,
      );
    }

    const { user, organization } = access.context;

    if (
      intent.userId !== user.id ||
      intent.organizationId !== organization.id
    ) {
      return errorResponse(
        "This upload intent does not belong to your current organisation session.",
        403,
      );
    }

    const pathname =
      typeof input.pathname === "string"
        ? input.pathname
        : "";

    if (pathname !== intent.pathname) {
      return errorResponse(
        "The uploaded path does not match the authorized upload.",
        400,
      );
    }

    const expectedPrefix =
      `organizations/${organization.id}/documents/`;

    if (
      !pathname.startsWith(expectedPrefix) ||
      pathname.length <= expectedPrefix.length ||
      pathname.includes("..")
    ) {
      return errorResponse(
        "Invalid document upload path.",
        400,
      );
    }

    if (
      !intent.fileName ||
      intent.fileName.length > 180 ||
      intent.fileName.includes("/") ||
      intent.fileName.includes("\\") ||
      intent.fileName === "." ||
      intent.fileName === ".." ||
      !Number.isSafeInteger(intent.fileSize) ||
      intent.fileSize < 1 ||
      intent.fileSize > MAX_FILE_SIZE ||
      !ALLOWED_CONTENT_TYPES.includes(
        intent.contentType as (typeof ALLOWED_CONTENT_TYPES)[number],
      ) ||
      !ALLOWED_DOCUMENT_TYPES.includes(
        intent.documentType as (typeof ALLOWED_DOCUMENT_TYPES)[number],
      ) ||
      !isAllowedDocumentFileExtension(
        intent.fileName,
        intent.contentType,
      )
    ) {
      return errorResponse(
        "The upload intent contains invalid metadata.",
        400,
      );
    }

    // The database record, not the signed token alone,
    // is the authority for the upload lifecycle.
    const persistedIntent =
      await prisma.documentUploadIntent.findFirst({
        where: {
          id: intent.intentId,
          organizationId: organization.id,
          userId: user.id,
        },
        select: {
          id: true,
          organizationId: true,
          userId: true,
          filePath: true,
          fileName: true,
          documentType: true,
          mimeType: true,
          fileSize: true,
          status: true,
          expiresAt: true,
        },
      });

    if (
      !persistedIntent ||
      !matchesPersistedIntent(persistedIntent, intent) ||
      persistedIntent.status !== "PENDING" ||
      persistedIntent.expiresAt.getTime() <= Date.now()
    ) {
      return errorResponse(
        "This upload intent is missing, expired or no longer available for finalization.",
        409,
      );
    }

    // Retain the existing duplicate-document check.
    const existingDocument =
      await prisma.document.findFirst({
        where: {
          filePath: pathname,
          organizationId: organization.id,
        },
        select: {
          id: true,
        },
      });

    if (existingDocument) {
      return errorResponse(
        "This upload has already been finalized.",
        409,
      );
    }

    // Claim the intent before reading Blob storage.
    // The conditional update makes this claim atomic.
    const now = new Date();
    const leaseExpiresAt = new Date(
      now.getTime() + FINALIZATION_LEASE_MS,
    );

    const claim =
      await prisma.documentUploadIntent.updateMany({
        where: {
          id: intent.intentId,
          organizationId: organization.id,
          userId: user.id,
          filePath: pathname,
          status: "PENDING",
          expiresAt: {
            gt: now,
          },
        },
        data: {
          status: "FINALIZING",
          finalizationLeaseExpiresAt: leaseExpiresAt,
        },
      });

    if (claim.count !== 1) {
      return errorResponse(
        "This upload is already being finalized or is no longer available.",
        409,
      );
    }

    claimedIntent = {
      id: intent.intentId,
      leaseExpiresAt,
    };

    const result = await get(
      pathname,
      { access: "private" },
    );

    if (
      !result ||
      result.statusCode !== 200 ||
      result.blob.pathname !== pathname ||
      !result.stream
    ) {
      return await failClaimedIntent(
        intent.intentId,
        leaseExpiresAt,
        "The uploaded document could not be verified.",
        400,
      );
    }

    const { contentType, size } = result.blob;

    if (
      !contentType ||
      contentType !== intent.contentType ||
      !ALLOWED_CONTENT_TYPES.includes(
        contentType as (typeof ALLOWED_CONTENT_TYPES)[number],
      ) ||
      typeof size !== "number" ||
      !Number.isSafeInteger(size) ||
      size < 1 ||
      size > MAX_FILE_SIZE ||
      size !== intent.fileSize
    ) {
      return await failClaimedIntent(
        intent.intentId,
        leaseExpiresAt,
        "The uploaded file does not match the authorized file metadata.",
        400,
      );
    }

    // Read only the bounded file size and verify the actual bytes.
    const fileBuffer = await readBlobStream(
      result.stream,
      size,
    );

    if (!fileBuffer) {
      return await failClaimedIntent(
        intent.intentId,
        leaseExpiresAt,
        "The uploaded file could not be read safely.",
        400,
      );
    }

    const validFile = await validateDocumentFile(
      fileBuffer,
      contentType,
    );

    if (!validFile) {
      return await failClaimedIntent(
        intent.intentId,
        leaseExpiresAt,
        "The file contents do not match the permitted document format.",
        400,
      );
    }

    // Document creation and intent finalization must commit
    // together or roll back together.
    const document = await prisma.$transaction(
      async (transaction) => {
        const createdDocument =
          await transaction.document.create({
            data: {
              documentType: intent.documentType,
              fileName: intent.fileName,
              filePath: pathname,
              fileSize: size,
              mimeType: contentType,
              organizationId: organization.id,
              verified: false,
              status: DocumentVerificationStatus.PENDING,
            },
            select: {
              id: true,
              documentType: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              status: true,
              uploadedAt: true,
            },
          });

        const finalized =
          await transaction.documentUploadIntent.updateMany({
            where: {
              id: intent.intentId,
              organizationId: organization.id,
              userId: user.id,
              status: "FINALIZING",
              finalizationLeaseExpiresAt: leaseExpiresAt,
            },
            data: {
              status: "FINALIZED",
              documentId: createdDocument.id,
              finalizedAt: new Date(),
              finalizationLeaseExpiresAt: null,
            },
          });

        if (finalized.count !== 1) {
          throw new Error(
            "The upload intent could not be finalized.",
          );
        }

        return createdDocument;
      },
    );

    claimedIntent = null;

    return NextResponse.json(
      { document },
      { status: 201 },
    );
  } catch (error) {
    if (claimedIntent) {
      await markIntentFailed(
        claimedIntent.id,
        claimedIntent.leaseExpiresAt,
      );
    }

    if (isUniqueConstraintError(error)) {
      return errorResponse(
        "This upload has already been finalized.",
        409,
      );
    }

    return errorResponse(
      "Unable to finalize the document upload. Please try again.",
      500,
    );
  }
}
