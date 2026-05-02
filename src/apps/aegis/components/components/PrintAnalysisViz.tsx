
/**
 * PrintAnalysisViz
 *
 * PDF/Print-only component for the 3 main analysis visualizations.
 * Rendered via React Portal to document.body (class="print-root").
 * Screen: display:none  |  @media print: display:block (body > .print-root rule in index.html)
 *
 * Sections (stacked vertically):
 *   1. C³ Journey Ladder   — DOM-based, prints fine
 *   2. Strategic Heatmap   — DOM-based grid, prints fine
 *   3. Similarity Network  — react-force-graph-2d uses canvas (won't print).
 *                            Replaced with static Cluster Similarity Table.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { Context, ConversionStage } from '../core/context';

interface PrintAnalysisVizProps {
  contexts: Context[];
  category: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COGNITION_ORDER = ['informational', 'exploratory', 'commercial', 'transactional'] as const;
const COGNITION_KO: Record<string, string> = {
  informational: '정보 탐색',
  exploratory:   '비교 탐색',
  commercial:    '상업 조사',
  transactional: '구매 전환',
};
const COGNITION_COLOR: Record<string, string> = {
  informational: '#38bdf8',
  exploratory:   '#818cf8',
  commercial:    '#fbbf24',
  transactional: '#10b981',
};

const CDJ_STAGES: { key: ConversionStage; ko: string; color: string }[] = [
  { key: ConversionStage.AWARENESS,     ko: '인지·탐색',   color: '#94a3b8' },
  { key: ConversionStage.CONSIDERATION, ko: '고려·비교',   color: '#38bdf8' },
  { key: ConversionStage.DECISION,      ko: '구매 결정',   color: '#fbbf24' },
  { key: ConversionStage.POST_PURCHASE, ko: '구매후 관리', color: '#10b981' },
];

function getDominantCognition(ctx: Context): string {
  const vec = ctx.journey?.cognitionVector as Record<string, number> | undefined;
  if (!vec) return ctx.cognition || 'informational';
  return Object.entries(vec).reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

function truncate(s: string, n: number): string {
  return s?.length > n ? s.slice(0, n - 1) + '…' : s || '';
}

// ── Section 1: Journey Ladder (print) ─────────────────────────────────────────

const PrintJourneyLadder: React.FC<{ contexts: Context[] }> = ({ contexts }) => {
  const byStage: Record<string, Context[]> = {};
  CDJ_STAGES.forEach(s => { byStage[s.key] = []; });
  contexts.forEach(c => {
    const stage = c.journey?.conversionStage || ConversionStage.AWARENESS;
    if (byStage[stage]) byStage[stage].push(c);
  });

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 9, fontWeight: 900, color: '#4a40dc', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, borderBottom: '1.5px solid #4a40dc', paddingBottom: 5 }}>
        C³ Journey Ladder — CDJ × CEP × Cognition
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {CDJ_STAGES.map(stage => (
          <div key={stage.key} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #dcdcf5' }}>
            {/* Stage header */}
            <div style={{ background: '#f6f6fe', borderBottom: '2px solid ' + stage.color, padding: '5px 8px' }}>
              <div style={{ fontSize: 7, fontWeight: 900, color: stage.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {stage.ko}
              </div>
              <div style={{ fontSize: 7.5, color: '#6b6aaa', marginTop: 1 }}>
                {byStage[stage.key].length}개 CEP
              </div>
            </div>
            {/* CEP list */}
            <div style={{ padding: '4px 6px' }}>
              {byStage[stage.key].length === 0 ? (
                <div style={{ fontSize: 7, color: '#c2c1e8', padding: '4px 0' }}>해당 CEP 없음</div>
              ) : byStage[stage.key].map((ctx, i) => {
                const cog = getDominantCognition(ctx);
                return (
                  <div key={ctx.id} style={{ borderBottom: i < byStage[stage.key].length - 1 ? '1px solid #ededfb' : 'none', padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: COGNITION_COLOR[cog] || '#94a3b8', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#3d3c72', lineHeight: 1.3 }}>
                        {truncate(ctx.marketSignal?.clusterName || ctx.situation, 28)}
                      </div>
                      <div style={{ fontSize: 6.5, color: '#9291cc', marginTop: 1 }}>
                        {COGNITION_KO[cog]} · {ctx.marketSignal?.priorityScore}pt
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Section 2: Strategic Heatmap (print) ──────────────────────────────────────

const PrintStrategicHeatmap: React.FC<{ contexts: Context[] }> = ({ contexts }) => {
  const getCogScore = (ctx: Context, key: string): number => {
    const vec = ctx.journey?.cognitionVector as Record<string, number> | undefined;
    if (vec?.[key] != null) return Math.round((vec[key] || 0) * 100);
    return getDominantCognition(ctx) === key ? 85 : 10;
  };

  const colorForScore = (score: number): string => {
    if (score >= 70) return '#4a40dc';
    if (score >= 40) return '#8279ff';
    if (score >= 20) return '#cccaff';
    return '#f6f6fe';
  };
  const textForScore = (score: number): string => (score >= 40 ? '#fff' : '#9291cc');

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 9, fontWeight: 900, color: '#4a40dc', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, borderBottom: '1.5px solid #4a40dc', paddingBottom: 5 }}>
        Strategic Heatmap — Context × Cognition Matrix
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 7.5 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 6px', background: '#f6f6fe', borderBottom: '1px solid #dcdcf5', fontWeight: 900, color: '#6b6aaa', fontSize: 7, textTransform: 'uppercase' }}>
                Context (CEP)
              </th>
              {COGNITION_ORDER.map(cog => (
                <th key={cog} style={{ textAlign: 'center', padding: '4px 6px', background: '#f6f6fe', borderBottom: '1px solid #dcdcf5', fontWeight: 900, color: COGNITION_COLOR[cog], fontSize: 7, textTransform: 'uppercase', minWidth: 70 }}>
                  {COGNITION_KO[cog]}
                </th>
              ))}
              <th style={{ textAlign: 'center', padding: '4px 6px', background: '#f6f6fe', borderBottom: '1px solid #dcdcf5', fontWeight: 900, color: '#9291cc', fontSize: 7, textTransform: 'uppercase', minWidth: 50 }}>
                Priority
              </th>
            </tr>
          </thead>
          <tbody>
            {contexts.map((ctx, i) => (
              <tr key={ctx.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9f9fe' }}>
                <td style={{ padding: '3px 6px', borderBottom: '1px solid #ededfb', maxWidth: 200, fontWeight: 600, color: '#3d3c72' }}>
                  {truncate(ctx.marketSignal?.clusterName || ctx.situation, 32)}
                </td>
                {COGNITION_ORDER.map(cog => {
                  const score = getCogScore(ctx, cog);
                  return (
                    <td key={cog} style={{ textAlign: 'center', padding: '3px 4px', borderBottom: '1px solid #ededfb' }}>
                      <div style={{ display: 'inline-block', background: colorForScore(score), color: textForScore(score), borderRadius: 4, padding: '1px 5px', fontSize: 7.5, fontWeight: 700, minWidth: 28 }}>
                        {score}
                      </div>
                    </td>
                  );
                })}
                <td style={{ textAlign: 'center', padding: '3px 6px', borderBottom: '1px solid #ededfb', fontWeight: 900, color: '#4a40dc', fontFamily: 'monospace', fontSize: 8 }}>
                  {ctx.marketSignal?.priorityScore}pt
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Section 3: Similarity Network → static cluster table (print) ──────────────
// react-force-graph-2d uses canvas — not printable.
// Instead: group CEPs by queryGroup/clusterName cluster and show a comparison table.

const PrintSimilarityTable: React.FC<{ contexts: Context[] }> = ({ contexts }) => {
  // Group by cluster name (marketSignal.clusterId or first 2 words of clusterName)
  const clusterMap = new Map<string, Context[]>();
  contexts.forEach(ctx => {
    const key = ctx.marketSignal?.clusterId
      || ctx.queryGroup
      || (ctx.marketSignal?.clusterName || ctx.situation || '').split(' ').slice(0, 2).join(' ');
    if (!clusterMap.has(key)) clusterMap.set(key, []);
    clusterMap.get(key)!.push(ctx);
  });

  const clusters = [...clusterMap.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 9, fontWeight: 900, color: '#4a40dc', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, borderBottom: '1.5px solid #4a40dc', paddingBottom: 5 }}>
        Similarity Network — CEP 클러스터 구조 (정적 분류)
      </div>
      <div style={{ fontSize: 7.5, color: '#9291cc', marginBottom: 8 }}>
        * 인터랙티브 Force Graph는 PDF 렌더링을 지원하지 않으므로 의미론적 클러스터 분류로 대체합니다.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {clusters.map(([clusterKey, ceps], ci) => (
          <div key={ci} style={{ border: '1px solid #dcdcf5', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ background: '#f0efff', borderBottom: '1px solid #cccaff', padding: '4px 8px' }}>
              <div style={{ fontSize: 7.5, fontWeight: 900, color: '#4a40dc' }}>
                Cluster {ci + 1}
              </div>
              <div style={{ fontSize: 7, color: '#6b6aaa', marginTop: 1 }}>
                {truncate(clusterKey, 24)} · {ceps.length}개
              </div>
            </div>
            <div style={{ padding: '4px 6px' }}>
              {ceps.map((ctx, j) => (
                <div key={ctx.id} style={{ display: 'flex', gap: 4, padding: '2px 0', borderBottom: j < ceps.length - 1 ? '1px solid #ededfb' : 'none' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: COGNITION_COLOR[getDominantCognition(ctx)] || '#94a3b8', marginTop: 3, flexShrink: 0 }} />
                  <div style={{ fontSize: 7.5, color: '#3d3c72', lineHeight: 1.3 }}>
                    {truncate(ctx.marketSignal?.clusterName || ctx.situation, 26)}
                    <span style={{ color: '#9291cc', marginLeft: 4, fontFamily: 'monospace' }}>
                      {ctx.marketSignal?.priorityScore}pt
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Cognition legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
        {COGNITION_ORDER.map(cog => (
          <div key={cog} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COGNITION_COLOR[cog] }} />
            <span style={{ fontSize: 7.5, color: '#6b6aaa' }}>{COGNITION_KO[cog]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const PrintAnalysisViz: React.FC<PrintAnalysisVizProps> = ({ contexts, category }) => {
  if (!contexts || contexts.length === 0) return null;

  return createPortal(
    <div
      className="print-root"
      style={{
        display: 'none',          // screen: hidden
        fontFamily: '"Noto Sans KR", "Noto Sans", sans-serif',
        fontSize: 10,
        color: '#131230',
        background: 'white',
        padding: '16mm 14mm',
      }}
    >
      {/* ── Report Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, borderBottom: '2px solid #4a40dc', paddingBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#4a40dc', letterSpacing: '-0.02em' }}>
            C³ Cube Strategy Model
          </div>
          <div style={{ fontSize: 9, color: '#9291cc', marginTop: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Analysis Visualization Report
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3d3c72', marginTop: 4 }}>
            카테고리: {category}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 7.5, color: '#9291cc' }}>분석 일시</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#6b6aaa', fontFamily: 'monospace' }}>
            {new Date().toLocaleDateString('ko-KR')}
          </div>
          <div style={{ marginTop: 4, fontSize: 7.5, color: '#9291cc' }}>
            총 CEP: <strong style={{ color: '#4a40dc' }}>{contexts.length}개</strong>
          </div>
        </div>
      </div>

      {/* ── Section 1: Journey Ladder ── */}
      <PrintJourneyLadder contexts={contexts} />

      <div style={{ borderTop: '1px dashed #cccaff', marginBottom: 20 }} />

      {/* ── Section 2: Strategic Heatmap ── */}
      <PrintStrategicHeatmap contexts={contexts} />

      <div style={{ borderTop: '1px dashed #cccaff', marginBottom: 20 }} />

      {/* ── Section 3: Similarity Network (static) ── */}
      <PrintSimilarityTable contexts={contexts} />
    </div>,
    document.body,
  );
};

export default PrintAnalysisViz;
