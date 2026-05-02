import type { AnalysisPeriod } from '../../core/search/analysisPeriod.types';
import type { CognitionKey } from '../visualization/contextVisualization.types';
import type { CEPSnapshot } from '../../types/snapshots';

export type PeriodCognitionMatrix = Record<
  AnalysisPeriod,
  Record<CognitionKey, number>
>;

/**
 * Transforms an array of CEPSnapshots into a time-series matrix,
 * aggregating keyword volumes by cognition for each analysis period.
 */
export function buildPeriodCognitionMatrix(
  snapshots: CEPSnapshot[]
): PeriodCognitionMatrix {
  return snapshots.reduce((matrix, snapshot) => {
    const cognitionVolumes = snapshot.data.keywords.reduce(
      (acc, keyword) => {
        acc[keyword.cognition] = (acc[keyword.cognition] || 0) + keyword.volume;
        return acc;
      },
      {
        informational: 0,
        exploratory: 0,
        commercial: 0,
        transactional: 0,
      } as Record<CognitionKey, number>
    );

    matrix[snapshot.period] = cognitionVolumes;
    return matrix;
  }, {} as PeriodCognitionMatrix);
}

export interface CognitionShift {
  cognition: CognitionKey;
  change: number; // Percentage change
  trend: 'increase' | 'decrease' | 'stable';
  fromVolume: number;
  toVolume: number;
}

export interface CognitionShiftResult {
  periodComparison: [AnalysisPeriod, AnalysisPeriod];
  shifts: CognitionShift[];
}

/**
 * Analyzes and quantifies the shift in search cognition volumes between
 * two distinct analysis periods.
 */
export function analyzeCognitionShifts(
  matrix: PeriodCognitionMatrix,
  periods: [AnalysisPeriod, AnalysisPeriod]
): CognitionShiftResult | null {
  const [recent, previous] = periods;

  if (!matrix[recent] || !matrix[previous]) {
    return null;
  }

  const shifts = (Object.keys(matrix[recent]) as CognitionKey[]).map(
    (cognition) => {
      const toVolume = matrix[recent][cognition];
      const fromVolume = matrix[previous][cognition];
      const change =
        fromVolume === 0
          ? toVolume > 0
            ? 1
            : 0
          : (toVolume - fromVolume) / fromVolume;

      // FIX: Explicitly type the 'trend' variable to satisfy the CognitionShift interface.
      const trend: 'increase' | 'decrease' | 'stable' =
        change > 0.1
          ? 'increase'
          : change < -0.1
          ? 'decrease'
          : 'stable';

      return {
        cognition,
        change,
        trend,
        fromVolume,
        toVolume,
      };
    }
  );

  return {
    periodComparison: periods,
    shifts,
  };
}
