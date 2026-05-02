
import React, { useState } from 'react';
import { TemporalComparison, TemporalInsight, MatchedCEP } from '../core/analysis/temporalComparison';
import SankeyDiagram from './SankeyDiagram';

interface TemporalComparisonViewProps {
  comparison: TemporalComparison;
  insights: TemporalInsight[];
  isLoadingInsights: boolean;
  category: string;
}

// ── Insight type config ────────────────────────────────────────────────────
const INSIGHT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  aeo:         { label: 'AEO',         color: 'text-sky-700 dark:text-sky-300',     bg: 'bg-sky-50 dark:bg-sky-900/20',     border: 'border-sky-200 dark:border-sky-500/30',     icon: '🤖' },
  geo:         { label: 'GEO',         color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-500/30', icon: '✨' },
  trend:       { label: 'Trend',       color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-500/30', icon: '📈' },
  opportunity: { label: 'Opportunity', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-500/30', icon: '🎯' },
  warning:     { label: 'Warning',     color: 'text-rose-700 dark:text-rose-300',    bg: 'bg-rose-50 dark:bg-rose-900/20',    border: 'border-rose-200 dark:border-rose-500/30',    icon: '⚠️' },
};

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-rose-500',
  medium: 'bg-amber-400',
  low:    'bg-slate-400',
};

type InsightFilter = 'all' | 'aeo' | 'geo' | 'trend' | 'opportunity' | 'warning';

// ── Summary Card ──────────────────────────────────────────────────────────
const SummaryCard: React.FC<{
  value: number | string;
  label: string;
  sub?: string;
  color: string;
  bg: string;
  border: string;
}> = ({ value, label, sub, color, bg, border }) => (
  <div className={`${bg} ${border} border rounded-2xl p-5 flex flex-col items-center text-center shadow-sm`}>
    <div className={`text-3xl font-mono font-black ${color} leading-none mb-2`}>{value}</div>
    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</div>
    {sub && <div className="text-[9px] text-slate-400 dark:text-slate-600 mt-0.5">{sub}</div>}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────
const TemporalComparisonView: React.FC<TemporalComparisonViewProps> = ({
  comparison,
  insights,
  isLoadingInsights,
  category,
}) => {
  const [activeTab, setActiveTab] = useState<'sankey' | 'table'>('sankey');
  const [insightFilter, setInsightFilter] = useState<InsightFilter>('all');

  const { snapshotA, snapshotB, matched, emerging, disappeared } = comparison;

  const growingCount = matched.filter(m => m.changeType === 'growing').length;
  const decliningCount = matched.filter(m => m.changeType === 'declining').length;
  const stableCount = matched.filter(m => m.changeType === 'stable').length;
  const cognitionShiftCount = matched.filter(m => m.cognitionShift).length;

  const avgChange = matched.length > 0
    ? (matched.reduce((s, m) => s + m.scoreChangePct, 0) / matched.length).toFixed(1)
    : '0.0';

  const filteredInsights = insightFilter === 'all'
    ? insights
    : insights.filter(i => i.type === insightFilter);

  const sortedInsights = [...filteredInsights].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Temporal Intelligence</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
            기간 비교 분석
            <span className="ml-3 text-sm font-mono font-semibold text-slate-400 dark:text-slate-600">
              {snapshotA.label} → {snapshotB.label}
            </span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">{category}</span> 카테고리의 Context 블록 변화와 AEO·GEO 전략 기회를 분석합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-sm">
          {(['sankey', 'table'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'sankey' ? 'Flow Diagram' : '상세 비교표'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard value={matched.length} label="지속 CEP" sub="Persistent" color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-50 dark:bg-indigo-900/10" border="border-indigo-100 dark:border-indigo-500/20" />
        <SummaryCard value={growingCount} label="성장" sub="Growing" color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/10" border="border-emerald-100 dark:border-emerald-500/20" />
        <SummaryCard value={decliningCount} label="쇠퇴" sub="Declining" color="text-rose-600 dark:text-rose-400" bg="bg-rose-50 dark:bg-rose-900/10" border="border-rose-100 dark:border-rose-500/20" />
        <SummaryCard value={emerging.length} label="신규 출현" sub="Emerging" color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-900/10" border="border-amber-100 dark:border-amber-500/20" />
        <SummaryCard value={disappeared.length} label="소멸" sub="Disappeared" color="text-slate-500 dark:text-slate-400" bg="bg-slate-50 dark:bg-slate-800/40" border="border-slate-200 dark:border-slate-700" />
        <SummaryCard value={`${Number(avgChange) > 0 ? '+' : ''}${avgChange}%`} label="평균 변화" sub="Avg Δ Score" color={Number(avgChange) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} bg={Number(avgChange) >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-rose-50 dark:bg-rose-900/10'} border={Number(avgChange) >= 0 ? 'border-emerald-100 dark:border-emerald-500/20' : 'border-rose-100 dark:border-rose-500/20'} />
      </div>

      {/* ── Visualization ── */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/3">
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              {activeTab === 'sankey' ? 'Context Flow — Sankey Diagram' : 'Context Comparison Table'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">
              {activeTab === 'sankey'
                ? '각 블록의 높이는 Priority Score에 비례합니다. 흐름 색상은 변화 방향을 나타냅니다.'
                : '두 기간의 Context 블록을 상세 비교합니다.'}
            </p>
          </div>
          {cognitionShiftCount > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-500/30 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-[10px] font-black text-violet-700 dark:text-violet-300 uppercase tracking-widest">
                인텐트 전환 {cognitionShiftCount}건
              </span>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'sankey' ? (
            <SankeyDiagram comparison={comparison} />
          ) : (
            <ComparisonTable matched={matched} emerging={emerging} disappeared={disappeared} />
          )}
        </div>
      </div>

      {/* ── AI Insights ── */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">AI Strategic Insights</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">AEO·GEO 관점에서 도출된 전략적 시사점</p>
            </div>
            {/* Insight type filter */}
            {!isLoadingInsights && insights.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'aeo', 'geo', 'trend', 'opportunity', 'warning'] as InsightFilter[]).map(f => {
                  const cfg = f === 'all' ? null : INSIGHT_CONFIG[f];
                  const isActive = insightFilter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setInsightFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      {f === 'all' ? 'All' : `${cfg?.icon} ${cfg?.label}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {isLoadingInsights ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">AI가 전략적 시사점을 분석 중입니다...</p>
            </div>
          ) : sortedInsights.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-600">
              <p className="text-sm font-bold">해당 유형의 인사이트가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedInsights.map((insight, idx) => {
                const cfg = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.trend;
                return (
                  <div
                    key={idx}
                    className={`${cfg.bg} ${cfg.border} border rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cfg.icon}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[insight.priority]}`} />
                        <span className="text-[9px] font-semibold text-slate-400 uppercase">{insight.priority}</span>
                      </div>
                    </div>
                    <h4 className={`text-sm font-black ${cfg.color} mb-2 leading-snug`}>{insight.title}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{insight.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Comparison Table ───────────────────────────────────────────────────────
const CHANGE_BADGE: Record<string, { label: string; color: string }> = {
  growing:    { label: '▲ 성장', color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300' },
  declining:  { label: '▼ 쇠퇴', color: 'text-rose-700 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300' },
  stable:     { label: '● 유지', color: 'text-indigo-700 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300' },
  emerging:   { label: '★ 신규', color: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300' },
  disappeared:{ label: '✕ 소멸', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
};

const COGNITION_EN: Record<string, string> = {
  informational: 'Informational',
  exploratory:   'Exploratory',
  commercial:    'Commercial',
  transactional: 'Transactional',
};

const ComparisonTable: React.FC<{
  matched: MatchedCEP[];
  emerging: import('../core/context').Context[];
  disappeared: import('../core/context').Context[];
}> = ({ matched, emerging, disappeared }) => {
  const sortedMatched = [...matched].sort((a, b) =>
    (b.cepB.marketSignal?.priorityScore || 0) - (a.cepB.marketSignal?.priorityScore || 0)
  );

  const rows: Array<{
    label: string;
    cognitionA?: string;
    cognitionB?: string;
    scoreA?: number;
    scoreB?: number;
    changePct?: number;
    changeType: string;
    cognitionShift?: boolean;
  }> = [
    ...sortedMatched.map(m => ({
      label: m.cepB.marketSignal?.clusterName || m.cepB.situation,
      cognitionA: COGNITION_EN[(m.cepA as any).hybridCognition || m.cepA.cognition || ''] || '-',
      cognitionB: COGNITION_EN[(m.cepB as any).hybridCognition || m.cepB.cognition || ''] || '-',
      scoreA: m.cepA.marketSignal?.priorityScore,
      scoreB: m.cepB.marketSignal?.priorityScore,
      changePct: m.scoreChangePct,
      changeType: m.changeType,
      cognitionShift: m.cognitionShift,
    })),
    ...emerging.map(c => ({
      label: c.marketSignal?.clusterName || c.situation,
      cognitionA: undefined,
      cognitionB: COGNITION_EN[(c as any).hybridCognition || c.cognition || ''] || '-',
      scoreA: undefined,
      scoreB: c.marketSignal?.priorityScore,
      changeType: 'emerging',
    })),
    ...disappeared.map(c => ({
      label: c.marketSignal?.clusterName || c.situation,
      cognitionA: COGNITION_EN[(c as any).hybridCognition || c.cognition || ''] || '-',
      cognitionB: undefined,
      scoreA: c.marketSignal?.priorityScore,
      scoreB: undefined,
      changeType: 'disappeared',
    })),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {['Context 블록', '상태', 'Intent A', 'Intent B', 'Score A', 'Score B', '변화율', '비고'].map(h => (
              <th key={h} className="pb-3 px-2 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row, idx) => {
            const badge = CHANGE_BADGE[row.changeType] || CHANGE_BADGE.stable;
            return (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
                <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200 max-w-[180px] truncate" title={row.label}>{row.label}</td>
                <td className="py-3 px-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                </td>
                <td className="py-3 px-2 text-[11px] text-slate-500 dark:text-slate-400">{row.cognitionA || '—'}</td>
                <td className="py-3 px-2">
                  <span className={`text-[11px] font-semibold ${row.cognitionShift ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {row.cognitionB || '—'}
                    {row.cognitionShift && <span className="ml-1 text-[9px]">⟳</span>}
                  </span>
                </td>
                <td className="py-3 px-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">{row.scoreA ?? '—'}</td>
                <td className="py-3 px-2 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">{row.scoreB ?? '—'}</td>
                <td className="py-3 px-2 font-mono text-[11px] font-bold">
                  {row.changePct !== undefined ? (
                    <span className={row.changePct > 0 ? 'text-emerald-600' : row.changePct < 0 ? 'text-rose-600' : 'text-slate-400'}>
                      {row.changePct > 0 ? '+' : ''}{row.changePct.toFixed(1)}%
                    </span>
                  ) : '—'}
                </td>
                <td className="py-3 px-2">
                  {row.cognitionShift && (
                    <span className="text-[9px] text-violet-600 dark:text-violet-400 font-bold">인텐트 전환</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TemporalComparisonView;
