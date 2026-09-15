"use client";

import { useEffect, useState } from "react";

import ExecutiveWorkflowPage from "@/components/workflows/ExecutiveWorkflowPage";

type FrameworkPortfolioEntry = {
  authorityId: string;
  organizationId: string;
  framework: {
    id: string;
    name: string;
    version: string | null;
    description: string | null;
  };
  assessmentId: string;
};

type FrameworkPortfolioResponse = {
  success: true;
  organizationId: string;
  entries: FrameworkPortfolioEntry[];
};

type ApplicabilityCoverage = {
  applicableRequirementIds: string[];
  notApplicableRequirementIds: string[];
  undeterminedRequirementIds: string[];
  applicableCount: number;
  notApplicableCount: number;
  undeterminedCount: number;
  resolvedCount: number;
  totalDeterminationCount: number;
  coverageRatio: number | null;
  coveragePercentage: number | null;
  fullyResolved: boolean;
};

type AssessmentComplianceRead = {
  success: true;
  mode: "LIVE" | "HISTORICAL";
  assessment: {
    id: string;
    frameworkId: string;
    title: string;
    status: string;
  };
  score: number | null;
  scoreSource: "LIVE_CALCULATION" | "PERSISTED_HISTORICAL";
  applicabilityCoverage: ApplicabilityCoverage | null;
  coverageSource: "LIVE_CALCULATION" | "HISTORICAL_UNAVAILABLE";
};

export default function ComplianceWorkspace() {
  const [portfolio, setPortfolio] =
    useState<FrameworkPortfolioEntry[]>([]);

  const [portfolioLoading, setPortfolioLoading] =
    useState(true);

  const [portfolioError, setPortfolioError] =
    useState<string | null>(null);

  const [selectedFrameworkId, setSelectedFrameworkId] =
    useState<string | null>(null);

  const [assessmentRead, setAssessmentRead] =
    useState<AssessmentComplianceRead | null>(null);

  const [assessmentLoading, setAssessmentLoading] =
    useState(false);

  const [assessmentError, setAssessmentError] =
    useState<string | null>(null);

  const selectedPortfolioEntry =
    selectedFrameworkId
      ? portfolio.find(
          (entry) =>
            entry.framework.id === selectedFrameworkId
        ) ?? null
      : null;

  useEffect(() => {
    let cancelled = false;

    async function loadPortfolio() {
      setPortfolioLoading(true);
      setPortfolioError(null);

      try {
        const response =
          await fetch("/api/compliance/frameworks");

        const result =
          (await response.json()) as
            | FrameworkPortfolioResponse
            | {
                success: false;
                message?: string;
              };

        if (
          !response.ok ||
          !result.success ||
          !("entries" in result) ||
          !Array.isArray(result.entries)
        ) {
          throw new Error(
            !result.success && result.message
              ? result.message
              : "Unable to load compliance frameworks."
          );
        }

        if (!cancelled) {
          setPortfolio(result.entries);
        }
      } catch (error) {
        if (!cancelled) {
          setPortfolio([]);
          setPortfolioError(
            error instanceof Error
              ? error.message
              : "Unable to load compliance frameworks."
          );
        }
      } finally {
        if (!cancelled) {
          setPortfolioLoading(false);
        }
      }
    }

    void loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!selectedPortfolioEntry) {
      setAssessmentRead(null);
      setAssessmentError(null);
      setAssessmentLoading(false);

      return () => {
        cancelled = true;
      };
    }

    const frameworkId =
      selectedPortfolioEntry.framework.id;

    const assessmentId =
      selectedPortfolioEntry.assessmentId;

    async function loadAssessment() {
      setAssessmentRead(null);
      setAssessmentError(null);
      setAssessmentLoading(true);

      try {
        const response =
          await fetch(
            `/api/compliance/assessment?frameworkId=${encodeURIComponent(
              frameworkId
            )}`
          );

        const result =
          (await response.json()) as
            | AssessmentComplianceRead
            | {
                success: false;
                message?: string;
              };

        if (
          !response.ok ||
          !result.success ||
          !("assessment" in result)
        ) {
          throw new Error(
            !result.success && result.message
              ? result.message
              : "Unable to load compliance assessment."
          );
        }

        if (
          result.assessment.frameworkId !==
            frameworkId ||
          result.assessment.id !== assessmentId
        ) {
          throw new Error(
            "Authoritative assessment changed. Refresh compliance frameworks."
          );
        }

        if (!cancelled) {
          setAssessmentRead(result);
        }
      } catch (error) {
        if (!cancelled) {
          setAssessmentRead(null);
          setAssessmentError(
            error instanceof Error
              ? error.message
              : "Unable to load compliance assessment."
          );
        }
      } finally {
        if (!cancelled) {
          setAssessmentLoading(false);
        }
      }
    }

    void loadAssessment();

    return () => {
      cancelled = true;
    };
  }, [selectedPortfolioEntry]);


  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
            Compliance Frameworks
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Authoritative compliance portfolio
          </h1>

          <p className="mt-2 text-slate-500">
            Select a framework currently established for this organisation.
          </p>
        </div>

        {portfolioLoading ? (
          <p className="text-slate-500">
            Loading compliance frameworks...
          </p>
        ) : portfolioError ? (
          <p className="text-red-600">
            {portfolioError}
          </p>
        ) : portfolio.length === 0 ? (
          <p className="text-slate-500">
            No authoritative compliance frameworks are currently established.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {portfolio.map((entry) => {
              const selected =
                selectedFrameworkId === entry.framework.id;

              return (
                <button
                  key={entry.authorityId}
                  type="button"
                  onClick={() =>
                    setSelectedFrameworkId(entry.framework.id)
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    selected
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                  }`}
                >
                  <span className="block font-semibold">
                    {entry.framework.name}
                  </span>

                  {entry.framework.version && (
                    <span
                      className={`mt-1 block text-sm ${
                        selected
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      Version {entry.framework.version}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
            Compliance Position
          </p>

          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            Authoritative assessment
          </h2>
        </div>

        {!selectedPortfolioEntry ? (
          <p className="text-slate-500">
            Select an authoritative compliance framework to view its assessment.
          </p>
        ) : assessmentLoading ? (
          <p className="text-slate-500">
            Loading authoritative assessment...
          </p>
        ) : assessmentError ? (
          <p className="text-red-600">
            {assessmentError}
          </p>
        ) : assessmentRead ? (
          <div className="space-y-6">
            <div>
              <p className="font-semibold text-slate-900">
                {assessmentRead.assessment.title}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {assessmentRead.mode === "LIVE"
                  ? "Current assessment"
                  : "Completed historical assessment"}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Compliance Score
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {assessmentRead.score === null
                    ? "Unavailable"
                    : `${assessmentRead.score}%`}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {assessmentRead.scoreSource === "LIVE_CALCULATION"
                    ? "Calculated from the current authoritative assessment."
                    : "Persisted historical score."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Applicability Coverage
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {assessmentRead.coverageSource ===
                  "HISTORICAL_UNAVAILABLE"
                    ? "Unavailable"
                    : assessmentRead.applicabilityCoverage
                        ?.coveragePercentage === null ||
                      assessmentRead.applicabilityCoverage
                        ?.coveragePercentage === undefined
                      ? "Unavailable"
                      : `${assessmentRead.applicabilityCoverage.coveragePercentage}%`}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {assessmentRead.coverageSource ===
                  "HISTORICAL_UNAVAILABLE"
                    ? "Applicability coverage is unavailable historically."
                    : "Current applicability determination coverage."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">
            No authoritative assessment data is available.
          </p>
        )}
      </section>

      <ExecutiveWorkflowPage workflowId="compliance" />
    </div>
  );
}
