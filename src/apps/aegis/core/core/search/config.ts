
import type { AnalysisPeriod } from './analysisPeriod.types';

export type SearchSource = 'naver' | 'google';

/** ISO 8601 date string (YYYY-MM-DD) range */
export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface SearchConfig {
  sources: SearchSource[];
  depth: {
    google: number;
    naver: number;
  };
  period: AnalysisPeriod;           // preset for single mode
  dateRange: DateRange | null;      // null = use period preset (single mode)
  // Temporal Comparison Mode
  comparisonMode: boolean;
  periodA: AnalysisPeriod;          // preset fallback when no custom range
  periodB: AnalysisPeriod;
  dateRangeA: DateRange | null;     // null = use periodA preset
  dateRangeB: DateRange | null;     // null = use periodB preset
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultDateRangeA(): DateRange {
  const end = new Date();
  end.setMonth(end.getMonth() - 3);
  const start = new Date(end);
  start.setMonth(start.getMonth() - 6);
  return { start: isoDate(start), end: isoDate(end) };
}

function defaultDateRangeB(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  return { start: isoDate(start), end: isoDate(end) };
}

export const defaultConfig: SearchConfig = {
  sources: ['naver', 'google'],
  depth: {
    google: 2,
    naver: 2
  },
  period: '3m',
  dateRange: null,              // null = use period preset
  comparisonMode: false,
  periodA: '6m',
  periodB: '1m',
  dateRangeA: defaultDateRangeA(),
  dateRangeB: defaultDateRangeB(),
};
