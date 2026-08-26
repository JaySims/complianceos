import Card from "./ui/Card";

export default function BusinessCategories() {
  return (
    <section className="bg-slate-950 py-24 text-white">

      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-16 text-center">

          <h2 className="text-5xl font-bold">
            Explore Opportunities
          </h2>

          <p className="mt-6 text-xl text-slate-400">
            Discover funding, compliance services,
            tenders and AI-powered business opportunities.
          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          <Card>
            <div className="text-5xl">🏛</div>

            <h3 className="mt-6 text-2xl font-bold">
              Government Funding
            </h3>

            <p className="mt-4 text-slate-400">
              IDC, SEFA, NEF,
              DTIC grants and incentives.
            </p>
          </Card>

          <Card>
            <div className="text-5xl">📄</div>

            <h3 className="mt-6 text-2xl font-bold">
              Compliance
            </h3>

            <p className="mt-4 text-slate-400">
              CIPC, SARS,
              B-BBEE,
              Tax Clearance
            </p>
          </Card>

          <Card>
            <div className="text-5xl">🤝</div>

            <h3 className="mt-6 text-2xl font-bold">
              Private Sector
            </h3>

            <p className="mt-4 text-slate-400">
              Supplier databases,
              procurement
              and enterprise development.
            </p>
          </Card>

          <Card>
            <div className="text-5xl">⚡</div>

            <h3 className="mt-6 text-2xl font-bold">
              AI Matching
            </h3>

            <p className="mt-4 text-slate-400">
              Our AI finds opportunities
              specifically for your business.
            </p>
          </Card>

        </div>

      </div>

    </section>
  );
}