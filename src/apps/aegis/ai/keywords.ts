
import { GoogleGenAI, Type } from "@google/genai";
import { Context, KeywordNode } from '../core/context';
import { SearchSource } from '../core/search/config';
import { ANALYSIS_PERIOD_OPTIONS, AnalysisPeriod } from '../core/search/analysisPeriod.types';
import { safeJsonParse } from "../utils/jsonParser";

export interface KeywordCollectionParams {
  context: Context;
  sources: SearchSource[];
  depth: { google: number; naver: number } | number; // Support legacy number or new object
  period: AnalysisPeriod;
}

export async function collectKeywords(params: KeywordCollectionParams): Promise<KeywordNode[]> {
  const { context, sources, depth, period } = params;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const sourceText = sources.join(' and ');
  
  // Normalize depth description based on the max level if object is passed
  const effectiveDepth = typeof depth === 'number' ? depth : Math.max(depth.google, depth.naver);
  const depthText = ['very low', 'low', 'medium', 'high', 'very high'][Math.min(effectiveDepth - 1, 4)] || 'medium';
  
  const periodLabel = ANALYSIS_PERIOD_OPTIONS.find(p => p.value === period)?.label || 'the last 3 months';
  
  const prompt = `
    Analyze the following market situation (Context) and generate a detailed list of related keywords.
    
    Situation: "${context.situation}"
    Description: "${context.description || 'N/A'}"
    
    Analysis Parameters:
    - Data Sources: ${sourceText}
    - Analysis Depth: ${depthText} (Level ${effectiveDepth})
    - Time Period: ${periodLabel}
    
    Instructions:
    - Generate at least 20 highly relevant keywords.
    - For each keyword, provide the following data:
      - keyword: The search term itself (in Korean).
      - volume: Estimated monthly search volume (numeric).
      - cognition: The primary user cognition / intent ('informational', 'exploratory', 'commercial', 'transactional').
      - cpc: Estimated Cost-Per-Click in KRW.
      - competition: SEO/SEM competition level ('LOW', 'MEDIUM', 'HIGH').
    - The results should be diverse, covering all relevant user cognition states for this situation.
    - Ensure all text values are in Korean.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      temperature: 0.15, // 키워드 분류 — 팩트 기반 정확도
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            volume: { type: Type.NUMBER },
            cognition: { type: Type.STRING },
            cpc: { type: Type.NUMBER },
            competition: { type: Type.STRING }
          },
          required: ["keyword", "volume", "cognition", "cpc", "competition"]
        }
      }
    }
  });

  // Map cognition back to intent if needed for backward compatibility during parsing
  const rawResults = safeJsonParse<any[]>(response.text);
  return rawResults.map(r => ({
    ...r,
    intent: r.cognition || r.intent
  })) as KeywordNode[];
}
