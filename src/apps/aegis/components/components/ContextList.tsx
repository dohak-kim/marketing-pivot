
import React, { useMemo } from 'react';
import { Context, ConversionStage, CognitionVector } from '../core/context';
import ContextActionPanel from './ContextActionPanel';

interface ContextListProps {
  ceps: Context[];
  onSelect: (cep: Context) => void;
  onToggleSelect?: (id: string) => void;
}

// Helper to determine the dominant cognition with safety check
const getDominantCognition = (cognition: CognitionVector | undefined) => {
  if (!cognition) return { label: 'Unspecified', color: 'text-slate-500' };
  
  const entries = Object.entries(cognition);
  if (entries.length === 0) return { label: 'Unspecified', color: 'text-slate-500' };
  
  const [key, _] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
  
  switch (key) {
    case 'informational': return { label: 'Informational', sub: '콘텐츠 제작', color: 'text-blue-600 dark:text-blue-400' };
    case 'exploratory':   return { label: 'Exploratory',   sub: '비교·가이드',  color: 'text-purple-600 dark:text-purple-400' };
    case 'commercial':    return { label: 'Commercial',    sub: 'USP·메시지',   color: 'text-amber-600 dark:text-amber-400' };
    case 'transactional': return { label: 'Transactional', sub: '전환·오퍼',    color: 'text-emerald-600 dark:text-emerald-400' };
    default: return { label: '복합 의도', color: 'text-slate-500 dark:text-slate-400' };
  }
};

const PriorityMeter = ({ score, isReady = false }: { score: number; isReady?: boolean }) => {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-500/30';
    if (s >= 50) return 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-500/30';
    return 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-500/30';
  };

  if (isReady) {
    return (
      <div
        className="h-9 px-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-500 dark:bg-emerald-500 flex items-center gap-1.5 shadow-md shadow-emerald-500/30 shrink-0"
        role="status"
        aria-label={`Strategy Ready · Priority Score: ${score}`}
      >
        <svg className="w-3 h-3 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-[10px] font-black text-white uppercase tracking-tight">Strategy</span>
        <span className="text-sm font-mono font-black text-white/90 ml-0.5">{score}</span>
      </div>
    );
  }

  return (
    <div className={`w-32 h-9 px-2 rounded-xl border flex items-center justify-between ${getColor(score)} shadow-sm shrink-0`} role="status" aria-label={`Priority Score: ${score}`}>
      <span className="text-[10px] font-black uppercase tracking-tight">Priority</span>
      <span className="text-base font-mono font-black">{score}</span>
    </div>
  );
};

const getScoreInterpretation = (score: number) => {
  if (score >= 90) return "폭발적 관심 집중";
  if (score >= 75) return "강한 상승 트렌드";
  if (score >= 50) return "안정적 유입 지속";
  if (score >= 30) return "잠재 수요 존재";
  return "초기 신호 감지";
};

const ContextList: React.FC<ContextListProps> = ({ ceps, onSelect, onToggleSelect }) => {
  const { maxPriority, totalPriority } = useMemo(() => {
    if (ceps.length === 0) return { maxPriority: 0, totalPriority: 0 };
    const max = Math.max(...ceps.map(c => c.marketSignal?.priorityScore || 0));
    const total = ceps.reduce((sum, c) => sum + (c.marketSignal?.priorityScore || 0), 0);
    return { maxPriority: max, totalPriority: total };
  }, [ceps]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {ceps.map((cep) => {
        // Safety checks for rendering
        if (!cep.marketSignal || !cep.journey) return null;

        const isTopPriority = cep.marketSignal.priorityScore === maxPriority;
        const strategicShare = totalPriority > 0 ? Math.round((cep.marketSignal.priorityScore / totalPriority) * 100) : 0;
        const dominantCognition = getDominantCognition(cep.journey.cognitionVector);
        
        // Brand Share logic (Top-level)
        const brandShare = cep.brandShare ? Math.round(cep.brandShare * 100) : 0;
        const competitorShare = cep.competitorShare ? Math.round(cep.competitorShare * 100) : 0;
        const hasShareData = cep.brandPresence && cep.brandPresence.length > 0;
        
        return (
          <div 
            key={cep.id} 
            onClick={() => onSelect(cep)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(cep);
                }
            }}
            className={`bg-white dark:bg-slate-900 rounded-[1.5rem] p-8 cursor-pointer border transition-all group relative overflow-hidden flex flex-col h-full shadow-lg active:scale-[0.99] theme-transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
              cep.isChecked
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 hover:border-indigo-500'
                : cep.executionPlan
                  ? 'border-emerald-400/60 dark:border-emerald-500/40 ring-1 ring-emerald-400/20 hover:border-emerald-500 hover:shadow-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:shadow-indigo-500/10'
            }`}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 transition-all" />

            {/* Strategic Header: Conversion Hierarchy */}
            <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {onToggleSelect && (
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSelect(cep.id);
                                }}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${cep.isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'}`}
                            >
                                {cep.isChecked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                        )}
                        <div className="flex items-center space-x-2 flex-wrap min-w-0">
                            {/* Adjusted font size and spacing to prevent truncation */}
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-normal whitespace-nowrap">
                                {cep.journey.conversionStage}
                            </span>
                            <span className="text-xs text-slate-300 dark:text-slate-600 shrink-0">•</span>
                            <span className={`text-xs font-black uppercase tracking-tight ${dominantCognition.color} whitespace-nowrap`}>
                                {dominantCognition.label}
                            </span>
                            {'sub' in dominantCognition && dominantCognition.sub && (
                              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-600 whitespace-nowrap">
                                {dominantCognition.sub}
                              </span>
                            )}
                        </div>
                    </div>
                    {/* Priority + Strategy Ready 통합 표시 */}
                    <PriorityMeter
                      score={cep.marketSignal.priorityScore}
                      isReady={!!cep.executionPlan}
                    />
                </div>
            </div>

            {/* 군집명 & Market Share 표시 */}
            <div className={`mb-4 rounded-lg border flex items-stretch overflow-hidden shadow-sm ${
              isTopPriority 
                ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-500/30' 
                : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30'
            }`}>
              <div className="px-5 py-4 flex-1 flex flex-col justify-center border-r border-current border-opacity-10">
                 <span className={`text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center ${
                   isTopPriority ? 'text-rose-700 dark:text-rose-300' : 'text-indigo-700 dark:text-indigo-300'
                 }`}>
                   <span className={`w-1.5 h-1.5 rounded-full mr-2 shrink-0 ${isTopPriority ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`} />
                   Strategic Cluster
                 </span>
                 {/* Fixed Height Container for 2 lines text centering */}
                 <div className="h-[3rem] flex items-center">
                    <span className={`text-lg font-bold leading-tight break-keep line-clamp-2 font-sans ${
                        isTopPriority ? 'text-rose-900 dark:text-rose-100' : 'text-slate-900 dark:text-white'
                    }`}>
                        {cep.marketSignal.clusterName || '일반 시장'}
                    </span>
                 </div>
              </div>
              <div className={`px-3 py-2 w-20 flex flex-col items-center justify-center shrink-0 ${
                isTopPriority ? 'bg-rose-100/50 dark:bg-rose-500/10' : 'bg-indigo-100/50 dark:bg-indigo-500/10'
              }`}>
                <span className={`text-[9px] font-black uppercase tracking-tighter text-center leading-none mb-1 ${
                  isTopPriority ? 'text-rose-800 dark:text-rose-300' : 'text-slate-600 dark:text-slate-400'
                }`}>Strategic<br/>Share</span>
                <span className={`text-lg font-mono font-black ${
                  isTopPriority ? 'text-rose-800 dark:text-rose-200' : 'text-slate-800 dark:text-slate-200'
                }`}>{strategicShare}%</span>
              </div>
            </div>
            
            {/* Share of Voice (SOV) Visualization */}
            {hasShareData && (
              <div className="mb-6 bg-slate-50 dark:bg-white/5 rounded-lg p-3 border border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Market SOV (Top 10)</span>
                  <div className="flex gap-3 text-[10px] font-mono font-bold">
                    <span className="text-indigo-600 dark:text-indigo-400">Brand: {brandShare}%</span>
                    <span className="text-rose-500 dark:text-rose-400">Comp: {competitorShare}%</span>
                  </div>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                  <div style={{ width: `${brandShare}%` }} className="bg-indigo-500" title={`Brand Share: ${brandShare}%`} />
                  <div style={{ width: `${competitorShare}%` }} className="bg-rose-500" title={`Competitor Share: ${competitorShare}%`} />
                </div>
              </div>
            )}
            
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight font-sans break-keep">
              {cep.situation}
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 line-clamp-2 leading-relaxed font-medium font-sans break-keep">
              {cep.description || '전략적 상세 설명이 생성되지 않았습니다.'}
            </p>

            {cep.executionPlan && (
                <p className="mb-4 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium line-clamp-2 leading-relaxed break-keep italic border-l-2 border-emerald-400 pl-3">
                    {(cep.executionPlan.situationSummary ?? '').substring(0, 60)}...
                </p>
            )}

            <div className="mt-auto space-y-7 pt-6 border-t border-slate-100 dark:border-slate-800">
              <ContextActionPanel cep={cep} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-500 uppercase font-black tracking-tight mb-2 flex justify-between whitespace-nowrap">
                    <span>Naver Pulse</span>
                    <span className="text-slate-900 dark:text-slate-300 font-mono">
                      {cep.marketSignal?.naverVolumeRange
                        ? cep.marketSignal.naverVolumeRange
                        : `${cep.marketSignal.naverScore}%`}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner mb-1.5">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${cep.marketSignal.naverScore}%` }} />
                  </div>
                  <div className="text-[10px] font-medium text-indigo-700 dark:text-indigo-400 text-right truncate">
                    {getScoreInterpretation(cep.marketSignal.naverScore)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-500 uppercase font-black tracking-tight mb-2 flex justify-between whitespace-nowrap">
                    <span>Google Query</span>
                    <span className="text-slate-900 dark:text-slate-300 font-mono">{cep.marketSignal.googleScore}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner mb-1.5">
                    <div className="h-full bg-sky-500 rounded-full transition-all duration-1000" style={{ width: `${cep.marketSignal.googleScore}%` }} />
                  </div>
                  <div className="text-[10px] font-medium text-sky-700 dark:text-sky-400 text-right truncate">
                    {getScoreInterpretation(cep.marketSignal.googleScore)}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                   <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                   추천 키워드
                </div>
                <div className="flex flex-wrap gap-2">
                  {cep.metadata.keywords && cep.metadata.keywords.slice(0, 3).map((kw, i) => (
                    <span key={kw.keyword + i} className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold tracking-tight font-sans hover:bg-white dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors cursor-default">
                      #{kw.keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Data provenance badge — 카드 최하단 */}
              {cep.marketSignal?.volumeIsEstimated !== false ? (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20">
                  <svg className="w-3 h-3 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">AI 추정값 — 실제 API 데이터 아님</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20">
                  <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">실측 API 데이터</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContextList;
