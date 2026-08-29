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
  evidenceMutationHttpResponse,
  evidenceOrganizationAccessFailure,
  invalidEvidenceRequest,
  validateCreateEvidenceHttpInput,
} from "@/lib/compliance/evidenceHttp";


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
