import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  loadFrameworkCatalogueGovernedState,
} from "@/lib/compliance/frameworkCatalogueGovernedStateLoader";

import {
  validateFrameworkCataloguePublicationIntegrity,
} from "@/lib/compliance/frameworkCataloguePublicationIntegrity";

/*
 * ============================================================
 * COMPLIANCEOS — COMPLIANCE FRAMEWORK CATALOGUE SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Read the compliance framework catalogue currently authorized
 * for production exposure in ComplianceOS.
 *
 * CATALOGUE SEMANTICS
 *
 * Framework existence does NOT establish catalogue publication.
 *
 * Framework catalogue approval does NOT establish catalogue
 * publication.
 *
 * A framework is catalogue-visible only through explicit
 * CurrentFrameworkCatalogueAuthority and only while the exact
 * approval referenced by that authority remains publication-
 * integrity-valid against the live governed catalogue state.
 *
 * No current catalogue authority means the framework is not
 * published and is therefore absent from this catalogue.
 *
 * A current catalogue authority whose governed state or
 * publication integrity cannot be validated causes the catalogue
 * read to fail closed.
 *
 * Catalogue publication does NOT establish:
 *
 * - organisation applicability;
 * - organisation adoption;
 * - Assessment existence;
 * - Current Assessment Authority;
 * - compliance status;
 * - compliance score.
 *
 * Organisation authoritative framework membership is a separate
 * concern established only through CurrentAssessmentAuthority.
 *
 * READ-ONLY BOUNDARY
 *
 * This service performs no persistence, authority mutation,
 * applicability inference, catalogue provisioning, repair, or
 * fallback publication inference.
 *
 * An empty authoritative catalogue is a valid successful result.
 * ============================================================
 */

export type ComplianceFrameworkCatalogueEntry = {
  id: string;
  name: string;
  version: string | null;
  description: string | null;
};

export type ComplianceFrameworkCatalogueResult =
  | {
      success: true;
      entries: ComplianceFrameworkCatalogueEntry[];
    }
  | {
      success: false;
      reason: "FRAMEWORK_CATALOGUE_READ_FAILED";
      message: string;
    };

type DatabaseClient =
  | Prisma.TransactionClient
  | typeof prisma;

export async function getComplianceFrameworkCatalogueWithDatabase(
  db: DatabaseClient
): Promise<ComplianceFrameworkCatalogueResult> {
  try {
    const authorities =
      await db.currentFrameworkCatalogueAuthority.findMany({
        orderBy: [
          {
            framework: {
              name: "asc",
            },
          },
          {
            frameworkId: "asc",
          },
        ],

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

    const entries: ComplianceFrameworkCatalogueEntry[] = [];

    for (const authority of authorities) {
      const governedStateResult =
        await loadFrameworkCatalogueGovernedState(
          db,
          authority.frameworkId
        );

      if (!governedStateResult.success) {
        return {
          success: false,
          reason: "FRAMEWORK_CATALOGUE_READ_FAILED",
          message:
            "Unable to validate the published compliance framework catalogue.",
        };
      }

      const publicationIntegrity =
        validateFrameworkCataloguePublicationIntegrity({
          governedState: governedStateResult.governedState,
          approval: authority.frameworkCatalogueApproval,
        });

      if (!publicationIntegrity.success) {
        return {
          success: false,
          reason: "FRAMEWORK_CATALOGUE_READ_FAILED",
          message:
            "Unable to validate the published compliance framework catalogue.",
        };
      }

      entries.push({
        id: governedStateResult.governedState.framework.id,
        name: governedStateResult.governedState.framework.name,
        version: governedStateResult.governedState.framework.version,
        description:
          governedStateResult.governedState.framework.description,
      });
    }

    return {
      success: true,
      entries,
    };
  } catch {
    return {
      success: false,
      reason: "FRAMEWORK_CATALOGUE_READ_FAILED",
      message:
        "Unable to read the compliance framework catalogue.",
    };
  }
}

export async function getComplianceFrameworkCatalogue():
  Promise<ComplianceFrameworkCatalogueResult> {
  return getComplianceFrameworkCatalogueWithDatabase(prisma);
}
