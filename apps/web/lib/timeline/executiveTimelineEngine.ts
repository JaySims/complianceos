export type ExecutiveTimelineEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  type:
    | "mission"
    | "trust"
    | "workflow"
    | "forecast"
    | "ai";
};

export function buildExecutiveTimeline(): ExecutiveTimelineEvent[] {
  return [
    {
      id: "1",
      title: "Executive Workspace Initialised",
      description:
        "Executive Operating System successfully started.",
      date: "Today",
      type: "ai",
    },

    {
      id: "2",
      title: "Digital Trust™ Calculated",
      description:
        "Executive Brain calculated current organisational Trust.",
      date: "Today",
      type: "trust",
    },

    {
      id: "3",
      title: "Mission Generated",
      description:
        "Executive AI created today's strategic mission.",
      date: "Today",
      type: "mission",
    },

    {
      id: "4",
      title: "Workflow Engine Activated",
      description:
        "Executive Workflow Engine is ready.",
      date: "Today",
      type: "workflow",
    },

    {
      id: "5",
      title: "Forecast Updated",
      description:
        "Executive Forecast recalculated projected outcomes.",
      date: "Today",
      type: "forecast",
    },
  ];
}
