
import { GoogleGenAI, Type } from "@google/genai";

// Vite define / importmap 환경 모두 대응하는 키 해석
function resolveApiKey(): string {
  const sources = [
    () => process.env.GEMINI_API_KEY,  // .env.local GEMINI_API_KEY → vite define
    () => process.env.API_KEY,
    () => (import.meta as any)?.env?.VITE_API_KEY,
  ];
  for (const get of sources) {
    try { const v = get(); if (v && v !== 'undefined') return v.trim(); } catch {}
  }
  return '';
}
import { Context, ContentEvaluation, ImprovementSuggestion, ConversionStage, GroundingSource, KeywordNode, RawDataItem, CognitionKey, ExecutionPlan } from "../core/context";
import { ContentBlueprint } from "../content/blueprint";
import { getScriptPrompt, VideoScriptItem } from "../video/script";
import { ShotListItem } from "../video/shotlist";
import { resolveCognition } from "../services/cognitionEngine";
import { calculateBrandMetrics } from "../services/brandShareEngine";
import { safeJsonParse } from "../utils/jsonParser";

export interface VideoProductionSuite {
  script: VideoScriptItem[];
  shotList: ShotListItem[];
  heroPrompt: string;
}

export interface RetrievalDensity {
  google: number;
  naver: number;
}

const actionSchemaProperties = {
  label: { type: Type.STRING },
  channel: { type: Type.STRING },
  format: { type: Type.STRING },
  objective: { type: Type.STRING },
  rationale: { type: Type.STRING },
};

// Precise schema matching user request + essential app fields
const contextSchemaProperties = {
  id: { type: Type.STRING },
  situation: { type: Type.STRING, description: "Specific situation context" },
  description: { type: Type.STRING },
  
  // User Requested Fields
  queryGroup: { type: Type.STRING, description: "Clustered search theme/group name." },
  cognition: { type: Type.STRING, enum: ["informational", "exploratory", "commercial", "transactional"] },
  cognitionConfidence: { type: Type.NUMBER, description: "0 to 1 confidence score" },
  serpFeatures: { type: Type.ARRAY, items: { type: Type.STRING }, description: "e.g. ['Shopping', 'Ads', 'Video']" },
  brandPresence: {
      type: Type.ARRAY,
      items: {
          type: Type.OBJECT,
          properties: {
              brand: { type: Type.STRING },
              count: { type: Type.NUMBER }
          }
      },
      description: "Count of brand mentions in top SERP results."
  },
  estimatedTotalResults: { type: Type.NUMBER, description: "Estimated search volume or result count" },
  
  // New Fields for distinct platform scoring
  naverQueryVolume: { type: Type.NUMBER, description: "Relative search intensity/trend on Naver (0-100). Varies by Context node." },
  googleQueryVolume: { type: Type.NUMBER, description: "Relative search intensity/trend on Google (0-100). Varies by Context node." },

  // Helpers for App Logic
  conversionStage: { type: Type.STRING, enum: ["awareness", "consideration", "decision", "post_purchase"] },
  actions: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: actionSchemaProperties,
      required: ["label", "channel", "format", "objective", "rationale"]
    }
  },
  keywords: {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            keyword: { type: Type.STRING },
            volume: { type: Type.NUMBER },
            cognition: { type: Type.STRING }
        }
    }
  }
};

const evaluationScoreSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER },
    rationale: { type: Type.STRING }
  },
  required: ["score", "rationale"]
};

function extractGroundingSources(candidates: any): GroundingSource[] {
  const sources: GroundingSource[] = [];
  const chunks = candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || "웹 소스",
          uri: chunk.web.uri
        });
      }
    });
  }
  return sources;
}

/**
 * Executes a function with exponential backoff retry logic.
 * Handles 500 (Internal Error), 503 (Service Unavailable), and 429 (Too Many Requests).
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = i === retries - 1;
      const status = error?.status || error?.code;
      const message = error?.message || '';
      
      const isRetryable = 
        status === 500 || 
        status === 503 || 
        status === 429 || 
        message.includes("Internal error") ||
        message.includes("Overloaded");

      if (!isLastAttempt && isRetryable) {
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`Gemini API Error (${status || 'Unknown'}). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function generateAssetContent(context: Context, blueprint: ContentBlueprint, info?: string): Promise<string> {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
    
    const narrativePrompt = blueprint.narrativeStructure.map((step, i) => `${i + 1}. ${step}`).join('\n');
    const tonePrompt = blueprint.toneAndManner.join(', ');

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      config: { temperature: 0.85 }, // 창의적 카피 — 높은 온도
      contents: `당신은 세계 최고 수준의 전략적 퍼포먼스 마케터이자 전문 카피라이터입니다.
      다음 '전략 블루프린트(Strategic Blueprint)'를 완벽하게 준수하여, 실제 마케팅 성과를 낼 수 있는 고품질 콘텐츠를 작성하십시오.
      
      [전략 컨텍스트]
      - 타겟 상황(Context): ${context.situation}
      - 타겟 채널: ${blueprint.channel} (Format: ${blueprint.format})
      - 콘텐츠 목표: ${blueprint.headlineGoal}
      - 핵심 메시지: ${blueprint.keyMessage}
      - CTA (Call To Action): ${blueprint.callToAction}
      
      [제작 가이드라인]
      1. 톤앤매너: ${tonePrompt}
      2. 필수 전개 구조 (반드시 준수할 것):
      ${narrativePrompt}
      
      [품질 보증 기준]
      - 추상적이거나 모호한 표현을 피하고, 구체적이고 설득력 있는 언어를 사용하십시오.
      - ${blueprint.channel} 채널의 특성(가독성, 호흡, 이모지 활용 등)을 최적화하십시오.
      - 독자의 행동을 유도하는 트리거를 명확히 포함하십시오.
      - **볼드체 강조 기호(**)**를 절대 사용하지 마십시오. (가독성 저해)
      
      ${info ? `[!!! 긴급 수정 요청 !!!]\n이전 생성 결과가 전략적 품질 기준에 미달했습니다. 다음 피드백을 철저히 반영하여 완전히 새롭게 작성하십시오:\n"${info}"` : ''}`,
    });
    return response.text || "";
  });
}

export async function evaluateContent(context: Context, blueprint: ContentBlueprint, content: string): Promise<ContentEvaluation> {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `제공된 콘텐츠를 전략적 맥락(Blueprint)에 따라 엄격하게 평가하십시오. 점수는 냉정하게 매기십시오.
      
      [분석 대상]
      - 상황(Context): ${context.situation}
      - 의도된 설계(Blueprint): ${JSON.stringify(blueprint.narrativeStructure)}
      - 콘텐츠 본문: "${content}"
      
      평가 기준:
      1. 설계 충실도 (Blueprint Fidelity): 제공된 내러티브 구조를 얼마나 잘 따랐는가?
      2. 의도 정렬 (Cognition Alignment): 사용자의 검색 의도/상황에 부합하는 해결책을 제시하는가?
      3. 채널 적합성 (Channel Fit): 해당 채널(플랫폼)의 문법과 스타일에 맞는가?
      
      출력 포맷: JSON (Bold체 금지)`,
      config: {
        temperature: 0.1, // 콘텐츠 평가 — 일관된 채점 위해 최저 온도
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blueprintFidelity: evaluationScoreSchema,
            intentAlignment: evaluationScoreSchema,
            cdjConsistency: evaluationScoreSchema,
            channelFit: evaluationScoreSchema,
            overallScore: { type: Type.NUMBER },
            critique: { type: Type.STRING },
            improvementHints: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["blueprintFidelity", "intentAlignment", "cdjConsistency", "channelFit", "overallScore", "critique", "improvementHints"]
        }
      }
    });
    return safeJsonParse<ContentEvaluation>(response.text);
  });
}

export async function suggestImprovements(context: Context, blueprint: ContentBlueprint, evaluation: ContentEvaluation): Promise<ImprovementSuggestion> {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `콘텐츠 개선 제안을 한국어로 생성하세요. 볼드체 사용 금지.
      상황: ${context.situation}
      비평: ${evaluation.critique}`,
      config: {
        temperature: 0.3, // 개선 제안 — 구조화된 사고
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestionId: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            revisedHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableTweak: { type: Type.STRING }
          },
          required: ["suggestionId", "title", "description", "actionableTweak"]
        }
      }
    });
    return safeJsonParse<ImprovementSuggestion>(response.text);
  });
}

export async function generateVideoProductionSuite(cep: Context, blueprint: ContentBlueprint): Promise<VideoProductionSuite> {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
    
    const isShortForm = blueprint.format === 'REELS' || blueprint.format === 'SHORTS' || blueprint.channel === 'INSTAGRAM';
    
    const promptContext = isShortForm 
      ? `Create a viral short-form video script (Instagram Reels/YouTube Shorts style). 
         Structure: 
         1. Hook (0-3s): Visually arresting, fast-paced.
         2. Body: Rapid value delivery, dynamic cuts.
         3. CTA: Clear, visual on-screen text.
         Ensure 'visual' descriptions are optimized for Veo AI video generation (cinematic, detailed lighting, camera movement).`
      : `Create a professional video production script.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${promptContext}
      Script and Shot List must be in Korean, but 'heroPrompt' MUST be in English for Veo. No bold text.
      Situation: ${cep.situation}
      Message: ${blueprint.keyMessage}`,
      config: {
        temperature: 0.75, // 비디오 스크립트 — 창의적이되 구조 준수
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            script: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { scene: { type: Type.NUMBER }, visual: { type: Type.STRING }, audio: { type: Type.STRING }, duration: { type: Type.STRING } }, required: ["scene", "visual", "audio", "duration"] } },
            shotList: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { shotNumber: { type: Type.NUMBER }, description: { type: Type.STRING }, cameraAngle: { type: Type.STRING }, lighting: { type: Type.STRING } }, required: ["shotNumber", "description", "cameraAngle", "lighting"] } },
            heroPrompt: { type: Type.STRING }
          },
          required: ["script", "shotList", "heroPrompt"]
        }
      }
    });
    return safeJsonParse<VideoProductionSuite>(response.text);
  });
}

export async function generateExecutionPlan(cep: Context, brandName: string): Promise<ExecutionPlan> {
    return withRetry(async () => {
        const ai = new GoogleGenAI({ apiKey: resolveApiKey() });

        const prompt = `
당신은 검색 전략 및 디지털 마케팅 수석 컨설턴트입니다.
아래 Context Node 데이터를 기반으로 SEO·AEO·GEO 통합 트리플 미디어 실행 계획을 수립하세요.

[Context 데이터]
- 카테고리: ${cep.category}
- 브랜드: ${brandName || '자사 브랜드'}
- 쿼리 그룹: ${cep.queryGroup || cep.situation}
- 인지 유형: ${cep.hybridCognition || cep.cognition}
- 브랜드 점유율: ${cep.brandShare ?? 0}
- 경쟁사 점유율: ${cep.competitorShare ?? 0}
- 우선순위 점수: ${cep.marketSignal.priorityScore}
- 전략 유형: ${cep.strategyType || 'monitor'}
- SERP 피처: ${cep.serpFeaturesList?.join(', ') || 'N/A'}

[출력 프레임워크: 트리플 미디어 × Hub & Spoke]

1. 상황 요약 (2-3문장): 현재 시장 포지션과 기회 분석

2. Owned Media — Hub & Spoke 전략 (핵심):
   - Hub 콘텐츠 (2-3개): 자사 홈페이지/블로그 기반 핵심 콘텐츠 (긴 형식, 권위 확보)
   - Spoke 콘텐츠 (2-3개): Hub에서 파생된 SNS/유튜브/이메일 단편 콘텐츠
   - SEO 전략 (2개): 키워드 최적화·내부링크·E-E-A-T 강화
   - AEO 전략 (2개): Featured Snippet·People Also Ask·구조화 데이터 최적화
   - GEO 전략 (2개): ChatGPT·Perplexity·Gemini 등 AI 검색 인용 최적화

3. Earned Media (2-3개): PR·커뮤니티 시딩·인플루언서·바이럴 전략

4. Paid Media (2-3개): 검색광고·디스플레이·소셜 유료 전략

5. KPI 프레임워크 (3-4개): 측정 가능한 핵심 지표

6. 리소스 강도: light / moderate / aggressive

7. FORGE 크리에이티브 — Veo 영상 프롬프트 (반드시 영어로 작성):
   - reels15s: 15초 숏폼 영상(Reels/Shorts)용 Veo 3.1 프롬프트. 이 CEP의 상황(${cep.situation})과 카테고리(${cep.category})를 시각적으로 표현하는 구체적 씬 묘사. "Cinematic 4k shot of..."로 시작. 9:16 포맷, 강한 첫 3초 훅 포함.
   - shorts30s: 30초 스토리텔링형 YouTube Shorts용 Veo 3.1 프롬프트. 문제 → 해결 → CTA 3단 구조. "Cinematic 4k sequence..."로 시작.

모든 텍스트는 한국어로 작성하고 각 항목은 구체적 액션 중심으로 작성하세요. (단, veoPrompts 항목은 반드시 영어로 작성할 것)
`;

        const ownedMediaSchema = {
            type: Type.OBJECT,
            properties: {
                hubContent:   { type: Type.ARRAY, items: { type: Type.STRING } },
                spokeContent: { type: Type.ARRAY, items: { type: Type.STRING } },
                seoStrategy:  { type: Type.ARRAY, items: { type: Type.STRING } },
                aeoStrategy:  { type: Type.ARRAY, items: { type: Type.STRING } },
                geoStrategy:  { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["hubContent", "spokeContent", "seoStrategy", "aeoStrategy", "geoStrategy"]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                temperature: 0.25, // 전략 수립 — 팩트 기반 구조화 전략
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        situationSummary:  { type: Type.STRING },
                        executionPriority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                        resourceIntensity: { type: Type.STRING, enum: ["light", "moderate", "aggressive"] },
                        ownedMedia:   ownedMediaSchema,
                        earnedMedia:  { type: Type.ARRAY, items: { type: Type.STRING } },
                        paidMedia:    { type: Type.ARRAY, items: { type: Type.STRING } },
                        kpiFramework: { type: Type.ARRAY, items: { type: Type.STRING } },
                        veoPrompts: {
                            type: Type.OBJECT,
                            properties: {
                                reels15s:  { type: Type.STRING },
                                shorts30s: { type: Type.STRING },
                            },
                            required: ["reels15s", "shorts30s"],
                        },
                    },
                    required: ["situationSummary", "executionPriority", "resourceIntensity", "ownedMedia", "earnedMedia", "paidMedia", "kpiFramework", "veoPrompts"]
                }
            }
        });

        return safeJsonParse<ExecutionPlan>(response.text);
    });
}

/**
 * Phase 1 (RAG mode): receives pre-collected SerpApiPayload from the data pipeline.
 * Phase 2 (grounding fallback): collects via Gemini Google Search when no real data provided.
 *
 * In both cases the function returns Context[] with dataProvenance set correctly so
 * the UI can display "estimated" badges wherever real data was unavailable.
 */
export async function suggestContexts(
  value: string,
  source: string = "HYBRID",
  duration: string = "30d",
  density: RetrievalDensity = { google: 3, naver: 3 },
  brandName?: string,
  competitors?: string[],
  serpData?: import('../services/dataCollection/types').SerpApiPayload
): Promise<Context[]> {
  return withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
      const targetCount = Math.min(15, Math.max(3, (density.google + density.naver) * 1.2));

      const isDateRange = duration.includes('~');
      const periodDescription = isDateRange
        ? `분석 기간: ${duration} (해당 기간의 시장 신호를 반영하세요)`
        : `분석 기간: 최근 ${duration === '7d' ? '1주' : duration === '30d' ? '1개월' : duration} 데이터 기준`;

      // ── RAG Mode: real API data provided ────────────────────────────────────
      const useRagMode = !!serpData && serpData.keywords.length > 0;

      let prompt: string;

      if (useRagMode) {
        // Compress to lightweight JSON for the prompt context
        const keywordSummary = serpData!.keywords.map(kw => ({
          keyword: kw.keyword,
          naverVolRange: kw.pcVolumeRange ?? '알 수 없음',
          hasFeaturedSnippet: kw.hasFeaturedSnippet,
          hasPAA: kw.hasPAA,
          hasAIOverview: kw.hasAIOverview,
          topTitles: kw.topResults.slice(0, 3).map(r => r.title),
          ...(kw.trendData ? {
            trend: kw.trendData.direction,          // rising|falling|stable|seasonal
            trendMomentum: kw.trendData.momentum,   // 1.2 = 20% 상승
            trendRecentAvg: kw.trendData.recentAvg, // 최근 3개월 평균 (0-100)
          } : {}),
        }));

        prompt = `당신은 C³ Cube Strategy Intelligence Engine의 시맨틱 분석 전문가입니다.

아래는 실제 검색 API(Serper.dev + Naver API)에서 수집한 ${keywordSummary.length}개의 키워드 팩트 데이터입니다.

[실제 API 수집 데이터 — 수정 불가]
${JSON.stringify(keywordSummary, null, 2)}

[당신의 역할 — 시맨틱 클러스터링 전용]
위 데이터를 바탕으로 ${Math.round(targetCount)}개의 전략적 Context 노드(CEP)를 생성하세요.
${periodDescription}

엄격한 제약 조건:
- 위 데이터에 없는 키워드를 만들어내지 마세요
- 검색량 수치를 임의로 변경하거나 발명하지 마세요
- 당신의 역할은 오직 (1) 의미론적 클러스터링, (2) 인지 의도 분류, (3) CDJ 단계 매핑입니다

각 CEP에 대해 생성할 것:
1. queryGroup: 의미론적 클러스터 명칭 (한국어)
2. situation: 사용자가 이 클러스터를 검색하는 구체적 상황 (한국어)
3. description: 전략적 함의 설명 (한국어, 2~3문장)
4. cognition: "informational" | "exploratory" | "commercial" | "transactional"
5. cognitionConfidence: 0.0~1.0
6. conversionStage: "awareness" | "consideration" | "decision" | "post_purchase"
7. actions: 권장 마케팅 액션 3~4개

Language: 모든 텍스트 필드는 한국어로 작성하세요.`;

      } else {
        // Grounding fallback — honest about estimation
        const competitorText = competitors?.length
          ? `추적 대상 경쟁사: '${competitors.join("', '")}'.`
          : '';
        const brandText = brandName ? `자사 브랜드: '${brandName}'.` : '';

        prompt = `당신은 C³ Cube Strategy Intelligence Engine입니다.
"${value}" 카테고리를 분석하여 ${Math.round(targetCount)}개의 전략적 Context 노드(CEP)를 식별하세요.
${periodDescription}

[주의: 실제 검색 API 데이터 없이 AI 추론 기반으로 분석합니다]
Language: Korean (모든 텍스트 필드).

REQUIREMENTS:
1. queryGroup: 시맨틱 클러스터 명칭
2. cognition: "informational" | "exploratory" | "commercial" | "transactional"
3. cognitionConfidence: 0.0~1.0
4. serpFeatures: SERP에서 관찰될 피처 목록 (예: ["Shopping", "Ads", "Video"])
5. brandPresence: Google Search 도구로 실제 검색 후 상위 결과에서 브랜드 언급 수를 계산하세요.
   - ${brandText}
   - ${competitorText}
   - 결과: [{brand: "브랜드명", count: N}, ...] — count는 실제 검색 결과에서 확인된 언급 수
6. estimatedTotalResults: 검색량 추정값 (AI 추론, 실제 API 값이 아님)
7. naverQueryVolume & googleQueryVolume: 플랫폼별 상대적 검색 비중 (0-100, AI 추론)
   - 커뮤니티/리뷰 중심 Context → 네이버 점수 높음
   - 기술/정보/글로벌 Context → 구글 점수 높음
   - 획일적으로 100을 부여하지 말 것

situation, description, conversionStage, actions도 생성하세요.`;
      }

      const config: any = {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ceps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: contextSchemaProperties,
                required: ["id", "situation", "description", "queryGroup", "cognition", "cognitionConfidence",
                           "serpFeatures", "brandPresence", "estimatedTotalResults",
                           "naverQueryVolume", "googleQueryVolume", "conversionStage", "actions"]
              }
            }
          },
          required: ["ceps"]
        }
      };

      // Only use Google Search grounding in fallback mode (not in RAG mode)
      if (!useRagMode) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config,
      });

      const parsedResponse = safeJsonParse<{ ceps: any[] }>(response.text);
      const rawCeps = parsedResponse.ceps as any[];
      const groundingSources = extractGroundingSources(response.candidates);

      return rawCeps.map(cep => {
        const serpList: string[] = cep.serpFeatures || [];
        const hasShopping = serpList.some((s: string) => s.toLowerCase().includes('shopping'));
        const adCount = serpList.some((s: string) => s.toLowerCase().includes('ads')) ? 3 : 0;

        const cognitionKey = resolveCognition({
          rawCognition: cep.cognition,
          keywords: cep.keywords?.map((k: any) => k.keyword) || [],
          serpFeatures: { hasShopping, adCount },
          brandName,
          competitors,
        });

        // Resolve SERP feature flags from real data when available
        const matchedSerpKw = useRagMode
          ? serpData!.keywords.find(k => k.keyword === (cep.keywords?.[0]?.keyword ?? ''))
          : undefined;

        const baseContext: Context = {
          id: cep.id || `ctx-${Math.random().toString(36).substr(2, 9)}`,
          category: value,
          situation: cep.situation,
          description: cep.description,

          queryGroup: cep.queryGroup,
          cognitionConfidence: cep.cognitionConfidence,
          estimatedTotalResults: cep.estimatedTotalResults,
          serpFeaturesList: serpList,
          brandPresence: cep.brandPresence,
          brandPresenceSource: useRagMode ? 'api' : 'ai_simulated',

          // Data provenance — drives "estimated" badge in UI
          dataProvenance: useRagMode ? 'api' : 'grounding_estimate',

          // SERP feature flags for AEO/GEO trigger logic
          serpFeatureFlags: matchedSerpKw ? {
            hasFeaturedSnippet: matchedSerpKw.hasFeaturedSnippet,
            hasPAA: matchedSerpKw.hasPAA,
            hasAIOverview: matchedSerpKw.hasAIOverview,
            hasShopping: matchedSerpKw.hasShopping,
            hasVideoCarousel: matchedSerpKw.hasVideoCarousel,
            paaQuestions: matchedSerpKw.paaQuestions,
          } : undefined,

          // Naver DataLab 트렌드 (대표 키워드 기준)
          ...(matchedSerpKw?.trendData ? {
            trendDirection: matchedSerpKw.trendData.direction,
            trendMomentum: matchedSerpKw.trendData.momentum,
            trendRecentAvg: matchedSerpKw.trendData.recentAvg,
          } : {}),

          volumeProxy: cep.estimatedTotalResults || 0,
          searchCognitionRaw: cep.cognition,
          cognition: cognitionKey as any,
          serpFeatures: { hasShopping, adCount },

          metadata: {
            category: value,
            industry: "General",
            keywords: cep.keywords || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: source as any,
          },
          marketSignal: {
            naverScore: cep.naverQueryVolume ?? Math.min(100, Math.round((cep.estimatedTotalResults || 0) / 500)),
            googleScore: cep.googleQueryVolume ?? Math.min(100, Math.round((cep.estimatedTotalResults || 0) / 600)),
            trendDirection: "UP",
            clusterName: cep.queryGroup,
            priorityScore: Math.round(((cep.cognitionConfidence || 0.5) * 100)),
            volumeIsEstimated: !useRagMode,
            naverVolumeRange: matchedSerpKw?.pcVolumeRange ?? undefined,
            mobileVolumeRange: matchedSerpKw?.mobileVolumeRange ?? undefined,
          },
          journey: {
            conversionStage: cep.conversionStage as ConversionStage,
            confidence: cep.cognitionConfidence || 0.8,
            cognitionVector: mapCognitionToVector(cep.cognition),
          },
          actions: (cep.actions || []).map((a: any, idx: number) => ({
            id: `act-${idx}`,
            label: a.label,
            channel: a.channel,
            format: a.format,
            objective: a.objective || cep.conversionStage,
            rationale: a.rationale,
            priorityScore: 90,
            cognition: mapCognitionToVector(cep.cognition),
            conversionStage: cep.conversionStage,
          })),
          groundingSources,
        };

        return calculateBrandMetrics(baseContext, brandName || '', competitors || []);
      }).slice(0, 15);
  });
}

// Helper to create vector from single cognition enum
function mapCognitionToVector(cognition: string): { informational: number; exploratory: number; commercial: number; transactional: number } {
    const v = { informational: 0.1, exploratory: 0.1, commercial: 0.1, transactional: 0.1 };
    if (cognition === 'informational') v.informational = 0.9;
    if (cognition === 'exploratory') v.exploratory = 0.9;
    if (cognition === 'commercial') v.commercial = 0.9;
    if (cognition === 'transactional') v.transactional = 0.9;
    return v;
}

export async function fetchAndClassifyRawData(
    keyword: string, 
    density: RetrievalDensity, 
    discoveryDuration: string
): Promise<RawDataItem[]> {
    return withRetry(async () => {
        const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
        
        const googleCount = density.google > 0 ? density.google * 5 : 0;
        const naverCount = density.naver > 0 ? density.naver * 5 : 0;
        const totalCount = googleCount + naverCount;

        if (totalCount === 0) return [];

        // Gemini의 googleSearch 도구는 Google만 접근 가능합니다.
        // 'NAVER' retrieval_source는 실제 Naver API 데이터가 아닌
        // 콘텐츠 성격(커뮤니티/리뷰 vs 공식/글로벌)에 따른 분류입니다.
        // 실제 Naver 데이터는 services/dataCollection/naverClient.ts에서 처리합니다.
        const prompt = `당신은 검색 컨텍스트 분석가입니다. Google 검색 도구를 사용하여 키워드 "${keyword}"에 대한 실제 검색 결과를 수집하고 분류하세요.

[수집 지침]
1. 총 ${totalCount}개의 검색 결과 수집:
   - Google 일반 검색으로 ${googleCount}개: 웹, 뉴스, 전문 아티클
   - 한국 커뮤니티/후기 성격 콘텐츠 ${naverCount}개: 한국어 블로그, 커뮤니티, 리뷰 중심 결과

2. retrieval_source 분류 기준 (콘텐츠 성격 기반):
   - 한국어 블로그·커뮤니티·리뷰·사용자 경험 성격 → 'NAVER'
   - 공식 사이트·뉴스·학술·글로벌 콘텐츠 → 'GOOGLE'

3. 모든 텍스트 필드는 한국어로 작성하세요.
   통계적 대표성 확보: 롱테일 키워드와 틈새 시장 신호까지 포괄하세요.

4. 메타데이터:
   - setting_google_level: ${density.google}
   - setting_naver_level: ${density.naver}
   - setting_duration: "${discoveryDuration}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                temperature: 0.1, // SERP 데이터 분류 — 팩트 그대로
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING, description: "데이터 포인트의 고유 ID." },
                            extraction_keyword: { type: Type.STRING },
                            retrieval_source: { type: Type.STRING, enum: ['GOOGLE', 'NAVER'] },
                            timestamp: { type: Type.STRING, description: "ISO 8601 형식." },
                            title: { type: Type.STRING },
                            uri: { type: Type.STRING },
                            snippet: { type: Type.STRING },
                            context_cluster_id: { type: Type.STRING, description: "시맨틱 클러스터에 대한 일관된 ID." },
                            context_cluster_name: { type: Type.STRING, description: "클러스터에 대한 사람이 읽을 수 있는 한국어 이름." },
                            inferred_conversion_stage: { type: Type.STRING, enum: ['awareness', 'consideration', 'decision', 'post_purchase'] },
                            dominant_cognition: { type: Type.STRING, enum: ['informational', 'exploratory', 'transactional', 'commercial'] },
                            serp_features: { type: Type.STRING, description: "예: Video, Shopping Ad, Organic, Q&A, Image Pack" },
                            relevance_score: { type: Type.NUMBER, description: "키워드와의 관련성을 나타내는 0에서 100까지의 점수." },
                            setting_google_level: { type: Type.NUMBER },
                            setting_naver_level: { type: Type.NUMBER },
                            setting_duration: { type: Type.STRING },
                        },
                        required: ["id", "extraction_keyword", "retrieval_source", "timestamp", "title", "uri", "snippet", "context_cluster_id", "context_cluster_name", "inferred_conversion_stage", "dominant_cognition", "serp_features", "relevance_score", "setting_google_level", "setting_naver_level", "setting_duration"]
                    }
                }
            }
        });

        return safeJsonParse<RawDataItem[]>(response.text);
    });
}

// ── Temporal Comparison Insights ──────────────────────────────────────────

import type { TemporalComparison, TemporalInsight } from '../core/analysis/temporalComparison';

export async function generateTemporalInsights(
  comparison: TemporalComparison,
  category: string,
): Promise<TemporalInsight[]> {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: resolveApiKey() });

    const periodALabel = comparison.snapshotA.label;
    const periodBLabel = comparison.snapshotB.label;

    const matchedSummary = comparison.matched.map(m => ({
      cluster: m.cepA.marketSignal?.clusterName || m.cepA.situation,
      changeType: m.changeType,
      changePct: m.scoreChangePct.toFixed(1) + '%',
      scoreA: m.cepA.marketSignal?.priorityScore,
      scoreB: m.cepB.marketSignal?.priorityScore,
      cognitionA: m.cepA.cognition,
      cognitionB: m.cepB.cognition,
      cognitionShift: m.cognitionShift,
    }));

    const emergingSummary = comparison.emerging.map(c => ({
      cluster: c.marketSignal?.clusterName || c.situation,
      score: c.marketSignal?.priorityScore,
      cognition: c.cognition,
    }));

    const disappearedSummary = comparison.disappeared.map(c => ({
      cluster: c.marketSignal?.clusterName || c.situation,
      score: c.marketSignal?.priorityScore,
      cognition: c.cognition,
    }));

    const prompt = `당신은 디지털 마케팅 전략 전문가입니다. 두 기간의 검색 Context 분석 결과를 비교하여 전략적 시사점을 도출하세요.

[분석 카테고리]
${category}

[기간 비교]
- Period A (기준): ${periodALabel}
- Period B (현재): ${periodBLabel}

[지속 Context (매칭됨)]
${JSON.stringify(matchedSummary, null, 2)}

[신규 출현 Context (Emerging)]
${JSON.stringify(emergingSummary, null, 2)}

[소멸 Context (Disappeared)]
${JSON.stringify(disappearedSummary, null, 2)}

[지시사항]
위 데이터를 분석하여 5~7개의 전략적 인사이트를 JSON 배열로 생성하세요.
각 인사이트는 반드시 다음 중 하나의 관점에서 작성하세요:
- "aeo": Answer Engine Optimization (AI 검색엔진 최적화) 관점
- "geo": Generative Engine Optimization (생성형 AI 최적화) 관점
- "trend": 검색 트렌드 변화 분석
- "opportunity": 경쟁 기회 포착
- "warning": 위험 신호 또는 주의 필요 영역

각 인사이트는 구체적이고 실행 가능한 내용을 담아야 합니다.
**볼드체 기호(**) 사용 금지.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.35, // 시계열 인사이트 — 분석 + 해석 균형
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['aeo', 'geo', 'trend', 'opportunity', 'warning'] },
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
            },
            required: ['type', 'title', 'content', 'priority'],
          },
        },
      },
    });

    return safeJsonParse<TemporalInsight[]>(response.text) || [];
  });
}

/**
 * 실측 데이터 파이프라인용 시드 키워드 생성.
 * Serper/Naver API 호출 전 카테고리에서 검색할 대표 키워드 10~20개를 추출.
 * 빠른 응답을 위해 Flash 모델 + 낮은 Temperature 사용.
 */
export async function generateSeedKeywords(
  category: string,
  count = 15,
): Promise<string[]> {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `한국 검색 시장 기준으로 "${category}" 카테고리를 검색할 때 실제로 사용하는 대표 키워드 ${count}개를 추출하세요.
검색 의도(Informational/Exploratory/Commercial/Transactional)가 고루 포함되도록 다양하게 선택하세요.
반드시 실제 검색어처럼 작성하세요 (예: "남성 스킨케어 추천", "남성 로션 성분 비교").
JSON 배열로만 출력하세요: ["키워드1", "키워드2", ...]`,
      config: {
        temperature: 0.15,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });
    const result = safeJsonParse<string[]>(response.text);
    return Array.isArray(result) ? result.slice(0, count) : [category];
  });
}

// ── Viz AI 요약 공통 타입 ──────────────────────────────────────────────────
export interface VizSummary {
  headline: string;    // 한 줄 핵심 인사이트
  insights: string[];  // 구체적 발견 3개
  action: string;      // 즉시 실행 가능한 권장 액션
}

const VIZ_SUMMARY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headline:  { type: Type.STRING },
    insights:  { type: Type.ARRAY, items: { type: Type.STRING } },
    action:    { type: Type.STRING },
  },
  required: ['headline', 'insights', 'action'],
};

// ── Journey Ladder 요약 ───────────────────────────────────────────────────
export async function generateLadderSummary(
  contexts: Context[],
  category: string,
): Promise<VizSummary> {
  const stageCounts: Record<string, number> = {
    awareness: 0, consideration: 0, decision: 0, post_purchase: 0,
  };
  contexts.forEach(c => {
    const s = c.cdjStage ?? c.cognitionVector?.dominant_cognition ?? '';
    if (s in stageCounts) stageCounts[s as keyof typeof stageCounts]++;
  });
  const topByStage = Object.entries(stageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([stage, count]) => `${stage}: ${count}개`).join(', ');
  const topSignals = contexts
    .sort((a, b) => (b.finalPriorityScore ?? 0) - (a.finalPriorityScore ?? 0))
    .slice(0, 5)
    .map(c => c.situation).join(' / ');

  const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `당신은 디지털 마케팅 전략 컨설턴트입니다. "${category}" 카테고리의 C³ Journey Ladder 분석 결과를 비전문가도 이해할 수 있도록 해석해 주세요.

[단계별 시그널 분포]
${topByStage}
(전체 ${contexts.length}개 시그널)

[우선순위 상위 시그널]
${topSignals}

[해석 기준]
- Awareness(인지): 아직 제품/서비스를 모르는 사람들의 탐색
- Consideration(고려): 비교·정보 수집 단계의 검색
- Decision(결정): 구매 직전 최종 확인 단계
- Post-Purchase(구매후): 기존 사용자의 심화 탐색

분석 요청:
1. headline: 이 데이터가 보여주는 가장 중요한 마케팅 기회를 한 문장으로 (예: "고려 단계 시그널이 부재 — 비교 콘텐츠로 리드 전환 기회 존재")
2. insights: 3가지 구체적 발견 (각 40자 이내, 숫자 포함 권장)
3. action: 지금 당장 실행할 수 있는 가장 중요한 한 가지 마케팅 액션

모든 내용은 한국어로 작성하세요.`,
    config: {
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: VIZ_SUMMARY_SCHEMA,
    },
  });
  return safeJsonParse<VizSummary>(response.text) ?? {
    headline: '데이터 해석 중 오류가 발생했습니다.',
    insights: [],
    action: '',
  };
}

// ── Strategic Heatmap 요약 ────────────────────────────────────────────────
export async function generateHeatmapSummary(
  contexts: Context[],
  category: string,
): Promise<VizSummary> {
  const cognitionCounts: Record<CognitionKey, number> = {
    informational: 0, exploratory: 0, commercial: 0, transactional: 0,
  };
  const strategyCounts: Record<string, number> = {};
  contexts.forEach(c => {
    const cog = (c.hybridCognition ?? c.cognition ?? 'informational') as CognitionKey;
    if (cog in cognitionCounts) cognitionCounts[cog]++;
    const st = c.strategyType ?? 'monitor';
    strategyCounts[st] = (strategyCounts[st] ?? 0) + 1;
  });
  const highPriority = contexts
    .filter(c => (c.finalPriorityScore ?? 0) >= 70)
    .sort((a, b) => (b.finalPriorityScore ?? 0) - (a.finalPriorityScore ?? 0))
    .slice(0, 4)
    .map(c => `${c.situation}(점수:${Math.round(c.finalPriorityScore ?? 0)})`).join(', ');

  const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `당신은 디지털 마케팅 전략 컨설턴트입니다. "${category}" 카테고리의 Strategic Heatmap 분석 결과를 해석해 주세요.

[인지 유형별 분포 (Cognition × Context)]
- 정보 탐색(Informational): ${cognitionCounts.informational}개
- 탐색적(Exploratory): ${cognitionCounts.exploratory}개
- 상업적(Commercial): ${cognitionCounts.commercial}개
- 전환(Transactional): ${cognitionCounts.transactional}개

[전략 유형별 분포]
${Object.entries(strategyCounts).map(([k, v]) => `${k}: ${v}개`).join(', ')}

[최우선 시그널 (점수 70+ 이상)]
${highPriority || '없음'}

분석 요청:
1. headline: 히트맵이 보여주는 가장 뜨거운 전략 기회를 한 문장으로
2. insights: 3가지 구체적 발견 (인지 유형 분포, 전략 집중점, 놓친 기회)
3. action: 히트맵 기반 최우선 콘텐츠 전략 한 가지

모든 내용은 한국어로 작성하세요.`,
    config: {
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: VIZ_SUMMARY_SCHEMA,
    },
  });
  return safeJsonParse<VizSummary>(response.text) ?? {
    headline: '데이터 해석 중 오류가 발생했습니다.',
    insights: [],
    action: '',
  };
}

// ── Similarity Network 요약 ───────────────────────────────────────────────
export async function generateNetworkSummary(
  contexts: Context[],
  category: string,
): Promise<VizSummary> {
  const groups: Record<string, Context[]> = {};
  contexts.forEach(c => {
    const g = c.queryGroup ?? '미분류';
    if (!groups[g]) groups[g] = [];
    groups[g].push(c);
  });
  const clusterSummary = Object.entries(groups)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6)
    .map(([g, cs]) => `"${g}"(${cs.length}개)`)
    .join(', ');
  const isolated = contexts.filter(c => !c.queryGroup || c.queryGroup === '기타').length;
  const brandDense = contexts
    .filter(c => (c.brandPresence?.length ?? 0) >= 2)
    .slice(0, 3)
    .map(c => c.situation).join(', ');

  const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `당신은 디지털 마케팅 전략 컨설턴트입니다. "${category}" 카테고리의 Similarity Network 분석 결과를 해석해 주세요.

[클러스터 구성 (상위 6개)]
${clusterSummary || '클러스터 없음'}
(전체 ${contexts.length}개 중 독립/미분류: ${isolated}개)

[브랜드 존재감이 높은 시그널]
${brandDense || '없음'}

[해석 기준]
- 큰 클러스터: 시장이 집중된 전쟁터 → 차별화 필요
- 작은 고립 노드: 아직 경쟁이 적은 블루오션 기회
- 브랜드 밀집 구간: 이미 경쟁이 치열한 영역

분석 요청:
1. headline: 네트워크 구조가 보여주는 경쟁 지형의 핵심을 한 문장으로
2. insights: 3가지 구체적 발견 (최대 클러스터 의미, 블루오션 기회, 브랜드 전략)
3. action: 네트워크 기반 포지셔닝 전략 한 가지

모든 내용은 한국어로 작성하세요.`,
    config: {
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: VIZ_SUMMARY_SCHEMA,
    },
  });
  return safeJsonParse<VizSummary>(response.text) ?? {
    headline: '데이터 해석 중 오류가 발생했습니다.',
    insights: [],
    action: '',
  };
}
