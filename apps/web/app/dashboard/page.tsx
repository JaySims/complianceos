"use client";

import ExecutiveMorningBriefing from "@/components/morning/AIMorningBriefing";
import ExecutiveCopilot from "@/components/copilot/ExecutiveCopilot";

import ExecutiveOpportunityRadar from "@/components/dashboard/ExecutiveOpportunityRadar";
import BusinessHealthMatrix from "@/components/dashboard/BusinessHealthMatrix";

import { useExecutiveState } from "@/contexts/ExecutiveStateContext";

export default function DashboardPage() {
  const { brain } =
    useExecutiveState();

  return (
    <main className="min-h-screen space-y-8 bg-slate-50 px-8 py-8">

      {/* Executive AI */}

      <ExecutiveMorningBriefing />

      {/* Executive Copilot */}

      <ExecutiveCopilot />

      {/* Opportunity Radar */}

      <ExecutiveOpportunityRadar
        opportunities={
          brain.opportunities
        }
      />

      {/* Business Health */}

      <BusinessHealthMatrix />

    </main>
  );
}
