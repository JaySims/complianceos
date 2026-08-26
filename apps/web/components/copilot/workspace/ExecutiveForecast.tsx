import { TrendingUp } from "lucide-react";

import { ExecutiveForecast as Forecast } from "@/lib/forecast/executiveForecastEngine";

type Props = {
  forecast: Forecast;
};

export default function ExecutiveForecast({
  forecast,
}: Props) {

  return (

    <section className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6">

      <div className="flex items-center gap-3">

        <TrendingUp className="h-6 w-6 text-cyan-300" />

        <h2 className="text-xl font-bold text-white">
          Executive Forecast™
        </h2>

      </div>

      <div className="mt-8 space-y-6">

        <ForecastRow
          label="Digital Trust™"
          current={`${forecast.currentTrust}%`}
          projected={`${forecast.projectedTrust}%`}
        />

        <ForecastRow
          label="Business Risk"
          current={forecast.currentRisk}
          projected={forecast.projectedRisk}
        />

        <ForecastRow
          label="Opportunity Value"
          current={`R${forecast.currentValue.toLocaleString()}`}
          projected={`R${forecast.projectedValue.toLocaleString()}`}
        />

      </div>

    </section>

  );
}

function ForecastRow({
  label,
  current,
  projected,
}: {
  label: string;
  current: string;
  projected: string;
}) {

  return (

    <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] p-4">

      <div>

        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
          {label}
        </p>

      </div>

      <div className="flex items-center gap-5">

        <span className="text-slate-300">
          {current}
        </span>

        <span className="text-cyan-300">
          →
        </span>

        <span className="font-bold text-emerald-400">
          {projected}
        </span>

      </div>

    </div>

  );

}
