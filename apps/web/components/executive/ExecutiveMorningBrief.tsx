"use client";

import {
  Sunrise,
  Shield,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export default function ExecutiveMorningBrief() {
  return (
    <section className="executive-card p-8">

      <div className="flex items-center gap-3 mb-8">

        <Sunrise className="h-8 w-8 text-amber-400" />

        <div>

          <h2 className="text-2xl font-bold executive-title">
            Executive Morning Brief
          </h2>

          <p className="executive-subtitle">
            Your organisation in under 30 seconds.
          </p>

        </div>

      </div>

      <div className="space-y-5">

        <BriefItem
          icon={<Shield className="h-5 w-5 text-emerald-400" />}
          title="Compliance"
          message="Governance verification remains your highest priority."
        />

        <BriefItem
          icon={<TrendingUp className="h-5 w-5 text-blue-400" />}
          title="Growth"
          message="Three procurement opportunities match your business profile."
        />

        <BriefItem
          icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
          title="Risk"
          message="Two compliance documents will expire within the next 30 days."
        />

        <BriefItem
          icon={<Sparkles className="h-5 w-5 text-violet-400" />}
          title="AI Recommendation"
          message="Complete Director Verification today to unlock the largest Trust Score increase."
        />

      </div>

    </section>
  );
}

function BriefItem({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-2xl bg-[#0B1220] border border-white/10 p-5 flex gap-4">

      <div>{icon}</div>

      <div>

        <h3 className="text-white font-semibold">
          {title}
        </h3>

        <p className="text-slate-300 mt-2 leading-7">
          {message}
        </p>

      </div>

    </div>
  );
}
