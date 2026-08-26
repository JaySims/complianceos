import Card from "./ui/Card";

export default function BusinessDashboard() {
  return (
    <section className="bg-slate-950 py-28">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
            BUSINESS INTELLIGENCE
          </p>

          <h2 className="mt-4 text-5xl font-bold text-white">
            Your Business. One Intelligent Dashboard.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-xl text-slate-400">
            ComplianceOS continuously monitors your compliance,
            funding readiness, procurement opportunities and
            business growth using AI.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">

          <Card className="lg:col-span-2">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wider text-slate-400">
                  Business Health
                </p>

                <h3 className="mt-2 text-3xl font-bold text-white">
                  Excellent
                </h3>
              </div>

              <div className="text-right">
                <p className="text-5xl font-bold text-blue-400">
                  94%
                </p>

                <p className="text-slate-400">
                  Trust Score
                </p>
              </div>
            </div>

            <div className="mt-10 space-y-6">

              <Metric
                title="Compliance"
                value="98%"
              />

              <Metric
                title="Funding Readiness"
                value="91%"
              />

              <Metric
                title="Tender Readiness"
                value="89%"
              />

              <Metric
                title="Investment Readiness"
                value="94%"
              />

            </div>

          </Card>

          <Card>

            <h3 className="text-xl font-bold text-white">
              AI Recommendation
            </h3>

            <div className="mt-8 rounded-2xl bg-blue-600/10 p-6 border border-blue-500">

              <p className="font-semibold text-blue-400">
                Increase Funding Eligibility
              </p>

              <p className="mt-4 leading-7 text-slate-300">
                Upload your latest
                B-BBEE Affidavit to unlock
                12 additional funding programmes
                and improve your Trust Score.
              </p>

            </div>

            <div className="mt-8 space-y-4">

              <Stat
                title="Funding Matches"
                value="16"
              />

              <Stat
                title="Tender Matches"
                value="8"
              />

              <Stat
                title="Documents Missing"
                value="2"
              />

            </div>

          </Card>

        </div>

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
    <div>

      <div className="mb-2 flex justify-between">
        <span className="text-slate-300">
          {title}
        </span>

        <span className="font-semibold text-blue-400">
          {value}
        </span>
      </div>

      <div className="h-3 rounded-full bg-slate-800">
        <div className="h-3 w-[90%] rounded-full bg-blue-500"></div>
      </div>

    </div>
  );
}

function Stat({
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

      <span className="text-2xl font-bold text-blue-400">
        {value}
      </span>
    </div>
  );
}