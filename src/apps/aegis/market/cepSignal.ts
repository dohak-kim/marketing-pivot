import { SerpSignal } from "./serp";

export interface CepMarketSignal {
  cepId: string;
  relatedQueries: string[];
  signals: SerpSignal[];

  marketPressureScore: number; // 0~100
}
