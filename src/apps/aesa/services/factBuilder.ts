import { GroundingSource, CategorizedSources } from "../types";

// ─── Fact Sheet 빌더 ────────────────────────────────────────────────
export function buildFactSheet(articles: any[]) {
  return articles.map((a, i) => ({
    id: `SRC-${i + 1}`,
    title: a.title,
    source: a.source || "news",
    date: a.date,
    content: a.summary || a.content || a.description || "",
  }));
}

// ─── Fact 검증 (강화) ───────────────────────────────────────────────
// 기존: content.length < 100 필터만 존재
// 개선: 날짜 유효성 + 광고성 패턴 제거 + 수치 데이터 우선 정렬
export function validateFacts(facts: any[]): any[] {
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setFullYear(now.getFullYear() - 3); // 3년 이상 된 기사 제외

  const spamPatterns = [
    /^광고/,
    /후원$/,
    /\[광고\]/,
    /제공\s*=\s*.+/,
    /기자\s*=\s*광고/,
  ];

  const validated = facts.filter((f) => {
    if (!f.content) return false;
    if (f.content.length < 100) return false;

    if (f.date) {
      const articleDate = new Date(f.date);
      if (!isNaN(articleDate.getTime()) && articleDate < cutoffDate) {
        return false;
      }
    }

    if (spamPatterns.some((p) => p.test(f.title || ""))) return false;

    return true;
  });

  // 수치 데이터 포함 기사 우선 정렬 (시장 규모 분석 품질 향상)
  return validated.sort((a, b) => {
    const aHasNumbers = /\d+[%억만원달러조]/.test(a.content) ? 1 : 0;
    const bHasNumbers = /\d+[%억만원달러조]/.test(b.content) ? 1 : 0;
    return bHasNumbers - aHasNumbers;
  });
}

// ─── 소스 2-tier 분류 ───────────────────────────────────────────────
// verified    : URI 포함 실제 링크 (Google Grounding / 네이버 뉴스)
// aiGenerated : AI 응답 내 sources[] 문자열 — 원문 확인 불가
export function categorizeSources(
  groundingSources: GroundingSource[],
  aiTextSources: string[]
): CategorizedSources {
  const verified = groundingSources.filter(
    (s) => s.uri && s.uri.startsWith("http")
  );

  const unique = Array.from(new Set(aiTextSources)).filter(
    (s) => s && s.trim().length > 3
  );

  const verifiedTitles = new Set(verified.map((s) => s.title?.toLowerCase()));
  const aiOnly = unique.filter(
    (s) => !verifiedTitles.has(s.toLowerCase())
  );

  return { verified, aiGenerated: aiOnly };
}

// ─── 참고문헌 텍스트 생성 ────────────────────────────────────────────
export function buildReferenceList(categorized: CategorizedSources): string {
  let text = "\n\n[참고문헌]\n";

  if (categorized.verified.length) {
    text += "\n▶ 검증된 출처 (링크 확인 가능)\n";
    categorized.verified.forEach((s, i) => {
      text += `  [V${i + 1}] ${s.title}\n       ${s.uri}\n`;
    });
  }

  if (categorized.aiGenerated.length) {
    text += "\n▶ AI 추론 기반 출처 (원문 확인 권장)\n";
    categorized.aiGenerated.forEach((s, i) => {
      text += `  [A${i + 1}] ${s}\n`;
    });
  }

  return text;
}

// ─── 기존 호환용 ─────────────────────────────────────────────────────
export interface SourceItem {
  id: string;
  title: string;
  source: string;
  url: string;
  date: string;
  content: string;
}

export function removeUncitedStatements(text: string): string {
  const sentences = text.split(".");
  return sentences.filter((s) => /\[SRC-\d+\]/.test(s)).join(".");
}
