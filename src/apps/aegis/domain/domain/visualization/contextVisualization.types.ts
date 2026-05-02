
export type CognitionKey =
  | 'informational'
  | 'exploratory'
  | 'commercial'
  | 'transactional';

export interface KeywordNode {
  keyword: string;
  volume: number;
  cognition: CognitionKey;
  cpc?: number;
  competition?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ContextVisualizationData {
  contextId: string;
  contextLabel: string;
  keywords: KeywordNode[];
}
