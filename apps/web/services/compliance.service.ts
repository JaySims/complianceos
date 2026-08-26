export interface CompanyProfile {
  industry: string;
  employees: number;
  hasBeeCertificate: boolean;
  hasPopiaPolicy: boolean;
  hasVatNumber: boolean;
  directorsVerified: boolean;
}

export interface ComplianceResult {
  score: number;
  issues: string[];
  recommendations: string[];
}

export function calculateCompliance(
  company: CompanyProfile
): ComplianceResult {

  let score = 100;

  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!company.hasBeeCertificate) {
    score -= 10;

    issues.push("Missing B-BBEE Certificate");

    recommendations.push(
      "Upload a valid B-BBEE Certificate."
    );
  }

  if (!company.hasPopiaPolicy) {
    score -= 15;

    issues.push("Missing POPIA Policy");

    recommendations.push(
      "Create and upload a POPIA Privacy Policy."
    );
  }

  if (!company.hasVatNumber) {
    score -= 10;

    issues.push("VAT Registration Missing");

    recommendations.push(
      "Register for VAT if applicable."
    );
  }

  if (!company.directorsVerified) {
    score -= 20;

    issues.push("Directors not verified");

    recommendations.push(
      "Verify all directors through CIPC."
    );
  }

  return {
    score,
    issues,
    recommendations,
  };
}
