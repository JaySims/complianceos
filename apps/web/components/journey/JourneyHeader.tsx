"use client";

import Container from "../ui/Container";
import Section from "../ui/Section";

export default function JourneyHeader() {
  return (
    <Section>
      <Container>
        <div className="relative z-10 mx-auto max-w-6xl text-center">

          {/* Badge */}

          <div className="inline-flex items-center rounded-full border border-blue-400/20 bg-blue-500/10 px-6 py-2 backdrop-blur-xl">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
              Business Transformation Journey™
            </span>
          </div>

          {/* Heading */}

          <h2 className="mt-8 text-5xl font-black leading-tight tracking-tight text-white md:text-7xl">
            One Registration.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent">
              A Lifetime of Business Intelligence.
            </span>
          </h2>

          {/* Description */}

          <p className="mx-auto mt-8 max-w-4xl text-xl leading-9 text-slate-300">
            ComplianceOS becomes your AI Compliance Officer,
            continuously monitoring your business,
            strengthening your Digital Trust Score™
            and automatically unlocking funding,
            procurement and growth opportunities.
          </p>

          {/* Metrics */}

          <div className="mt-20 grid gap-8 md:grid-cols-3">

            <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl shadow-[0_20px_80px_rgba(37,99,235,0.15)] transition-all duration-500 hover:-translate-y-2 hover:border-blue-400/40">

              <div className="text-5xl font-black text-blue-400">
                24/7
              </div>

              <div className="mt-4 text-lg font-semibold text-white">
                AI Compliance Monitoring
              </div>

              <p className="mt-3 text-slate-400">
                Continuous monitoring keeps your business compliant every day.
              </p>

            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl shadow-[0_20px_80px_rgba(37,99,235,0.15)] transition-all duration-500 hover:-translate-y-2 hover:border-cyan-400/40">

              <div className="text-5xl font-black text-cyan-400">
                LIVE
              </div>

              <div className="mt-4 text-lg font-semibold text-white">
                Digital Trust Score™
              </div>

              <p className="mt-3 text-slate-400">
                Your credibility updates automatically as your business grows.
              </p>

            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl shadow-[0_20px_80px_rgba(37,99,235,0.15)] transition-all duration-500 hover:-translate-y-2 hover:border-emerald-400/40">

              <div className="text-5xl font-black text-emerald-400">
                DAILY
              </div>

              <div className="mt-4 text-lg font-semibold text-white">
                Opportunity Matching
              </div>

              <p className="mt-3 text-slate-400">
                AI continuously scans for funding, procurement and growth opportunities.
              </p>

            </div>

          </div>

        </div>
      </Container>
    </Section>
  );
}