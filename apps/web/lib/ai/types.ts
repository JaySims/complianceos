export type ExecutiveAgent =

| "executive"

| "compliance"

| "governance"

| "funding"

| "procurement"

| "marketplace"

| "trust";

export interface AIRequest{

agent:ExecutiveAgent;

message:string;

companyId:string;

context?:unknown;

}

export interface AIResponse{

success:boolean;

agent:ExecutiveAgent;

message:string;

actions?:string[];

confidence:number;

}
