"use client";

import { Clock3, Brain } from "lucide-react";

const memories = [
  {
    date: "Today",
    title: "Governance Verification Started",
    description:
      "Executive AI recommended Governance Verification as the highest-impact task.",
  },
  {
    date: "Yesterday",
    title: "Trust Score Improved",
    description:
      "Digital Trust Score increased after organisation identity verification.",
  },
  {
    date: "2 Days Ago",
    title: "Funding Opportunity",
    description:
      "AI identified SEFA Growth Programme as a high-confidence match.",
  },
];

export default function ExecutiveMemoryTimeline() {
  return (
    <section className="executive-card p-8">

      <div className="flex items-center gap-3 mb-8">

        <Brain className="h-7 w-7 text-violet-400" />

        <div>

          <h2 className="text-2xl font-bold executive-title">
            Executive Memory
          </h2>

          <p className="executive-subtitle">
            Everything ComplianceOS remembers about your organisation.
          </p>

        </div>

      </div>

      <div className="space-y-5">

        {memories.map((memory, index) => (

          <div
            key={index}
            className="rounded-2xl bg-[#0B1220] border border-white/10 p-5 flex gap-4"
          >

            <Clock3 className="h-5 w-5 text-blue-400 mt-1" />

            <div>

              <p className="text-xs text-slate-500">
                {memory.date}
              </p>

              <h3 className="text-white font-semibold mt-1">
                {memory.title}
              </h3>

              <p className="text-slate-300 mt-2 leading-7">
                {memory.description}
              </p>

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}
