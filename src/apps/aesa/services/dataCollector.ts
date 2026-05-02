import { GoogleGenAI } from "@google/genai";
import { AnalysisInputs, GroundingSource, AnalysisStep } from "../types";
import { getGenerationConfig, GenerationStep } from "../config/generationConfig";
import {
  collectKoreanNews,
  dedupeNews,
  DEFAULT_KOREA_QUERY,
  collectSearchTrend,
  collectShoppingInsight,
  formatTrendAsFactSheet,
  detectIndustryCategory,
} from "./newsCollector";
import { extractArticle } from "./sourceCollector";
import { buildFactSheet, validateFacts, categorizeSources } from "./factBuilder";

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

export class DataCollector {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: resolveApiKey() });
  }

  private async generateContentWithRetry(model: string, params: any, retries = 3, delayMs = 2000): Promise<any> {
    try {
      return await this.ai.models.generateContent({ model, ...params });
    } catch (error: any) {
      if (retries > 0 && (
        error.status === 429 || error.code === 429 ||
        error.status === 503 || error.code === 503 ||
        error.status === 500 || error.code === 500 ||
        error.message?.includes('429') || error.message?.includes('quota')
      )) {
        console.warn(`DataCollector: API Error ${error.status || error.code}. Retrying in ${delayMs}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.generateContentWithRetry(model, params, retries - 1, delayMs * 2);
      }
      throw error;
    }
  }

  private async runGemini(prompt: string, step: GenerationStep, model: string = 'gemini-3.1-pro-preview', additionalConfig: any = {}) {
    return this.generateContentWithRetry(model, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { ...getGenerationConfig(step), ...additionalConfig }
    });
  }

  async optimizeSearchQuery(inputs: AnalysisInputs): Promise<string> {
    const prompt = `
      Context: Market Analysis for Industry "${inputs.category}" and Brand "${inputs.ownBrand}".
      Task: Generate a single, highly effective search query (max 10 words) to find the most relevant recent news and market data.
      Keywords provided by user: "${inputs.keywords}".
      Output ONLY the query string.
    `;
    try {
      const response = await this.runGemini(prompt, 'keyword', 'gemini-2.5-flash');
      return response.text.trim() || `${inputs.category} ${inputs.ownBrand} ${DEFAULT_KOREA_QUERY.join(' ')}`;
    } catch (e) {
      return `${inputs.category} ${inputs.ownBrand} ${inputs.keywords} ${DEFAULT_KOREA_QUERY.join(' ')}`;
    }
  }

  async collectOfficialData(inputs: AnalysisInputs): Promise<{ text: string; sources: GroundingSource[] }> {
    const prompt = `
      Perform a targeted search for the official websites and verified information channels of:
      - Target Brand: "${inputs.ownBrand}"
      - Competitors: "${inputs.competitors.join(', ')}"
      Please extract the following for each brand:
      1. Official Mission Statement or Brand Philosophy.
      2. Key Product/Service Features highlighted on their main landing page.
      3. Strategic direction or vision mentioned in their "About Us" or "Investor Relations" sections.
      Format the output as a structured summary (text).
    `;
    try {
      const response = await this.runGemini(prompt, 'analysis', 'gemini-2.5-flash', {
        tools: [{ googleSearch: {} }]
      });
      const text = response.text || '';
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = chunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({ title: chunk.web.title, uri: chunk.web.uri }));
      return { text, sources };
    } catch (error) {
      console.error("Official data collection failed:", error);
      return { text: '', sources: [] };
    }
  }

  async collectMarketStats(inputs: AnalysisInputs): Promise<{ text: string; sources: GroundingSource[] }> {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 10;

    const foodKeywords = ['식품', '푸드', '음식', '식음료', '가공식품', '외식', '급식', 'food', 'beverage', 'snack', 'bakery', 'meal', 'restaurant'];
    const isFoodRelated = foodKeywords.some(keyword =>
      inputs.category.toLowerCase().includes(keyword) ||
      inputs.keywords.toLowerCase().includes(keyword) ||
      inputs.ownBrand.toLowerCase().includes(keyword)
    );

    const autoKeywords = ['자동차', '차량', '자동차', 'car', 'auto', 'vehicle', 'suv', 'ev', '전기차'];
    const isAutoRelated = autoKeywords.some(keyword =>
      inputs.category.toLowerCase().includes(keyword) ||
      inputs.keywords.toLowerCase().includes(keyword)
    );

    const beautyKeywords = ['화장품', '뷰티', '코스메틱', 'beauty', 'cosmetic', 'skincare'];
    const isBeautyRelated = beautyKeywords.some(keyword =>
      inputs.category.toLowerCase().includes(keyword) ||
      inputs.keywords.toLowerCase().includes(keyword)
    );

    const itKeywords = ['전자', 'IT', '반도체', '소프트웨어', 'tech', 'software', 'hardware', 'semiconductor'];
    const isITRelated = itKeywords.some(keyword =>
      inputs.category.toLowerCase().includes(keyword) ||
      inputs.keywords.toLowerCase().includes(keyword)
    );

    let specificSourceInstruction = "";

    if (isFoodRelated) {
      specificSourceInstruction = `
      [FOOD INDUSTRY] Prioritize:
      - Korea Agro-Fisheries & Food Trade Corporation (aT) / ATFIS (atfis.or.kr)
      - 식약처 식품안전나라
      - KOSIS 음식료품 제조업 통계
      `;
    } else if (isAutoRelated) {
      specificSourceInstruction = `
      [AUTO INDUSTRY] Prioritize:
      - KAMA 한국자동차산업협회 (kama.or.kr) 자동차 판매통계
      - KAIDA 한국수입자동차협회 수입차 판매통계
      - KOSIS 운수업 통계
      `;
    } else if (isBeautyRelated) {
      specificSourceInstruction = `
      [BEAUTY INDUSTRY] Prioritize:
      - 대한화장품협회 KCIA (kcia.or.kr) 화장품 생산실적
      - 식약처 의약외품·화장품 통계
      - 한국무역협회 화장품 수출 통계
      `;
    } else if (isITRelated) {
      specificSourceInstruction = `
      [IT/ELECTRONICS INDUSTRY] Prioritize:
      - IITP ICT통계포털 (iitp.kr)
      - NIPA 소프트웨어산업 실태조사
      - KOSIS 전자부품·컴퓨터 제조업 통계
      `;
    }

    const prompt = `
      Find detailed quantitative market data for the "${inputs.category}" industry (Korea and Global markets).
      ${specificSourceInstruction}
      Look for yearly market size data from ${startYear} to ${currentYear}.
      Specifically:
      1. Yearly Market Size values (KRW, USD, or Units) for EACH year between ${startYear} and ${currentYear}.
      2. Future Market Projections (2025-2030) if available.
      3. Key CAGR figures and analyst reports.
      If exact yearly tables are not found, look for YoY growth rates to reconstruct the data.
      Summarize key statistics with numbers.
    `;

    try {
      const response = await this.runGemini(prompt, 'analysis', 'gemini-2.5-flash', {
        tools: [{ googleSearch: {} }]
      });
      const text = response.text || '';
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = chunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({ title: chunk.web.title, uri: chunk.web.uri }));
      return { text, sources };
    } catch (error) {
      console.error("Market stats collection failed:", error);
      return { text: '', sources: [] };
    }
  }

  /**
   * Pipeline:
   * 1) Query Optimize
   * 2) 네이버 뉴스 API (구: Google RSS)
   * 3) 네이버 DataLab 검색트렌드 + 쇼핑인사이트 (신규)
   * 4) Google Grounding — Official Data + Market Stats
   * 5) Fact Sheet 조합 + 소스 URI 필터링
   */
  async createFactSheet(
    inputs: AnalysisInputs,
    onProgress?: (status: AnalysisStep) => void
  ): Promise<{ text: string; sources: GroundingSource[] }> {

    // 1. 검색 쿼리 최적화
    if (onProgress) onProgress('optimizing-query');
    const searchKeyword = await this.optimizeSearchQuery(inputs);

    // 2. 네이버 뉴스 수집
    if (onProgress) onProgress('fetching-news');
    const rawNews = await collectKoreanNews(searchKeyword);
    const cleanNews = dedupeNews(rawNews);
    const newsItems = cleanNews.map((item, i) => ({
      id: `SRC-${i + 1}`,
      title: item.title,
      source: item.source,
      url: item.link,
      date: item.date,
      content: item.description,
    }));

    // 3. 상위 5개 기사 본문 추출
    if (onProgress) onProgress('parsing-articles');
    const enrichedNewsItems = await Promise.all(
      newsItems.map(async (item, index) => {
        if (index < 5) {
          const fullContent = await extractArticle(item.url);
          if (fullContent) return { ...item, summary: fullContent };
        }
        return item;
      })
    );

    // 4. 네이버 DataLab — 검색트렌드 + 쇼핑인사이트
    const trendKeywords = [
      inputs.ownBrand,
      inputs.category,
      ...(inputs.keywords ? inputs.keywords.split(/[,\s]+/).slice(0, 2) : []),
    ].filter(Boolean);

    const [trendData, shoppingData] = await Promise.all([
      collectSearchTrend(trendKeywords).catch(() => []),
      (async () => {
        const cat = detectIndustryCategory(inputs.category, inputs.keywords || "");
        if (cat) return collectShoppingInsight(cat.code, cat.name).catch(() => []);
        return [];
      })(),
    ]);

    const datalabText = formatTrendAsFactSheet(trendData, shoppingData, inputs.category);

    // 5. Google Grounding — 공식 데이터 + 시장 통계
    const { text: officialText, sources: officialSources } = await this.collectOfficialData(inputs);
    const { text: statsText, sources: statsSources } = await this.collectMarketStats(inputs);

    // 6. 소스 통합 — URI 있는 것만 verified로
    const newsSources: GroundingSource[] = enrichedNewsItems.map((s) => ({
      title: s.title,
      uri: s.url,
    }));
    const allSources = [...officialSources, ...newsSources, ...statsSources];
    const uniqueSources = Array.from(
      new Map(allSources.map((s) => [s.uri, s])).values()
    ).filter((s) => s.uri && s.uri.startsWith("http"));

    // 7. Fact Sheet 조합 (신뢰도 높은 순서)
    if (onProgress) onProgress('building-facts');
    let finalFactSheet = "";

    if (officialText) {
      finalFactSheet += `
=== [OFFICIAL] 공식 브랜드/제조사 정보 (신뢰도: 최상) ===
${officialText}
============================================================\n`;
    }

    if (statsText) {
      finalFactSheet += `
=== [STATISTICS] 시장 규모 및 공식 통계 데이터 (신뢰도: 높음) ===
${statsText}
============================================================\n`;
    }

    if (datalabText) {
      finalFactSheet += datalabText;
    }

    let newsFactSheetItems = buildFactSheet(enrichedNewsItems);
    if (onProgress) onProgress('validating-facts');
    newsFactSheetItems = validateFacts(newsFactSheetItems);

    if (newsFactSheetItems.length > 0) {
      const newsText = newsFactSheetItems
        .map(
          (item: any) =>
            `[${item.id}]\n제목: ${item.title}\n출처: ${item.source}\n날짜: ${item.date}\n내용: ${item.content}\n`
        )
        .join("\n");
      finalFactSheet += `\n=== [NEWS] 네이버 최신 뉴스 (신뢰도: 중간) ===\n${newsText}`;
    }

    if (!finalFactSheet.trim()) {
      finalFactSheet = "수집된 데이터가 없습니다. 입력하신 키워드와 산업명을 확인해주세요.";
    }

    return { text: finalFactSheet, sources: uniqueSources };
  }
}
