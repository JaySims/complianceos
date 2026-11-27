
import { NextRequest, NextResponse } from "next/server";

import {
  recoverExpiredUploadIntents,
} from "@/lib/documents/recoverExpiredUploadIntents";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "Scheduled recovery is not configured." },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const result = await recoverExpiredUploadIntents();

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Upload-intent recovery failed." },
      { status: 500 },
    );
  }
}
