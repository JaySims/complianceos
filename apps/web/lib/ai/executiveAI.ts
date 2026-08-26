import { analyseCompliance } from "@/lib/agents";

import { loadMemory } from "@/lib/memory/memoryEngine";

import { searchKnowledge } from "@/lib/knowledge/search";

import { runExecutiveWorkflow } from "@/lib/orchestrator/executiveOrchestrator";

export interface ExecutivePrompt{

companyId:string;

message:string;

companyName:string;

industry:string;

trustScore:number;

}

export async function executiveAI(

prompt:ExecutivePrompt

){

const memory=

loadMemory(prompt.companyId);

const knowledge=

await searchKnowledge(prompt.message);

const workflow=

await runExecutiveWorkflow([

{

agent:"compliance",

objective:prompt.message,

priority:"high",

},

]);

const compliance=

await analyseCompliance({

companyName:prompt.companyName,

industry:prompt.industry,

trustScore:prompt.trustScore,

completedSteps:

memory?.completedSteps??[],

});

return{

memory,

knowledge,

workflow,

compliance,

reply:

compliance.summary,

};

}
