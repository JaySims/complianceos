"use client";

import {
  BrainCircuit,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import { useExecutiveState } from "@/contexts/ExecutiveStateContext";
import { buildExecutiveAdvisor } from "@/lib/advisor/executiveAdvisor";

export default function ExecutiveAssistant() {
  const { brain } = useExecutiveState();

  const advisor = buildExecutiveAdvisor({
    trustScore: brain.trustScore,
    businessRisk: brain.businessRisk,
    mission: brain.mission,
    opportunities: brain.opportunities,
  });

  const highestInsight =
    brain.insights[0] ?? null;

  const highestRisk =
    brain.risks[0] ?? null;

  return (
    <section className="rounded-[36px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">

      {/* Header */}

      <div className="flex items-center gap-5">

        <div className="rounded-3xl bg-cyan-500/15 p-4">

          <BrainCircuit className="h-10 w-10 text-cyan-300" />

        </div>

        <div>

          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">

            Executive Intelligence™

          </p>

          <h2 className="mt-2 text-3xl font-black text-white">

            {advisor.greeting}

          </h2>

        </div>

      </div>

      {/* Executive Summary */}

      <Section title="Executive Summary">

        <p className="leading-8 text-slate-300">

          {advisor.executiveSummary}

        </p>

      </Section>

      {/* Executive Priority */}

      <Section title="Highest Executive Priority">

        <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">

          <h3 className="text-xl font-bold text-cyan-300">

            {brain.activeMission}

          </h3>

          <p className="mt-4 leading-7 text-slate-300">

            {brain.mission.description}

          </p>

          <div className="mt-6 flex items-center justify-between">

            <span className="text-sm text-slate-400">

              Mission progress

            </span>

            <span className="font-bold text-white">

              {brain.missionProgress.progress}%

            </span>

          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">

            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
              style={{
                width: `${brain.missionProgress.progress}%`,
              }}
            />

          </div>

        </div>

      </Section>

      {/* Executive Insight */}

      <Section title="Executive Insight">

        {highestInsight ? (

          <div>

            <div className="flex items-start gap-3">

              <TrendingUp className="mt-1 h-5 w-5 shrink-0 text-emerald-400" />

              <div>

                <h3 className="font-bold text-white">

                  {highestInsight.title}

                </h3>

                <p className="mt-3 leading-7 text-slate-300">

                  {highestInsight.description}

                </p>

              </div>

            </div>

          </div>

        ) : (

          <p className="leading-7 text-slate-300">

            Executive AI has not detected any urgent strategic constraints.

          </p>

        )}

      </Section>

      {/* Risk Intelligence */}

      <Section title="Risk Intelligence">

        {highestRisk ? (

          <div className="flex items-start gap-3">

            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-amber-400" />

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h3 className="font-bold text-white">

                  {highestRisk.title}

                </h3>

                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">

                  {highestRisk.level}

                </span>

              </div>

              <p className="mt-3 leading-7 text-slate-300">

                {highestRisk.description}

              </p>

              <p className="mt-4 text-sm font-semibold text-cyan-300">

                {highestRisk.recommendation}

              </p>

            </div>

          </div>

        ) : (

          <p className="leading-7 text-slate-300">

            No significant strategic risks have been detected.

          </p>

        )}

      </Section>

      {/* Predicted Outcome */}

      <Section title="Predicted Business Outcome">

        <div className="space-y-4">

          <MetricRow
            label="Digital Trust™"
            value={`${brain.trustScore}% → ${brain.predictedTrust}%`}
          />

          <MetricRow
            label="Projected Trust Gain"
            value={`+${brain.trustGain}%`}
          />

          <MetricRow
            label="Business Risk"
            value={`${brain.forecast.currentRisk} → ${brain.forecast.projectedRisk}`}
          />

          <MetricRow
            label="Opportunity Value"
            value={`R${brain.revenueOpportunity.toLocaleString()}`}
          />

          <MetricRow
            label="Executive Confidence"
            value={`${brain.executiveConfidence}%`}
          />

        </div>

      </Section>

      {/* Recommended Action */}

      <Section title="Recommended Executive Action">

        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">

          <div className="flex items-start gap-3">

            <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-400" />

            <div>

              <h3 className="text-xl font-bold text-white">

                {advisor.recommendation}

              </h3>

              <p className="mt-4 leading-7 text-slate-300">

                {advisor.expectedImpact}

              </p>

              <p className="mt-5 text-sm text-slate-300">

                Priority:

                <span className="ml-2 font-bold text-white">

                  {advisor.priority}

                </span>

              </p>

            </div>

          </div>

        </div>

      </Section>

      <button className="mt-10 w-full rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-5 text-lg font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20">

        {advisor.actionButton}

      </button>

    </section>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({
  title,
  children,
}: SectionProps) {
  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">

      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">

        {title}

      </p>

      <div className="mt-6">

        {children}

      </div>

    </div>
  );
}

type MetricRowProps = {
  label: string;
  value: string;
};

function MetricRow({
  label,
  value,
}: MetricRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">

      <span className="text-sm text-slate-400">

        {label}

      </span>

      <span className="text-right font-bold text-white">

        {value}

      </span>

    </div>
  );
}
