import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function getDashboardData() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      organization: {
        include: {
          documents: true,
          assessments: true,
        },
      },
      recommendations: true,
    },
  });

  if (!user || !user.organization) {
    return null;
  }

  const organization = user.organization;

  return {
    user,
    organization,

    trustScore: organization.trustScore,

    complianceScore: organization.complianceScore,

    documentsCount: organization.documents.length,

    assessmentsCount: organization.assessments.length,

    recommendationsCount: user.recommendations.length,

    recommendations: user.recommendations,

    documents: organization.documents,
  };
}
