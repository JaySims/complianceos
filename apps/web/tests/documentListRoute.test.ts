
import { NextRequest } from "next/server";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  prismaMock,
  resolveOrganizationAccessMock,
  canReadOrganizationWorkflowMock,
} = vi.hoisted(() => ({
  prismaMock: {
    document: {
      findMany: vi.fn(),
    },
  },
  resolveOrganizationAccessMock: vi.fn(),
  canReadOrganizationWorkflowMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/auth/organizationAccess", () => ({
  resolveOrganizationAccess: resolveOrganizationAccessMock,
  canReadOrganizationWorkflow:
    canReadOrganizationWorkflowMock,
}));

import { GET } from "@/app/api/documents/route";

const organizationId = "organization-1";

const context = {
  user: {
    id: "user-1",
  },
  organization: {
    id: organizationId,
  },
  membership: {
    role: "OWNER",
  },
};

function createRequest() {
  return new NextRequest(
    "http://localhost:3000/api/documents",
  );
}

describe("GET /api/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    resolveOrganizationAccessMock.mockResolvedValue({
      authorized: true,
      context,
    });

    canReadOrganizationWorkflowMock.mockReturnValue(true);

    prismaMock.document.findMany.mockResolvedValue([]);
  });

  it("rejects unauthenticated requests without querying documents", async () => {
    resolveOrganizationAccessMock.mockResolvedValue({
      authorized: false,
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(401);

    expect(prismaMock.document.findMany)
      .not.toHaveBeenCalled();
  });

  it("rejects users without document-read permission", async () => {
    canReadOrganizationWorkflowMock.mockReturnValue(false);

    const response = await GET(createRequest());

    expect(response.status).toBe(403);

    expect(prismaMock.document.findMany)
      .not.toHaveBeenCalled();
  });

  it("retrieves documents scoped to the authorized organization", async () => {
    const uploadedAt = new Date("2026-11-08T08:00:00.000Z");

    const documents = [
      {
        id: "document-1",
        documentType: "Company Registration Certificate",
        fileName: "registration.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        verified: false,
        status: "PENDING",
        issuedAt: null,
        expiresAt: null,
        verifiedAt: null,
        uploadedAt,
        updatedAt: uploadedAt,
      },
    ];

    prismaMock.document.findMany.mockResolvedValue(documents);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);

    expect(prismaMock.document.findMany).toHaveBeenCalledWith({
      where: {
        organizationId,
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

    expect(await response.json()).toEqual({
      documents: [
        {
          ...documents[0],
          uploadedAt: uploadedAt.toISOString(),
          updatedAt: uploadedAt.toISOString(),
        },
      ],
    });
  });

  it("does not expose private storage paths", async () => {
    prismaMock.document.findMany.mockResolvedValue([
      {
        id: "document-1",
        documentType: "Company Registration Certificate",
        fileName: "registration.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        verified: false,
        status: "PENDING",
        issuedAt: null,
        expiresAt: null,
        verifiedAt: null,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const response = await GET(createRequest());

    const body = await response.json();

    expect(body.documents[0]).not.toHaveProperty("filePath");
    expect(body.documents[0]).not.toHaveProperty("uploadUrl");
  });

  it("returns an empty list when the organization has no documents", async () => {
    prismaMock.document.findMany.mockResolvedValue([]);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      documents: [],
    });
  });

  it("returns a safe error when document retrieval fails", async () => {
    prismaMock.document.findMany.mockRejectedValue(
      new Error("Database failure"),
    );

    const response = await GET(createRequest());

    expect(response.status).toBe(500);

    expect(await response.json()).toEqual({
      error:
        "Unable to retrieve organisation documents. Please try again.",
    });
  });

  it("prevents shared caching of document metadata", async () => {
    const response = await GET(createRequest());

    expect(response.headers.get("Cache-Control")).toBe(
      "private, no-store, max-age=0",
    );
  });
});
