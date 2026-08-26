export type MissionStep = {
  id: string;
  title: string;
  completed: boolean;
};

export type MissionProgress = {
  mission: string;
  progress: number;
  steps: MissionStep[];
};

export function buildMissionProgress(
  governanceComplete: boolean,
  complianceComplete: boolean,
  fundingReady: boolean,
  procurementReady: boolean
): MissionProgress {

  const steps: MissionStep[] = [

    {
      id: "governance",
      title: "Governance Verification",
      completed: governanceComplete,
    },

    {
      id: "compliance",
      title: "Compliance Profile",
      completed: complianceComplete,
    },

    {
      id: "funding",
      title: "Funding Readiness",
      completed: fundingReady,
    },

    {
      id: "procurement",
      title: "Procurement Readiness",
      completed: procurementReady,
    },

  ];

  const completed =
    steps.filter(step => step.completed).length;

  return {

    mission:
      "Become Executive Ready",

    progress:
      Math.round(
        (completed / steps.length) * 100
      ),

    steps,

  };

}
