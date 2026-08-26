"use client";

import React from "react";

import ExecutiveProgress from "@/components/ui/ExecutiveProgress";

type Props = {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  mission: string;
  impact: string;
  children: React.ReactNode;
};

export default function ExecutiveWorkspace({
  currentStep,
  totalSteps,
  title,
  subtitle,
  mission,
  impact,
  children,
}: Props) {

  return (

    <div className="space-y-8">

      {/* Progress */}

      <ExecutiveProgress
        current={currentStep}
        total={totalSteps}
        title={title}
      />

      {/* Workspace */}

      <section className="executive-card p-10">

        <div className="flex items-start justify-between">

          <div>

            <p className="uppercase tracking-[0.35em] text-xs text-blue-400">

              Executive Mission

            </p>

            <h2 className="mt-3 text-4xl font-black text-white">

              {title}

            </h2>

            <p className="mt-4 text-slate-300 max-w-2xl leading-8">

              {subtitle}

            </p>

          </div>

          <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 px-5 py-4">

            <p className="text-xs uppercase tracking-widest text-blue-300">

              AI Impact

            </p>

            <h3 className="mt-2 text-3xl font-black text-white">

              {impact}

            </h3>

          </div>

        </div>

        {/* AI Mission */}

        <div className="mt-10 rounded-3xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-6">

          <h3 className="text-white font-bold">

            AI Recommendation

          </h3>

          <p className="mt-3 text-slate-300 leading-8">

            {mission}

          </p>

        </div>

        {/* Form */}

        <div className="mt-10">

          {children}

        </div>

      </section>

    </div>

  );

}
