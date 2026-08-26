import MissionHeader from "./dashboard/MissionHeader";
import KpiGrid from "./dashboard/KpiGrid";
import ExecutiveAssistant from "./dashboard/ExecutiveAssistant";
import LiveActivityFeed from "./dashboard/LiveActivityFeed";
import BusinessHealthMatrix from "./dashboard/BusinessHealthMatrix";
import OpportunityForecast from "./dashboard/OpportunityForecast";
import PredictiveAnalytics from "./dashboard/PredictiveAnalytics";

export default function ExecutiveMissionControl() {
  return (
    <section className="relative bg-[#050816] py-32">

      <div className="mx-auto max-w-7xl px-6">

        <MissionHeader />

        <div className="mt-12">
          <KpiGrid />
        </div>

        <div className="mt-12 grid gap-8 xl:grid-cols-2">

          <ExecutiveAssistant />

          <LiveActivityFeed />

        </div>

        <div className="mt-12 grid gap-8 xl:grid-cols-2">

          <BusinessHealthMatrix />

          <OpportunityForecast />

        </div>

        <div className="mt-12">

          <PredictiveAnalytics />

        </div>

      </div>

    </section>
  );
}