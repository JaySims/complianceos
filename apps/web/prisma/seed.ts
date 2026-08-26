import { PrismaClient, UserRole, AssessmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ComplianceOS database...");

  // Organization
  const org = await prisma.organization.create({
    data: {
      name: "ComplianceOS Africa",
      industry: "Technology",
      country: "South Africa",
    },
  });

  // Frameworks
  const popia = await prisma.framework.create({
    data: {
      name: "POPIA",
      version: "2013",
      description: "Protection of Personal Information Act",
    },
  });

  const iso = await prisma.framework.create({
    data: {
      name: "ISO 27001",
      version: "2022",
      description: "Information Security Management",
    },
  });

  const king = await prisma.framework.create({
    data: {
      name: "King IV",
      version: "2016",
      description: "Corporate Governance Framework",
    },
  });

  // Admin User
  const admin = await prisma.user.create({
    data: {
      fullName: "Simphiwe Vilakazi",
      email: "admin@complianceos.ai",
      role: UserRole.SUPER_ADMIN,
      organizationId: org.id,
    },
  });

  // Assessments
  await prisma.assessment.createMany({
    data: [
      {
        title: "POPIA Readiness Assessment",
        score: 84,
        status: AssessmentStatus.COMPLETED,
        organizationId: org.id,
        frameworkId: popia.id,
        userId: admin.id,
      },
      {
        title: "ISO 27001 Gap Assessment",
        score: 91,
        status: AssessmentStatus.IN_PROGRESS,
        organizationId: org.id,
        frameworkId: iso.id,
        userId: admin.id,
      },
      {
        title: "King IV Governance Review",
        score: 76,
        status: AssessmentStatus.REVIEW,
        organizationId: org.id,
        frameworkId: king.id,
        userId: admin.id,
      },
    ],
  });

  // AI Recommendations
  await prisma.recommendation.createMany({
    data: [
      {
        title: "Encrypt Customer Database",
        description:
          "Enable encryption at rest for sensitive customer records.",
        priority: 5,
        completed: false,
        userId: admin.id,
      },
      {
        title: "Update Vendor Risk Register",
        description:
          "Review third-party suppliers against POPIA requirements.",
        priority: 4,
        completed: false,
        userId: admin.id,
      },
      {
        title: "Conduct Staff Awareness Training",
        description:
          "Schedule annual compliance and cybersecurity awareness training.",
        priority: 3,
        completed: false,
        userId: admin.id,
      },
    ],
  });

  // Audit Log
  await prisma.auditLog.create({
    data: {
      action: "DATABASE SEEDED",
      entity: "SYSTEM",
      entityId: org.id,
      userEmail: admin.email,
    },
  });

  console.log("✅ ComplianceOS database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });