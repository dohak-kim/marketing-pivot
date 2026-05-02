import { Context } from '../core/context';

export type StrategicType = 
  | "Defensive Hold"
  | "Concentrated Attack"
  | "Flank Opportunity"
  | "Experimental Zone";

export interface StrategicCluster {
  id: string;
  label: string;
  ceps: Context[];

  avgBrandShare: number;
  avgCompetitorShare: number;
  totalVolume: number;

  avgCognitionWeight: number;

  priorityScore: number;

  // Additional fields for UI and Classification
  dominantCognition: string;
  dominantConversion: string;
  keywords: string[];
  description: string;
  recommendedActions: string[];
  strategyType: StrategicType;
}