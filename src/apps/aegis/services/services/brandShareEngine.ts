
import { Context } from "../core/context";

const cognitionWeightMap = {
  informational: 0.4,
  exploratory:   0.6,
  commercial:    0.8,
  transactional: 1.0,
};

/**
 * 브랜드 점유율 계산 및 전략 Priority Score 산출.
 *
 * 경쟁 강도 정규화 원칙:
 * - brandShare: 추적 브랜드 전체 언급 중 자사 비중 (Share of Voice)
 * - normalizedStrength: 경쟁사 수를 고려한 상대적 강도
 *   - 1:1 (나=43%, 경쟁사=57%)와 1:5 (나=23%, 각=15%) 시나리오에서
 *     동일 경쟁 강도를 공정하게 평가하기 위해
 *     "expected equal share(1/(n+1)) 대비 내 share" 비율을 사용
 * - competitivePressure: 개별 경쟁사 평균 점유율 × √경쟁사수 (비선형 스케일링)
 */
export function calculateBrandMetrics(
  cep: Context,
  myBrand: string,
  competitors: string[]
): Context {
  const presence = cep.brandPresence || [];
  const totalMentions = presence.reduce((sum, b) => sum + b.count, 0) || 1;

  // ── 1. 기본 Share 계산 ──────────────────────────────────────────────────
  const myCount = presence.find(b =>
    b.brand.toLowerCase() === myBrand.toLowerCase()
  )?.count ?? 0;

  const competitorTotalCount = presence
    .filter(b => competitors.map(c => c.toLowerCase()).includes(b.brand.toLowerCase()))
    .reduce((sum, b) => sum + b.count, 0);

  const brandShare        = Number((myCount / totalMentions).toFixed(3));
  const competitorShare   = Number((competitorTotalCount / totalMentions).toFixed(3));
  const competitiveDensity = competitorShare;
  const numCompetitors    = competitors.length;

  // ── 2. 경쟁 강도 정규화 ─────────────────────────────────────────────────
  // 공정 비교: 경쟁사 수가 달라도 실질 경쟁력 수준이 동일하면 동일한 값 출력
  //
  // normalizedStrength = (내 share / 동등 분배 기준) / 2
  //   - 동등 분배 기준 = 1 / (경쟁사수 + 1)
  //   - /2 → 내 share가 2배 이상이면 1.0 (완전 지배)으로 cap
  const numBrands        = numCompetitors + 1;
  const expectedEqualShare = 1 / numBrands;
  const relativeStrength   = brandShare / (expectedEqualShare || 1);
  const normalizedStrength = Math.min(1, Math.max(0, relativeStrength / 2));
  const ownershipGap       = 1 - normalizedStrength;  // 전략 분류에 사용

  // ── 3. 경쟁 압력 정규화 (Priority Score용) ───────────────────────────────
  // 개별 경쟁사 평균 점유율 × √경쟁사수:
  //   - 경쟁사 1명 20%: 압력 = 20% × 1.0 = 20%
  //   - 경쟁사 5명 각 4%: 압력 = 4% × 2.24 = 8.9%  (분산된 경쟁은 부담이 낮음)
  const avgCompetitorIndividualShare = numCompetitors > 0
    ? competitorShare / numCompetitors
    : 0;
  const normalizedCompetitivePressure =
    avgCompetitorIndividualShare * Math.sqrt(Math.max(1, numCompetitors));

  // ── 4. Priority Score ──────────────────────────────────────────────────
  const cognitionKey = (cep.hybridCognition || cep.cognition || 'informational') as keyof typeof cognitionWeightMap;
  const cognitionWeight = cognitionWeightMap[cognitionKey] ?? 0.4;

  // 정규화된 ownershipGap을 사용 (경쟁사 수 중립적)
  const rawPriority = cognitionWeight * ownershipGap * (1 + normalizedCompetitivePressure);
  const finalPriority = Math.min(100, Math.max(10, Math.round(rawPriority * 50)));

  return {
    ...cep,
    brandShare,
    competitorShare,
    competitiveDensity,
    numCompetitorsTracked: numCompetitors,
    marketSignal: {
      ...cep.marketSignal,
      priorityScore: finalPriority,
    },
  };
}
