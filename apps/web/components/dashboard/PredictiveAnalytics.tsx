"use client";

const predictions = [
  {
    title: "Digital Trust Score™",
    current: "94%",
    predicted: "98%",
    confidence: "96%",
    colour: "blue",
  },
  {
    title: "Funding Readiness",
    current: "91%",
    predicted: "97%",
    confidence: "93%",
    colour: "emerald",
  },
  {
    title: "Compliance Health",
    current: "98%",
    predicted: "99%",
    confidence: "99%",
    colour: "cyan",
  },
];

export default function PredictiveAnalytics() {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-[0.30em] text-blue-300">
            Predictive Analytics™
          </p>

          <h2 className="mt-3 text-3xl font-black text-white">
            AI Future Forecast
          </h2>

        </div>

        <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-5 py-2">

          <span className="font-semibold text-violet-300">
            NEXT 30 DAYS
          </span>

        </div>

      </div>

      <div className="mt-10 space-y-6">

        {predictions.map((prediction) => (
          <PredictionCard
            key={prediction.title}
            {...prediction}
          />
        ))}

      </div>

    </section>
  );
}

function PredictionCard({
  title,
  current,
  predicted,
  confidence,
  colour,
}: {
  title: string;
  current: string;
  predicted: string;
  confidence: string;
  colour: string;
}) {

  const gradients = {
    blue: "from-blue-500 to-cyan-400",
    emerald: "from-emerald-500 to-green-400",
    cyan: "from-cyan-500 to-sky-400",
  };

  return (

    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">

      <div className="flex items-center justify-between">

        <h3 className="text-xl font-bold text-white">
          {title}
        </h3>

        <span className="text-sm font-semibold text-slate-400">
          Confidence {confidence}
        </span>

      </div>

      <div className="mt-6 flex items-center gap-6">

        <div>

          <p className="text-sm text-slate-500">
            Current
          </p>

          <h2 className="text-4xl font-black text-white">
            {current}
          </h2>

        </div>

        <div className="text-3xl text-slate-600">
          →
        </div>

        <div>

          <p className="text-sm text-slate-500">
            Predicted
          </p>

          <h2 className="text-4xl font-black text-emerald-400">
            {predicted}
          </h2>

        </div>

      </div>

      <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-800">

        <div
          className={`h-full rounded-full bg-gradient-to-r ${
            gradients[colour as keyof typeof gradients]
          }`}
          style={{
            width: predicted,
          }}
        />

      </div>

    </div>

  );
}