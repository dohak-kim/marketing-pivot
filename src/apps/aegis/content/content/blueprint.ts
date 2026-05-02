
import { Action, Channel, ContentFormat, Context } from '../core/context';

/* =========================
 * Content Blueprint Model
 * ========================= */

export interface ContentBlueprint {
  blueprintId: string;
  channel: Action["channel"];
  format: Action["format"];

  headlineGoal: string;
  keyMessage: string;
  callToAction: string;

  narrativeStructure: string[];   // 순서형 구조
  toneAndManner: string[];

  seoOrAeoFocus?: string[];
  visualDirection?: string[];

  rationale: string;
}

/**
 * Specific templates for high-impact channel/format combinations.
 */
const TEMPLATE_EXTENSIONS: Record<string, Partial<ContentBlueprint>> = {
  'INSTAGRAM_REELS': {
    headlineGoal: '1.5초 내에 시선을 사로잡는 고대비 상황 POV',
    keyMessage: '이 구체적인 상황의 불편함은 우리의 핵심 솔루션으로 해결됩니다.',
    narrativeStructure: [
      'POV 시각적 훅: "[상황]이 발생했을 때..."',
      '문제 심화: 일반적인 해결책이 실패하는 이유',
      '전환: Context 솔루션 소개',
      '증명: 빠른 결과 예시',
      '지시적 CTA'
    ],
    toneAndManner: ['진정성 있는', '공감되는', '에너지 넘치는'],
    visualDirection: ['빠른 컷 편집 (0.8초)', '다이내믹 텍스트 오버레이', '인물 클로즈업 리액션']
  },
  'YOUTUBE_SHORTS': {
    headlineGoal: '빠른 템포의 시각적 스토리텔링을 통한 도달 극대화',
    keyMessage: '[상황]에 대한 빠르고 소화하기 쉬운 인사이트.',
    narrativeStructure: [
      '시각적 훅 / 질문',
      '빠른 문맥 설정',
      '유레카 모먼트 ("Aha" Moment)',
      '만족스러운 해결',
      '루프형 CTA'
    ],
    toneAndManner: ['교육적인', '빠른', '명확한'],
    visualDirection: ['세로형 9:16', '중앙 정렬 텍스트', 'B-roll 배경']
  },
  'BLOG_AEO': {
    headlineGoal: '시맨틱 상황 쿼리에 대한 답변 박스 선점',
    keyMessage: '[상황] 진입점에 대한 권위 있는 분석 및 해설.',
    narrativeStructure: [
      '직접적인 답변 (스니펫 유도)',
      '상황적 맥락 및 배경',
      '단계별 전략 로드맵',
      '시맨틱 FAQ 클러스터',
      '리소스 추천'
    ],
    toneAndManner: ['권위 있는', '객관적인', '지시적인'],
    seoOrAeoFocus: ['시맨틱 엔티티 클러스터링', 'NLP 질문-답변 페어링', '고관여 스키마 최적화']
  },
  'INSTAGRAM_AD': {
    headlineGoal: '고관여 의사결정자를 위한 즉각적인 가치 입증',
    narrativeStructure: [
      '해결 과제(JTBD) 헤드라인',
      '사회적 증거 / 업계 권위',
      '기능-혜택 변환',
      '매끄러운 "구매/획득" CTA'
    ],
    toneAndManner: ['프리미엄', '직설적인', '전문적인'],
    visualDirection: ['깔끔한 미니멀리즘', '볼드 타이포그래피', '정면 응시 인물']
  },
  'LINKEDIN_ARTICLE': {
    headlineGoal: '[산업] 분야에 대한 확고한 사고 리더십 구축',
    keyMessage: '[상황]을 헤쳐나가는 전략적 시장 관점.',
    narrativeStructure: [
      '시장 관찰',
      '개인적/전문적 일화',
      '데이터 기반 논증',
      '미래 청사진',
      '커뮤니티 논의 유도'
    ],
    toneAndManner: ['비전 있는', '분석적인', '전문적인']
  },
  'WEB_LANDING_PAGE': {
    headlineGoal: '고관여 트래픽의 전환율 극대화',
    narrativeStructure: [
      '히어로 섹션: 가치 제안 & 히어로 샷',
      '문제/심화: [상황]에 대한 공감',
      '솔루션/혜택: 해결 방법',
      '사회적 증거 (로고/후기)',
      '작동 원리 (How it Works)',
      'FAQ & 반론 제거',
      '최종 CTA & 보증'
    ],
    toneAndManner: ['설득력 있는', '명확한', '긴박한'],
    visualDirection: ['고대비 CTA 버튼', '신뢰 뱃지', '시선 유도 장치']
  },
  'EMAIL_NEWSLETTER': {
    headlineGoal: '관계 육성 및 리텐션 유도',
    keyMessage: '[상황] 동안 브랜드 상기도 유지.',
    narrativeStructure: [
      '제목 훅',
      '개인화된 인사',
      '가치 부가 콘텐츠 / 인사이트',
      '독점 제안 / 업데이트',
      '소프트 CTA / 피드백 요청'
    ],
    toneAndManner: ['개인적인', '따뜻한', '도움이 되는']
  }
};

/**
 * Generates a full ContentBlueprint for a given action.
 * Uses specific templates if available, otherwise falls back to intelligent channel-based defaults.
 */
export function generateBlueprint(action: Action, context?: Context): ContentBlueprint {
  const templateKey = `${action.channel}_${action.format}`;
  const extension = TEMPLATE_EXTENSIONS[templateKey] || {};

  // Channel-based Base Templates
  const base: ContentBlueprint = {
    blueprintId: `BP-${action.id}`,
    channel: action.channel,
    format: action.format,
    headlineGoal: extension.headlineGoal || `${action.channel}을(를) 통한 ${action.objective} 단계의 관여 유도`,
    keyMessage: extension.keyMessage || (context ? `[${context.situation}]에 대한 전략적 대응` : `핵심 문제 해결: ${action.rationale}`),
    callToAction: extension.callToAction || (action.objective === 'decision' ? '지금 시작하기' : '더 알아보기'),
    narrativeStructure: extension.narrativeStructure || ['훅 (Hook)', '문제 (Problem)', '솔루션 (Solution)', '행동 유도 (CTA)'],
    toneAndManner: extension.toneAndManner || ['균형 잡힌', '전문적인'],
    rationale: action.rationale,
    seoOrAeoFocus: extension.seoOrAeoFocus,
    visualDirection: extension.visualDirection
  };

  // Channel-specific logic for defaults
  if (!extension.narrativeStructure) {
    switch (action.channel) {
      case 'VIDEO':
      case 'YOUTUBE':
        base.narrativeStructure = ['패턴 인터럽트', '문제 상황 설정', '시각적 솔루션', '엔딩 카드 CTA'];
        base.toneAndManner = ['다이내믹', '시각적'];
        break;
      case 'LINKEDIN':
        base.narrativeStructure = ['전문적 맥락', '인사이트 관찰', '전략적 제언', '네트워크 참여 유도'];
        base.toneAndManner = ['사려 깊은', '권위 있는'];
        break;
      case 'BLOG':
      case 'WEB':
        base.narrativeStructure = ['도입부', '의도별 소제목', '실제 사례', '결론'];
        break;
      case 'EMAIL':
        base.narrativeStructure = ['제목', '훅', '본문', 'CTA'];
        break;
    }
  }

  // Final replacement of placeholders
  if (context) {
    base.keyMessage = base.keyMessage.replace('[상황]', context.situation).replace('[Situation]', context.situation);
    base.headlineGoal = base.headlineGoal.replace('[상황]', context.situation).replace('[Situation]', context.situation).replace('[산업]', context.metadata.industry || '시장').replace('[Industry]', context.metadata.industry || '시장');
    base.narrativeStructure = base.narrativeStructure.map(s => s.replace('[상황]', context.situation).replace('[Situation]', context.situation));
  }

  return base;
}
