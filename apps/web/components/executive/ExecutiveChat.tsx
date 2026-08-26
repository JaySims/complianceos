"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface Message {

  id: number;

  role: "ai" | "user";

  content: string;

}

export default function ExecutiveChat() {

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "ai",
      content:
        "Welcome back. I'm your Executive AI Advisor. Let's continue building your Digital Trust Profile.",
    },
  ]);

  const [input, setInput] = useState("");

  function sendMessage() {

    if (!input.trim()) return;

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: "user",
        content: input,
      },
      {
        id: Date.now() + 1,
        role: "ai",
        content:
          "Thank you. I've analysed your response and updated your Executive Profile.",
      },
    ]);

    setInput("");
  }

  return (

    <section className="rounded-3xl border border-white/10 bg-[#101A2E] p-6">

      <h2 className="text-2xl font-bold text-white">

        Executive Conversation

      </h2>

      <div className="mt-6 h-[500px] overflow-y-auto space-y-4 rounded-2xl bg-[#0B1220] p-5">

        {messages.map((message) => (

          <div

            key={message.id}

            className={`flex ${
              message.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}

          >

            <div

              className={`max-w-[75%] rounded-2xl px-5 py-4 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-slate-200"
              }`}

            >

              {message.content}

            </div>

          </div>

        ))}

      </div>

      <div className="mt-6 flex gap-3">

        <input

          value={input}

          onChange={(e) => setInput(e.target.value)}

          placeholder="Reply to Executive AI..."

          className="flex-1 rounded-2xl border border-white/10 bg-[#0F172A] px-6 py-4 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"

        />

        <button

          onClick={sendMessage}

          className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6"

        >

          <Send className="h-5 w-5 text-white" />

        </button>

      </div>

    </section>

  );

}
