"use client";

import DigitalTrustCommandCard from "./DigitalTrustCommandCard";
import ExecutiveKPIStrip from "./ExecutiveKPIStrip";

type ExecutiveCommandCentreProps = {
  trustScore: number;
  executiveConfidence: number;
  businessRisk: "Low" | "Medium" | "High";
  organisationStatus: string;

  fundingReadiness: number;
  complianceReadiness: number;
  procurementReadiness: number;
  governanceMaturity: number;
};

export default function ExecutiveCommandCentre({

  trustScore,

  executiveConfidence,

  businessRisk,

  organisationStatus,

  fundingReadiness,

  complianceReadiness,

  procurementReadiness,

  governanceMaturity,

}: ExecutiveCommandCentreProps) {

  return (

    <section className="space-y-8">

      <DigitalTrustCommandCard

        trustScore={trustScore}

        executiveConfidence={executiveConfidence}

        businessRisk={businessRisk}

        organisationStatus={organisationStatus}

        trustChange={5}

        commentary="Executive AI has identified your organisation as strategically positioned for accelerated growth. Completing today's Executive Mission is expected to unlock enterprise procurement, investment readiness and stronger Digital Trust™."

      />

      <ExecutiveKPIStrip

        trustScore={trustScore}

        fundingReadiness={fundingReadiness}

        complianceReadiness={complianceReadiness}

        procurementReadiness={procurementReadiness}

        governanceMaturity={governanceMaturity}

        aiConfidence={executiveConfidence}

      />

    </section>

  );

}
