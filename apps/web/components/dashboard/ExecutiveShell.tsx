"use client";

import ExecutiveHeader from "./ExecutiveHeader";
import ExecutiveHero from "./ExecutiveHero";
import ExecutiveIntelligence from "./ExecutiveIntelligence";
import ExecutiveOpportunityRadar from "./ExecutiveOpportunityRadar";
import BusinessHealthMatrix from "./BusinessHealthMatrix";
import ExecutiveAssistant from "./ExecutiveAssistant";
import ExecutiveCopilot from "../copilot/ExecutiveCopilot";
import ActivityFeed from "./ActivityFeed";

import ExecutiveWorkspace from "@/components/executive/ExecutiveWorkspace";

import type {
  ExecutiveIntelligenceData,
} from "@/types/executive";

import {
  useExecutiveState,
} from "@/contexts/ExecutiveStateContext";

export default function ExecutiveShell() {
  const { brain } =
    useExecutiveState();

  /*
   * Executive Health is the combined
   * readiness position of the organisation.
   *
   * We derive it from existing canonical
   * Executive Brain metrics rather than
   * introducing another state source.
   */

  const executiveHealth =
    Math.round(
      (
        brain.trustScore +
        brain.complianceReadiness +
        brain.fundingReadiness +
        brain.procurementReadiness
      ) / 4
    );

  /*
   * Adapt canonical Executive Brain state
   * into the dashboard intelligence
   * presentation contract.
   */

  const intelligence:
    ExecutiveIntelligenceData = {
      trustScore:
        brain.trustScore,

      complianceScore:
        brain.complianceReadiness,

      fundingScore:
        brain.fundingReadiness,

      procurementScore:
        brain.procurementReadiness,

      aiConfidence:
        brain.executiveConfidence,

      businessRisk:
        brain.businessRisk,

      executiveHealth,

      organisationStatus:
        brain.organisationStatus,

      recommendation:
        brain.activeMission,
    };

  return (
    <main className="min-h-screen bg-slate-50">

      <ExecutiveHeader />

      <div className="mx-auto max-w-[1700px] space-y-8 px-8 py-8">

        <ExecutiveHero
          mission={
            brain.mission
          }
        />

        <ExecutiveIntelligence
          data={
            intelligence
          }
        />

        <ExecutiveWorkspace />

        <section className="grid grid-cols-12 gap-8">

          <section className="col-span-12 space-y-8 xl:col-span-8">

            <ExecutiveOpportunityRadar
              opportunities={
                brain.opportunities
              }
            />

            <ExecutiveCopilot />

            <BusinessHealthMatrix />

            <ActivityFeed
              activities={[
                {
                  title:
                    "Organisation Identity completed successfully.",

                  time:
                    "2 minutes ago",
                },

                {
                  title:
                    "Digital Trust recalculated.",

                  time:
                    "Just now",
                },

                {
                  title:
                    `Executive AI prioritised ${brain.activeMission}.`,

                  time:
                    "Today",
                },

                {
                  title:
                    `${brain.insights.length} executive insights generated.`,

                  time:
                    "Today",
                },

                {
                  title:
                    `${brain.opportunityCount} strategic opportunities identified.`,

                  time:
                    "Today",
                },
              ]}
            />

          </section>

          <aside className="col-span-12 xl:col-span-4">

            <ExecutiveAssistant />

          </aside>

        </section>

      </div>

    </main>
  );
}
