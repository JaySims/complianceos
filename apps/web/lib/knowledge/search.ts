import {
  KnowledgeResult,
} from "./types";

export async function searchKnowledge(

query:string

):Promise<KnowledgeResult>{

console.log("Searching:",query);

return{

documents:[],

confidence:0,

};

}
