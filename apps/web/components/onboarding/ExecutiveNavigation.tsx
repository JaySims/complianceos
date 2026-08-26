"use client";

import {
  CheckCircle2,
  Circle,
  ArrowRightCircle,
  Sparkles,
} from "lucide-react";

type Props = {
  currentStep: number;
};

const steps = [
  "Organisation",
  "Business Contacts",
  "Governance",
  "Compliance",
  "Documents",
  "AI Review",
  "Launch",
];

export default function ExecutiveNavigation({
  currentStep,
}: Props) {

  const progress = Math.round(
    (currentStep / steps.length) * 100
  );

  return (

    <aside className="executive-card p-6 space-y-8">

      <div>

        <p className="uppercase tracking-[0.35em] text-xs text-blue-400">

          Executive Journey

        </p>

        <h2 className="text-white text-xl font-bold mt-3">

          Registration

        </h2>

      </div>

      <div className="space-y-4">

        {steps.map((step, index) => {

          const stepNumber = index + 1;

          const completed = stepNumber < currentStep;

          const active = stepNumber === currentStep;

          return (

            <div
              key={step}
              className="flex items-center gap-3"
            >

              {completed ? (

                <CheckCircle2 className="h-5 w-5 text-emerald-400"/>

              ) : active ? (

                <ArrowRightCircle className="h-5 w-5 text-blue-400"/>

              ) : (

                <Circle className="h-5 w-5 text-slate-600"/>

              )}

              <span
                className={
                  completed
                    ? "text-white"
                    : active
                    ? "text-blue-300 font-semibold"
                    : "text-slate-500"
                }
              >
                {step}
              </span>

            </div>

          );

        })}

      </div>

      <div>

        <div className="flex justify-between mb-2">

          <span className="text-slate-400 text-sm">

            Progress

          </span>

          <span className="text-white">

            {progress}%

          </span>

        </div>

        <div className="h-3 rounded-full bg-slate-800 overflow-hidden">

          <div
            className="h-full executive-gradient transition-all duration-700"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">

        <div className="flex items-center gap-2 mb-3">

          <Sparkles className="h-5 w-5 text-blue-400"/>

          <span className="text-blue-300 font-semibold">

            AI Recommendation

          </span>

        </div>

        <p className="text-white">

          Complete the current step to maximise your
          Digital Trust Score.

        </p>

      </div>

    </aside>

  );

}
