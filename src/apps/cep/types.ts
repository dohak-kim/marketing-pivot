
export interface CEP {
  when: string;
  where: string;
  why: string;
  with: string;
}

export interface AnalysisResultItem {
  cep: CEP;
  painPoint: string;
  percentage: number;
}

export interface KeywordIntelligence {
  level: 'Industry' | 'Category' | 'Brand' | 'Product' | 'Unknown';
  description: string;
  marketingGoal: string;
  cepInsight?: string;
  targetInsight?: string;
  actionPlan?: string;
  potentialScore: number;
  cdjStage: '인지(Awareness)' | '고려(Consideration)' | '결정(Decision)' | '사후 관리(Post-Management)' | 'Unknown';
  searchIntent: '정보성(Informational)' | '탐색성(Navigational)' | '상업성(Commercial)' | '전환성(Transactional)' | 'Unknown';
}

export interface TargetProfile {
  demographics: string;
  media_habit: string;
}

export interface Cluster {
  name: string;
  target: TargetProfile;
  cep_trigger: string;
  percentage: number;
  linkedCepIndices: number[];
}

export interface ClusterResult {
  clusters: Cluster[];
}

export interface BlogSection {
  heading: string;
  body: string;
  imageUrl?: string;
}

export interface BlogAeoContent {
  format: 'blog';
  title: string;
  introduction: string;
  sections: BlogSection[];
  conclusion: string;
}

export interface LinkedInAeoContent {
  format: 'linkedin';
  hook: string;
  body: string;
  hashtags: string;
}

export type AeoContent = {
  targetClusterName: string;
} & (BlogAeoContent | LinkedInAeoContent);


export interface FullAnalysisResult {
  query: string;
  analysisResult: AnalysisResultItem[];
  clusterResult: ClusterResult | null;
  aeoContent: AeoContent | null;
  keywordIntelligence?: KeywordIntelligence;
  error?: string;
}

export interface AeoScoreReport {
  score: number;
  breakdown: {
    directness: number;
    structure: number;
    entity: number;
    reliability: number;
  };
  feedback: string;
  suggestion: string;
}

export interface BatchSummaryReport {
  landscape: string;
  targetInsight: string;
  aeoStrategy: string;
  cdjRecommendations: {
    stage: string;
    action: string;
    nextKeywords: string[];
  }[];
}

export type ImageType = 'Infographic' | 'Cartoon' | 'Illustration' | 'Photography';
export type ImageTone = 'Professional' | 'Friendly' | 'Futuristic' | 'Minimalist';
export type ImageColor = 'Vibrant' | 'Pastel' | 'Monochrome' | 'Warm' | 'Cool';

export interface ImageStyleConfig {
  type: ImageType;
  tone: ImageTone;
  color: ImageColor;
}
