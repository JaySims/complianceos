"use client";

import {
  Bell,
  Search,
  Sparkles,
  Settings,
  UserCircle2,
} from "lucide-react";

export default function ExecutiveTopBar() {
  return (
    <header className="sticky top-0 z-50">

      <div className="executive-card rounded-none border-x-0 border-t-0 backdrop-blur-2xl">

        <div className="max-w-[1800px] mx-auto h-20 px-8 flex items-center justify-between">

          {/* Left */}

          <div className="flex items-center gap-5">

            <div className="h-12 w-12 rounded-2xl executive-gradient flex items-center justify-center shadow-xl">

              <Sparkles className="h-6 w-6 text-white" />

            </div>

            <div>

              <h1 className="text-white text-xl font-bold tracking-tight">
                ComplianceOS
              </h1>

              <p className="text-slate-400 text-sm">
                Executive Operating System
              </p>

            </div>

          </div>

          {/* Search */}

          <div className="hidden xl:flex flex-1 justify-center">

            <div className="relative w-[520px]">

              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2
                h-5 w-5 text-slate-500"
              />

              <input
                placeholder="Ask ComplianceOS anything..."
                className="
                  w-full
                  rounded-2xl
                  bg-[#111827]
                  border border-white/10
                  pl-14
                  pr-5
                  py-3
                  text-white
                  placeholder:text-slate-500
                  focus:outline-none
                  focus:border-blue-500
                "
              />

            </div>

          </div>

          {/* Right */}

          <div className="flex items-center gap-3">

            <button className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition">

              <Bell className="h-5 w-5 text-slate-300"/>

            </button>

            <button className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition">

              <Settings className="h-5 w-5 text-slate-300"/>

            </button>

            <button className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">

              <UserCircle2 className="h-10 w-10 text-blue-400"/>

              <div className="text-left">

                <p className="text-white font-semibold text-sm">
                  Simphiwe
                </p>

                <p className="text-slate-400 text-xs">
                  Executive
                </p>

              </div>

            </button>

          </div>

        </div>

      </div>

    </header>
  );
}
