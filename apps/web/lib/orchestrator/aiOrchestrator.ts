import type {
  ExecutiveContext,
} from "@/lib/executive/context";

import {
  generateExecutiveInsights,
  type ExecutiveInsight,
} from "@/lib/ai/executiveBrain";

/*
 * ============================================================
 * COMPLIANCEOS EXECUTIVE AI ORCHESTRATOR
 * ============================================================
 *
 * PURPOSE
 *
 * Coordinates Executive AI reasoning using authoritative,
 * organization-scoped ExecutiveContext supplied by the
 * authenticated API boundary.
 *
 * SECURITY BOUNDARY
 *
 * This orchestrator does NOT:
 *
 * - authenticate users
 * - verify JWTs
 * - resolve organization membership
 * - trust organization IDs supplied by the browser
 * - select tenants
 * - construct demo organization data
 *
 * Authentication, organization resolution, and context
 * construction must happen before executeExecutiveAI() is
 * called.
 *
 * ============================================================
 */

export type ExecutiveRequest = {
  message: string;

  context: ExecutiveContext;
};

export type ExecutiveResponse = {
  answer: string;

  insights: ExecutiveInsight[];
};

/*
 * ============================================================
 * MESSAGE NORMALIZATION
 * ============================================================
 */

function normalizeMessage(
  message: string
): string {
  return message.trim();
}

/*
 * ============================================================
 * PRIMARY PRIORITY
 * ============================================================
 */

function getPrimaryPriority(
  insights: ExecutiveInsight[]
): ExecutiveInsight | null {
  return insights[0] ?? null;
}

/*
 * ============================================================
 * EXECUTIVE ANSWER BUILDER
 * ============================================================
 */

function buildExecutiveAnswer(
  message: string,
  context: ExecutiveContext,
  insights: ExecutiveInsight[]
): string {
  /*
   * ExecutiveContext exposes the authenticated user's name as
   * fullName.
   */

  const executiveName =
    context.executive.fullName;

  const organizationName =
    context.organization.name;

  const primaryPriority =
    getPrimaryPriority(
      insights
    );

  const normalizedMessage =
    normalizeMessage(
      message
    );

  const greeting =
    executiveName.trim().length > 0
      ? `Good day ${executiveName}.`
      : "Good day.";

  const requestStatement =
    normalizedMessage.length > 0
      ? ` I understand you asked: "${normalizedMessage}"`
      : "";

  const organizationStatement =
    organizationName.trim().length > 0
      ? ` I am currently reasoning from the verified organisational context for ${organizationName}.`
      : "";

  const priorityStatement =
    primaryPriority
      ? ` Your highest current priority is ${primaryPriority.title}. ${primaryPriority.explanation}`
      : " No immediate executive priority was identified from the currently available organisational state.";

  return (
    greeting +
    requestStatement +
    organizationStatement +
    priorityStatement
  );
}

/*
 * ============================================================
 * EXECUTE EXECUTIVE AI
 * ============================================================
 */

export async function executeExecutiveAI(
  request: ExecutiveRequest
): Promise<ExecutiveResponse> {
  /*
   * Normalize browser-supplied natural-language input.
   */

  const message =
    normalizeMessage(
      request.message
    );

  /*
   * IMPORTANT:
   *
   * request.context must already have been constructed from
   * authenticated, database-authoritative organization access.
   *
   * The orchestrator intentionally performs no tenant
   * resolution itself.
   */

  const context =
    request.context;

  /*
   * Generate organization-specific Executive AI insights from
   * the authoritative context.
   */

  const insights =
    generateExecutiveInsights(
      context
    );

  /*
   * Build the deterministic Executive AI response.
   *
   * A model-backed reasoning layer can later be introduced
   * here while retaining the same authenticated context
   * boundary.
   */

  const answer =
    buildExecutiveAnswer(
      message,
      context,
      insights
    );

  return {
    answer,
    insights,
  };
}
