
import type { AnalysisPeriod } from './analysisPeriod.types';

export type SearchSource = 'naver' | 'google';

export interface SearchConfig {
  sources: SearchSource[];
  depth: {
    google: number;
    naver: number;
  };
  period: AnalysisPeriod;
}

export const defaultConfig: SearchConfig = {
  sources: ['naver', 'google'],
  depth: {
    google: 2,
    naver: 2
  },
  period: '3m',
};
