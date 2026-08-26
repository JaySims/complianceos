"use client";

import ExecutiveMorningBrief from "./ExecutiveMorningBrief";
import ExecutiveAIWorkspace from "./ExecutiveAIWorkspace";
import ExecutiveActivityFeed from "./ExecutiveActivityFeed";

export default function ExecutiveCommandCenter() {
  return (

    <section className="space-y-8">

      {/* Executive Morning Brief */}

      <ExecutiveMorningBrief />

      {/* Main Executive Workspace */}

      <div className="grid grid-cols-12 gap-8">

        {/* AI Workspace */}

        <div className="col-span-12 xl:col-span-8">

          <ExecutiveAIWorkspace />

        </div>

        {/* Activity Feed */}

        <div className="col-span-12 xl:col-span-4">

          <ExecutiveActivityFeed />

        </div>

      </div>

    </section>

  );
}
