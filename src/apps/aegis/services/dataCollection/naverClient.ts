
/**
 * Naver API Clients
 *
 * Two separate APIs:
 *  1. Naver Search API — blog / news / webdoc / kin results (OAuth or Client ID)
 *     Requires env: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
 *
 *  2. Naver Search Ads API — keyword monthly volume + CPC (advertiser account required)
 *     Requires env: NAVER_AD_API_KEY, NAVER_AD_SECRET, NAVER_AD_CUSTOMER_ID
 *     Docs: https://naver.github.io/searchad-apidoc
 *
 * Note: Naver volume API returns RANGES (e.g. "1000~10000"), not exact counts.
 * The data model uses NaverVolumeRange to make this explicit.
 */

import type { NaverSearchResult, NaverKeywordVolume, NaverVolumeRange, NaverTrendData, NaverTrendPoint, TrendDirection } from './types';

// ── Naver Search API ────────────────────────────────────────────────────────

const NAVER_SEARCH_BASE = '/api/naver/v1/search';

export interface NaverSearchConfig {
  clientId: string;
  clientSecret: string;
}

type NaverSearchType = 'blog' | 'news' | 'webkr' | 'kin';

export async function fetchNaverSearch(
  keyword: string,
  type: NaverSearchType,
  config: NaverSearchConfig,
  display = 20,
): Promise<NaverSearchResult> {
  const params = new URLSearchParams({ query: keyword, display: String(display), sort: 'sim' });
  const res = await fetch(`${NAVER_SEARCH_BASE}/${type}?${params}`, {
    headers: {
      'X-Naver-Client-Id': config.clientId,
      'X-Naver-Client-Secret': config.clientSecret,
    },
  });

  if (!res.ok) {
    throw new Error(`Naver Search API error: ${res.status}`);
  }

  const data = await res.json();

  return {
    keyword,
    source: type === 'webkr' ? 'webdoc' : type as NaverSearchResult['source'],
    total: data.total ?? 0,
    items: (data.items ?? []).map((item: any) => ({
      title: stripHtml(item.title ?? ''),
      link: item.link ?? item.originallink ?? '',
      description: stripHtml(item.description ?? ''),
      bloggername: item.bloggername,
      postdate: item.postdate,
    })),
  };
}

// ── Naver Search Ads (Keyword Volume) API ───────────────────────────────────

const NAVER_AD_BASE = '/api/naver-ad';

export interface NaverAdConfig {
  apiKey: string;
  secret: string;
  customerId: string;
}

/**
 * Fetches monthly search volume + CPC for up to 5 keywords per request.
 * Naver limits: max 5 keywords per call, rate limit ~10 req/s.
 */
export async function fetchNaverKeywordVolumes(
  keywords: string[],
  config: NaverAdConfig,
): Promise<NaverKeywordVolume[]> {
  if (keywords.length === 0) return [];

  // Naver Ad API uses HMAC-SHA256 signature
  const timestamp = Date.now();
  const signature = await signNaverAdRequest(timestamp, 'GET', '/keywordstool', config.secret);

  const url = new URL(`${NAVER_AD_BASE}/keywordstool`);
  url.searchParams.set('hintKeywords', keywords.slice(0, 5).join(','));
  url.searchParams.set('showDetail', '1');

  const res = await fetch(url.toString(), {
    headers: {
      'X-Timestamp': String(timestamp),
      'X-API-KEY': config.apiKey,
      'X-Customer': config.customerId,
      'X-Signature': signature,
    },
  });

  if (!res.ok) {
    throw new Error(`Naver Ad API error: ${res.status}`);
  }

  const data = await res.json();

  return (data.keywordList ?? []).map((item: any): NaverKeywordVolume => ({
    keyword: item.relKeyword,
    pcMonthlyQcCnt: normalizeNaverVolume(item.monthlyPcQcCnt),
    mobileMonthlyQcCnt: normalizeNaverVolume(item.monthlyMobileQcCnt),
    monthlyAvgClkCnt: item.monthlyAvgClkCnt,
    monthlyAvgCpc: item.monthlyAvgCpc,
    compIdx: item.compIdx,
    relKeywords: [],
  }));
}

/**
 * Batch fetch keyword volumes in groups of 5 (Naver API limit).
 */
export async function fetchNaverKeywordVolumesBatch(
  keywords: string[],
  config: NaverAdConfig,
): Promise<NaverKeywordVolume[]> {
  const results: NaverKeywordVolume[] = [];
  for (let i = 0; i < keywords.length; i += 5) {
    const batch = keywords.slice(i, i + 5);
    const batchResults = await fetchNaverKeywordVolumes(batch, config);
    results.push(...batchResults);
    if (i + 5 < keywords.length) {
      await new Promise(r => setTimeout(r, 120)); // ~8 req/s
    }
  }
  return results;
}

// ── Naver DataLab 검색어트렌드 API ──────────────────────────────────────────────

const NAVER_DATALAB_BASE = '/api/naver/v1/datalab/search';

/**
 * Fetches 12-month relative search trend for up to 5 keywords per call.
 * Uses the same Client ID/Secret as the Search API.
 */
export async function fetchNaverDataLabTrend(
  keywords: string[],
  config: NaverSearchConfig,
): Promise<NaverTrendData[]> {
  if (keywords.length === 0) return [];

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const body = {
    startDate: fmt(startDate),
    endDate: fmt(endDate),
    timeUnit: 'month',
    keywordGroups: keywords.slice(0, 5).map(kw => ({
      groupName: kw,
      keywords: [kw],
    })),
  };

  const res = await fetch(NAVER_DATALAB_BASE, {
    method: 'POST',
    headers: {
      'X-Naver-Client-Id': config.clientId,
      'X-Naver-Client-Secret': config.clientSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Naver DataLab API error: ${res.status}`);
  }

  const data = await res.json();

  return (data.results ?? []).map((result: any): NaverTrendData => {
    const points: NaverTrendPoint[] = (result.data ?? []).map((d: any) => ({
      period: d.period,
      ratio: d.ratio,
    }));
    return { keyword: result.title, ...analyzeTrend(points) };
  });
}

/**
 * Batch version — splits into groups of 5 (DataLab limit per request).
 */
export async function fetchNaverDataLabTrendBatch(
  keywords: string[],
  config: NaverSearchConfig,
): Promise<NaverTrendData[]> {
  const results: NaverTrendData[] = [];
  for (let i = 0; i < keywords.length; i += 5) {
    const batch = keywords.slice(i, i + 5);
    const batchResults = await fetchNaverDataLabTrend(batch, config);
    results.push(...batchResults);
    if (i + 5 < keywords.length) {
      await new Promise(r => setTimeout(r, 150));
    }
  }
  return results;
}

function analyzeTrend(points: NaverTrendPoint[]): Omit<NaverTrendData, 'keyword'> {
  if (points.length === 0) {
    return { points: [], direction: 'stable', momentum: 1, recentAvg: 0 };
  }

  const ratios = points.map(p => p.ratio);
  const recent = ratios.slice(-3);
  const older = ratios.slice(0, -3);

  const recentAvg = avg(recent);
  const olderAvg = avg(older.length > 0 ? older : recent);
  const momentum = olderAvg > 0 ? recentAvg / olderAvg : 1;

  const stdDev = std(ratios);
  const peakRatio = Math.max(...ratios);
  const peakMonth = points.find(p => p.ratio === peakRatio)?.period;

  let direction: TrendDirection;
  if (stdDev > 20 && momentum < 0.85) {
    direction = 'seasonal';
  } else if (momentum > 1.2) {
    direction = 'rising';
  } else if (momentum < 0.8) {
    direction = 'falling';
  } else {
    direction = 'stable';
  }

  return { points, direction, momentum: Math.round(momentum * 100) / 100, peakMonth, recentAvg: Math.round(recentAvg) };
}

function avg(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
}

function std(arr: number[]): number {
  const m = avg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
}

/**
 * Naver volume API returns numeric values for high-volume keywords
 * and string "<10" for very low ones. This normalizes to a range label.
 */
function normalizeNaverVolume(raw: any): NaverVolumeRange {
  const n = Number(raw);
  if (isNaN(n)) return '1~10';
  if (n < 10) return '1~10';
  if (n < 100) return '10~100';
  if (n < 1000) return '100~1000';
  if (n < 10000) return '1000~10000';
  if (n < 100000) return '10000~100000';
  return '100000+';
}

/**
 * HMAC-SHA256 signature for Naver Ad API authentication.
 * Uses Web Crypto API (available in modern Node.js 18+ and browsers).
 */
async function signNaverAdRequest(
  timestamp: number,
  method: string,
  path: string,
  secret: string,
): Promise<string> {
  const message = `${timestamp}.${method}.${path}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
