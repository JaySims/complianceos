"use client";

import ExecutiveTrustRing from "@/components/ui/ExecutiveTrustRing";

import {
  BrainCircuit,
  Landmark,
  BriefcaseBusiness,
} from "lucide-react";

function IntelligenceCard({
  title,
  value,
  subtitle,
  icon,
}:{
  title:string;
  value:string;
  subtitle:string;
  icon:React.ReactNode;
}){

  return(

    <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm p-8">

      <div className="flex justify-between items-center">

        <div>

          <p className="text-sm uppercase tracking-wide text-slate-500">

            {title}

          </p>

          <h2 className="mt-4 text-4xl font-black text-slate-900">

            {value}

          </h2>

          <p className="mt-2 text-slate-500">

            {subtitle}

          </p>

        </div>

        <div className="rounded-2xl bg-blue-600 p-3 text-white">

          {icon}

        </div>

      </div>

    </div>

  );

}

export default function ExecutiveIntelligenceRow(){

  return(

    <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">

      <ExecutiveTrustRing />

      <IntelligenceCard
        title="AI Readiness"
        value="86%"
        subtitle="Executive AI Confidence"
        icon={<BrainCircuit className="h-6 w-6"/>}
      />

      <IntelligenceCard
        title="Funding"
        value="R2.8M"
        subtitle="Estimated Opportunity"
        icon={<Landmark className="h-6 w-6"/>}
      />

      <IntelligenceCard
        title="Procurement"
        value="Level 3"
        subtitle="Supplier Readiness"
        icon={<BriefcaseBusiness className="h-6 w-6"/>}
      />

    </section>

  );

}
