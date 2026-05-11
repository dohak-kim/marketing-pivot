
/**
 * Ground Truth Data Pipeline — Orchestrator
 *
 * Priority order:
 *   1. Real APIs (Serper + Naver) when env keys present
 *   2. Gemini Google Search grounding as fallback
 *
 * All outputs carry a `sources` provenance object so the UI can show
 * "estimated" badges wherever real data was unavailable.
 *
 * Caching contract:
 *   - callers are responsible for checking/writing cache (7-day TTL recommended)
 *   - this module only does fresh collection
 */

import { fetchGoogleSerpBatch } from './serperClient';
import { fetchNaverSearch, fetchNaverKeywordVolumesBatch, fetchNaverDataLabTrendBatch } from './naverClient';
import type {
  SerpApiPayload,
  EnrichedKeyword,
  SerperKeywordResult,
  NaverKeywordVolume,
  NaverTrendData,
} from './types';

/**
 * Vite 빌드 시 import.meta.env.VITE_* 를 실제 키값으로 정적 치환.
 * process.env 동적 접근은 브라우저에서 실패하므로 사용하지 않는다.
 */
export function getEnvPipelineConfig(): PipelineConfig {
  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  const e = import.meta.env as Record<string, string | undefined>;
  return {
    serperApiKey:      e.VITE_SERPER_API_KEY,
    naverClientId:     e.VITE_NAVER_CLIENT_ID,
    naverClientSecret: e.VITE_NAVER_CLIENT_SECRET,
    naverAdApiKey:     e.VITE_NAVER_AD_API_KEY,
    naverAdSecret:     e.VITE_NAVER_AD_SECRET,
    naverAdCustomerId: e.VITE_NAVER_AD_CUSTOMER_ID,
  };
}

/** Returns true if at least one real API key is available */
export function hasRealApiConfig(cfg = getEnvPipelineConfig()): boolean {
  return !!(cfg.serperApiKey || cfg.naverClientId);
}

export interface PipelineConfig {
  serperApiKey?: string;
  naverClientId?: string;
  naverClientSecret?: string;
  naverAdApiKey?: string;
  naverAdSecret?: string;
  naverAdCustomerId?: string;
}

export async function collectSerpData(
  category: string,
  seedKeywords: string[],
  config: PipelineConfig,
  onProgress?: (step: string, done: number, total: number) => void,
): Promise<SerpApiPayload> {
  const hasSerper = !!config.serperApiKey;
  const hasNaverSearch = !!config.naverClientId && !!config.naverClientSecret;
  const hasNaverAd = !!config.naverAdApiKey && !!config.naverAdSecret && !!config.naverAdCustomerId;

  const keywords: EnrichedKeyword[] = [];

  if (!hasSerper && !hasNaverSearch) {
    // Full fallback — return empty payload; caller (gemini.ts) will use grounding
    return {
      category,
      keywords: [],
      collectedAt: new Date().toISOString(),
      sources: { naverApiUsed: false, serperApiUsed: false, fallbackToGrounding: true },
    };
  }

  // ── 1. Google SERP via Serper ────────────────────────────────────────────
  let serperResults: SerperKeywordResult[] = [];
  if (hasSerper) {
    onProgress?.('Google SERP 수집 중', 0, seedKeywords.length);
    serperResults = await fetchGoogleSerpBatch(
      seedKeywords,
      { apiKey: config.serperApiKey!, country: 'kr', lang: 'ko', num: 10 },
      (done, total) => onProgress?.('Google SERP 수집 중', done, total),
    );
  }

  // ── 2. Naver Keyword Volumes ─────────────────────────────────────────────
  let naverVolumes: NaverKeywordVolume[] = [];
  if (hasNaverAd) {
    onProgress?.('Naver 검색량 수집 중', 0, seedKeywords.length);
    naverVolumes = await fetchNaverKeywordVolumesBatch(seedKeywords, {
      apiKey: config.naverAdApiKey!,
      secret: config.naverAdSecret!,
      customerId: config.naverAdCustomerId!,
    });
  }

  // ── 2.5. Naver DataLab 검색어트렌드 ───────────────────────────────────────
  const naverTrends: Map<string, NaverTrendData> = new Map();
  if (hasNaverSearch) {
    onProgress?.('Naver 트렌드 수집 중', 0, seedKeywords.length);
    try {
      const trendResults = await fetchNaverDataLabTrendBatch(seedKeywords, {
        clientId: config.naverClientId!,
        clientSecret: config.naverClientSecret!,
      });
      trendResults.forEach(t => naverTrends.set(t.keyword, t));
    } catch {
      // DataLab failure is non-fatal — continue without trend data
    }
  }

  // ── 3. Naver Blog/News Content — 전체 병렬 실행 ──────────────────────────
  const naverContent: Map<string, string[]> = new Map();
  if (hasNaverSearch) {
    onProgress?.('Naver 콘텐츠 수집 중', 0, seedKeywords.length);
    const naverResults = await Promise.all(
      seedKeywords.map(kw =>
        fetchNaverSearch(kw, 'blog', {
          clientId: config.naverClientId!,
          clientSecret: config.naverClientSecret!,
        }, 10).catch(() => null)
      )
    );
    naverResults.forEach((result, i) => {
      naverContent.set(
        seedKeywords[i],
        result ? result.items.map(item => `${item.title} ${item.description}`) : []
      );
    });
    onProgress?.('Naver 콘텐츠 수집 중', seedKeywords.length, seedKeywords.length);
  }

  // ── 4. Normalize into EnrichedKeyword array ──────────────────────────────
  for (const kw of seedKeywords) {
    const serper = serperResults.find(r => r.keyword === kw);
    const naverVol = naverVolumes.find(v => v.keyword === kw);
    const naverTexts = naverContent.get(kw) ?? [];

    const topResults = [
      ...(serper?.organic.slice(0, 5).map(o => ({
        title: o.title,
        snippet: o.snippet,
        link: o.link,
        source: 'google' as const,
      })) ?? []),
      ...naverTexts.slice(0, 5).map(text => ({
        title: text,
        snippet: '',
        link: '',
        source: 'naver' as const,
      })),
    ];

    keywords.push({
      keyword: kw,
      pcVolumeRange: naverVol?.pcMonthlyQcCnt ?? null,
      mobileVolumeRange: naverVol?.mobileMonthlyQcCnt ?? null,
      googleVolumeProxy: serper
        ? serper.organic.length * 1000  // very rough proxy; real volume needs Google Ads API
        : null,
      hasFeaturedSnippet: !!serper?.featuredSnippet,
      hasPAA: (serper?.peopleAlsoAsk?.length ?? 0) > 0,
      hasAIOverview: serper?.aiOverview?.present ?? false,
      hasShopping: serper?.organic.some(r => r.link.includes('shopping')) ?? false,
      hasVideoCarousel: serper?.organic.some(r =>
        r.link.includes('youtube.com') || r.link.includes('youtu.be')
      ) ?? false,
      topResults,
      paaQuestions: serper?.peopleAlsoAsk?.map(p => p.question) ?? [],
      trendData: naverTrends.get(kw) ?? null,
      volumeSource: naverVol ? 'naver_api' : 'estimated',
      serpSource: serper ? 'serper' : 'grounding_estimate',
      collectedAt: new Date().toISOString(),
    });
  }

  return {
    category,
    keywords,
    collectedAt: new Date().toISOString(),
    sources: {
      naverApiUsed: hasNaverSearch || hasNaverAd,
      serperApiUsed: hasSerper,
      fallbackToGrounding: false,
    },
  };
}

/**
 * Extracts brand mention counts from EnrichedKeyword top results.
 * Replaces the "Simulate Top 10 SERP results" AI instruction.
 */
export function countBrandMentions(
  payload: SerpApiPayload,
  brandName: string,
  competitors: string[],
): Array<{ brand: string; count: number }> {
  const brands = [brandName, ...competitors].filter(Boolean);
  const counts: Map<string, number> = new Map(brands.map(b => [b, 0]));

  for (const kw of payload.keywords) {
    for (const result of kw.topResults) {
      const text = `${result.title} ${result.snippet}`.toLowerCase();
      for (const brand of brands) {
        if (text.includes(brand.toLowerCase())) {
          counts.set(brand, (counts.get(brand) ?? 0) + 1);
        }
      }
    }
  }

  return brands.map(brand => ({ brand, count: counts.get(brand) ?? 0 }));
}
