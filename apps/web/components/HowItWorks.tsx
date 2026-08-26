import JourneyHeader from "./journey/JourneyHeader";
import JourneyTimeline from "./journey/JourneyTimeline";
import TrustScoreShowcase from "./journey/TrustScoreShowcase";
import GrowthDestination from "./journey/GrowthDestination";

export default function HowItWorks() {
  return (
    <section className="bg-[#050816]">
      <JourneyHeader />
      <JourneyTimeline />
      <TrustScoreShowcase />
      <GrowthDestination />
    </section>
  );
}