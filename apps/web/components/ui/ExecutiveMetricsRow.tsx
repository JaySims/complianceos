"use client";

import {
    ShieldCheck,
    Wallet,
    Briefcase,
    BarChart3,
} from "lucide-react";

import ExecutiveMetric from "./ExecutiveMetric";

type Props = {
    trustScore: number;
    complianceScore: number;
    procurementScore: number;
    fundingScore: number;
};

export default function ExecutiveMetricsRow({
    trustScore,
    complianceScore,
    procurementScore,
    fundingScore,
}: Props) {
    return (

        <section className="grid gap-6 lg:grid-cols-4">

            <ExecutiveMetric
                title="Digital Trust"
                value={`${trustScore}%`}
                subtitle="Enterprise Trust Index"
                icon={ShieldCheck}
                color="blue"
                trend={12}
            />

            <ExecutiveMetric
                title="Compliance"
                value={`${complianceScore}%`}
                subtitle="Regulatory Readiness"
                icon={BarChart3}
                color="green"
                trend={8}
            />

            <ExecutiveMetric
                title="Procurement"
                value={`${procurementScore}%`}
                subtitle="Government Readiness"
                icon={Briefcase}
                color="violet"
                trend={16}
            />

            <ExecutiveMetric
                title="Funding"
                value={`${fundingScore}%`}
                subtitle="Investment Readiness"
                icon={Wallet}
                color="orange"
                trend={21}
            />

        </section>

    );
}
