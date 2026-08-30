import {
  NextRequest,
} from "next/server";

import {
  resolveOrganizationAccess,
} from "@/lib/auth/organizationAccess";

import {
  createComplianceEvidence,
} from "@/lib/compliance/evidenceMutationService";

import {
  listAssessmentComplianceEvidence,
} from "@/lib/compliance/evidenceQueryService";

import {
  evidenceMutationHttpResponse,
  evidenceOrganizationAccessFailure,
  invalidEvidenceRequest,
  validateCreateEvidenceHttpInput,
} from "@/lib/compliance/evidenceHttp";

import {
  evidenceCollectionQueryHttpResponse,
} from "@/lib/compliance/evidenceQueryHttp";


/*
 * ============================================================
 * GET /api/compliance/evidence
 * ============================================================
 *
 * Returns Compliance Evidence for one Assessment inside the
 * authenticated user's authoritative organization.
 *
 * Query contract:
 *
 *   ?assessmentId=<assessmentId>
 *
 * HTTP owns:
 * - authentication entry;
 * - query parameter extraction;
 * - basic identifier validation;
 * - response translation.
 *
 * Query service owns:
 * - read-role authorization;
 * - Assessment ownership;
 * - Evidence tenant integrity;
 * - Requirement framework integrity;
 * - safe relational projection.
 *
 * Organization identity is never accepted from query params.
 * ============================================================
 */

export async function GET(
  req: NextRequest
) {
  const access =
    await resolveOrganizationAccess(
      req
    );

  if (!access.authorized) {
    return evidenceOrganizationAccessFailure(
      access.reason
    );
  }

  const assessmentId =
    req.nextUrl.searchParams.get(
      "assessmentId"
    );

  if (
    typeof assessmentId !== "string" ||
    assessmentId.trim().length === 0
  ) {
    return invalidEvidenceRequest(
      "assessmentId is required."
    );
  }

  const result =
    await listAssessmentComplianceEvidence(
      access.context,
      assessmentId.trim()
    );

  return evidenceCollectionQueryHttpResponse(
    result
  );
}


/*
 * ============================================================
 * POST /api/compliance/evidence
 * ============================================================
 *
 * Creates Evidence inside the authenticated user's
 * authoritative organization.
 *
 * HTTP owns:
 * - authentication entry
 * - request parsing
 * - request validation
 * - response translation
 *
 * Domain service owns:
 * - authorization policy
 * - tenant integrity
 * - framework integrity
 * - document integrity
 * - persistence
 * - compliance recalculation
 * ============================================================
 */

export async function POST(
  req: NextRequest
) {
  const access =
    await resolveOrganizationAccess(
      req
    );

  if (!access.authorized) {
    return evidenceOrganizationAccessFailure(
      access.reason
    );
  }

  let body: unknown;

  try {
    body =
      await req.json();
  } catch {
    return invalidEvidenceRequest();
  }

  const validation =
    validateCreateEvidenceHttpInput(
      body
    );

  if (!validation.success) {
    return invalidEvidenceRequest(
      validation.message
    );
  }

  const result =
    await createComplianceEvidence(
      access.context,
      validation.value
    );

  return evidenceMutationHttpResponse(
    result,
    201
  );
}
