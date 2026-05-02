
import { ContextVisualizationData, CognitionKey } from './contextVisualization.types';

export function buildCognitionHeatmap(
  data: ContextVisualizationData
) {
  const result: Record<CognitionKey, number> = {
    informational: 0,
    exploratory: 0,
    commercial: 0,
    transactional: 0,
  };

  data.keywords.forEach((k) => {
    result[k.cognition] += k.volume;
  });

  return result;
}
