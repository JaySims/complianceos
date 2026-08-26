"use client";

import {
  BrainCircuit,
  ShieldCheck,
  TrendingUp,
  BriefcaseBusiness,
  FileCheck,
} from "lucide-react";

const events = [
  {
    icon: BrainCircuit,
    color: "text-blue-400",
    title: "Executive AI completed organisation analysis",
    time: "Just now",
  },
  {
    icon: ShieldCheck,
    color: "text-emerald-400",
    title: "Compliance readiness increased to 91%",
    time: "2 min ago",
  },
  {
    icon: BriefcaseBusiness,
    color: "text-cyan-400",
    title: "2 procurement opportunities matched",
    time: "8 min ago",
  },
  {
    icon: TrendingUp,
    color: "text-violet-400",
    title: "Funding potential increased",
    time: "15 min ago",
  },
  {
    icon: FileCheck,
    color: "text-amber-400",
    title: "Company registration verified",
    time: "23 min ago",
  },
];

export default function AILiveFeed() {
  return (
    <section className="executive-card p-6">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-white text-xl font-bold">
          AI Live Activity
        </h2>

        <span className="text-xs uppercase tracking-widest text-emerald-400">
          Live
        </span>

      </div>

      <div className="space-y-5">

        {events.map((event, index) => {
          const Icon = event.icon;

          return (
            <div
              key={index}
              className="flex gap-4 items-start"
            >
              <div
                className={`h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center ${event.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1">

                <p className="text-white text-sm leading-6">
                  {event.title}
                </p>

                <p className="text-slate-500 text-xs mt-1">
                  {event.time}
                </p>

              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
}
