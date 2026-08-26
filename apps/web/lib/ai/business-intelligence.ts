export type BusinessProfile = {
  companyName: string;
  industry: string;
  employees: number;
};

export type BusinessPrediction = {
  businessSize: string;
  trustScore: number;
  complianceScore: number;
  fundingPotential: string;
  riskLevel: string;
  standards: string[];
};

export function getBusinessIntelligence(
  business: BusinessProfile
): BusinessPrediction {

  let trustScore = 35;
  let complianceScore = 40;

  if (business.companyName.length > 5) {
    trustScore += 10;
  }

  if (business.employees > 5) {
    trustScore += 10;
    complianceScore += 8;
  }

  if (business.employees > 50) {
    trustScore += 10;
    complianceScore += 10;
  }

  let businessSize = "Startup";

  if (business.employees >= 10)
    businessSize = "Small Business";

  if (business.employees >= 50)
    businessSize = "Medium Enterprise";

  if (business.employees >= 250)
    businessSize = "Large Enterprise";

  let fundingPotential = "R500 000";

  if (business.employees >= 10)
    fundingPotential = "R2 Million";

  if (business.employees >= 50)
    fundingPotential = "R5 Million";

  if (business.employees >= 250)
    fundingPotential = "R25 Million";

  let riskLevel = "Low";

  if (trustScore < 60)
    riskLevel = "Medium";

  if (trustScore < 45)
    riskLevel = "High";

  const standards = [
    "POPIA",
    "King IV",
    "B-BBEE",
    "SARS",
  ];

  if (
    business.industry === "Technology" ||
    business.industry === "Finance"
  ) {
    standards.unshift("ISO 27001");
  }

  return {
    businessSize,
    trustScore,
    complianceScore,
    fundingPotential,
    riskLevel,
    standards,
  };
}
