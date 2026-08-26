"use client";

import {
  ShieldCheck,
  Landmark,
  BriefcaseBusiness,
  FileCheck2,
  BrainCircuit,
  TrendingUp,
} from "lucide-react";

type ExecutiveKPIStripProps = {
  trustScore: number;
  fundingReadiness: number;
  complianceReadiness: number;
  procurementReadiness: number;
  governanceMaturity: number;
  aiConfidence: number;
};

type KPI = {
  title: string;
  value: string;
  icon: React.ReactNode;
};

export default function ExecutiveKPIStrip({
  trustScore,
  fundingReadiness,
  complianceReadiness,
  procurementReadiness,
  governanceMaturity,
  aiConfidence,
}: ExecutiveKPIStripProps) {

  const kpis: KPI[] = [

    {
      title: "Digital Trust™",
      value: `${trustScore}%`,
      icon: <ShieldCheck className="h-5 w-5 text-cyan-300" />,
    },

    {
      title: "Funding",
      value: `${fundingReadiness}%`,
      icon: <Landmark className="h-5 w-5 text-emerald-300" />,
    },

    {
      title: "Compliance",
      value: `${complianceReadiness}%`,
      icon: <FileCheck2 className="h-5 w-5 text-violet-300" />,
    },

    {
      title: "Procurement",
      value: `${procurementReadiness}%`,
      icon: <BriefcaseBusiness className="h-5 w-5 text-amber-300" />,
    },

    {
      title: "Governance",
      value: `${governanceMaturity}%`,
      icon: <TrendingUp className="h-5 w-5 text-orange-300" />,
    },

    {
      title: "AI Confidence",
      value: `${aiConfidence}%`,
      icon: <BrainCircuit className="h-5 w-5 text-cyan-300" />,
    },

  ];

  return (

    <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">

      {kpis.map((kpi) => (

        <div
          key={kpi.title}
          className="rounded-3xl border border-white/10 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >

          <div className="flex items-center justify-between">

            {kpi.icon}

          </div>

          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-500">

            {kpi.title}

          </p>

          <h3 className="mt-3 text-3xl font-black text-slate-900">

            {kpi.value}

          </h3>

        </div>

      ))}

    </section>

  );

}
