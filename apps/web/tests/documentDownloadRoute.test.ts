
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
  getBlobMock,
} = vi.hoisted(() => ({
  prismaMock: {
    document: {
      findFirst: vi.fn(),
    },
  },
  resolveOrganizationAccessMock: vi.fn(),
  canReadOrganizationWorkflowMock: vi.fn(),
  getBlobMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/auth/organizationAccess", () => ({
  resolveOrganizationAccess: resolveOrganizationAccessMock,
  canReadOrganizationWorkflow:
    canReadOrganizationWorkflowMock,
}));

vi.mock("@vercel/blob", () => ({
  get: getBlobMock,
}));

import { GET } from "@/app/api/documents/[id]/download/route";

const organizationId = "organization-1";
const documentId = "document-1";

const pathname =
  `organizations/${organizationId}/documents/test-upload`;

const fileContents = "Private compliance document content";

const fileSize = Buffer.byteLength(fileContents);

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

const documentRecord = {
  id: documentId,
  fileName: "certificate.pdf",
  filePath: pathname,
  mimeType: "application/pdf",
  fileSize,
};

function createRequest() {
  return new NextRequest(
    `http://localhost:3000/api/documents/${documentId}/download`,
  );
}

function createRouteContext(id = documentId) {
  return {
    params: Promise.resolve({ id }),
  };
}

function createBlobResult(
  options: {
    blobPath?: string;
    contentType?: string;
    size?: number;
    contents?: string;
  } = {},
) {
  const contents = options.contents ?? fileContents;

  return {
    statusCode: 200,
    blob: {
      pathname: options.blobPath ?? pathname,
      contentType: options.contentType ?? "application/pdf",
      size: Object.prototype.hasOwnProperty.call(options, "size")
        ? options.size
        : Buffer.byteLength(contents),
    },
    stream: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(contents),
        );
        controller.close();
      },
    }),
  };
}

describe("GET /api/documents/[id]/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    resolveOrganizationAccessMock.mockResolvedValue({
      authorized: true,
      context,
    });

    canReadOrganizationWorkflowMock.mockReturnValue(true);

    prismaMock.document.findFirst.mockResolvedValue(
      documentRecord,
    );

    getBlobMock.mockResolvedValue(
      createBlobResult(),
    );
  });

  it("rejects unauthenticated requests without querying documents", async () => {
    resolveOrganizationAccessMock.mockResolvedValue({
      authorized: false,
    });

    const response = await GET(
      createRequest(),
      createRouteContext(),
    );

    expect(response.status).toBe(401);

    expect(prismaMock.document.findFirst)
      .not.toHaveBeenCalled();

    expect(getBlobMock).not.toHaveBeenCalled();
  });

  it("rejects users without document-read permission", async () => {
    canReadOrganizationWorkflowMock.mockReturnValue(false);

    const response = await GET(
      createRequest(),
      createRouteContext(),
    );

    expect(response.status).toBe(403);

    expect(prismaMock.document.findFirst)
      .not.toHaveBeenCalled();

    expect(getBlobMock).not.toHaveBeenCalled();
  });

  it("scopes document lookup to the authorized organization", async () => {
    prismaMock.document.findFirst.mockResolvedValue(null);

    const response = await GET(
      createRequest(),
      createRouteContext(),
    );

    expect(response.status).toBe(404);

    expect(prismaMock.document.findFirst).toHaveBeenCalledWith({
      where: {
        id: documentId,
        organizationId,
      },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        mimeType: true,
        fileSize: true,
      },
    });

    expect(getBlobMock).not.toHaveBeenCalled();
  });

  it("does not stream content when the private Blob is unavailable", async () => {
    getBlobMock.mockResolvedValue(null);

    const response = await GET(
      createRequest(),
      createRouteContext(),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Document content is unavailable.",
    });

    expect(getBlobMock).toHaveBeenCalledWith(
      pathname,
      {
        access: "private",
        useCache: false,
      },
    );
  });

  it("does not stream content when the Blob pathname does not match", async () => {
    getBlobMock.mockResolvedValue(
      createBlobResult({
        blobPath: "organizations/another-organization/documents/other-file",
      }),
    );

    const response = await GET(
      createRequest(),
      createRouteContext(),
    );

    expect(response.status).toBe(404);

    expect(await response.json()).toEqual({
      error: "Document content is unavailable.",
    });
  });

  it("rejects a Blob whose size differs from the database record", async () => {
    getBlobMock.mockResolvedValue(
      createBlobResult({
        size: fileSize + 1,
      }),
    );

    const response = await GET(
      createRequest(),
      createRouteContext(),
    );

    expect(response.status).toBe(404);

    expect(await response.json()).toEqual({
      error: "Document content is unavailable.",
    });
  });

  it("rejects a Blob with a missing size", async () => {
    getBlobMock.mockResolvedValue(
      createBlobResult({
        size: undefined,
      }),
    );

    const response = await GET(
      createRequest(),
      createRouteContext(),
    );

    expect(response.status).toBe(404);
  });

  it("rejects a Blob with an invalid size", async () => {
    getBlobMock.mockResolvedValue(
      createBlobResult({
        size: Number.NaN,
      }),
    );

    const response = await GET(
      createRequest(),
      createRouteContext(),
    );

    expect(response.status).toBe(404);
  });

  it("streams an authorized document with matching size and private response headers", async () => {
    const response = await GET(
      createRequest(),
      createRouteContext(),
    );

    expect(response.status).toBe(200);

    expect(await response.text()).toBe(fileContents);

    expect(response.headers.get("Content-Type"))
      .toBe("application/pdf");

    expect(response.headers.get("Content-Disposition"))
      .toBe('attachment; filename="certificate.pdf"');

    expect(response.headers.get("Content-Length"))
      .toBe(String(fileSize));

    expect(response.headers.get("X-Content-Type-Options"))
      .toBe("nosniff");

    expect(response.headers.get("Cache-Control"))
      .toBe("private, no-store, max-age=0");

    expect(response.headers.get("Pragma"))
      .toBe("no-cache");
  });
});
