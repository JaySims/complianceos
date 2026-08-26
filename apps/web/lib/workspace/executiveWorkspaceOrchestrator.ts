export type ExecutiveWorkspaceModule = {
  id: string;
  title: string;
  visible: boolean;
  priority: number;
};

export function buildExecutiveWorkspaceModules() {

  const modules: ExecutiveWorkspaceModule[] = [

    {
      id: "briefing",
      title: "Executive Briefing™",
      visible: true,
      priority: 1,
    },

    {
      id: "assessment",
      title: "Executive Assessment™",
      visible: true,
      priority: 2,
    },

    {
      id: "forecast",
      title: "Executive Forecast™",
      visible: true,
      priority: 3,
    },

    {
      id: "insights",
      title: "Executive Insights™",
      visible: true,
      priority: 4,
    },

    {
      id: "mission",
      title: "Executive Mission™",
      visible: true,
      priority: 5,
    },

    {
      id: "timeline",
      title: "Executive Timeline™",
      visible: true,
      priority: 6,
    },

    {
      id: "copilot",
      title: "Executive Copilot™",
      visible: true,
      priority: 7,
    },

  ];

  return modules.sort(
    (a, b) => a.priority - b.priority
  );

}
