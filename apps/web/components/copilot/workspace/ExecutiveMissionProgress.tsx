import { CheckCircle2, Circle } from "lucide-react";

import {
  MissionProgress,
} from "@/lib/missions/missionProgressEngine";

type Props = {
  mission: MissionProgress;
};

export default function ExecutiveMissionProgress({
  mission,
}: Props) {

  return (

    <section className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6">

      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">

        Executive Mission™

      </p>

      <h2 className="mt-3 text-2xl font-black text-white">

        {mission.mission}

      </h2>

      <div className="mt-6">

        <div className="h-3 overflow-hidden rounded-full bg-slate-800">

          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
            style={{
              width: `${mission.progress}%`,
            }}
          />

        </div>

        <p className="mt-3 text-sm text-slate-300">

          {mission.progress}% Complete

        </p>

      </div>

      <div className="mt-8 space-y-4">

        {mission.steps.map((step) => (

          <div
            key={step.id}
            className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-4"
          >

            {step.completed ? (

              <CheckCircle2 className="h-5 w-5 text-emerald-400" />

            ) : (

              <Circle className="h-5 w-5 text-slate-500" />

            )}

            <span className="text-slate-200">

              {step.title}

            </span>

          </div>

        ))}

      </div>

    </section>

  );

}
