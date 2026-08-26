"use client";

import {
  Activity,
  ArrowUp,
  ShieldCheck,
  Briefcase,
  Landmark,
} from "lucide-react";

const activities = [
  {
    icon: ShieldCheck,
    title: "Governance Verification",
    description: "Trust Score increased by 9 points.",
    time: "12 min ago",
    color: "text-emerald-400",
  },
  {
    icon: Briefcase,
    title: "Procurement Opportunity",
    description: "2 new tenders match your profile.",
    time: "35 min ago",
    color: "text-blue-400",
  },
  {
    icon: Landmark,
    title: "Funding Match",
    description: "SEFA Growth Programme identified.",
    time: "1 hour ago",
    color: "text-violet-400",
  },
  {
    icon: ArrowUp,
    title: "Digital Trust",
    description: "Organisation moved to Bronze+ tier.",
    time: "Today",
    color: "text-cyan-400",
  },
];

export default function ExecutiveActivityFeed() {
  return (
    <section className="executive-card p-8">

      <div className="flex items-center gap-3 mb-8">

        <Activity className="h-7 w-7 text-blue-400" />

        <div>

          <h2 className="text-2xl font-bold executive-title">
            Executive Activity
          </h2>

          <p className="executive-subtitle">
            Everything ComplianceOS is doing for your business.
          </p>

        </div>

      </div>

      <div className="space-y-5">

        {activities.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="rounded-2xl bg-[#0B1220] border border-white/10 p-5 flex gap-4"
            >

              <div className="mt-1">
                <Icon className={`h-6 w-6 ${item.color}`} />
              </div>

              <div className="flex-1">

                <div className="flex justify-between">

                  <h3 className="text-white font-semibold">
                    {item.title}
                  </h3>

                  <span className="text-xs text-slate-500">
                    {item.time}
                  </span>

                </div>

                <p className="mt-2 text-slate-300 leading-7">
                  {item.description}
                </p>

              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
}
