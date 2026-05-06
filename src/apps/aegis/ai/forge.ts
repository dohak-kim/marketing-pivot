
// ── AEGIS FORGE — C³-Driven Content Generation Engine ────────────────────

import { GoogleGenAI } from '@google/genai';
import { Context, StrategyType, CognitionKey } from '../core/context';
import {
  ForgeConfig, ForgeOutput, ContentQualityScore, ForgeRecommendation,
  MediaType, ContentSubType, ToneAndManner,
} from '../core/types/contentGeneration';

async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch (error: any) {
      if (i === retries - 1) throw error;
      const s = error?.status || error?.code;
      const retryable = s === 500 || s === 503 || s === 429 || (error?.message || '').includes('Internal error');
      if (!retryable) throw error;
      await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

// ── C³ → Recommendation mapping ──────────────────────────────────────────

const STRATEGY_LABEL: Record<StrategyType, string> = {
  offensive:    '공격 (Offensive) — 시장 점유 확대',
  defensive:    '방어 (Defensive) — 브랜드 권위 강화',
  niche_capture:'신규 진입 (Niche) — 틈새 시장 개척',
  brand_build:  '브랜드 빌드 — 인지도·신뢰 구축',
  monitor:      '관찰 (Monitor) — 수요 모니터링',
};

const COGNITION_KO: Record<CognitionKey, string> = {
  informational: 'Informational (콘텐츠 제작)',
  exploratory:   'Exploratory (비교·가이드)',
  commercial:    'Commercial (USP·메시지)',
  transactional: 'Transactional (전환·오퍼)',
};

export function getDominantCognitionKey(context: Context): CognitionKey {
  const vec = context.journey?.cognitionVector as Record<string, number> | undefined;
  if (!vec) return (context.cognition as CognitionKey) || 'informational';
  const entries = Object.entries(vec);
  if (!entries.length) return 'informational';
  return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0] as CognitionKey;
}

export function getForgeRecommendation(
  context: Context,
  strategyType?: StrategyType,
): ForgeRecommendation {
  const cog = getDominantCognitionKey(context);
  const st = strategyType || (context as any).strategyType || 'brand_build';

  type Map = Partial<Record<StrategyType, { m: MediaType; s: ContentSubType; t: ToneAndManner; len: 300|600|1000|2000|3000; aeo: boolean; geo: boolean; reason: string }>>;
  const matrix: Record<CognitionKey, Map> = {
    informational: {
      offensive:    { m:'owned_hub',  s:'seo_longform',   t:'expert',        len:2000, aeo:true,  geo:false, reason:'검색 우위 확보를 위한 권위 허브 콘텐츠' },
      defensive:    { m:'owned_hub',  s:'geo_entity',     t:'authoritative', len:2000, aeo:true,  geo:true,  reason:'AI 검색 인용 최적화로 브랜드 권위 방어' },
      niche_capture:{ m:'owned_hub',  s:'aeo_faq',        t:'expert',        len:1000, aeo:true,  geo:true,  reason:'카테고리 대표 Q&A로 새로운 검색 수요 선점' },
      brand_build:  { m:'owned_hub',  s:'seo_longform',   t:'authoritative', len:2000, aeo:true,  geo:true,  reason:'정보성 허브로 브랜드 신뢰 기반 구축' },
      monitor:      { m:'owned_spoke',s:'faq_expansion',  t:'casual',        len:600,  aeo:true,  geo:false, reason:'수요 관찰 중 FAQ 지원 콘텐츠 최소 운영' },
    },
    exploratory: {
      offensive:    { m:'owned_spoke',s:'support_article', t:'expert',       len:1000, aeo:false, geo:false, reason:'비교 탐색 단계에서 Spoke로 롱테일 장악' },
      defensive:    { m:'earned',    s:'press_release',   t:'authoritative', len:1000, aeo:false, geo:false, reason:'PR로 브랜드 신뢰도 방어' },
      niche_capture:{ m:'owned_hub', s:'aeo_faq',         t:'casual',        len:1000, aeo:true,  geo:false, reason:'탐색 쿼리의 FAQ 선점으로 틈새 진입' },
      brand_build:  { m:'earned',    s:'influencer_brief',t:'emotional',     len:600,  aeo:false, geo:false, reason:'인플루언서로 탐색 단계 브랜드 노출 확대' },
      monitor:      { m:'owned_spoke',s:'case_study',     t:'casual',        len:600,  aeo:false, geo:false, reason:'케이스 스터디로 탐색 수요 대응' },
    },
    commercial: {
      offensive:    { m:'paid',      s:'search_ad',       t:'authoritative', len:300,  aeo:false, geo:false, reason:'상업적 의도 쿼리 퍼포먼스 광고 선점' },
      defensive:    { m:'owned_spoke',s:'case_study',     t:'expert',        len:1000, aeo:false, geo:false, reason:'케이스 스터디로 경쟁사 대비 신뢰 방어' },
      niche_capture:{ m:'paid',      s:'social_ad',       t:'emotional',     len:300,  aeo:false, geo:false, reason:'소셜 광고로 새로운 상업 수요 포착' },
      brand_build:  { m:'owned_hub', s:'geo_entity',      t:'authoritative', len:2000, aeo:true,  geo:true,  reason:'USP 엔티티 콘텐츠로 AI 검색 내 브랜드 권위 구축' },
      monitor:      { m:'owned_spoke',s:'faq_expansion',  t:'casual',        len:600,  aeo:false, geo:false, reason:'상업 수요 관찰 중 FAQ 최소 대응' },
    },
    transactional: {
      offensive:    { m:'paid',      s:'landing_copy',    t:'authoritative', len:600,  aeo:false, geo:false, reason:'전환 의도 극대화 랜딩페이지 카피' },
      defensive:    { m:'paid',      s:'search_ad',       t:'expert',        len:300,  aeo:false, geo:false, reason:'전환 쿼리 검색광고로 경쟁사 방어' },
      niche_capture:{ m:'paid',      s:'social_ad',       t:'emotional',     len:300,  aeo:false, geo:false, reason:'틈새 전환 수요 소셜 광고 선점' },
      brand_build:  { m:'earned',    s:'community_post',  t:'emotional',     len:600,  aeo:false, geo:false, reason:'커뮤니티 자연 게시로 구매 전환 신뢰 형성' },
      monitor:      { m:'owned_spoke',s:'support_article',t:'casual',        len:300,  aeo:false, geo:false, reason:'전환 수요 관찰 중 최소 지원 콘텐츠 유지' },
    },
  };

  const rec = matrix[cog]?.[st] || matrix[cog]?.brand_build || {
    m:'owned_hub' as MediaType, s:'seo_longform' as ContentSubType,
    t:'expert' as ToneAndManner, len:1000 as any, aeo:true, geo:false,
    reason:'C³ 기본 권고: 허브 콘텐츠로 SEO 기반 구축',
  };

  return {
    mediaType: rec.m,
    subType: rec.s,
    tone: rec.t,
    targetLength: rec.len,
    optimization: { seo: true, aeo: rec.aeo, geo: rec.geo },
    rationale: rec.reason,
  };
}

// ── Prompt builders ───────────────────────────────────────────────────────

function buildBaseContext(context: Context, strategyType: StrategyType | undefined, brandName?: string): string {
  const cog = getDominantCognitionKey(context);
  const vec = context.journey?.cognitionVector as Record<string, number> | undefined;
  const vecStr = vec
    ? Object.entries(vec).map(([k, v]) => `${COGNITION_KO[k as CognitionKey] || k}: ${Math.round(v * 100)}%`).join(' / ')
    : '';
  const st = strategyType || (context as any).strategyType || 'brand_build';

  return `
[C³ 전략 인텔리전스]
- Context 클러스터: ${context.marketSignal?.clusterName || context.situation}
- 검색 의도 상황: ${context.situation}
- 전환 단계: ${context.journey?.conversionStage || '-'}
- 지배 인지: ${COGNITION_KO[cog]}
${vecStr ? `- 인지 벡터: ${vecStr}` : ''}
- 전략 방향: ${STRATEGY_LABEL[st] || st}
${brandName ? `- 브랜드: ${brandName}` : ''}
- Priority Score: ${context.marketSignal?.priorityScore || '-'}점
`.trim();
}

// ── Media-tier-aware SEO layer ────────────────────────────────────────────

function buildSEOLayer(subType: ContentSubType, mediaType: MediaType = 'owned_hub'): string {
  const isPaid = mediaType === 'paid';
  const isEarned = mediaType === 'earned';
  const isHub = subType === 'seo_longform' || subType === 'geo_entity' || subType === 'aeo_faq';

  if (isPaid) {
    // 광고 카피에는 H1/H2, meta_description 지시 불필요 — 클릭률·품질점수 최적화만
    return `[SEO 신호 — 광고 품질점수 최적화]
- 광고 헤드라인 첫 단어에 타겟 키워드 포함 (클릭률↑)
- 사용자 의도와 정확히 일치하는 메시지 (Quality Score↑)
- 랜딩페이지와 광고 메시지 일관성 유지 (Page Experience↑)`.trim();
  }

  if (isEarned) {
    // Earned 채널: 백링크·브랜드 언급이 핵심 — 내부링크 불필요
    return `[SEO 신호 — Earned 채널 백링크·멘션]
- 브랜드명과 핵심 제품명을 자연스럽게 본문에 포함 (Unlinked Mention 축적)
- 출처로 링크 가능한 구체적 수치·사실 삽입 (Backlink 유도)
- 산업 키워드와 브랜드명 동시 등장 → 검색엔진 연관성 강화`.trim();
  }

  // Owned Hub
  return `[SEO 최적화 — Owned Hub 필수 레이어]
- 모든 콘텐츠는 검색 엔진 인덱싱을 기본 전제로 작성
${isHub ? '- H1/H2/H3 마크다운 계층 구조 사용 (H1 1개, H2 3~5개, H3 필요시)' : '- 소제목 구조로 가독성 확보'}
- 핵심 키워드를 첫 단락과 소제목에 자연스럽게 배치
- 관련 Hub 콘텐츠 내부 링크 제안: [[Hub: 관련주제]] 앵커 형식
- meta_description 필드: 검색 결과 노출용 요약 (120자 이내)`.trim();
}

// ── AEO layers — Hub vs Earned(PAA Seeding) vs Paid(Landing) ─────────────────

/** Hub 전용 AEO: Featured Snippet 선점 + FAQ JSON-LD 스키마 */
function buildHubAEOLayer(): string {
  return `[AEO 최적화 — Hub Featured Snippet & FAQ Schema]
- 역피라미드: 첫 단락에 핵심 질문 직접 답변 (50자 이내, Featured Snippet 타겟)
- FAQ 섹션: 실제 검색 질문형 ("~는 무엇인가요?", "~하려면?", "~차이는?") 5~7쌍
- 각 FAQ 답변: 완전한 문장으로 시작, 40~80자 간결 답변 → 확장 설명 최대 100자
- PAA(People Also Ask) 형식 연관 질문 3개 별도 제안
- 글 말미에 아래 JSON-LD 스키마 구조를 주석으로 제시 (개발팀 삽입용):
  /*
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Q1 텍스트",
        "acceptedAnswer": { "@type": "Answer", "text": "A1 텍스트" } }
    ] }
  </script>
  */`.trim();
}

/** Earned · community_post 전용 AEO: PAA 시딩 — 커뮤니티에 질문 선점 */
function buildEarnedAEOLayer(): string {
  return `[AEO 최적화 — Earned PAA 시딩 (커뮤니티 Q&A 선점)]
- 포스트 내부에 실제 검색에서 나올 법한 질문 2~3개를 자연스럽게 삽입
  예) "많이들 물어보시는데, ~가 궁금하시죠?" → 바로 답변 제공
- 답변은 "~이다/~입니다" 완전한 문장으로 (AI가 직접 인용 가능한 형태)
- 글 말미에 "더 궁금한 점이 있으시면 댓글로" → 추가 Q&A 유도 (PAA 다양성↑)
- 비교 질문 포함 권장: "A vs B, 어떤 게 나을까?" 형식`.trim();
}

/** Paid · landing_copy 전용 AEO: 랜딩 페이지 AEO 구조 */
function buildPaidAEOLayer(): string {
  return `[AEO 최적화 — 랜딩 페이지 직접 답변 구조]
- 히어로 섹션 직하단에 "이 제품/서비스가 ~인가요?" 핵심 의심 질문 → 50자 이내 즉답
- 비교표 섹션: 자사 vs 대안 2~3개의 핵심 기능 비교 (AI가 비교 인용 가능한 구조)
- FAQ 3~5쌍: 전환 직전 구매 장벽 제거형 질문 ("환불 가능한가요?", "설치 없이 사용 가능?")
- 각 답변 완전 문장, 40~60자 직접 답변 형식 (Featured Snippet 타겟)`.trim();
}

// ── GEO layers — Hub vs Earned(Citation Signal) ───────────────────────────────

/** Hub 전용 GEO: Owned 자산의 AI 인용 최적화 */
function buildHubGEOLayer(brandName?: string): string {
  return `[GEO 최적화 — Owned Hub AI 인용 최적화]
- 핵심 엔티티 명시: ${brandName ? `'${brandName}'` : '브랜드명'}, 제품명, 카테고리명을 반복 명확히 표기
- 인용 가능 정의: "A는 B이다" / "A를 B라고 한다" 형식의 명확한 사실 진술 3개 이상
- 수치·통계: 구체적 숫자, 비율, 비교 수치 필수 포함 (없으면 업계 평균 수치 추정)
- 권위적 서술: 주관적 표현 대신 객관적·사실 기반 어조 일관성
- 비교 포지셔닝: "경쟁사 대비 ~% 우위" 등 카테고리 내 포지션 명확화
- 저자 전문성(E-E-A-T): 직책·경력 언급 가능 시 포함`.trim();
}

/** Earned 전용 GEO: 외부 채널에서 브랜드 Citation Signal 생성 */
function buildEarnedGEOLayer(brandName?: string, subType?: ContentSubType): string {
  const brand = brandName ? `'${brandName}'` : '브랜드명';
  const isInfluencer = subType === 'influencer_brief';
  return `[GEO 최적화 — Earned 채널 브랜드 Citation Signal]
- 브랜드·엔티티 동시 노출(Co-occurrence): ${brand}과 핵심 기술 키워드를 같은 문단 내 반드시 포함
  (예: "${brand ? brand.replace(/'/g,'') : '브랜드'}의 [기술명]은 [정의]입니다" — AI가 연관 학습)
- 인용 가능 핵심 문구 삽입: 쌍따옴표로 감싼 브랜드 대표자 or 공식 발언 형식 1~2개
  (예: "우리는 [가치 제안]을 믿습니다" — AI 검색 시 인용 출처로 등장)
${isInfluencer
  ? `- 인플루언서 필수 포함 기술 문구(Must-Use Phrases) 섹션 별도 작성:
  → AI가 해당 카테고리 검색 시 인용할 핵심 정의 2~3문장
  → 예) "[브랜드]는 [카테고리]에서 [차별점]으로 알려진 솔루션이다"`
  : `- 보도자료 말미에 "About [브랜드]" 단락 필수: 정의형 문장 + 수치 + 웹사이트 URL`}
- 수치·통계 반드시 포함: AI 모델은 수치가 있는 문장을 인용 신뢰도 높게 평가`.trim();
}

// ── Legacy alias for backward compatibility ───────────────────────────────────
/** @deprecated Use buildHubGEOLayer instead */
function buildGEOLayer(brandName?: string): string {
  return buildHubGEOLayer(brandName);
}

/** @deprecated Use buildHubAEOLayer instead */
function buildAEOLayer(): string {
  return buildHubAEOLayer();
}

function buildToneInstruction(tone: ToneAndManner): string {
  const map: Record<ToneAndManner, string> = {
    expert:        '전문적 어조: 데이터·수치·전문 용어 활용, 신뢰 기반 설득',
    authoritative: '권위적 어조: 확신 있는 서술, 브랜드 리더십 강조, 단정적 문장',
    casual:        '친근한 어조: 대화체, 공감 표현, 독자와 동등한 눈높이, 이모지 최소 사용',
    emotional:     '감성적 어조: 감정 자극, 스토리텔링, 독자의 욕구·불안·희망 건드리기',
  };
  return `[톤앤매너]\n${map[tone]}`;
}

function buildMediaTypeInstruction(config: ForgeConfig, context: Context): string {
  const { mediaType, subType, targetLength } = config;
  const clusterName = context.marketSignal?.clusterName || context.situation;

  const instructions: Partial<Record<ContentSubType, string>> = {
    seo_longform: `
[Owned Hub — SEO 롱폼 아티클] (목표: ${targetLength}자)
목적: '${clusterName}' 주제의 카테고리 대표 허브 페이지
구조:
1. H1: 핵심 키워드 포함 제목 (40자 이내)
2. 리드 단락: 독자 공감 + 핵심 가치 제시 (100자)
3. H2 섹션 3~5개: 각 섹션 200~400자, 실용적 정보 중심
4. 결론: 행동 유도 + Spoke 콘텐츠 연결 제안
5. meta_description 별도 제공 (120자)
`.trim(),

    aeo_faq: `
[Owned Hub — AEO FAQ 가이드] (목표: ${targetLength}자)
목적: AI 검색·Featured Snippet 직접 답변 선점
구조:
1. 인트로: 핵심 질문 직접 답변 (50자)
2. FAQ 7~10쌍: Q는 실제 검색 질문형, A는 40~80자 직접 답변
3. 연관 질문 3개 추가 제안 (PAA 시뮬레이션)
4. 결론: 브랜드 자연 연결
`.trim(),

    geo_entity: `
[Owned Hub — GEO 엔티티 권위글] (목표: ${targetLength}자)
목적: ChatGPT·Gemini·Perplexity 등 생성형 AI 인용 최적화
구조:
1. 엔티티 정의 단락: "[주제]는 [정의]이다" 형식 (60자)
2. 핵심 사실 5개: 수치/비교/통계 기반
3. 카테고리 포지셔닝: 시장 내 위치 권위 서술
4. 브랜드 연결: 해당 엔티티에서 브랜드의 역할
5. 결론: 인용 가능한 명확한 마무리 문장
`.trim(),

    support_article: `
[Owned Spoke — 지원 아티클] (목표: ${targetLength}자)
목적: Hub 보완, 롱테일 키워드 타겟
구조:
1. 제목: 롱테일 키워드 포함 (45자)
2. 본문: Hub 콘텐츠의 특정 하위 주제 심화
3. Hub 연결: [[Hub: ${clusterName}]] 앵커 포함
4. CTA: 다음 단계 유도
`.trim(),

    faq_expansion: `
[Owned Spoke — FAQ 확장글] (목표: ${targetLength}자)
목적: 특정 질문의 심화 답변
구조:
1. 핵심 질문 명확화
2. 단계별 상세 답변
3. 관련 예시·사례
4. Hub 링크 연결
`.trim(),

    case_study: `
[Owned Spoke — 케이스 스터디] (목표: ${targetLength}자)
목적: 실증 사례로 신뢰 구축
구조:
1. 문제 상황 설정
2. 솔루션 접근
3. 결과 (수치 포함)
4. 시사점 + 브랜드 자연 연결
`.trim(),

    press_release: `
[Earned — 보도자료] (목표: ${targetLength}자)
목적: 언론·블로거 보도 유도
구조 (역삼각형):
1. 헤드라인: 뉴스 가치 제목 (60자)
2. 부제목 (35자)
3. 리드: 5W1H 요약 (120자)
4. 본문: 상세 내용 + 브랜드 대표자 인용문
5. 보일러플레이트: 회사/브랜드 소개 (80자)
6. 배포 문의 연락처 (placeholder)
`.trim(),

    influencer_brief: `
[Earned — 인플루언서 협업 브리프]
목적: 크리에이터 협업 가이드
구성:
1. 캠페인 배경 및 목표 (100자)
2. 핵심 메시지 3가지 (각 30자)
3. Must Have (필수 포함 요소) 4가지
4. Do Not (금지 사항) 3가지
5. 채널별 가이드: 인스타그램 / 유튜브 / 블로그 각각
6. 권장 해시태그 10개
7. 보상 조건 (placeholder)
`.trim(),

    community_post: `
[Earned — 커뮤니티 게시물] (목표: ${targetLength}자)
목적: 네이버 카페·블로그·커뮤니티 자연 게시
구조:
1. 공감 후킹 첫 문장 (35자)
2. 개인 경험 스토리 (200자)
3. 핵심 정보·팁 (100자)
4. 자연스러운 브랜드 언급
5. 커뮤니티 반응 유도 질문으로 마무리
주의: 광고성 느낌 없이 자연스럽게 작성
`.trim(),

    search_ad: `
[Paid — 검색광고 소재] (Google/Naver RSA 형식)
헤드라인 3종 (각 15자 이내):
- 헤드라인A: 혜택 중심 (Benefit)
- 헤드라인B: 호기심·문제 해결 (Curiosity)
- 헤드라인C: 긴급성·희소성 (Urgency)
설명문 2종 (각 45자 이내):
- 설명A: 핵심 USP + 행동 유도
- 설명B: 사회적 증거 + CTA
디스플레이 URL 경로 2개
사이트링크 확장 소재 4개 (제목 15자/설명 25자)
콜아웃 확장 소재 6개 (각 10자)
`.trim(),

    social_ad: `
[Paid — 소셜 광고 소재 3종 세트] (인스타그램·페이스북)
변형A — 감성 스토리텔링형:
  훅(15자) + 본문(80자) + CTA + 해시태그 5개
변형B — 혜택 직접 제시형:
  훅(15자) + 핵심혜택 3가지(bullet) + CTA + 해시태그 5개
변형C — 사회적 증거(후기) 활용형:
  훅(15자) + 가상 후기 2개 + CTA + 해시태그 5개
각 변형 구분선으로 명확히 분리
`.trim(),

    landing_copy: `
[Paid — 랜딩페이지 카피]
목적: 전환율 최적화 (CRO)
구조:
1. 히어로 헤드라인 (30자) + 서브헤드라인 (55자)
2. 핵심 혜택 3가지 (각 bullet, 30자)
3. 신뢰 지표: 고객 수 / 수상 / 인증 (placeholder 형식)
4. CTA 버튼 텍스트 3종 (각 10자 이내): 메인 / 보조 / 긴급
5. 보조 섹션: FAQ 3문항 (AEO 형식)
6. 구매 장벽 해소: 환불정책·보안·보증 (각 20자)
`.trim(),
  };

  return instructions[subType] || `[콘텐츠 구조]\n목표 분량: ${targetLength}자`;
}

// ── Client-side Quality Analysis ─────────────────────────────────────────
// JSON 스키마 없이 생성된 텍스트를 휴리스틱으로 평가.
// JSON 파싱 실패 위험 없이 안정적으로 동작.

function analyzeQuality(content: string, config: ForgeConfig): ContentQualityScore {
  const lines = content.split('\n');

  const hasH1 = lines.some(l => /^# /.test(l));
  const hasH2 = lines.some(l => /^## /.test(l));
  const hasHeadingStructure = hasH1 || hasH2;

  // 도입부 200자 내 주요 키워드 존재 여부 (단순 비공백 체크)
  const hasKeywordInIntro = content.slice(0, 200).replace(/\s/g, '').length > 50;

  // Q: / Q. / 물음표로 끝나는 줄 = FAQ
  const faqCount = lines.filter(l => /^Q[.:：]/i.test(l.trim()) || l.trim().endsWith('?')).length;

  // 첫 단락이 질문이 아닌 직접 서술 문장이면 직접 답변 존재
  const firstPara = lines.find(l => l.trim().length > 20 && !l.startsWith('#')) || '';
  const hasDirectAnswer = firstPara.length > 20 && !firstPara.trim().endsWith('?');

  // 엔티티: "[명사]는/이란/이다" 패턴
  const entityMatches = content.match(/[가-힣a-zA-Z]{2,}(?:은|는|이|가|란|이란|이다|입니다)/g) || [];
  const entityCount = Math.min(entityMatches.length, 10);

  // 인용 가능 정의 패턴
  const hasCitableDefinition = /이다\.|이란\s|이란 것|이라고 (한다|합니다)|정의|[0-9]+%/.test(content);

  // Paid 변형 카운트
  const headlineVariantCount = (content.match(/=== 변형[A-C]/g) || content.match(/변형[A-C][\s:：]/g) || []).length;

  // 분량 달성률
  const lengthRatio = Math.min(1, content.length / (config.targetLength * 1.8)); // 한글 1자 ≈ 1.8 byte

  // SEO 점수
  let seo = 30;
  if (hasHeadingStructure)  seo += 28;
  if (hasKeywordInIntro)    seo += 20;
  if (lengthRatio >= 0.6)   seo += 15;
  if (lengthRatio >= 0.9)   seo += 7;
  seo = Math.min(100, seo);

  // AEO 점수
  let aeo = 0;
  if (config.optimization.aeo) {
    aeo = 25;
    if (faqCount >= 3)        aeo += 25;
    if (faqCount >= 6)        aeo += 15;
    if (hasDirectAnswer)      aeo += 25;
    if (hasCitableDefinition) aeo += 10;
    aeo = Math.min(100, aeo);
  }

  // GEO 점수
  let geo = 0;
  if (config.optimization.geo) {
    geo = 20;
    if (entityCount >= 2)     geo += 20;
    if (entityCount >= 5)     geo += 15;
    if (hasCitableDefinition) geo += 30;
    if (/[0-9]+[%개명억만원]/.test(content)) geo += 15;
    geo = Math.min(100, geo);
  }

  const activeLayers = [seo, ...(config.optimization.aeo ? [aeo] : []), ...(config.optimization.geo ? [geo] : [])];
  const overall = Math.round(activeLayers.reduce((s, v) => s + v, 0) / activeLayers.length);

  return {
    seo, aeo, geo, overall,
    checklist: { hasHeadingStructure, hasKeywordInIntro, faqCount, hasDirectAnswer, entityCount, hasCitableDefinition, headlineVariantCount },
  };
}

// ── Paid variant parser ───────────────────────────────────────────────────

function parsePaidVariants(text: string): string[] {
  // "=== 변형A ===" 또는 "[변형A]" 등의 구분자로 파싱
  const splitter = /===\s*변형\s*[A-C]\s*===|【변형\s*[A-C]】|\[변형\s*[A-C]\]|---\s*변형\s*[A-C]\s*---|변형\s*[A-C]\s*[:\-─]/gi;
  const parts = text.split(splitter).map(p => p.trim()).filter(p => p.length > 20);
  if (parts.length >= 2) return parts.slice(0, 3);
  // 구분자 없으면 전체를 변형A로
  return [text];
}

// ── Main Generation Function ──────────────────────────────────────────────
// Plain text 방식: JSON 스키마 미사용 → 긴 한국어 콘텐츠 생성 안정성 확보

export async function generateForgeContent(
  context: Context,
  config: ForgeConfig,
  strategyType?: StrategyType,
  brandName?: string,
  executionPlan?: import('../core/context').ExecutionPlan,
): Promise<ForgeOutput> {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const baseCtx   = buildBaseContext(context, strategyType, brandName);
    const isPaid    = config.mediaType === 'paid' || ['search_ad', 'social_ad', 'landing_copy'].includes(config.subType);
    const isEarned  = config.mediaType === 'earned';

    // ── SEO layer: media-tier-aware ─────────────────────────────────────────
    const seoLayer = buildSEOLayer(config.subType, config.mediaType);

    // ── AEO layer: Hub vs Earned(PAA seeding) vs Paid(landing structure) ────
    let aeoLayer = '';
    if (config.optimization.aeo) {
      if (isEarned) {
        aeoLayer = buildEarnedAEOLayer();
      } else if (isPaid) {
        aeoLayer = buildPaidAEOLayer();
      } else {
        aeoLayer = buildHubAEOLayer();
      }
    }

    // ── GEO layer: Hub vs Earned(citation signal) ───────────────────────────
    let geoLayer = '';
    if (config.optimization.geo) {
      if (isEarned) {
        geoLayer = buildEarnedGEOLayer(brandName, config.subType);
      } else {
        geoLayer = buildHubGEOLayer(brandName);
      }
    }

    const toneInstr = buildToneInstruction(config.tone);
    const mediaInstr = buildMediaTypeInstruction(config, context);

    // 전략 브리프를 앵커로 삽입 — 창의성이 전략 방향을 벗어나지 않도록
    const strategyAnchor = executionPlan ? `
[전략 앵커 — 이 가이드를 반드시 준수하며 콘텐츠를 작성하세요]
상황 요약: ${executionPlan.situationSummary?.slice(0, 150) || ''}
실행 우선순위: ${executionPlan.executionPriority || '—'}
핵심 Owned Hub 방향: ${(executionPlan.ownedMedia?.hubContent || []).slice(0, 2).join(' / ')}
핵심 메시지 키워드: ${(executionPlan.ownedMedia?.seoStrategy || []).slice(0, 2).join(' / ')}
AEO 방향: ${(executionPlan.ownedMedia?.aeoStrategy || []).slice(0, 1).join('')}
`.trim() : '';

    const variantGuide = isPaid
      ? `
[변형 출력 형식 — 반드시 준수]
변형 3종을 아래 구분자로 반드시 분리하여 순서대로 작성하세요:
=== 변형A ===
[변형A 내용 전문]

=== 변형B ===
[변형B 내용 전문]

=== 변형C ===
[변형C 내용 전문]
`.trim()
      : '';

    const prompt = `당신은 Project AEGIS의 콘텐츠 전략 전문가입니다.
아래 C³ 인텔리전스와 전략 방향에 기반하여 최고 수준의 마케팅 콘텐츠를 생성하세요.

${baseCtx}

${strategyAnchor ? strategyAnchor + '\n' : ''}
${toneInstr}

${seoLayer}

${aeoLayer ? aeoLayer + '\n' : ''}${geoLayer ? geoLayer + '\n' : ''}
${mediaInstr}

${variantGuide}

[출력 규칙 — 반드시 준수]
- 순수 텍스트로만 응답하세요. JSON, 코드 블록(\`\`\`), XML 태그 사용 금지.
- 마크다운 H1(#)/H2(##)/H3(###) 헤딩은 허용합니다.
- **볼드체 기호(**) 절대 사용 금지.
- 모든 텍스트는 한국어로 작성 (영문 전문 용어 병기 허용).
- 지시된 구조와 분량(${config.targetLength}자 내외)을 최대한 준수하세요.
- 전략 앵커에 명시된 핵심 메시지 방향에서 벗어나지 마세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        // 창의적 콘텐츠 생성 — 높은 온도로 표현 다양성 확보
        // C³ 데이터와 전략 가이드가 프롬프트에 명시되어 있어 방향성은 고정됨
        temperature: 0.85,
      },
    });

    const rawText = (response.text || '').trim();

    if (!rawText) {
      throw new Error('Forge: AI returned empty response');
    }

    // Paid 유형이면 변형 파싱, 아니면 mainContent
    const variants = isPaid ? parsePaidVariants(rawText) : undefined;
    const mainContent = isPaid ? rawText : rawText;

    const qualityScore = analyzeQuality(rawText, config);

    return {
      mainContent,
      variants,
      qualityScore,
      mediaType: config.mediaType,
      subType: config.subType,
      config,
      generatedAt: new Date().toISOString(),
    };
  });
}
