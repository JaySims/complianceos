export interface KnowledgeDocument {

  id: string;

  title: string;

  source: string;

  category:
    | "law"
    | "policy"
    | "company"
    | "governance"
    | "compliance";

  content: string;

}

export interface KnowledgeResult {

  documents: KnowledgeDocument[];

  confidence: number;

}
