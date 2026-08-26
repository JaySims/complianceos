"use client";

import {
  BrainCircuit,
  Sparkles,
} from "lucide-react";

import type {
  ConversationMessage,
} from "@/lib/copilot/executiveConversation";

type Props = {
  message: ConversationMessage;
};

export default function ExecutiveChatMessage({
  message,
}: Props) {
  const assistant =
    message.role === "assistant";

  const createdAt =
    message.createdAt instanceof Date
      ? message.createdAt
      : new Date(message.createdAt);

  const formattedTime =
    new Intl.DateTimeFormat("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Africa/Johannesburg",
    }).format(createdAt);

  return (
    <div
      className={`rounded-3xl border p-6 transition-all ${
        assistant
          ? "border-cyan-400/10 bg-white/[0.04]"
          : "border-white/5 bg-slate-900"
      }`}
    >
      <div className="mb-4 flex items-center gap-3">

        {assistant ? (
          <Sparkles className="h-5 w-5 text-cyan-300" />
        ) : (
          <BrainCircuit className="h-5 w-5 text-white" />
        )}

        <span className="font-bold text-white">
          {assistant
            ? "Executive AI"
            : "You"}
        </span>

        <span className="ml-auto text-xs text-slate-500">
          {formattedTime}
        </span>

      </div>

      <p className="whitespace-pre-line leading-8 text-slate-300">
        {message.message}
      </p>

    </div>
  );
}
