import Card from "./ui/Card";

const modules = [
  {
    title: "Compliance Centre",
    description:
      "Monitor CIPC, SARS, B-BBEE, POPIA and Companies Act compliance from one intelligent workspace.",
    icon: "📋",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Funding Intelligence",
    description:
      "AI continuously discovers grants, funding programmes and investment opportunities for your business.",
    icon: "💰",
    color: "from-emerald-500 to-green-500",
  },
  {
    title: "Tender Discovery",
    description:
      "Access Government, Municipal and Private Sector procurement opportunities matched to your profile.",
    icon: "🏛️",
    color: "from-violet-500 to-purple-600",
  },
  {
    title: "Digital Trust Score™",
    description:
      "Build a trusted business profile that increases investor confidence and procurement readiness.",
    icon: "📈",
    color: "from-orange-500 to-red-500",
  },
  {
    title: "AI Compliance Assistant",
    description:
      "Receive instant AI guidance on regulations, compliance tasks, required documents and next actions.",
    icon: "🤖",
    color: "from-sky-500 to-blue-600",
  },
  {
    title: "Business Intelligence",
    description:
      "Track growth, compliance health, opportunities and business performance in one executive dashboard.",
    icon: "📊",
    color: "from-pink-500 to-rose-500",
  },
];

export default function Solutions() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-32">

      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.12),transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-6">

        {/* Heading */}

        <div className="mx-auto max-w-4xl text-center">

          <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-5 py-2 text-sm font-semibold uppercase tracking-widest text-blue-400">
            The ComplianceOS Platform
          </span>

          <h2 className="mt-8 text-5xl font-extrabold leading-tight text-white md:text-6xl">
            One Platform.
            <br />
            Every Business Opportunity.
          </h2>

          <p className="mt-8 text-xl leading-8 text-slate-300">
            ComplianceOS combines compliance, verification, AI,
            funding, procurement and business intelligence into one
            integrated operating system built for African businesses.
          </p>

        </div>

        {/* AI Core */}

        <div className="mt-20 flex justify-center">

          <div className="rounded-full border border-blue-500/40 bg-gradient-to-br from-blue-600 to-cyan-500 px-10 py-8 shadow-2xl shadow-blue-500/30">

            <div className="text-center">

              <div className="text-6xl">🤖</div>

              <h3 className="mt-4 text-2xl font-bold text-white">
                AI Core
              </h3>

              <p className="mt-2 text-slate-100">
                Intelligent Business Engine
              </p>

            </div>

          </div>

        </div>

        {/* Platform Modules */}

        <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {modules.map((module) => (

            <Card
              key={module.title}
              className="group border-slate-800 bg-slate-900/70"
            >

              <div
                className={`mb-6 h-2 w-full rounded-full bg-gradient-to-r ${module.color}`}
              />

              <div className="text-5xl">
                {module.icon}
              </div>

              <h3 className="mt-6 text-2xl font-bold text-white">
                {module.title}
              </h3>

              <p className="mt-5 leading-7 text-slate-300">
                {module.description}
              </p>

              <div className="mt-8 flex items-center justify-between">

                <span className="text-sm font-semibold text-blue-400">
                  Explore Module
                </span>

                <span className="text-2xl text-blue-400 transition group-hover:translate-x-2">
                  →
                </span>

              </div>

            </Card>

          ))}

        </div>

        {/* Bottom Banner */}

        <div className="mt-24 rounded-3xl border border-slate-800 bg-slate-900/70 p-10">

          <div className="grid gap-8 md:grid-cols-4">

            <div>
              <h4 className="text-4xl font-bold text-blue-400">
                12K+
              </h4>

              <p className="mt-2 text-slate-300">
                Businesses Supported
              </p>
            </div>

            <div>
              <h4 className="text-4xl font-bold text-blue-400">
                250+
              </h4>

              <p className="mt-2 text-slate-300">
                Funding Programmes
              </p>
            </div>

            <div>
              <h4 className="text-4xl font-bold text-blue-400">
                98%
              </h4>

              <p className="mt-2 text-slate-300">
                AI Verification Accuracy
              </p>
            </div>

            <div>
              <h4 className="text-4xl font-bold text-blue-400">
                24/7
              </h4>

              <p className="mt-2 text-slate-300">
                AI Business Assistant
              </p>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}