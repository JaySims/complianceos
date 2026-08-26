"use client";

const opportunities = [
  {
    title: "Funding Matches",
    value: "16",
    subtitle: "AI Qualified",
    colour: "blue",
  },
  {
    title: "Government Tenders",
    value: "8",
    subtitle: "Open",
    colour: "emerald",
  },
  {
    title: "Enterprise Suppliers",
    value: "27",
    subtitle: "Available",
    colour: "cyan",
  },
  {
    title: "Investor Matches",
    value: "5",
    subtitle: "Interested",
    colour: "violet",
  },
];

export default function OpportunityForecast() {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-[0.30em] text-blue-300">
            Opportunity Forecast™
          </p>

          <h2 className="mt-3 text-3xl font-black text-white">
            AI Growth Intelligence
          </h2>

        </div>

        <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2">

          <span className="font-semibold text-cyan-300">
            LIVE AI
          </span>

        </div>

      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">

        {opportunities.map((item) => (
          <OpportunityCard key={item.title} {...item} />
        ))}

      </div>

      <div className="mt-10 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-8">

        <p className="text-sm uppercase tracking-[0.30em] text-blue-300">
          Estimated Opportunity Value
        </p>

        <h2 className="mt-4 text-5xl font-black text-white">
          R24.8M
        </h2>

        <p className="mt-4 leading-7 text-slate-300">
          Based on your current Digital Trust Score™, compliance
          profile and AI opportunity matching engine.
        </p>

      </div>

    </section>
  );
}

function OpportunityCard({
  title,
  value,
  subtitle,
  colour,
}: {
  title: string;
  value: string;
  subtitle: string;
  colour: string;
}) {

  const colours = {
    blue: "bg-blue-400",
    emerald: "bg-emerald-400",
    cyan: "bg-cyan-400",
    violet: "bg-violet-400",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition hover:border-blue-400/30">

      <div className="flex items-center gap-3">

        <div
          className={`h-3 w-3 rounded-full ${
            colours[colour as keyof typeof colours]
          }`}
        />

        <p className="font-semibold text-white">
          {title}
        </p>

      </div>

      <h3 className="mt-5 text-5xl font-black text-white">
        {value}
      </h3>

      <p className="mt-2 text-slate-400">
        {subtitle}
      </p>

    </div>
  );
}