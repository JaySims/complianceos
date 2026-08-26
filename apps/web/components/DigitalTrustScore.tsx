import Card from "./ui/Card";

const metrics = [
  {
    title: "Compliance Health",
    score: "98%",
    description: "Regulatory requirements satisfied.",
  },
  {
    title: "Funding Readiness",
    score: "91%",
    description: "Prepared for funding applications.",
  },
  {
    title: "Supplier Readiness",
    score: "95%",
    description: "Ready for procurement opportunities.",
  },
  {
    title: "Risk Level",
    score: "LOW",
    description: "Minimal compliance risk detected.",
  },
];

export default function DigitalTrustScore() {
  return (
    <section className="relative overflow-hidden bg-slate-900 py-32">

      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.18),transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-6">

        <div className="grid items-center gap-16 lg:grid-cols-2">

          {/* Left Side */}

          <div>

            <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-5 py-2 text-sm font-semibold uppercase tracking-widest text-blue-400">
              Digital Trust Score™
            </span>

            <h2 className="mt-8 text-5xl font-extrabold leading-tight text-white">
              Trust Is Your
              <br />
              Greatest Business Asset.
            </h2>

            <p className="mt-8 text-xl leading-8 text-slate-300">
              ComplianceOS continuously analyses your business and generates a
              Digital Trust Score™ that demonstrates compliance, investment
              readiness and procurement credibility.
            </p>

            <div className="mt-10 rounded-3xl border border-blue-500/20 bg-slate-800/70 p-6">
              <h3 className="text-xl font-bold text-white">
                Why It Matters
              </h3>

              <p className="mt-4 leading-7 text-slate-300">
                A higher Digital Trust Score™ increases confidence with
                investors, procurement teams, suppliers and funding
                institutions—helping your business unlock more opportunities.
              </p>
            </div>

          </div>

          {/* Right Side */}

          <div className="space-y-8">

            <Card className="text-center">

              <p className="text-lg text-slate-400">
                Overall Digital Trust Score™
              </p>

              <h3 className="mt-6 text-8xl font-black text-blue-400">
                94%
              </h3>

              <div className="mx-auto mt-8 h-4 w-full max-w-md overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[94%] rounded-full bg-linear-to-r from-blue-500 to-cyan-400" />
              </div>

              <p className="mt-5 text-lg font-semibold text-emerald-400">
                Excellent Business Standing
              </p>

            </Card>

            <div className="grid gap-6 sm:grid-cols-2">

              {metrics.map((metric) => (

                <Card key={metric.title}>

                  <h4 className="text-lg font-bold text-white">
                    {metric.title}
                  </h4>

                  <p className="mt-4 text-4xl font-extrabold text-blue-400">
                    {metric.score}
                  </p>

                  <p className="mt-3 text-slate-300">
                    {metric.description}
                  </p>

                </Card>

              ))}

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}