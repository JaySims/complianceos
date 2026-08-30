-- AlterTable
ALTER TABLE "ComplianceRequirement" ADD COLUMN     "effectiveFrom" TIMESTAMP(3),
ADD COLUMN     "sourceReference" TEXT,
ADD COLUMN     "sourceTitle" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

