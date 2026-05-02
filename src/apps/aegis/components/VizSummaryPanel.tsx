import React, { useState } from 'react';
import type { VizSummary } from '../ai/gemini';

interface VizSummaryPanelProps {
  summary: VizSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
  accentColor: 'indigo' | 'violet' | 'emerald';
}

const ACCENT = {
  indigo: {
    border:   'border-indigo-200 dark:border-indigo-500/20',
    header:   'bg-indigo-50 dark:bg-indigo-900/20',
    dot:      'bg-indigo-500',
    label:    'text-indigo-700 dark:text-indigo-300',
    badge:    'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
    bullet:   'bg-indigo-400',
    action:   'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
    skeleton: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  violet: {
    border:   'border-violet-200 dark:border-violet-500/20',
    header:   'bg-violet-50 dark:bg-violet-900/20',
    dot:      'bg-violet-500',
    label:    'text-violet-700 dark:text-violet-300',
    badge:    'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-300',
    bullet:   'bg-violet-400',
    action:   'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-300',
    skeleton: 'bg-violet-100 dark:bg-violet-900/30',
  },
  emerald: {
    border:   'border-emerald-200 dark:border-emerald-500/20',
    header:   'bg-emerald-50 dark:bg-emerald-900/20',
    dot:      'bg-emerald-500',
    label:    'text-emerald-700 dark:text-emerald-300',
    badge:    'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    bullet:   'bg-emerald-400',
    action:   'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    skeleton: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
};

const VizSummaryPanel: React.FC<VizSummaryPanelProps> = ({
  summary, isLoading, onRefresh, accentColor,
}) => {
  const [open, setOpen] = useState(true);
  const c = ACCENT[accentColor];

  return (
    <div className={`rounded-2xl border ${c.border} overflow-hidden mb-4`}>
      {/* 헤더 */}
      <div className={`${c.header} px-4 py-2.5 flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${c.dot} ${isLoading ? 'animate-pulse' : ''}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${c.label}`}>
            🧠 AI 전략 해석
          </span>
          {isLoading && (
            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
              분석 중...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!isLoading && summary && (
            <button
              onClick={onRefresh}
              title="재분석"
              className="text-[9px] font-bold px-2 py-0.5 rounded-lg border border-current opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: 'inherit' }}
            >
              ↺ 새로고침
            </button>
          )}
          <button
            onClick={() => setOpen(v => !v)}
            className={`text-[9px] font-bold px-2 py-0.5 rounded-lg opacity-50 hover:opacity-100 transition-opacity ${c.label}`}
          >
            {open ? '접기 ▲' : '펼치기 ▼'}
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      {open && (
        <div className="bg-white dark:bg-white/[0.02] p-4 space-y-4 animate-in fade-in duration-200">

          {/* 로딩 스켈레톤 */}
          {isLoading && (
            <div className="space-y-3 animate-pulse">
              <div className={`h-5 rounded-lg ${c.skeleton} w-3/4`} />
              <div className="space-y-2 pt-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${c.skeleton} mt-1.5 shrink-0`} />
                    <div className={`h-3.5 rounded ${c.skeleton} flex-1`} style={{ width: `${70 + i * 7}%` }} />
                  </div>
                ))}
              </div>
              <div className={`h-10 rounded-xl ${c.skeleton} w-full`} />
            </div>
          )}

          {/* 결과 */}
          {!isLoading && summary && (
            <>
              {/* 헤드라인 */}
              <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-snug break-keep">
                "{summary.headline}"
              </p>

              {/* 인사이트 3개 */}
              {summary.insights.length > 0 && (
                <ul className="space-y-2">
                  {summary.insights.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${c.bullet} shrink-0 mt-[5px]`} />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug break-keep">
                        {ins}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* 권장 액션 */}
              {summary.action && (
                <div className={`rounded-xl border px-3 py-2.5 ${c.action}`}>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-60 block mb-0.5">
                    권장 액션
                  </span>
                  <p className="text-[11px] font-semibold leading-snug break-keep">
                    → {summary.action}
                  </p>
                </div>
              )}
            </>
          )}

          {/* 빈 상태 */}
          {!isLoading && !summary && (
            <div className="text-center py-3">
              <p className="text-[10px] text-slate-400 dark:text-slate-600 mb-2">
                AI 전략 해석을 불러오는 중입니다...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VizSummaryPanel;
