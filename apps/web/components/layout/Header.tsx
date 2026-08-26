"use client";

export default function Header() {

  return (

    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10">

      <div>

        <h1 className="text-3xl font-bold text-slate-900">
          Executive Mission Control
        </h1>

        <p className="text-slate-500">
          Welcome back to ComplianceOS.
        </p>

      </div>

      <div className="flex items-center gap-6">

        <button className="rounded-xl bg-blue-600 hover:bg-blue-700 transition px-6 py-3 text-white font-semibold">

          + Register Business

        </button>

        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold">

          S

        </div>

      </div>

    </header>

  );

}