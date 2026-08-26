"use client";

import {
  ShieldCheck,
  Landmark,
  BriefcaseBusiness,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import { ExecutiveIntelligenceData } from "@/types/executive";

type Props = {
  data: ExecutiveIntelligenceData;
};

type IntelligenceCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
};

function IntelligenceCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
}: IntelligenceCardProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            {title}
          </p>

          <h2 className="mt-3 text-4xl font-black text-white">
            {value}
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {subtitle}
          </p>

        </div>

        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

export default function ExecutiveIntelligence({
  data,
}: Props) {
  return (
    <section className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 shadow-2xl">

      <div className="mb-8 flex items-center justify-between">

        <div>

          <h2 className="text-3xl font-black text-white">
            Executive Intelligence Centre
          </h2>

          <p className="mt-2 text-slate-400">
            Live AI analysis across your organisation.
          </p>

        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2">

          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />

          <span className="text-sm font-semibold text-emerald-300">
            Live Intelligence
          </span>

        </div>

      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        <IntelligenceCard
          title="Digital Trust™"
          value={`${data.trustScore}%`}
          subtitle="Organisation Trust Score"
          gradient="from-blue-600 to-cyan-500"
          icon={<ShieldCheck className="h-8 w-8" />}
        />

        <IntelligenceCard
          title="Compliance"
          value={`${data.complianceScore}%`}
          subtitle="AI Compliance Index"
          gradient="from-emerald-600 to-green-500"
          icon={<TrendingUp className="h-8 w-8" />}
        />

        <IntelligenceCard
          title="Funding"
          value={`${data.fundingScore}%`}
          subtitle="Investment Readiness"
          gradient="from-cyan-600 to-sky-500"
          icon={<Landmark className="h-8 w-8" />}
        />

        <IntelligenceCard
          title="Procurement"
          value={`${data.procurementScore}%`}
          subtitle="Enterprise Readiness"
          gradient="from-violet-600 to-purple-500"
          icon={<BriefcaseBusiness className="h-8 w-8" />}
        />

        <IntelligenceCard
          title="AI Confidence"
          value={`${data.aiConfidence}%`}
          subtitle="Executive Decision Engine"
          gradient="from-indigo-600 to-blue-500"
          icon={<BrainCircuit className="h-8 w-8" />}
        />

        <IntelligenceCard
          title="Business Risk"
          value={data.businessRisk}
          subtitle="Current Operational Exposure"
          gradient="from-orange-500 to-red-500"
          icon={<AlertTriangle className="h-8 w-8" />}
        />

      </div>

    </section>
  );
}
