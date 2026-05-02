
import { ContentEvaluation as EvaluationModel, EvaluationScore as ScoreModel } from '../evaluation/model';
// Import the refactored types
import { KeywordNode, CognitionKey } from '../domain/visualization/contextVisualization.types';

// Re-export for convenience and to avoid breaking existing imports
export * from '../domain/visualization/contextVisualization.types';

export type StrategyType =
  | "offensive"
  | "defensive"
  | "brand_build"
  | "niche_capture"
  | "monitor";

export interface StrategyAction {
  primaryGoal: string;
  contentFocus: string[];
  channelPriority: string[];
  kpi: string[];
}

export interface OwnedMediaPlan {
  hubContent: string[];    // Hub: 핵심 콘텐츠 (홈페이지/블로그)
  spokeContent: string[];  // Spoke: 파생 콘텐츠 (SNS/이메일/유튜브)
  seoStrategy: string[];   // SEO 검색 최적화
  aeoStrategy: string[];   // AEO: Answer Engine Optimization
  geoStrategy: string[];   // GEO: Generative Engine Optimization (AI 검색)
}

export interface VeoPromptPair {
  reels15s: string;   // 15초 숏폼 (Reels/Shorts) 영문 Veo 프롬프트
  shorts30s: string;  // 30초 YouTube Shorts 영문 Veo 프롬프트
}

export interface ExecutionPlan {
  situationSummary: string;
  executionPriority: "High" | "Medium" | "Low";
  resourceIntensity: "light" | "moderate" | "aggressive";
  ownedMedia: OwnedMediaPlan;
  earnedMedia: string[];
  paidMedia: string[];
  kpiFramework: string[];
  veoPrompts?: VeoPromptPair;
}

export enum ConversionStage {
  AWARENESS = "awareness",
  CONSIDERATION = "consideration",
  DECISION = "decision",
  POST_PURCHASE = "post_purchase"
}

export type CDJStage = ConversionStage;

export type Channel =
  | "INSTAGRAM"
  | "BLOG"
  | "LINKEDIN"
  | "VIDEO"
  | "YOUTUBE"
  | "WEB"
  | "EMAIL"
  | "Instagram"
  | "YouTube"
  | "Google"
  | "Naver"
  | "LandingPage";

export type ChannelType = Channel;

export type ContentFormat =
  | "AD"
  | "REELS"
  | "ARTICLE" 
  | "AEO" 
  | "SCRIPT"
  | "SHORTS"
  | "LANDING_PAGE"
  | "NEWSLETTER"
  | "AEO_BLOG"
  | "EXPLAINER_REEL"
  | "COMPARISON_POST"
  | "GUIDE_CONTENT"
  | "SHORT_VIDEO_AD"
  | "USP_POST"
  | "CASE_CONTENT"
  | "RETARGET_AD"
  | "OFFER_POST"
  | "PERFORMANCE_AD"
  | "CRM_CONTENT";

export type CognitionVector = {
  informational: number;   // 0 ~ 1
  exploratory: number;
  transactional: number;
  commercial: number;
};

export type IntentVector = CognitionVector;

export type IntentKey = CognitionKey;

export interface BrandPresence {
  brand: string;
  count: number;
}

export interface MarketSignal {
  naverScore: number;      // 검색량 / 트렌드 정규화 점수
  googleScore: number;
  trendDirection: "UP" | "FLAT" | "DOWN";
  clusterId?: string;      // Context 군집 ID
  clusterName?: string;    // Context 군집 이름
  aeoRelevance?: number;   // AEO 적합도 (0~1)
  priorityScore: number;   // 0 ~ 100

  // Volume data provenance — drives "estimated" badge in UI
  volumeIsEstimated: boolean;       // true = AI 추정값, false = 실제 API 데이터
  naverVolumeRange?: string;        // Naver API 구간값 (예: "1000~10000")
  mobileVolumeRange?: string;
}

/**
 * SERP feature flags derived from real Serper.dev data.
 * Used to trigger AEO/GEO strategy recommendations conditionally.
 */
export interface SerpFeatureFlags {
  hasFeaturedSnippet: boolean;  // Featured Snippet 존재 → AEO FAQ 전략 트리거
  hasPAA: boolean;              // People Also Ask 존재 → Q&A 콘텐츠 트리거
  hasAIOverview: boolean;       // AI Overview (SGE) 존재 → GEO 전략 트리거
  hasShopping: boolean;
  hasVideoCarousel: boolean;
  paaQuestions?: string[];      // 실제 PAA 질문 목록
}

export interface JourneyState {
  conversionStage: ConversionStage;
  confidence: number;      // 전환 판별 신뢰도 (0~1)
  cognitionVector: CognitionVector;
  
  // Aliases for compatibility
  /** @deprecated use conversionStage */
  cdjStage?: ConversionStage;
  /** @deprecated use cognitionVector */
  intentVector?: CognitionVector;
}

export interface ContextMetadata {
  category: string;
  industry?: string;
  keywords: KeywordNode[];
  createdAt: string;
  updatedAt: string;
  source: "NAVER" | "GOOGLE" | "HYBRID";
}

export type CEPMetadata = ContextMetadata;

export interface Action {
  id: string;
  label: string; 
  cognition: CognitionVector;
  conversionStage: ConversionStage;
  channel: Channel;
  format: ContentFormat;
  objective: ConversionStage;
  priorityScore: number;
  rationale: string;

  // Aliases
  /** @deprecated use cognition */
  intent?: CognitionVector;
  /** @deprecated use conversionStage */
  cdjStage?: ConversionStage;
}

export type EvaluationScore = ScoreModel;
export type ContentEvaluation = EvaluationModel;

export interface ImprovementSuggestion {
  suggestionId: string;
  title: string;
  description: string;
  revisedHooks?: string[];
  actionableTweak: string;
}

export interface GeneratedAsset {
  id: string;
  type: "text" | "video";
  content: string; // video URL or text body
  evaluationContent?: string; // Text representation for evaluation (e.g. video prompt/script)
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export type StrategyState =
  | 'pre-strategy'      // AI 구조 생성 완료
  | 'scored'            // 점수 계산 완료
  | 'validated'         // 사람 검증
  | 'activated';        // 실행 전략

export interface Context {
  id: string;
  category: string;
  situation: string;
  description?: string;
  metadata: ContextMetadata;
  marketSignal: MarketSignal;
  journey: JourneyState;
  actions: Action[];
  groundingSources?: GroundingSource[];
  strategyState?: StrategyState;
  
  // Strategy Classification
  strategyType?: StrategyType;
  actionPlan?: StrategyAction;
  
  // Deep Dive Execution Plan
  executionPlan?: ExecutionPlan;

  // UI Selection State
  isChecked?: boolean;

  // -- User Requested Fields --
  queryGroup?: string;
  cognitionConfidence?: number;
  estimatedTotalResults?: number;
  serpFeaturesList?: string[]; // Array format
  // ---------------------------

  // Legacy/Internal fields
  searchCognitionRaw?: string;   // Gemini 원본
  cognition?: CognitionKey;     // 보정 후 내부 사용 값
  hybridCognition?: string;     // 최종 확정 cognition (Hybrid Analysis Result)
  volumeProxy?: number;         // Computed total volume

  // Structured SERP features for UI
  serpFeatures?: {
    hasShopping?: boolean;
    adCount?: number;
  };
  
  // Data Provenance — where the data for this Context came from
  dataProvenance?: 'api' | 'grounding_estimate';

  // SERP Feature Flags (from Serper.dev — AEO/GEO trigger logic)
  serpFeatureFlags?: SerpFeatureFlags;

  // Naver DataLab 트렌드 (키워드 대표 트렌드)
  trendDirection?: import('../services/dataCollection/types').TrendDirection;
  trendMomentum?: number;   // avg(last3mo) / avg(prev9mo)
  trendRecentAvg?: number;  // 최근 3개월 평균 ratio (0-100)

  // Share of Voice Analysis
  brandPresence?: BrandPresence[];
  brandPresenceSource?: 'api' | 'ai_simulated'; // 'api' = counted from real SERP top results
  brandShare?: number;
  competitorShare?: number;
  competitiveDensity?: number;
  numCompetitorsTracked?: number;    // 입력된 경쟁사 수 — 경쟁 강도 정규화에 사용

  // Aliases for compatibility
  /** @deprecated use cognitionConfidence */
  intentConfidence?: number;
  /** @deprecated use searchCognitionRaw */
  searchIntentRaw?: string;
  /** @deprecated use cognition */
  intent?: CognitionKey;
  /** @deprecated use hybridCognition */
  hybridIntent?: string;
}

export type CEP = Context;

export interface RawDataItem {
  id: string;
  extraction_keyword: string;
  retrieval_source: 'GOOGLE' | 'NAVER';
  timestamp: string;
  title: string;
  uri: string;
  snippet: string;
  context_cluster_id: string;
  context_cluster_name: string;
  inferred_conversion_stage: ConversionStage;
  dominant_cognition: CognitionKey;
  serp_features: string;
  relevance_score: number;
  setting_google_level: number;
  setting_naver_level: number;
  setting_duration: string;
}

export interface BattleFieldInput {
  category: string;
  brandName: string;
  competitors: string[];
}
