import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, MarketingReport, AnalysisInputs, AnalysisStep } from "../types";
import { DataCollector } from "./dataCollector";
import { buildPrompt } from "./promptBuilder";
import { getGenerationConfig, GenerationStep } from "../config/generationConfig";

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

export class GeminiService {
  private ai: GoogleGenAI;
  private dataCollector: DataCollector;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: resolveApiKey() });
    this.dataCollector = new DataCollector();
  }

  private async generateContentWithRetry(model: string, params: any, retries = 3, delayMs = 2000): Promise<any> {
    try {
      return await this.ai.models.generateContent({
        model,
        ...params
      });
    } catch (error: any) {
      if (retries > 0 && (error.status === 429 || error.code === 429 || error.status === 503 || error.code === 503 || error.message?.includes('429') || error.message?.includes('quota'))) {
        console.warn(`GeminiService: API Busy. Retrying in ${delayMs}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.generateContentWithRetry(model, params, retries - 1, delayMs * 2);
      }
      throw error;
    }
  }

  private async runGemini(prompt: string, step: GenerationStep, model: string = 'gemini-3.1-pro-preview', additionalConfig: any = {}) {
    return this.generateContentWithRetry(model, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        ...getGenerationConfig(step),
        ...additionalConfig
      }
    });
  }

  /**
   * Step 2.1: Fact Sheet -> Gemini -> Initial Analysis (Trends, PEST, 3C, SWOT)
   * Uses 'analysis' config (Low Temp) for strict fact-based analysis.
   */
  async generateInitialAnalysis(factSheetText: string, inputs: AnalysisInputs): Promise<Partial<AnalysisResult>> {
    const safeCompetitors = inputs.competitors.filter(c => c && c.trim()).join(', ');
    const currentYear = new Date().getFullYear();

    const userRequest = `
      [분석 대상]
      - 산업: "${inputs.category}"
      - 브랜드: "${inputs.ownBrand}"
      - **분석해야 할 경쟁사**: "${safeCompetitors}"

      [지시사항 1: 시장 데이터 분석 (Market Trend)]
      1. **Historical Data (${currentYear - 10} ~ ${currentYear})**: Fact Sheet에 있는 데이터를 기반으로 최근 10년치 시장 규모 데이터를 추출하십시오. 데이터가 일부 누락된 경우, 알려진 연도의 수치를 바탕으로 보간(Interpolation)하여 채우십시오.
      2. **Forecast Data (${currentYear + 1} ~ ${currentYear + 5})**: 
         - Fact Sheet에 신뢰할 수 있는 기관의 미래 예측치가 있다면 우선 사용하십시오.
         - **만약 미래 예측 데이터가 부족하거나 없다면, 반드시 확보한 Historical Data를 기반으로 선형 회귀분석(Linear Regression) 또는 CAGR 공식을 사용하여 향후 5년치 수치를 직접 계산하여 예측하십시오.**
         - 예측된 데이터는 'isForecast: true', 'isEstimated: true'로 표기하십시오.
      3. 단위(Unit)를 명확히 하십시오 (예: 억 원, 만 대, USD Million).

      [지시사항 2: 전략 프레임워크 분석]
      - PEST, 3C, SWOT 분석을 수행하십시오.
      - 팩트에 기반하지 않은 내용은 생성하지 마십시오.
      
      모든 텍스트 내용은 반드시 '한국어'로 작성하십시오.

      [Output Schema]
      (See responseSchema)
    `;

    const prompt = buildPrompt(userRequest, factSheetText);

    const response = await this.runGemini(prompt, 'analysis', 'gemini-3.1-pro-preview', {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marketTrend: {
              type: Type.OBJECT,
              properties: {
                historicalData: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { year: { type: Type.INTEGER }, value: { type: Type.NUMBER }, isForecast: { type: Type.BOOLEAN }, isEstimated: { type: Type.BOOLEAN } },
                    required: ["year", "value", "isForecast"]
                  }
                },
                forecastData: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { year: { type: Type.INTEGER }, value: { type: Type.NUMBER }, isForecast: { type: Type.BOOLEAN } },
                    required: ["year", "value", "isForecast"]
                  }
                },
                currentMarketSize: { type: Type.STRING },
                cagrHistorical: { type: Type.STRING },
                cagrForecast: { type: Type.STRING },
                unit: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["historicalData", "forecastData", "currentMarketSize", "cagrHistorical", "cagrForecast", "unit", "description"]
            },
            pest: {
              type: Type.OBJECT,
              properties: {
                political: { type: Type.ARRAY, items: { type: Type.STRING } },
                economic: { type: Type.ARRAY, items: { type: Type.STRING } },
                social: { type: Type.ARRAY, items: { type: Type.STRING } },
                technological: { type: Type.ARRAY, items: { type: Type.STRING } },
                implications: { type: Type.ARRAY, items: { type: Type.STRING } },
                sources: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["political", "economic", "social", "technological", "implications", "sources"]
            },
            threeC: {
              type: Type.OBJECT,
              properties: {
                company: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, currentPosition: { type: Type.STRING }, sources: { type: Type.ARRAY, items: { type: Type.STRING } } },
                  required: ["name", "strengths", "currentPosition", "sources"]
                },
                competitor: {
                  type: Type.OBJECT,
                  properties: {
                    rivals: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, strategy: { type: Type.STRING } }, required: ["name", "strategy"] } },
                    implications: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sources: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["rivals", "implications", "sources"]
                },
                customer: {
                  type: Type.OBJECT,
                  properties: { segments: { type: Type.ARRAY, items: { type: Type.STRING } }, needs: { type: Type.ARRAY, items: { type: Type.STRING } }, trends: { type: Type.ARRAY, items: { type: Type.STRING } }, sources: { type: Type.ARRAY, items: { type: Type.STRING } } },
                  required: ["segments", "needs", "trends", "sources"]
                }
              },
              required: ["company", "competitor", "customer"]
            },
            swot: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                threats: { type: Type.ARRAY, items: { type: Type.STRING } },
                strategies: { type: Type.OBJECT, properties: { SO: { type: Type.STRING }, ST: { type: Type.STRING }, WO: { type: Type.STRING }, WT: { type: Type.STRING } }, required: ["SO", "ST", "WO", "WT"] },
                sources: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["strengths", "weaknesses", "opportunities", "threats", "strategies", "sources"]
            },
            glossary: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } }, required: ["term", "definition"] }
            }
          },
          required: ["marketTrend", "pest", "threeC", "swot", "glossary"]
        }
    });

    return JSON.parse(response.text.trim());
  }

  /**
   * Step 2.2: Initial Analysis -> Gemini -> STP & Strategy
   * Uses 'stp' config (Low-Mid Temp) for logical but creative strategic derivation.
   */
  async generateSTPStrategy(factSheetText: string, initialAnalysis: any, inputs: AnalysisInputs): Promise<Partial<AnalysisResult>> {
    const safeCompetitors = inputs.competitors.filter(c => c && c.trim()).join(', ');
    
    const userRequest = `
      [분석 컨텍스트]
      - 산업: "${inputs.category}"
      - **자사 브랜드(Target)**: "${inputs.ownBrand}"
      - **경쟁사**: "${safeCompetitors}"
      - 주요 발견(SWOT/PEST): ${JSON.stringify(initialAnalysis.swot)} / ${JSON.stringify(initialAnalysis.pest.implications)}
      
      [지시사항]
      1. 분석된 데이터를 근거로 논리적인 STP(Segmentation, Targeting, Positioning)를 도출하십시오.
      2. 시장 세분화(segmentation)는 반드시 최소 3개, 최대 5개의 세그먼트를 도출하십시오. 시장이 단순하면 3개, 복잡하면 4~5개로 하십시오.
      3. 4P Mix 전략은 구체적이고 실행 가능해야 합니다.
      4. 모든 텍스트 내용은 반드시 '한국어'로 작성하십시오.
      
      [Positioning Map 작성 핵심 지침]
      1. **축 선정**: 자사 브랜드("${inputs.ownBrand}")가 경쟁사("${safeCompetitors}") 대비 가장 강력한 차별점을 가질 수 있는 2가지 핵심 전략 변수를 X축, Y축으로 선정하십시오. (단순 품질/가격 제외)
      2. **브랜드 포함**: 'brands' 배열에는 자사 브랜드와 입력된 경쟁사들이 **반드시 실명으로** 포함되어야 합니다.
      3. **좌표 배정**: -100(매우 낮음) ~ +100(매우 높음) 척도를 사용하여, 브랜드 간의 위치 차이가 시각적으로 명확히 드러나도록 좌표를 부여하십시오. (중심에 몰리지 않게 분산)
      4. **전략적 그룹핑**: 유사한 전략을 가진 브랜드끼리는 가깝게, 차별화된 브랜드는 멀게 배치하여 시장 지형을 표현하십시오.

      [Output Schema]
      (See responseSchema)
    `;

    const prompt = buildPrompt(userRequest, factSheetText);

    const response = await this.runGemini(prompt, 'stp', 'gemini-3.1-pro-preview', {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stp: {
              type: Type.OBJECT,
              properties: {
                segmentationLogic: { type: Type.STRING },
                segmentation: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      criteria: { type: Type.STRING },
                      size: { type: Type.STRING },
                      description: { type: Type.STRING },
                      rationale: { type: Type.STRING }
                    },
                    required: ["name", "criteria", "size", "description", "rationale"]
                  }
                },
                targeting: {
                  type: Type.OBJECT,
                  properties: { selectedSegment: { type: Type.STRING }, rationale: { type: Type.STRING }, persona: { type: Type.STRING } },
                  required: ["selectedSegment", "rationale", "persona"]
                },
                positioning: {
                  type: Type.OBJECT,
                  properties: { statement: { type: Type.STRING }, differentiation: { type: Type.STRING } },
                  required: ["statement", "differentiation"]
                },
                positioningMap: {
                  type: Type.OBJECT,
                  properties: {
                    xAxisName: { type: Type.STRING },
                    yAxisName: { type: Type.STRING },
                    brands: {
                      type: Type.ARRAY,
                      items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, isTarget: { type: Type.BOOLEAN } }, required: ["name", "x", "y", "isTarget"] }
                    },
                    factReading: { type: Type.STRING },
                    strategicImplication: { type: Type.STRING }
                  },
                  required: ["xAxisName", "yAxisName", "brands", "factReading", "strategicImplication"]
                }
              },
              required: ["segmentationLogic", "segmentation", "targeting", "positioning", "positioningMap"]
            },
            marketingMix: {
              type: Type.OBJECT,
              properties: {
                product: { type: Type.ARRAY, items: { type: Type.STRING } },
                price: { type: Type.ARRAY, items: { type: Type.STRING } },
                place: { type: Type.ARRAY, items: { type: Type.STRING } },
                promotion: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["product", "price", "place", "promotion"]
            }
          },
          required: ["stp", "marketingMix"]
        }
    });

    return JSON.parse(response.text.trim());
  }

  /**
   * Step 2.3: STP -> Gemini -> Communication Strategy (Creative)
   * Uses 'creative' config (High Temp) for catchy slogans and concepts.
   */
  async generateCommunicationStrategyWithFactSheet(factSheetText: string, inputs: AnalysisInputs, initialAnalysis: any, stpStrategy: any): Promise<Partial<AnalysisResult>> {
    const userRequest = `
      [브랜드 정보]
      - 브랜드: "${inputs.ownBrand}"
      - 타겟: "${stpStrategy.stp.targeting.selectedSegment}" (${stpStrategy.stp.targeting.persona})
      - 포지셔닝: "${stpStrategy.stp.positioning.statement}"
      
      [지시사항]
      위 전략을 바탕으로 고객의 마음을 사로잡을 수 있는 매력적인 커뮤니케이션 전략을 수립하십시오.
      
      1. Brand Story: 고객의 공감을 이끌어내는 감성적인 브랜드 스토리 (200자 내외).
      2. Creative Concept: 캠페인 메인 컨셉.
      3. Slogan: 뇌리에 박히는 핵심 카피.
      4. Tone & Manner: 구체적인 화법과 무드.
      5. Keywords: 핵심 커뮤니케이션 키워드 (해시태그 스타일).
      6. Action Plan: 온/오프라인 실행 방안.
      
      모든 내용은 '한국어'로 작성되어야 합니다.

      [Output Schema]
      (See responseSchema)
    `;

    const prompt = buildPrompt(userRequest, factSheetText);

    const response = await this.runGemini(prompt, 'creative', 'gemini-3.1-pro-preview', {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            communication: {
              type: Type.OBJECT,
              properties: {
                mainConcept: { type: Type.STRING },
                slogan: { type: Type.STRING },
                brandStory: { type: Type.STRING },
                toneAndVoice: { type: Type.STRING },
                keyKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["mainConcept", "slogan", "brandStory", "toneAndVoice", "keyKeywords", "actionPlan"]
            }
          },
          required: ["communication"]
        }
    });

    return JSON.parse(response.text.trim());
  }

  /**
   * Main Orchestrator: User Input -> Data Collection -> Fact Sheet -> Gemini -> Report
   */
  async runFullAnalysis(inputs: AnalysisInputs, onProgress?: (status: AnalysisStep) => void): Promise<AnalysisResult> {
    
    // Step 1: Data Collection (API) -> Fact Sheet
    const newsItems = await this.dataCollector.createFactSheet(inputs, onProgress); // This handles news, gdelt, facts, validation
    
    // Step 2: Analysis & Strategy
    if (onProgress) onProgress('analyzing-market');
    
    // 2.1 Initial Analysis (Facts)
    const initialAnalysis = await this.generateInitialAnalysis(newsItems.text, inputs);

    // 2.2 STP & Strategy (Logical) - CDJ / CEP / Intent Engine
    if (onProgress) onProgress('intent-analysis');
    const stpStrategy = await this.generateSTPStrategy(newsItems.text, initialAnalysis, inputs);

    // 2.3 Communication (Creative)
    const commStrategy = await this.generateCommunicationStrategyWithFactSheet(newsItems.text, inputs, initialAnalysis, stpStrategy);

    // Merge and return
    return {
      ...(initialAnalysis as any),
      ...(stpStrategy as any),
      ...(commStrategy as any),
      sources: newsItems.sources
    } as AnalysisResult;
  }

  async generatePersonaImage(personaDescription: string): Promise<string | undefined> {
    try {
      const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
      // Imagen 3: 전문 인물 초상화에 최적화, Gemini 대비 품질 우수
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: [
          'Professional portrait photograph for a business marketing strategy deck.',
          `Persona: ${personaDescription.slice(0, 450)}`,
          'Style: photorealistic, natural lighting, neutral background, confident pose.',
          'NO text, NO watermark, NO labels.',
        ].join(' '),
        config: { numberOfImages: 1, aspectRatio: '1:1' },
      });

      const bytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (bytes) return `data:image/jpeg;base64,${bytes}`;
    } catch (e) {
      console.error("Failed to generate persona image:", e);
    }
    return undefined;
  }

  async generateMarketingReport(inputs: AnalysisInputs, analysis: AnalysisResult): Promise<MarketingReport> {
    const safeBrand = inputs.ownBrand.slice(0, 100);
    const safeCategory = inputs.category.slice(0, 100);
    const safeCompetitors = inputs.competitors.map(c => c.slice(0, 100)).filter(c => c).join(', ');

    // CRITICAL FIX: Remove base64 image data from the analysis object before stringifying it for the prompt.
    // The base64 string can be very large and cause "Token limit exceeded" errors.
    const analysisForPrompt = {
        ...analysis,
        stp: {
            ...analysis.stp,
            targeting: {
                ...analysis.stp.targeting,
                personaImageUrl: undefined
            }
        }
    };

    const prompt = `
      대상: "${safeCategory}" 산업의 "${safeBrand}" 브랜드 (경쟁사 대비 전략)
      경쟁사: ${safeCompetitors}
      분석 데이터: ${JSON.stringify(analysisForPrompt)}

      위 데이터를 바탕으로 임원 보고용 고품질 전략 보고서를 생성하세요.
      보고서 제목은 "${safeBrand}의 "${safeCategory}" 시장 내 초격차 확보를 위한 전략 로드맵"과 같이 전문적이고 설득력 있게 작성하세요.
      
      보고서는 반드시 다음 11개의 슬라이드로 구성되어야 합니다:
      01 Executive Summary: 시장 현황 및 핵심 전략 방향
      02 Market Analysis: PEST 및 산업 환경 분석
      03 Competitor Landscape: 주요 경쟁사 동향
      04 Company Competency: 자사 경쟁력 분석
      05 Customer Analysis: 고객 니즈
      06 SWOT Analysis: 전략적 기회 및 위협 요인 도출
      07 Segmentation: 시장 세분화
      08 Targeting: 목표 시장 선정
      09 Positioning: 포지셔닝 분석 및 차별화 방안
      10 Marketing Mix (4P): 실행 중심의 마케팅 전략
      11 Action Plan: 단계별 실행 계획 및 비전

      각 슬라이드의 내용은 분석 데이터를 충분히 반영하여 구체적이고 전문적인 어조로 작성하십시오.
      모든 내용은 반드시 '한국어'로 작성하십시오.
    `;

    const response = await this.runGemini(prompt, 'strategy', 'gemini-3.1-pro-preview', {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            tableOfContents: { type: Type.ARRAY, items: { type: Type.STRING } },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  headMessage: { type: Type.STRING },
                  content: { type: Type.ARRAY, items: { type: Type.STRING } },
                  rtb: { type: Type.OBJECT, properties: { evidence: { type: Type.STRING }, metric: { type: Type.STRING }, source: { type: Type.STRING } }, required: ["evidence", "metric", "source"] }
                },
                required: ["title", "headMessage", "content", "rtb"]
              }
            }
          },
          required: ["title", "subtitle", "tableOfContents", "slides"]
        }
    });

    return JSON.parse(response.text.trim());
  }
}
