"use client";

import HeroHeader from "./HeroHeader";
import HeroTrustScore from "./HeroTrustScore";
import HeroMetrics from "./HeroMetrics";
import HeroAssistant from "./HeroAssistant";

export default function HeroDashboard() {
  return (
    <section className="rounded-[36px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_30px_120px_rgba(37,99,235,0.18)] backdrop-blur-2xl">

      {/* Dashboard Header */}

      <HeroHeader />

      {/* Trust Score */}

      <div className="mt-10">

        <HeroTrustScore />

      </div>

      {/* KPI Grid */}

      <div className="mt-8">

        <HeroMetrics />

      </div>

      {/* AI Assistant */}

      <div className="mt-8">

        <HeroAssistant />

      </div>

    </section>
  );
}