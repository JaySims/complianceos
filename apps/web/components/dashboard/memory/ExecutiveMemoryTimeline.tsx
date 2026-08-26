"use client";

import type {
  ExecutiveSnapshot,
} from "@/lib/memory/executiveMemoryEngine";

type Props = {
  history: ExecutiveSnapshot[];
};

export default function ExecutiveMemoryTimeline({
  history,
}: Props) {

  return (

    <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">

      <h2 className="text-2xl font-black text-white">
        Executive Memory™
      </h2>

      <p className="mt-2 text-slate-400">
        Organisational intelligence built over time.
      </p>

      <div className="mt-8 space-y-6">

        {history.map((snapshot) => (

          <div
            key={snapshot.date}
            className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
          >

            <div className="flex items-center justify-between">

              <h3 className="font-bold text-white">
                {snapshot.date}
              </h3>

              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-300">
                Trust {snapshot.trustScore}%
              </span>

            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">

              <Metric
                title="Procurement"
                value={`${snapshot.procurementReadiness}%`}
              />

              <Metric
                title="Funding"
                value={`${snapshot.fundingReadiness}%`}
              />

              <Metric
                title="Risk"
                value={snapshot.businessRisk}
              />

            </div>

            <div className="mt-5 rounded-xl bg-slate-950/60 p-4">

              <p className="text-sm text-slate-400">
                Completed Mission
              </p>

              <p className="mt-2 font-semibold text-white">
                {snapshot.completedMission}
              </p>

            </div>

          </div>

        ))}

      </div>

    </section>

  );

}

function Metric({
  title,
  value,
}: {
  title: string;
  value: string;
}) {

  return (

    <div className="rounded-xl bg-slate-950/50 p-4">

      <p className="text-xs uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <h4 className="mt-2 text-xl font-black text-white">
        {value}
      </h4>

    </div>

  );

}
