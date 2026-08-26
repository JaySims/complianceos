import {
  BrainCircuit,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Workflow,
} from "lucide-react";

import {
  ExecutiveTimelineEvent,
} from "@/lib/timeline/executiveTimelineEngine";

type Props = {
  events: ExecutiveTimelineEvent[];
};

export default function ExecutiveTimeline({
  events,
}: Props) {

  function icon(type: ExecutiveTimelineEvent["type"]) {

    switch (type) {

      case "mission":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;

      case "workflow":
        return <Workflow className="h-5 w-5 text-cyan-300" />;

      case "forecast":
        return <TrendingUp className="h-5 w-5 text-violet-300" />;

      case "trust":
        return <Calendar className="h-5 w-5 text-amber-300" />;

      default:
        return <BrainCircuit className="h-5 w-5 text-cyan-300" />;

    }

  }

  return (

    <section className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6">

      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">

        Executive Timeline™

      </p>

      <div className="mt-8 space-y-5">

        {events.map((event) => (

          <div
            key={event.id}
            className="flex gap-4 rounded-2xl bg-white/[0.03] p-5"
          >

            <div className="mt-1">
              {icon(event.type)}
            </div>

            <div>

              <h3 className="font-semibold text-white">
                {event.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {event.description}
              </p>

              <p className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-500">
                {event.date}
              </p>

            </div>

          </div>

        ))}

      </div>

    </section>

  );

}
