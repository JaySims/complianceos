-- CreateTable
CREATE TABLE "CurrentAssessmentAuthority" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrentAssessmentAuthority_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CurrentAssessmentAuthority_assessmentId_key"
ON "CurrentAssessmentAuthority"("assessmentId");

-- CreateIndex
CREATE INDEX "CurrentAssessmentAuthority_organizationId_idx"
ON "CurrentAssessmentAuthority"("organizationId");

-- CreateIndex
CREATE INDEX "CurrentAssessmentAuthority_frameworkId_idx"
ON "CurrentAssessmentAuthority"("frameworkId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentAssessmentAuthority_organizationId_frameworkId_key"
ON "CurrentAssessmentAuthority"("organizationId", "frameworkId");

-- AddForeignKey
ALTER TABLE "CurrentAssessmentAuthority"
ADD CONSTRAINT "CurrentAssessmentAuthority_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES "Organization"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentAssessmentAuthority"
ADD CONSTRAINT "CurrentAssessmentAuthority_frameworkId_fkey"
FOREIGN KEY ("frameworkId")
REFERENCES "Framework"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentAssessmentAuthority"
ADD CONSTRAINT "CurrentAssessmentAuthority_assessmentId_fkey"
FOREIGN KEY ("assessmentId")
REFERENCES "Assessment"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
