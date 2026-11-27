
import { NextRequest } from "next/server";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { recoverExpiredUploadIntentsMock } = vi.hoisted(() => ({
  recoverExpiredUploadIntentsMock: vi.fn(),
}));

vi.mock("@/lib/documents/recoverExpiredUploadIntents", () => ({
  recoverExpiredUploadIntents: recoverExpiredUploadIntentsMock,
}));

import {
  GET,
} from "@/app/api/cron/recover-upload-intents/route";

function createRequest(authorization?: string) {
  return new NextRequest(
    "http://localhost:3000/api/cron/recover-upload-intents",
    {
      method: "GET",
      headers: authorization
        ? { authorization }
        : {},
    },
  );
}

describe("upload-intent recovery cron route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";

    recoverExpiredUploadIntentsMock.mockResolvedValue({
      examined: 3,
      recovered: 2,
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
      error: "Scheduled recovery is not configured.",
    });

    expect(
      recoverExpiredUploadIntentsMock,
    ).not.toHaveBeenCalled();
  });

  it("rejects requests without authorization", async () => {
    const response = await GET(createRequest());

    expect(response.status).toBe(401);

    expect(await response.json()).toEqual({
      error: "Unauthorized.",
    });

    expect(
      recoverExpiredUploadIntentsMock,
    ).not.toHaveBeenCalled();
  });

  it("rejects an incorrect cron secret", async () => {
    const response = await GET(
      createRequest("Bearer incorrect-secret"),
    );

    expect(response.status).toBe(401);

    expect(
      recoverExpiredUploadIntentsMock,
    ).not.toHaveBeenCalled();
  });

  it("runs recovery when authorization is valid", async () => {
    const response = await GET(
      createRequest("Bearer test-cron-secret"),
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      success: true,
      examined: 3,
      recovered: 2,
    });

    expect(
      recoverExpiredUploadIntentsMock,
    ).toHaveBeenCalledTimes(1);

    expect(response.headers.get("Cache-Control")).toBe(
      "no-store",
    );
  });

  it("returns a server error when recovery fails", async () => {
    recoverExpiredUploadIntentsMock.mockRejectedValue(
      new Error("Database unavailable"),
    );

    const response = await GET(
      createRequest("Bearer test-cron-secret"),
    );

    expect(response.status).toBe(500);

    expect(await response.json()).toEqual({
      error: "Upload-intent recovery failed.",
    });
  });
});
