
import type { CEPSnapshot } from '../../types/snapshots';

export interface ContextMomentumResult {
  contextId: string;
  growthRate: number;
  signal: 'surging' | 'stable' | 'declining';
}

export function detectContextMomentum(
  recent: CEPSnapshot,
  previous: CEPSnapshot
): ContextMomentumResult {
  const recentVolume = recent.data.keywords.reduce(
    (s, k) => s + k.volume,
    0
  );
  const prevVolume = previous.data.keywords.reduce(
    (s, k) => s + k.volume,
    0
  );

  const growthRate =
    prevVolume === 0
      ? recentVolume > 0 ? 1 : 0
      : (recentVolume - prevVolume) / prevVolume;

  return {
    contextId: recent.data.contextId,
    growthRate,
    signal:
      growthRate > 0.5
        ? 'surging'
        : growthRate < -0.3
        ? 'declining'
        : 'stable',
  };
}
