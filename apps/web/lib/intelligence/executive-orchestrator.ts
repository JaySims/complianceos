import { ExecutiveEngine } from "./executive-engine";
import { TrustEngine } from "./trust-engine";
import { RecommendationEngine } from "./recommendation-engine";
import { OpportunityEngine } from "./opportunity-engine";
import { RiskEngine } from "./risk-engine";

export class ExecutiveOrchestrator {

  private executive = new ExecutiveEngine();

  private trust = new TrustEngine();

  private recommendation = new RecommendationEngine();

  private opportunity = new OpportunityEngine();

  private risk = new RiskEngine();

  analyseOrganisation() {

    const trustReport = this.trust.generateReport();

    const recommendation =
      this.recommendation.generate(trustReport);

    const opportunities =
      this.opportunity.generate();

    const risks =
      this.risk.generate();

    return {

      executiveTrust: trustReport,

      recommendation,

      opportunities,

      risks,

      generatedAt: new Date()

    };

  }

}

export const executiveAI =
  new ExecutiveOrchestrator();
