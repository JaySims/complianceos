import React from "react";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-100">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-[#050816] text-white shadow-2xl">

        <div className="p-8">

          <h1 className="text-3xl font-bold">
            ComplianceOS
          </h1>

          <p className="text-blue-300 mt-2">
            AI Digital Trust Platform
          </p>

        </div>

        <nav className="mt-10 space-y-2 px-6">

          <a
            href="/dashboard"
            className="block rounded-xl px-4 py-3 hover:bg-slate-800 transition"
          >
            Dashboard
          </a>

          <a
            href="/register"
            className="block rounded-xl px-4 py-3 hover:bg-slate-800 transition"
          >
            Register Business
          </a>

          <a
            href="#"
            className="block rounded-xl px-4 py-3 hover:bg-slate-800 transition"
          >
            Compliance
          </a>

          <a
            href="#"
            className="block rounded-xl px-4 py-3 hover:bg-slate-800 transition"
          >
            AI Insights
          </a>

          <a
            href="#"
            className="block rounded-xl px-4 py-3 hover:bg-slate-800 transition"
          >
            Settings
          </a>

        </nav>

      </aside>

      {/* Main Content */}
      <section className="ml-72 p-10">

        {children}

      </section>

    </main>
  );
}
