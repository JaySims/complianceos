"use client";

import { useExecutiveAI } from "@/hooks/useExecutiveAI";

export default function ExecutiveBrief() {

  const intelligence = useExecutiveAI();

  return (

    <section className="rounded-3xl border border-white/10 bg-[#101A2E] p-6">

      <h2 className="text-2xl font-bold text-white">

        Executive Brief

      </h2>

      <p className="mt-2 text-slate-400">

        AI-generated organisational summary

      </p>

      <div className="mt-8 space-y-5">

        <BriefRow
          label="Digital Trust"
          value={`${intelligence.executiveTrust.percentage}%`}
        />

        <BriefRow
          label="Current Priority"
          value={intelligence.recommendation.title}
        />

        <BriefRow
          label="Business Risks"
          value={`${intelligence.risks.length}`}
        />

        <BriefRow
          label="Opportunities"
          value={`${intelligence.opportunities.length}`}
        />

        <BriefRow
          label="Expected Impact"
          value={`+${intelligence.recommendation.impact}`}
        />

      </div>

    </section>

  );

}

function BriefRow({

  label,

  value,

}:{

  label:string;

  value:string;

}){

  return(

    <div className="flex items-center justify-between border-b border-white/5 pb-3">

      <span className="text-slate-400">

        {label}

      </span>

      <span className="font-semibold text-white">

        {value}

      </span>

    </div>

  );

}
