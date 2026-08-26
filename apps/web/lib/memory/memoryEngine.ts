import { ExecutiveMemory } from "./types";

const memory = new Map<string, ExecutiveMemory>();

export function saveMemory(data: ExecutiveMemory) {

  memory.set(data.companyId, data);

}

export function loadMemory(

  companyId: string

): ExecutiveMemory | undefined {

  return memory.get(companyId);

}

export function clearMemory(

  companyId: string

) {

  memory.delete(companyId);

}
