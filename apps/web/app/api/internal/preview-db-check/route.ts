
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPECTED_PREVIEW_PROJECT = "odcuycqxohsavpnhwzgi";

function getSupabaseProjectReference(
  value: string | undefined,
): string | null {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();

    const directMatch = hostname.match(
      /^db\.([a-z0-9]+)\.supabase\.co$/,
    );

    if (directMatch) {
      return directMatch[1];
    }

    if (/^[a-z0-9-]+\.pooler\.supabase\.com$/.test(hostname)) {
      const username = decodeURIComponent(parsed.username);
      const poolerMatch = username.match(
        /^postgres\.([a-z0-9]+)$/i,
      );

      return poolerMatch?.[1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function GET(_request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const databaseRef = getSupabaseProjectReference(
    process.env.DATABASE_URL,
  );

  const directRef = getSupabaseProjectReference(
    process.env.DIRECT_URL,
  );

  return NextResponse.json(
    {
      environment: process.env.VERCEL_ENV,
      diagnostic: {
        databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
        directUrlConfigured: Boolean(process.env.DIRECT_URL),
      },
      database: {
        provider: databaseRef ? "supabase" : "unknown",
        projectRef: databaseRef,
      },
      direct: {
        provider: directRef ? "supabase" : "unknown",
        projectRef: directRef,
      },
      matches: {
        expectedPreviewProject: EXPECTED_PREVIEW_PROJECT,
        database: databaseRef === EXPECTED_PREVIEW_PROJECT,
        direct: directRef === EXPECTED_PREVIEW_PROJECT,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
