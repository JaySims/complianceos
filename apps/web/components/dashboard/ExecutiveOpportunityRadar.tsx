"use client";

import {
  BriefcaseBusiness,
  Landmark,
  Rocket,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

import type {
  Opportunity,
} from "@/lib/opportunities/opportunityEngine";

type Props = {
  opportunities: Opportunity[];
};

function icon(category: Opportunity["category"]) {

  switch (category) {

    case "Funding":
      return <Landmark className="h-6 w-6" />;

    case "Procurement":
      return <BriefcaseBusiness className="h-6 w-6" />;

    case "Investment":
      return <TrendingUp className="h-6 w-6" />;

    default:
      return <Rocket className="h-6 w-6" />;

  }

}

function priorityColour(priority: Opportunity["priority"]) {

  switch (priority) {

    case "Critical":
      return "bg-red-500/20 text-red-300";

    case "High":
      return "bg-orange-500/20 text-orange-300";

    default:
      return "bg-blue-500/20 text-blue-300";

  }

}

export default function ExecutiveOpportunityRadar({
  opportunities,
}: Props) {

  const totalValue =
    opportunities.reduce(
      (sum, item) => sum + item.value,
      0
    );

  const topOpportunity = opportunities[0];

  return (

    <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 shadow-2xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">

            Executive Opportunity Radar™

          </p>

          <h2 className="mt-4 text-5xl font-black text-white">

            R{totalValue.toLocaleString()}

          </h2>

          <p className="mt-2 text-slate-400">

            Total Opportunity Available

          </p>

        </div>

        <AlertCircle className="h-12 w-12 text-cyan-400" />

      </div>

      {topOpportunity && (

        <div className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">

          <p className="text-sm uppercase tracking-widest text-cyan-300">

            AI Priority Recommendation

          </p>

          <h3 className="mt-3 text-3xl font-black text-white">

            {topOpportunity.title}

          </h3>

          <div className="mt-5 flex flex-wrap gap-4">

            <span className="rounded-full bg-white/10 px-4 py-2 text-white">

              Unlock Value

              <strong className="ml-2">

                R{topOpportunity.value.toLocaleString()}

              </strong>

            </span>

            <span className="rounded-full bg-white/10 px-4 py-2 text-white">

              {topOpportunity.confidence}% Confidence

            </span>

            <span className="rounded-full bg-white/10 px-4 py-2 text-white">

              {topOpportunity.estimatedTime}

            </span>

          </div>

        </div>

      )}

      <div className="mt-8 space-y-5">

        {opportunities.map((opportunity) => (

          <div
            key={opportunity.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/30"
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-5">

                <div className="rounded-2xl bg-cyan-500/15 p-4 text-cyan-300">

                  {icon(opportunity.category)}

                </div>

                <div>

                  <h3 className="text-2xl font-bold text-white">

                    {opportunity.title}

                  </h3>

                  <p className="text-slate-400">

                    {opportunity.category}

                  </p>

                </div>

              </div>

              <div className="text-right">

                <div className="text-3xl font-black text-emerald-400">

                  R{opportunity.value.toLocaleString()}

                </div>

                <div className="mt-2 text-sm text-slate-400">

                  {opportunity.confidence}% AI Confidence

                </div>

                <div
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${priorityColour(opportunity.priority)}`}
                >

                  {opportunity.priority}

                </div>

              </div>

            </div>

          </div>

        ))}

      </div>

    </section>

  );

}
