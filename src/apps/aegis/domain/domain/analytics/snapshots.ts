
import type { CEPSnapshot } from '../../types/snapshots';
import type { CognitionKey } from '../visualization/contextVisualization.types';

export function buildContextSnapshots(
  snapshots: CEPSnapshot[]
) {
  return snapshots.map((s) => ({
    period: s.period,
    totalVolume: s.data.keywords.reduce(
      (sum, k) => sum + k.volume,
      0
    ),
    cognitionDistribution: s.data.keywords.reduce(
      (acc, k) => {
        acc[k.cognition] += k.volume;
        return acc;
      },
      {
        informational: 0,
        exploratory: 0,
        commercial: 0,
        transactional: 0,
      } as Record<CognitionKey, number>
    ),
  }));
}
