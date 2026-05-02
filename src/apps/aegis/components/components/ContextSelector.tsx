
import React from 'react';
import { Context, ConversionStage } from '../core/context';

interface ContextSelectorProps {
  cep: Context;
}

const ConversionStageBadge = ({ stage }: { stage: ConversionStage }) => {
  const colors: Record<string, string> = {
    [ConversionStage.AWARENESS]: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-500/30',
    [ConversionStage.CONSIDERATION]: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-500/30',
    [ConversionStage.DECISION]: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-500/30',
    [ConversionStage.POST_PURCHASE]: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-500/30',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${colors[stage] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
      {stage.replace('_', ' ').toUpperCase()}
    </span>
  );
};

const ContextSelector: React.FC<ContextSelectorProps> = ({ cep }) => {
  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
      <div className="flex items-center space-x-3 mb-5">
        <ConversionStageBadge stage={cep.journey.conversionStage} />
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">
          CODE: {cep.id.slice(0, 8)}
        </span>
      </div>
      
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-5 tracking-tight break-keep">
        {cep.situation}
      </h2>
      
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border-l-2 border-indigo-500 shadow-inner italic text-slate-600 dark:text-slate-300 leading-relaxed text-sm font-medium break-keep">
        "{cep.description || '시장 맥락 분석이 완료되지 않았습니다.'}"
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Priority Score</div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{cep.marketSignal.priorityScore}%</div>
        </div>
        <div className="bg-white dark:bg-slate-900/80 p-5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Confidence</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{(cep.journey.confidence * 100).toFixed(0)}%</div>
        </div>
      </div>

      {cep.groundingSources && cep.groundingSources.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
          <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center">
            <svg className="w-3.5 h-3.5 mr-2 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Intelligence Grounding
          </div>
          <div className="space-y-2">
            {cep.groundingSources.slice(0, 2).map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-3 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl transition-all group overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-700 dark:text-slate-200 font-bold truncate pr-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {source.title}
                  </span>
                  <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextSelector;
