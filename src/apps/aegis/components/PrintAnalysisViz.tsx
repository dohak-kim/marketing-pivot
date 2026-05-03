/**
 * PrintAnalysisViz
 *
 * PDF/Print-only component for the 3 analysis visualizations.
 * Rendered via React Portal to document.body (class="print-root").
 *
 * Sections (each forced to a new page):
 *   Page 1 — C³ Journey Ladder   : CDJ Conversion Stage × CEP
 *   Page 2 — Strategic Heatmap   : Context × Cognition Intent Matrix
 *   Page 3 — Similarity Network  : Strategic Cluster List + SVG Network Map
 */

import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Context, ConversionStage } from '../core/context';
import { StrategicEngine } from '../services/strategicEngine';
import { buildContextNetwork } from '../utils/vector';
import { StrategicCluster, StrategicType } from '../models/strategicCluster';

interface PrintAnalysisVizProps {
  contexts: Context[];
  category: string;
}

// ── 상수 ─────────────────────────────────────────────────────────────────────

const COGNITION_ORDER = ['informational', 'exploratory', 'commercial', 'transactional'] as const;
const COGNITION_KO: Record<string, string> = {
  informational: '정보탐색',
  exploratory:   '비교탐색',
  commercial:    '상업조사',
  transactional: '구매전환',
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
const STRATEGY_COLOR: Record<StrategicType, string> = {
  'Defensive Hold':     '#6366f1',
  'Concentrated Attack':'#f43f5e',
  'Flank Opportunity':  '#10b981',
  'Experimental Zone':  '#94a3b8',
};
const STRATEGY_KO: Record<StrategicType, string> = {
  'Defensive Hold':     '방어 유지',
  'Concentrated Attack':'집중 공격',
  'Flank Opportunity':  '틈새 기회',
  'Experimental Zone':  '실험 탐색',
};

// ── 유틸 ─────────────────────────────────────────────────────────────────────

function getDominantCognition(ctx: Context): string {
  const vec = ctx.journey?.cognitionVector as Record<string, number> | undefined;
  if (!vec) return ctx.cognition || 'informational';
  return Object.entries(vec).reduce((a, b) => a[1] > b[1] ? a : b)[0];
}
function truncate(s: string | undefined, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

// ── 공통 섹션 헤더 ────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div style={{ marginBottom: 10, borderBottom: '2px solid #4a40dc', paddingBottom: 6 }}>
    <div style={{ fontSize: 10, fontWeight: 900, color: '#4a40dc', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
      {title}
    </div>
    <div style={{ fontSize: 8, color: '#9291cc', marginTop: 2 }}>{subtitle}</div>
  </div>
);

// ── Section 1: Journey Ladder ─────────────────────────────────────────────────

const PrintJourneyLadder: React.FC<{ contexts: Context[] }> = ({ contexts }) => {
  const byStage: Record<string, Context[]> = {};
  CDJ_STAGES.forEach(s => { byStage[s.key] = []; });
  contexts.forEach(c => {
    const stage = c.journey?.conversionStage || ConversionStage.AWARENESS;
    if (byStage[stage]) byStage[stage].push(c);
  });

  return (
    <>
      <SectionHeader
        title="C³ Journey Ladder — CDJ × Conversion Stage"
        subtitle="소비자 구매 여정 단계별 CEP 분류 · 색상 = 인지 유형(Cognition)"
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {CDJ_STAGES.map(stage => (
          <div key={stage.key} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #dcdcf5' }}>
            <div style={{ background: '#f6f6fe', borderBottom: '2.5px solid ' + stage.color, padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 8, fontWeight: 900, color: stage.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{stage.ko}</div>
              </div>
              <div style={{ fontSize: 9, fontWeight: 900, color: stage.color, background: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + stage.color }}>
                {byStage[stage.key].length}
              </div>
            </div>
            <div style={{ padding: '4px 6px' }}>
              {byStage[stage.key].length === 0 ? (
                <div style={{ fontSize: 7, color: '#c2c1e8', padding: '4px 0', textAlign: 'center' }}>해당 CEP 없음</div>
              ) : byStage[stage.key].map((ctx, i) => {
                const cog = getDominantCognition(ctx);
                return (
                  <div key={ctx.id} style={{ borderBottom: i < byStage[stage.key].length - 1 ? '1px solid #ededfb' : 'none', padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: COGNITION_COLOR[cog] || '#94a3b8', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#3d3c72', lineHeight: 1.3 }}>
                        {truncate(ctx.marketSignal?.clusterName || ctx.situation, 28)}
                      </div>
                      <div style={{ fontSize: 6.5, color: '#9291cc', marginTop: 1 }}>
                        {COGNITION_KO[cog]} · {ctx.marketSignal?.priorityScore ?? '—'}pt
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cognition legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        {COGNITION_ORDER.map(cog => (
          <div key={cog} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COGNITION_COLOR[cog] }} />
            <span style={{ fontSize: 7.5, color: '#6b6aaa' }}>{COGNITION_KO[cog]}</span>
          </div>
        ))}
      </div>
    </>
  );
};

// ── Section 2: Strategic Heatmap ──────────────────────────────────────────────

const PrintStrategicHeatmap: React.FC<{ contexts: Context[] }> = ({ contexts }) => {
  const getCogScore = (ctx: Context, key: string): number => {
    const vec = ctx.journey?.cognitionVector as Record<string, number> | undefined;
    if (vec?.[key] != null) return Math.round((vec[key] || 0) * 100);
    return getDominantCognition(ctx) === key ? 85 : 10;
  };
  const colorForScore = (s: number) =>
    s >= 70 ? '#4a40dc' : s >= 45 ? '#8279ff' : s >= 25 ? '#cccaff' : '#f6f6fe';
  const textForScore  = (s: number) => s >= 45 ? '#fff' : '#9291cc';

  return (
    <>
      <SectionHeader
        title="Strategic Heatmap — Context × Cognitive Intent"
        subtitle="각 CEP의 4가지 검색 인지 유형별 강도 분포 · 진보라 = 고강도"
      />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 6px', background: '#f6f6fe', borderBottom: '1.5px solid #dcdcf5', fontWeight: 900, color: '#6b6aaa', fontSize: 7, textTransform: 'uppercase' }}>
                Context (CEP)
              </th>
              {COGNITION_ORDER.map(cog => (
                <th key={cog} style={{ textAlign: 'center', padding: '4px 6px', background: '#f6f6fe', borderBottom: '1.5px solid #dcdcf5', fontWeight: 900, color: COGNITION_COLOR[cog], fontSize: 7, textTransform: 'uppercase', minWidth: 68 }}>
                  {COGNITION_KO[cog]}
                </th>
              ))}
              <th style={{ textAlign: 'center', padding: '4px 6px', background: '#f6f6fe', borderBottom: '1.5px solid #dcdcf5', fontWeight: 900, color: '#9291cc', fontSize: 7, textTransform: 'uppercase', minWidth: 48 }}>
                Priority
              </th>
            </tr>
          </thead>
          <tbody>
            {contexts.map((ctx, i) => (
              <tr key={ctx.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9f9fe' }}>
                <td style={{ padding: '3px 6px', borderBottom: '1px solid #ededfb', fontWeight: 600, color: '#3d3c72', maxWidth: 200 }}>
                  {truncate(ctx.marketSignal?.clusterName || ctx.situation, 32)}
                </td>
                {COGNITION_ORDER.map(cog => {
                  const s = getCogScore(ctx, cog);
                  return (
                    <td key={cog} style={{ textAlign: 'center', padding: '3px 4px', borderBottom: '1px solid #ededfb' }}>
                      <div style={{ display: 'inline-block', background: colorForScore(s), color: textForScore(s), borderRadius: 4, padding: '1px 6px', fontSize: 7.5, fontWeight: 700, minWidth: 28 }}>
                        {s}
                      </div>
                    </td>
                  );
                })}
                <td style={{ textAlign: 'center', padding: '3px 6px', borderBottom: '1px solid #ededfb', fontWeight: 900, color: '#4a40dc', fontFamily: 'monospace', fontSize: 8 }}>
                  {ctx.marketSignal?.priorityScore ?? '—'}pt
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

// ── Section 3: Similarity Network ─────────────────────────────────────────────
// 좌: 전략 클러스터 목록 (StrategicEngine)
// 우: SVG 클러스터 네트워크 맵

// SVG 네트워크 맵 — 원형 배치
const ClusterNetworkSVG: React.FC<{ clusters: StrategicCluster[]; interEdges: [number, number][] }> = ({ clusters, interEdges }) => {
  const n = clusters.length;
  if (n === 0) return null;

  const W = 260, H = 260, cx = 130, cy = 130;
  // 클러스터 수에 따라 배치 반경 조정
  const r = n <= 4 ? 80 : n <= 7 ? 95 : 110;

  const pos = clusters.map((_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i / n) - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i / n) - Math.PI / 2),
  }));

  const nodeR = n <= 5 ? 22 : n <= 8 ? 18 : 15;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {/* 연결선 */}
      {interEdges.map(([a, b], idx) => (
        <line key={idx}
          x1={pos[a].x} y1={pos[a].y}
          x2={pos[b].x} y2={pos[b].y}
          stroke="#cccaff" strokeWidth="1.2" strokeDasharray="4,3" opacity="0.8"
        />
      ))}
      {/* 노드 */}
      {clusters.map((cl, i) => {
        const { x, y } = pos[i];
        const col = STRATEGY_COLOR[cl.strategyType] || '#94a3b8';
        const label = truncate(cl.label || cl.ceps[0]?.marketSignal?.clusterName || `C${i + 1}`, 10);
        return (
          <g key={cl.id}>
            <circle cx={x} cy={y} r={nodeR} fill={col} opacity="0.88" />
            <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize={nodeR < 18 ? 7 : 8} fontWeight="bold">
              {cl.ceps.length}
            </text>
            {/* 노드 라벨 (원 바깥) */}
            <text
              x={x + (x - cx) * 0.45}
              y={y + (y - cy) * 0.45 + (y >= cy ? 11 : -5)}
              textAnchor="middle"
              fill="#4a40dc"
              fontSize="6.5"
              fontWeight="700"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const PrintSimilarityNetwork: React.FC<{ contexts: Context[] }> = ({ contexts }) => {
  const clusters = useMemo(
    () => StrategicEngine.analyzeClusters(contexts, 0.3).filter(c => c.ceps.length > 0),
    [contexts],
  );

  // 클러스터 간 연결 계산: 서로 다른 클러스터 CEP 사이에 네트워크 엣지가 있으면 연결
  const interEdges = useMemo((): [number, number][] => {
    if (clusters.length < 2) return [];
    const network = buildContextNetwork(contexts, 0.25);
    const cepToCluster = new Map<string, number>();
    clusters.forEach((cl, ci) => cl.ceps.forEach(c => cepToCluster.set(c.id, ci)));

    const edgeSet = new Set<string>();
    const result: [number, number][] = [];
    for (const edge of network.edges) {
      const a = cepToCluster.get(edge.source);
      const b = cepToCluster.get(edge.target);
      if (a !== undefined && b !== undefined && a !== b) {
        const key = [Math.min(a, b), Math.max(a, b)].join('-');
        if (!edgeSet.has(key)) { edgeSet.add(key); result.push([a, b]); }
      }
    }
    return result;
  }, [clusters, contexts]);

  const strategyGroups = useMemo(() => {
    const g: Partial<Record<StrategicType, StrategicCluster[]>> = {};
    clusters.forEach(c => {
      (g[c.strategyType] ??= []).push(c);
    });
    return Object.entries(g) as [StrategicType, StrategicCluster[]][];
  }, [clusters]);

  return (
    <>
      <SectionHeader
        title="Similarity Network — Strategic Cluster Map"
        subtitle="CEP 의미 유사도 기반 전략 클러스터 분류 · 우측: 클러스터 간 연결 네트워크"
      />

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* ── 좌측: 전략 클러스터 목록 ── */}
        <div style={{ flex: '0 0 52%', minWidth: 0 }}>
          {strategyGroups.length === 0 ? (
            <div style={{ fontSize: 8, color: '#9291cc' }}>클러스터 데이터 없음</div>
          ) : strategyGroups.map(([sType, cls]) => (
            <div key={sType} style={{ marginBottom: 10 }}>
              {/* 전략 타입 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: STRATEGY_COLOR[sType], flexShrink: 0 }} />
                <span style={{ fontSize: 8, fontWeight: 900, color: STRATEGY_COLOR[sType], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {STRATEGY_KO[sType]}
                </span>
                <span style={{ fontSize: 7.5, color: '#9291cc' }}>— {cls.length}개 클러스터</span>
              </div>
              {/* 클러스터 카드들 */}
              {cls.map(cl => (
                <div key={cl.id} style={{ marginLeft: 16, marginBottom: 4, padding: '4px 6px', border: '1px solid #dcdcf5', borderLeft: '3px solid ' + STRATEGY_COLOR[sType], borderRadius: '0 6px 6px 0', background: '#fafafe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#3d3c72' }}>
                      {truncate(cl.label || cl.ceps[0]?.marketSignal?.clusterName || '클러스터', 26)}
                    </div>
                    <div style={{ fontSize: 7.5, color: '#9291cc', fontFamily: 'monospace', flexShrink: 0 }}>
                      {cl.ceps.length}개 CEP · {Math.round(cl.priorityScore * 100)}pt
                    </div>
                  </div>
                  {/* CEP 목록 (최대 3개) */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {cl.ceps.slice(0, 3).map(c => (
                      <span key={c.id} style={{ fontSize: 6.5, color: '#6b6aaa', background: '#f0efff', borderRadius: 3, padding: '1px 4px' }}>
                        {truncate(c.marketSignal?.clusterName || c.situation, 14)}
                      </span>
                    ))}
                    {cl.ceps.length > 3 && (
                      <span style={{ fontSize: 6.5, color: '#9291cc' }}>+{cl.ceps.length - 3}개</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* 범례 */}
          <div style={{ marginTop: 8, padding: '6px 8px', background: '#f6f6fe', borderRadius: 6, border: '1px solid #ededfb' }}>
            <div style={{ fontSize: 7, fontWeight: 900, color: '#9291cc', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Strategy Legend</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
              {(Object.entries(STRATEGY_COLOR) as [StrategicType, string][]).map(([t, col]) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                  <span style={{ fontSize: 7, color: '#6b6aaa' }}>{STRATEGY_KO[t]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 우측: SVG 네트워크 맵 ── */}
        <div style={{ flex: '0 0 44%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 7.5, fontWeight: 900, color: '#9291cc', textTransform: 'uppercase', letterSpacing: '0.08em', alignSelf: 'flex-start' }}>
            Cluster Network Map
          </div>
          {clusters.length > 0 ? (
            <>
              <ClusterNetworkSVG clusters={clusters} interEdges={interEdges} />
              <div style={{ fontSize: 7, color: '#9291cc', textAlign: 'center', lineHeight: 1.5 }}>
                원 크기 = 클러스터 내 CEP 수<br />
                점선 = 클러스터 간 의미 유사 연결
              </div>
            </>
          ) : (
            <div style={{ fontSize: 8, color: '#c2c1e8', padding: 16 }}>클러스터 네트워크 없음</div>
          )}
        </div>

      </div>
    </>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const PrintAnalysisViz: React.FC<PrintAnalysisVizProps> = ({ contexts, category }) => {
  if (!contexts || contexts.length === 0) return null;

  const pageStyle: React.CSSProperties = {
    pageBreakBefore: 'always',
    breakBefore:     'page',
    paddingTop:      12,
  };
  const sectionWrap: React.CSSProperties = {
    fontFamily: '"Noto Sans KR", "Noto Sans", sans-serif',
    fontSize:   10,
    color:      '#131230',
    background: 'white',
  };

  return createPortal(
    <div
      className="print-root"
      style={{ display: 'none', ...sectionWrap }}
    >
      {/* ── 표지 헤더 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: '3px solid #4a40dc', paddingBottom: 10 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#4a40dc', letterSpacing: '-0.02em' }}>C³ Cube Strategy Model</div>
          <div style={{ fontSize: 8, color: '#9291cc', marginTop: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Analysis Visualization Report · Journey Ladder / Heatmap / Similarity Network
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#3d3c72', marginTop: 5 }}>
            카테고리: {category}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 7.5, color: '#9291cc' }}>분석 일시</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#6b6aaa', fontFamily: 'monospace' }}>
            {new Date().toLocaleDateString('ko-KR')}
          </div>
          <div style={{ marginTop: 4, fontSize: 8, color: '#9291cc' }}>
            총 CEP: <strong style={{ color: '#4a40dc', fontSize: 10 }}>{contexts.length}개</strong>
          </div>
        </div>
      </div>

      {/* ── Page 1: Journey Ladder ── */}
      <div style={sectionWrap}>
        <PrintJourneyLadder contexts={contexts} />
      </div>

      {/* ── Page 2: Strategic Heatmap ── */}
      <div style={{ ...sectionWrap, ...pageStyle }}>
        <PrintStrategicHeatmap contexts={contexts} />
      </div>

      {/* ── Page 3: Similarity Network ── */}
      <div style={{ ...sectionWrap, ...pageStyle }}>
        <PrintSimilarityNetwork contexts={contexts} />
      </div>
    </div>,
    document.body,
  );
};

export default PrintAnalysisViz;
