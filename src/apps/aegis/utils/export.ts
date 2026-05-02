
import { RawDataItem, Context, ExecutionPlan } from '../core/context';
import { ForgeOutput } from '../core/types/contentGeneration';

// ── Generic helpers ───────────────────────────────────────────────────────────

function escapeCsvCell(cell: any): string {
  if (cell == null) return '';
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob(['﻿' + content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.visibility = 'hidden';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(category: string): string {
  return category.replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ]/g, '_').slice(0, 30);
}

// ── 1. Raw Data CSV (기존 유지) ───────────────────────────────────────────────

export function exportToCsv(data: RawDataItem[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(','),
    ...data.map(r => headers.map(h => escapeCsvCell(r[h as keyof RawDataItem])).join(',')),
  ];
  downloadBlob(rows.join('\n'), filename, 'text/csv');
}

// ── 2. CEP 전략 데이터 CSV ────────────────────────────────────────────────────

export function exportContextsAsCsv(contexts: Context[], brandName = ''): void {
  if (!contexts.length) return;

  const headers = [
    'CEP ID', '클러스터명', '상황 설명', 'CDJ 단계', '지배 인지',
    '전략 유형', 'Priority Score', 'SOV 자사%', 'SOV 경쟁%',
    'Naver 볼륨 구간', '데이터 출처', '실행 목표',
  ];

  const rows = contexts.map(ctx => [
    ctx.id,
    ctx.marketSignal?.clusterName || ctx.situation,
    ctx.description || '',
    ctx.journey?.conversionStage || '',
    (ctx.hybridCognition || ctx.cognition || ''),
    ctx.strategyType || '',
    ctx.marketSignal?.priorityScore || 0,
    ctx.brandShare != null ? Math.round(ctx.brandShare * 100) : '',
    ctx.competitorShare != null ? Math.round(ctx.competitorShare * 100) : '',
    ctx.marketSignal?.naverVolumeRange || (ctx.marketSignal?.volumeIsEstimated ? '추정값' : ''),
    ctx.dataProvenance === 'api' ? '실측 API' : 'AI 추정',
    ctx.actionPlan?.primaryGoal || '',
  ].map(escapeCsvCell).join(','));

  const filename = `AEGIS_CEP_${safeFilename(contexts[0]?.category || 'export')}_${dateStamp()}.csv`;
  downloadBlob([headers.join(','), ...rows].join('\n'), filename, 'text/csv');
}

// ── 3. 전체 세션 JSON 내보내기 ────────────────────────────────────────────────

export interface ExportSession {
  category: string;
  brandName?: string;
  exportedAt: string;
  contexts: Context[];
  forgeOutputs?: ForgeOutput[];
}

export function exportSessionAsJson(session: ExportSession): void {
  const filename = `AEGIS_Session_${safeFilename(session.category)}_${dateStamp()}.json`;
  downloadBlob(JSON.stringify(session, null, 2), filename, 'application/json');
}

// ── 4. 전체 세션 Markdown 보고서 ──────────────────────────────────────────────

export function exportSessionAsMarkdown(session: ExportSession): void {
  const md = buildMarkdownReport(session);
  const filename = `AEGIS_Report_${safeFilename(session.category)}_${dateStamp()}.md`;
  downloadBlob(md, filename, 'text/markdown');
}

export function buildMarkdownReport(session: ExportSession): string {
  const { category, brandName, exportedAt, contexts, forgeOutputs } = session;
  const lines: string[] = [];

  lines.push(`# C³ Cube Strategy Analysis Report`);
  lines.push(`**카테고리:** ${category}  `);
  if (brandName) lines.push(`**브랜드:** ${brandName}  `);
  lines.push(`**분석 일시:** ${exportedAt}  `);
  lines.push(`**총 CEP:** ${contexts.length}개`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Summary stats
  const cognitionCount: Record<string, number> = {};
  const strategyCount: Record<string, number> = {};
  contexts.forEach(c => {
    const cog = c.hybridCognition || c.cognition || 'informational';
    cognitionCount[cog] = (cognitionCount[cog] || 0) + 1;
    if (c.strategyType) strategyCount[c.strategyType] = (strategyCount[c.strategyType] || 0) + 1;
  });
  const dominantCog = Object.entries(cognitionCount).sort((a, b) => b[1] - a[1])[0];
  const dominantStrat = Object.entries(strategyCount).sort((a, b) => b[1] - a[1])[0];
  const avgScore = contexts.length
    ? Math.round(contexts.reduce((s, c) => s + (c.marketSignal?.priorityScore || 0), 0) / contexts.length)
    : 0;

  lines.push('## 분석 결과 요약');
  lines.push('');
  lines.push(`| 항목 | 값 |`);
  lines.push(`|------|---|`);
  lines.push(`| 지배 인지 유형 | ${dominantCog?.[0] || '-'} (${dominantCog?.[1] || 0}개) |`);
  lines.push(`| 지배 전략 유형 | ${dominantStrat?.[0] || '-'} (${dominantStrat?.[1] || 0}개) |`);
  lines.push(`| 평균 Priority Score | ${avgScore}pt |`);
  lines.push(`| 데이터 출처 | ${contexts.some(c => c.dataProvenance === 'api') ? '실측 API (Serper/Naver)' : 'AI 추정 (Grounding)'} |`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // CEP list
  lines.push('## CEP 전략 목록');
  lines.push('');

  contexts.forEach((ctx, i) => {
    const cog = ctx.hybridCognition || ctx.cognition || '';
    const sov = ctx.brandShare != null
      ? `자사 ${Math.round(ctx.brandShare * 100)}% / 경쟁 ${Math.round((ctx.competitorShare || 0) * 100)}%`
      : '-';

    lines.push(`### ${i + 1}. ${ctx.marketSignal?.clusterName || ctx.situation}`);
    lines.push('');
    lines.push(`| 항목 | 값 |`);
    lines.push(`|------|---|`);
    lines.push(`| CDJ 단계 | ${ctx.journey?.conversionStage || '-'} |`);
    lines.push(`| 지배 인지 | ${cog} |`);
    lines.push(`| 전략 유형 | ${ctx.strategyType || '-'} |`);
    lines.push(`| Priority Score | ${ctx.marketSignal?.priorityScore || 0}pt |`);
    lines.push(`| SOV | ${sov} |`);
    if (ctx.marketSignal?.naverVolumeRange) {
      lines.push(`| Naver 검색량 | ${ctx.marketSignal.naverVolumeRange} |`);
    }
    lines.push('');

    if (ctx.description) {
      lines.push(`**상황 설명:** ${ctx.description}`);
      lines.push('');
    }

    if (ctx.actionPlan) {
      lines.push(`**실행 목표:** ${ctx.actionPlan.primaryGoal}`);
      lines.push('');
      if (ctx.actionPlan.contentFocus?.length) {
        lines.push('**콘텐츠 집중 방향:**');
        ctx.actionPlan.contentFocus.forEach(f => lines.push(`- ${f}`));
        lines.push('');
      }
      if (ctx.actionPlan.channelPriority?.length) {
        lines.push('**채널 우선순위:** ' + ctx.actionPlan.channelPriority.join(' · '));
        lines.push('');
      }
    }

    // Execution Plan
    const ep = ctx.executionPlan;
    if (ep) {
      lines.push('**AI 트리플 미디어 전략:**');
      lines.push('');
      lines.push(`*상황 요약:* ${ep.situationSummary}`);
      lines.push('');

      if (ep.ownedMedia?.hubContent?.length) {
        lines.push('*Hub 핵심 콘텐츠 (Owned):*');
        ep.ownedMedia.hubContent.forEach(h => lines.push(`- ${h}`));
      }
      if (ep.earnedMedia?.length) {
        lines.push('*Earned Media:*');
        ep.earnedMedia.forEach(e => lines.push(`- ${e}`));
      }
      if (ep.paidMedia?.length) {
        lines.push('*Paid Media:*');
        ep.paidMedia.forEach(p => lines.push(`- ${p}`));
      }
      if (ep.kpiFramework?.length) {
        lines.push(`*KPI:* ${ep.kpiFramework.join(' · ')}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  });

  // FORGE outputs
  if (forgeOutputs?.length) {
    lines.push('## AEGIS FORGE 생성 콘텐츠');
    lines.push('');
    forgeOutputs.forEach((fo, i) => {
      lines.push(`### FORGE ${i + 1} — ${fo.mediaType} / ${fo.subType}`);
      lines.push(`*생성일: ${fo.generatedAt}*`);
      lines.push('');
      if (fo.variants?.length) {
        fo.variants.forEach((v, vi) => {
          lines.push(`#### 변형 ${String.fromCharCode(65 + vi)}`);
          lines.push('');
          lines.push(v);
          lines.push('');
        });
      } else {
        lines.push(fo.mainContent);
        lines.push('');
      }
      lines.push('---');
      lines.push('');
    });
  }

  lines.push(`*Generated by Project AEGIS v2.7 — C³ Cube Strategy Model*`);
  return lines.join('\n');
}

// ── 5. FORGE 단일 출력 Markdown 복사 ─────────────────────────────────────────

export function forgeOutputToMarkdown(output: ForgeOutput, meta?: { clusterName?: string; strategyType?: string }): string {
  const lines: string[] = [];
  lines.push(`# AEGIS FORGE — ${output.subType?.replace(/_/g, ' ').toUpperCase()}`);
  if (meta?.clusterName) lines.push(`**CEP:** ${meta.clusterName}`);
  if (meta?.strategyType) lines.push(`**전략:** ${meta.strategyType}`);
  lines.push(`**생성일:** ${output.generatedAt}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  if (output.variants?.length) {
    output.variants.forEach((v, i) => {
      lines.push(`## 변형 ${String.fromCharCode(65 + i)}`);
      lines.push('');
      lines.push(v);
      lines.push('');
    });
  } else {
    lines.push(output.mainContent);
  }
  return lines.join('\n');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}

// ── Util ──────────────────────────────────────────────────────────────────────

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
