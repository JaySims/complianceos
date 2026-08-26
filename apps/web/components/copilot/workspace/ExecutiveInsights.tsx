import { AlertTriangle, TrendingUp, Shield } from "lucide-react";

import {
  ExecutiveInsight,
} from "@/lib/insights/executiveInsightEngine";

type Props = {
  insights: ExecutiveInsight[];
};

export default function ExecutiveInsights({
  insights,
}: Props) {

  function icon(priority: ExecutiveInsight["priority"]) {

    switch (priority) {

      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-400" />;

      case "medium":
        return <Shield className="h-5 w-5 text-amber-400" />;

      default:
        return <TrendingUp className="h-5 w-5 text-emerald-400" />;

    }

  }

  return (

    <section className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6">

      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
        Executive Insights™
      </p>

      <div className="mt-6 space-y-4">

        {insights.map((insight) => (

          <div
            key={insight.id}
            className="rounded-2xl bg-white/[0.03] p-5"
          >

            <div className="flex items-center gap-3">

              {icon(insight.priority)}

              <h3 className="font-semibold text-white">
                {insight.title}
              </h3>

            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              {insight.description}
            </p>

          </div>

        ))}

      </div>

    </section>

  );

}
