import React from 'react';
import { Context } from '../core/context';
import { buildContextCognitionMatrix } from '../utils/buildContextCognitionMatrix';

const COGNITION_LABEL: Record<string, { en: string; ko: string }> = {
  informational: { en: 'Informational', ko: '콘텐츠 제작' },
  exploratory:   { en: 'Exploratory',   ko: '비교·가이드' },
  commercial:    { en: 'Commercial',    ko: 'USP·메시지' },
  transactional: { en: 'Transactional', ko: '전환·오퍼' },
};

export function ContextCognitionMatrix({ ceps }: { ceps: Context[] }) {
  const matrix = buildContextCognitionMatrix(ceps);

  if (!ceps || ceps.length === 0) return null;

  return (
    <div className="mt-8 p-8 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 tracking-tight flex items-center gap-3">
        <span>Context × Cognition Matrix</span>
        <span className="text-[10px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-mono uppercase tracking-widest">
          Strategic Heatmap
        </span>
      </h3>

      <div className="overflow-x-auto no-scrollbar">
        <div
          className="grid gap-y-2 min-w-[700px]"
          style={{
            gridTemplateColumns: `minmax(250px, 1fr) repeat(4, 120px)`,
          }}
        >
          {/* Header */}
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest pb-3 border-b border-slate-200 dark:border-white/10 flex items-end">
            Situation Context
          </div>
          {Object.values(COGNITION_LABEL).map(({ en, ko }) => (
            <div
              key={en}
              className="text-center pb-3 border-b border-slate-200 dark:border-white/10 flex flex-col items-center gap-0.5"
            >
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{en}</span>
              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-600">{ko}</span>
            </div>
          ))}

          {/* Rows */}
          {matrix.map((row) => (
            <React.Fragment key={row.contextId}>
              <div
                className="text-sm font-bold text-slate-700 dark:text-slate-300 pr-6 flex items-center h-12 truncate border-b border-slate-100 dark:border-white/5 last:border-0"
                title={row.contextTitle}
              >
                {row.contextTitle}
              </div>

              {row.values.map((cell) => {
                const intensity = Math.min(1, Math.max(0, cell.value));
                // Blue-Indigo gradient simulation based on intensity
                const opacity = 0.05 + (intensity * 0.95);
                
                return (
                  <div key={cell.cognition} className="flex items-center justify-center h-12 border-b border-slate-100 dark:border-white/5 last:border-0 p-1">
                    <div
                      className="w-full h-full rounded-lg transition-all hover:scale-[0.98] cursor-help relative group flex items-center justify-center"
                      style={{
                        backgroundColor: `rgba(99, 102, 241, ${opacity})`,
                      }}
                      title={`${COGNITION_LABEL[cell.cognition]?.en ?? cell.cognition}: ${(cell.value * 100).toFixed(1)}%`}
                    >
                      <span className={`text-[11px] font-mono font-black ${intensity > 0.4 ? 'text-white' : 'text-indigo-600 dark:text-indigo-300'}`}>
                        {(cell.value * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ContextCognitionMatrix;
