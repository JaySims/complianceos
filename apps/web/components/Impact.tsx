const impacts = [
  {
    value: "10M+",
    title: "African SMEs",
    description:
      "Millions of businesses deserve access to compliance, trust and opportunity.",
  },
  {
    value: "1000+",
    title: "Funding Opportunities",
    description:
      "AI continuously matches businesses with grants, tenders and investment opportunities.",
  },
  {
    value: "24/7",
    title: "AI Compliance Support",
    description:
      "Always-available intelligent guidance for entrepreneurs and growing businesses.",
  },
  {
    value: "One Platform",
    title: "Everything Connected",
    description:
      "Registration, verification, visibility and growth—all in one trusted ecosystem.",
  },
];

export default function Impact() {
  return (
    <section className="bg-blue-700 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">

        <h2 className="text-center text-4xl font-bold">
          Building Africa's Digital Trust Economy
        </h2>

        <p className="mx-auto mt-4 max-w-3xl text-center text-blue-100">
          ComplianceOS exists to empower entrepreneurs, strengthen trust,
          create employment and unlock sustainable economic growth.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {impacts.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-blue-600 p-8"
            >
              <div className="text-5xl font-bold">
                {item.value}
              </div>

              <h3 className="mt-5 text-2xl font-bold">
                {item.title}
              </h3>

              <p className="mt-4 text-blue-100">
                {item.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}