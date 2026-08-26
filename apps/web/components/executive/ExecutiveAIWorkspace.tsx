"use client";

import { BrainCircuit, Send } from "lucide-react";

import { useExecutiveAI } from "@/hooks/useExecutiveAI";
import { executiveConversation } from "@/lib/intelligence/conversation-engine";

const suggestions = [

  "Continue Executive Journey",

  "Why is my Trust Score?",

  "Show Funding Opportunities",

  "Show Business Risks",

];

export default function ExecutiveAIWorkspace() {

  const intelligence = useExecutiveAI();

  const conversation = executiveConversation.generate();

  return (

    <section className="executive-card rounded-3xl border border-white/10 bg-[#101A2E] p-8 shadow-xl">

      {/* Header */}

      <div className="mb-6 flex items-center gap-4">

        <div className="rounded-2xl bg-blue-500/20 p-3">

          <BrainCircuit className="h-6 w-6 text-blue-400" />

        </div>

        <div>

          <h2 className="text-2xl font-bold text-white">

            Executive AI

          </h2>

          <p className="text-slate-400">

            Your Executive Business Advisor

          </p>

        </div>

      </div>

      {/* Conversation */}

      <div className="rounded-3xl border border-blue-500/20 bg-[#0B1220] p-6">

        <p className="text-lg font-semibold text-white">

          {conversation.greeting}

        </p>

        <p className="mt-5 text-xl font-bold text-cyan-400">

          {conversation.mission}

        </p>

        <p className="mt-5 leading-8 text-slate-300">

          {conversation.explanation}

        </p>

        <div className="mt-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-5">

          <p className="text-white font-medium">

            {conversation.nextQuestion}

          </p>

        </div>

      </div>

      {/* Metrics */}

      <div className="mt-8 grid grid-cols-2 gap-4">

        <Metric

          label="Digital Trust"

          value={`${intelligence.executiveTrust.percentage}%`}

        />

        <Metric

          label="Business Risks"

          value={`${intelligence.risks.length}`}

        />

        <Metric

          label="Funding Opportunities"

          value={`${intelligence.opportunities.length}`}

        />

        <Metric

          label="Priority"

          value={intelligence.recommendation.priority}

        />

      </div>

      {/* Suggestions */}

      <div className="mt-8 flex flex-wrap gap-3">

        {suggestions.map((item) => (

          <button

            key={item}

            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300 transition hover:bg-blue-500/10 hover:text-white"

          >

            {item}

          </button>

        ))}

      </div>

      {/* Input */}

      <div className="mt-8 flex gap-4">

        <input

          type="text"

          placeholder="Reply to Executive AI..."

          className="flex-1 rounded-2xl border border-white/10 bg-[#0F172A] px-6 py-4 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"

        />

        <button

          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-white transition hover:opacity-90"

        >

          <Send className="h-5 w-5" />

          <span>Send</span>

        </button>

      </div>

    </section>

  );

}

function Metric({

  label,

  value,

}:{

  label:string;

  value:string;

}){

  return(

    <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-4">

      <p className="text-sm text-slate-400">

        {label}

      </p>

      <p className="mt-2 text-xl font-bold text-white">

        {value}

      </p>

    </div>

  );

}
