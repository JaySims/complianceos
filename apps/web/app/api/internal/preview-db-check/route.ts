
import { timingSafeEqual } from "node:crypto";
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

    // Direct Supabase database connection:
    // db.<project-ref>.supabase.co
    const directMatch = hostname.match(
      /^db\.([a-z0-9]+)\.supabase\.co$/,
    );

    if (directMatch) {
      return directMatch[1];
    }

    // Supabase connection pooler:
    // <region>.pooler.supabase.com
    // Username: postgres.<project-ref>
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

function hasValidDiagnosticSecret(
  expected: string | undefined,
  supplied: string | null,
): boolean {
  if (!expected || !supplied) return false;

  const expectedBytes = Buffer.from(expected, "utf8");
  const suppliedBytes = Buffer.from(supplied, "utf8");

  if (expectedBytes.length !== suppliedBytes.length) {
    return false;
  }

  return timingSafeEqual(expectedBytes, suppliedBytes);
}

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  if (
    !hasValidDiagnosticSecret(
      process.env.PREVIEW_DIAGNOSTIC_SECRET,
      request.headers.get("x-preview-diagnostic-secret"),
    )
  ) {
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
      environment: "preview",
      database: {
        configured: Boolean(process.env.DATABASE_URL),
        provider: databaseRef ? "supabase" : "unknown",
        projectRef: databaseRef,
      },
      direct: {
        configured: Boolean(process.env.DIRECT_URL),
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
