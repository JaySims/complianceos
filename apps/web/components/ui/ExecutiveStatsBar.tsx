import MetricCard from "./MetricCard";

export default function ExecutiveStatsBar() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      <MetricCard
        title="Digital Trust Score™"
        value="94"
        subtitle="+8 this month"
        color="blue"
      />

      <MetricCard
        title="Funding Matches"
        value="16"
        subtitle="Available Today"
        color="emerald"
      />

      <MetricCard
        title="Compliance Health"
        value="98%"
        subtitle="Excellent"
        color="cyan"
      />

      <MetricCard
        title="AI Confidence"
        value="96%"
        subtitle="Continuously Learning"
        color="amber"
      />

    </div>
  );
}