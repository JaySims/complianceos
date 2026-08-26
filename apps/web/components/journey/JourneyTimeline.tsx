"use client";

import Container from "../ui/Container";

export default function JourneyTimeline() {
  return (
    <Container>
      <section className="py-24">

        <h2 className="mb-16 text-center text-4xl font-bold text-white">
          Your Business Transformation Journey
        </h2>

        <div className="mx-auto max-w-5xl space-y-10">

          {[
            "Register Your Business",
            "AI Business Analysis",
            "Digital Trust Score™",
            "Continuous Compliance",
            "Funding & Procurement Matching",
            "Business Growth",
          ].map((step, index) => (

            <div
              key={index}
              className="rounded-3xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-xl"
            >
              <div className="mb-4 text-blue-400 font-bold">
                STEP {(index + 1).toString().padStart(2, "0")}
              </div>

              <h3 className="text-2xl font-bold text-white">
                {step}
              </h3>

              <p className="mt-3 text-slate-300">
                ComplianceOS intelligently guides your business through this
                stage automatically.
              </p>

            </div>

          ))}

        </div>

      </section>
    </Container>
  );
}