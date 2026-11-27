
import { Buffer } from "node:buffer";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  prismaMock,
  transactionDocumentCreateMock,
  transactionIntentUpdateManyMock,
  resolveOrganizationAccessMock,
  canWriteOrganizationWorkflowMock,
  getBlobMock,
} = vi.hoisted(() => ({
  prismaMock: {
    document: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    documentUploadIntent: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  transactionDocumentCreateMock: vi.fn(),
  transactionIntentUpdateManyMock: vi.fn(),
  resolveOrganizationAccessMock: vi.fn(),
  canWriteOrganizationWorkflowMock: vi.fn(),
  getBlobMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/auth/organizationAccess", () => ({
  resolveOrganizationAccess: resolveOrganizationAccessMock,
  canWriteOrganizationWorkflow: canWriteOrganizationWorkflowMock,
}));

vi.mock("@vercel/blob", () => ({
  get: getBlobMock,
}));

import { POST } from "@/app/api/documents/finalize/route";

const TEST_SECRET = "document-finalize-test-secret";

const organizationId = "organization-1";
const userId = "user-1";
const intentId = "upload-intent-1";

const pathname =
  `organizations/${organizationId}/documents/test-upload`;

const validPdf = Buffer.from(
  "%PDF-1.7\nTest document content\n",
  "utf8",
);

const context = {
  user: {
    id: userId,
  },
  organization: {
    id: organizationId,
  },
  membership: {
    role: "OWNER",
  },
};

function createPersistedIntent(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: intentId,
    organizationId,
    userId,
    filePath: pathname,
    fileName: "certificate.pdf",
    documentType: "Company Registration Certificate",
    mimeType: "application/pdf",
    fileSize: validPdf.length,
    status: "PENDING",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    ...overrides,
  };
}

function createBlobResult(
  fileBuffer: Buffer,
  blobPath = pathname,
  overrides: Record<string, unknown> = {},
) {
  return {
    statusCode: 200,
    blob: {
      pathname: blobPath,
      contentType: "application/pdf",
      size: fileBuffer.length,
      ...overrides,
    },
    stream: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(fileBuffer));
        controller.close();
      },
    }),
  };
}

function createIntentToken(
  fileBuffer: Buffer,
  overrides: Record<string, unknown> = {},
) {
  return jwt.sign(
    {
      purpose: "compliance-document-upload",
      intentId,
      userId,
      organizationId,
      pathname,
      fileName: "certificate.pdf",
      contentType: "application/pdf",
      fileSize: fileBuffer.length,
      documentType: "Company Registration Certificate",
      ...overrides,
    },
    TEST_SECRET,
    {
      expiresIn: "10m",
    },
  );
}

function createRequest(
  fileBuffer: Buffer,
  overrides: {
    pathname?: string;
    intentToken?: string;
  } = {},
) {
  return new NextRequest(
    "http://localhost:3000/api/documents/finalize",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        pathname: overrides.pathname ?? pathname,
        intentToken:
          overrides.intentToken ?? createIntentToken(fileBuffer),
      }),
    },
  );
}

function expectNoDocumentCreation() {
  expect(transactionDocumentCreateMock).not.toHaveBeenCalled();
}

function expectNoBlobOrIntentAccess() {
  expect(prismaMock.documentUploadIntent.findFirst).not.toHaveBeenCalled();
  expect(prismaMock.documentUploadIntent.updateMany).not.toHaveBeenCalled();
  expect(getBlobMock).not.toHaveBeenCalled();
  expect(prismaMock.document.findFirst).not.toHaveBeenCalled();
  expectNoDocumentCreation();
}

function expectClaimedIntent() {
  expect(prismaMock.documentUploadIntent.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        id: intentId,
        organizationId,
        userId,
        status: "PENDING",
      }),
      data: expect.objectContaining({
        status: "FINALIZING",
        finalizationLeaseExpiresAt: expect.any(Date),
      }),
    }),
  );
}

describe("POST /api/documents/finalize", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.JWT_SECRET = TEST_SECRET;

    resolveOrganizationAccessMock.mockResolvedValue({
      authorized: true,
      context,
    });

    canWriteOrganizationWorkflowMock.mockReturnValue(true);

    prismaMock.document.findFirst.mockResolvedValue(null);

    prismaMock.documentUploadIntent.findFirst.mockResolvedValue(
      createPersistedIntent(),
    );

    prismaMock.documentUploadIntent.updateMany.mockResolvedValue({
      count: 1,
    });

    transactionDocumentCreateMock.mockResolvedValue({
      id: "document-1",
      documentType: "Company Registration Certificate",
      fileName: "certificate.pdf",
      fileSize: validPdf.length,
      mimeType: "application/pdf",
      status: "PENDING",
      uploadedAt: new Date(),
    });

    transactionIntentUpdateManyMock.mockResolvedValue({
      count: 1,
    });

    prismaMock.$transaction.mockImplementation(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({
          document: {
            create: transactionDocumentCreateMock,
          },
          documentUploadIntent: {
            updateMany: transactionIntentUpdateManyMock,
          },
        }),
    );

    getBlobMock.mockImplementation(
      async (blobPath: string) =>
        createBlobResult(validPdf, blobPath),
    );
  });

  it("rejects unauthenticated requests without accessing documents, intents or Blob storage", async () => {
    resolveOrganizationAccessMock.mockResolvedValue({
      authorized: false,
    });

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(401);
    expect(canWriteOrganizationWorkflowMock).not.toHaveBeenCalled();

    expectNoBlobOrIntentAccess();
  });

  it("rejects users without document-write permission", async () => {
    canWriteOrganizationWorkflowMock.mockReturnValue(false);

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(403);

    expectNoBlobOrIntentAccess();
  });

  it("rejects an upload intent belonging to another user", async () => {
    const token = createIntentToken(validPdf, {
      userId: "another-user",
    });

    const response = await POST(
      createRequest(validPdf, { intentToken: token }),
    );

    expect(response.status).toBe(403);

    expectNoBlobOrIntentAccess();
  });

  it("rejects an upload intent belonging to another organisation", async () => {
    const token = createIntentToken(validPdf, {
      organizationId: "another-organization",
    });

    const response = await POST(
      createRequest(validPdf, { intentToken: token }),
    );

    expect(response.status).toBe(403);

    expectNoBlobOrIntentAccess();
  });

  it("rejects an expired upload token", async () => {
    const token = jwt.sign(
      {
        purpose: "compliance-document-upload",
        intentId,
        userId,
        organizationId,
        pathname,
        fileName: "certificate.pdf",
        contentType: "application/pdf",
        fileSize: validPdf.length,
        documentType: "Company Registration Certificate",
      },
      TEST_SECRET,
      { expiresIn: -1 },
    );

    const response = await POST(
      createRequest(validPdf, { intentToken: token }),
    );

    expect(response.status).toBe(401);

    expectNoBlobOrIntentAccess();
  });

  it("rejects a token without a persistent intent ID", async () => {
    const token = createIntentToken(validPdf, {
      intentId: undefined,
    });

    const response = await POST(
      createRequest(validPdf, { intentToken: token }),
    );

    expect(response.status).toBe(401);

    expectNoBlobOrIntentAccess();
  });

  it("rejects a submitted pathname that differs from the signed upload intent", async () => {
    const response = await POST(
      createRequest(validPdf, {
        pathname: `${pathname}-different`,
      }),
    );

    expect(response.status).toBe(400);

    expectNoBlobOrIntentAccess();
  });

  it("rejects a missing persistent upload intent", async () => {
    prismaMock.documentUploadIntent.findFirst.mockResolvedValue(null);

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(409);

    expect(prismaMock.documentUploadIntent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: intentId,
          organizationId,
          userId,
        }),
      }),
    );

    expect(prismaMock.documentUploadIntent.updateMany).not.toHaveBeenCalled();
    expect(getBlobMock).not.toHaveBeenCalled();
    expectNoDocumentCreation();
  });

  it("rejects an intent whose persisted metadata differs from the signed token", async () => {
    prismaMock.documentUploadIntent.findFirst.mockResolvedValue(
      createPersistedIntent({
        fileName: "different-certificate.pdf",
      }),
    );

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(409);
    expect(prismaMock.documentUploadIntent.updateMany).not.toHaveBeenCalled();
    expect(getBlobMock).not.toHaveBeenCalled();
    expectNoDocumentCreation();
  });

  it("rejects an expired persistent upload intent", async () => {
    prismaMock.documentUploadIntent.findFirst.mockResolvedValue(
      createPersistedIntent({
        expiresAt: new Date(Date.now() - 60_000),
      }),
    );

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(409);
    expect(prismaMock.documentUploadIntent.updateMany).not.toHaveBeenCalled();
    expect(getBlobMock).not.toHaveBeenCalled();
    expectNoDocumentCreation();
  });

  it("rejects an intent that is not pending", async () => {
    prismaMock.documentUploadIntent.findFirst.mockResolvedValue(
      createPersistedIntent({
        status: "FINALIZED",
      }),
    );

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(409);
    expect(prismaMock.documentUploadIntent.updateMany).not.toHaveBeenCalled();
    expect(getBlobMock).not.toHaveBeenCalled();
    expectNoDocumentCreation();
  });

  it("claims the persistent intent before reading the private Blob", async () => {
    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(201);

    expectClaimedIntent();

    expect(
      prismaMock.documentUploadIntent.updateMany.mock.invocationCallOrder[0],
    ).toBeLessThan(getBlobMock.mock.invocationCallOrder[0]);
  });

  it("does not read the Blob when another request has already claimed the intent", async () => {
    prismaMock.documentUploadIntent.updateMany.mockResolvedValue({
      count: 0,
    });

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(409);
    expect(getBlobMock).not.toHaveBeenCalled();
    expectNoDocumentCreation();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an unavailable private Blob and marks the claimed intent for delayed cleanup", async () => {
    getBlobMock.mockResolvedValue(null);

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(400);

    expect(getBlobMock).toHaveBeenCalledWith(
      pathname,
      { access: "private" },
    );

    expectClaimedIntent();

    expect(prismaMock.documentUploadIntent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: intentId,
          status: "FINALIZING",
        }),
        data: expect.objectContaining({
          status: "FAILED",
          cleanupAfter: expect.any(Date),
          finalizationLeaseExpiresAt: null,
        }),
      }),
    );

    expectNoDocumentCreation();
  });

  it("rejects a Blob with a non-success status", async () => {
    getBlobMock.mockResolvedValue({
      ...createBlobResult(validPdf),
      statusCode: 404,
    });

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(400);
    expectNoDocumentCreation();
  });

  it("rejects a Blob whose pathname does not match the signed intent", async () => {
    getBlobMock.mockImplementation(
      async () =>
        createBlobResult(validPdf, "another/path"),
    );

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(400);
    expectNoDocumentCreation();
  });

  it("rejects a Blob whose MIME type differs from the signed intent", async () => {
    getBlobMock.mockImplementation(
      async (blobPath: string) =>
        createBlobResult(validPdf, blobPath, {
          contentType: "image/png",
        }),
    );

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(400);
    expectNoDocumentCreation();
  });

  it("rejects a Blob whose size differs from the signed intent", async () => {
    getBlobMock.mockImplementation(
      async (blobPath: string) =>
        createBlobResult(validPdf, blobPath, {
          size: validPdf.length + 1,
        }),
    );

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(400);
    expectNoDocumentCreation();
  });

it("rejects invalid file bytes without creating a Document", async () => {
  const invalidFile = Buffer.from(
    "This is not a PDF file",
    "utf8",
  );

  prismaMock.documentUploadIntent.findFirst.mockResolvedValue(
    createPersistedIntent({
      fileSize: invalidFile.length,
    }),
  );

  const response = await POST(
    createRequest(invalidFile),
  );

  expect(response.status).toBe(400);
  expectNoDocumentCreation();
});

  it("creates a pending Document and finalizes its intent in one transaction", async () => {
    const persistedDocument = {
      id: "document-1",
      documentType: "Company Registration Certificate",
      fileName: "certificate.pdf",
      fileSize: validPdf.length,
      mimeType: "application/pdf",
      status: "PENDING",
      uploadedAt: new Date(),
    };
    transactionDocumentCreateMock.mockResolvedValue(
      persistedDocument,
    );

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(201);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

    expect(transactionDocumentCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          documentType: "Company Registration Certificate",
          fileName: "certificate.pdf",
          filePath: pathname,
          fileSize: validPdf.length,
          mimeType: "application/pdf",
          organizationId,
          verified: false,
          status: "PENDING",
        }),
      }),
    );

    expect(transactionIntentUpdateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: intentId,
          status: "FINALIZING",
        }),
        data: expect.objectContaining({
          status: "FINALIZED",
          documentId: "document-1",
          finalizedAt: expect.any(Date),
          finalizationLeaseExpiresAt: null,
        }),
      }),
    );

    expect(response.status).toBe(201);
  });

  it("does not report success if the final intent transition cannot be completed", async () => {
    transactionIntentUpdateManyMock.mockResolvedValue({
      count: 0,
    });

    const response = await POST(createRequest(validPdf));

    expect(response.status).toBe(500);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("returns one success and one conflict when the same intent is finalized concurrently", async () => {
    let claimCount = 0;

    prismaMock.documentUploadIntent.updateMany.mockImplementation(
      async () => {
        claimCount += 1;

        return {
          count: claimCount === 1 ? 1 : 0,
        };
      },
    );

    const [firstResponse, secondResponse] =
      await Promise.all([
        POST(createRequest(validPdf)),
        POST(createRequest(validPdf)),
      ]);

    expect(
      [firstResponse.status, secondResponse.status].sort(),
    ).toEqual([201, 409]);

    expect(
      prismaMock.documentUploadIntent.updateMany,
    ).toHaveBeenCalledTimes(2);

    expect(getBlobMock).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });
});
