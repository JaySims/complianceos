import {
  AssessmentStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { canEstablishAssessmentAuthority } from "./assessmentAuthorityService";
import { loadFrameworkCatalogueGovernedState } from "./frameworkCatalogueGovernedStateLoader";
import { validateFrameworkCataloguePublicationIntegrity } from "./frameworkCataloguePublicationIntegrity";

export type EstablishOrganizationFrameworkInput = {
  organizationId: string;
  frameworkId: string;
  userId: string;
  title: string;
};

export type OrganizationFrameworkEstablishmentFailureReason =
  | "FRAMEWORK_NOT_FOUND"
  | "FRAMEWORK_NOT_PUBLISHED"
  | "FRAMEWORK_PUBLICATION_INVALID"
  | "USER_NOT_FOUND"
  | "USER_NOT_ACTIVE_ORGANIZATION_MEMBER"
  | "CURRENT_AUTHORITY_ALREADY_EXISTS"
  | "ESTABLISHMENT_TRANSACTION_FAILED";

export type OrganizationFrameworkEstablishmentResult =
  | {
      success: true;
      assessment: {
        id: string;
        title: string;
        score: number | null;
        status: AssessmentStatus;
        organizationId: string;
        frameworkId: string;
        userId: string;
      };
      authority: {
        organizationId: string;
        frameworkId: string;
        assessmentId: string;
      };
    }
  | {
      success: false;
      reason: OrganizationFrameworkEstablishmentFailureReason;
      message: string;
    };

function normalizeAssessmentTitle(title: string): string {
  const normalized = title.trim();

  return normalized.length > 0
    ? normalized
    : "Compliance Assessment";
}

class OrganizationFrameworkEstablishmentInvariantError extends Error {
  constructor(
    readonly reason: OrganizationFrameworkEstablishmentFailureReason,
    message: string
  ) {
    super(message);
    this.name =
      "OrganizationFrameworkEstablishmentInvariantError";
  }
}

export async function establishOrganizationFrameworkInTransaction(
  transaction: Prisma.TransactionClient,
  input: EstablishOrganizationFrameworkInput
): Promise<OrganizationFrameworkEstablishmentResult> {
  const framework = await transaction.framework.findUnique({
    where: { id: input.frameworkId },
    select: { id: true },
  });

  if (!framework) {
    throw new OrganizationFrameworkEstablishmentInvariantError(
      "FRAMEWORK_NOT_FOUND",
      "Compliance framework not found."
    );
  }

  const catalogueAuthority =
    await transaction.currentFrameworkCatalogueAuthority.findUnique({
      where: {
        frameworkId: framework.id,
      },
      select: {
        frameworkId: true,
        frameworkCatalogueApproval: {
          select: {
            frameworkId: true,
            contentManifest: true,
            contentHash: true,
            manifestAlgorithmVersion: true,
          },
        },
      },
    });

  if (!catalogueAuthority) {
    throw new OrganizationFrameworkEstablishmentInvariantError(
      "FRAMEWORK_NOT_PUBLISHED",
      "Compliance framework is not currently published for organization establishment."
    );
  }

  const governedStateResult =
    await loadFrameworkCatalogueGovernedState(
      transaction,
      framework.id
    );

  if (!governedStateResult.success) {
    throw new OrganizationFrameworkEstablishmentInvariantError(
      "FRAMEWORK_PUBLICATION_INVALID",
      "Published compliance framework could not be validated safely."
    );
  }

  const publicationIntegrity =
    validateFrameworkCataloguePublicationIntegrity({
      governedState: governedStateResult.governedState,
      approval:
        catalogueAuthority.frameworkCatalogueApproval,
    });

  if (!publicationIntegrity.success) {
    throw new OrganizationFrameworkEstablishmentInvariantError(
      "FRAMEWORK_PUBLICATION_INVALID",
      "Published compliance framework failed publication integrity validation."
    );
  }

  const user = await transaction.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });

  if (!user) {
    throw new OrganizationFrameworkEstablishmentInvariantError(
      "USER_NOT_FOUND",
      "Assessment user not found."
    );
  }

  const membership =
    await transaction.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: input.userId,
          organizationId: input.organizationId,
        },
      },
      select: { active: true },
    });

  if (!membership || !membership.active) {
    throw new OrganizationFrameworkEstablishmentInvariantError(
      "USER_NOT_ACTIVE_ORGANIZATION_MEMBER",
      "Assessment user is not an active member of the authorized organisation."
    );
  }

  const currentAuthority =
    await transaction.currentAssessmentAuthority.findUnique({
      where: {
        organizationId_frameworkId: {
          organizationId: input.organizationId,
          frameworkId: framework.id,
        },
      },
      select: {
        organizationId: true,
        frameworkId: true,
        assessmentId: true,
      },
    });

  if (currentAuthority) {
    throw new OrganizationFrameworkEstablishmentInvariantError(
      "CURRENT_AUTHORITY_ALREADY_EXISTS",
      "A current authoritative assessment already exists for this organisation and framework."
    );
  }

  const assessment =
    await transaction.assessment.create({
      data: {
        title: normalizeAssessmentTitle(input.title),
        score: null,
        status: AssessmentStatus.DRAFT,
        organizationId: input.organizationId,
        frameworkId: framework.id,
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        score: true,
        status: true,
        organizationId: true,
        frameworkId: true,
        userId: true,
      },
    });

  const policy = canEstablishAssessmentAuthority(
    input.organizationId,
    framework.id,
    assessment,
    currentAuthority
  );

  if (!policy.success) {
    throw new OrganizationFrameworkEstablishmentInvariantError(
      "ESTABLISHMENT_TRANSACTION_FAILED",
      "Assessment authority establishment invariant failed."
    );
  }

  const authority =
    await transaction.currentAssessmentAuthority.create({
      data: {
        organizationId: input.organizationId,
        frameworkId: framework.id,
        assessmentId: assessment.id,
      },
      select: {
        organizationId: true,
        frameworkId: true,
        assessmentId: true,
      },
    });

  return {
    success: true,
    assessment,
    authority,
  };
}

export async function establishOrganizationFramework(
  input: EstablishOrganizationFrameworkInput
): Promise<OrganizationFrameworkEstablishmentResult> {
  try {
    return await prisma.$transaction<OrganizationFrameworkEstablishmentResult>(
      (transaction: Prisma.TransactionClient) =>
        establishOrganizationFrameworkInTransaction(
          transaction,
          input
        ),
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (
      error instanceof
      OrganizationFrameworkEstablishmentInvariantError
    ) {
      return {
        success: false,
        reason: error.reason,
        message: error.message,
      };
    }

    return {
      success: false,
      reason: "ESTABLISHMENT_TRANSACTION_FAILED",
      message:
        "Organization compliance framework could not be established safely.",
    };
  }
}
