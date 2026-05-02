
// NOTE: This file is a prototype-era module. buildBlueprint() / StrategyBlueprint
// are superseded by content/forgeWorkflow.ts (buildForgeWorkflow) which is
// the production entry point for the Hub & Spoke campaign architecture.
// Retained for reference; not called from the main App flow.

import { StrategyBlock } from '../utils/vector';
import { ConversionStage, ContentFormat, CognitionKey, Channel } from '../core/context';

export type StrategyBlueprint = {
  id: string;
  strategyBlockId: string;

  primaryCognition: CognitionKey;
  conversionStage: ConversionStage;

  recommendedFormat: ContentFormat;
  coreMessage: string;
  suggestedAngle: string;

  channels: Channel[];
}

export type DraftContent = {
  id: string;
  blueprintId: string;

  format: ContentFormat;
  channel: Channel;

  title: string;
  hook: string;
  body: string;
  cta?: string;
}

const formatMatrix: Record<'info' | 'commercial' | 'convert', Record<ConversionStage, ContentFormat>> = {
  info: {
    [ConversionStage.AWARENESS]: "AEO_BLOG",
    [ConversionStage.CONSIDERATION]: "EXPLAINER_REEL",
    [ConversionStage.DECISION]: "COMPARISON_POST",
    [ConversionStage.POST_PURCHASE]: "GUIDE_CONTENT",
  },
  commercial: {
    [ConversionStage.AWARENESS]: "SHORT_VIDEO_AD",
    [ConversionStage.CONSIDERATION]: "USP_POST",
    [ConversionStage.DECISION]: "LANDING_PAGE",
    [ConversionStage.POST_PURCHASE]: "CASE_CONTENT",
  },
  convert: {
    [ConversionStage.AWARENESS]: "RETARGET_AD",
    [ConversionStage.CONSIDERATION]: "OFFER_POST",
    [ConversionStage.DECISION]: "PERFORMANCE_AD",
    [ConversionStage.POST_PURCHASE]: "CRM_CONTENT",
  },
};

function mapCognitionToKey(cognition: CognitionKey): 'info' | 'commercial' | 'convert' {
  switch (cognition) {
    case 'informational':
    case 'exploratory':
      return 'info';
    case 'commercial':
      return 'commercial';
    case 'transactional':
      return 'convert';
    default:
      return 'info';
  }
}

function buildCoreMessage(block: StrategyBlock): string {
  return `이 콘텐츠는 '${block.dominantConversion}' 단계에서
'${block.dominantCognition}' 인지 목적을 가진 사용자의
문제 인식을 명확히 돕는 데 초점을 둡니다.`
}

function buildAngle(block: StrategyBlock): string {
  const key = mapCognitionToKey(block.dominantCognition);

  if (key === 'info')
    return "문제를 정의하고 오해를 정리하는 접근";

  if (key === 'commercial')
    return "선택 기준을 명확히 하는 비교 접근";

  return "즉각적 행동을 유도하는 명확한 제안";
}

function suggestChannels(format: ContentFormat): Channel[] {
  if (format.includes("REEL") || format.includes("VIDEO"))
    return ["Instagram", "YouTube"];

  if (format.includes("BLOG"))
    return ["Google", "Naver"];

  return ["Instagram", "LandingPage"];
}

export function buildBlueprint(block: StrategyBlock): StrategyBlueprint {
  const key = mapCognitionToKey(block.dominantCognition);
  const format = formatMatrix[key][block.dominantConversion];

  return {
    id: `CB-${block.id}`,
    strategyBlockId: block.id,

    primaryCognition: block.dominantCognition,
    conversionStage: block.dominantConversion,

    recommendedFormat: format,

    coreMessage: buildCoreMessage(block),
    suggestedAngle: buildAngle(block),

    channels: suggestChannels(format),
  };
}
