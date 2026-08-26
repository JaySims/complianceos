"use client";

import {
  BrainCircuit,
  ShieldAlert,
  TrendingUp,
  Target,
  Sparkles,
} from "lucide-react";

type ExecutiveIntelligenceCanvasProps = {
  trustScore: number;
  executiveConfidence: number;
  activeMission: string;
  predictedTrust: number;
  riskCount: number;
  opportunityCount: number;
};

export default function ExecutiveIntelligenceCanvas({

  trustScore,

  executiveConfidence,

  activeMission,

  predictedTrust,

  riskCount,

  opportunityCount,

}: ExecutiveIntelligenceCanvasProps) {

  return (

    <section className="rounded-[40px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-10 shadow-[0_35px_90px_rgba(0,0,0,0.45)]">

      <div className="flex items-center gap-5">

        <BrainCircuit className="h-10 w-10 text-cyan-300" />

        <div>

          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">

            Executive AI™

          </p>

          <h2 className="mt-2 text-4xl font-black text-white">

            Executive Intelligence Canvas™

          </h2>

        </div>

      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">

        <CanvasCard
          icon={<ShieldAlert className="h-8 w-8 text-red-400" />}
          title="Strategic Risks"
          value={riskCount.toString()}
          subtitle="Active risks requiring executive attention."
        />

        <CanvasCard
          icon={<BrainCircuit className="h-8 w-8 text-cyan-300" />}
          title="Digital Trust™"
          value={`${trustScore}%`}
          subtitle={`AI Confidence ${executiveConfidence}%`}
        />

        <CanvasCard
          icon={<TrendingUp className="h-8 w-8 text-emerald-400" />}
          title="Growth Opportunities"
          value={opportunityCount.toString()}
          subtitle="Enterprise opportunities identified."
        />

      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">

        <CanvasCard
          icon={<Target className="h-8 w-8 text-orange-400" />}
          title="Active Executive Mission"
          value={activeMission}
          subtitle="Current strategic priority."
        />

        <CanvasCard
          icon={<Sparkles className="h-8 w-8 text-violet-400" />}
          title="Predicted Trust™"
          value={`${predictedTrust}%`}
          subtitle="Expected score after mission completion."
        />

      </div>

    </section>

  );

}

type CanvasCardProps = {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
};

function CanvasCard({
  icon,
  title,
  value,
  subtitle,
}: CanvasCardProps) {

  return (

    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">

      <div className="flex items-center gap-4">

        {icon}

        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">

          {title}

        </p>

      </div>

      <h3 className="mt-6 text-3xl font-black text-white">

        {value}

      </h3>

      <p className="mt-4 leading-7 text-slate-400">

        {subtitle}

      </p>

    </div>

  );

}
