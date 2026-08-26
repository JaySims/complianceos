"use client";

import Container from "@/components/ui/Container";

const opportunities = [
  {
    title: "SEFA Growth Funding",
    value: "R2.5M",
    confidence: "98%",
    colour: "emerald",
  },
  {
    title: "DTIC Export Grant",
    value: "R1.8M",
    confidence: "95%",
    colour: "blue",
  },
  {
    title: "Government Tender",
    value: "R4.2M",
    confidence: "91%",
    colour: "cyan",
  },
];

export default function OpportunityEngine() {
  return (
    <section className="relative overflow-hidden bg-[#040816] py-32">

      {/* Background Glow */}

      <div className="absolute inset-0">

        <div className="absolute left-1/2 top-0 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[220px]" />

        <div className="absolute right-0 top-32 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[180px]" />

      </div>

      <Container>

        <div className="relative z-10">

          {/* Header */}

          <div className="text-center">

            <div className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-6 py-2">

              <span className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-300">
                AI Opportunity Engine™
              </span>

            </div>

            <h2 className="mt-8 text-5xl font-black text-white md:text-7xl">
              AI Never Stops
              <br />
              Finding Growth.
            </h2>

            <p className="mx-auto mt-8 max-w-4xl text-xl leading-9 text-slate-400">
              Every day ComplianceOS scans thousands of funding,
              procurement, supplier development and enterprise
              opportunities that match your business profile.
            </p>

          </div>

          {/* Opportunities */}

          <div className="mt-24 grid gap-8 lg:grid-cols-3">

            {opportunities.map((item) => (

              <div
                key={item.title}
                className="group rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-3 hover:border-cyan-400/40 hover:shadow-[0_25px_100px_rgba(6,182,212,0.25)]"
              >

                {/* Status */}

                <div className="flex items-center justify-between">

                  <span className="rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-300">
                    LIVE
                  </span>

                  <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />

                </div>

                {/* Opportunity */}

                <h3 className="mt-8 text-3xl font-bold text-white">
                  {item.title}
                </h3>

                <div className="mt-10 text-5xl font-black text-cyan-400">
                  {item.value}
                </div>

                {/* Confidence */}

                <div className="mt-6 flex items-center justify-between">

                  <span className="text-slate-400">
                    AI Match Confidence
                  </span>

                  <span className="font-bold text-emerald-400">
                    {item.confidence}
                  </span>

                </div>

                {/* Action */}

                <button
                  type="button"
                  className="mt-10 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 font-bold text-white transition hover:scale-[1.02]"
                >
                  Review Opportunity →
                </button>

              </div>

            ))}

          </div>

        </div>

      </Container>

    </section>
  );
}
