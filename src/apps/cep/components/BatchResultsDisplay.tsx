
import React, { useState, useMemo } from 'react';
import type { FullAnalysisResult, BatchSummaryReport } from '../types';
import { generateBatchSummary } from '../services/geminiService';
import Loader from './Loader';

interface BatchResultsDisplayProps {
  results: FullAnalysisResult[];
  isLightMode?: boolean;
}

const BatchResultsDisplay: React.FC<BatchResultsDisplayProps> = ({ results, isLightMode }) => {
  const [summary, setSummary] = useState<BatchSummaryReport | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const stats = useMemo(() => {
    const total = results.length;
    const success = results.filter(r => !r.error).length;
    const cdjCounts = results.reduce((acc, curr) => {
        const stage = curr.keywordIntelligence?.cdjStage || 'Unknown';
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    // Explicitly cast to number for sort
    const topStage = Object.entries(cdjCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || '-';
    return { total, success, successRate: ((success / total) * 100).toFixed(0), topStage };
  }, [results]);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
        const report = await generateBatchSummary(results);
        setSummary(report);
    } catch (e) {
        alert("요약 리포트 생성 중 오류가 발생했습니다.");
    } finally {
        setIsGeneratingSummary(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div id="batch-report-container" className="mt-8 space-y-10 animate-fade-in print:mt-0 print:space-y-6">
      {/* 1. Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
        {[
          { label: '분석 키워드 수', value: `${stats.total}건`, color: 'text-sky-500' },
          { label: '데이터 성공률', value: `${stats.successRate}%`, color: 'text-emerald-500' },
          { label: '핵심 CDJ 위계', value: stats.topStage, color: 'text-indigo-500' },
          { label: '리포트 등급', value: 'Executive', color: 'text-purple-500' },
        ].map((item, i) => (
          <div key={i} className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/80 border-slate-700'} border p-5 rounded-2xl text-center shadow-lg print:shadow-none print:border-slate-300 print:bg-white`}>
            <span className="text-[10px] font-black uppercase text-slate-500 mb-1 block print:text-slate-400">{item.label}</span>
            <span className={`text-xl font-black ${item.color} block print:text-black`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* 2. Executive Summary Report */}
      <div className={`${isLightMode ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-800/50 border-slate-700 shadow-2xl'} border rounded-[2rem] p-8 sm:p-10 transition-all print:shadow-none print:border-slate-800 print:rounded-none print:bg-white`}>
        <header className="flex justify-between items-center mb-8 flex-wrap gap-4 border-b border-sky-500/20 pb-6 print:border-slate-900 print:pb-4">
          <div>
            <h2 className={`text-3xl font-black ${isLightMode ? 'text-slate-900' : 'text-slate-100'} print:text-black print:text-2xl`}>Executive Market Intelligence Report</h2>
            <p className="text-sm text-slate-500 mt-1">일괄 분석 통합 전략 인사이트</p>
          </div>
          <div className="flex gap-2 print:hidden">
            {!summary && !isGeneratingSummary && (
              <button onClick={handleGenerateSummary} className="px-6 py-2.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-500 shadow-lg">전략 요약 생성</button>
            )}
            {summary && (
              <button onClick={handlePrintReport} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 shadow-lg flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                 PDF 리포트 저장
              </button>
            )}
          </div>
        </header>

        {isGeneratingSummary && <Loader message="통합 시장 보고서를 생성하고 있습니다..." />}

        {summary ? (
          <div className="space-y-12 animate-fade-in print:space-y-6">
            <section className="print:page-break-inside-avoid">
              <h3 className="text-xl font-black text-sky-500 uppercase mb-4 flex items-center gap-3 print:text-black print:text-lg">
                <span className="w-2 h-8 bg-sky-500 rounded-full print:bg-black"></span>
                01. Market Landscape Summary
              </h3>
              <p className={`text-base leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-300'} print:text-black print:text-sm`}>
                {summary.landscape}
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
               <section className="print:page-break-inside-avoid">
                <h3 className="text-lg font-black text-teal-500 uppercase mb-3 flex items-center gap-2 print:text-black">
                  <span className="w-1.5 h-6 bg-teal-500 rounded-full print:bg-black"></span>
                  02. Target Insights
                </h3>
                <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-300'} print:text-black print:text-xs`}>{summary.targetInsight}</p>
              </section>
              <section className="print:page-break-inside-avoid">
                <h3 className="text-lg font-black text-indigo-500 uppercase mb-3 flex items-center gap-2 print:text-black">
                  <span className="w-1.5 h-6 bg-indigo-500 rounded-full print:bg-black"></span>
                  03. Integrated AEO Strategy
                </h3>
                <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-300'} print:text-black print:text-xs`}>{summary.aeoStrategy}</p>
              </section>
            </div>

            <section className="print:page-break-before-always">
              <h3 className="text-xl font-black text-purple-500 uppercase mb-6 flex items-center gap-3 print:text-black print:text-lg">
                <span className="w-2 h-8 bg-purple-500 rounded-full print:bg-black"></span>
                04. Strategic Roadmap
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                {summary.cdjRecommendations.map((rec, i) => (
                  <div key={i} className={`p-6 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700'} print:bg-white print:border-slate-300 print:p-4`}>
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-1 print:text-slate-500">{rec.stage}</span>
                    <h4 className={`text-base font-bold ${isLightMode ? 'text-slate-900' : 'text-white'} mb-3 print:text-black print:text-sm`}>{rec.action}</h4>
                    <div className="flex flex-wrap gap-2">
                       {rec.nextKeywords.map((kw, idx) => (
                         <span key={idx} className="px-2 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-md border border-purple-500/20 print:bg-slate-50 print:text-black print:border-slate-200">#{kw}</span>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="py-20 text-center print:hidden">
             <p className="text-slate-500 mb-4 font-bold">일괄 분석 결과에 대한 전략 요약을 생성하시려면 상단의 버튼을 클릭하세요.</p>
             <div className="w-20 h-1 bg-sky-500 mx-auto rounded-full opacity-30"></div>
          </div>
        )}
      </div>

      {/* 3. Raw Data Summary Table */}
      <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700'} border rounded-[2rem] p-8 print:rounded-none print:shadow-none print:border-slate-800 print:p-5 print:page-break-before-always print:bg-white`}>
        <h2 className={`text-xl font-black ${isLightMode ? 'text-slate-900' : 'text-white'} mb-6 print:text-black`}>Appendix: 분석 데이터 리스트</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-700/30 print:border-slate-900">
          <table className="w-full text-xs text-left">
            <thead className={`${isLightMode ? 'bg-slate-100 text-slate-600' : 'bg-slate-900/80 text-slate-300'} font-black uppercase print:bg-slate-100 print:text-black`}>
              <tr>
                <th className="px-4 py-4">키워드 (Query)</th>
                <th className="px-4 py-4">여정 단계</th>
                <th className="px-4 py-4">주요 결핍 (Pain Points)</th>
                <th className="px-4 py-4">결과</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLightMode ? 'divide-slate-100' : 'divide-slate-700/50'} print:divide-slate-300`}>
              {results.map((result, index) => (
                <tr key={index} className={`${isLightMode ? 'bg-white hover:bg-slate-50' : 'bg-slate-800/20 hover:bg-slate-700/30'} transition-colors print:bg-white`}>
                  <td className="px-4 py-4 font-bold text-sky-500 print:text-black">{result.query}</td>
                  <td className="px-4 py-4">{result.keywordIntelligence?.cdjStage || '-'}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {result.analysisResult.slice(0, 1).map((r, i) => (
                        <div key={i} className="text-[10px] text-slate-500 truncate max-w-[350px] print:text-black">• {r.painPoint}</div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-black ${result.error ? 'text-rose-500' : 'text-emerald-500'} print:text-black`}>{result.error ? 'FAIL' : 'OK'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BatchResultsDisplay;
