export type ExecutiveMission = {
  id: number;
  title: string;
  aiBrief: string;
  businessImpact: string[];
  estimatedMinutes: number;
  trustIncrease: number;
};

export const ExecutiveMissions: ExecutiveMission[] = [

  {
    id: 1,
    title: "Organisation Identity",

    aiBrief:
      "Register your legal organisation information to establish the foundation of your Digital Trust profile.",

    businessImpact: [
      "Creates verified business identity",
      "Begins Digital Trust profile",
      "Unlocks onboarding progression",
    ],

    estimatedMinutes: 5,

    trustIncrease: 8,
  },

  {
    id: 2,
    title: "Business Contacts",

    aiBrief:
      "Verify your executive and business contact information for procurement readiness.",

    businessImpact: [
      "Improves Digital Trust",
      "Strengthens procurement profile",
      "Improves business discoverability",
    ],

    estimatedMinutes: 4,

    trustIncrease: 9,
  },

  {
    id: 3,
    title: "Governance",

    aiBrief:
      "Capture your governance structure to improve enterprise credibility.",

    businessImpact: [
      "Improves governance maturity",
      "Supports investor confidence",
      "Strengthens executive profile",
    ],

    estimatedMinutes: 6,

    trustIncrease: 11,
  },

  {
    id: 4,
    title: "Compliance",

    aiBrief:
      "Complete regulatory compliance requirements for investment readiness.",

    businessImpact: [
      "Improves compliance score",
      "Unlocks funding analysis",
      "Supports procurement eligibility",
    ],

    estimatedMinutes: 8,

    trustIncrease: 14,
  },

  {
    id: 5,
    title: "Document Vault",

    aiBrief:
      "Upload supporting business documentation for AI verification.",

    businessImpact: [
      "Improves verification",
      "Increases Trust",
      "Supports automated validation",
    ],

    estimatedMinutes: 7,

    trustIncrease: 12,
  },

  {
    id: 6,
    title: "AI Review",

    aiBrief:
      "Executive AI analyses your organisation before launch.",

    businessImpact: [
      "Generates executive insights",
      "Finds missing opportunities",
      "Improves organisation readiness",
    ],

    estimatedMinutes: 3,

    trustIncrease: 6,
  },

  {
    id: 7,
    title: "Launch Workspace",

    aiBrief:
      "Launch your ComplianceOS Executive Workspace.",

    businessImpact: [
      "Business becomes AI-ready",
      "Funding profile activated",
      "Executive Dashboard unlocked",
    ],

    estimatedMinutes: 2,

    trustIncrease: 0,
  },

];

export function getMission(step: number): ExecutiveMission {

  return (
    ExecutiveMissions.find(
      mission => mission.id === step
    ) ?? ExecutiveMissions[0]
  );

}
