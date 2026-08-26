import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  try {
    const organization = await prisma.organization.findFirst({
      include: {
        documents: true,
      },
    });

    if (!organization) {
      return null;
    }

    const recommendations =
      await prisma.recommendation.findMany({
        orderBy: {
          priority: "desc",
        },
      });

    return {
      organization,
      recommendations,
      documents: organization.documents.map((doc) => ({
        name: doc.fileName,
        uploaded: true,
      })),
      documentCount: organization.documents.length,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}
