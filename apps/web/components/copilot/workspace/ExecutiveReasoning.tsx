import { ExecutiveReasoning as Reasoning } from "@/lib/reasoning/executiveReasoning";

type Props = {
  reasoning: Reasoning;
};

export default function ExecutiveReasoning({
  reasoning,
}: Props) {

  return (

    <section className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6">

      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
        Executive Reasoning™
      </p>

      <p className="mt-4 text-base leading-7 text-slate-200">
        {reasoning.summary}
      </p>

      <div className="mt-6">

        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Evidence
        </h3>

        <ul className="space-y-2">

          {reasoning.evidence.map((item, index) => (

            <li
              key={index}
              className="rounded-xl bg-white/[0.04] p-3 text-slate-300"
            >
              • {item}
            </li>

          ))}

        </ul>

      </div>

      <div className="mt-6">

        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Expected Impact
        </h3>

        <ul className="space-y-2">

          {reasoning.impact.map((item, index) => (

            <li
              key={index}
              className="rounded-xl bg-cyan-500/10 p-3 text-cyan-100"
            >
              ✓ {item}
            </li>

          ))}

        </ul>

      </div>

    </section>

  );
}
