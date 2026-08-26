import { prisma } from "@/lib/prisma";

export async function getOrganizationCount() {
  return prisma.organization.count();
}

export async function getOrganizations() {
  return prisma.organization.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getOrganization(id: string) {
  return prisma.organization.findUnique({
    where: {
      id,
    },
  });
}

export async function createOrganization(data: {
  name: string;
  registrationNumber: string;
  industry: string;
}) {
  return prisma.organization.create({
    data,
  });
}
