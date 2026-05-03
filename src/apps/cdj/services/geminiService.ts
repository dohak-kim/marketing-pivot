import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, AspectRatio, ImageTone, ReelStoryboard, StoryboardAsset } from '../types';
import type { SerpApiPayload, EnrichedKeyword } from '@/apps/aegis/services/dataCollection/types';

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

const ai = new GoogleGenAI({ apiKey: resolveApiKey() });

const CDJ_MODEL = 'gemini-2.5-flash-preview-05-14';

/** CDJ용 시드 키워드 생성 — aegis의 gemini.ts와 독립적으로 동일 모델 사용 */
export async function generateCdjSeeds(topic: string, count = 12): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: CDJ_MODEL,
    contents: `한국 검색 시장 기준으로 "${topic}" 주제를 검색할 때 실제로 사용하는 대표 키워드 ${count}개를 추출하세요.
검색 의도(정보성/탐색성/상업성/전환성)가 고루 포함되도록 다양하게 선택하세요.
실제 검색어처럼 작성하세요 (예: "1인 가구 인테리어 추천", "원룸 가구 배치 방법").
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
  try {
    const result = JSON.parse(response.text ?? '[]');
    return Array.isArray(result) ? result.slice(0, count) : [topic];
  } catch {
    return [topic];
  }
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        keywords: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    keyword: { type: Type.STRING },
                    cdjStage: { type: Type.STRING, enum: ['인지', '고려', '결정', '사후 관리'] },
                    searchIntent: { type: Type.STRING, enum: ['정보성', '탐색성', '상업성', '전환성'] },
                    searchVolumeIndex: { type: Type.NUMBER, description: '키워드의 상대적 검색량 잠재력을 0-100 스케일로 나타내는 지수' },
                },
                required: ['keyword', 'cdjStage', 'searchIntent', 'searchVolumeIndex'],
            },
        },
        intentDistribution: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    intent: { type: Type.STRING, enum: ['정보성', '탐색성', '상업성', '전환성'] },
                    value: { type: Type.NUMBER },
                },
                required: ['intent', 'value'],
            },
        },
        strategicOutlines: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    stage: { type: Type.STRING, enum: ['인지', '고려', '결정', '사후 관리'] },
                    toneAndManner: { type: Type.STRING },
                    cta: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    adMessages: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                },
                required: ['stage', 'toneAndManner', 'cta', 'explanation', 'adMessages'],
            },
        },
        strategicInsights: {
            type: Type.STRING,
            description: '전체 분석 결과를 포괄하는 임원 보고용 요약(Executive Summary)입니다. 현재 시장 상황과 의사결정을 위한 핵심 방향성을 제시하고, 반드시 마지막에 "💡 추천 크리에이티브 유형" 2가지를 포함해야 합니다.'
        },
        matrixImplication: {
            type: Type.STRING,
            description: '여정-의도 교차 분석(Matrix) 결과에 특화된 구체적인 시사점입니다. 데이터의 집중 구간(Hotspot)이 의미하는 바와, 이를 공략하기 위한 전술적 콘텐츠 방향을 서술합니다. Executive Summary의 근거가 되는 구체적인 내용을 담되, 내용은 중복되지 않게 하세요.'
        },
        keywordInsights: {
            type: Type.ARRAY,
            description: '각 CDJ 단계별로 추출된 키워드 그룹에 대한 전략적 시사점입니다.',
            items: {
                type: Type.OBJECT,
                properties: {
                    stage: { type: Type.STRING, enum: ['인지', '고려', '결정', '사후 관리'] },
                    insight: { type: Type.STRING, description: '해당 단계의 키워드 그룹을 분석하여 도출된 1-2 문장의 전략적 시사점입니다.' }
                },
                required: ['stage', 'insight']
            }
        },
    },
    required: ['keywords', 'intentDistribution', 'strategicOutlines', 'strategicInsights', 'matrixImplication', 'keywordInsights'],
};

export type SearchSource = 'naver' | 'google';

interface AnalysisParams {
  topic: string;
  sources: SearchSource[];
  period: string;
  dateRange: { start: string; end: string } | null;
  serpData?: SerpApiPayload | null;
}

const SOURCE_LABEL: Record<SearchSource, string> = {
  naver: 'Naver (블로그·카페·뉴스)',
  google: 'Google (웹·뉴스·유튜브)',
};

function periodToDateRange(period: string): { from: string; to: string } {
  const today = new Date();
  const from = new Date(today);
  switch (period) {
    case '1w':  from.setDate(today.getDate() - 7); break;
    case '1m':  from.setMonth(today.getMonth() - 1); break;
    case '6m':  from.setMonth(today.getMonth() - 6); break;
    case '1y':  from.setFullYear(today.getFullYear() - 1); break;
    default:    from.setMonth(today.getMonth() - 3);
  }
  return { from: from.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
}

/** Volume range → 0-100 index (midpoint heuristic) */
function volRangeToIndex(range: string | null | undefined): number {
  if (!range) return 20;
  const map: Record<string, number> = {
    '1~10': 3, '10~100': 10, '100~1000': 25,
    '1000~10000': 50, '10000~100000': 75, '100000+': 95,
  };
  return map[range] ?? 20;
}

/** Compress EnrichedKeyword array to a compact JSON block for the RAG prompt */
function buildSerpContext(serpData: SerpApiPayload): string {
  if (!serpData.keywords.length) return '';

  const compact = serpData.keywords.map((k: EnrichedKeyword) => {
    const volIndex = Math.max(
      volRangeToIndex(k.pcVolumeRange),
      volRangeToIndex(k.mobileVolumeRange),
    );
    return {
      keyword: k.keyword,
      searchVolumeIndex: volIndex,
      trend: k.trendData
        ? `${k.trendData.direction} (momentum: ${k.trendData.momentum.toFixed(2)})`
        : null,
      paaQuestions: k.paaQuestions.slice(0, 3),
      serpFeatures: [
        k.hasFeaturedSnippet && '답변박스',
        k.hasAIOverview     && 'AI개요',
        k.hasShopping       && '쇼핑',
        k.hasVideoCarousel  && '동영상',
        k.hasPAA            && 'PAA',
      ].filter(Boolean),
      topTitles: k.topResults.slice(0, 2).map(r => r.title),
    };
  });

  const src = [
    serpData.sources.naverApiUsed  && 'Naver',
    serpData.sources.serperApiUsed && 'Google',
  ].filter(Boolean).join(' + ');

  return `

    ─── 실시간 수집 데이터 (${src || 'AI 추정'}) ───
    아래 JSON은 실제 ${src} 검색 API에서 수집한 키워드별 데이터입니다.
    반드시 이 데이터의 keyword 목록을 우선 활용하고, searchVolumeIndex는 위 값을 그대로 사용하세요.
    AI가 임의로 볼륨을 추정하거나 변경하지 마십시오.
    paaQuestions는 검색 의도(searchIntent) 분류에 활용하세요.
    serpFeatures(답변박스·AI개요)가 있으면 정보성·탐색성 의도 가능성이 높습니다.
    쇼핑 피처가 있으면 전환성 의도 가능성이 높습니다.
    trend의 rising/falling/seasonal은 CDJ 단계(인지 확산 vs 성숙 고려) 판단에 활용하세요.

    ${JSON.stringify(compact, null, 2)}
    ─── 수집 데이터 끝 ───`;
}

export const analyzeContent = async ({ topic, sources, period, dateRange, serpData }: AnalysisParams): Promise<AnalysisResult> => {
  const sourceLabel = sources.length === 0
    ? 'Naver, Google (통합)'
    : sources.map(s => SOURCE_LABEL[s]).join(' + ');
  const range = dateRange
    ? { from: dateRange.start, to: dateRange.end }
    : periodToDateRange(period);

  const serpContext = serpData && !serpData.sources.fallbackToGrounding
    ? buildSerpContext(serpData)
    : '';

  const prompt = `
    당신은 고객 결정 여정(CDJ)과 검색 엔진 최적화(SEO)를 전문으로 하는 디지털 마케팅 분석가입니다.
    사용자가 제공한 주제인 "${topic}"에 대해 아래 조건에 맞춰 분석을 수행하십시오.

    - 분석 소스: ${sourceLabel}
    - 분석 기간: ${range.from} 부터 ${range.to} 까지${serpContext}

    먼저, 사용자가 입력한 주제의 수준(Level)을 판단하세요: (1) 광범위한 주제/제품 카테고리, (2) 특정 분야/브랜드, (3) 구체적인 제품/서비스명.
    CDJ 단계별 키워드 분포는 이 수준을 반영해야 합니다.

    분석을 수행하고 그 결과를 단일 JSON 객체로 반환해 주세요. JSON 객체 외에는 어떠한 텍스트도 포함하지 마십시오.
    반드시 한국어로 답변해야 합니다.

    지침:
    1. **키워드 생성:** 주제와 관련된 키워드 15~20개를 생성하고, CDJ 단계, 검색 의도, 검색량 잠재력 지수(0-100)를 분류합니다.
    2. **분포 계산:** 검색 의도 유형의 백분율 분포를 계산합니다.
    3. **전략적 개요 (Strategic Outline):** 각 CDJ 단계별 톤앤매너, CTA, 광고 메시지 예시, AI 선호 정보 특성을 작성합니다.
    4. **키워드 인사이트:** 각 단계별 키워드 그룹의 관심사를 1-2문장으로 요약합니다.
    
    5. **핵심 결과 도출 (매우 중요 - 역할 분리):**
       
       A. **strategicInsights (Executive Summary):**
          - **역할:** 전체 보고서를 아우르는 거시적인 요약 및 의사결정 제안입니다.
          - **내용:** "현재 시장은 [어떤 단계]에 집중되어 있으므로, [어떤 전략]을 통해 시장 점유율을 확대해야 합니다."와 같이 마케팅 책임자(CMO)가 의사결정을 내릴 수 있는 수준으로 작성하세요.
          - **추천 크리에이티브:** 텍스트의 마지막에 반드시 줄바꿈을 두 번 하고 다음 형식을 엄수하여 작성하세요:
            "💡 추천 크리에이티브 유형:
            1. [유형명]: [선정 이유 및 활용 전략]
            2. [유형명]: [선정 이유 및 활용 전략]"
       
       B. **matrixImplication (Matrix Key Implication):**
          - **역할:** 여정(CDJ)과 의도(Intent)가 교차하는 '매트릭스 데이터'에 대한 구체적인 해석입니다. Executive Summary의 내용을 단순히 반복하지 마십시오.
          - **내용:** "여정-의도 교차 분석 결과, [특정 단계] x [특정 의도] 구간에 키워드가 가장 밀집되어 있습니다(Hotspot). 이는 소비자들이 현재 [구체적인 고민/니즈]를 가지고 있음을 시사합니다. 따라서 이 구간의 병목을 해소하기 위해 [구체적인 전술/콘텐츠 형식]이 필요합니다." 와 같이 데이터에 근거한 구체적인 전술을 제시하세요.
          - **주의:** 여기에는 '추천 크리에이티브 유형' 목록을 다시 적지 마십시오.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-14',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.5,
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("API 응답이 비어있습니다.");
    }

    const result = JSON.parse(text);
    
    // Validate that the result structure is correct
    if (!result.keywords || !result.intentDistribution || !result.strategicOutlines || !result.strategicInsights || !result.matrixImplication || !result.keywordInsights) {
        throw new Error("API 응답의 형식이 올바르지 않습니다.");
    }
    
    return result as AnalysisResult;

  } catch (error) {
    console.error("Gemini API 호출 중 오류 발생:", error);
    throw new Error("AI 모델과의 통신에 실패했습니다.");
  }
};

const translateToneForPrompt = (tone: ImageTone): string => {
  switch (tone) {
    case '애니메이션':
      return 'anime or cartoon';
    case '실사':
      return 'photorealistic';
    case '일러스트레이션':
      return 'illustration';
    default:
      return 'default';
  }
};

interface ImagePayload {
  base64: string;
  mimeType: string;
}

export const generateAdImage = async ({
  logoImage,
  productImage,
  adMessage,
  topic,
  aspectRatio,
  tone,
  textPosition,
  textColor,
}: {
  logoImage?: ImagePayload;
  productImage?: ImagePayload;
  adMessage: string;
  topic?: string;
  aspectRatio: AspectRatio;
  tone: ImageTone;
  textPosition: 'top' | 'middle' | 'bottom';
  textColor: string;
}): Promise<string> => {
  const translatedTone = translateToneForPrompt(tone);
  
  const imageParts: { inlineData: { data: string, mimeType: string } }[] = [];
  let coreVisualPrompt = '';

  if (productImage) {
      imageParts.push({ inlineData: { data: productImage.base64, mimeType: productImage.mimeType } });
      coreVisualPrompt += "A product image has been provided. Create a compelling background that highlights this product, making it the central focus. ";
  }
  
  if (logoImage) {
      imageParts.push({ inlineData: { data: logoImage.base64, mimeType: logoImage.mimeType } });
      if (productImage) {
          coreVisualPrompt += "A brand logo is also provided. Integrate this logo subtly and tastefully into the composition (e.g., in a corner or as a watermark) without overpowering the main product.";
      } else {
          coreVisualPrompt += "A brand logo has been provided. Create an abstract or thematic background that aligns with the brand's identity, as suggested by the logo and the ad message.";
      }
  }

  // 이미지가 없을 경우 텍스트 기반 프롬프트 생성 (검색어와 카피 반영)
  if (imageParts.length === 0) {
      coreVisualPrompt += `Create a high-quality, professional advertising background image based on the keyword "${topic || 'General Marketing'}" and the following campaign message concept: "${adMessage}". `;
      coreVisualPrompt += "The image should vividly visualize the subject matter and emotion conveyed in the message. ";
      coreVisualPrompt += "It must look like a premium stock photo or professionally designed advertisement background, ready for text overlay. ";
  }

  const prompt = `
    You are an expert graphic designer creating a background image for an Instagram ad.

    **CRITICAL INSTRUCTIONS:**

    1.  **DO NOT RENDER ANY TEXT.** Your primary task is to create a background image ONLY.
    2.  **Theme & Mood:** The background image should be visually inspired by the following ad message concept: "${adMessage}". Do not include the text itself, but capture its essence, mood, and subject matter.
    3.  **Core Visual Element:** ${coreVisualPrompt}
    4.  **Aesthetic Style:** The overall image style must be **${translatedTone}**.
    5.  **Composition for Text Overlay:**
        - Text will be placed in the **${textPosition}** region of the image.
        - **CRITICAL: SEAMLESS CONTINUITY.** Do NOT create a separate text box, solid bar, or empty colored frame. The image must be a **continuous, full-bleed scene** from edge to edge.
        - **Natural Negative Space:** Instead of a box, use the natural environment (e.g., extending the sky, floor, wall, or blurred background texture) to provide a clean area for text in the ${textPosition} position.
        - **Vertical Flow:** Especially for the **${aspectRatio}** format, ensure the background flows naturally from top to bottom without any hard horizons or artificial dividers separating the text area from the main subject.
        - The ${textPosition} area should just be visually quieter (soft focus or less detail) to ensure text readability, but must remain part of the overall image.
        - Ensure good contrast with **${textColor}** text in the ${textPosition} area.
    6.  **Final Output:**
        - **Aspect Ratio:** The final image must have an aspect ratio of **${aspectRatio}**.
        - **ABSOLUTELY NO TEXT:** The final image must not contain any letters, characters, or words.
  `;
  
  const contents = {
    parts: [
        ...imageParts,
        { text: prompt },
    ],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-14',
      contents: contents,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    throw new Error('Image generation failed: No image data in response.');
  } catch (error) {
    console.error('Gemini image generation API call failed:', error);
    throw new Error('AI 이미지 생성에 실패했습니다.');
  }
};

export const generateReelStoryboards = async (adMessage: string): Promise<ReelStoryboard[]> => {
    const prompt = `
      당신은 숏폼 비디오(Reels, TikTok, Shorts) 전문 기획자(Director)입니다.
      주어진 광고 메시지 "${adMessage}"를 기반으로, 15초 분량의 숏폼 비디오 스토리보드 3개를 기획해주세요.

      각 스토리보드는 서로 다른 톤앤매너와 컨셉(예: 감성적, 유머러스, 정보 전달, 트렌디 등)을 가져야 합니다.
      각 스토리보드는 정확히 3개의 씬(Scene)으로 구성되며, 각 씬은 5초 분량입니다.

      **필수 요건:**
      1. 총 3개의 스토리보드를 생성하세요.
      2. 각 스토리보드는 id, title, concept, scenes 필드를 가집니다.
      3. scenes 배열은 정확히 3개의 객체(scene 1, 2, 3)를 포함합니다.
      4. 각 scene 객체는 다음 필드를 가집니다:
         - sceneNumber: 1, 2, 3
         - duration: "5초"
         - visualDescription: 화면에 무엇이 보이는지 상세히 묘사 (한국어)
         - audioScript: 내레이션이나 자막 텍스트 (한국어)
         - veoPrompt: Google Veo 비디오 생성 모델에 입력할 **영어 프롬프트**. (매우 중요: 구체적이고 시각적이어야 함. 예: "Cinematic 4k shot of...")
      
      결과는 반드시 JSON 포맷으로 반환하세요.
    `;

    const storyboardSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                concept: { type: Type.STRING },
                scenes: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            sceneNumber: { type: Type.NUMBER },
                            duration: { type: Type.STRING },
                            visualDescription: { type: Type.STRING },
                            audioScript: { type: Type.STRING },
                            veoPrompt: { type: Type.STRING },
                        },
                        required: ['sceneNumber', 'duration', 'visualDescription', 'audioScript', 'veoPrompt'],
                    },
                },
            },
            required: ['id', 'title', 'concept', 'scenes'],
        },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-05-14',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: storyboardSchema,
            },
        });
        
        const text = response.text;
        if (!text) throw new Error("No response from AI");
        
        return JSON.parse(text) as ReelStoryboard[];
    } catch (error) {
        console.error("Storyboard generation failed:", error);
        throw new Error("스토리보드 생성에 실패했습니다.");
    }
};

// 씬 설명 및 업로드된 자산에 기반한 콘티 이미지 생성
export const generateSceneImage = async (description: string, assets: StoryboardAsset[] = []): Promise<string> => {
  const parts: any[] = [];

  // 자산이 있으면 이미지 파트 추가
  let assetPrompt = "";
  if (assets.length > 0) {
      assetPrompt += "\n\nReference Images Provided:\n";
      for (const asset of assets) {
          if (asset.base64 && asset.mimeType) {
              parts.push({ inlineData: { data: asset.base64, mimeType: asset.mimeType } });
              assetPrompt += `- [Image Type: ${asset.type}]: Please incorporate this visual element into the scene.\n`;
          }
      }
      assetPrompt += "Ensure the generated storyboard frame strongly features or is consistent with these provided reference images where appropriate to the scene description.";
  }

  const prompt = `
    Create a photorealistic, high-quality storyboard frame sketch for a video scene.
    
    **Scene Description:** ${description}
    ${assetPrompt}
    
    **Style:** Cinematic, clear, no text overlays, 9:16 aspect ratio composition.
    This is for a visual storyboard. Focus on composition and lighting.
  `;

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-14',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "9:16",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
    }
    throw new Error('No image data in response');
  } catch (error) {
    console.error('Scene image generation failed:', error);
    throw new Error('콘티 이미지 생성 실패');
  }
};

export const generateVeoVideo = async (prompt: string): Promise<string> => {
    // 1. Check API Key selection (Client-side logic required, assuming this runs in browser context)
    if (typeof window !== 'undefined' && window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            try {
                await window.aistudio.openSelectKey();
            } catch (e) {
                console.error("API Key selection failed", e);
                throw new Error("API 키 선택이 필요합니다."); // Re-throw the error
            }
        }
    }
    
    // Create a NEW instance to ensure latest key is used if it was just selected
    const veoAi = new GoogleGenAI({ apiKey: resolveApiKey() });

    try {
        let operation = await veoAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '1080p',
                aspectRatio: '9:16', // Reels format
            }
        });

        // Polling
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            operation = await veoAi.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) {
            throw new Error("Video generation completed but no URI returned.");
        }

        // Fetch the actual video blob
        const videoResponse = await fetch(`${videoUri}&key=${resolveApiKey()}`);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }
        
        const blob = await videoResponse.blob();
        return URL.createObjectURL(blob);

    } catch (error) {
        console.error("Veo video generation failed:", error);
        throw error;
    }
};