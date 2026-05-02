
/**
 * Serper.dev API Client — Google SERP + Features
 *
 * Handles: organic results, Featured Snippet, PAA (People Also Ask),
 * AI Overview (SGE), Shopping carousel, video results.
 *
 * Requires env: SERPER_API_KEY
 * Docs: https://serper.dev/api-reference
 */

import type { SerperKeywordResult } from './types';

// Dev: Vite proxy → Prod: Vercel serverless function (both at same path)
const SERPER_ENDPOINT = '/api/serper/search';

export interface SerperClientConfig {
  apiKey: string;
  country?: string; // default 'kr'
  lang?: string;    // default 'ko'
  num?: number;     // results per query, default 10
}

export async function fetchGoogleSerp(
  keyword: string,
  config: SerperClientConfig,
): Promise<SerperKeywordResult> {
  const body = {
    q: keyword,
    gl: config.country ?? 'kr',
    hl: config.lang ?? 'ko',
    num: config.num ?? 10,
  };

  const res = await fetch(SERPER_ENDPOINT, {
    method: 'POST',
    headers: {
      'X-API-KEY': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Serper API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  return {
    keyword,
    searchParameters: {
      q: keyword,
      gl: body.gl,
      hl: body.hl,
      num: body.num,
    },
    organic: (data.organic ?? []).map((item: any) => ({
      title: item.title ?? '',
      link: item.link ?? '',
      snippet: item.snippet ?? '',
      position: item.position ?? 0,
      date: item.date,
    })),
    peopleAlsoAsk: (data.peopleAlsoAsk ?? []).map((item: any) => ({
      question: item.question ?? '',
      snippet: item.snippet ?? '',
      link: item.link,
    })),
    featuredSnippet: data.answerBox
      ? {
          title: data.answerBox.title ?? '',
          snippet: data.answerBox.snippet ?? data.answerBox.answer ?? '',
          link: data.answerBox.link ?? '',
        }
      : undefined,
    aiOverview: {
      present: !!data.aiOverview,
      snippet: data.aiOverview?.snippet,
    },
    relatedSearches: (data.relatedSearches ?? []).map((r: any) => r.query ?? r),
  };
}

/**
 * Batch fetch for multiple keywords.
 * Adds 200ms inter-request delay to stay within rate limits.
 */
export async function fetchGoogleSerpBatch(
  keywords: string[],
  config: SerperClientConfig,
  onProgress?: (done: number, total: number) => void,
): Promise<SerperKeywordResult[]> {
  const results: SerperKeywordResult[] = [];
  for (let i = 0; i < keywords.length; i++) {
    results.push(await fetchGoogleSerp(keywords[i], config));
    onProgress?.(i + 1, keywords.length);
    if (i < keywords.length - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return results;
}
