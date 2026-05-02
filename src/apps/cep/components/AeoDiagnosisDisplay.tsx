
import React from 'react';
import type { AeoScoreReport } from '../types';
import { LightBulbIcon, PencilIcon, SparklesIcon } from './icons';

interface AeoDiagnosisDisplayProps {
  report: AeoScoreReport;
  query: string;
  onImprove: () => void;
  isImproving: boolean;
  isLightMode?: boolean;
}

const AeoDiagnosisDisplay: React.FC<AeoDiagnosisDisplayProps> = ({ report, query, onImprove, isImproving, isLightMode }) => {
  // 백엔드 응답을 신뢰하되, 프론트에서도 가중치 합산을 명확히 보여줌
  const totalScore = report.score;

  return (
    <div className={`${isLightMode ? 'bg-slate-50 border-slate-200 shadow-xl' : 'bg-slate-800/50 border-slate-700 shadow-2xl'} border rounded-xl animate-fade-in p-6 sm:p-8 transition-colors duration-500`}>
      <header className={`border-b ${isLightMode ? 'border-purple-200' : 'border-purple-500/30'} pb-4 mb-6 flex justify-between items-center flex-wrap gap-4`}>
        <div>
          <h2 className={`text-3xl font-bold ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
            🎯 AEO 최적화 진단 (가중치 합산)
          </h2>
          <p className="text-slate-500 mt-1">
            '{query}' 키워드에 대한 4대 전략 지표 기여도 분석
          </p>
        </div>
        <button
          onClick={onImprove}
          disabled={isImproving || totalScore >= 98}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300 shadow-xl flex items-center gap-2"
        >
          {isImproving ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              고도화 중...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" />
              진단 제언 반영 재작성
            </>
          )}
        </button>
      </header>

      <div className={`mb-8 text-center ${isLightMode ? 'bg-white border-slate-200 shadow-inner' : 'bg-slate-900/40 border-slate-700/50'} p-8 rounded-2xl border transition-colors`}>
        <div className="mb-4">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Total AEO Intelligence Score</span>
            <h3 className={`text-6xl sm:text-7xl font-extrabold flex items-center justify-center gap-4 ${totalScore >= 80 ? 'text-emerald-500' : totalScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
            {totalScore}<span className="text-2xl opacity-40 -ml-2">/100</span>
            </h3>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-5 mb-8 max-w-xl mx-auto shadow-inner overflow-hidden">
          <div 
            className={`h-5 rounded-full transition-all duration-1000 ease-out ${totalScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : totalScore >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-rose-500 to-red-400'}`} 
            style={{ width: `${totalScore}%` }}
            role="progressbar"
            aria-valuenow={totalScore}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
        
        {/* 가중치 기반 지표 브레이크다운 UI - 분수 형태 시각화 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className={`flex flex-col items-center p-4 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                <span className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-tighter">직접성 (Weight: 30)</span>
                <div className="flex items-baseline gap-0.5">
                    <span className={`text-2xl font-black ${isLightMode ? 'text-sky-600' : 'text-sky-400'}`}>{report.breakdown.directness}</span>
                    <span className="text-sm opacity-40 font-bold">/30</span>
                </div>
            </div>
            <div className={`flex flex-col items-center p-4 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                <span className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-tighter">엔티티 (Weight: 30)</span>
                <div className="flex items-baseline gap-0.5">
                    <span className={`text-2xl font-black ${isLightMode ? 'text-indigo-600' : 'text-indigo-400'}`}>{report.breakdown.entity}</span>
                    <span className="text-sm opacity-40 font-bold">/30</span>
                </div>
            </div>
            <div className={`flex flex-col items-center p-4 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                <span className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-tighter">신뢰성 (Weight: 20)</span>
                <div className="flex items-baseline gap-0.5">
                    <span className={`text-2xl font-black ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`}>{report.breakdown.reliability}</span>
                    <span className="text-sm opacity-40 font-bold">/20</span>
                </div>
            </div>
            <div className={`flex flex-col items-center p-4 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                <span className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-tighter">구조화 (Weight: 20)</span>
                <div className="flex items-baseline gap-0.5">
                    <span className={`text-2xl font-black ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`}>{report.breakdown.structure}</span>
                    <span className="text-sm opacity-40 font-bold">/20</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${isLightMode ? 'bg-sky-50 border-sky-100' : 'bg-sky-900/20 border-sky-800/50'} border rounded-2xl p-6 transition-all hover:scale-[1.01]`}>
          <h4 className="text-xl font-bold text-sky-500 mb-4 flex items-center">
            <LightBulbIcon className="w-6 h-6 mr-3" />
            AI 감사관 비평
          </h4>
          <p className={`${isLightMode ? 'text-slate-700' : 'text-sky-100/80'} leading-relaxed whitespace-pre-wrap text-[15px] font-medium`}>{report.feedback}</p>
        </div>
        <div className={`${isLightMode ? 'bg-emerald-50 border-emerald-100' : 'bg-emerald-900/20 border-emerald-800/50'} border rounded-2xl p-6 transition-all hover:scale-[1.01]`}>
          <h4 className="text-xl font-bold text-emerald-500 mb-4 flex items-center">
            <PencilIcon className="w-6 h-6 mr-3" />
            핵심 최적화 제언
          </h4>
          <p className={`${isLightMode ? 'text-slate-700' : 'text-emerald-100/80'} leading-relaxed whitespace-pre-wrap text-[15px] font-medium`}>{report.suggestion}</p>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default AeoDiagnosisDisplay;
