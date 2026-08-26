"use client";

import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  BriefcaseBusiness,
  Landmark,
  Target,
} from "lucide-react";

import ExecutiveButton from "@/components/ui/ExecutiveButton";

export default function ExecutiveHero() {
  return (
    <section className="relative overflow-hidden rounded-[30px] executive-card px-10 py-8">

      {/* Background Glow */}

      <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-blue-600/10 blur-[140px]" />
      <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative z-10 grid lg:grid-cols-[1.8fr_1fr] gap-8 items-start">

        {/* LEFT */}

        <div>

          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-2">

            <Sparkles className="h-4 w-4 text-blue-400" />

            <span className="text-sm font-medium text-blue-300">
              Executive Daily Briefing
            </span>

          </div>

          <h1 className="mt-5 text-6xl font-black leading-tight text-white">

            Good Morning,

            <br />

            Simphiwe.

          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">

            Register your legal organisation information to establish
            the foundation of your Digital Trust profile.

          </p>

          {/* Mission */}

          <div className="mt-8 rounded-3xl bg-white/5 border border-white/10 p-7">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs uppercase tracking-[0.25em] text-blue-300">

                  Today's Executive Mission

                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">

                  Organisation Identity

                </h2>

              </div>

              <Target className="h-10 w-10 text-blue-400" />

            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">

              <Metric
                title="Trust Increase"
                value="+8"
              />

              <Metric
                title="Estimated Time"
                value="5 min"
              />

              <Metric
                title="Priority"
                value="High"
              />

            </div>

            <div className="mt-7 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">

              <h4 className="text-sm font-semibold text-blue-300">

                Executive AI Recommendation

              </h4>

              <ul className="mt-4 space-y-2 text-sm text-slate-300">

                <li>• Creates verified business identity</li>
                <li>• Begins Digital Trust profile</li>
                <li>• Unlocks onboarding progression</li>

              </ul>

            </div>

            <div className="mt-7 flex flex-wrap gap-4">

              <ExecutiveButton>

                Continue Mission

                <ArrowRight className="ml-2 h-4 w-4" />

              </ExecutiveButton>

              <ExecutiveButton variant="secondary">

                Ask Executive AI

              </ExecutiveButton>

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="space-y-5">

          <CompactMetric
            icon={<ShieldCheck className="h-6 w-6" />}
            value="82%"
            label="Trust"
          />

          <CompactMetric
            icon={<BriefcaseBusiness className="h-6 w-6" />}
            value="68%"
            label="Procurement"
          />

          <CompactMetric
            icon={<Landmark className="h-6 w-6" />}
            value="74%"
            label="Funding"
          />

        </div>

      </div>

    </section>
  );
}

function Metric({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">

      <p className="text-sm text-slate-400">

        {title}

      </p>

      <h3 className="mt-2 text-3xl font-bold text-white">

        {value}

      </h3>

    </div>
  );
}

function CompactMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="executive-card p-7 text-center">

      <div className="flex justify-center text-blue-400">

        {icon}

      </div>

      <div className="mt-4 text-5xl font-black text-white">

        {value}

      </div>

      <div className="mt-2 text-slate-400">

        {label}

      </div>

    </div>
  );
}
