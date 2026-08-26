import Card from "./ui/Card";

const opportunities = [
  {
    title: "IDC SME Growth Fund",
    amount: "Up to R2.5 Million",
    match: "96%",
    status: "Funding",
  },
  {
    title: "Department of Health Tender",
    amount: "R14 Million",
    match: "91%",
    status: "Tender",
  },
  {
    title: "MTN Supplier Programme",
    amount: "Enterprise Procurement",
    match: "89%",
    status: "Supplier",
  },
  {
    title: "DTIC Export Grant",
    amount: "International Expansion",
    match: "94%",
    status: "Grant",
  },
];

export default function AIOpportunityEngine() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-32">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-6">

        <div className="mx-auto max-w-4xl text-center">

          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-2 text-sm font-semibold uppercase tracking-widest text-blue-400">
            AI Opportunity Engine™
          </span>

          <h2 className="mt-8 text-5xl font-extrabold text-white">
            AI Never Stops Looking
            <br />
            For Your Next Opportunity.
          </h2>

          <p className="mt-8 text-xl leading-8 text-slate-300">
            ComplianceOS continuously scans funding programmes,
            government tenders, supplier databases and investment
            opportunities that match your business profile.
          </p>

        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">

          <Card className="lg:col-span-2">

            <div className="mb-8 flex items-center justify-between">

              <div>
                <h3 className="text-2xl font-bold text-white">
                  Today's AI Matches
                </h3>

                <p className="mt-2 text-slate-400">
                  Updated in real time
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-sm font-semibold text-emerald-400">
                  AI Monitoring
                </span>
              </div>

            </div>

            <div className="space-y-5">

              {opportunities.map((item) => (

                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
                >

                  <div>

                    <p className="text-xs uppercase tracking-widest text-blue-400">
                      {item.status}
                    </p>

                    <h4 className="mt-2 text-xl font-bold text-white">
                      {item.title}
                    </h4>

                    <p className="mt-2 text-slate-400">
                      {item.amount}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-4xl font-bold text-emerald-400">
                      {item.match}
                    </p>

                    <p className="text-slate-400">
                      Match
                    </p>

                  </div>

                </div>

              ))}

            </div>

          </Card>

          <div className="space-y-8">

            <Card>

              <h3 className="text-xl font-bold text-white">
                AI Recommendation
              </h3>

              <div className="mt-6 rounded-2xl border border-blue-500 bg-blue-600/10 p-6">

                <p className="font-semibold text-blue-400">
                  Increase Your Trust Score
                </p>

                <p className="mt-4 leading-7 text-slate-300">
                  Upload your latest Tax Clearance
                  Certificate to increase your funding
                  eligibility and unlock additional
                  procurement opportunities.
                </p>

              </div>

            </Card>

            <Card>

              <h3 className="text-xl font-bold text-white">
                AI Insights
              </h3>

              <div className="mt-8 space-y-5">

                <Insight
                  title="Funding Matches"
                  value="16"
                />

                <Insight
                  title="Tender Matches"
                  value="8"
                />

                <Insight
                  title="Supplier Opportunities"
                  value="27"
                />

                <Insight
                  title="AI Confidence"
                  value="96%"
                />

              </div>

            </Card>

          </div>

        </div>

      </div>

    </section>
  );
}

function Insight({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-800 p-4">

      <span className="text-slate-300">
        {title}
      </span>

      <span className="text-xl font-bold text-blue-400">
        {value}
      </span>

    </div>
  );
}