/**
 * Represents a historical record of a content evaluation session.
 * Used for tracking strategic performance trends and optimization history.
 */
export interface EvaluationHistory {
  contentId: string;
  timestamp: number;
  overallScore: number;
}

/**
 * Calculates the net improvement between the first and most recent evaluation.
 */
export function calculateImprovementDelta(
  history: EvaluationHistory[]
): number {
  if (history.length < 2) return 0;

  const first = history[0].overallScore;
  const last = history[history.length - 1].overallScore;

  return last - first;
}
