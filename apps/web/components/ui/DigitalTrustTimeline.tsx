"use client";

import {
  CheckCircle2,
  Circle,
  TrendingUp,
} from "lucide-react";

const milestones = [
  {
    title: "Company Registered",
    score: "+4",
    completed: true,
  },
  {
    title: "Business Contacts",
    score: "+2",
    completed: true,
  },
  {
    title: "Governance Verified",
    score: "+9",
    completed: false,
  },
  {
    title: "Compliance Complete",
    score: "+11",
    completed: false,
  },
  {
    title: "Funding Ready",
    score: "+18",
    completed: false,
  },
  {
    title: "Digital Trust Certified",
    score: "+25",
    completed: false,
  },
];

export default function DigitalTrustTimeline() {

  return (

    <section className="executive-card p-8">

      <div className="flex items-center justify-between mb-8">

        <div>

          <p className="uppercase tracking-[0.35em] text-xs text-blue-400">

            Trust Journey

          </p>

          <h2 className="text-2xl font-bold text-white mt-2">

            Digital Trust Timeline

          </h2>

        </div>

        <TrendingUp className="h-8 w-8 text-emerald-400"/>

      </div>

      <div className="space-y-6">

        {milestones.map((item,index)=>(

          <div
            key={index}
            className="flex items-start gap-5"
          >

            <div>

              {item.completed ? (

                <CheckCircle2 className="h-7 w-7 text-emerald-400"/>

              ) : (

                <Circle className="h-7 w-7 text-slate-600"/>

              )}

            </div>

            <div className="flex-1">

              <div className="flex justify-between">

                <h3 className="text-white font-semibold">

                  {item.title}

                </h3>

                <span className="text-blue-400 font-bold">

                  {item.score}

                </span>

              </div>

              <div className="mt-4 h-px bg-white/10"/>

            </div>

          </div>

        ))}

      </div>

    </section>

  );

}
