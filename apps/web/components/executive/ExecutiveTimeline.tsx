"use client";

import {
  CheckCircle2,
  Circle,
  Clock3,
  Sparkles,
} from "lucide-react";

export type ExecutiveTimelineEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  status: "completed" | "active" | "upcoming";
};

type ExecutiveTimelineProps = {
  events: ExecutiveTimelineEvent[];
};

export default function ExecutiveTimeline({
  events,
}: ExecutiveTimelineProps) {

  return (

    <section className="rounded-[36px] border border-white/10 bg-white p-8 shadow-sm">

      <div className="flex items-center gap-4">

        <Clock3 className="h-8 w-8 text-cyan-600" />

        <div>

          <p className="text-xs uppercase tracking-[0.35em] text-cyan-600">

            Organisation Journey

          </p>

          <h2 className="text-3xl font-black text-slate-900">

            Executive Timeline™

          </h2>

        </div>

      </div>

      <div className="mt-10 space-y-8">

        {events.map((event, index) => {

          const isLast =
            index === events.length - 1;

          return (

            <div
              key={event.id}
              className="flex gap-5"
            >

              <div className="flex flex-col items-center">

                {event.status === "completed" && (

                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />

                )}

                {event.status === "active" && (

                  <Sparkles className="h-7 w-7 text-cyan-500" />

                )}

                {event.status === "upcoming" && (

                  <Circle className="h-7 w-7 text-slate-400" />

                )}

                {!isLast && (

                  <div className="mt-2 h-20 w-[2px] bg-slate-200" />

                )}

              </div>

              <div className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 p-6">

                <div className="flex items-center justify-between">

                  <h3 className="text-xl font-bold text-slate-900">

                    {event.title}

                  </h3>

                  <span className="text-sm text-slate-500">

                    {event.date}

                  </span>

                </div>

                <p className="mt-4 leading-7 text-slate-600">

                  {event.description}

                </p>

              </div>

            </div>

          );

        })}

      </div>

    </section>

  );

}
