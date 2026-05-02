
import React from 'react';
import { Context } from '../core/context';
import { buildContextActions } from '../utils/buildContextActions';

export function ContextActionPanel({ cep }: { cep: Context }) {
  const actions = buildContextActions(cep);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span>Strategic Actions</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
        </div>
        <div className="flex items-center gap-2">
            {cep.marketSignal?.trendDirection === 'UP' && (
                <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-500/20">
                    TREND ↗
                </span>
            )}
            {cep.journey?.conversionStage && (
                 <span className="text-[9px] font-mono text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20 uppercase">
                    {cep.journey.conversionStage.replace('_', ' ')}
                 </span>
            )}
        </div>
      </div>
      
      {actions.map((action) => (
        <div
          key={action.cognition}
          className="p-3 rounded-xl bg-white border border-slate-100 dark:bg-white/5 dark:border-white/5 shadow-sm transition-all hover:bg-indigo-50/50 dark:hover:bg-white/10 group"
        >
          <div className="flex items-center gap-2 mb-1">
             <div className={`w-1 h-4 rounded-full ${
                 action.cognition === 'transactional' ? 'bg-emerald-500' :
                 action.cognition === 'commercial' ? 'bg-amber-500' :
                 action.cognition === 'exploratory' ? 'bg-purple-500' : 'bg-blue-500'
             }`}></div>
             <strong className="text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-tight break-keep">{action.label}</strong>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed pl-3 break-keep">
            {action.description}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ContextActionPanel;
