import { executiveAI } from "./executive-orchestrator";

export interface AIConversation {

  greeting: string;

  mission: string;

  explanation: string;

  nextQuestion: string;

}

export class ConversationEngine {

  generate(): AIConversation {

    const intelligence =
      executiveAI.analyseOrganisation();

    return {

      greeting:

        "Good morning. I'm your Executive AI Advisor.",

      mission:

        intelligence.recommendation.title,

      explanation:

        intelligence.recommendation.description,

      nextQuestion:

        "Let's begin by registering your organisation. What is your registered company name?"

    };

  }

}

export const executiveConversation =
  new ConversationEngine();
