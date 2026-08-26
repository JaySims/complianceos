export type AgentName =

| "executive"

| "trust"

| "compliance"

| "funding"

| "procurement"

| "marketplace"

| "governance";

export interface AgentTask{

agent:AgentName;

objective:string;

priority:"low"|"medium"|"high";

}

export interface AgentResult{

agent:AgentName;

success:boolean;

summary:string;

confidence:number;

}
