"use client";

import Container from "./ui/Container";

export default function AIComplianceEngine() {
  const checks = [
    {
      title: "Tax Compliance",
      status: "Healthy",
      color: "text-emerald-400",
    },
    {
      title: "CIPC Status",
      status: "Verified",
      color: "text-blue-400",
    },
    {
      title: "B-BBEE",
      status: "Level Improving",
      color: "text-cyan-400",
    },
    {
      title: "POPIA",
      status: "Protected",
      color: "text-purple-400",
    },
  ];

  return (
    <section className="relative overflow-hidden py-36 bg-[#050816]">

      <Container>

        <div className="mx-auto max-w-7xl">

          <div className="text-center mb-20">

            <div className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-6 py-2">
              <span className="text-sm font-semibold tracking-[0.25em] uppercase text-cyan-300">
                AI Compliance Engine
              </span>
            </div>

            <h2 className="mt-8 text-5xl md:text-7xl font-black text-white">
              Your AI Never Sleeps.
            </h2>

            <p className="mx-auto mt-8 max-w-3xl text-xl text-slate-400 leading-9">
              ComplianceOS continuously monitors every aspect of your business,
              detects risks before they become problems, and uncovers new
              funding and procurement opportunities automatically.
            </p>

          </div>

          <div className="grid gap-10 lg:grid-cols-2">

            <div className="rounded-[36px] border border-white/10 bg-white/[0.04] p-10 backdrop-blur-xl">

              <div className="flex items-center justify-between">

                <h3 className="text-2xl font-bold text-white">
                  Live AI Monitoring
                </h3>

                <div className="flex items-center gap-2">

                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></div>

                  <span className="text-emerald-400 font-semibold">
                    ONLINE
                  </span>

                </div>

              </div>

              <div className="mt-10 space-y-6">

                {checks.map((item) => (

                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-2xl bg-slate-900/60 p-5"
                  >

                    <span className="text-slate-300">
                      {item.title}
                    </span>

                    <span className={`font-bold ${item.color}`}>
                      ✓ {item.status}
                    </span>

                  </div>

                ))}

              </div>

            </div>

            <div className="rounded-[36px] border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-cyan-500/10 p-10 backdrop-blur-xl">

              <div className="text-center">

                <div className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                  AI Recommendation
                </div>

                <h3 className="mt-6 text-4xl font-black text-white">
                  Funding Opportunity Found
                </h3>

                <div className="mt-10 rounded-3xl bg-slate-900/70 p-8">

                  <div className="text-6xl font-black text-emerald-400">
                    R1.8M
                  </div>

                  <div className="mt-4 text-xl font-semibold text-white">
                    SME Growth Fund
                  </div>

                  <p className="mt-6 text-slate-400">
                    Based on your Trust Score™ and compliance profile,
                    your business qualifies for this funding opportunity.
                  </p>

                </div>

                <button className="mt-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-10 py-4 font-bold text-white transition hover:scale-105">
                  Review Opportunity →
                </button>

              </div>

            </div>

          </div>

        </div>

      </Container>

    </section>
  );
}