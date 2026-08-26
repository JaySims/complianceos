import { executiveDecision } from "./decision-engine";
import { executiveResponse } from "./response-engine";
import { executiveAI } from "./executive-orchestrator";

export class ExecutiveController {

  execute() {

    const intelligence =
      executiveAI.analyseOrganisation();

    const decision =
      executiveDecision.decide();

    const response =
      executiveResponse.generate();

    return {

      intelligence,

      decision,

      response,

    };

  }

}

export const executiveController =
  new ExecutiveController();
