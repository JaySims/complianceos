"use client";

import ExecutiveStat from "@/components/ui/ExecutiveStat";
import { useTrust } from "@/contexts/TrustContext";

export default function ExecutiveKPIRow() {

  const {
    score,
    grade,
    level,
    factors,
  } = useTrust();

  const complianceScore =
    Math.min(
      100,
      Math.round(score * 1.08)
    );

  const procurementScore =
    Math.min(
      100,
      Math.round(score * 0.82)
    );

  const fundingScore =
    Math.min(
      100,
      Math.round(score * 0.90)
    );

  return (

    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      <ExecutiveStat
        title="Digital Trust"
        value={`${score}%`}
        subtitle={`${grade} • ${level}`}
        trend="+ Live"
        trendDirection="up"
      />

      <ExecutiveStat
        title="Compliance"
        value={`${complianceScore}%`}
        subtitle="AI Compliance Index"
        trend="+ Live"
        trendDirection="up"
      />

      <ExecutiveStat
        title="Procurement"
        value={`${procurementScore}%`}
        subtitle="Supplier Readiness"
        trend="+ Live"
        trendDirection="up"
      />

      <ExecutiveStat
        title="Funding"
        value={`${fundingScore}%`}
        subtitle="Investment Readiness"
        trend="+ Live"
        trendDirection="up"
      />

    </section>

  );

}
