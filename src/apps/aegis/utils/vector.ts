import { Context, ConversionStage, CognitionVector, CognitionKey } from '../core/context';

/**
 * 4-dimensional vector type
 */
export type Vector4 = [number, number, number, number];

/**
 * Full Context Vector: 4 (Cognition) + 4 (Conversion) + 1 (Temporal) = 9 dimensions
 * 
 * Structure:
 * [
 *   cognitionDistribution (4), // [informational, exploratory, commercial, transactional]
 *   conversion stage (4),      // One-hot encoding
 *   temporal signal (1)        // Optional/Derived (-1, 0, 1)
 * ]
 */
export type ContextVector = number[];

export interface StrategyBlock {
  id: string;
  contextIds: string[];
  dominantCognition: CognitionKey;
  dominantConversion: ConversionStage;
  description: string;
  recommendedActions: string[];
}

export const CONVERSION_ONE_HOT_MAP: Record<ConversionStage, Vector4> = {
  [ConversionStage.AWARENESS]:      [1, 0, 0, 0],
  [ConversionStage.CONSIDERATION]:  [0, 1, 0, 0],
  [ConversionStage.DECISION]:       [0, 0, 1, 0],
  [ConversionStage.POST_PURCHASE]:  [0, 0, 0, 1],
};

export function getCognitionVector(cognition: CognitionVector): Vector4 {
  // Defined Order: [informational, exploratory, commercial, transactional]
  return [
    cognition.informational,
    cognition.exploratory,
    cognition.commercial,
    cognition.transactional
  ];
}

export function getConversionVector(stage: ConversionStage): Vector4 {
  return CONVERSION_ONE_HOT_MAP[stage] || [0, 0, 0, 0];
}

export function getTemporalScore(direction: "UP" | "FLAT" | "DOWN"): number {
  switch (direction) {
    case 'UP': return 1.0;
    case 'DOWN': return -1.0;
    default: return 0.0;
  }
}

export function computeContextVector(cep: Context): ContextVector {
  const i = getCognitionVector(cep.journey.cognitionVector);
  const c = getConversionVector(cep.journey.conversionStage);
  const t = getTemporalScore(cep.marketSignal.trendDirection);
  
  return [...i, ...c, t];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  
  if (magA === 0 || magB === 0) return 0;

  return dot / (magA * magB);
}

/* =========================
 *  Network Graph Logic
 * ========================= */

export interface NetworkNode {
  id: string;
  label: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
}

export interface ContextNetwork {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

/**
 * Builds a similarity network graph from a list of Contexts.
 * Edges are created if the cosine similarity between two Context vectors exceeds the threshold.
 */
export function buildContextNetwork(ceps: Context[], threshold = 0.75): ContextNetwork {
  const vectors = ceps.map((c) => ({
    id: c.id,
    label: c.situation,
    vector: computeContextVector(c),
  }));

  const edges: NetworkEdge[] = [];

  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      const sim = cosineSimilarity(
        vectors[i].vector,
        vectors[j].vector
      );

      if (sim >= threshold) {
        edges.push({
          source: vectors[i].id,
          target: vectors[j].id,
          weight: sim,
        });
      }
    }
  }

  return {
    nodes: vectors.map(v => ({ id: v.id, label: v.label })),
    edges,
  };
}

export interface ContextCluster {
  coreContext: string;
  members: string[];
  avgSim: number;
}

/**
 * Finds connected components in the graph using iterative DFS.
 * Returns an array of arrays, where each inner array contains node IDs of a component.
 */
export function getConnectedComponents(nodes: NetworkNode[], edges: NetworkEdge[]): string[][] {
  const visited = new Set<string>();
  const adj = new Map<string, string[]>();

  edges.forEach(e => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source)!.push(e.target);
    adj.get(e.target)!.push(e.source);
  });

  const components: string[][] = [];

  for (const node of nodes) {
    if (visited.has(node.id)) continue;

    const stack = [node.id];
    const group: string[] = [];

    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      
      visited.add(cur);
      group.push(cur);

      const neighbors = adj.get(cur) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }

    if (group.length > 0) components.push(group);
  }

  return components;
}

function getDominantCognition(ceps: Context[]): CognitionKey {
  const scores = {
    informational: 0,
    exploratory: 0,
    commercial: 0,
    transactional: 0
  };

  ceps.forEach(c => {
    scores.informational += c.journey.cognitionVector.informational;
    scores.exploratory += c.journey.cognitionVector.exploratory;
    scores.commercial += c.journey.cognitionVector.commercial;
    scores.transactional += c.journey.cognitionVector.transactional;
  });

  return (Object.keys(scores) as CognitionKey[]).reduce((a, b) => scores[a] > scores[b] ? a : b);
}

function getDominantConversion(ceps: Context[]): ConversionStage {
  const counts: Record<string, number> = {};
  ceps.forEach(c => {
    counts[c.journey.conversionStage] = (counts[c.journey.conversionStage] || 0) + 1;
  });
  return (Object.keys(counts) as ConversionStage[]).reduce((a, b) => counts[a] > counts[b] ? a : b);
}

function buildDescription(cognition: CognitionKey, conversion: ConversionStage): string {
  return `이 전략 블록은 '${cognition}' 인지 의도를 중심으로,
${conversion} 단계에서 문제를 인식하고 있는 사용자 맥락을 포괄합니다.
서로 다른 상황(Context)이지만 동일한 의사결정 방향을 공유합니다.`.trim();
}

/**
 * Identifies Strategy Blocks (connected components) from the filtered network.
 */
export function deriveStrategyBlocks(network: ContextNetwork, ceps: Context[]): StrategyBlock[] {
  const components = getConnectedComponents(network.nodes, network.edges);
  
  return components.map((ids, index) => {
    const memberCeps = ids.map(id => ceps.find(c => c.id === id)).filter(Boolean) as Context[];
    if (memberCeps.length === 0) return null;

    const dominantCognition = getDominantCognition(memberCeps);
    const dominantConversion = getDominantConversion(memberCeps);

    // Aggregate Actions
    const allActions = memberCeps.flatMap(c => c.actions.map(a => a.label));
    const uniqueActions = Array.from(new Set(allActions)).slice(0, 5);

    return {
      id: `SB-${index + 1}`,
      contextIds: ids,
      dominantCognition,
      dominantConversion,
      description: buildDescription(dominantCognition, dominantConversion),
      recommendedActions: uniqueActions
    };
  }).filter(Boolean) as StrategyBlock[];
}

/**
 * Identifies dense sub-clusters within the network where a node is connected 
 * to multiple peers with high similarity (>= threshold average).
 */
export function extractExecutableClusters(network: ContextNetwork, threshold = 0.88): ContextCluster[] {
  const clusters: ContextCluster[] = [];

  network.nodes.forEach((node) => {
    const connected = network.edges.filter(
      (e) => e.source === node.id || e.target === node.id
    );

    if (connected.length >= 2) {
      const avgSim =
        connected.reduce((s, e) => s + e.weight, 0) /
        connected.length;

      if (avgSim >= threshold) {
        clusters.push({
          coreContext: node.id,
          members: connected.map((e) =>
            e.source === node.id ? e.target : e.source
          ),
          avgSim,
        });
      }
    }
  });

  return clusters;
}

// 전략 밀도 → cosine similarity threshold
export const densityToThreshold = (density: number) => {
  if (density < 35) return 0.65;   // 구조 인식
  if (density < 70) return 0.78;   // 전략 실행
  return 0.88;                     // 크리에이티브 정밀
};