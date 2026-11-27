
import { NextRequest } from "next/server";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  resolveOrganizationAccessMock,
  canWriteOrganizationWorkflowMock,
  createUploadIntentTokenMock,
  issueSignedTokenMock,
  presignUrlMock,
  documentUploadIntentCreateMock,
} = vi.hoisted(() => ({
  resolveOrganizationAccessMock: vi.fn(),
  canWriteOrganizationWorkflowMock: vi.fn(),
  createUploadIntentTokenMock: vi.fn(),
  issueSignedTokenMock: vi.fn(),
  presignUrlMock: vi.fn(),
  documentUploadIntentCreateMock: vi.fn(),
}));

vi.mock("@/lib/auth/organizationAccess", () => ({
  resolveOrganizationAccess: resolveOrganizationAccessMock,
  canWriteOrganizationWorkflow: canWriteOrganizationWorkflowMock,
}));

vi.mock("@/lib/jwt", () => ({
  createUploadIntentToken: createUploadIntentTokenMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    documentUploadIntent: {
      create: documentUploadIntentCreateMock,
    },
  },
}));

vi.mock("@vercel/blob", () => ({
  issueSignedToken: issueSignedTokenMock,
  presignUrl: presignUrlMock,
}));

import { POST } from "@/app/api/documents/upload-url/route";

const context = {
  user: { id: "user-1" },
  organization: { id: "organization-1" },
  membership: { role: "OWNER" },
};

const validInput = {
  fileName: "registration.pdf",
  contentType: "application/pdf",
  fileSize: 1024,
  documentType: "Company Registration Certificate",
};

const persistedIntent = {
  id: "intent-1",
};

function createRequest(overrides: Record<string, unknown> = {}) {
  return new NextRequest(
    "http://localhost:3000/api/documents/upload-url",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ...validInput,
        ...overrides,
      }),
    },
  );
}

function expectNoUploadPreparation() {
  expect(documentUploadIntentCreateMock).not.toHaveBeenCalled();
  expect(createUploadIntentTokenMock).not.toHaveBeenCalled();
  expect(issueSignedTokenMock).not.toHaveBeenCalled();
  expect(presignUrlMock).not.toHaveBeenCalled();
}

describe("POST /api/documents/upload-url", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    resolveOrganizationAccessMock.mockResolvedValue({
      authorized: true,
      context,
    });

    canWriteOrganizationWorkflowMock.mockReturnValue(true);

    documentUploadIntentCreateMock.mockResolvedValue(
      persistedIntent,
    );

    createUploadIntentTokenMock.mockReturnValue(
      "test-intent-token",
    );

    issueSignedTokenMock.mockResolvedValue(
      "test-signed-token",
    );

    presignUrlMock.mockResolvedValue({
      presignedUrl: "https://example.com/upload",
    });
  });

  it("rejects unauthenticated requests before preparing an upload", async () => {
    resolveOrganizationAccessMock.mockResolvedValue({
      authorized: false,
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(canWriteOrganizationWorkflowMock).not.toHaveBeenCalled();

    expectNoUploadPreparation();
  });

  it("rejects users without document-write permission", async () => {
    canWriteOrganizationWorkflowMock.mockReturnValue(false);

    const response = await POST(createRequest());

    expect(response.status).toBe(403);

    expectNoUploadPreparation();
  });

  it("rejects a filename extension that does not match its MIME type", async () => {
    const response = await POST(
      createRequest({ fileName: "registration.txt" }),
    );

    expect(response.status).toBe(400);

    expectNoUploadPreparation();
  });

  it.each([
    ["zero bytes", 0],
    ["a file larger than 25 MB", 25 * 1024 * 1024 + 1],
    ["a fractional size", 1.5],
    ["a non-numeric size", "1024"],
  ])("rejects an invalid file size: %s", async (_description, fileSize) => {
    const response = await POST(createRequest({ fileSize }));

    expect(response.status).toBe(400);

    expectNoUploadPreparation();
  });

  it("rejects an unsupported MIME type", async () => {
    const response = await POST(
      createRequest({
        fileName: "registration.exe",
        contentType: "application/octet-stream",
      }),
    );

    expect(response.status).toBe(400);

    expectNoUploadPreparation();
  });

  it.each([
    ["a forward slash", "folder/registration.pdf"],
    ["a backslash", "folder\\registration.pdf"],
    ["a path traversal name", ".."],
    ["an empty name", "   "],
  ])("rejects an unsafe filename containing %s", async (_description, fileName) => {
    const response = await POST(createRequest({ fileName }));

    expect(response.status).toBe(400);

    expectNoUploadPreparation();
  });

  it("rejects an unsupported document type", async () => {
    const response = await POST(
      createRequest({
        documentType: "Unapproved Document",
      }),
    );

    expect(response.status).toBe(400);

    expectNoUploadPreparation();
  });

  it("persists a pending upload intent before returning private upload credentials", async () => {
    const response = await POST(createRequest());

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.pathname).toMatch(
      /^organizations\/organization-1\/documents\/[0-9a-f-]+$/i,
    );

    expect(body.uploadUrl).toBe(
      "https://example.com/upload",
    );

    expect(body.intentToken).toBe("test-intent-token");
    expect(body.maxFileSize).toBe(validInput.fileSize);
    expect(body.expiresAt).toBeTruthy();

    expect(documentUploadIntentCreateMock).toHaveBeenCalledTimes(1);

    const createCall =
      documentUploadIntentCreateMock.mock.calls[0][0];

    expect(createCall.data).toEqual(
      expect.objectContaining({
        organizationId: "organization-1",
        userId: "user-1",
        filePath: body.pathname,
        fileName: validInput.fileName,
        mimeType: validInput.contentType,
        fileSize: validInput.fileSize,
        documentType: validInput.documentType,
        status: "PENDING",
      }),
    );

    expect(createCall.data.expiresAt).toBeInstanceOf(Date);

    expect(
      createCall.data.expiresAt.getTime(),
    ).toBeGreaterThan(Date.now());

    expect(
      createCall.data.expiresAt.getTime(),
    ).toBeLessThanOrEqual(Date.now() + 10 * 60 * 1000);

    expect(createUploadIntentTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: "compliance-document-upload",
        intentId: "intent-1",
        userId: "user-1",
        organizationId: "organization-1",
        pathname: body.pathname,
        fileName: validInput.fileName,
        contentType: validInput.contentType,
        fileSize: validInput.fileSize,
        documentType: validInput.documentType,
      }),
    );

    expect(issueSignedTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: body.pathname,
        operations: ["put"],
        allowedContentTypes: [validInput.contentType],
        maximumSizeInBytes: validInput.fileSize,
      }),
    );

    expect(presignUrlMock).toHaveBeenCalledWith(
      "test-signed-token",
      expect.objectContaining({
        operation: "put",
        pathname: body.pathname,
        access: "private",
        allowedContentTypes: [validInput.contentType],
        maximumSizeInBytes: validInput.fileSize,
        allowOverwrite: false,
        addRandomSuffix: false,
      }),
    );
  });

  it("does not return upload credentials when intent persistence fails", async () => {
    documentUploadIntentCreateMock.mockRejectedValue(
      new Error("Database unavailable"),
    );

    const response = await POST(createRequest());

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body).toEqual({
      error: "Unable to prepare a secure upload. Please try again.",
    });

    expect(createUploadIntentTokenMock).not.toHaveBeenCalled();
    expect(issueSignedTokenMock).not.toHaveBeenCalled();
    expect(presignUrlMock).not.toHaveBeenCalled();
  });
});
