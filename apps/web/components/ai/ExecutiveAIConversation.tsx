"use client";

import {
  useState,
} from "react";

import {
  BrainCircuit,
  Send,
  Sparkles,
} from "lucide-react";

import {
  useExecutiveAI,
} from "@/hooks/useExecutiveAI";

export default function ExecutiveAIConversation() {
  const [question, setQuestion] =
    useState("");

  const [response, setResponse] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const intelligence =
    useExecutiveAI();

  async function ask(
    prompt: string
  ) {
    const cleanPrompt =
      prompt.trim();

    if (!cleanPrompt) {
      return;
    }

    setLoading(true);

    /*
     * The current Executive AI layer is
     * deterministic intelligence rather
     * than a production LLM endpoint.
     *
     * Conversation responses therefore
     * use the existing intelligence state
     * until the production AI service is
     * connected.
     */

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          350
        )
    );

    const normalizedPrompt =
      cleanPrompt.toLowerCase();

    let nextResponse:
      string;

    if (
      normalizedPrompt.includes(
        "trust"
      )
    ) {
      nextResponse =
        `Your current Digital Trust™ score is ${intelligence.executiveTrust.percentage}%. ` +
        `Your highest-priority recommendation is ${intelligence.recommendation.title}.`;
    } else if (
      normalizedPrompt.includes(
        "fund"
      ) ||
      normalizedPrompt.includes(
        "opportun"
      )
    ) {
      nextResponse =
        `Executive AI has identified ${intelligence.opportunities.length} current business opportunities. ` +
        `Your recommended priority is ${intelligence.recommendation.title}.`;
    } else if (
      normalizedPrompt.includes(
        "risk"
      )
    ) {
      nextResponse =
        `Executive AI is currently tracking ${intelligence.risks.length} business risks. ` +
        `The recommended next action is ${intelligence.recommendation.title}.`;
    } else if (
      normalizedPrompt.includes(
        "compliance"
      )
    ) {
      nextResponse =
        `Your organisation's current executive priority is ${intelligence.recommendation.title}. ` +
        `Completing the recommended work is expected to improve organisational readiness and Digital Trust™.`;
    } else {
      nextResponse =
        `Based on the current organisational analysis, your Digital Trust™ score is ${intelligence.executiveTrust.percentage}% and your highest-priority action is ${intelligence.recommendation.title}.`;
    }

    setResponse(
      nextResponse
    );

    setLoading(false);

    setQuestion("");
  }

  return (
    <section className="executive-card p-8">

      {/* Header */}

      <div className="mb-6 flex items-center gap-3">

        <BrainCircuit className="h-7 w-7 text-blue-400" />

        <div>

          <h2 className="text-2xl font-bold text-white">
            Executive AI
          </h2>

          <p className="text-slate-400">
            Your AI Business Advisor
          </p>

        </div>

      </div>

      {/* Welcome Card */}

      <div className="space-y-5 rounded-3xl border border-white/10 bg-[#0B1220] p-6">

        <div className="flex gap-3">

          <Sparkles className="mt-1 h-5 w-5 text-blue-400" />

          <div>

            <p className="text-white">
              Executive intelligence is ready.
            </p>

            <p className="mt-3 leading-8 text-slate-300">
              Your current Digital Trust™ score is{" "}
              {intelligence.executiveTrust.percentage}%.
              Executive AI recommends prioritising{" "}
              {intelligence.recommendation.title}.
            </p>

          </div>

        </div>

      </div>

      {/* AI Input */}

      <div className="mt-6 flex gap-3">

        <input
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value
            )
          }
          onKeyDown={(event) => {
            if (
              event.key ===
                "Enter" &&
              question.trim() &&
              !loading
            ) {
              void ask(
                question
              );
            }
          }}
          placeholder="Ask ComplianceOS anything..."
          className="flex-1 rounded-2xl border border-white/10 bg-[#0F172A] px-6 py-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />

        <button
          type="button"
          disabled={
            loading ||
            !question.trim()
          }
          onClick={() => {
            void ask(
              question
            );
          }}
          className="executive-gradient flex items-center justify-center rounded-2xl px-6 disabled:cursor-not-allowed disabled:opacity-50"
        >

          <Send className="h-5 w-5 text-white" />

        </button>

      </div>

      {/* Suggested Questions */}

      <div className="mt-6 flex flex-wrap gap-3">

        <Suggestion
          onClick={() =>
            void ask(
              "Why is my Trust Score?"
            )
          }
        >
          Why is my Trust Score?
        </Suggestion>

        <Suggestion
          onClick={() =>
            void ask(
              "Find funding opportunities"
            )
          }
        >
          Find funding opportunities
        </Suggestion>

        <Suggestion
          onClick={() =>
            void ask(
              "What compliance tasks remain?"
            )
          }
        >
          What compliance tasks remain?
        </Suggestion>

        <Suggestion
          onClick={() =>
            void ask(
              "Show business risks"
            )
          }
        >
          Show business risks
        </Suggestion>

      </div>

      {/* AI Thinking */}

      {loading && (

        <div className="executive-card mt-8 p-6">

          <p className="text-blue-300">
            ComplianceOS is analysing your request...
          </p>

        </div>

      )}

      {/* AI Response */}

      {!!response &&
        !loading && (

          <div className="executive-card mt-8 p-6">

            <h3 className="mb-4 text-xl font-semibold text-white">
              Executive Response
            </h3>

            <p className="leading-8 text-slate-300">
              {response}
            </p>

          </div>

        )}

    </section>
  );
}

function Suggestion({
  children,
  onClick,
}: {
  children:
    React.ReactNode;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
    >
      {children}
    </button>
  );
}

