"use client";

import {
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

import ExecutivePanel from "./ExecutivePanel";

const actions = [
  {
    title: "Complete Director Verification",
    impact: "+18 Procurement Readiness",
    priority: "Highest Priority",
    icon: ShieldCheck,
    color: "text-emerald-400",
  },
  {
    title: "Upload POPIA Policy",
    impact: "+11 Trust Score",
    priority: "Recommended",
    icon: Sparkles,
    color: "text-blue-400",
  },
  {
    title: "Funding Opportunities Available",
    impact: "3 Active Matches",
    priority: "Opportunity",
    icon: Wallet,
    color: "text-violet-400",
  },
  {
    title: "Tax Clearance Expires Soon",
    impact: "41 Days Remaining",
    priority: "Attention",
    icon: AlertTriangle,
    color: "text-orange-400",
  },
];

export default function ExecutiveAIBrain() {
  return (
    <ExecutivePanel
      title="Executive AI Brain"
      subtitle="AI-powered executive briefing"
      icon={BrainCircuit}
    >
      <div className="space-y-8">

        <div>

          <p className="text-3xl font-bold text-white">
            Good Morning, Simphiwe.
          </p>

          <p className="mt-3 text-slate-400 leading-7">
            Based on today's analysis, your organisation can
            significantly improve its Digital Trust Profile by
            completing the recommended actions below.
          </p>

        </div>

        <div className="space-y-5">

          {actions.map((item) => {

            const Icon = item.icon;

            return (

              <div
                key={item.title}
                className="
                  flex
                  items-start
                  gap-5
                  rounded-2xl
                  border
                  border-white/5
                  bg-white/[0.03]
                  p-5
                  transition
                  hover:border-blue-500/20
                  hover:bg-white/[0.05]
                "
              >

                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-white/5
                  "
                >
                  <Icon
                    size={22}
                    className={item.color}
                  />
                </div>

                <div className="flex-1">

                  <div className="flex items-center justify-between">

                    <h3 className="font-semibold text-white">
                      {item.title}
                    </h3>

                    <span className="text-xs uppercase tracking-wider text-slate-500">
                      {item.priority}
                    </span>

                  </div>

                  <p className="mt-2 text-slate-400">
                    {item.impact}
                  </p>

                </div>

              </div>

            );

          })}

        </div>

        <div className="rounded-2xl bg-gradient-to-r from-blue-600/20 to-violet-600/20 p-6 border border-blue-500/20">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm uppercase tracking-widest text-slate-400">
                AI Confidence
              </p>

              <h2 className="mt-2 text-4xl font-bold text-white">
                96%
              </h2>

            </div>

            <ArrowUpRight
              className="text-emerald-400"
              size={40}
            />

          </div>

          <p className="mt-4 text-slate-300">
            Last analysis completed 2 minutes ago.
          </p>

        </div>

      </div>
    </ExecutivePanel>
  );
}
