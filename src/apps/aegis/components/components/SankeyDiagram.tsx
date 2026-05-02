
import React, { useMemo } from 'react';
import { TemporalComparison, MatchedCEP, ChangeType } from '../core/analysis/temporalComparison';
import { Context } from '../core/context';

interface SankeyDiagramProps {
  comparison: TemporalComparison;
}

// ── Layout constants ──────────────────────────────────────────────────────
const SVG_W = 1000;
const NODE_W = 22;
const LEFT_X = 200;
const RIGHT_X = 800;
const LABEL_GAP = 10;
const MAX_NODE_H = 110;
const MIN_NODE_H = 22;
const NODE_GAP = 10;
const TOP_PAD = 20;

// ── Color helpers ─────────────────────────────────────────────────────────
const CHANGE_COLOR: Record<ChangeType | 'emerging' | 'disappeared', { fill: string; stroke: string; flow: string; flowOpacity: number }> = {
  growing:    { fill: '#10b981', stroke: '#059669', flow: '#10b981', flowOpacity: 0.25 },
  declining:  { fill: '#f43f5e', stroke: '#e11d48', flow: '#f43f5e', flowOpacity: 0.20 },
  stable:     { fill: '#6366f1', stroke: '#4f46e5', flow: '#6366f1', flowOpacity: 0.18 },
  emerging:   { fill: '#f59e0b', stroke: '#d97706', flow: '#f59e0b', flowOpacity: 0.30 },
  disappeared:{ fill: '#94a3b8', stroke: '#64748b', flow: '#94a3b8', flowOpacity: 0.12 },
};

const COGNITION_COLOR: Record<string, string> = {
  informational: '#38bdf8',
  exploratory:   '#818cf8',
  commercial:    '#fbbf24',
  transactional: '#10b981',
};

function getCognitionColor(cep: Context): string {
  const key = (cep as any).hybridCognition || (cep as any).cognition || 'informational';
  return COGNITION_COLOR[key] || '#94a3b8';
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

// ── Node layout computation ───────────────────────────────────────────────
interface LayoutNode {
  id: string;
  label: string;
  score: number;
  nodeH: number;
  y: number;
  cognitionColor: string;
  side: 'left' | 'right';
  changeType: ChangeType | 'emerging' | 'disappeared';
  pairId?: string;
  changePct?: number;
  cognitionShift?: boolean;
  matchScore?: number;  // CEP matching confidence (0~1)
  matchDetail?: MatchedCEP['matchDetail'];
}

function computeLayout(comparison: TemporalComparison): {
  leftNodes: LayoutNode[];
  rightNodes: LayoutNode[];
  svgHeight: number;
} {
  const { matched, emerging, disappeared } = comparison;

  // Sort matched by Period A priority desc
  const sortedMatched = [...matched].sort((a, b) =>
    (b.cepA.marketSignal?.priorityScore || 0) - (a.cepA.marketSignal?.priorityScore || 0)
  );

  // Collect all scores to normalize node heights
  const allScores: number[] = [
    ...sortedMatched.map(m => m.cepA.marketSignal?.priorityScore || 0),
    ...sortedMatched.map(m => m.cepB.marketSignal?.priorityScore || 0),
    ...emerging.map(c => c.marketSignal?.priorityScore || 0),
    ...disappeared.map(c => c.marketSignal?.priorityScore || 0),
  ];
  const maxScore = Math.max(...allScores, 1);

  const toH = (score: number) =>
    MIN_NODE_H + ((score / maxScore) * (MAX_NODE_H - MIN_NODE_H));

  const leftNodes: LayoutNode[] = [];
  const rightNodes: LayoutNode[] = [];

  // Matched pairs — A side (left) and B side (right), same order
  sortedMatched.forEach(m => {
    leftNodes.push({
      id: `a-${m.cepA.id}`,
      label: m.cepA.marketSignal?.clusterName || m.cepA.situation,
      score: m.cepA.marketSignal?.priorityScore || 0,
      nodeH: toH(m.cepA.marketSignal?.priorityScore || 0),
      y: 0,
      cognitionColor: getCognitionColor(m.cepA),
      side: 'left',
      changeType: m.changeType,
      pairId: `b-${m.cepB.id}`,
      changePct: m.scoreChangePct,
      cognitionShift: m.cognitionShift,
      matchScore: m.matchScore,
      matchDetail: m.matchDetail,
    });
    rightNodes.push({
      id: `b-${m.cepB.id}`,
      label: m.cepB.marketSignal?.clusterName || m.cepB.situation,
      score: m.cepB.marketSignal?.priorityScore || 0,
      nodeH: toH(m.cepB.marketSignal?.priorityScore || 0),
      y: 0,
      cognitionColor: getCognitionColor(m.cepB),
      side: 'right',
      changeType: m.changeType,
      pairId: `a-${m.cepA.id}`,
      matchScore: m.matchScore,
    });
  });

  // Disappeared — left only
  [...disappeared].sort((a, b) =>
    (b.marketSignal?.priorityScore || 0) - (a.marketSignal?.priorityScore || 0)
  ).forEach(c => {
    leftNodes.push({
      id: `a-dis-${c.id}`,
      label: c.marketSignal?.clusterName || c.situation,
      score: c.marketSignal?.priorityScore || 0,
      nodeH: toH(c.marketSignal?.priorityScore || 0),
      y: 0,
      cognitionColor: getCognitionColor(c),
      side: 'left',
      changeType: 'disappeared',
    });
  });

  // Emerging — right only
  [...emerging].sort((a, b) =>
    (b.marketSignal?.priorityScore || 0) - (a.marketSignal?.priorityScore || 0)
  ).forEach(c => {
    rightNodes.push({
      id: `b-new-${c.id}`,
      label: c.marketSignal?.clusterName || c.situation,
      score: c.marketSignal?.priorityScore || 0,
      nodeH: toH(c.marketSignal?.priorityScore || 0),
      y: 0,
      cognitionColor: getCognitionColor(c),
      side: 'right',
      changeType: 'emerging',
    });
  });

  // Assign y positions
  let ly = TOP_PAD;
  leftNodes.forEach(n => { n.y = ly; ly += n.nodeH + NODE_GAP; });
  let ry = TOP_PAD;
  rightNodes.forEach(n => { n.y = ry; ry += n.nodeH + NODE_GAP; });

  const svgHeight = Math.max(ly, ry) + TOP_PAD;

  return { leftNodes, rightNodes, svgHeight };
}

// ── Flow path ─────────────────────────────────────────────────────────────
function flowPath(
  lx: number, ly: number, lh: number,
  rx: number, ry: number, rh: number,
): string {
  const lMid = ly + lh / 2;
  const rMid = ry + rh / 2;
  const cx = (lx + rx) / 2;
  return `M ${lx} ${lMid} C ${cx} ${lMid}, ${cx} ${rMid}, ${rx} ${rMid}`;
}

// ── Main Component ─────────────────────────────────────────────────────────
const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ comparison }) => {
  const { leftNodes, rightNodes, svgHeight } = useMemo(
    () => computeLayout(comparison),
    [comparison]
  );

  const nodeMap = new Map<string, LayoutNode>();
  leftNodes.forEach(n => nodeMap.set(n.id, n));
  rightNodes.forEach(n => nodeMap.set(n.id, n));

  const flows = useMemo(() => {
    return leftNodes
      .filter(n => n.pairId)
      .map(leftNode => {
        const rightNode = nodeMap.get(leftNode.pairId!);
        if (!rightNode) return null;
        const c = CHANGE_COLOR[leftNode.changeType];
        // Mid-point of the flow curve for badge placement
        const lMidY = leftNode.y + leftNode.nodeH / 2;
        const rMidY = rightNode.y + rightNode.nodeH / 2;
        const midY = (lMidY + rMidY) / 2;
        const midX = (LEFT_X + NODE_W + RIGHT_X) / 2;
        return {
          path: flowPath(
            LEFT_X + NODE_W, leftNode.y, leftNode.nodeH,
            RIGHT_X, rightNode.y, rightNode.nodeH,
          ),
          color: c.flow,
          opacity: c.flowOpacity,
          key: `flow-${leftNode.id}`,
          matchScore: leftNode.matchScore,
          matchDetail: leftNode.matchDetail,
          midX,
          midY,
          changeType: leftNode.changeType,
        };
      })
      .filter(Boolean);
  }, [leftNodes, rightNodes]);

  const { snapshotA, snapshotB } = comparison;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${SVG_W} ${svgHeight}`}
        className="w-full font-sans select-none"
        style={{ minHeight: 320 }}
      >
        {/* ── Column Headers ── */}
        <text x={LEFT_X + NODE_W / 2} y={10} textAnchor="middle" className="text-[11px] font-black fill-slate-500 dark:fill-slate-400 uppercase tracking-widest" style={{ fontSize: 11, fontWeight: 900, fill: 'currentColor', opacity: 0.6 }}>
          {snapshotA.label}
        </text>
        <text x={RIGHT_X + NODE_W / 2} y={10} textAnchor="middle" style={{ fontSize: 11, fontWeight: 900, fill: 'currentColor', opacity: 0.6 }}>
          {snapshotB.label}
        </text>

        {/* ── Flows (draw first, behind nodes) ── */}
        {flows.map(f => f && (
          <g key={f.key}>
            <path
              d={f.path}
              fill="none"
              stroke={f.color}
              strokeWidth={14}
              strokeOpacity={f.opacity}
            />
            {/* Match confidence badge at flow midpoint */}
            {f.matchScore !== undefined && (
              <g transform={`translate(${f.midX}, ${f.midY})`}>
                <rect
                  x={-18} y={-9} width={36} height={18} rx={9}
                  fill={f.matchScore >= 0.4 ? '#10b981' : f.matchScore >= 0.2 ? '#6366f1' : '#f59e0b'}
                  fillOpacity={0.88}
                />
                <text
                  x={0} y={0}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontSize: 8.5, fontWeight: 900, fill: '#fff' }}
                >
                  {Math.round(f.matchScore * 100)}%
                </text>
              </g>
            )}
          </g>
        ))}

        {/* ── Left Nodes (Period A) ── */}
        {leftNodes.map(node => {
          const c = CHANGE_COLOR[node.changeType];
          const isDisappeared = node.changeType === 'disappeared';
          return (
            <g key={node.id}>
              {/* Node rect */}
              <rect
                x={LEFT_X}
                y={node.y}
                width={NODE_W}
                height={node.nodeH}
                rx={6}
                fill={c.fill}
                fillOpacity={isDisappeared ? 0.18 : 0.85}
                stroke={c.stroke}
                strokeWidth={1.5}
                strokeOpacity={isDisappeared ? 0.4 : 0.9}
              />
              {/* Cognition pip */}
              <circle
                cx={LEFT_X + NODE_W / 2}
                cy={node.y + 8}
                r={3}
                fill={node.cognitionColor}
                fillOpacity={0.9}
              />
              {/* Left-side label */}
              <text
                x={LEFT_X - LABEL_GAP}
                y={node.y + node.nodeH / 2}
                textAnchor="end"
                dominantBaseline="middle"
                style={{ fontSize: 10.5, fontWeight: 700, fill: isDisappeared ? '#94a3b8' : '#1e293b' }}
                className="dark:fill-slate-200"
              >
                {truncate(node.label, 20)}
              </text>
              {/* Score badge */}
              <text
                x={LEFT_X - LABEL_GAP}
                y={node.y + node.nodeH / 2 + 13}
                textAnchor="end"
                dominantBaseline="middle"
                style={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }}
              >
                {node.score}pt
              </text>
              {/* Disappeared tag */}
              {isDisappeared && (
                <text
                  x={LEFT_X + NODE_W + 4}
                  y={node.y + node.nodeH / 2}
                  dominantBaseline="middle"
                  style={{ fontSize: 8, fontWeight: 900, fill: '#f43f5e', textTransform: 'uppercase' }}
                >
                  GONE
                </text>
              )}
            </g>
          );
        })}

        {/* ── Right Nodes (Period B) ── */}
        {rightNodes.map(node => {
          const c = CHANGE_COLOR[node.changeType];
          const isEmerging = node.changeType === 'emerging';
          // Find matching left node for change badge
          const leftNode = node.pairId ? nodeMap.get(node.pairId) : undefined;
          const changePct = leftNode?.changePct;

          return (
            <g key={node.id}>
              {/* Node rect */}
              <rect
                x={RIGHT_X}
                y={node.y}
                width={NODE_W}
                height={node.nodeH}
                rx={6}
                fill={c.fill}
                fillOpacity={isEmerging ? 0.9 : 0.85}
                stroke={c.stroke}
                strokeWidth={1.5}
                strokeOpacity={0.9}
              />
              {/* Cognition pip */}
              <circle
                cx={RIGHT_X + NODE_W / 2}
                cy={node.y + 8}
                r={3}
                fill={node.cognitionColor}
                fillOpacity={0.9}
              />
              {/* Right-side label */}
              <text
                x={RIGHT_X + NODE_W + LABEL_GAP}
                y={node.y + node.nodeH / 2}
                textAnchor="start"
                dominantBaseline="middle"
                style={{ fontSize: 10.5, fontWeight: 700, fill: '#1e293b' }}
                className="dark:fill-slate-200"
              >
                {truncate(node.label, 20)}
              </text>
              {/* Score + change */}
              <text
                x={RIGHT_X + NODE_W + LABEL_GAP}
                y={node.y + node.nodeH / 2 + 13}
                textAnchor="start"
                dominantBaseline="middle"
                style={{ fontSize: 9, fontWeight: 700, fill: node.changeType === 'growing' ? '#059669' : node.changeType === 'declining' ? '#e11d48' : '#94a3b8' }}
              >
                {node.score}pt
                {changePct !== undefined && ` (${changePct > 0 ? '+' : ''}${changePct.toFixed(0)}%)`}
              </text>
              {/* Emerging tag */}
              {isEmerging && (
                <text
                  x={RIGHT_X - 4}
                  y={node.y + node.nodeH / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{ fontSize: 8, fontWeight: 900, fill: '#d97706' }}
                >
                  NEW
                </text>
              )}
              {/* Cognition shift indicator */}
              {leftNode?.cognitionShift && (
                <text
                  x={RIGHT_X - 4}
                  y={node.y + node.nodeH / 2 + 11}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{ fontSize: 7.5, fontWeight: 700, fill: '#a78bfa' }}
                >
                  ⟳intent
                </text>
              )}
            </g>
          );
        })}

        {/* ── Center divider line ── */}
        <line
          x1={SVG_W / 2} y1={TOP_PAD}
          x2={SVG_W / 2} y2={svgHeight - TOP_PAD}
          stroke="currentColor" strokeWidth={1} strokeOpacity={0.06} strokeDasharray="4 4"
        />
      </svg>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 pb-1 px-2">
        {([
          { key: 'growing',    label: '성장 (Growing)',      color: '#10b981' },
          { key: 'declining',  label: '쇠퇴 (Declining)',    color: '#f43f5e' },
          { key: 'stable',     label: '유지 (Stable)',       color: '#6366f1' },
          { key: 'emerging',   label: '신규 출현 (Emerging)', color: '#f59e0b' },
          { key: 'disappeared',label: '소멸 (Disappeared)',  color: '#94a3b8' },
        ] as const).map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.85 }} />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-2 h-2 rounded-full bg-violet-400" />
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">인텐트 전환 발생</span>
        </div>
      </div>

      {/* ── Match confidence guide ── */}
      <div className="flex items-center gap-4 px-2 pb-3 pt-1 border-t border-slate-100 dark:border-white/5 mt-1">
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-wider shrink-0">매칭 신뢰도</span>
        {[
          { color: '#10b981', label: '40%+ — 텍스트+인지+단계 복합 일치' },
          { color: '#6366f1', label: '20~39% — 인지·단계 일치, 표현 상이' },
          { color: '#f59e0b', label: '12~19% — 최소 임계값 (계절성·표현 차이)' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: color, opacity: 0.88 }}>
              <span style={{ fontSize: 6, color: '#fff', fontWeight: 900 }}>%</span>
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SankeyDiagram;
