"use client";

import {
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  BriefcaseBusiness,
  Clock3,
  Target,
} from "lucide-react";

import { useMission } from "@/contexts/MissionContext";

export default function ExecutiveAdvisorPanel() {

  const { mission, step, totalSteps } = useMission();

  const readiness = Math.round((step / totalSteps) * 100);

  return (

    <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm p-8">

      {/* Header */}

      <div className="flex items-center gap-3">

        <div className="rounded-2xl bg-blue-600 p-3 text-white">

          <BrainCircuit className="h-6 w-6" />

        </div>

        <div>

          <h2 className="text-2xl font-bold text-slate-900">

            Executive AI

          </h2>

          <p className="text-slate-500">

            Your Business Advisor

          </p>

        </div>

      </div>

      {/* AI Brief */}

      <div className="mt-8 rounded-2xl bg-slate-50 p-6">

        <p className="text-slate-800 font-semibold">

          Good morning, Simphiwe.

        </p>

        <p className="mt-4 leading-7 text-slate-600">

          {mission.aiBrief}

        </p>

      </div>

      {/* Mission */}

      <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">

        <div className="flex items-center gap-3">

          <Target className="h-5 w-5 text-blue-600" />

          <div>

            <p className="font-semibold text-slate-900">

              Current Executive Mission

            </p>

            <p className="text-sm text-blue-600">

              {mission.title}

            </p>

          </div>

        </div>

      </div>

      {/* Metrics */}

      <div className="mt-8 space-y-4">

        <div className="rounded-2xl border border-slate-200 p-5">

          <div className="flex items-center gap-3">

            <TrendingUp className="h-5 w-5 text-emerald-600" />

            <div>

              <p className="font-semibold text-slate-900">

                Trust Opportunity

              </p>

              <p className="text-sm text-slate-500">

                +{mission.trustIncrease} Trust Score

              </p>

            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 p-5">

          <div className="flex items-center gap-3">

            <Clock3 className="h-5 w-5 text-blue-600" />

            <div>

              <p className="font-semibold text-slate-900">

                Estimated Time

              </p>

              <p className="text-sm text-slate-500">

                {mission.estimatedMinutes} minutes

              </p>

            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 p-5">

          <div className="flex items-center gap-3">

            <ShieldCheck className="h-5 w-5 text-indigo-600" />

            <div>

              <p className="font-semibold text-slate-900">

                Executive Progress

              </p>

              <p className="text-sm text-slate-500">

                {readiness}% Complete

              </p>

            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 p-5">

          <div className="flex items-center gap-3">

            <BriefcaseBusiness className="h-5 w-5 text-purple-600" />

            <div>

              <p className="font-semibold text-slate-900">

                Business Impact

              </p>

              <ul className="mt-2 space-y-1 text-sm text-slate-500">

                {mission.businessImpact.map((impact) => (

                  <li key={impact}>

                    • {impact}

                  </li>

                ))}

              </ul>

            </div>

          </div>

        </div>

      </div>

    </aside>

  );

}
