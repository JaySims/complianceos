export type ExecutiveWorkspaceSection = {
  id: string;
  title: string;
  order: number;
};

export function buildExecutiveWorkspace() {
  const sections: ExecutiveWorkspaceSection[] = [
    {
      id: "briefing",
      title: "Executive Briefing™",
      order: 1,
    },
    {
      id: "assessment",
      title: "Executive Assessment™",
      order: 2,
    },
    {
      id: "reasoning",
      title: "Executive Reasoning™",
      order: 3,
    },
    {
      id: "forecast",
      title: "Executive Forecast™",
      order: 4,
    },
    {
      id: "insights",
      title: "Executive Insights™",
      order: 5,
    },
    {
      id: "mission",
      title: "Executive Mission™",
      order: 6,
    },
    {
      id: "actions",
      title: "Executive Actions™",
      order: 7,
    },
  ];

  return sections.sort((a, b) => a.order - b.order);
}
