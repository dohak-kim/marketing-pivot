
import { GoogleGenAI, Type } from "@google/genai";
import type { 
  AnalysisResultItem, 
  Cluster, 
  ClusterResult, 
  AeoContent, 
  AeoScoreReport, 
  KeywordIntelligence, 
  FullAnalysisResult, 
  BatchSummaryReport,
  ImageStyleConfig
} from '../types';

function resolveApiKey(): string {
  const sources = [
    () => process.env.GEMINI_API_KEY,
    () => process.env.API_KEY,
    () => (import.meta as any)?.env?.VITE_API_KEY,
  ];
  for (const get of sources) {
    try { const v = get(); if (v && v !== 'undefined') return v.trim(); } catch {}
  }
  return '';
}

function resolveSerperKey(): string {
  const sources = [
    () => process.env.VITE_SERPER_API_KEY,
    () => (import.meta as any)?.env?.VITE_SERPER_API_KEY,
  ];
  for (const get of sources) {
    try { const v = get(); if (v && v !== 'undefined') return v.trim(); } catch {}
  }
  return '';
}

const getAi = () => new GoogleGenAI({ apiKey: resolveApiKey() });

export const identifyKeywordLevel = async (query: string): Promise<KeywordIntelligence> => {
  if (!query || query.length < 2) return { 
    level: 'Unknown', description: '', marketingGoal: '', potentialScore: 0, 
    cdjStage: 'Unknown', searchIntent: 'Unknown' 
  };

  const prompt = `
당신은 마케팅 전략 전문가입니다. 다음 키워드를 'CDJ MASTER' 프레임워크에 따라 정밀 분석하십시오.
키워드: "${query}"

[분류 지침]
- 모든 응답은 반드시 한국어로 작성하십시오.
- 키워드가 산업(Industry), 카테고리(Category), 브랜드(Brand), 제품(Product) 중 어디에 속하는지 명확히 판별하십시오.
- CDJ Stage: '인지(Awareness)', '고려(Consideration)', '결정(Decision)', '사후 관리(Post-Management)' 중 반드시 택 1
- Search Intent: '정보성(Informational)', '탐색성(Navigational)', '상업성(Commercial)', '전환성(Transactional)' 중 반드시 택 1

JSON 형식으로 응답하십시오.
`;

  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.STRING, enum: ['Industry', 'Category', 'Brand', 'Product', 'Unknown'] },
            description: { type: Type.STRING },
            marketingGoal: { type: Type.STRING },
            cepInsight: { type: Type.STRING },
            targetInsight: { type: Type.STRING },
            actionPlan: { type: Type.STRING },
            potentialScore: { type: Type.NUMBER },
            cdjStage: { type: Type.STRING, enum: ['인지(Awareness)', '고려(Consideration)', '결정(Decision)', '사후 관리(Post-Management)', 'Unknown'] },
            searchIntent: { type: Type.STRING, enum: ['정보성(Informational)', '탐색성(Navigational)', '상업성(Commercial)', '전환성(Transactional)', 'Unknown'] }
          },
          required: ["level", "description", "marketingGoal", "potentialScore", "cdjStage", "searchIntent", "cepInsight", "targetInsight", "actionPlan"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (e) {
    return { 
      level: 'Unknown', description: '분석 불가', marketingGoal: '데이터 부족', 
      potentialScore: 0, cdjStage: 'Unknown', searchIntent: 'Unknown' 
    };
  }
};

export const getSearchData = async (query: string, timeFilter: string, num: number = 20): Promise<{ snippets: string; related: string }> => {
    const serperKey = resolveSerperKey();
    if (!serperKey) throw new Error("Serper API key is not configured.");
    const url = "/api/serper/search";
    const payload = JSON.stringify({ q: query, gl: "kr", hl: "ko", tbs: timeFilter, num: num });

    try {
        const response = await fetch(url, { method: 'POST', headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' }, body: payload });
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const results = await response.json();
        return {
            snippets: (results.organic || []).map((res: any) => res.snippet).join('\n'),
            related: (results.relatedSearches || []).map((res: any) => res.query).join(', ')
        };
    } catch (e) {
        throw new Error("실시간 검색 데이터를 가져오는 데 실패했습니다.");
    }
};

export const analyzeTrends = async (snippets: string, related: string, dataVolume: number, kwIntel: KeywordIntelligence): Promise<AnalysisResultItem[]> => {
  const targetCount = dataVolume <= 20 ? 4 : dataVolume <= 50 ? 6 : 10;
  const prompt = `
당신은 시장 기회 탐색 전문가입니다. 분석 중인 키워드 위계는 [${kwIntel.level}] 입니다.
입력 데이터에서 소비자들의 다양한 '상황적 진입점(CEP)'을 추출하십시오.

[지침]
1. 다양성 확보: 상황(When), 장소(Where), 목적(Why)이 서로 겹치지 않는 최소 ${targetCount}개 이상의 CEP 후보를 찾으십시오.
2. 위계 준수: [${kwIntel.level}] 카테고리 본연의 목적에 부합하는 거시적 상황을 우선하십시오. (부품/세부속성 매몰 방지)
3. 100% 한국어: 모든 결과 필드에 영어를 절대 사용하지 마십시오.
4. 노이즈 제거: 광고나 무관한 정보는 무시하십시오.

결과를 JSON 형식으로 반환하십시오.
  `;

  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash',
      contents: prompt + `\n\nINPUT DATA:\nSnippets: ${snippets}\nRelated: ${related}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              cep: {
                type: Type.OBJECT,
                properties: {
                  when: { type: Type.STRING },
                  where: { type: Type.STRING },
                  why: { type: Type.STRING },
                  with: { type: Type.STRING },
                },
                required: ["when", "where", "why", "with"]
              },
              painPoint: { type: Type.STRING },
              percentage: { type: Type.NUMBER }
            },
            required: ["cep", "painPoint", "percentage"]
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (e) {
    throw new Error("분석 중 오류 발생");
  }
};

export const generateTargetProfiles = async (ceps: AnalysisResultItem[], dataVolume: number, kwIntel: KeywordIntelligence): Promise<ClusterResult> => {
  const maxPossibleClusters = Math.max(1, Math.min(ceps.length, 4));
  const preferredClusters = dataVolume <= 30 ? 2 : dataVolume <= 60 ? 3 : 4;
  const clusterCount = Math.min(maxPossibleClusters, preferredClusters);

  const prompt = `입력된 CEP들을 기반으로 시장을 **정확히 ${clusterCount}개의 타겟 클러스터**로 그룹화하십시오.

[필수 요구사항]
1. 정합성: 모든 CEP는 반드시 최소 하나의 클러스터에 할당되어야 합니다.
2. 위계: 하위 속성이 아닌 소비자의 라이프스타일과 구매 동기(Hierarchy) 중심으로 분류하십시오.
3. 100% 한국어: 영어를 절대 노출하지 마십시오.
4. 구어체: 트리거 상황(cep_trigger)은 소비자의 생생한 목소리로 작성하십시오.

JSON으로만 응답하십시오.`;

  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt + `\n\nINPUT DATA:\n${JSON.stringify(ceps)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
                clusters: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            target: {
                                type: Type.OBJECT,
                                properties: {
                                    demographics: { type: Type.STRING },
                                    media_habit: { type: Type.STRING }
                                },
                                required: ["demographics", "media_habit"]
                            },
                            cep_trigger: { type: Type.STRING },
                            percentage: { type: Type.NUMBER },
                            linkedCepIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                        },
                        required: ["name", "target", "cep_trigger", "percentage", "linkedCepIndices"]
                    }
                }
            },
            required: ["clusters"]
          }
        }
      });
      
      const result: ClusterResult = JSON.parse(response.text.trim());

      if (result.clusters && result.clusters.length > 0) {
          const totalRaw = result.clusters.reduce((acc, c) => acc + (c.percentage || 0), 0);
          if (totalRaw > 0) {
              result.clusters = result.clusters.map(c => ({
                  ...c,
                  percentage: Math.round(((c.percentage || 0) / totalRaw) * 100)
              }));
              const currentTotal = result.clusters.reduce((acc, c) => acc + c.percentage, 0);
              const diff = 100 - currentTotal;
              if (diff !== 0) {
                  const sorted = [...result.clusters].sort((a, b) => b.percentage - a.percentage);
                  const targetIndex = result.clusters.findIndex(c => c.name === sorted[0].name);
                  result.clusters[targetIndex].percentage += diff;
              }
          }
      }
      return result;
  } catch (e) {
    throw new Error("프로필 생성 실패");
  }
};

export const generateAeoContent = async (cluster: Cluster, format: 'blog' | 'linkedin'): Promise<AeoContent> => {
    const isBlog = format === 'blog';
    
    // 블로그 콘텐츠일 경우 롱폼(Long-form) 지침 강화
    const lengthGuideline = isBlog 
      ? `
[블로그 분량 가이드 - 필수]
- 전체 글자 수: 공백 포함 최소 1,800자 ~ 최대 2,500자 사이로 작성하십시오.
- 단락 구성: 최소 5개 ~ 최대 6개의 상세 섹션(Sections)을 구성하십시오.
- 내용 밀도: 각 섹션의 본문(body)은 단순히 짧은 요약이 아니라, 구체적인 이유, 사례, 데이터적 근거, 해결책 등을 상세히 서술하여 독자가 충분한 정보를 얻을 수 있도록 하십시오.
- 전문성: 검색 엔진이 '깊이 있는 전문가의 글'로 인식하도록 풍부한 어휘와 논리적 구조를 사용하십시오.`
      : "";

    const basePrompt = `당신은 세계 최고의 AEO(Answer Engine Optimization) 전략가입니다. 
    SearchGPT 등이 이 콘텐츠를 최상단 '추천 스니펫'으로 채택하도록 고도화된 콘텐츠를 작성하십시오.
    
    모든 텍스트는 한국어로 작성하되, AI 답변 엔진이 파싱하기 좋은 형태를 유지하십시오.
    목표 점수는 85점 이상입니다.
    ${lengthGuideline}`;

    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: basePrompt + `\n\nTarget: ${cluster.name}\nTrigger: ${cluster.cep_trigger}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: isBlog ? blogSchema : linkedinSchema
            }
        });
        const result = JSON.parse(response.text.trim());
        result.format = format;
        return { ...result, targetClusterName: cluster.name };
    } catch (e) {
        throw new Error("AEO 생성 실패");
    }
};

const blogSchema = {
    type: Type.OBJECT,
    properties: {
        format: { type: Type.STRING },
        title: { type: Type.STRING },
        introduction: { type: Type.STRING, description: "독자의 흥미를 유발하고 주제를 관통하는 풍부한 도입부 (300자 내외)" },
        sections: { 
            type: Type.ARRAY, 
            description: "5~6개의 상세 전문 섹션",
            items: { 
                type: Type.OBJECT, 
                properties: { 
                    heading: { type: Type.STRING }, 
                    body: { type: Type.STRING, description: "해당 소주제에 대한 상세 설명, 통찰, 팁 등을 포함한 풍부한 텍스트 (400자 내외)" } 
                }, 
                required: ["heading", "body"] 
            } 
        },
        conclusion: { type: Type.STRING, description: "전체 내용을 요약하고 독자의 행동을 유도하는 강력한 결론 (300자 내외)" }
    },
    required: ["format", "title", "introduction", "sections", "conclusion"]
};

const linkedinSchema = {
    type: Type.OBJECT,
    properties: { 
        format: { type: Type.STRING }, 
        hook: { type: Type.STRING }, 
        body: { type: Type.STRING }, 
        hashtags: { type: Type.STRING } 
    },
    required: ["format", "hook", "body", "hashtags"]
};

/**
 * 이미지 생성 함수: 한글 깨짐 방지를 위해 영문 텍스트 레이블 사용을 엄격히 강제합니다.
 */
export const generateSectionImage = async (heading: string, body: string, style: ImageStyleConfig): Promise<string> => {
  // 한글 깨짐 방지를 위해 영문만 사용하도록 프롬프트 강화
  const textGuideline = `
    **STRICT RULES FOR TEXT RENDERING**:
    - DO NOT USE ANY KOREAN CHARACTERS. Korean text results in broken images.
    - If labels are needed, use ONLY SIMPLE ENGLISH KEYWORDS (e.g., "MARKET", "PLAN", "USER").
    - Prefer a clean composition WITHOUT ANY TEXT to ensure professional quality.
    - Use symbolic visuals to represent the concepts instead of written words.
  `;

  const prompt = `
    Create a professional ${style.type} for a digital marketing report.
    Theme: "${heading}" (Translate the core concept of this Korean heading into a visual metaphor).
    Visual Style: ${style.tone} manner, ${style.color} color palette.
    High resolution, 4k detail, professional composition, 16:9 aspect ratio.
    
    ${textGuideline}
    
    The image should visually explain the following context: "${body.substring(0, 150)}..."
  `;

  try {
    // Imagen 3 — 순수 text-to-image, 참조 이미지 없음. 텍스트 없는 비주얼 품질 최우수
    const ai = getAi();
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: { numberOfImages: 1, aspectRatio: '16:9' },
    });

    const bytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!bytes) throw new Error("이미지 데이터가 응답에 포함되지 않았습니다.");
    return `data:image/jpeg;base64,${bytes}`;
  } catch (e: any) {
    console.error("Image Generation Error:", e);
    throw new Error(e.message || "이미지 생성 중 오류가 발생했습니다.");
  }
};

export const getAeoScore = async (content: AeoContent, keyword: string): Promise<AeoScoreReport> => {
    const prompt = `당신은 AI 답변 엔진(SearchGPT, Perplexity)의 채택 알고리즘 감사관입니다. 
    다음 콘텐츠의 AEO 점수를 **가중치 합산 방식**으로 평가하십시오.

    [배점 및 가중치 규칙 - 절대 준수]
    1. 직접성 (Directness): 0점 ~ 30점 사이에서 평가. (도입부의 즉각적 답변 품질)
    2. 엔티티 (Entity): 0점 ~ 30점 사이에서 평가. (전문 용어, 수치, 고유 명사 활용도)
    3. 신뢰성 (Reliability): 0점 ~ 20점 사이에서 평가. (논리적 흐름과 객관적 문체)
    4. 구조화 (Structure): 0점 ~ 20점 사이에서 평가. (헤더 위계 및 리스트 구조화)

    * 합계: score 필드는 breakdown의 네 항목 점수의 합계여야 합니다. (0~100점)`;

    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: prompt + `\n\n키워드: ${keyword}\n콘텐츠: ${JSON.stringify(content)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        breakdown: {
                            type: Type.OBJECT,
                            properties: {
                                directness: { type: Type.NUMBER },
                                entity: { type: Type.NUMBER },
                                reliability: { type: Type.NUMBER },
                                structure: { type: Type.NUMBER },
                            },
                            required: ["directness", "structure", "entity", "reliability"]
                        },
                        feedback: { type: Type.STRING },
                        suggestion: { type: Type.STRING },
                    },
                    required: ["score", "breakdown", "feedback", "suggestion"]
                }
            },
        });
        return JSON.parse(response.text.trim());
    } catch (e) {
        throw new Error("AEO 진단 실패");
    }
};

export const improveAeoContentBasedOnDiagnosis = async (content: AeoContent, diagnosis: AeoScoreReport, targetCluster: Cluster, keyword: string): Promise<AeoContent> => {
    const prompt = `[AEO 고도화] 제언("${diagnosis.suggestion}")을 반영하여 고도화하십시오. 
    이전보다 더욱 상세하고 풍부하게 작성하여 분량을 확보하십시오.`;
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: prompt + `\n\n원본: ${JSON.stringify(content)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: content.format === 'blog' ? blogSchema : linkedinSchema
            }
        });
        const result = JSON.parse(response.text.trim());
        result.format = content.format;
        return { ...result, targetClusterName: content.targetClusterName };
    } catch (e) { throw new Error("고도화 실패"); }
};

export const rewriteAeoContent = async (content: AeoContent, targetCluster: Cluster): Promise<AeoContent> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview', 
            contents: `한국어로 재구성하십시오. 각 섹션의 내용을 더욱 상세하게 보강하여 전체 분량을 늘려주세요. : ${JSON.stringify(content)}`,
            config: { responseMimeType: "application/json", responseSchema: content.format === 'blog' ? blogSchema : linkedinSchema }
        });
        const result = JSON.parse(response.text.trim());
        result.format = content.format;
        return { ...result, targetClusterName: content.targetClusterName };
    } catch (e) { throw new Error("재작성 실패"); }
};

export const generateComparisonReport = async (s_a: string, p_a: string, s_b: string, p_b: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `기간 A(${p_a})와 기간 B(${p_b})의 검색 데이터를 대조 분석하여 한국어로 보고서를 작성하십시오.`,
    });
    return response.text;
};

export const generateBatchSummary = async (results: FullAnalysisResult[]): Promise<BatchSummaryReport> => {
    const prompt = `일괄 분석 통합 전략을 수립하십시오.`;
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: prompt + `\n\nDATA:\n${JSON.stringify(results.map(r => ({ query: r.query })))}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        landscape: { type: Type.STRING },
                        targetInsight: { type: Type.STRING },
                        aeoStrategy: { type: Type.STRING },
                        cdjRecommendations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    stage: { type: Type.STRING },
                                    action: { type: Type.STRING },
                                    nextKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["stage", "action", "nextKeywords"]
                            }
                        }
                    },
                    required: ["landscape", "targetInsight", "aeoStrategy", "cdjRecommendations"]
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (e) { throw new Error("배치 요약 실패"); }
};
