import { getExecutiveContext } from "@/lib/executive/context";
import { generateExecutiveInsights } from "@/lib/ai/executiveBrain";

export type ExecutiveRequest = {

  message: string;

};

export type ExecutiveResponse = {

  answer: string;

  insights: ReturnType<typeof generateExecutiveInsights>;

};

export async function executeExecutiveAI(

  request: ExecutiveRequest

): Promise<ExecutiveResponse> {

  const context = getExecutiveContext();

  const insights = generateExecutiveInsights();

  return {

    answer: `Good day ${context.executive.name}. I understand you asked:

"${request.message}"

Your highest current priority remains Governance Verification.`,

    insights,

  };

}
