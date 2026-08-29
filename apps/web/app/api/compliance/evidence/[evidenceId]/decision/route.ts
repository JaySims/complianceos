import {
  NextRequest,
} from "next/server";

import {
  resolveOrganizationAccess,
} from "@/lib/auth/organizationAccess";

import {
  decideComplianceEvidence,
} from "@/lib/compliance/evidenceMutationService";

import {
  evidenceMutationHttpResponse,
  evidenceOrganizationAccessFailure,
  invalidEvidenceRequest,
  validateEvidenceDecisionHttpInput,
} from "@/lib/compliance/evidenceHttp";


type EvidenceDecisionRouteContext = {
  params: Promise<{
    evidenceId: string;
  }>;
};


/*
 * ============================================================
 * POST /api/compliance/evidence/[evidenceId]/decision
 * ============================================================
 *
 * Applies a reviewer decision to Evidence.
 *
 * Only VERIFIED and REJECTED enter through HTTP.
 * Reviewer identity is never accepted from the request.
 * The domain service derives reviewer identity from the
 * authenticated OrganizationAccessContext.
 * ============================================================
 */

export async function POST(
  req: NextRequest,
  context: EvidenceDecisionRouteContext
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

  const {
    evidenceId,
  } = await context.params;

  if (
    typeof evidenceId !== "string" ||
    evidenceId.trim().length === 0
  ) {
    return invalidEvidenceRequest(
      "evidenceId is required."
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
    validateEvidenceDecisionHttpInput(
      body
    );

  if (!validation.success) {
    return invalidEvidenceRequest(
      validation.message
    );
  }

  const result =
    await decideComplianceEvidence(
      access.context,
      evidenceId.trim(),
      validation.value.decision,
      validation.value.notes
    );

  return evidenceMutationHttpResponse(
    result
  );
}
