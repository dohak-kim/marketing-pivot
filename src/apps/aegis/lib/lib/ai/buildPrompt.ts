
import { StrategyBlueprint } from '../../content/strategy';
import { ChannelType } from '../../core/context';

export function buildContentPrompt(
  blueprint: StrategyBlueprint,
  channel: ChannelType
): string {
  return `당신은 최고 수준의 퍼포먼스 마케터입니다. 아래 전략 블루프린트에 맞는 콘텐츠를 생성하세요.

[전략 컨텍스트]
- 주요 인지 목적: ${blueprint.primaryCognition}
- 전환 단계: ${blueprint.conversionStage}
- 정보성 목적: 제품 정보와 사용 가이드 제공

[콘텐츠 형식]
- 포맷: ${blueprint.recommendedFormat}
- 채널: ${channel}

[메시지 구조]
- 핵심 메시지: ${blueprint.coreMessage}
- 제안 각도: ${blueprint.suggestedAngle}

출력:
1. 제목 1개
2. 본문에서 핵심만 표시
3. 단락 2~3개
4. 친근하고 간결하게, 과도한 이모지 미사용`;
}
