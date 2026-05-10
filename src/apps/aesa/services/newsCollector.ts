import axios from "axios";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  date: string;
  description: string;
}

// 산업별 네이버 쇼핑인사이트 카테고리 코드 매핑
export const INDUSTRY_CATEGORY_MAP: Record<string, { code: string; name: string }> = {
  식품: { code: "50000000", name: "식품" },
  음식: { code: "50000000", name: "식품" },
  푸드: { code: "50000000", name: "식품" },
  식음료: { code: "50000000", name: "식품" },
  화장품: { code: "50000002", name: "화장품/미용" },
  뷰티: { code: "50000002", name: "화장품/미용" },
  코스메틱: { code: "50000002", name: "화장품/미용" },
  전자: { code: "50000003", name: "디지털/가전" },
  IT: { code: "50000003", name: "디지털/가전" },
  가전: { code: "50000003", name: "디지털/가전" },
  스마트폰: { code: "50000003", name: "디지털/가전" },
  자동차: { code: "50000006", name: "자동차용품" },
  차량: { code: "50000006", name: "자동차용품" },
  유통: { code: "50000001", name: "패션의류" },
  패션: { code: "50000001", name: "패션의류" },
  의류: { code: "50000001", name: "패션의류" },
};

export const DEFAULT_KOREA_QUERY = ["시장", "트렌드", "소비자", "전략", "경쟁"];

// 산업 카테고리 자동 감지
export function detectIndustryCategory(
  category: string,
  keywords: string
): { code: string; name: string } | null {
  const combined = (category + " " + keywords).toLowerCase();
  for (const [key, value] of Object.entries(INDUSTRY_CATEGORY_MAP)) {
    if (combined.includes(key.toLowerCase())) {
      return value;
    }
  }
  return null;
}

// 중복 제거
export function dedupeNews(news: NewsItem[]): NewsItem[] {
  const map = new Map<string, NewsItem>();
  news.forEach((n) => {
    if (!map.has(n.title)) map.set(n.title, n);
  });
  return Array.from(map.values());
}

// 네이버 뉴스 검색 API 호출 (server.ts의 /api/news 프록시 경유)
export async function collectKoreanNews(keyword: string): Promise<NewsItem[]> {
  try {
    const response = await axios.get(`/api/news?query=${encodeURIComponent(keyword)}`);
    return response.data || [];
  } catch (error) {
    console.error("[newsCollector] News fetch error:", error);
    return [];
  }
}

// 네이버 DataLab 검색어 트렌드 수집
export async function collectSearchTrend(
  keywords: string[]
): Promise<{ keyword: string; data: { period: string; ratio: number }[] }[]> {
  if (!keywords.length) return [];
  try {
    const response = await axios.post("/api/datalab/trend", { keywords });
    const results = response.data?.results || [];
    return results.map((r: any) => ({
      keyword: r.title,
      data: (r.data || []).map((d: any) => ({
        period: d.period,
        ratio: d.ratio,
      })),
    }));
  } catch (error) {
    console.error("[newsCollector] DataLab trend error:", error);
    return [];
  }
}

// 네이버 쇼핑인사이트 수집
export async function collectShoppingInsight(
  categoryCode: string,
  categoryName: string
): Promise<{ period: string; ratio: number }[]> {
  try {
    const response = await axios.post("/api/datalab/shopping", {
      categoryCode,
      categoryName,
    });
    const results = response.data?.results?.[0]?.data || [];
    return results.map((d: any) => ({ period: d.period, ratio: d.ratio }));
  } catch (error) {
    console.error("[newsCollector] Shopping insight error:", error);
    return [];
  }
}

// DataLab 결과를 Fact Sheet 텍스트로 변환
export function formatTrendAsFactSheet(
  trendData: { keyword: string; data: { period: string; ratio: number }[] }[],
  shoppingData: { period: string; ratio: number }[],
  categoryName: string
): string {
  if (!trendData.length && !shoppingData.length) return "";

  let text = "\n=== [NAVER-DATALAB] 네이버 검색트렌드 및 쇼핑인사이트 (소비자 관심도 정량 데이터) ===\n";
  text += "※ 출처: 네이버 DataLab API (실측 검색/클릭 데이터, 0~100 상대지수)\n\n";

  if (trendData.length) {
    text += "[검색어 트렌드 - 월별 관심도]\n";
    trendData.forEach((t) => {
      const latest = t.data.slice(-3);
      const avg = latest.reduce((s, d) => s + d.ratio, 0) / (latest.length || 1);
      text += `  · "${t.keyword}": 최근 3개월 평균 관심도 ${avg.toFixed(1)} (최신: ${latest[latest.length - 1]?.period || "N/A"})\n`;
    });
  }

  if (shoppingData.length) {
    const latest3 = shoppingData.slice(-3);
    const avg = latest3.reduce((s, d) => s + d.ratio, 0) / (latest3.length || 1);
    const trend =
      latest3.length >= 2
        ? latest3[latest3.length - 1].ratio > latest3[0].ratio
          ? "상승"
          : "하락"
        : "보합";
    text += `\n[쇼핑인사이트 - ${categoryName} 카테고리 클릭 추이]\n`;
    text += `  · 최근 3개월 평균 클릭지수: ${avg.toFixed(1)} (추세: ${trend})\n`;
    latest3.forEach((d) => {
      text += `    ${d.period}: ${d.ratio}\n`;
    });
  }

  text += "============================================================\n";
  return text;
}
