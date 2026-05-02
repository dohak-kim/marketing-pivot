
// ── AEGIS FORGE — Content Generation Types ────────────────────────────────

export type MediaType = 'owned_hub' | 'owned_spoke' | 'earned' | 'paid';

export type OwnedHubSubType  = 'seo_longform' | 'aeo_faq' | 'geo_entity';
export type OwnedSpokeSubType = 'support_article' | 'faq_expansion' | 'case_study';
export type EarnedSubType    = 'press_release' | 'influencer_brief' | 'community_post';
export type PaidSubType      = 'search_ad' | 'social_ad' | 'landing_copy';
export type ContentSubType   = OwnedHubSubType | OwnedSpokeSubType | EarnedSubType | PaidSubType;

export type ToneAndManner = 'expert' | 'casual' | 'authoritative' | 'emotional';
export type TargetLength  = 300 | 600 | 1000 | 2000 | 3000;

export interface OptimizationLayer {
  seo: boolean; // always true — SEO is the foundation
  aeo: boolean; // Answer Engine Optimization
  geo: boolean; // Generative Engine Optimization
}

export interface ForgeConfig {
  mediaType: MediaType;
  subType: ContentSubType;
  tone: ToneAndManner;
  targetLength: TargetLength;
  optimization: OptimizationLayer;
}

export interface ContentQualityScore {
  seo: number;     // 0–100
  aeo: number;     // 0–100
  geo: number;     // 0–100
  overall: number; // weighted average
  checklist: {
    hasHeadingStructure: boolean;
    hasKeywordInIntro: boolean;
    faqCount: number;
    hasDirectAnswer: boolean;
    entityCount: number;
    hasCitableDefinition: boolean;
    headlineVariantCount: number;
  };
}

export interface ForgeOutput {
  mainContent: string;
  variants?: string[];          // Paid: A/B/C headline+body sets
  qualityScore: ContentQualityScore;
  mediaType: MediaType;
  subType: ContentSubType;
  config: ForgeConfig;
  generatedAt: string;
}

// ── C³ → Media Type auto-recommendation ──────────────────────────────────

export interface ForgeRecommendation {
  mediaType: MediaType;
  subType: ContentSubType;
  tone: ToneAndManner;
  targetLength: TargetLength;
  optimization: OptimizationLayer;
  rationale: string;
}

export const MEDIA_TYPE_META: Record<MediaType, {
  label: string; labelKo: string; icon: string;
  color: string; bg: string; border: string; badge: string;
  description: string;
}> = {
  owned_hub: {
    label: 'Owned Hub', labelKo: '허브 콘텐츠',
    icon: '⬡',
    color: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-500/30',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    description: 'SEO·AEO·GEO 최적화 핵심 허브 — Spoke의 중심',
  },
  owned_spoke: {
    label: 'Owned Spoke', labelKo: 'Spoke 콘텐츠',
    icon: '◎',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-500/30',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    description: 'Hub를 지원하는 롱테일 지원 콘텐츠',
  },
  earned: {
    label: 'Earned', labelKo: '언드 미디어',
    icon: '◈',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    description: 'PR · 인플루언서 브리프 · 커뮤니티',
  },
  paid: {
    label: 'Paid', labelKo: '페이드 미디어',
    icon: '◆',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-500/30',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    description: '검색광고 · 소셜광고 · 랜딩페이지 카피',
  },
};

export const SUB_TYPE_OPTIONS: Record<MediaType, { value: ContentSubType; label: string; desc: string }[]> = {
  owned_hub: [
    { value: 'seo_longform',  label: 'SEO 롱폼 아티클',   desc: 'H1~H3 계층 구조 + Hub-Spoke 내부 링크' },
    { value: 'aeo_faq',       label: 'AEO FAQ 가이드',     desc: 'PAA 형식 질의응답 + Featured Snippet 최적화' },
    { value: 'geo_entity',    label: 'GEO 엔티티 권위글',  desc: 'AI 인용 최적화 + 정의·수치·비교 구조' },
  ],
  owned_spoke: [
    { value: 'support_article', label: 'Spoke 지원 아티클', desc: '롱테일 키워드 타겟 + Hub 링크' },
    { value: 'faq_expansion',   label: 'FAQ 확장글',        desc: '특정 질문 심화 답변' },
    { value: 'case_study',      label: '케이스 스터디',     desc: '브랜드 경험 기반 신뢰 구축' },
  ],
  earned: [
    { value: 'press_release',    label: '보도자료',           desc: '역삼각형 구조 + 5W1H' },
    { value: 'influencer_brief', label: '인플루언서 브리프',  desc: '핵심 메시지 + 채널별 가이드' },
    { value: 'community_post',   label: '커뮤니티 게시물',   desc: '네이버 카페·블로그 자연 게시' },
  ],
  paid: [
    { value: 'search_ad',    label: '검색광고 소재',    desc: '헤드라인 3종 + 설명문 2종 + 확장소재' },
    { value: 'social_ad',    label: '소셜 광고 소재',   desc: 'A/B/C 3종 변형 세트 (인스타·페이스북)' },
    { value: 'landing_copy', label: '랜딩페이지 카피',  desc: '히어로 → 혜택 → CTA → 신뢰지표' },
  ],
};

export const TONE_OPTIONS: { value: ToneAndManner; label: string; labelKo: string; desc: string }[] = [
  { value: 'expert',        label: 'Expert',        labelKo: '전문적',    desc: '데이터·수치·전문용어 중심' },
  { value: 'authoritative', label: 'Authoritative', labelKo: '권위적',    desc: '신뢰·브랜드 리더십 강조' },
  { value: 'casual',        label: 'Casual',        labelKo: '친근한',    desc: '대화체·공감·스토리텔링' },
  { value: 'emotional',     label: 'Emotional',     labelKo: '감성적',    desc: '감정 자극·브랜드 공감 유도' },
];

export const LENGTH_OPTIONS: { value: TargetLength; label: string }[] = [
  { value: 300,  label: '300자' },
  { value: 600,  label: '600자' },
  { value: 1000, label: '1,000자' },
  { value: 2000, label: '2,000자' },
  { value: 3000, label: '3,000자' },
];
