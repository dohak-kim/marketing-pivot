import React, { useState } from 'react';
import { StrategicCluster } from '../models/strategicCluster';

const STRATEGY_STYLE: Record<string, { badge: string; dot: string; labelKo: string; equiv5: string }> = {
  'Concentrated Attack': {
    badge:   'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700/30',
    dot:     'bg-rose-500',
    labelKo: '집중 공격',
    equiv5:  'Offensive',
  },
  'Defensive Hold': {
    badge:   'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-700/30',
    dot:     'bg-indigo-500',
    labelKo: '방어 유지',
    equiv5:  'Defensive',
  },
  'Flank Opportunity': {
    badge:   'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/30',
    dot:     'bg-emerald-500',
    labelKo: '측면 기회',
    equiv5:  'Niche Capture',
  },
  'Experimental Zone': {
    badge:   'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    dot:     'bg-slate-400',
    labelKo: '실험 구간',
    equiv5:  'Monitor / Brand Build',
  },
};

const fallback = {
  badge:   'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  dot:     'bg-slate-400',
  labelKo: '분류 중',
  equiv5:  '—',
};

export const StrategyBlockCard: React.FC<{ block: StrategicCluster }> = ({ block }) => {
  const [expanded, setExpanded] = useState(false);

  const brandPct  = Math.round(block.avgBrandShare * 100);
  const compPct   = Math.round(block.avgCompetitorShare * 100);
  const otherPct  = Math.max(0, 100 - brandPct - compPct);
  const style     = STRATEGY_STYLE[block.strategyType] ?? fallback;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden shadow-sm transition-shadow hover:shadow-md">

      {/* ── 상단 고정 영역 ── */}
      <div className="p-3 space-y-2.5">

        {/* 제목 + 전략 뱃지 */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 leading-snug flex-1">
            {block.label}
          </h4>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {/* Similarity Network 자체 분류 */}
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${style.badge}`}>
              {style.labelKo}
            </span>
            {/* 5 Strategy Framework 대응 명칭 */}
            <span className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              ≈ {style.equiv5}
            </span>
          </div>
        </div>

        {/* Share of Voice 바 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Share of Voice</span>
            <span>자사 {brandPct}% · 경쟁 {compPct}%</span>
          </div>
          <div className="h-1.5 flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            <div style={{ width: `${brandPct}%` }}  className="bg-indigo-500" />
            <div style={{ width: `${compPct}%` }}   className="bg-rose-500" />
            <div style={{ width: `${otherPct}%` }}  className="bg-slate-300 dark:bg-slate-700 opacity-40" />
          </div>
        </div>

        {/* 설명 — 접힘 시 2줄 미리보기 */}
        {block.description && (
          <p className={`text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {block.description}
          </p>
        )}
      </div>

      {/* ── 펼침 시 전략 액션 영역 ── */}
      {expanded && block.recommendedActions?.length > 0 && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-white/5">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            권장 액션
          </p>
          <ul className="space-y-1.5">
            {block.recommendedActions.map((action, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                <span className="text-[10px] text-slate-600 dark:text-slate-300 leading-snug">
                  {action}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 전개 토글 버튼 ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full py-1.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/5 text-[8px] font-black text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-[0.15em] flex items-center justify-center gap-1 transition-colors"
      >
        {expanded
          ? <span>접기 ↑</span>
          : <span>전략 상세 보기 ↓</span>
        }
      </button>
    </div>
  );
};

export default StrategyBlockCard;
