"use client";

import ExecutiveCommandCentre from "@/components/executive/ExecutiveCommandCentre";

import {
  useExecutiveState,
} from "@/contexts/ExecutiveStateContext";

export default function ExecutivePage() {
  const { brain } =
    useExecutiveState();

  return (
    <main className="min-h-screen bg-[#08111F] p-8">
      <div className="mx-auto max-w-7xl">

        <ExecutiveCommandCentre
          trustScore={
            brain.trustScore
          }
          executiveConfidence={
            brain.executiveConfidence
          }
          businessRisk={
            brain.businessRisk
          }
          organisationStatus={
            brain.organisationStatus
          }
          fundingReadiness={
            brain.fundingReadiness
          }
          complianceReadiness={
            brain.complianceReadiness
          }
          procurementReadiness={
            brain.procurementReadiness
          }
          governanceMaturity={
            brain.governanceMaturity
          }
        />

      </div>
    </main>
  );
}

