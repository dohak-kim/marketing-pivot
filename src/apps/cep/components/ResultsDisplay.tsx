
import React, { useMemo } from 'react';
import type { AnalysisResultItem, KeywordIntelligence } from '../types';
import { ClockIcon, LocationMarkerIcon, QuestionMarkCircleIcon, UsersIcon, SparklesIcon, LightBulbIcon } from './icons';

interface ResultsDisplayProps {
  results: AnalysisResultItem[];
  timeFilter: string;
  dataVolume: number;
  isLightMode?: boolean;
  keywordIntel?: KeywordIntelligence | null;
  query?: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, timeFilter, dataVolume, isLightMode, keywordIntel, query }) => {
  const periodLabels: { [key: string]: string } = {
    'qdr:w': '최근 1주일',
    'qdr:m': '최근 1개월',
    'qdr:m6': '최근 6개월',
    'qdr:y': '최근 1년',
  };

  const maxPercentage = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.max(...results.map(r => r.percentage));
  }, [results]);

  return (
    <div className="space-y-8 print:space-y-4">
      {keywordIntel && (
        <section className={`p-6 sm:p-10 rounded-[2.5rem] border-2 shadow-2xl animate-fade-in print:rounded-none print:p-8 print:border-slate-900 print:shadow-none print:bg-white ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-sky-500/20 shadow-sky-500/5'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:mb-6">
            <h2 className={`text-2xl font-black uppercase tracking-tighter ${isLightMode ? 'text-black' : 'text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400'} print:text-black`}>
              Executive Strategy Summary
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:hidden mb-8">
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
              <span className="text-[9px] font-black text-slate-500 uppercase mb-2">키워드</span>
              <span className={`text-sm font-black break-all ${isLightMode ? 'text-black' : 'text-white'}`}>"{query}"</span>
            </div>
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
              <span className="text-[9px] font-black text-slate-500 uppercase mb-2">검색 수준</span>
              <span className={`text-sm font-black ${isLightMode ? 'text-sky-600' : 'text-sky-400'}`}>{keywordIntel.level} Tier</span>
            </div>
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
              <span className="text-[9px] font-black text-slate-500 uppercase mb-2">잠재력</span>
              <span className={`text-xl font-black ${keywordIntel.potentialScore > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{keywordIntel.potentialScore}</span>
            </div>
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
              <span className="text-[9px] font-black text-slate-500 uppercase mb-2">고객 여정</span>
              <span className={`text-[11px] font-black ${isLightMode ? 'text-indigo-800' : 'text-indigo-400'}`}>{keywordIntel.cdjStage}</span>
            </div>
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
              <span className="text-[9px] font-black text-slate-500 uppercase mb-2">의도</span>
              <span className={`text-[11px] font-black ${isLightMode ? 'text-teal-800' : 'text-teal-400'}`}>{keywordIntel.searchIntent}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
            <div className={`p-6 rounded-2xl border ${isLightMode ? 'bg-sky-50 border-sky-100' : 'bg-sky-900/10 border-sky-500/20'}`}>
               <h4 className={`text-xl font-black text-sky-500 uppercase mb-3 print:text-black`}>Strategic Insight</h4>
               <p className={`text-[14px] leading-relaxed ${isLightMode ? 'text-slate-800' : 'text-slate-300'} print:text-black`}>
                 {keywordIntel.description}
               </p>
            </div>
            <div className={`p-6 rounded-2xl border ${isLightMode ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-900/10 border-indigo-500/20'}`}>
               <h4 className={`text-xl font-black text-indigo-500 uppercase mb-3 print:text-black`}>Action Plan</h4>
               <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isLightMode ? 'text-slate-800' : 'text-slate-300'} print:text-black`}>
                 {keywordIntel.actionPlan}
               </div>
            </div>
          </div>
        </section>
      )}

      <h2 className={`text-3xl font-black text-center mb-8 print:text-black print:text-xl print:text-left print:mt-10 ${isLightMode ? 'text-black' : 'text-slate-100'}`}>상세 상황(CEP) 및 페인포인트 분석</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:grid-cols-1 print:gap-4">
        {results.map((item, index) => {
          const isHighest = item.percentage === maxPercentage;
          return (
            <div 
              key={index} 
              className={`${isLightMode ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-800 border-slate-700 shadow-lg'} rounded-xl transition-all flex flex-col relative overflow-hidden print:shadow-none print:border-slate-300 print:bg-white print:page-break-inside-avoid`}
            >
              <div className={`absolute top-4 right-4 ${isHighest ? 'bg-rose-500/10' : 'bg-sky-500/20'} px-3 py-1 rounded-full print:border print:border-slate-300`}>
                <span className={`text-sm font-black ${isHighest ? 'text-rose-600' : 'text-sky-400'} print:text-black`}>{item.percentage}%</span>
              </div>

              <div className="p-6 flex-grow print:p-4">
                <h3 className={`text-xl font-bold ${isHighest ? 'text-rose-500' : (isLightMode ? 'text-sky-700' : 'text-sky-400')} mb-6 print:text-black print:text-base print:mb-4`}>
                  CEP 분석 #{index + 1}
                </h3>
                
                <div className="grid grid-cols-1 gap-4 print:gap-2">
                  <div className="flex items-start">
                    <ClockIcon className="w-5 h-5 mr-3 mt-1 flex-shrink-0 text-sky-400 print:text-slate-400" />
                    <div><strong className="text-[10px] text-slate-500 uppercase block">상황 (When)</strong><span className="font-medium text-sm">{item.cep.when}</span></div>
                  </div>
                  <div className="flex items-start">
                    <LocationMarkerIcon className="w-5 h-5 mr-3 mt-1 flex-shrink-0 text-sky-400 print:text-slate-400" />
                    <div><strong className="text-[10px] text-slate-500 uppercase block">장소 (Where)</strong><span className="font-medium text-sm">{item.cep.where}</span></div>
                  </div>
                  <div className="flex items-start">
                    <LightBulbIcon className="w-5 h-5 mr-3 mt-1 flex-shrink-0 text-sky-400 print:text-slate-400" />
                    <div><strong className="text-[10px] text-slate-500 uppercase block">목적 (Why)</strong><span className="font-medium text-sm">{item.cep.why}</span></div>
                  </div>
                  <div className="flex items-start">
                    <UsersIcon className="w-5 h-5 mr-3 mt-1 flex-shrink-0 text-sky-400 print:text-slate-400" />
                    <div><strong className="text-[10px] text-slate-500 uppercase block">동반자 (With)</strong><span className="font-medium text-sm">{item.cep.with}</span></div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 pb-6 mt-auto print:px-4 print:pb-4">
                <div className="pt-5 border-t border-slate-700/30 print:border-slate-200 print:pt-2">
                  <h4 className="font-bold text-amber-500 mb-2 print:text-black print:text-xs">Pain Point</h4>
                  <p className="bg-amber-500/10 border-l-4 border-amber-500 p-3 text-[13px] leading-relaxed print:bg-slate-50 print:text-black print:text-xs">
                    {item.painPoint}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultsDisplay;
