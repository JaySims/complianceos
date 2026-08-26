"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BrainCircuit,
  SendHorizonal,
} from "lucide-react";

import { useExecutiveState } from "@/contexts/ExecutiveStateContext";

import { askExecutive } from "@/lib/copilot/executiveCopilotEngine";

import {
  ConversationMessage,
  createMessage,
} from "@/lib/copilot/executiveConversation";

import { streamResponse } from "@/lib/ai/streamResponse";

import {
  buildExecutiveActions,
  type ExecutiveActionRecommendation,
} from "@/lib/actions/executiveActions";

import ExecutiveChatMessage from "./messages/ExecutiveChatMessage";
import ExecutiveActionCards from "./actions/ExecutiveActionCards";

export default function ExecutiveCopilot() {
  const { brain } = useExecutiveState();

  const initialized = useRef(false);

  const [question, setQuestion] =
    useState("");

  /*
   * IMPORTANT:
   *
   * Start with an empty conversation.
   *
   * We do NOT call createMessage()
   * during server rendering.
   */

  const [
    conversation,
    setConversation,
  ] = useState<
    ConversationMessage[]
  >([]);

  const [
    isThinking,
    setIsThinking,
  ] = useState(false);

  const [
    streamingResponse,
    setStreamingResponse,
  ] = useState("");

  const [
    actions,
    setActions,
  ] = useState<
    ExecutiveActionRecommendation[]
  >([]);

  /*
   * Initialise conversation
   * only after client hydration.
   */

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    setConversation([
      createMessage(
        "assistant",
        "Executive AI is ready. Ask me anything about your organisation."
      ),
    ]);
  }, []);

  /*
   * Process Executive Question
   */

  async function processQuestion(
    prompt: string
  ) {
    const cleanPrompt =
      prompt.trim();

    if (
      !cleanPrompt ||
      isThinking
    ) {
      return;
    }

    /*
     * Create user message first.
     */

    const userMessage =
      createMessage(
        "user",
        cleanPrompt
      );

    setConversation(
      (previous) => [
        ...previous,
        userMessage,
      ]
    );

    setQuestion("");

    /*
     * Start Executive AI analysis.
     */

    setIsThinking(true);

    setStreamingResponse("");

    /*
     * Generate live Executive Brain answer.
     */

    const answer =
      askExecutive(
        cleanPrompt,
        brain
      );

    /*
     * Build recommended actions.
     */

    const recommendedActions =
      buildExecutiveActions(
        cleanPrompt
      );

    setActions(
      recommendedActions
    );

    try {
      /*
       * Stream response.
       *
       * The function returns the
       * completed response when done.
       */

      const completedResponse =
        await streamResponse(
          answer,
          setStreamingResponse,
          14
        );

      /*
       * IMPORTANT:
       *
       * Persist the completed streamed
       * text into conversation BEFORE
       * removing streamingResponse.
       */

      const assistantMessage =
        createMessage(
          "assistant",
          completedResponse
        );

      setConversation(
        (previous) => [
          ...previous,
          assistantMessage,
        ]
      );
    } catch (error) {
      console.error(
        "Executive Copilot response failed:",
        error
      );

      setConversation(
        (previous) => [
          ...previous,
          createMessage(
            "assistant",
            "Executive AI encountered an error while analysing your organisation. Please try again."
          ),
        ]
      );
    } finally {
      /*
       * Clear temporary streaming UI
       * only after permanent message
       * has been stored.
       */

      setStreamingResponse("");

      setIsThinking(false);
    }
  }

  async function submitQuestion() {
    await processQuestion(
      question
    );
  }

  async function askSuggestion(
    text: string
  ) {
    await processQuestion(
      text
    );
  }

  const suggestions = [
    "What should I prioritise today?",
    "How do we improve Digital Trust™?",
    "Show my biggest opportunity.",
    "Show business risk.",
    "What is our mission progress?",
    "What is our funding readiness?",
  ];

  return (
    <section className="rounded-[36px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 shadow-[0_30px_120px_rgba(37,99,235,0.18)]">

      {/* Header */}

      <div className="flex items-center gap-4">

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600">

          <BrainCircuit className="h-7 w-7 text-white" />

        </div>

        <div>

          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Executive Copilot™
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Executive AI
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Live organisational intelligence powered by the Executive Brain™.
          </p>

        </div>

      </div>

      {/* Input */}

      <div className="mt-8 flex gap-4">

        <input
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value
            )
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();

              void submitQuestion();
            }
          }}
          disabled={isThinking}
          placeholder="Ask Executive AI anything..."
          className="flex-1 rounded-2xl border border-white/10 bg-slate-900/70 px-6 py-4 text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() =>
            void submitQuestion()
          }
          disabled={
            isThinking ||
            !question.trim()
          }
          aria-label="Send question"
          className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >

          <SendHorizonal className="h-6 w-6" />

        </button>

      </div>

      {/* Suggestions */}

      <div className="mt-8 flex flex-wrap gap-3">

        {suggestions.map(
          (item) => (

            <button
              key={item}
              type="button"
              onClick={() =>
                void askSuggestion(item)
              }
              disabled={isThinking}
              className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {item}

            </button>

          )
        )}

      </div>

      {/* Streaming Response */}

      {isThinking && (

        <div className="mt-10 rounded-3xl border border-cyan-400/10 bg-white/[0.04] p-6">

          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
            Executive AI is analysing...
          </p>

          <p className="whitespace-pre-line leading-8 text-slate-300">

            {streamingResponse}

            <span className="animate-pulse">
              ▌
            </span>

          </p>

        </div>

      )}

      {/* Conversation */}

      <div className="mt-10 space-y-6">

        {conversation.map(
          (message) => (

            <ExecutiveChatMessage
              key={message.id}
              message={message}
            />

          )
        )}

      </div>

      {/* Executive Actions */}

      <ExecutiveActionCards
        actions={actions}
      />

    </section>
  );
}
