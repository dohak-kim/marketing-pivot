
export enum CDJStage {
  Awareness = '인지',
  Consideration = '고려',
  Decision = '결정',
  Loyalty = '사후 관리',
}

export enum SearchIntent {
  Informational = '정보성',
  Navigational = '탐색성',
  Commercial = '상업성',
  Transactional = '전환성',
}

export type AspectRatio = '1:1' | '9:16';

export type ImageTone = '애니메이션' | '실사' | '일러스트레이션';

export interface KeywordData {
  keyword: string;
  cdjStage: CDJStage;
  searchIntent: SearchIntent;
  searchVolumeIndex: number;
}

export interface IntentDistribution {
  intent: SearchIntent;
  value: number;
}

export interface StrategicOutline {
  stage: CDJStage;
  toneAndManner: string;
  cta: string;
  explanation: string;
  adMessages: string[];
}

export interface KeywordInsight {
  stage: CDJStage;
  insight: string;
}

export interface AnalysisResult {
  keywords: KeywordData[];
  intentDistribution: IntentDistribution[];
  strategicOutlines: StrategicOutline[];
  strategicInsights: string;
  matrixImplication: string; // New field for specific matrix analysis
  keywordInsights: KeywordInsight[];
}

// 릴스 생성 관련 타입
export interface ReelScene {
  sceneNumber: number;
  duration: string;
  visualDescription: string;
  audioScript: string;
  veoPrompt: string; // Veo 모델에 들어갈 영문 프롬프트
  storyboardImages?: string[]; // 생성된 콘티 이미지 (Base64)
}

export interface ReelStoryboard {
  id: string;
  title: string;
  concept: string;
  scenes: ReelScene[];
}

export interface GeneratedVideo {
  sceneNumber: number;
  videoUrl: string;
}

export type AssetType = 'logo' | 'product' | 'model' | 'store' | 'background';

export interface StoryboardAsset {
  type: AssetType;
  file: File;
  previewUrl: string;
  base64?: string;
  mimeType?: string;
}
