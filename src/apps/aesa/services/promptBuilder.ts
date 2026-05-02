export function buildMarketPrompt(factSheet: string) {
  return `
You are a senior strategy consultant.

Use ONLY the information from the Fact Sheet.

Never invent numbers or facts.

If data is missing write "Data unavailable".

Produce:

1 Market Overview
2 PEST Analysis
3 Competitive Landscape
4 SWOT
5 Strategic Implication

FACT SHEET

${factSheet}

`;
}
export function buildMarketingEnginePrompt(data: string) {
  return `

Based on the market analysis produce:

1 Customer Decision Journey
Awareness
Consideration
Purchase
Experience
Loyalty

2 Category Entry Points

Identify situations where customers enter the category.

3 Intent Signals

Search trends
Media mentions
Consumer behavior

4 Action Guide

For each opportunity provide:

CEP
Target CDJ Stage
Intent Signal
Recommended Marketing Action

DATA

${data}

`;
}

export function buildPrompt(userRequest: string, factSheet: string) {
  return `
당신은 글로벌 전략 컨설팅사의 파트너이다.

다음 Fact Sheet에 포함된 정보만 사용하여 분석해야 한다.
자료에 없는 수치, 사실, 사례를 생성하는 것을 금지한다.

모든 핵심 주장에는 반드시 출처 ID를 명기하라.
예: (SRC-1)

${factSheet}

[요청]
${userRequest}
`;
}
