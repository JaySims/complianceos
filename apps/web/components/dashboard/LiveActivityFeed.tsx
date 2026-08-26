"use client";

const activities = [
  {
    time: "09:42",
    title: "SARS Tax Status Verified",
    description: "Business tax compliance successfully confirmed.",
    status: "success",
  },
  {
    time: "09:45",
    title: "Digital Trust Score Updated",
    description: "Trust Score increased from 92% to 94%.",
    status: "info",
  },
  {
    time: "09:47",
    title: "New Funding Opportunity",
    description: "IDC SME Growth Fund matched to your profile.",
    status: "funding",
  },
  {
    time: "09:49",
    title: "Supplier Opportunity Found",
    description: "Corporate procurement opportunity detected.",
    status: "business",
  },
  {
    time: "09:51",
    title: "AI Risk Analysis Complete",
    description: "No critical compliance risks detected.",
    status: "ai",
  },
];

export default function LiveActivityFeed() {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-[0.30em] text-blue-300">
            Live AI Activity
          </p>

          <h2 className="mt-3 text-3xl font-black text-white">
            Executive Intelligence Feed
          </h2>

        </div>

        <div className="flex items-center gap-3">

          <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400"></span>

          <span className="font-semibold text-emerald-400">
            LIVE
          </span>

        </div>

      </div>

      <div className="mt-10 space-y-6">

        {activities.map((activity) => (
          <ActivityRow key={activity.time} {...activity} />
        ))}

      </div>

    </div>
  );
}

function ActivityRow({
  time,
  title,
  description,
  status,
}: {
  time: string;
  title: string;
  description: string;
  status: string;
}) {

  const colours = {
    success: "bg-emerald-400",
    info: "bg-blue-400",
    funding: "bg-cyan-400",
    business: "bg-violet-400",
    ai: "bg-amber-400",
  };

  return (
    <div className="group flex items-start gap-5 rounded-2xl border border-white/5 bg-slate-900/50 p-5 transition-all duration-300 hover:border-blue-400/30 hover:bg-slate-900">

      <div className="flex flex-col items-center">

        <div
          className={`h-4 w-4 rounded-full ${
            colours[status as keyof typeof colours]
          }`}
        />

        <div className="mt-2 h-full w-px bg-slate-700"></div>

      </div>

      <div className="flex-1">

        <div className="flex items-center justify-between">

          <h3 className="text-lg font-bold text-white">
            {title}
          </h3>

          <span className="text-sm text-slate-500">
            {time}
          </span>

        </div>

        <p className="mt-2 leading-7 text-slate-400">
          {description}
        </p>

      </div>

    </div>
  );
}