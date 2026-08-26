"use client";

import {
  Building2,
  Users,
  ShieldCheck,
  ClipboardCheck,
  FolderOpen,
  Sparkles,
  Rocket,
  CheckCircle2,
  Lock,
  Clock3,
  BrainCircuit,
} from "lucide-react";

import { useMission } from "@/contexts/MissionContext";

const icons = [
  Building2,
  Users,
  ShieldCheck,
  ClipboardCheck,
  FolderOpen,
  Sparkles,
  Rocket,
];

export default function ExecutiveJourneySidebar() {

  const {
    mission,
    step,
    totalSteps,
  } = useMission();

  const missions = [

    {
      title: "Organisation Identity",
      time: "5 min",
    },

    {
      title: "Business Contacts",
      time: "4 min",
    },

    {
      title: "Governance",
      time: "6 min",
    },

    {
      title: "Compliance",
      time: "8 min",
    },

    {
      title: "Document Vault",
      time: "7 min",
    },

    {
      title: "AI Review",
      time: "3 min",
    },

    {
      title: "Launch Workspace",
      time: "2 min",
    },

  ];

  const progress = Math.round(
    (step / totalSteps) * 100
  );

  return (

    <aside className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">

      <h2 className="text-2xl font-bold text-slate-900">

        Executive Journey

      </h2>

      <p className="mt-2 text-slate-500">

        Complete every executive mission to unlock the full ComplianceOS workspace.

      </p>

      <div className="mt-10">

        {missions.map((item, index) => {

          const Icon = icons[index];

          const completed = index + 1 < step;

          const active = index + 1 === step;

          const locked = index + 1 > step;

          return (

            <div
              key={item.title}
              className="relative flex"
            >

              {/* Timeline */}

              <div className="mr-5 flex w-10 flex-col items-center">

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full

                  ${
                    completed
                      ? "bg-emerald-100 text-emerald-600"
                      : active
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >

                  {completed ? (

                    <CheckCircle2 className="h-5 w-5"/>

                  ) : locked ? (

                    <Lock className="h-5 w-5"/>

                  ) : (

                    <Icon className="h-5 w-5"/>

                  )}

                </div>

                {index !== missions.length - 1 && (

                  <div className="h-12 w-px bg-slate-200"/>

                )}

              </div>

              {/* Card */}

              <div
                className={`mb-6 flex-1 rounded-2xl border p-5

                ${
                  active
                    ? "border-blue-500 bg-blue-50"
                    : completed
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                }`}
              >

                <div className="flex justify-between">

                  <div>

                    <h3 className="font-semibold text-slate-900">

                      {item.title}

                    </h3>

                    <p
                      className={`mt-1 text-sm

                      ${
                        active
                          ? "text-blue-600 font-semibold"
                          : completed
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >

                      {completed
                        ? "Completed"
                        : active
                        ? "Current Mission"
                        : "Locked"}

                    </p>

                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">

                    <Clock3 className="h-4 w-4"/>

                    {completed ? "Done" : item.time}

                  </div>

                </div>

              </div>

            </div>

          );

        })}

      </div>

      {/* Progress */}

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">

        <div className="flex justify-between">

          <h3 className="font-bold text-slate-900">

            Overall Progress

          </h3>

          <span className="text-lg font-bold text-blue-600">

            {progress}%

          </span>

        </div>

        <div className="mt-4 h-3 rounded-full overflow-hidden bg-slate-200">

          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

        <p className="mt-4 text-sm text-slate-600">

          {step} of {totalSteps} Executive Missions

        </p>

      </div>

      {/* AI */}

      <div className="mt-6 rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">

        <div className="flex items-center gap-3">

          <BrainCircuit className="h-6 w-6"/>

          <h3 className="font-bold">

            Executive AI

          </h3>

        </div>

        <p className="mt-5 text-blue-100">

          {mission.title}

        </p>

        <p className="mt-3 text-sm text-blue-200">

          Expected Trust Increase

        </p>

        <h2 className="mt-1 text-3xl font-black">

          +{mission.trustIncrease}

        </h2>

      </div>

    </aside>

  );

}
