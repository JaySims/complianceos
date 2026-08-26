"use client";

import { BrainCircuit, Sparkles } from "lucide-react";

export default function ExecutiveAIDock() {
  return (
    <aside className="fixed bottom-8 right-8 z-50">

      <button className="
        executive-gradient
        rounded-full
        px-6
        py-4
        shadow-2xl
        flex
        items-center
        gap-3
        hover:scale-105
        transition
      ">

        <BrainCircuit className="h-6 w-6 text-white" />

        <div className="text-left">

          <p className="text-white font-semibold">
            Executive AI
          </p>

          <p className="text-blue-100 text-xs">
            Always Available
          </p>

        </div>

        <Sparkles className="text-white h-5 w-5" />

      </button>

    </aside>
  );
}
