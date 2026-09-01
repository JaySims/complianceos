-- CreateEnum
CREATE TYPE "RegulatoryFactValueType" AS ENUM ('BOOLEAN', 'STRING', 'NUMBER', 'DATE', 'ENUM', 'MULTI_VALUE');

-- CreateEnum
CREATE TYPE "RegulatoryFactKnowledgeState" AS ENUM ('KNOWN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RegulatoryFactAuthorityState" AS ENUM ('DECLARED', 'REVIEWED', 'VERIFIED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "RegulatoryFactSourceType" AS ENUM ('USER_DECLARATION', 'DOCUMENT', 'SYSTEM_DERIVATION', 'EXTERNAL_SOURCE', 'IMPORT', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "ApplicabilityContextType" AS ENUM ('ORGANIZATION', 'EVENT', 'MATTER', 'ACTIVITY', 'RELATIONSHIP', 'TRANSFER', 'SYSTEM', 'AUTOMATED_DECISION');

-- CreateEnum
CREATE TYPE "ApplicabilityClass" AS ENUM ('GENERAL', 'CONDITIONAL', 'SECTOR_SPECIFIC', 'EVENT_TRIGGERED');

-- CreateEnum
CREATE TYPE "ApplicabilityResolutionPattern" AS ENUM ('GENERAL_UNCONDITIONAL', 'GENERAL_WITH_EXCEPTION', 'ACTIVITY_CONDITIONAL', 'RELATIONSHIP_CONDITIONAL', 'PROCESSING_CATEGORY_CONDITIONAL', 'EVENT_TRIGGERED', 'REQUEST_OR_DISPUTE_TRIGGERED', 'PRIOR_AUTHORISATION_CONDITIONAL', 'SECTOR_SPECIFIC', 'COMPOUND_CONDITIONAL');

-- CreateEnum
CREATE TYPE "ApplicabilityDefinitionStatus" AS ENUM ('DRAFT', 'APPROVED', 'RETIRED');

-- CreateEnum
CREATE TYPE "ApplicabilityStatus" AS ENUM ('APPLICABLE', 'NOT_APPLICABLE', 'UNDETERMINED');

-- CreateEnum
CREATE TYPE "ApplicabilityResolutionAuthority" AS ENUM ('SYSTEM', 'HUMAN');

-- CreateEnum
CREATE TYPE "ApplicabilityReviewState" AS ENUM ('NOT_REQUIRED', 'REQUIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RegulatoryFactValueSourceType" AS ENUM ('DOCUMENT', 'EXTERNAL_REFERENCE', 'DECLARATION', 'IMPORT', 'ADMINISTRATIVE', 'OTHER');

-- CreateTable
CREATE TABLE "ApplicabilityContext" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "contextType" "ApplicabilityContextType" NOT NULL,
    "stableContextKey" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicabilityContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryFact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "factDefinitionId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulatoryFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryFactValue" (
    "id" TEXT NOT NULL,
    "regulatoryFactId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "knowledgeState" "RegulatoryFactKnowledgeState" NOT NULL,
    "authorityState" "RegulatoryFactAuthorityState" NOT NULL,
    "booleanValue" BOOLEAN,
    "stringValue" TEXT,
    "numberValue" DECIMAL(65,30),
    "dateValue" TIMESTAMP(3),
    "enumValue" TEXT,
    "multiValue" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "establishedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "sourceType" "RegulatoryFactSourceType" NOT NULL,
    "sourceReference" TEXT,
    "sourceDescription" TEXT,
    "establishedById" TEXT,
    "reviewedById" TEXT,
    "supersedesValueId" TEXT,
    "correctionOfId" TEXT,
    "derivationKey" TEXT,
    "derivationVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulatoryFactValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrentRegulatoryFactAuthority" (
    "id" TEXT NOT NULL,
    "regulatoryFactId" TEXT NOT NULL,
    "regulatoryFactValueId" TEXT NOT NULL,
    "establishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "establishedById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrentRegulatoryFactAuthority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicabilityDefinition" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "applicabilityClass" "ApplicabilityClass" NOT NULL,
    "resolutionPattern" "ApplicabilityResolutionPattern" NOT NULL,
    "status" "ApplicabilityDefinitionStatus" NOT NULL DEFAULT 'DRAFT',
    "ruleAst" JSONB NOT NULL,
    "ruleSchemaVersion" TEXT NOT NULL,
    "sourceTitle" TEXT,
    "sourceReference" TEXT,
    "sourceUrl" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicabilityDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicabilityRuleFactDependency" (
    "id" TEXT NOT NULL,
    "applicabilityDefinitionId" TEXT NOT NULL,
    "factDefinitionId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicabilityRuleFactDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrentApplicabilityDefinitionAuthority" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "applicabilityDefinitionId" TEXT NOT NULL,
    "establishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "establishedById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrentApplicabilityDefinitionAuthority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentRegulatoryFactSnapshot" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "factDefinitionId" TEXT NOT NULL,
    "sourceRegulatoryFactId" TEXT,
    "sourceFactValueId" TEXT,
    "factKey" TEXT NOT NULL,
    "factName" TEXT NOT NULL,
    "valueType" "RegulatoryFactValueType" NOT NULL,
    "knowledgeState" "RegulatoryFactKnowledgeState" NOT NULL,
    "authorityState" "RegulatoryFactAuthorityState",
    "booleanValue" BOOLEAN,
    "stringValue" TEXT,
    "numberValue" DECIMAL(65,30),
    "dateValue" TIMESTAMP(3),
    "enumValue" TEXT,
    "multiValue" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "sourceType" "RegulatoryFactSourceType",
    "sourceReference" TEXT,
    "sourceDescription" TEXT,
    "sourceEstablishedAt" TIMESTAMP(3),
    "sourceReviewedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentRegulatoryFactSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentRequirementApplicability" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentRequirementApplicability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentRequirementApplicabilityRevision" (
    "id" TEXT NOT NULL,
    "applicabilityId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "applicabilityDefinitionId" TEXT NOT NULL,
    "status" "ApplicabilityStatus" NOT NULL,
    "resolutionAuthority" "ApplicabilityResolutionAuthority" NOT NULL,
    "reviewState" "ApplicabilityReviewState" NOT NULL DEFAULT 'NOT_REQUIRED',
    "resolverVersion" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resolutionBasis" JSONB,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentRequirementApplicabilityRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeterminationFactBasis" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "factSnapshotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeterminationFactBasis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrentApplicabilityResolutionAuthority" (
    "id" TEXT NOT NULL,
    "applicabilityId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "establishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "establishedById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrentApplicabilityResolutionAuthority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryFactDefinition" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "valueType" "RegulatoryFactValueType" NOT NULL,
    "allowedContextTypes" "ApplicabilityContextType"[],
    "sourceTitle" TEXT,
    "sourceReference" TEXT,
    "sourceUrl" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulatoryFactDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryFactDefinitionOption" (
    "id" TEXT NOT NULL,
    "factDefinitionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulatoryFactDefinitionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryFactValueSource" (
    "id" TEXT NOT NULL,
    "regulatoryFactValueId" TEXT NOT NULL,
    "sourceType" "RegulatoryFactValueSourceType" NOT NULL,
    "documentId" TEXT,
    "sourceReference" TEXT,
    "sourceDescription" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulatoryFactValueSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryFactDerivationInput" (
    "id" TEXT NOT NULL,
    "derivedFactValueId" TEXT NOT NULL,
    "inputFactValueId" TEXT NOT NULL,
    "inputOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulatoryFactDerivationInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryFactAuthorityTransition" (
    "id" TEXT NOT NULL,
    "regulatoryFactId" TEXT NOT NULL,
    "previousFactValueId" TEXT,
    "newFactValueId" TEXT NOT NULL,
    "establishedById" TEXT,
    "reason" TEXT,
    "transitionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulatoryFactAuthorityTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicabilityDefinitionAuthorityTransition" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "previousApplicabilityDefinitionId" TEXT,
    "newApplicabilityDefinitionId" TEXT NOT NULL,
    "establishedById" TEXT,
    "reason" TEXT,
    "transitionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicabilityDefinitionAuthorityTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicabilityResolutionAuthorityTransition" (
    "id" TEXT NOT NULL,
    "applicabilityId" TEXT NOT NULL,
    "previousRevisionId" TEXT,
    "newRevisionId" TEXT NOT NULL,
    "establishedById" TEXT,
    "reason" TEXT,
    "transitionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicabilityResolutionAuthorityTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicabilityContext_organizationId_frameworkId_idx" ON "ApplicabilityContext"("organizationId", "frameworkId");

-- CreateIndex
CREATE INDEX "ApplicabilityContext_organizationId_contextType_idx" ON "ApplicabilityContext"("organizationId", "contextType");

-- CreateIndex
CREATE INDEX "ApplicabilityContext_frameworkId_contextType_idx" ON "ApplicabilityContext"("frameworkId", "contextType");

-- CreateIndex
CREATE INDEX "ApplicabilityContext_active_idx" ON "ApplicabilityContext"("active");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicabilityContext_organizationId_frameworkId_contextType_key" ON "ApplicabilityContext"("organizationId", "frameworkId", "contextType", "stableContextKey");

-- CreateIndex
CREATE INDEX "RegulatoryFact_organizationId_idx" ON "RegulatoryFact"("organizationId");

-- CreateIndex
CREATE INDEX "RegulatoryFact_factDefinitionId_idx" ON "RegulatoryFact"("factDefinitionId");

-- CreateIndex
CREATE INDEX "RegulatoryFact_contextId_idx" ON "RegulatoryFact"("contextId");

-- CreateIndex
CREATE INDEX "RegulatoryFact_active_idx" ON "RegulatoryFact"("active");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryFact_organizationId_factDefinitionId_contextId_key" ON "RegulatoryFact"("organizationId", "factDefinitionId", "contextId");

-- CreateIndex
CREATE INDEX "RegulatoryFactValue_regulatoryFactId_idx" ON "RegulatoryFactValue"("regulatoryFactId");

-- CreateIndex
CREATE INDEX "RegulatoryFactValue_knowledgeState_idx" ON "RegulatoryFactValue"("knowledgeState");

-- CreateIndex
CREATE INDEX "RegulatoryFactValue_authorityState_idx" ON "RegulatoryFactValue"("authorityState");

-- CreateIndex
CREATE INDEX "RegulatoryFactValue_validFrom_idx" ON "RegulatoryFactValue"("validFrom");

-- CreateIndex
CREATE INDEX "RegulatoryFactValue_validUntil_idx" ON "RegulatoryFactValue"("validUntil");

-- CreateIndex
CREATE INDEX "RegulatoryFactValue_sourceType_idx" ON "RegulatoryFactValue"("sourceType");

-- CreateIndex
CREATE INDEX "RegulatoryFactValue_establishedById_idx" ON "RegulatoryFactValue"("establishedById");

-- CreateIndex
CREATE INDEX "RegulatoryFactValue_reviewedById_idx" ON "RegulatoryFactValue"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryFactValue_regulatoryFactId_version_key" ON "RegulatoryFactValue"("regulatoryFactId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentRegulatoryFactAuthority_regulatoryFactId_key" ON "CurrentRegulatoryFactAuthority"("regulatoryFactId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentRegulatoryFactAuthority_regulatoryFactValueId_key" ON "CurrentRegulatoryFactAuthority"("regulatoryFactValueId");

-- CreateIndex
CREATE INDEX "CurrentRegulatoryFactAuthority_establishedById_idx" ON "CurrentRegulatoryFactAuthority"("establishedById");

-- CreateIndex
CREATE INDEX "ApplicabilityDefinition_requirementId_idx" ON "ApplicabilityDefinition"("requirementId");

-- CreateIndex
CREATE INDEX "ApplicabilityDefinition_status_idx" ON "ApplicabilityDefinition"("status");

-- CreateIndex
CREATE INDEX "ApplicabilityDefinition_applicabilityClass_idx" ON "ApplicabilityDefinition"("applicabilityClass");

-- CreateIndex
CREATE INDEX "ApplicabilityDefinition_resolutionPattern_idx" ON "ApplicabilityDefinition"("resolutionPattern");

-- CreateIndex
CREATE INDEX "ApplicabilityDefinition_effectiveFrom_idx" ON "ApplicabilityDefinition"("effectiveFrom");

-- CreateIndex
CREATE INDEX "ApplicabilityDefinition_effectiveUntil_idx" ON "ApplicabilityDefinition"("effectiveUntil");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicabilityDefinition_requirementId_version_key" ON "ApplicabilityDefinition"("requirementId", "version");

-- CreateIndex
CREATE INDEX "ApplicabilityRuleFactDependency_applicabilityDefinitionId_idx" ON "ApplicabilityRuleFactDependency"("applicabilityDefinitionId");

-- CreateIndex
CREATE INDEX "ApplicabilityRuleFactDependency_factDefinitionId_idx" ON "ApplicabilityRuleFactDependency"("factDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicabilityRuleFactDependency_applicabilityDefinitionId_f_key" ON "ApplicabilityRuleFactDependency"("applicabilityDefinitionId", "factDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentApplicabilityDefinitionAuthority_requirementId_key" ON "CurrentApplicabilityDefinitionAuthority"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentApplicabilityDefinitionAuthority_applicabilityDefini_key" ON "CurrentApplicabilityDefinitionAuthority"("applicabilityDefinitionId");

-- CreateIndex
CREATE INDEX "CurrentApplicabilityDefinitionAuthority_establishedById_idx" ON "CurrentApplicabilityDefinitionAuthority"("establishedById");

-- CreateIndex
CREATE INDEX "AssessmentRegulatoryFactSnapshot_assessmentId_idx" ON "AssessmentRegulatoryFactSnapshot"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentRegulatoryFactSnapshot_assessmentId_contextId_idx" ON "AssessmentRegulatoryFactSnapshot"("assessmentId", "contextId");

-- CreateIndex
CREATE INDEX "AssessmentRegulatoryFactSnapshot_factDefinitionId_idx" ON "AssessmentRegulatoryFactSnapshot"("factDefinitionId");

-- CreateIndex
CREATE INDEX "AssessmentRegulatoryFactSnapshot_sourceRegulatoryFactId_idx" ON "AssessmentRegulatoryFactSnapshot"("sourceRegulatoryFactId");

-- CreateIndex
CREATE INDEX "AssessmentRegulatoryFactSnapshot_sourceFactValueId_idx" ON "AssessmentRegulatoryFactSnapshot"("sourceFactValueId");

-- CreateIndex
CREATE INDEX "AssessmentRegulatoryFactSnapshot_knowledgeState_idx" ON "AssessmentRegulatoryFactSnapshot"("knowledgeState");

-- CreateIndex
CREATE INDEX "AssessmentRequirementApplicability_assessmentId_idx" ON "AssessmentRequirementApplicability"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentRequirementApplicability_requirementId_idx" ON "AssessmentRequirementApplicability"("requirementId");

-- CreateIndex
CREATE INDEX "AssessmentRequirementApplicability_contextId_idx" ON "AssessmentRequirementApplicability"("contextId");

-- CreateIndex
CREATE INDEX "AssessmentRequirementApplicability_assessmentId_requirement_idx" ON "AssessmentRequirementApplicability"("assessmentId", "requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentRequirementApplicability_assessmentId_requirement_key" ON "AssessmentRequirementApplicability"("assessmentId", "requirementId", "contextId");

-- CreateIndex
CREATE INDEX "AssessmentRequirementApplicabilityRevision_applicabilityId_idx" ON "AssessmentRequirementApplicabilityRevision"("applicabilityId");

-- CreateIndex
CREATE INDEX "AssessmentRequirementApplicabilityRevision_applicabilityDef_idx" ON "AssessmentRequirementApplicabilityRevision"("applicabilityDefinitionId");

-- CreateIndex
CREATE INDEX "AssessmentRequirementApplicabilityRevision_status_idx" ON "AssessmentRequirementApplicabilityRevision"("status");

-- CreateIndex
CREATE INDEX "AssessmentRequirementApplicabilityRevision_resolutionAuthor_idx" ON "AssessmentRequirementApplicabilityRevision"("resolutionAuthority");

-- CreateIndex
CREATE INDEX "AssessmentRequirementApplicabilityRevision_reviewState_idx" ON "AssessmentRequirementApplicabilityRevision"("reviewState");

-- CreateIndex
CREATE INDEX "AssessmentRequirementApplicabilityRevision_resolvedAt_idx" ON "AssessmentRequirementApplicabilityRevision"("resolvedAt");

-- CreateIndex
CREATE INDEX "AssessmentRequirementApplicabilityRevision_resolvedById_idx" ON "AssessmentRequirementApplicabilityRevision"("resolvedById");

-- CreateIndex
CREATE INDEX "AssessmentRequirementApplicabilityRevision_reviewedById_idx" ON "AssessmentRequirementApplicabilityRevision"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentRequirementApplicabilityRevision_applicabilityId__key" ON "AssessmentRequirementApplicabilityRevision"("applicabilityId", "revision");

-- CreateIndex
CREATE INDEX "DeterminationFactBasis_revisionId_idx" ON "DeterminationFactBasis"("revisionId");

-- CreateIndex
CREATE INDEX "DeterminationFactBasis_factSnapshotId_idx" ON "DeterminationFactBasis"("factSnapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "DeterminationFactBasis_revisionId_factSnapshotId_key" ON "DeterminationFactBasis"("revisionId", "factSnapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentApplicabilityResolutionAuthority_applicabilityId_key" ON "CurrentApplicabilityResolutionAuthority"("applicabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentApplicabilityResolutionAuthority_revisionId_key" ON "CurrentApplicabilityResolutionAuthority"("revisionId");

-- CreateIndex
CREATE INDEX "CurrentApplicabilityResolutionAuthority_establishedById_idx" ON "CurrentApplicabilityResolutionAuthority"("establishedById");

-- CreateIndex
CREATE INDEX "RegulatoryFactDefinition_frameworkId_idx" ON "RegulatoryFactDefinition"("frameworkId");

-- CreateIndex
CREATE INDEX "RegulatoryFactDefinition_active_idx" ON "RegulatoryFactDefinition"("active");

-- CreateIndex
CREATE INDEX "RegulatoryFactDefinition_valueType_idx" ON "RegulatoryFactDefinition"("valueType");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryFactDefinition_frameworkId_key_key" ON "RegulatoryFactDefinition"("frameworkId", "key");

-- CreateIndex
CREATE INDEX "RegulatoryFactDefinitionOption_factDefinitionId_idx" ON "RegulatoryFactDefinitionOption"("factDefinitionId");

-- CreateIndex
CREATE INDEX "RegulatoryFactDefinitionOption_factDefinitionId_active_idx" ON "RegulatoryFactDefinitionOption"("factDefinitionId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryFactDefinitionOption_factDefinitionId_value_key" ON "RegulatoryFactDefinitionOption"("factDefinitionId", "value");

-- CreateIndex
CREATE INDEX "RegulatoryFactValueSource_regulatoryFactValueId_idx" ON "RegulatoryFactValueSource"("regulatoryFactValueId");

-- CreateIndex
CREATE INDEX "RegulatoryFactValueSource_sourceType_idx" ON "RegulatoryFactValueSource"("sourceType");

-- CreateIndex
CREATE INDEX "RegulatoryFactValueSource_documentId_idx" ON "RegulatoryFactValueSource"("documentId");

-- CreateIndex
CREATE INDEX "RegulatoryFactDerivationInput_derivedFactValueId_idx" ON "RegulatoryFactDerivationInput"("derivedFactValueId");

-- CreateIndex
CREATE INDEX "RegulatoryFactDerivationInput_inputFactValueId_idx" ON "RegulatoryFactDerivationInput"("inputFactValueId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryFactDerivationInput_derivedFactValueId_inputFactV_key" ON "RegulatoryFactDerivationInput"("derivedFactValueId", "inputFactValueId");

-- CreateIndex
CREATE INDEX "RegulatoryFactAuthorityTransition_regulatoryFactId_transiti_idx" ON "RegulatoryFactAuthorityTransition"("regulatoryFactId", "transitionedAt");

-- CreateIndex
CREATE INDEX "RegulatoryFactAuthorityTransition_previousFactValueId_idx" ON "RegulatoryFactAuthorityTransition"("previousFactValueId");

-- CreateIndex
CREATE INDEX "RegulatoryFactAuthorityTransition_newFactValueId_idx" ON "RegulatoryFactAuthorityTransition"("newFactValueId");

-- CreateIndex
CREATE INDEX "RegulatoryFactAuthorityTransition_establishedById_idx" ON "RegulatoryFactAuthorityTransition"("establishedById");

-- CreateIndex
CREATE INDEX "ApplicabilityDefinitionAuthorityTransition_requirementId_tr_idx" ON "ApplicabilityDefinitionAuthorityTransition"("requirementId", "transitionedAt");

-- CreateIndex
CREATE INDEX "ApplicabilityDefinitionAuthorityTransition_previousApplicab_idx" ON "ApplicabilityDefinitionAuthorityTransition"("previousApplicabilityDefinitionId");

-- CreateIndex
CREATE INDEX "ApplicabilityDefinitionAuthorityTransition_newApplicability_idx" ON "ApplicabilityDefinitionAuthorityTransition"("newApplicabilityDefinitionId");

-- CreateIndex
CREATE INDEX "ApplicabilityDefinitionAuthorityTransition_establishedById_idx" ON "ApplicabilityDefinitionAuthorityTransition"("establishedById");

-- CreateIndex
CREATE INDEX "ApplicabilityResolutionAuthorityTransition_applicabilityId__idx" ON "ApplicabilityResolutionAuthorityTransition"("applicabilityId", "transitionedAt");

-- CreateIndex
CREATE INDEX "ApplicabilityResolutionAuthorityTransition_previousRevision_idx" ON "ApplicabilityResolutionAuthorityTransition"("previousRevisionId");

-- CreateIndex
CREATE INDEX "ApplicabilityResolutionAuthorityTransition_newRevisionId_idx" ON "ApplicabilityResolutionAuthorityTransition"("newRevisionId");

-- CreateIndex
CREATE INDEX "ApplicabilityResolutionAuthorityTransition_establishedById_idx" ON "ApplicabilityResolutionAuthorityTransition"("establishedById");

-- AddForeignKey
ALTER TABLE "ApplicabilityContext" ADD CONSTRAINT "ApplicabilityContext_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityContext" ADD CONSTRAINT "ApplicabilityContext_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFact" ADD CONSTRAINT "RegulatoryFact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFact" ADD CONSTRAINT "RegulatoryFact_factDefinitionId_fkey" FOREIGN KEY ("factDefinitionId") REFERENCES "RegulatoryFactDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFact" ADD CONSTRAINT "RegulatoryFact_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "ApplicabilityContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactValue" ADD CONSTRAINT "RegulatoryFactValue_regulatoryFactId_fkey" FOREIGN KEY ("regulatoryFactId") REFERENCES "RegulatoryFact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactValue" ADD CONSTRAINT "RegulatoryFactValue_establishedById_fkey" FOREIGN KEY ("establishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactValue" ADD CONSTRAINT "RegulatoryFactValue_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactValue" ADD CONSTRAINT "RegulatoryFactValue_supersedesValueId_fkey" FOREIGN KEY ("supersedesValueId") REFERENCES "RegulatoryFactValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactValue" ADD CONSTRAINT "RegulatoryFactValue_correctionOfId_fkey" FOREIGN KEY ("correctionOfId") REFERENCES "RegulatoryFactValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentRegulatoryFactAuthority" ADD CONSTRAINT "CurrentRegulatoryFactAuthority_regulatoryFactId_fkey" FOREIGN KEY ("regulatoryFactId") REFERENCES "RegulatoryFact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentRegulatoryFactAuthority" ADD CONSTRAINT "CurrentRegulatoryFactAuthority_regulatoryFactValueId_fkey" FOREIGN KEY ("regulatoryFactValueId") REFERENCES "RegulatoryFactValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentRegulatoryFactAuthority" ADD CONSTRAINT "CurrentRegulatoryFactAuthority_establishedById_fkey" FOREIGN KEY ("establishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityDefinition" ADD CONSTRAINT "ApplicabilityDefinition_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ComplianceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityDefinition" ADD CONSTRAINT "ApplicabilityDefinition_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityRuleFactDependency" ADD CONSTRAINT "ApplicabilityRuleFactDependency_applicabilityDefinitionId_fkey" FOREIGN KEY ("applicabilityDefinitionId") REFERENCES "ApplicabilityDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityRuleFactDependency" ADD CONSTRAINT "ApplicabilityRuleFactDependency_factDefinitionId_fkey" FOREIGN KEY ("factDefinitionId") REFERENCES "RegulatoryFactDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentApplicabilityDefinitionAuthority" ADD CONSTRAINT "CurrentApplicabilityDefinitionAuthority_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ComplianceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentApplicabilityDefinitionAuthority" ADD CONSTRAINT "CurrentApplicabilityDefinitionAuthority_applicabilityDefin_fkey" FOREIGN KEY ("applicabilityDefinitionId") REFERENCES "ApplicabilityDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentApplicabilityDefinitionAuthority" ADD CONSTRAINT "CurrentApplicabilityDefinitionAuthority_establishedById_fkey" FOREIGN KEY ("establishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRegulatoryFactSnapshot" ADD CONSTRAINT "AssessmentRegulatoryFactSnapshot_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRegulatoryFactSnapshot" ADD CONSTRAINT "AssessmentRegulatoryFactSnapshot_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "ApplicabilityContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRegulatoryFactSnapshot" ADD CONSTRAINT "AssessmentRegulatoryFactSnapshot_factDefinitionId_fkey" FOREIGN KEY ("factDefinitionId") REFERENCES "RegulatoryFactDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRegulatoryFactSnapshot" ADD CONSTRAINT "AssessmentRegulatoryFactSnapshot_sourceRegulatoryFactId_fkey" FOREIGN KEY ("sourceRegulatoryFactId") REFERENCES "RegulatoryFact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRegulatoryFactSnapshot" ADD CONSTRAINT "AssessmentRegulatoryFactSnapshot_sourceFactValueId_fkey" FOREIGN KEY ("sourceFactValueId") REFERENCES "RegulatoryFactValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRequirementApplicability" ADD CONSTRAINT "AssessmentRequirementApplicability_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRequirementApplicability" ADD CONSTRAINT "AssessmentRequirementApplicability_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ComplianceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRequirementApplicability" ADD CONSTRAINT "AssessmentRequirementApplicability_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "ApplicabilityContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRequirementApplicabilityRevision" ADD CONSTRAINT "AssessmentRequirementApplicabilityRevision_applicabilityId_fkey" FOREIGN KEY ("applicabilityId") REFERENCES "AssessmentRequirementApplicability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRequirementApplicabilityRevision" ADD CONSTRAINT "AssessmentRequirementApplicabilityRevision_applicabilityDe_fkey" FOREIGN KEY ("applicabilityDefinitionId") REFERENCES "ApplicabilityDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRequirementApplicabilityRevision" ADD CONSTRAINT "AssessmentRequirementApplicabilityRevision_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRequirementApplicabilityRevision" ADD CONSTRAINT "AssessmentRequirementApplicabilityRevision_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeterminationFactBasis" ADD CONSTRAINT "DeterminationFactBasis_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "AssessmentRequirementApplicabilityRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeterminationFactBasis" ADD CONSTRAINT "DeterminationFactBasis_factSnapshotId_fkey" FOREIGN KEY ("factSnapshotId") REFERENCES "AssessmentRegulatoryFactSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentApplicabilityResolutionAuthority" ADD CONSTRAINT "CurrentApplicabilityResolutionAuthority_applicabilityId_fkey" FOREIGN KEY ("applicabilityId") REFERENCES "AssessmentRequirementApplicability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentApplicabilityResolutionAuthority" ADD CONSTRAINT "CurrentApplicabilityResolutionAuthority_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "AssessmentRequirementApplicabilityRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentApplicabilityResolutionAuthority" ADD CONSTRAINT "CurrentApplicabilityResolutionAuthority_establishedById_fkey" FOREIGN KEY ("establishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactDefinition" ADD CONSTRAINT "RegulatoryFactDefinition_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactDefinitionOption" ADD CONSTRAINT "RegulatoryFactDefinitionOption_factDefinitionId_fkey" FOREIGN KEY ("factDefinitionId") REFERENCES "RegulatoryFactDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactValueSource" ADD CONSTRAINT "RegulatoryFactValueSource_regulatoryFactValueId_fkey" FOREIGN KEY ("regulatoryFactValueId") REFERENCES "RegulatoryFactValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactValueSource" ADD CONSTRAINT "RegulatoryFactValueSource_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactDerivationInput" ADD CONSTRAINT "RegulatoryFactDerivationInput_derivedFactValueId_fkey" FOREIGN KEY ("derivedFactValueId") REFERENCES "RegulatoryFactValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactDerivationInput" ADD CONSTRAINT "RegulatoryFactDerivationInput_inputFactValueId_fkey" FOREIGN KEY ("inputFactValueId") REFERENCES "RegulatoryFactValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactAuthorityTransition" ADD CONSTRAINT "RegulatoryFactAuthorityTransition_regulatoryFactId_fkey" FOREIGN KEY ("regulatoryFactId") REFERENCES "RegulatoryFact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactAuthorityTransition" ADD CONSTRAINT "RegulatoryFactAuthorityTransition_previousFactValueId_fkey" FOREIGN KEY ("previousFactValueId") REFERENCES "RegulatoryFactValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactAuthorityTransition" ADD CONSTRAINT "RegulatoryFactAuthorityTransition_newFactValueId_fkey" FOREIGN KEY ("newFactValueId") REFERENCES "RegulatoryFactValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFactAuthorityTransition" ADD CONSTRAINT "RegulatoryFactAuthorityTransition_establishedById_fkey" FOREIGN KEY ("establishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityDefinitionAuthorityTransition" ADD CONSTRAINT "ApplicabilityDefinitionAuthorityTransition_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ComplianceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityDefinitionAuthorityTransition" ADD CONSTRAINT "ApplicabilityDefinitionAuthorityTransition_previousApplica_fkey" FOREIGN KEY ("previousApplicabilityDefinitionId") REFERENCES "ApplicabilityDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityDefinitionAuthorityTransition" ADD CONSTRAINT "ApplicabilityDefinitionAuthorityTransition_newApplicabilit_fkey" FOREIGN KEY ("newApplicabilityDefinitionId") REFERENCES "ApplicabilityDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityDefinitionAuthorityTransition" ADD CONSTRAINT "ApplicabilityDefinitionAuthorityTransition_establishedById_fkey" FOREIGN KEY ("establishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityResolutionAuthorityTransition" ADD CONSTRAINT "ApplicabilityResolutionAuthorityTransition_applicabilityId_fkey" FOREIGN KEY ("applicabilityId") REFERENCES "AssessmentRequirementApplicability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityResolutionAuthorityTransition" ADD CONSTRAINT "ApplicabilityResolutionAuthorityTransition_previousRevisio_fkey" FOREIGN KEY ("previousRevisionId") REFERENCES "AssessmentRequirementApplicabilityRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityResolutionAuthorityTransition" ADD CONSTRAINT "ApplicabilityResolutionAuthorityTransition_newRevisionId_fkey" FOREIGN KEY ("newRevisionId") REFERENCES "AssessmentRequirementApplicabilityRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicabilityResolutionAuthorityTransition" ADD CONSTRAINT "ApplicabilityResolutionAuthorityTransition_establishedById_fkey" FOREIGN KEY ("establishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

