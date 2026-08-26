"use client";

import Container from "../ui/Container";

export default function TrustScoreShowcase() {
  return (
    <Container>

      <section className="py-24">

        <div className="rounded-[40px] border border-white/10 bg-slate-900/60 p-12 backdrop-blur-xl">

          <h2 className="text-4xl font-bold text-white">
            Digital Trust Score™
          </h2>

          <p className="mt-6 text-slate-300">
            Your Digital Trust Score updates automatically as ComplianceOS
            monitors your business.
          </p>

          <div className="mt-10 flex items-center gap-10">

            <div className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-blue-500 text-5xl font-black text-blue-400">
              94
            </div>

            <div>

              <p className="text-emerald-400 font-semibold">
                Excellent Business Health
              </p>

              <ul className="mt-6 space-y-3 text-slate-300">

                <li>✓ Tax Compliant</li>

                <li>✓ CIPC Active</li>

                <li>✓ B-BBEE Ready</li>

                <li>✓ Funding Eligible</li>

              </ul>

            </div>

          </div>

        </div>

      </section>

    </Container>
  );
}