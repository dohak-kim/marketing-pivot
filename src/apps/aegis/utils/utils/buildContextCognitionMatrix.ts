import { Context, CognitionKey } from '../core/context';

const COGNITIONS: CognitionKey[] = [
  'informational',
  'exploratory',
  'commercial',
  'transactional',
];

// fallback
const DEFAULT_COGNITION_DIST: Record<CognitionKey, number> = {
  informational: 0.0,
  exploratory: 0.0,
  commercial: 0.0,
  transactional: 0.0,
};

export function buildContextCognitionMatrix(contexts: Context[]) {
  return contexts.map((context) => {
    // Adapter: map Context journey into distribution
    const dist = context.journey?.cognitionVector || DEFAULT_COGNITION_DIST;

    return {
      contextId: context.id,
      contextTitle: context.situation,
      values: COGNITIONS.map((cognition) => ({
        cognition,
        value: dist[cognition] ?? 0,
      })),
    };
  });
}