import {
  NextRequest,
} from "next/server";

import {
  resolveOrganizationAccess,
} from "@/lib/auth/organizationAccess";

import {
  updatePendingComplianceEvidence,
} from "@/lib/compliance/evidenceMutationService";

import {
  evidenceMutationHttpResponse,
  evidenceOrganizationAccessFailure,
  invalidEvidenceRequest,
  validateUpdateEvidenceHttpInput,
} from "@/lib/compliance/evidenceHttp";


type EvidenceRouteContext = {
  params: Promise<{
    evidenceId: string;
  }>;
};


/*
 * ============================================================
 * PATCH /api/compliance/evidence/[evidenceId]
 * ============================================================
 *
 * Updates mutable fields on PENDING Evidence.
 *
 * Evidence status and reviewer identity cannot be changed
 * through this endpoint.
 * ============================================================
 */

export async function PATCH(
  req: NextRequest,
  context: EvidenceRouteContext
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
    validateUpdateEvidenceHttpInput(
      body
    );

  if (!validation.success) {
    return invalidEvidenceRequest(
      validation.message
    );
  }

  const result =
    await updatePendingComplianceEvidence(
      access.context,
      evidenceId.trim(),
      validation.value
    );

  return evidenceMutationHttpResponse(
    result
  );
}
