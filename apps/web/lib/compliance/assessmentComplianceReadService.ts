import {
  AssessmentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  calculateAssessmentCompliance,
  type ComplianceCalculationFailureReason,
} from "@/lib/compliance/complianceCalculationService";

import {
  getCurrentAssessmentAuthority,
} from "@/lib/compliance/assessmentAuthorityService";

import {
  determineAssessmentComplianceReadDisposition,
  selectHistoricalAssessmentComplianceScore,
  type AssessmentComplianceScoreSource,
  type AssessmentApplicabilityCoverageSource,
} from "@/lib/compliance/assessmentComplianceReadPolicy";

import type {
  ApplicabilityCoverage,
} from "@/lib/compliance/applicabilityCoveragePolicy";

import type {
  ComplianceScoreResult,
} from "@/lib/compliance/complianceEngine";

/*
 * ============================================================
 * COMPLIANCEOS — ASSESSMENT COMPLIANCE READ SERVICE
 * ============================================================
 *
 * PURPOSE
 *
 * Provide a product-safe read model for Assessment compliance.
 *
 * This service separates:
 *
 * - live mutable Assessment state;
 * - persisted completed historical state;
 * - Compliance Score;
 * - Applicability Coverage.
 *
 * HISTORICAL BOUNDARY
 *
 * DRAFT, IN_PROGRESS, and REVIEW Assessments may expose a live
 * calculation derived from current authoritative inputs.
 *
 * COMPLETED Assessments are historical snapshots.
 *
 * Their persisted Assessment.score is returned as historical
 * truth and is never silently replaced by today's calculation.
 *
 * Historical Applicability Coverage is currently unavailable
 * because V1 does not persist a coverage snapshot.
 *
 * AUTHORITY BOUNDARY
 *
 * This service reads a specific Assessment only.
 *
 * It does NOT:
 *
 * - infer CurrentAssessmentAuthority;
 * - establish or supersede Assessment authority;
 * - establish or supersede applicability authority;
 * - persist Assessment.score;
 * - persist Organization.complianceScore;
 * - mutate Assessment lifecycle state.
 *
 * A separate current-authority read operation may compose this
 * service later.
 * ============================================================
 */

export type AssessmentComplianceReadFailureReason =
  | "ASSESSMENT_NOT_FOUND"
  | "ASSESSMENT_ACCESS_DENIED"
  | "CURRENT_AUTHORITY_NOT_FOUND"
  | "CURRENT_AUTHORITY_INTEGRITY_VIOLATION"
  | ComplianceCalculationFailureReason
  | "ASSESSMENT_COMPLIANCE_READ_FAILED";

export type AssessmentComplianceReadAssessment = {
  id: string;
  organizationId: string;
  frameworkId: string;
  title: string;
  status: AssessmentStatus;
  persistedScore: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AssessmentComplianceLiveRead = {
  mode: "LIVE";

  assessment: AssessmentComplianceReadAssessment;

  score: number;
  scoreSource: "LIVE_CALCULATION";

  applicabilityCoverage: ApplicabilityCoverage;
  coverageSource: "LIVE_CALCULATION";

  calculation: ComplianceScoreResult;
};

export type AssessmentComplianceHistoricalRead = {
  mode: "HISTORICAL";

  assessment: AssessmentComplianceReadAssessment;

  score: number | null;
  scoreSource: "PERSISTED_HISTORICAL";

  applicabilityCoverage: null;
  coverageSource: "HISTORICAL_UNAVAILABLE";

  calculation: null;
};

export type AssessmentComplianceReadSuccess =
  | AssessmentComplianceLiveRead
  | AssessmentComplianceHistoricalRead;

export type AssessmentComplianceReadFailure = {
  success: false;
  reason: AssessmentComplianceReadFailureReason;
  message: string;
};

export type AssessmentComplianceReadResult =
  | ({
      success: true;
    } & AssessmentComplianceReadSuccess)
  | AssessmentComplianceReadFailure;

/*
 * ============================================================
 * READ ASSESSMENT COMPLIANCE
 * ============================================================
 */

export async function getAssessmentComplianceRead(
  organizationId: string,
  assessmentId: string,
  now: Date = new Date()
): Promise<AssessmentComplianceReadResult> {
  try {
    const assessment =
      await prisma.assessment.findUnique({
        where: {
          id: assessmentId,
        },

        select: {
          id: true,
          organizationId: true,
          frameworkId: true,
          title: true,
          status: true,
          score: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!assessment) {
      return {
        success: false,
        reason: "ASSESSMENT_NOT_FOUND",
        message:
          "Compliance assessment not found.",
      };
    }

    if (
      assessment.organizationId !==
      organizationId
    ) {
      return {
        success: false,
        reason: "ASSESSMENT_ACCESS_DENIED",
        message:
          "Compliance assessment does not belong to the authorized organisation.",
      };
    }

    const readAssessment:
      AssessmentComplianceReadAssessment = {
      id: assessment.id,
      organizationId:
        assessment.organizationId,
      frameworkId:
        assessment.frameworkId,
      title: assessment.title,
      status: assessment.status,
      persistedScore: assessment.score,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
    };

    const disposition =
      determineAssessmentComplianceReadDisposition(
        assessment.status
      );

    if (
      disposition.mode === "HISTORICAL"
    ) {
      return {
        success: true,
        mode: "HISTORICAL",

        assessment: readAssessment,

        score:
          selectHistoricalAssessmentComplianceScore(
            assessment.score
          ),

        scoreSource:
          disposition.scoreSource,

        applicabilityCoverage: null,

        coverageSource:
          disposition.coverageSource,

        calculation: null,
      };
    }

    const calculation =
      await calculateAssessmentCompliance(
        organizationId,
        assessment.id,
        now
      );

    if (!calculation.success) {
      return calculation;
    }

    return {
      success: true,
      mode: "LIVE",

      assessment: readAssessment,

      score:
        calculation.calculation.score,

      scoreSource:
        disposition.scoreSource,

      applicabilityCoverage:
        calculation.applicabilityCoverage,

      coverageSource:
        disposition.coverageSource,

      calculation:
        calculation.calculation,
    };
  } catch {
    return {
      success: false,
      reason:
        "ASSESSMENT_COMPLIANCE_READ_FAILED",
      message:
        "Compliance assessment state could not be read safely.",
    };
  }
}

/*
 * ============================================================
 * TYPE-LEVEL CONTRACT ASSERTIONS
 * ============================================================
 *
 * These aliases deliberately retain the source unions so future
 * edits cannot silently widen the read-model provenance labels.
 * ============================================================
 */

type _ScoreSourceContract =
  AssessmentComplianceScoreSource;

type _CoverageSourceContract =
  AssessmentApplicabilityCoverageSource;

void (0 as unknown as _ScoreSourceContract);
void (0 as unknown as _CoverageSourceContract);

/*
 * ============================================================
 * READ CURRENT AUTHORITATIVE ASSESSMENT COMPLIANCE
 * ============================================================
 *
 * Resolves explicit CurrentAssessmentAuthority for the exact
 * Organization + Framework tuple, validates the returned
 * authority tuple, then delegates to the specific-Assessment
 * compliance read boundary above.
 *
 * This operation never infers authority from:
 *
 * - lifecycle status;
 * - timestamps;
 * - creation order;
 * - persisted score;
 * - "latest" Assessment selection.
 *
 * It performs no persistence or authority mutation.
 * ============================================================
 */

export async function getCurrentAssessmentComplianceRead(
  organizationId: string,
  frameworkId: string,
  now: Date = new Date()
): Promise<AssessmentComplianceReadResult> {
  try {
    const authorityResult =
      await getCurrentAssessmentAuthority(
        organizationId,
        frameworkId
      );

    if (!authorityResult.success) {
      return {
        success: false,
        reason: authorityResult.reason,
        message: authorityResult.message,
      };
    }

    const authority =
      authorityResult.authority;

    if (
      authority.organizationId !==
        organizationId ||
      authority.frameworkId !== frameworkId
    ) {
      return {
        success: false,
        reason:
          "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
        message:
          "Current compliance assessment authority does not match the requested organisation and framework.",
      };
    }

    const read =
      await getAssessmentComplianceRead(
        organizationId,
        authority.assessmentId,
        now
      );

    if (!read.success) {
      return read;
    }

    if (
      read.assessment.frameworkId !==
      frameworkId
    ) {
      return {
        success: false,
        reason:
          "CURRENT_AUTHORITY_INTEGRITY_VIOLATION",
        message:
          "Current compliance assessment authority points to an assessment outside the requested framework.",
      };
    }

    return read;
  } catch {
    return {
      success: false,
      reason:
        "ASSESSMENT_COMPLIANCE_READ_FAILED",
      message:
        "Current authoritative compliance assessment state could not be read safely.",
    };
  }
}
