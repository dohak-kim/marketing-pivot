import { Context, CognitionKey, ConversionStage } from '../core/context';

// Inlined from the former StrategicActionMap component
const COGNITION_ACTION_MAP: Record<CognitionKey, { cognition: CognitionKey; label: string; description: string }> = {
  informational: { cognition: 'informational', label: 'Informational',  description: '지식 습득 및 문제 해결을 위한 정보 콘텐츠 제작' },
  exploratory:   { cognition: 'exploratory',   label: 'Exploratory',    description: '브랜드·제품 비교 가이드 및 탐색 지원 콘텐츠' },
  commercial:    { cognition: 'commercial',     label: 'Commercial',     description: 'USP 강조 및 경쟁 우위 메시지 전달 콘텐츠' },
  transactional: { cognition: 'transactional',  label: 'Transactional',  description: '전환 유도 오퍼·CTA·구매 트리거 콘텐츠' },
};

export function buildContextActions(cep: Context) {
  const dist = cep.journey?.cognitionVector;
  const stage = cep.journey?.conversionStage;

  if (!dist) {
    // pre-strategy fallback: Suggest all cognitions if no vector is available
    return Object.values(COGNITION_ACTION_MAP);
  }

  const sortedCognitions = Object.entries(dist)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 2); // Top 2 cognitions only

  return sortedCognitions.map(([key]) => {
    const cognition = key as CognitionKey;
    const baseAction = COGNITION_ACTION_MAP[cognition];
    
    // Enhance description based on Conversion Stage context (Context Vector)
    let enhancedDescription = baseAction.description;
    
    if (stage) {
      if (stage === ConversionStage.AWARENESS) {
        if (cognition === 'informational') enhancedDescription = '트렌드 키워드 선점 및 문제 인식 유도 콘텐츠';
        if (cognition === 'commercial') enhancedDescription = '브랜드 인지도 확산을 위한 USP 노출';
      } else if (stage === ConversionStage.CONSIDERATION) {
        if (cognition === 'exploratory') enhancedDescription = '상세 비교 가이드 및 경쟁 우위 요소 강조';
        if (cognition === 'informational') enhancedDescription = '심층 정보 제공을 통한 신뢰도 확보';
      } else if (stage === ConversionStage.DECISION) {
        if (cognition === 'transactional') enhancedDescription = '강력한 오퍼 및 구매 전환 트리거(CTA) 강화';
        if (cognition === 'commercial') enhancedDescription = '구매 결정적 증거(Social Proof) 및 리뷰 제시';
      } else if (stage === ConversionStage.POST_PURCHASE) {
        if (cognition === 'informational') enhancedDescription = '활용 팁 및 온보딩 가이드로 리텐션 강화';
        if (cognition === 'transactional') enhancedDescription = '재구매 및 크로스셀링(Cross-selling) 유도';
      }
    }

    return {
      ...baseAction,
      description: enhancedDescription
    };
  });
}
