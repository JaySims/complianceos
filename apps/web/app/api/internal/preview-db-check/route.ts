
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPECTED_PREVIEW_PROJECT = "odcuycqxohsavpnhwzgi";

type ConnectionInspection = {
  configured: boolean;
  hostname: string | null;
  connectionType: "supabase_direct" | "supabase_pooler" | "other" | "unknown";
  provider: "supabase" | "unknown";
  projectRef: string | null;
  usesDirectConnection: boolean;
  matchesExpectedProject: boolean;
};

function inspectConnection(
  value: string | undefined,
): ConnectionInspection {
  const result: ConnectionInspection = {
    configured: Boolean(value),
    hostname: null,
    connectionType: "unknown",
    provider: "unknown",
    projectRef: null,
    usesDirectConnection: false,
    matchesExpectedProject: false,
  };

  if (!value) return result;

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();

    result.hostname = hostname;

    const directMatch = hostname.match(
      /^db\.([a-z0-9]+)\.supabase\.co$/,
    );

    if (directMatch) {
      result.provider = "supabase";
      result.connectionType = "supabase_direct";
      result.projectRef = directMatch[1];
      result.usesDirectConnection = true;
      result.matchesExpectedProject =
        directMatch[1] === EXPECTED_PREVIEW_PROJECT;

      return result;
    }

    if (/^[a-z0-9-]+\.pooler\.supabase\.com$/.test(hostname)) {
      result.provider = "supabase";
      result.connectionType = "supabase_pooler";
      return result;
    }

    result.connectionType = "other";
    return result;
  } catch {
    return result;
  }
}

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const database = inspectConnection(process.env.DATABASE_URL);
  const direct = inspectConnection(process.env.DIRECT_URL);

  return NextResponse.json(
    {
      environment: process.env.VERCEL_ENV,
      expectedPreviewProject: EXPECTED_PREVIEW_PROJECT,
      database,
      direct,
      checks: {
        databaseUsesDirectConnection: database.usesDirectConnection,
        directUsesDirectConnection: direct.usesDirectConnection,
        databaseMatchesExpectedProject:
          database.matchesExpectedProject,
        directMatchesExpectedProject:
          direct.matchesExpectedProject,
        bothUseDirectConnections:
          database.usesDirectConnection &&
          direct.usesDirectConnection,
        bothMatchExpectedProject:
          database.matchesExpectedProject &&
          direct.matchesExpectedProject,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
