import { Context } from '../core/context';
import { StrategicCluster, StrategicType } from '../models/strategicCluster';
import { deriveStrategyBlocks, buildContextNetwork } from '../utils/vector';
import { calculateClusterCognitionWeight } from './cognitionEngine';

function normalize(value: number): number {
  return Math.min(value / 1000, 1);
}

function calculatePriority(cluster: StrategicCluster): number {
  const opportunity = 1 - cluster.avgCompetitorShare;
  const marketSize = normalize(cluster.totalVolume);
  const competitiveGap =
    cluster.avgCompetitorShare - cluster.avgBrandShare;

  // Weighted score calculation
  const score = (
    opportunity * 0.35 +
    marketSize * 0.25 +
    competitiveGap * 0.2 +
    cluster.avgCognitionWeight * 0.2
  );
  
  return Number(score.toFixed(3));
}

function classifyCluster(cluster: StrategicCluster): StrategicType {
  if (cluster.avgBrandShare > 0.55)
    return "Defensive Hold";

  if (
    cluster.priorityScore > 0.7 &&
    cluster.avgCognitionWeight >= 0.75
  )
    return "Concentrated Attack";

  if (
    cluster.avgCompetitorShare < 0.3 &&
    cluster.avgCognitionWeight >= 0.6
  )
    return "Flank Opportunity";

  return "Experimental Zone";
}

export class StrategicEngine {
  static analyzeClusters(ceps: Context[], density: number = 0.75): StrategicCluster[] {
    if (!ceps || ceps.length === 0) return [];

    // Build network and derive blocks
    const network = buildContextNetwork(ceps, density);
    const blocks = deriveStrategyBlocks(network, ceps);

    return blocks.map(block => {
      const clusterCeps = ceps.filter(c => block.contextIds.includes(c.id));
      
      // Calculate aggregated metrics using volumeProxy if available
      const totalVolume = clusterCeps.reduce((sum, c) => {
          return sum + (c.volumeProxy || (c.metadata.keywords || []).reduce((kSum, k) => kSum + (k.volume || 0), 0));
      }, 0);
      
      // Use top-level share metrics calculated by BrandShareEngine
      const avgBrandShare = clusterCeps.reduce((sum, c) => sum + (c.brandShare || 0), 0) / (clusterCeps.length || 1);
      const avgCompetitorShare = clusterCeps.reduce((sum, c) => sum + (c.competitorShare || 0), 0) / (clusterCeps.length || 1);
      const avgCognitionWeight = calculateClusterCognitionWeight(clusterCeps);

      const clusterPartial = {
        id: block.id,
        label: `Strategic Cluster ${block.id.replace('SB-', '')}`,
        ceps: clusterCeps,
        dominantCognition: block.dominantCognition,
        dominantConversion: block.dominantConversion,
        keywords: clusterCeps.flatMap(c => c.metadata.keywords.map(k => k.keyword)).slice(0, 5),
        description: block.description,
        recommendedActions: block.recommendedActions, // Pass through
        
        avgBrandShare,
        avgCompetitorShare,
        totalVolume,
        avgCognitionWeight,
        priorityScore: 0,
        strategyType: "Experimental Zone" as StrategicType
      };

      // Calculate priority
      clusterPartial.priorityScore = calculatePriority(clusterPartial as StrategicCluster);
      
      // Classify Strategy Type
      clusterPartial.strategyType = classifyCluster(clusterPartial as StrategicCluster);

      return clusterPartial as StrategicCluster;
    });
  }
}