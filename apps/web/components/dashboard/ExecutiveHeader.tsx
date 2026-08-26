"use client";

import {
  Bell,
  Search,
  ShieldCheck,
  BrainCircuit,
  ChevronDown,
} from "lucide-react";

export default function ExecutiveHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">

      <div className="mx-auto flex h-20 max-w-[1700px] items-center justify-between px-8">

        {/* Left */}

        <div className="flex items-center gap-8">

          <div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              ComplianceOS
            </h1>

            <p className="text-xs uppercase tracking-[0.25em] text-blue-600">
              Executive Operating System
            </p>

          </div>

          <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2">

            <BrainCircuit className="h-5 w-5 text-blue-600" />

            <div>

              <p className="text-xs uppercase tracking-wide text-slate-500">
                Executive AI
              </p>

              <p className="font-semibold text-slate-900">
                Online
              </p>

            </div>

          </div>

        </div>

        {/* Centre */}

        <div className="hidden xl:flex w-[420px]">

          <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3">

            <Search className="h-5 w-5 text-slate-400" />

            <input
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
              placeholder="Search organisations, documents, compliance..."
            />

          </div>

        </div>

        {/* Right */}

        <div className="flex items-center gap-4">

          <div className="hidden md:flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2">

            <ShieldCheck className="h-5 w-5 text-emerald-600" />

            <div>

              <p className="text-xs uppercase tracking-wide text-slate-500">
                Trust Score
              </p>

              <p className="font-bold text-slate-900">
                82%
              </p>

            </div>

          </div>

          <button className="relative rounded-2xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50">

            <Bell className="h-5 w-5 text-slate-700" />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>

          </button>

          <button className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 transition hover:bg-slate-50">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-sm font-bold text-white">
              SV
            </div>

            <div className="hidden lg:block text-left">

              <p className="font-semibold text-slate-900">
                Simphiwe
              </p>

              <p className="text-sm text-slate-500">
                Founder
              </p>

            </div>

            <ChevronDown className="h-4 w-4 text-slate-500" />

          </button>

        </div>

      </div>

    </header>
  );
}
