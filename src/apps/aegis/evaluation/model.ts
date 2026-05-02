
export interface EvaluationScore {
  score: number; // 0~100
  rationale: string;
}

export interface ContentEvaluation {
  blueprintFidelity: EvaluationScore;
  intentAlignment: EvaluationScore;
  cdjConsistency: EvaluationScore;
  channelFit: EvaluationScore;

  overallScore: number;
  critique?: string;
  improvementHints: string[];
}
