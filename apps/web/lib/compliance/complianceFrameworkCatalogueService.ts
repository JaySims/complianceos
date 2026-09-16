import { prisma } from "@/lib/prisma";

/*
 * ============================================================
 * COMPLIANCEOS — COMPLIANCE FRAMEWORK CATALOGUE SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Read the compliance framework catalogue currently persisted
 * in ComplianceOS.
 *
 * CATALOGUE SEMANTICS
 *
 * Framework existence means only that the framework exists in
 * the ComplianceOS catalogue.
 *
 * Framework existence does NOT establish:
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
 * applicability inference, or catalogue provisioning.
 *
 * An empty catalogue is a valid successful result.
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

export async function getComplianceFrameworkCatalogue():
  Promise<ComplianceFrameworkCatalogueResult> {
  try {
    const frameworks =
      await prisma.framework.findMany({
        orderBy: [
          {
            name: "asc",
          },
          {
            id: "asc",
          },
        ],

        select: {
          id: true,
          name: true,
          version: true,
          description: true,
        },
      });

    return {
      success: true,
      entries: frameworks,
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
