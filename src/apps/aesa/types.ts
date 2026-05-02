export interface MarketTrendPoint {
  year: number;
  value: number;
  isForecast: boolean;
  isEstimated?: boolean;
}

export interface MarketAnalysis {
  historicalData: MarketTrendPoint[];
  forecastData: MarketTrendPoint[];
  currentMarketSize: string;
  cagrHistorical: string;
  cagrForecast: string;
  unit: string;
  description: string;
}

export interface PositioningBrand {
  name: string;
  x: number;
  y: number;
  isTarget: boolean;
}

export interface PositioningMapData {
  xAxisName: string;
  yAxisName: string;
  brands: PositioningBrand[];
  factReading: string;
  strategicImplication: string;
}

export interface SegmentProfile {
  name: string;
  criteria: string;
  size: string;
  description: string;
  rationale: string;
}

export interface TargetStrategy {
  selectedSegment: string;
  rationale: string;
  persona: string;
  personaImageUrl?: string;
}

export interface PositioningStrategy {
  statement: string;
  differentiation: string;
}

export interface StpStrategy {
  segmentationLogic: string;
  segmentation: SegmentProfile[];
  targeting: TargetStrategy;
  positioning: PositioningStrategy;
  positioningMap: PositioningMapData;
}

export interface MarketingMix {
  product: string[];
  price: string[];
  place: string[];
  promotion: string[];
}

export interface PestAnalysis {
  political: string[];
  economic: string[];
  social: string[];
  technological: string[];
  implications: string[];
  sources: string[];
}

export interface ThreeCAnalysis {
  company: {
    name: string;
    strengths: string[];
    currentPosition: string;
    sources: string[];
  };
  competitor: {
    rivals: { name: string; strategy: string }[];
    implications: string[];
    sources: string[];
  };
  customer: {
    segments: string[];
    needs: string[];
    trends: string[];
    sources: string[];
  };
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  strategies: {
    SO: string;
    ST: string;
    WO: string;
    WT: string;
  };
  sources: string[];
}

export interface CommunicationStrategy {
  mainConcept: string;
  slogan: string;
  brandStory: string;
  toneAndVoice: string;
  keyKeywords: string[];
  actionPlan: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

// 소스 신뢰도 2-tier 분류
// verified    : URI 포함, 링크 클릭 가능 (Google Grounding / 네이버 뉴스 실제 URL)
// aiGenerated : AI 응답 내 sources[] 문자열 — 원문 확인 권장
export interface CategorizedSources {
  verified: GroundingSource[];
  aiGenerated: string[];
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface ReportSlide {
  title: string;
  headMessage: string;
  content: string[];
  rtb: {
    evidence: string;
    metric: string;
    source: string;
  };
}

export interface MarketingReport {
  title: string;
  subtitle: string;
  tableOfContents: string[];
  slides: ReportSlide[];
}

export interface AnalysisInputs {
  category: string;
  ownBrand: string;
  competitors: string[];
  keywords: string;
  context?: string;
}

export interface AnalysisResult {
  marketTrend: MarketAnalysis;
  pest: PestAnalysis;
  threeC: ThreeCAnalysis;
  swot: SwotAnalysis;
  stp: StpStrategy;
  marketingMix: MarketingMix;
  communication: CommunicationStrategy;
  sources: GroundingSource[];
  glossary: GlossaryItem[];
}

export type AnalysisStep =
  | 'idle'
  | 'optimizing-query'
  | 'fetching-news'
  | 'fetching-gdelt'
  | 'parsing-articles'
  | 'building-facts'
  | 'validating-facts'
  | 'analyzing-market'
  | 'intent-analysis'
  | 'generating-report'
  | 'generating-slides'
  | 'complete'
  | 'error';
