import { CepMarketSignal } from "./cepSignal";

export function calculateContextPriority(
  marketSignal: CepMarketSignal,
  avgContentScore: number
): number {
  const marketWeight = 0.6;
  const contentWeight = 0.4;

  return Math.round(
    marketSignal.marketPressureScore * marketWeight +
    avgContentScore * contentWeight
  );
}
