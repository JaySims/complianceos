import Card from "./ui/Card";
import SectionHeading from "./ui/SectionHeading";
import Button from "./ui/Button";

const opportunities = [
  {
    title: "IDC SME Funding",
    match: "96%",
    amount: "Funding up to R2.5 Million",
    status: "Eligible",
  },
  {
    title: "Government ICT Tender",
    match: "93%",
    amount: "Supply Digital Services",
    status: "Open",
  },
  {
    title: "Corporate Supplier Programme",
    match: "89%",
    amount: "Private Sector Procurement",
    status: "Recommended",
  },
];

export default function AIOpportunity() {
  return (
    <section className="bg-slate-900 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          title="AI Opportunity Engine"
          subtitle="Our AI continuously scans funding, tenders and supplier opportunities that match your business profile."
          dark
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {opportunities.map((item) => (
            <Card key={item.title}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    {item.status}
                  </span>

                  <h3 className="mt-5 text-2xl font-bold">
                    {item.title}
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    AI Match
                  </p>

                  <p className="text-4xl font-bold text-blue-600">
                    {item.match}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-xl bg-slate-100 p-5">
                <p className="font-semibold text-slate-900">
                  {item.amount}
                </p>
              </div>

              <div className="mt-8">
                <Button
                  href="/register"
                  variant="primary"
                >
                  View Opportunity
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}