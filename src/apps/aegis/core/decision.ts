
import { Context, ConversionStage, Channel, ContentFormat, Action, CognitionVector, CognitionKey } from './context';

/* =========================
 * Execution Layer
 * ========================= */

export interface ExecutionLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export interface ActionExecution {
  executionId: string;
  actionId: string;
  status: 'IDLE' | 'EXECUTING' | 'SUCCESS' | 'FAILED';
  outputUrl?: string;
  logs: ExecutionLog[];
  startedAt?: string;
  completedAt?: string;
}

export interface StrategicDecision {
  decisionId: string;
  contextId: string;
  selectedActions: Action[];
  executionStatus: Record<string, ActionExecution>; // Keyed by actionId
  overallProgress: number; // 0 to 1
}

/**
 * Helper to calculate the most urgent Context based on market signals and confidence
 */
export const calculateUrgency = (context: Context): number => {
  const signalScore = (context.marketSignal.naverScore + context.marketSignal.googleScore) / 200;
  const trendBonus = context.marketSignal.trendDirection === 'UP' ? 0.2 : 0;
  return (signalScore + context.journey.confidence) / 2 + trendBonus;
};

// Helper to categorize dominant cognition for the matrix
function getDominantCognitionCategory(cognition: CognitionVector): 'info' | 'commercial' | 'convert' {
  const { informational, exploratory, commercial, transactional } = cognition;
  
  const max = Math.max(informational, exploratory, commercial, transactional);
  
  if (transactional === max) return 'convert';
  if (commercial === max) return 'commercial';
  return 'info'; // informational or exploratory defaults to info strategy
}

// Strategic Matrix Mapping
const STRATEGY_MATRIX: Record<'info' | 'commercial' | 'convert', Record<ConversionStage, { channel: Channel, format: ContentFormat, label: string, rationale: string }>> = {
  info: {
    [ConversionStage.AWARENESS]: { 
      channel: 'BLOG', 
      format: 'AEO', 
      label: 'Awareness AEO Guide', 
      rationale: '문제 인식 단계의 사용자를 위한 정보성 검색 최적화 콘텐츠' 
    },
    [ConversionStage.CONSIDERATION]: { 
      channel: 'INSTAGRAM', 
      format: 'REELS', 
      label: 'Explainer Reel', 
      rationale: '복잡한 정보를 시각적으로 쉽게 풀어내는 숏폼 콘텐츠' 
    },
    [ConversionStage.DECISION]: { 
      channel: 'BLOG', 
      format: 'ARTICLE', 
      label: 'Detailed Comparison Post', 
      rationale: '구매 결정 직전의 상세 스펙 비교 및 분석' 
    },
    [ConversionStage.POST_PURCHASE]: { 
      channel: 'BLOG', 
      format: 'ARTICLE', 
      label: 'Usage Guide', 
      rationale: '제품 활용도를 높이는 심층 가이드' 
    }
  },
  commercial: {
    [ConversionStage.AWARENESS]: { 
      channel: 'YOUTUBE', 
      format: 'SHORTS', 
      label: 'Short Video Ad', 
      rationale: '잠재 고객의 관심을 끄는 짧고 강렬한 비디오 광고' 
    },
    [ConversionStage.CONSIDERATION]: { 
      channel: 'LINKEDIN', 
      format: 'ARTICLE', 
      label: 'USP Deep Dive', 
      rationale: '경쟁사 대비 차별화된 USP(고유 판매 제안) 심층 분석' 
    },
    [ConversionStage.DECISION]: { 
      channel: 'WEB', 
      format: 'LANDING_PAGE', 
      label: 'Conversion Landing Page', 
      rationale: '구매 전환에 최적화된 전용 랜딩 페이지' 
    },
    [ConversionStage.POST_PURCHASE]: { 
      channel: 'LINKEDIN', 
      format: 'ARTICLE', 
      label: 'Success Case Study', 
      rationale: '성공 사례 공유를 통한 신뢰도 강화 및 락인(Lock-in)' 
    }
  },
  convert: {
    [ConversionStage.AWARENESS]: { 
      channel: 'INSTAGRAM', 
      format: 'AD', 
      label: 'Retargeting Ad', 
      rationale: '이탈 고객의 재방문을 유도하는 리타겟팅 광고' 
    },
    [ConversionStage.CONSIDERATION]: { 
      channel: 'INSTAGRAM', 
      format: 'AD', 
      label: 'Special Offer Ad', 
      rationale: '구매 고려 단계의 고객에게 한정 혜택 제안' 
    },
    [ConversionStage.DECISION]: { 
      channel: 'INSTAGRAM', 
      format: 'AD', 
      label: 'Performance Conversion Ad', 
      rationale: '직관적인 CTA로 즉각적인 구매를 유도하는 퍼포먼스 광고' 
    },
    [ConversionStage.POST_PURCHASE]: { 
      channel: 'EMAIL', 
      format: 'NEWSLETTER', 
      label: 'CRM Newsletter', 
      rationale: '지속적인 관계 유지를 위한 맞춤형 CRM 뉴스레터' 
    }
  }
};

/**
 * Strategic Action Engine: Generates tactical marketing recommendations 
 * based on the user's current Conversion stage and market signals using the Strategy Matrix.
 */
export function generateActions(context: Context): Action[] {
  const { journey } = context;
  
  const dominantKey = getDominantCognitionCategory(journey.cognitionVector);
  const strategy = STRATEGY_MATRIX[dominantKey][journey.conversionStage];
  
  if (!strategy) return [];

  const action: Action = {
    id: `ACT-${context.id}-${journey.conversionStage}`,
    label: strategy.label,
    cognition: journey.cognitionVector,
    conversionStage: journey.conversionStage,
    channel: strategy.channel,
    format: strategy.format,
    objective: journey.conversionStage,
    priorityScore: 90, // Matrix derived actions are high priority by default
    rationale: strategy.rationale
  };

  return [action];
}
