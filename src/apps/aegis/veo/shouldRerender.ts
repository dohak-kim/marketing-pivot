import { ContentEvaluation } from "../evaluation/model";

/**
 * Determines whether a generated video asset requires a strategic re-render 
 * based on performance benchmarks for overall score, channel fit, and intent alignment.
 */
export function shouldRerenderVeo(
  evaluation: ContentEvaluation
): boolean {
  return (
    evaluation.overallScore < 80 ||
    evaluation.channelFit.score < 75 ||
    evaluation.intentAlignment.score < 75
  );
}
