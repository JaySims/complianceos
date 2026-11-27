
import { NextRequest } from "next/server";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { cleanupExpiredUploadIntentsMock } = vi.hoisted(() => ({
  cleanupExpiredUploadIntentsMock: vi.fn(),
}));

vi.mock("@/lib/documents/cleanupExpiredUploadIntents", () => ({
  cleanupExpiredUploadIntents: cleanupExpiredUploadIntentsMock,
}));

import {
  GET,
} from "@/app/api/cron/cleanup-upload-intents/route";

function createRequest(authorization?: string) {
  return new NextRequest(
    "http://localhost:3000/api/cron/cleanup-upload-intents",
    {
      method: "GET",
      headers: authorization
        ? { authorization }
        : {},
    },
  );
}

describe("upload-intent cleanup cron route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";

    cleanupExpiredUploadIntentsMock.mockResolvedValue({
      examined: 5,
      claimed: 3,
      deleted: 2,
      protected: 1,
      retried: 0,
      skipped: 0,
    });
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("rejects requests when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(
      createRequest("Bearer test-cron-secret"),
    );

    expect(response.status).toBe(503);

    expect(await response.json()).toEqual({
      error: "Scheduled cleanup is not configured.",
    });

    expect(
      cleanupExpiredUploadIntentsMock,
    ).not.toHaveBeenCalled();
  });

  it("rejects requests without authorization", async () => {
    const response = await GET(createRequest());

    expect(response.status).toBe(401);

    expect(await response.json()).toEqual({
      error: "Unauthorized.",
    });

    expect(
      cleanupExpiredUploadIntentsMock,
    ).not.toHaveBeenCalled();
  });

  it("rejects an incorrect cron secret", async () => {
    const response = await GET(
      createRequest("Bearer incorrect-secret"),
    );

    expect(response.status).toBe(401);

    expect(
      cleanupExpiredUploadIntentsMock,
    ).not.toHaveBeenCalled();
  });

  it("runs cleanup when authorization is valid", async () => {
    const response = await GET(
      createRequest("Bearer test-cron-secret"),
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      success: true,
      examined: 5,
      claimed: 3,
      deleted: 2,
      protected: 1,
      retried: 0,
      skipped: 0,
    });

    expect(
      cleanupExpiredUploadIntentsMock,
    ).toHaveBeenCalledTimes(1);

    expect(response.headers.get("Cache-Control")).toBe(
      "no-store",
    );
  });

  it("returns a server error when cleanup fails", async () => {
    cleanupExpiredUploadIntentsMock.mockRejectedValue(
      new Error("Database unavailable"),
    );

    const response = await GET(
      createRequest("Bearer test-cron-secret"),
    );

    expect(response.status).toBe(500);

    expect(await response.json()).toEqual({
      error: "Upload-intent cleanup failed.",
    });
  });
});
