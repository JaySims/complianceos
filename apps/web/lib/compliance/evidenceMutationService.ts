import {
  EvidenceVerificationStatus,
  OrganizationMemberRole,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  OrganizationAccessContext,
} from "@/lib/auth/organizationAccess";

import {
  recalculateAssessmentCompliance,
} from "@/lib/compliance/complianceRecalculationOrchestrator";

/*
 * ============================================================
 * COMPLIANCEOS — EVIDENCE MUTATION SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Establish the authoritative application mutation boundary for
 * Compliance Evidence.
 *
 * This service is responsible for:
 *
 * - organization-scoped Evidence creation;
 * - pending Evidence metadata changes;
 * - pending Evidence deletion;
 * - Evidence verification decisions;
 * - tenant/framework/document integrity;
 * - reviewer identity attribution;
 * - invoking the locked compliance recalculation orchestrator
 *   after committed truth-changing mutations.
 *
 * This service is NOT responsible for:
 *
 * - binary file upload;
 * - storage infrastructure;
 * - calculating compliance scores;
 * - persisting Assessment.score directly;
 * - persisting Organization.complianceScore directly;
 * - Current Assessment Authority;
 * - Trust Score;
 * - Executive AI;
 * - Workflow progress.
 *
 * ============================================================
 */


/*
 * ============================================================
 * ROLE POLICY
 * ============================================================
 */

const EVIDENCE_READ_ROLES =
  new Set<OrganizationMemberRole>([
    OrganizationMemberRole.OWNER,
    OrganizationMemberRole.ADMIN,
    OrganizationMemberRole.MANAGER,
    OrganizationMemberRole.AUDITOR,
    OrganizationMemberRole.MEMBER,
  ]);

const EVIDENCE_SUBMIT_ROLES =
  new Set<OrganizationMemberRole>([
    OrganizationMemberRole.OWNER,
    OrganizationMemberRole.ADMIN,
    OrganizationMemberRole.MANAGER,
    OrganizationMemberRole.MEMBER,
  ]);

const EVIDENCE_VERIFY_ROLES =
  new Set<OrganizationMemberRole>([
    OrganizationMemberRole.OWNER,
    OrganizationMemberRole.ADMIN,
    OrganizationMemberRole.AUDITOR,
  ]);


export function canReadComplianceEvidence(
  role: OrganizationMemberRole
): boolean {
  return EVIDENCE_READ_ROLES.has(role);
}


export function canSubmitComplianceEvidence(
  role: OrganizationMemberRole
): boolean {
  return EVIDENCE_SUBMIT_ROLES.has(role);
}


export function canVerifyComplianceEvidence(
  role: OrganizationMemberRole
): boolean {
  return EVIDENCE_VERIFY_ROLES.has(role);
}


/*
 * ============================================================
 * RESULT CONTRACT
 * ============================================================
 */

export type EvidenceMutationFailureReason =
  | "EVIDENCE_WRITE_FORBIDDEN"
  | "EVIDENCE_VERIFICATION_FORBIDDEN"
  | "ASSESSMENT_NOT_FOUND"
  | "ASSESSMENT_ACCESS_DENIED"
  | "REQUIREMENT_NOT_FOUND"
  | "REQUIREMENT_FRAMEWORK_MISMATCH"
  | "DOCUMENT_NOT_FOUND"
  | "DOCUMENT_ACCESS_DENIED"
  | "EVIDENCE_NOT_FOUND"
  | "EVIDENCE_ACCESS_DENIED"
  | "EVIDENCE_NOT_PENDING"
  | "INVALID_EVIDENCE_STATUS"
  | "EVIDENCE_CHANGED_DURING_MUTATION"
  | "EVIDENCE_MUTATION_FAILED"
  | "MUTATION_COMMITTED_RECALCULATION_FAILED";


export type EvidenceMutationRecord = {
  id: string;
  title: string;
  fileUrl: string;
  assessmentId: string;
  documentId: string | null;
  requirementId: string | null;
  status: EvidenceVerificationStatus;
  verifiedAt: Date | null;
  verifiedById: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};


export type EvidenceMutationSuccess = {
  success: true;
  evidence: EvidenceMutationRecord;
  recalculated: boolean;
};


export type EvidenceMutationFailure = {
  success: false;
  reason: EvidenceMutationFailureReason;
  message: string;
  mutationCommitted: boolean;
};


export type EvidenceMutationResult =
  | EvidenceMutationSuccess
  | EvidenceMutationFailure;


/*
 * ============================================================
 * INPUT CONTRACTS
 * ============================================================
 */

export type CreateEvidenceInput = {
  assessmentId: string;
  requirementId?: string | null;
  documentId?: string | null;
  title: string;
  fileUrl: string;
  notes?: string | null;
};


export type UpdatePendingEvidenceInput = {
  title?: string;
  fileUrl?: string;
  requirementId?: string | null;
  documentId?: string | null;
  notes?: string | null;
};


export type EvidenceVerificationDecision =
  | "VERIFIED"
  | "REJECTED";


export function isEvidenceVerificationDecision(
  status: EvidenceVerificationStatus
): status is EvidenceVerificationDecision {
  return (
    status === EvidenceVerificationStatus.VERIFIED ||
    status === EvidenceVerificationStatus.REJECTED
  );
}


export function doesPendingEvidenceUpdateRequireRecalculation(
  input: UpdatePendingEvidenceInput
): boolean {
  return (
    input.requirementId !== undefined ||
    input.documentId !== undefined
  );
}


/*
 * ============================================================
 * INTERNAL SELECT
 * ============================================================
 */

const evidenceSelect = {
  id: true,
  title: true,
  fileUrl: true,
  assessmentId: true,
  documentId: true,
  requirementId: true,
  status: true,
  verifiedAt: true,
  verifiedById: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EvidenceSelect;


/*
 * ============================================================
 * NORMALIZATION
 * ============================================================
 */

function normalizeRequiredText(
  value: string
): string {
  return value.trim();
}


function normalizeOptionalText(
  value: string | null | undefined
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}


/*
 * ============================================================
 * INTERNAL FAILURE
 * ============================================================
 */

class EvidenceMutationInvariantError extends Error {
  reason: EvidenceMutationFailureReason;

  constructor(
    reason: EvidenceMutationFailureReason,
    message: string
  ) {
    super(message);

    this.name =
      "EvidenceMutationInvariantError";

    this.reason =
      reason;
  }
}


/*
 * ============================================================
 * ASSESSMENT INTEGRITY
 * ============================================================
 */

async function requireAuthorizedAssessment(
  database: Prisma.TransactionClient,
  organizationId: string,
  assessmentId: string
) {
  const assessment =
    await database.assessment.findUnique({
      where: {
        id: assessmentId,
      },

      select: {
        id: true,
        organizationId: true,
        frameworkId: true,
      },
    });

  if (!assessment) {
    throw new EvidenceMutationInvariantError(
      "ASSESSMENT_NOT_FOUND",
      "The compliance assessment does not exist."
    );
  }

  if (
    assessment.organizationId !==
    organizationId
  ) {
    throw new EvidenceMutationInvariantError(
      "ASSESSMENT_ACCESS_DENIED",
      "The compliance assessment belongs to another organisation."
    );
  }

  return assessment;
}


/*
 * ============================================================
 * REQUIREMENT INTEGRITY
 * ============================================================
 */

async function validateRequirement(
  database: Prisma.TransactionClient,
  requirementId: string | null,
  frameworkId: string
) {
  if (!requirementId) {
    return;
  }

  const requirement =
    await database.complianceRequirement.findUnique({
      where: {
        id: requirementId,
      },

      select: {
        id: true,
        frameworkId: true,
      },
    });

  if (!requirement) {
    throw new EvidenceMutationInvariantError(
      "REQUIREMENT_NOT_FOUND",
      "The compliance requirement does not exist."
    );
  }

  if (
    requirement.frameworkId !==
    frameworkId
  ) {
    throw new EvidenceMutationInvariantError(
      "REQUIREMENT_FRAMEWORK_MISMATCH",
      "The compliance requirement does not belong to the assessment framework."
    );
  }
}


/*
 * ============================================================
 * DOCUMENT INTEGRITY
 * ============================================================
 */

async function validateDocument(
  database: Prisma.TransactionClient,
  documentId: string | null,
  organizationId: string
) {
  if (!documentId) {
    return;
  }

  const document =
    await database.document.findUnique({
      where: {
        id: documentId,
      },

      select: {
        id: true,
        organizationId: true,
      },
    });

  if (!document) {
    throw new EvidenceMutationInvariantError(
      "DOCUMENT_NOT_FOUND",
      "The compliance document does not exist."
    );
  }

  if (
    document.organizationId !==
    organizationId
  ) {
    throw new EvidenceMutationInvariantError(
      "DOCUMENT_ACCESS_DENIED",
      "The compliance document belongs to another organisation."
    );
  }
}


/*
 * ============================================================
 * RECALCULATION
 * ============================================================
 */

async function recalculateCommittedEvidence(
  organizationId: string,
  assessmentId: string,
  evidence: EvidenceMutationRecord
): Promise<EvidenceMutationResult> {
  const recalculation =
    await recalculateAssessmentCompliance(
      organizationId,
      assessmentId
    );

  if (!recalculation.success) {
    return {
      success: false,
      reason:
        "MUTATION_COMMITTED_RECALCULATION_FAILED",
      message:
        "Evidence was committed successfully, but compliance recalculation did not complete.",
      mutationCommitted: true,
    };
  }

  return {
    success: true,
    evidence,
    recalculated: true,
  };
}


/*
 * ============================================================
 * CREATE EVIDENCE
 * ============================================================
 */

export async function createComplianceEvidence(
  context: OrganizationAccessContext,
  input: CreateEvidenceInput
): Promise<EvidenceMutationResult> {
  if (
    !canSubmitComplianceEvidence(
      context.membership.role
    )
  ) {
    return {
      success: false,
      reason: "EVIDENCE_WRITE_FORBIDDEN",
      message:
        "You do not have permission to submit compliance evidence.",
      mutationCommitted: false,
    };
  }

  const organizationId =
    context.organization.id;

  try {
    const evidence =
      await prisma.$transaction(
        async (transaction) => {
          const assessment =
            await requireAuthorizedAssessment(
              transaction,
              organizationId,
              input.assessmentId
            );

          const requirementId =
            input.requirementId ?? null;

          const documentId =
            input.documentId ?? null;

          await validateRequirement(
            transaction,
            requirementId,
            assessment.frameworkId
          );

          await validateDocument(
            transaction,
            documentId,
            organizationId
          );

          return transaction.evidence.create({
            data: {
              title:
                normalizeRequiredText(
                  input.title
                ),

              fileUrl:
                normalizeRequiredText(
                  input.fileUrl
                ),

              assessmentId:
                assessment.id,

              requirementId,
              documentId,

              status:
                EvidenceVerificationStatus.PENDING,

              verifiedAt:
                null,

              verifiedById:
                null,

              notes:
                normalizeOptionalText(
                  input.notes
                ),
            },

            select:
              evidenceSelect,
          });
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
        }
      );

    return recalculateCommittedEvidence(
      organizationId,
      evidence.assessmentId,
      evidence
    );
  } catch (error) {
    if (
      error instanceof
      EvidenceMutationInvariantError
    ) {
      return {
        success: false,
        reason: error.reason,
        message: error.message,
        mutationCommitted: false,
      };
    }

    return {
      success: false,
      reason:
        "EVIDENCE_MUTATION_FAILED",
      message:
        "Compliance evidence could not be created safely.",
      mutationCommitted: false,
    };
  }
}


/*
 * ============================================================
 * UPDATE PENDING EVIDENCE
 * ============================================================
 */

export async function updatePendingComplianceEvidence(
  context: OrganizationAccessContext,
  evidenceId: string,
  input: UpdatePendingEvidenceInput
): Promise<EvidenceMutationResult> {
  if (
    !canSubmitComplianceEvidence(
      context.membership.role
    )
  ) {
    return {
      success: false,
      reason: "EVIDENCE_WRITE_FORBIDDEN",
      message:
        "You do not have permission to modify compliance evidence.",
      mutationCommitted: false,
    };
  }

  const organizationId =
    context.organization.id;

  try {
    const evidence =
      await prisma.$transaction(
        async (transaction) => {
          const existing =
            await transaction.evidence.findUnique({
              where: {
                id: evidenceId,
              },

              select: {
                ...evidenceSelect,

                assessment: {
                  select: {
                    organizationId: true,
                    frameworkId: true,
                  },
                },
              },
            });

          if (!existing) {
            throw new EvidenceMutationInvariantError(
              "EVIDENCE_NOT_FOUND",
              "The compliance evidence does not exist."
            );
          }

          if (
            existing.assessment.organizationId !==
            organizationId
          ) {
            throw new EvidenceMutationInvariantError(
              "EVIDENCE_ACCESS_DENIED",
              "The compliance evidence belongs to another organisation."
            );
          }

          if (
            existing.status !==
            EvidenceVerificationStatus.PENDING
          ) {
            throw new EvidenceMutationInvariantError(
              "EVIDENCE_NOT_PENDING",
              "Only pending compliance evidence may be edited."
            );
          }

          const requirementId =
            input.requirementId === undefined
              ? existing.requirementId
              : input.requirementId;

          const documentId =
            input.documentId === undefined
              ? existing.documentId
              : input.documentId;

          await validateRequirement(
            transaction,
            requirementId,
            existing.assessment.frameworkId
          );

          await validateDocument(
            transaction,
            documentId,
            organizationId
          );

          const updated =
            await transaction.evidence.updateMany({
              where: {
                id: existing.id,
                assessmentId:
                  existing.assessmentId,
                status:
                  EvidenceVerificationStatus.PENDING,
                updatedAt:
                  existing.updatedAt,
              },

              data: {
                title:
                  input.title === undefined
                    ? existing.title
                    : normalizeRequiredText(
                        input.title
                      ),

                fileUrl:
                  input.fileUrl === undefined
                    ? existing.fileUrl
                    : normalizeRequiredText(
                        input.fileUrl
                      ),

                requirementId,
                documentId,

                notes:
                  input.notes === undefined
                    ? existing.notes
                    : normalizeOptionalText(
                        input.notes
                      ),
              },
            });

          if (updated.count !== 1) {
            throw new EvidenceMutationInvariantError(
              "EVIDENCE_CHANGED_DURING_MUTATION",
              "Compliance evidence changed while the update was being applied."
            );
          }

          const persisted =
            await transaction.evidence.findUnique({
              where: {
                id: existing.id,
              },

              select:
                evidenceSelect,
            });

          if (!persisted) {
            throw new EvidenceMutationInvariantError(
              "EVIDENCE_CHANGED_DURING_MUTATION",
              "Compliance evidence could not be confirmed after update."
            );
          }

          return persisted;
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
        }
      );

    const complianceMeaningChanged =
      doesPendingEvidenceUpdateRequireRecalculation(
        input
      );

    if (!complianceMeaningChanged) {
      return {
        success: true,
        evidence,
        recalculated: false,
      };
    }

    return recalculateCommittedEvidence(
      organizationId,
      evidence.assessmentId,
      evidence
    );
  } catch (error) {
    if (
      error instanceof
      EvidenceMutationInvariantError
    ) {
      return {
        success: false,
        reason: error.reason,
        message: error.message,
        mutationCommitted: false,
      };
    }

    return {
      success: false,
      reason:
        "EVIDENCE_MUTATION_FAILED",
      message:
        "Compliance evidence could not be updated safely.",
      mutationCommitted: false,
    };
  }
}


/*
 * ============================================================
 * VERIFY / REJECT EVIDENCE
 * ============================================================
 */

export async function decideComplianceEvidence(
  context: OrganizationAccessContext,
  evidenceId: string,
  decision: EvidenceVerificationDecision,
  notes?: string | null
): Promise<EvidenceMutationResult> {
  if (
    !canVerifyComplianceEvidence(
      context.membership.role
    )
  ) {
    return {
      success: false,
      reason:
        "EVIDENCE_VERIFICATION_FORBIDDEN",
      message:
        "You do not have permission to verify compliance evidence.",
      mutationCommitted: false,
    };
  }

  if (
    !isEvidenceVerificationDecision(
      decision
    )
  ) {
    return {
      success: false,
      reason: "INVALID_EVIDENCE_STATUS",
      message:
        "Evidence may only be verified or rejected through this operation.",
      mutationCommitted: false,
    };
  }

  const organizationId =
    context.organization.id;

  try {
    const evidence =
      await prisma.$transaction(
        async (transaction) => {
          const existing =
            await transaction.evidence.findUnique({
              where: {
                id: evidenceId,
              },

              select: {
                ...evidenceSelect,

                assessment: {
                  select: {
                    organizationId: true,
                  },
                },
              },
            });

          if (!existing) {
            throw new EvidenceMutationInvariantError(
              "EVIDENCE_NOT_FOUND",
              "The compliance evidence does not exist."
            );
          }

          if (
            existing.assessment.organizationId !==
            organizationId
          ) {
            throw new EvidenceMutationInvariantError(
              "EVIDENCE_ACCESS_DENIED",
              "The compliance evidence belongs to another organisation."
            );
          }

          const updated =
            await transaction.evidence.updateMany({
              where: {
                id: existing.id,
                assessmentId:
                  existing.assessmentId,
                status:
                  existing.status,
                updatedAt:
                  existing.updatedAt,
              },

              data: {
                status:
                  decision,

                verifiedAt:
                  new Date(),

                verifiedById:
                  context.user.id,

                notes:
                  normalizeOptionalText(
                    notes
                  ),
              },
            });

          if (updated.count !== 1) {
            throw new EvidenceMutationInvariantError(
              "EVIDENCE_CHANGED_DURING_MUTATION",
              "Compliance evidence changed while the verification decision was being applied."
            );
          }

          const persisted =
            await transaction.evidence.findUnique({
              where: {
                id: existing.id,
              },

              select:
                evidenceSelect,
            });

          if (!persisted) {
            throw new EvidenceMutationInvariantError(
              "EVIDENCE_CHANGED_DURING_MUTATION",
              "Compliance evidence could not be confirmed after verification."
            );
          }

          return persisted;
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
        }
      );

    return recalculateCommittedEvidence(
      organizationId,
      evidence.assessmentId,
      evidence
    );
  } catch (error) {
    if (
      error instanceof
      EvidenceMutationInvariantError
    ) {
      return {
        success: false,
        reason: error.reason,
        message: error.message,
        mutationCommitted: false,
      };
    }

    return {
      success: false,
      reason:
        "EVIDENCE_MUTATION_FAILED",
      message:
        "The compliance evidence verification decision could not be applied safely.",
      mutationCommitted: false,
    };
  }
}
