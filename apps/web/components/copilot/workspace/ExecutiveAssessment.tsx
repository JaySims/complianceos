type Props = {
  trust: number;
  risk: string;
  value: number;
  confidence: number;
};

export default function ExecutiveAssessment({
  trust,
  risk,
  value,
  confidence,
}: Props) {
  return (
    <section className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6">

      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
        Executive Assessment™
      </p>

      <div className="mt-6 grid grid-cols-2 gap-6">

        <Metric
          title="Digital Trust™"
          value={`${trust}%`}
        />

        <Metric
          title="Business Risk"
          value={risk}
        />

        <Metric
          title="Opportunity Value"
          value={`£${value.toLocaleString()}`}
        />

        <Metric
          title="AI Confidence"
          value={`${confidence}%`}
        />

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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
        {title}
      </p>

      <h2 className="mt-3 text-3xl font-black text-white">
        {value}
      </h2>

    </div>
  );
}
