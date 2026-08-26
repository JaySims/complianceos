"use client";

import Container from "./ui/Container";
import GradientHeading from "./ui/GradientHeading";
import PrimaryButton from "./ui/PrimaryButton";
import AIStatusIndicator from "./ui/AIStatusIndicator";
import HeroDashboard from "./hero/HeroDashboard";

export default function Hero() {
  return (
   <section className="relative overflow-hidden bg-[#050816] pt-28 pb-24">

      {/* Background Glow */}

      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[180px]" />

        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-[180px]" />

        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[180px]" />

      </div>

      <Container>

        <div className="relative z-10 grid gap-20 lg:grid-cols-[1fr_620px] lg:items-start">

          {/* LEFT SIDE */}

          <div>

            <GradientHeading
              badge="South Africa's AI Business Operating System™"
              title="Your AI Compliance Officer."
              highlight="Growing Your Business 24 Hours A Day."
              description="ComplianceOS continuously monitors compliance, calculates your Digital Trust Score™, discovers funding and procurement opportunities, predicts business risks and helps South African businesses grow intelligently."
              align="left"
            />

            <div className="mt-8">

              <AIStatusIndicator status="online" />

            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">

              <PrimaryButton>

                Register Business

              </PrimaryButton>

              <PrimaryButton className="bg-slate-800 from-slate-700 via-slate-700 to-slate-800">

                Watch Demo

              </PrimaryButton>

            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">

              <span>✓ AI Compliance</span>

              <span>✓ Digital Trust Score™</span>

              <span>✓ Funding Intelligence</span>

              <span>✓ Procurement Matching</span>

            </div>

          </div>

          {/* RIGHT SIDE */}

          <HeroDashboard />

        </div>

      </Container>

    </section>
  );
}