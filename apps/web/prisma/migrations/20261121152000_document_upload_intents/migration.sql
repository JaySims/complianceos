-- CreateEnum
CREATE TYPE "DocumentUploadIntentStatus" AS ENUM ('PENDING', 'FINALIZING', 'FINALIZED', 'FAILED', 'CLEANING', 'DELETED');

-- CreateTable
CREATE TABLE "DocumentUploadIntent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "documentId" TEXT,
    "status" "DocumentUploadIntentStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "finalizationLeaseExpiresAt" TIMESTAMP(3),
    "cleanupLeaseExpiresAt" TIMESTAMP(3),
    "cleanupAfter" TIMESTAMP(3),
    "cleanupAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "finalizedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentUploadIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentUploadIntent_filePath_key" ON "DocumentUploadIntent"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentUploadIntent_documentId_key" ON "DocumentUploadIntent"("documentId");

-- CreateIndex
CREATE INDEX "DocumentUploadIntent_organizationId_status_idx" ON "DocumentUploadIntent"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DocumentUploadIntent_status_expiresAt_idx" ON "DocumentUploadIntent"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "DocumentUploadIntent_status_cleanupAfter_idx" ON "DocumentUploadIntent"("status", "cleanupAfter");

-- CreateIndex
CREATE INDEX "DocumentUploadIntent_status_finalizationLeaseExpiresAt_idx" ON "DocumentUploadIntent"("status", "finalizationLeaseExpiresAt");

-- CreateIndex
CREATE INDEX "DocumentUploadIntent_status_cleanupLeaseExpiresAt_idx" ON "DocumentUploadIntent"("status", "cleanupLeaseExpiresAt");

-- AddForeignKey
ALTER TABLE "DocumentUploadIntent" ADD CONSTRAINT "DocumentUploadIntent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUploadIntent" ADD CONSTRAINT "DocumentUploadIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUploadIntent" ADD CONSTRAINT "DocumentUploadIntent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
