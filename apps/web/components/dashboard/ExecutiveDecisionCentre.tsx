"use client";

import type { ExecutiveIntelligenceData } from "@/types/executive";

type Props = {
  data: ExecutiveIntelligenceData;
};

export default function ExecutiveDecisionCentre({
  data,
}: Props) {

  return (

    <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">

            Executive Decision Centre™

          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-900">

            Executive Health™

          </h2>

        </div>

        <div className="text-right">

          <h1 className="text-6xl font-black text-blue-600">

            {data.executiveHealth}%

          </h1>

          <p className="text-slate-500">

            Overall Executive Score

          </p>

        </div>

      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">

        <DecisionCard

          title="Organisation Status"

          value={data.organisationStatus}

        />

        <DecisionCard

          title="Investment Readiness"

          value={`${data.fundingScore}%`}

        />

        <DecisionCard

          title="Business Risk"

          value={data.businessRisk}

        />

      </div>

      <div className="mt-10 rounded-3xl bg-blue-50 p-8">

        <p className="text-sm uppercase tracking-[0.25em] text-blue-600">

          Executive Recommendation

        </p>

        <h3 className="mt-3 text-2xl font-bold text-slate-900">

          {data.recommendation}

        </h3>

      </div>

    </section>

  );

}

function DecisionCard({

  title,

  value,

}: {

  title: string;

  value: string;

}) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">

      <p className="text-sm uppercase tracking-wide text-slate-500">

        {title}

      </p>

      <h3 className="mt-3 text-3xl font-black text-slate-900">

        {value}

      </h3>

    </div>

  );

}
