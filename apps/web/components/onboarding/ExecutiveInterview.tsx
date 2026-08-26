"use client";

import { useState } from "react";

import { interviewFlow } from "@/lib/intelligence/interview-flow";
import { organisationProfile } from "@/lib/profile/organisation-profile";
import { executiveMemory } from "@/lib/memory/executive-memory";
import { executiveAI } from "@/lib/intelligence/executive-orchestrator";

export default function ExecutiveInterview() {

  const [step, setStep] = useState(0);

  const [answer, setAnswer] = useState("");

  const [refresh, setRefresh] = useState(0);

  const question = interviewFlow.getQuestion(step);

  const total = interviewFlow.totalQuestions();

  const intelligence = executiveAI.analyseOrganisation();

  function continueInterview() {

    if (!answer.trim()) return;

    organisationProfile.updateField(

      question.field as any,

      answer

    );

    executiveMemory.addCompletedStep(question.title);

    executiveMemory.update({

      companyName:
        organisationProfile.getProfile().organisationName ||

        "Your Organisation",

      trustScore:
        intelligence.executiveTrust.percentage,

      currentMission:
        intelligence.recommendation.title,

    });

    if (step < total - 1) {

      setStep(step + 1);

      setAnswer("");

    }

    setRefresh(refresh + 1);

  }

  return (

    <section className="rounded-3xl border border-white/10 bg-[#101A2E] p-8">

      <div className="mb-8">

        <h2 className="text-3xl font-bold text-white">

          Executive Interview

        </h2>

        <p className="mt-2 text-slate-400">

          Executive AI is building your Digital Trust Profile.

        </p>

      </div>

      {/* Progress */}

      <div className="mb-8">

        <div className="flex justify-between text-sm text-slate-400">

          <span>

            Step {step + 1} of {total}

          </span>

          <span>

            {Math.round(((step + 1) / total) * 100)}%

          </span>

        </div>

        <div className="mt-3 h-2 rounded-full bg-[#0F172A]">

          <div

            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"

            style={{

              width: `${((step + 1) / total) * 100}%`

            }}

          />

        </div>

      </div>

      {/* Executive AI */}

      <div className="rounded-3xl border border-blue-500/20 bg-[#0B1220] p-6">

        <p className="text-sm uppercase tracking-wide text-cyan-400">

          Executive AI

        </p>

        <h3 className="mt-4 text-2xl font-bold text-white">

          {question.title}

        </h3>

        <p className="mt-4 leading-8 text-slate-300">

          {question.description}

        </p>

      </div>

      {/* Answer */}

      <input

        value={answer}

        onChange={(e)=>setAnswer(e.target.value)}

        placeholder={question.placeholder}

        className="mt-8 w-full rounded-2xl border border-white/10 bg-[#0F172A] px-6 py-5 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"

      />

      <button

        onClick={continueInterview}

        className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 font-semibold text-white"

      >

        Continue

      </button>

      {/* Live Executive Summary */}

      <div className="mt-10 rounded-2xl border border-white/10 bg-[#0F172A] p-6">

        <h4 className="text-lg font-semibold text-white">

          Live Executive Summary

        </h4>

        <div className="mt-5 space-y-3 text-slate-300">

          <p>

            Organisation:

            {" "}

            {organisationProfile.getProfile().organisationName || "—"}

          </p>

          <p>

            Completed Fields:

            {" "}

            {organisationProfile.getProfile().completedFields}

          </p>

          <p>

            Digital Trust:

            {" "}

            {intelligence.executiveTrust.percentage}%

          </p>

          <p>

            Current Mission:

            {" "}

            {intelligence.recommendation.title}

          </p>

        </div>

      </div>

    </section>

  );

}
