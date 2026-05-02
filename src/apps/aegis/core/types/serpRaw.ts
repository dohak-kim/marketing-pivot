export interface SerpRawRow {
  source: "GOOGLE" | "NAVER";
  extraction_keyword: string;
  title: string;
  uri: string;
  snippet: string;
  context_cluster_id: string;
  serp_features: string[];
  dominant_cognition: string;
}