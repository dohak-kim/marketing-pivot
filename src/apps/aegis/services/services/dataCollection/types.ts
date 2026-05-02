
/**
 * Data Collection Layer — API Payload Types
 *
 * These types define the "Ground Truth" data structures that real search APIs
 * return. When API keys are available, the pipeline fills these; without keys,
 * the system falls back to Gemini grounding and marks all volumes as estimated.
 */

// ── Serper.dev (Google SERP) ──────────────────────────────────────────────────

export interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  date?: string;
}

export interface SerperPAAItem {
  question: string;
  snippet: string;
  link?: string;
}

export interface SerperFeaturedSnippet {
  title: string;
  snippet: string;
  link: string;
}

export interface SerperAIOverview {
  present: boolean;
  snippet?: string;
}

export interface SerperKeywordResult {
  keyword: string;
  searchParameters: {
    q: string;
    gl: string;   // 'kr' for Korea
    hl: string;   // 'ko'
    num: number;
  };
  organic: SerperOrganicResult[];
  peopleAlsoAsk?: SerperPAAItem[];
  featuredSnippet?: SerperFeaturedSnippet;
  aiOverview?: SerperAIOverview;
  relatedSearches?: string[];
}

// ── Naver Search API ───────────────────────────────────────────────────────────

export interface NaverSearchItem {
  title: string;           // HTML tags stripped in normalizer
  link: string;
  description: string;
  bloggername?: string;
  postdate?: string;       // YYYYMMDD
}

export interface NaverSearchResult {
  keyword: string;
  source: 'blog' | 'news' | 'webdoc' | 'kin';
  total: number;           // Total result count (approximate)
  items: NaverSearchItem[];
}

// ── Naver Search Ads (Keyword Volume) API ─────────────────────────────────────

export type NaverVolumeRange =
  | '1~10'
  | '10~100'
  | '100~1000'
  | '1000~10000'
  | '10000~100000'
  | '100000+';

export interface NaverKeywordVolume {
  keyword: string;
  pcMonthlyQcCnt: NaverVolumeRange;   // PC monthly query count (range)
  mobileMonthlyQcCnt: NaverVolumeRange; // Mobile monthly query count (range)
  monthlyAvgClkCnt?: number;
  monthlyAvgCpc?: number;             // Average CPC in KRW
  compIdx?: 'low' | 'medium' | 'high'; // Competition index
  relKeywords?: string[];             // Related keywords (up to 50)
}

// ── Naver DataLab (검색어트렌드) ──────────────────────────────────────────────

export type TrendDirection = 'rising' | 'falling' | 'stable' | 'seasonal';

export interface NaverTrendPoint {
  period: string;   // "YYYY-MM"
  ratio: number;    // 0–100 (relative, 100 = peak)
}

export interface NaverTrendData {
  keyword: string;
  points: NaverTrendPoint[];       // Last 12 months
  direction: TrendDirection;
  momentum: number;                // avg(last 3mo) / avg(prev 9mo) — >1 means rising
  peakMonth?: string;              // Month with highest ratio
  recentAvg: number;               // avg ratio over last 3 months (0-100)
}

// ── Normalized Pipeline Output ─────────────────────────────────────────────────

/**
 * A single enriched keyword node combining volume + SERP data.
 * This is what gets fed to the AI synthesizer (Phase 2 RAG prompt).
 */
export interface EnrichedKeyword {
  keyword: string;

  // Volume data (null when not available — AI must NOT invent these)
  pcVolumeRange: NaverVolumeRange | null;
  mobileVolumeRange: NaverVolumeRange | null;
  googleVolumeProxy: number | null;  // From Google's search result count

  // SERP feature flags (used for AEO/GEO trigger logic)
  hasFeaturedSnippet: boolean;
  hasPAA: boolean;
  hasAIOverview: boolean;
  hasShopping: boolean;
  hasVideoCarousel: boolean;

  // Top organic results (titles + snippets for brand presence counting)
  topResults: Array<{
    title: string;
    snippet: string;
    link: string;
    source: 'google' | 'naver';
  }>;

  // PAA questions (for AEO content strategy)
  paaQuestions: string[];

  // Naver DataLab trend (null when not available)
  trendData?: NaverTrendData | null;

  // Data provenance
  volumeSource: 'naver_api' | 'google_api' | 'estimated';
  serpSource: 'serper' | 'google_cse' | 'grounding_estimate';
  collectedAt: string; // ISO timestamp
}

/**
 * The full payload passed to the AI synthesizer.
 * AI receives this and ONLY performs: clustering, cognition classification, CDJ mapping.
 */
export interface SerpApiPayload {
  category: string;
  keywords: EnrichedKeyword[];
  collectedAt: string;
  sources: {
    naverApiUsed: boolean;
    serperApiUsed: boolean;
    fallbackToGrounding: boolean;
  };
}
