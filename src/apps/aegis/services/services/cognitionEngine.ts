
import { Context, CognitionVector, CognitionKey } from '../core/context';

export interface CognitionInput {
  rawCognition: string;
  keywords: string[];
  // Expanded to support both legacy object and new array
  serpFeatures?: {
    hasShopping?: boolean;
    adCount?: number;
  } | string[]; 
  brandName?: string;
  competitors?: string[];
}

export function getCognitionWeight(cognition: CognitionKey): number {
  switch (cognition) {
    case "transactional":
      return 1.0;
    case "commercial":
      return 0.85;
    case "exploratory":
      return 0.6;
    case "informational":
      return 0.4;
    default:
      return 0.4;
  }
}

export function getDominantCognitionFromVector(cognition: CognitionVector): CognitionKey {
  if (!cognition) return 'informational';
  
  let max = -1;
  let dominant: CognitionKey = 'informational';
  
  const entries = Object.entries(cognition) as [CognitionKey, number][];
  if (entries.length === 0) return 'informational';
  
  for (const [key, value] of entries) {
      if (value > max) {
          max = value;
          dominant = key;
      }
  }
  return dominant;
}

export function calculateClusterCognitionWeight(ceps: Context[]): number {
  if (!ceps || ceps.length === 0) return 0;
  
  const weights = ceps.map(c => {
    // Use resolved cognition if available (which includes brand logic), otherwise derive from vector
    const cognition = (c.hybridCognition || c.cognition || getDominantCognitionFromVector(c.journey.cognitionVector)) as CognitionKey;
    return getCognitionWeight(cognition);
  });
  
  const total = weights.reduce((sum, w) => sum + w, 0);
  return Number((total / weights.length).toFixed(2));
}

export function resolveCognition(input: CognitionInput): CognitionKey {
  const scores: Record<CognitionKey, number> = {
    informational: 0,
    exploratory: 0,
    commercial: 0,
    transactional: 0
  };

  const text = input.keywords.join(" ").toLowerCase();

  // 1️⃣ Gemini 기본값
  const baseCognition = mapRawCognition(input.rawCognition);
  scores[baseCognition] += 2;

  // 2️⃣ 키워드 기반 보정
  if (containsAny(text, ["구매", "가격", "주문", "예약", "결제", "신청"])) {
    scores.transactional += 3;
  }

  if (containsAny(text, ["비교", "추천", "리뷰", "후기", "vs", "순위"])) {
    scores.commercial += 2;
  }

  if (containsAny(text, ["종류", "방법", "가이드", "정리", "개념"])) {
    scores.exploratory += 1.5;
  }

  // 3️⃣ SERP Feature 보정 (Handles both Object and Array)
  let hasShopping = false;
  let hasAds = false;

  if (Array.isArray(input.serpFeatures)) {
      // String[] case
      hasShopping = input.serpFeatures.some(s => s.toLowerCase().includes('shopping'));
      hasAds = input.serpFeatures.some(s => s.toLowerCase().includes('ads'));
  } else if (input.serpFeatures) {
      // Object case
      hasShopping = !!input.serpFeatures.hasShopping;
      hasAds = !!(input.serpFeatures.adCount && input.serpFeatures.adCount >= 1);
  }

  if (hasShopping) {
    scores.transactional += 2;
  }

  if (hasAds) {
    scores.commercial += 1.5;
    scores.transactional += 1;
  }

  // 4️⃣ 브랜드명 포함 보정
  if (input.brandName) {
    const brand = input.brandName.trim().toLowerCase();
    if (brand && text.includes(brand)) {
      scores.exploratory += 1;
      scores.transactional += 1;
    }
  }

  // 5️⃣ 경쟁사 포함 보정 (상업적 비교 의도)
  if (input.competitors && input.competitors.length > 0) {
    const hasCompetitor = input.competitors.some(comp => {
        const c = comp.trim().toLowerCase();
        return c && text.includes(c);
    });
    if (hasCompetitor) {
        scores.commercial += 2; // Strong signal for comparison
    }
  }

  return getMaxScoreCognition(scores);
}

function mapRawCognition(raw: string): CognitionKey {
  if (!raw) return "informational";
  if (raw.includes("전환성")) return "transactional";
  if (raw.includes("상업성")) return "commercial";
  if (raw.includes("탐색성")) return "exploratory";
  // Added english fallback for robustness
  if (raw.toLowerCase().includes("transactional")) return "transactional";
  if (raw.toLowerCase().includes("commercial")) return "commercial";
  if (raw.toLowerCase().includes("exploratory")) return "exploratory";
  return "informational";
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some(term => text.includes(term.toLowerCase()));
}

function getMaxScoreCognition(scores: Record<CognitionKey, number>): CognitionKey {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0][0] as CognitionKey;
}
