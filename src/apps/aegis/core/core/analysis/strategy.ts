
import { Context, StrategyType, StrategyAction } from '../context';

const cognitionWeightMap = {
  informational: 0.4,
  exploratory:   0.6,
  commercial:    0.8,
  transactional: 1.0,
};

/**
 * 5 Strategy 분류.
 * brandShare는 경쟁 강도 정규화가 완료된 값(brandShareEngine에서 처리).
 * ownershipGap을 normalizedStrength 기반으로 계산하여 1:1 vs 1:n 공정 비교.
 */
export function classifyStrategy(cep: Context): StrategyType {
  const cognitionKeyStr = cep.hybridCognition || cep.cognition || 'informational';
  const cognitionKey = (
    Object.keys(cognitionWeightMap).includes(cognitionKeyStr)
      ? cognitionKeyStr
      : 'informational'
  ) as keyof typeof cognitionWeightMap;

  const cognitionWeight = cognitionWeightMap[cognitionKey] ?? 0.5;

  // 경쟁사 수 보정 ownershipGap (brandShareEngine에서 정규화된 brandShare 활용)
  const brandShare       = cep.brandShare ?? 0;
  const numCompetitors   = cep.numCompetitorsTracked ?? 0;
  const numBrands        = numCompetitors + 1;
  const expectedShare    = 1 / numBrands;
  const relativeStrength = brandShare / (expectedShare || 1);
  // 0~1 정규화: relativeStrength 2.0 이상 = 완전 지배(1.0)
  const normalizedStrength = Math.min(1, Math.max(0, relativeStrength / 2));
  const ownershipGap       = 1 - normalizedStrength;

  // 개별 경쟁사 평균 점유율 (분산 경쟁 보정)
  const competitorShare    = cep.competitorShare ?? 0;
  const avgCompShare       = numCompetitors > 0 ? competitorShare / numCompetitors : competitorShare;
  const competitiveHeat    = avgCompShare * Math.sqrt(Math.max(1, numCompetitors));

  // 1. Defensive Hold
  if (cognitionWeight >= 0.7 && ownershipGap < 0.4) return 'defensive';

  // 2. Offensive Expansion
  if (cognitionWeight >= 0.7 && ownershipGap >= 0.6) return 'offensive';

  // 3. Niche Capture — 경쟁 낮은 Blue Ocean
  if (cognitionWeight <= 0.6 && competitiveHeat <= 0.15 && ownershipGap >= 0.5) return 'niche_capture';

  // 4. Brand Build
  if (cognitionWeight < 0.7 && ownershipGap >= 0.6) return 'brand_build';

  // 5. Monitor (fallback)
  return 'monitor';
}

/**
 * 전략 유형별 실행 방향 생성 (한국어).
 * Context.actionPlan에 저장되어 ContextModal Col 3에 표시됨.
 */
export function generateStrategyAction(
  strategyType: string,
  cep?: Context,
): StrategyAction {
  switch (strategyType) {

    case 'offensive':
      return {
        primaryGoal: '시장 점유율 공략 — 전환 의도 키워드 선점',
        contentFocus: [
          '경쟁사 비교 랜딩페이지 + AEO FAQ 강화',
          '구매 의도(Transactional) 타겟 전환형 콘텐츠',
          'USP 기반 케이스 스터디·리뷰 콘텐츠',
        ],
        channelPriority: [
          'SEO Hub — 고의도 키워드 Top 3 진입',
          '검색광고 — 경쟁사 브랜드 키워드 비딩',
          '쇼핑광고 + CRO 강화 랜딩페이지',
        ],
        kpi: ['SEO Top 3 진입율', '전환율(CVR)', '경쟁사 점유율 대비 성장'],
      };

    case 'defensive':
      return {
        primaryGoal: '핵심 영역 수성 — AI 검색 브랜드 권위 방어',
        contentFocus: [
          'GEO 엔티티 권위글 — AI 검색 인용 방어선',
          '상위 콘텐츠 최신성(Freshness) 주기적 업데이트',
          '고객 성공 사례·리뷰로 신뢰도 방어',
        ],
        channelPriority: [
          'Owned Hub — SEO + GEO 복합 최적화',
          '브랜드 키워드 검색광고 방어',
          'Earned PR — 언론·인플루언서 브랜드 인용 확보',
        ],
        kpi: ['랭킹 안정성', '브랜드 CTR', '재구매율 · 고객 유지율'],
      };

    case 'niche_capture': {
      const isDominance = cep && (
        cep.marketSignal.priorityScore >= 60 ||
        cep.marketSignal.trendDirection === 'UP'
      );

      if (isDominance) {
        return {
          primaryGoal: '선점 모드 — 경쟁사 진입 전 카테고리 리더십 확보',
          contentFocus: [
            'SEO Hub + 광고 동시 집행 (Aggressive)',
            '멀티포맷 콘텐츠 확장 (영상·블로그·인포그래픽)',
            '경쟁사 진입 전 방어선 콘텐츠 대량 발행',
          ],
          channelPriority: [
            'SEO + 검색광고 동시 (SERP 독점)',
            '유튜브 카테고리 대표 콘텐츠',
            '커뮤니티 시딩 (대규모)',
          ],
          kpi: ['카테고리 점유율', 'SERP 1페이지 포화도', '초기 리타게팅 풀 확보'],
        };
      }

      return {
        primaryGoal: '검증 모드 — 시장 반응 확인 후 확대 여부 결정',
        contentFocus: [
          'AEO FAQ — 카테고리 최초 정의 및 질문 선점',
          '1~2개 핵심 허브 콘텐츠 테스트',
          '롱테일 키워드 Spoke 구조 초기 구축',
        ],
        channelPriority: [
          'SEO 유기 테스트 (최소 리스크)',
          '디스플레이 광고 (소액 반응 확인)',
          '소셜 커뮤니티 (초기 여론 형성)',
        ],
        kpi: ['CTR (클릭률)', '초기 전환율 검증', '체류 시간(Engagement)'],
      };
    }

    case 'brand_build':
      return {
        primaryGoal: '브랜드 인지 자산 구축 — 장기 AI 검색 권위 확립',
        contentFocus: [
          'GEO 엔티티 콘텐츠 — AI 검색 브랜드 권위 기반',
          'Thought Leadership 트렌드 리포트·인사이트',
          '인플루언서 브리프 — 탐색 단계 브랜드 노출',
        ],
        channelPriority: [
          'Owned Hub — GEO + AEO 복합 최적화',
          'Earned — PR·인플루언서 브랜드 인용 확산',
          '잠재 고객 리타게팅 풀 사전 확보',
        ],
        kpi: ['유기 트래픽 성장', '브랜드 검색량', '신규 방문자 비율'],
      };

    default:
      return {
        primaryGoal: '수요 모니터링 — 최소 대응 유지',
        contentFocus: [
          'Spoke FAQ 최소 콘텐츠 유지',
          'Temporal 비교 분석으로 트렌드 감지',
          'Priority Score 급등 시 전략 방향 재분류',
        ],
        channelPriority: ['SEO 유기 유지 (최소 리소스)', 'Temporal 주기 분석'],
        kpi: ['트래픽 트렌드', 'Priority Score 변화율'],
      };
  }
}
