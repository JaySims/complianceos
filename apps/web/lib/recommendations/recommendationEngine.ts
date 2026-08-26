import { ExecutiveIntelligence } from "@/lib/intelligence/executiveEngine";
import { TrustFactors } from "@/lib/trust/trustEngine";

export interface ExecutiveRecommendation {

  title: string;

  description: string;

  expectedTrustIncrease: number;

  priority: "Low" | "Medium" | "High" | "Critical";

  estimatedMinutes: number;

}

export function calculateExecutiveRecommendation(
  intelligence: ExecutiveIntelligence,
  factors: TrustFactors
): ExecutiveRecommendation {

  /*
   * Company Registration
   */

  if (!factors.companyRegistered) {

    return {

      title: "Register Organisation",

      description:
        "Complete Organisation Identity to establish your Digital Trust profile.",

      expectedTrustIncrease: 18,

      priority: "Critical",

      estimatedMinutes: 5,

    };

  }

  /*
   * Directors
   */

  if (!factors.directorsVerified) {

    return {

      title: "Verify Directors",

      description:
        "Director verification significantly increases organisational credibility.",

      expectedTrustIncrease: 12,

      priority: "High",

      estimatedMinutes: 6,

    };

  }

  /*
   * Governance
   */

  if (!factors.governanceCompleted) {

    return {

      title: "Complete Governance",

      description:
        "Governance unlocks Procurement and Funding readiness.",

      expectedTrustIncrease: 14,

      priority: "High",

      estimatedMinutes: 8,

    };

  }

  /*
   * Compliance
   */

  if (!factors.complianceCompleted) {

    return {

      title: "Complete Compliance",

      description:
        "Compliance verification improves Digital Trust and Business Health.",

      expectedTrustIncrease: 16,

      priority: "High",

      estimatedMinutes: 10,

    };

  }

  /*
   * Documents
   */

  if (factors.documentsUploaded < 5) {

    return {

      title: "Upload Supporting Documents",

      description:
        "Increase AI Confidence by completing your Document Vault.",

      expectedTrustIncrease: 8,

      priority: "Medium",

      estimatedMinutes: 5,

    };

  }

  /*
   * Funding
   */

  if (!factors.fundingReady) {

    return {

      title: "Prepare Funding Profile",

      description:
        "Complete your investment profile to unlock funding opportunities.",

      expectedTrustIncrease: 6,

      priority: "Medium",

      estimatedMinutes: 7,

    };

  }

  /*
   * Procurement
   */

  if (!factors.procurementReady) {

    return {

      title: "Improve Procurement Readiness",

      description:
        "Become procurement-ready for government and enterprise opportunities.",

      expectedTrustIncrease: 7,

      priority: "Medium",

      estimatedMinutes: 7,

    };

  }

  /*
   * AI Validation
   */

  if (!factors.aiValidated) {

    return {

      title: "Run AI Validation",

      description:
        "Allow ComplianceOS AI to validate your organisation profile.",

      expectedTrustIncrease: 5,

      priority: "Low",

      estimatedMinutes: 3,

    };

  }

  /*
   * Everything Complete
   */

  return {

    title: "Excellent Progress",

    description:
      "Your organisation is operating at an Executive level. Continue monitoring opportunities.",

    expectedTrustIncrease: 0,

    priority: "Low",

    estimatedMinutes: 0,

  };

}

