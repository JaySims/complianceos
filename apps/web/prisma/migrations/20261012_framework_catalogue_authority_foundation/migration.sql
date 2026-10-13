-- CreateEnum
CREATE TYPE "FrameworkCatalogueAuthorityTransitionType" AS ENUM ('ESTABLISH', 'REPLACE', 'WITHDRAW');

-- CreateTable
CREATE TABLE "FrameworkCatalogueApproval" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contentManifest" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "manifestAlgorithmVersion" INTEGER NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL,
    "approvedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrameworkCatalogueApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrentFrameworkCatalogueAuthority" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "frameworkCatalogueApprovalId" TEXT NOT NULL,
    "establishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "establishedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrentFrameworkCatalogueAuthority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkCatalogueAuthorityTransition" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "previousFrameworkCatalogueApprovalId" TEXT,
    "newFrameworkCatalogueApprovalId" TEXT,
    "transitionType" "FrameworkCatalogueAuthorityTransitionType" NOT NULL,
    "transitionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transitionedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrameworkCatalogueAuthorityTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FrameworkCatalogueApproval_frameworkId_idx" ON "FrameworkCatalogueApproval"("frameworkId");

-- CreateIndex
CREATE INDEX "FrameworkCatalogueApproval_approvedById_idx" ON "FrameworkCatalogueApproval"("approvedById");

-- CreateIndex
CREATE INDEX "FrameworkCatalogueApproval_contentHash_idx" ON "FrameworkCatalogueApproval"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkCatalogueApproval_frameworkId_version_key" ON "FrameworkCatalogueApproval"("frameworkId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentFrameworkCatalogueAuthority_frameworkId_key" ON "CurrentFrameworkCatalogueAuthority"("frameworkId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentFrameworkCatalogueAuthority_frameworkCatalogueApprov_key" ON "CurrentFrameworkCatalogueAuthority"("frameworkCatalogueApprovalId");

-- CreateIndex
CREATE INDEX "CurrentFrameworkCatalogueAuthority_establishedById_idx" ON "CurrentFrameworkCatalogueAuthority"("establishedById");

-- CreateIndex
CREATE INDEX "FrameworkCatalogueAuthorityTransition_frameworkId_transitio_idx" ON "FrameworkCatalogueAuthorityTransition"("frameworkId", "transitionedAt");

-- CreateIndex
CREATE INDEX "FrameworkCatalogueAuthorityTransition_previousFrameworkCata_idx" ON "FrameworkCatalogueAuthorityTransition"("previousFrameworkCatalogueApprovalId");

-- CreateIndex
CREATE INDEX "FrameworkCatalogueAuthorityTransition_newFrameworkCatalogue_idx" ON "FrameworkCatalogueAuthorityTransition"("newFrameworkCatalogueApprovalId");

-- CreateIndex
CREATE INDEX "FrameworkCatalogueAuthorityTransition_transitionedById_idx" ON "FrameworkCatalogueAuthorityTransition"("transitionedById");

-- AddForeignKey
ALTER TABLE "FrameworkCatalogueApproval" ADD CONSTRAINT "FrameworkCatalogueApproval_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkCatalogueApproval" ADD CONSTRAINT "FrameworkCatalogueApproval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentFrameworkCatalogueAuthority" ADD CONSTRAINT "CurrentFrameworkCatalogueAuthority_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentFrameworkCatalogueAuthority" ADD CONSTRAINT "CurrentFrameworkCatalogueAuthority_frameworkCatalogueAppro_fkey" FOREIGN KEY ("frameworkCatalogueApprovalId") REFERENCES "FrameworkCatalogueApproval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentFrameworkCatalogueAuthority" ADD CONSTRAINT "CurrentFrameworkCatalogueAuthority_establishedById_fkey" FOREIGN KEY ("establishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkCatalogueAuthorityTransition" ADD CONSTRAINT "FrameworkCatalogueAuthorityTransition_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkCatalogueAuthorityTransition" ADD CONSTRAINT "FrameworkCatalogueAuthorityTransition_previousFrameworkCat_fkey" FOREIGN KEY ("previousFrameworkCatalogueApprovalId") REFERENCES "FrameworkCatalogueApproval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkCatalogueAuthorityTransition" ADD CONSTRAINT "FrameworkCatalogueAuthorityTransition_newFrameworkCatalogu_fkey" FOREIGN KEY ("newFrameworkCatalogueApprovalId") REFERENCES "FrameworkCatalogueApproval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkCatalogueAuthorityTransition" ADD CONSTRAINT "FrameworkCatalogueAuthorityTransition_transitionedById_fkey" FOREIGN KEY ("transitionedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

