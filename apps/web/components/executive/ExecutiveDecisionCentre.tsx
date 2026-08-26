"use client";

import { ArrowRight } from "lucide-react";

export type ExecutiveDecision = {
  id: string;
  title: string;
  impact: number;
  trustGain: number;
  revenueGain: number;
  duration: string;
  confidence: number;
};

type Props = {
  decisions: ExecutiveDecision[];
};

export default function ExecutiveDecisionCentre({
  decisions,
}: Props) {

  return (

    <section className="rounded-[36px] border border-white/10 bg-white p-8 shadow-sm">

      <h2 className="text-3xl font-black text-slate-900">

        Executive Decision Centre™

      </h2>

      <p className="mt-3 text-slate-500">

        AI-ranked strategic decisions.

      </p>

      <div className="mt-10 space-y-6">

        {decisions.map((decision) => (

          <div
            key={decision.id}
            className="rounded-3xl border border-slate-200 p-6 transition hover:border-cyan-400"
          >

            <div className="flex items-center justify-between">

              <div>

                <h3 className="text-xl font-bold">

                  {decision.title}

                </h3>

                <p className="mt-2 text-slate-500">

                  Estimated Duration: {decision.duration}

                </p>

              </div>

              <ArrowRight className="h-6 w-6 text-cyan-600" />

            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

              <Metric
                label="Impact"
                value={`${decision.impact}/5`}
              />

              <Metric
                label="Trust Gain"
                value={`+${decision.trustGain}%`}
              />

              <Metric
                label="Opportunity"
                value={`R${decision.revenueGain.toLocaleString()}`}
              />

              <Metric
                label="Confidence"
                value={`${decision.confidence}%`}
              />

            </div>

          </div>

        ))}

      </div>

    </section>

  );

}

function Metric({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div className="rounded-2xl bg-slate-100 p-4">

      <p className="text-xs uppercase tracking-wider text-slate-500">

        {label}

      </p>

      <h4 className="mt-2 text-xl font-bold">

        {value}

      </h4>

    </div>

  );

}
