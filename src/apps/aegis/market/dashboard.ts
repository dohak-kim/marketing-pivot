import { Context } from "../core/context";
import { EvaluationHistory } from "../evaluation/history";

/**
 * Summary interface for the strategic intelligence dashboard.
 */
export interface ContextDashboardItem {
  contextId: string;
  situation: string;
  marketPressureScore: number;
  avgContentScore: number;
  finalPriorityScore: number;
  strategyState: string;
}

/**
 * Transforms a raw Context object and its evaluation history into a dashboard-ready summary item.
 */
export function mapContextToDashboardItem(
  cep: Context,
  history: EvaluationHistory[] = []
): ContextDashboardItem {
  // Pressure is the aggregate velocity of market signals
  const marketPressureScore = Math.round(
    (cep.marketSignal.naverScore + cep.marketSignal.googleScore) / 2
  );

  // Content score is derived from historical evaluations, or remains 0 if un-synthesized
  const avgContentScore = history.length > 0 
    ? Math.round(history.reduce((acc, h) => acc + h.overallScore, 0) / history.length)
    : 0;

  return {
    contextId: cep.id,
    situation: cep.situation,
    marketPressureScore,
    avgContentScore,
    finalPriorityScore: cep.marketSignal.priorityScore,
    strategyState: cep.strategyState ?? 'pre-strategy',
  };
}
