import { TrustFactors } from "@/lib/trust/trustEngine";

export interface ExecutiveIntelligence {

  digitalTrust: number;

  complianceHealth: number;

  procurementReadiness: number;

  fundingReadiness: number;

  aiConfidence: number;

  businessRisk: "Low" | "Medium" | "High";

  executiveHealth: number;

}

export function calculateExecutiveIntelligence(
  factors: TrustFactors,
  trustScore: number
): ExecutiveIntelligence {

  /*
   * Compliance Health
   */

  let complianceHealth = 0;

  if (factors.companyRegistered) complianceHealth += 20;

  if (factors.directorsVerified) complianceHealth += 20;

  if (factors.governanceCompleted) complianceHealth += 20;

  if (factors.complianceCompleted) complianceHealth += 20;

  complianceHealth += Math.min(
    factors.documentsUploaded * 4,
    20
  );

  /*
   * Procurement Readiness
   */

  let procurementReadiness = 0;

  if (factors.companyRegistered) procurementReadiness += 25;

  if (factors.directorsVerified) procurementReadiness += 20;

  if (factors.governanceCompleted) procurementReadiness += 20;

  if (factors.procurementReady) procurementReadiness += 35;

  /*
   * Funding Readiness
   */

  let fundingReadiness = 0;

  if (factors.companyRegistered) fundingReadiness += 25;

  if (factors.directorsVerified) fundingReadiness += 15;

  if (factors.governanceCompleted) fundingReadiness += 20;

  if (factors.complianceCompleted) fundingReadiness += 20;

  if (factors.fundingReady) fundingReadiness += 20;

  /*
   * AI Confidence
   */

  let aiConfidence = 60;

  aiConfidence += Math.floor(trustScore * 0.25);

  if (factors.aiValidated) {

    aiConfidence = 100;

  }

  aiConfidence = Math.min(aiConfidence, 100);

  /*
   * Business Risk
   */

  let businessRisk: "Low" | "Medium" | "High";

  if (trustScore >= 85) {

    businessRisk = "Low";

  } else if (trustScore >= 60) {

    businessRisk = "Medium";

  } else {

    businessRisk = "High";

  }

  /*
   * Executive Health
   */

  const executiveHealth = Math.round(

    (

      trustScore +

      complianceHealth +

      procurementReadiness +

      fundingReadiness +

      aiConfidence

    ) / 5

  );

  return {

    digitalTrust: trustScore,

    complianceHealth,

    procurementReadiness,

    fundingReadiness,

    aiConfidence,

    businessRisk,

    executiveHealth,

  };

}
