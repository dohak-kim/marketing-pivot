
import { ContextVisualizationData } from '../domain/visualization/contextVisualization.types';
import { AnalysisPeriod } from '../core/search/analysisPeriod.types';

export interface CEPSnapshot {
  period: AnalysisPeriod;
  data: ContextVisualizationData;
}
