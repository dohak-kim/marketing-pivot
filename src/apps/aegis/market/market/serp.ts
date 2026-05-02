
export type SearchSource = "google" | "naver";

export interface SerpSignal {
  source: SearchSource;
  query: string;
  intentMix: {
    informational: number;
    exploratory: number;
    transactional: number;
    commercial: number;
  };
  serpFeatures: string[];
  trendScore: number; // 0~100
}
