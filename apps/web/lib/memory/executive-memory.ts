export interface ExecutiveMemory {

  companyName: string;

  trustScore: number;

  completedSteps: string[];

  risks: string[];

  opportunities: string[];

  previousRecommendations: string[];

  currentMission: string;

}

export class ExecutiveMemoryStore {

  private memory: ExecutiveMemory = {

    companyName: "Your Organisation",

    trustScore: 0,

    completedSteps: [],

    risks: [],

    opportunities: [],

    previousRecommendations: [],

    currentMission: "Begin Executive Journey"

  };

  getMemory() {

    return this.memory;

  }

  update(data: Partial<ExecutiveMemory>) {

    this.memory = {

      ...this.memory,

      ...data,

    };

  }

  addCompletedStep(step: string) {

    if (!this.memory.completedSteps.includes(step)) {

      this.memory.completedSteps.push(step);

    }

  }

  addRisk(risk: string) {

    if (!this.memory.risks.includes(risk)) {

      this.memory.risks.push(risk);

    }

  }

  addOpportunity(opportunity: string) {

    if (!this.memory.opportunities.includes(opportunity)) {

      this.memory.opportunities.push(opportunity);

    }

  }

  addRecommendation(recommendation: string) {

    this.memory.previousRecommendations.unshift(recommendation);

    this.memory.previousRecommendations =
      this.memory.previousRecommendations.slice(0, 20);

  }

}

export const executiveMemory =
  new ExecutiveMemoryStore();
