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
  getComplianceEvidence,
} from "@/lib/compliance/evidenceQueryService";

import {
  evidenceMutationHttpResponse,
  evidenceOrganizationAccessFailure,
  invalidEvidenceRequest,
  validateUpdateEvidenceHttpInput,
} from "@/lib/compliance/evidenceHttp";

import {
  evidenceQueryHttpResponse,
} from "@/lib/compliance/evidenceQueryHttp";


type EvidenceRouteContext = {
  params: Promise<{
    evidenceId: string;
  }>;
};


/*
 * ============================================================
 * GET /api/compliance/evidence/[evidenceId]
 * ============================================================
 *
 * Returns one Compliance Evidence record inside the
 * authenticated user's authoritative organization.
 *
 * HTTP owns:
 * - authentication entry;
 * - route parameter extraction;
 * - basic identifier validation;
 * - response translation.
 *
 * Query service owns:
 * - read-role authorization;
 * - Evidence ownership;
 * - linked Document tenant integrity;
 * - linked Requirement framework integrity;
 * - safe relational projection.
 *
 * Organization identity is never accepted from the request.
 * ============================================================
 */

export async function GET(
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

  const result =
    await getComplianceEvidence(
      access.context,
      evidenceId.trim()
    );

  return evidenceQueryHttpResponse(
    result
  );
}


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
