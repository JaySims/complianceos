"use client";

import { useExecutiveAI } from "@/hooks/useExecutiveAI";

export default function LiveTrustPanel() {

  const intelligence = useExecutiveAI();

  return (

    <section className="rounded-3xl border border-emerald-500/20 bg-[#101A2E] p-6">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-white">

            Live Trust Intelligence

          </h2>

          <p className="mt-2 text-slate-400">

            Executive Trust Monitor

          </p>

        </div>

        <div className="text-right">

          <p className="text-5xl font-bold text-emerald-400">

            {intelligence.executiveTrust.percentage}%

          </p>

          <p className="text-slate-400">

            Digital Trust

          </p>

        </div>

      </div>

      <div className="mt-8">

        <div className="h-4 rounded-full bg-[#0F172A]">

          <div

            className="h-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"

            style={{

              width: `${intelligence.executiveTrust.percentage}%`

            }}

          />

        </div>

      </div>

      <div className="mt-8 space-y-4">

        <TrustReason>

          Governance completion increases organisational credibility.

        </TrustReason>

        <TrustReason>

          Registration verification improves procurement readiness.

        </TrustReason>

        <TrustReason>

          Completing outstanding compliance tasks will unlock additional funding opportunities.

        </TrustReason>

      </div>

    </section>

  );

}

function TrustReason({

  children,

}:{

  children:React.ReactNode;

}){

  return(

    <div className="rounded-2xl bg-[#0F172A] p-4 text-slate-300">

      • {children}

    </div>

  );

}
