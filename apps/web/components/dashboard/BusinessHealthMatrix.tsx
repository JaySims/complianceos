"use client";

const checks = [
  {
    title: "CIPC Registration",
    status: "Verified",
    colour: "emerald",
  },
  {
    title: "SARS Tax Status",
    status: "Compliant",
    colour: "emerald",
  },
  {
    title: "VAT Registration",
    status: "Active",
    colour: "blue",
  },
  {
    title: "UIF",
    status: "Up To Date",
    colour: "emerald",
  },
  {
    title: "COIDA",
    status: "Verified",
    colour: "cyan",
  },
  {
    title: "B-BBEE",
    status: "Level 2",
    colour: "violet",
  },
];

export default function BusinessHealthMatrix() {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-[0.30em] text-blue-300">
            Business Health Matrix™
          </p>

          <h2 className="mt-3 text-3xl font-black text-white">
            Compliance Status
          </h2>

        </div>

        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2">

          <span className="font-semibold text-emerald-400">
            HEALTHY
          </span>

        </div>

      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">

        {checks.map((check) => (
          <HealthCard key={check.title} {...check} />
        ))}

      </div>

    </section>
  );
}

function HealthCard({
  title,
  status,
  colour,
}: {
  title: string;
  status: string;
  colour: string;
}) {

  const colours = {
    emerald: "bg-emerald-400",
    blue: "bg-blue-400",
    cyan: "bg-cyan-400",
    violet: "bg-violet-400",
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition duration-300 hover:border-blue-400/30">

      <div className="flex items-center gap-4">

        <div
          className={`h-4 w-4 rounded-full ${
            colours[colour as keyof typeof colours]
          }`}
        />

        <div>

          <p className="font-semibold text-white">
            {title}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            AI Verified
          </p>

        </div>

      </div>

      <span className="font-bold text-white">
        {status}
      </span>

    </div>
  );
}