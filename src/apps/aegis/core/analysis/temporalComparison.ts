
import { Context } from '../context';
import { AnalysisPeriod, ANALYSIS_PERIOD_OPTIONS } from '../search/analysisPeriod.types';

// ── Types ──────────────────────────────────────────────────────────────────

export type ChangeType = 'growing' | 'declining' | 'stable';

export interface MatchedCEP {
  cepA: Context;
  cepB: Context;
  matchScore: number;
  scoreChange: number;
  scoreChangePct: number;
  changeType: ChangeType;
  cognitionShift: boolean;
  /** Breakdown of how score was computed — useful for debugging and UI tooltips */
  matchDetail?: {
    textSim: number;
    kwSim: number;
    cognitionBonus: number;
    stageBonus: number;
    priorityBonus: number;
  };
}

export interface TemporalSnapshot {
  period: AnalysisPeriod;
  label: string;
  ceps: Context[];
  timestamp: string;
}

export interface TemporalComparison {
  snapshotA: TemporalSnapshot;
  snapshotB: TemporalSnapshot;
  matched: MatchedCEP[];
  emerging: Context[];
  disappeared: Context[];
}

export interface TemporalInsight {
  type: 'aeo' | 'geo' | 'trend' | 'opportunity' | 'warning';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

// ── Text similarity helpers ────────────────────────────────────────────────

/**
 * Korean-aware tokenizer.
 *
 * Strips common Korean grammatical suffixes before splitting so that
 * "남성스킨케어의" and "남성스킨케어" share a token, reducing false mismatches
 * caused purely by morphological variation.
 */
function tokenize(text: string): Set<string> {
  const stripped = (text || '')
    .toLowerCase()
    .replace(/[^가-힣a-z0-9\s]/g, ' ')
    // Strip common Korean particles and endings (only when preceded by 2+ char stem)
    .replace(/([가-힣]{2,})(은|는|이|가|을|를|의|에서|에|으로|로|와|과|도|만|께|한테|에게|부터|까지|처럼|보다)/g, '$1')
    .split(/\s+/)
    .filter(t => t.length > 1);
  return new Set(stripped);
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(t => setB.has(t)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function keywordJaccard(kwA: string[], kwB: string[]): number {
  if (kwA.length === 0 || kwB.length === 0) return 0;
  const setA = new Set(kwA.map(k => k.toLowerCase().trim()));
  const setB = new Set(kwB.map(k => k.toLowerCase().trim()));
  return jaccardSimilarity(setA, setB);
}

function getCepKeywords(cep: Context): string[] {
  const kws = (cep.metadata as any)?.keywords || [];
  return kws.map((k: any) => (typeof k === 'string' ? k : k?.keyword || '')).filter(Boolean);
}

// Returns the same cognition key used by the display layer (hybridCognition → cognition → vector)
// so that cognitionShift never contradicts what the table actually shows.
function getDisplayCognitionKey(cep: Context): string {
  return (cep as any).hybridCognition || cep.cognition || '';
}

// ── Multi-signal CEP pair scorer ──────────────────────────────────────────
//
// Problem with the old approach:
//   • Jaccard on AI-generated text requires exact token overlap.
//   • AI paraphrases the same concept differently every run.
//   • "남성 스킨케어 성분 분석" vs "남성 화장품 효능 비교" → Jaccard = 1/7 = 0.14
//     (old threshold 0.25 → both marked as disappeared + emerging — wrong)
//
// Fix: multi-signal scoring so semantically identical CEPs reliably match
//   1. Richer text comparison (clusterName + situation + queryGroup + description)
//      — more tokens = better overlap signal
//   2. Cognition alignment bonus — same intent type = same market phenomenon
//   3. CDJ stage alignment bonus  — same purchase stage = same context group
//   4. Priority proximity bonus  — similar market weight = likely the same cluster
//   5. Lower threshold 0.12 (was 0.25) — text sim alone rarely hits 0.25 for paraphrased AI output

const MATCH_THRESHOLD = 0.12;

function buildCepText(cep: Context): string {
  return [
    cep.marketSignal?.clusterName || '',
    cep.queryGroup || '',
    cep.situation || '',
    // Include first 120 chars of description for richer token pool (don't take all — too noisy)
    (cep.description || '').slice(0, 120),
  ].join(' ');
}

function scoreCEPPair(
  cepA: Context,
  cepB: Context,
): { score: number; detail: MatchedCEP['matchDetail'] } {

  // ── 1. Multi-field text similarity ────────────────────────────────────────
  const tokensA = tokenize(buildCepText(cepA));
  const tokensB = tokenize(buildCepText(cepB));
  const textSim = jaccardSimilarity(tokensA, tokensB);

  // ── 2. Keyword overlap (when available) ───────────────────────────────────
  const kwA = getCepKeywords(cepA);
  const kwB = getCepKeywords(cepB);
  const kwSim = keywordJaccard(kwA, kwB);

  // ── 3. Cognition alignment bonus ──────────────────────────────────────────
  // Same dominant intent = high probability of representing the same market context.
  // Applied even when text differs (AI paraphrasing shouldn't mask same-intent match).
  const cogA = getDisplayCognitionKey(cepA);
  const cogB = getDisplayCognitionKey(cepB);
  const cognitionBonus = cogA && cogB && cogA === cogB ? 0.12 : 0;

  // ── 4. CDJ stage alignment bonus ──────────────────────────────────────────
  const stageA = cepA.journey?.conversionStage;
  const stageB = cepB.journey?.conversionStage;
  const stageBonus = stageA && stageB && stageA === stageB ? 0.08 : 0;

  // ── 5. Priority score proximity bonus ─────────────────────────────────────
  // CEPs with similar market weights tend to represent the same cluster.
  // Cap: only apply when both scores > 0 and difference <= 25 points.
  const pA = cepA.marketSignal?.priorityScore || 0;
  const pB = cepB.marketSignal?.priorityScore || 0;
  const priorityBonus = pA > 0 && pB > 0 && Math.abs(pA - pB) <= 25 ? 0.06 : 0;

  // ── Weighted combination ───────────────────────────────────────────────────
  // Text:     0.50 (multi-field, morpheme-stripped — primary signal)
  // Keywords: 0.15 (only when non-empty, so the 0-weight case is handled)
  // Bonuses:  up to 0.26 (cognition + stage + priority)
  // Total max ≈ 0.50 + 0.15 + 0.26 = 0.91 → never hits 1.0 without real text overlap
  const kwWeight = kwA.length > 0 && kwB.length > 0 ? 0.15 : 0;
  const textWeight = 0.50;

  const score = Math.min(1,
    textSim * textWeight
    + kwSim * kwWeight
    + cognitionBonus
    + stageBonus
    + priorityBonus,
  );

  return {
    score,
    detail: { textSim, kwSim, cognitionBonus, stageBonus, priorityBonus },
  };
}

// ── Core Matching ──────────────────────────────────────────────────────────

export function matchCEPs(cepsA: Context[], cepsB: Context[]): {
  matched: MatchedCEP[];
  emerging: Context[];
  disappeared: Context[];
} {
  const usedBIds = new Set<string>();
  const usedAIds = new Set<string>();

  type Candidate = {
    cepA: Context;
    cepB: Context;
    score: number;
    detail: MatchedCEP['matchDetail'];
  };
  const candidates: Candidate[] = [];

  for (const cepA of cepsA) {
    for (const cepB of cepsB) {
      const { score, detail } = scoreCEPPair(cepA, cepB);
      if (score >= MATCH_THRESHOLD) {
        candidates.push({ cepA, cepB, score, detail });
      }
    }
  }

  // Greedy best-first: sort by score descending, take non-conflicting pairs
  candidates.sort((a, b) => b.score - a.score);

  const matched: MatchedCEP[] = [];

  for (const { cepA, cepB, score, detail } of candidates) {
    if (usedAIds.has(cepA.id) || usedBIds.has(cepB.id)) continue;

    usedAIds.add(cepA.id);
    usedBIds.add(cepB.id);

    const scoreA = cepA.marketSignal?.priorityScore || 0;
    const scoreB = cepB.marketSignal?.priorityScore || 0;
    const scoreChange = scoreB - scoreA;
    const scoreChangePct = scoreA > 0 ? (scoreChange / scoreA) * 100 : 0;

    const changeType: ChangeType =
      scoreChangePct > 12 ? 'growing' :
      scoreChangePct < -12 ? 'declining' : 'stable';

    const cognitionShift = getDisplayCognitionKey(cepA) !== getDisplayCognitionKey(cepB);

    matched.push({
      cepA, cepB,
      matchScore: score,
      scoreChange, scoreChangePct, changeType,
      cognitionShift,
      matchDetail: detail,
    });
  }

  const emerging    = cepsB.filter(c => !usedBIds.has(c.id));
  const disappeared = cepsA.filter(c => !usedAIds.has(c.id));

  return { matched, emerging, disappeared };
}

// ── Builder ────────────────────────────────────────────────────────────────

export function buildTemporalComparison(
  snapshotA: TemporalSnapshot,
  snapshotB: TemporalSnapshot,
): TemporalComparison {
  const { matched, emerging, disappeared } = matchCEPs(snapshotA.ceps, snapshotB.ceps);
  return { snapshotA, snapshotB, matched, emerging, disappeared };
}

export function getPeriodLabel(period: AnalysisPeriod): string {
  return ANALYSIS_PERIOD_OPTIONS.find(p => p.value === period)?.label || period;
}
