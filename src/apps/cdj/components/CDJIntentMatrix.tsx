
import React from 'react';
import type { KeywordData } from '../types';
import { CDJStage, SearchIntent } from '../types';
import { CDJ_STAGES_DETAILS } from '../constants';

interface CDJIntentMatrixProps {
  keywords: KeywordData[];
  matrixImplication: string; // Changed from strategicInsights to matrixImplication
  isPrintMode?: boolean;
}

export const CDJIntentMatrix: React.FC<CDJIntentMatrixProps> = ({ keywords, matrixImplication, isPrintMode = false }) => {
  const stages = Object.values(CDJStage);
  const intents = Object.values(SearchIntent);

  // Initialize Data Structures
  const matrixData = stages.reduce((acc, stage) => {
    acc[stage] = intents.reduce((intentAcc, intent) => {
      intentAcc[intent] = 0;
      return intentAcc;
    }, {} as Record<SearchIntent, number>);
    return acc;
  }, {} as Record<CDJStage, Record<SearchIntent, number>>);

  // Fill Matrix
  keywords.forEach(keyword => {
    if (matrixData[keyword.cdjStage] && matrixData[keyword.cdjStage][keyword.searchIntent] !== undefined) {
      matrixData[keyword.cdjStage][keyword.searchIntent]++;
    }
  });

  // Calculate Statistics for "Fact Reading"
  let maxCount = 0;
  let dominantStage: CDJStage = stages[0];
  let dominantIntent: SearchIntent = intents[0];
  let maxCell = { stage: stages[0], intent: intents[0], count: -1 };

  const stageTotals: Record<string, number> = {};
  const intentTotals: Record<string, number> = {};

  stages.forEach(stage => {
      let sTotal = 0;
      intents.forEach(intent => {
          const count = matrixData[stage][intent];
          sTotal += count;
          
          if (!intentTotals[intent]) intentTotals[intent] = 0;
          intentTotals[intent] += count;

          if (count > maxCount) maxCount = count;
          if (count > maxCell.count) maxCell = { stage, intent, count };
      });
      stageTotals[stage] = sTotal;
  });

  const totalKeywords = keywords.length;
  const dominantStageEntry = Object.entries(stageTotals).reduce((a, b) => a[1] > b[1] ? a : b);
  const dominantIntentEntry = Object.entries(intentTotals).reduce((a, b) => a[1] > b[1] ? a : b);
  
  dominantStage = dominantStageEntry[0] as CDJStage;
  dominantIntent = dominantIntentEntry[0] as SearchIntent;
  const dominantStagePercent = Math.round((dominantStageEntry[1] / totalKeywords) * 100);

  const getCellColor = (count: number) => {
    if (count === 0) return isPrintMode ? 'rgba(243, 244, 246, 0.5)' : 'rgba(30, 41, 59, 0.5)';
    const opacity = 0.15 + (count / maxCount) * 0.85;
    return `rgba(251, 191, 36, ${opacity})`; 
  };

  const containerClass = isPrintMode ? 'bg-white border border-gray-200 shadow-sm' : 'bg-brand-light shadow-inner';
  const borderColor = isPrintMode ? 'border-gray-300' : 'border-gray-700';
  const cellTextColor = isPrintMode ? 'text-gray-800' : 'text-white';
  const headerBg = isPrintMode ? 'bg-gray-50' : 'bg-brand-light';
  const subText = isPrintMode ? 'text-gray-500' : 'text-gray-400';
  const labelText = isPrintMode ? 'text-gray-900' : 'text-gray-200';
  const accentText = isPrintMode ? 'text-brand-gold font-bold' : 'text-brand-gold font-bold';

  return (
    <div className={`p-6 rounded-lg ${containerClass}`}>
      {/* 5:5 비율 적용 (lg:grid-cols-2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: The Matrix (Square Layout) */}
        <div className="flex flex-col justify-center">
             <div className="w-full aspect-square md:aspect-auto max-w-lg mx-auto">
                <table className="w-full h-full table-fixed text-center border-collapse">
                <thead>
                    <tr>
                    <th className={`p-2 border-b border-r border-transparent ${headerBg}`}></th>
                    {intents.map(intent => (
                        <th key={intent} className={`p-2 text-xs md:text-sm font-semibold border-b ${borderColor} ${subText}`}>
                        {intent}
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {stages.map(stage => {
                    const details = CDJ_STAGES_DETAILS[stage];
                    const stageColor = isPrintMode ? details.printColor : details.color;

                    return (
                        <tr key={stage}>
                        <td className={`p-2 text-xs md:text-sm font-bold text-center border-r ${borderColor} ${headerBg} ${stageColor} align-middle`}>
                             <div className="flex flex-col items-center justify-center h-full">
                                {stage}
                             </div>
                        </td>
                        {intents.map(intent => {
                            const count = matrixData[stage][intent];
                            return (
                            <td
                                key={intent}
                                className={`p-1 border ${borderColor} ${cellTextColor} align-middle`}
                            >
                                <div 
                                    className="w-full h-full aspect-square flex items-center justify-center rounded transition-colors text-lg md:text-xl font-bold"
                                    style={{ backgroundColor: getCellColor(count) }}
                                >
                                    {count > 0 ? count : ''}
                                </div>
                            </td>
                            );
                        })}
                        </tr>
                    );
                    })}
                </tbody>
                </table>
             </div>
             <p className={`text-xs mt-3 text-center ${subText}`}>* 셀 내 숫자는 키워드 개수이며, 색상 농도는 집중도를 의미합니다.</p>
        </div>

        {/* Right: Fact Reading & Implications - Font Size Increased */}
        <div className={`flex flex-col justify-center gap-6 p-5 rounded-lg border ${isPrintMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/30 border-gray-700'}`}>
            
            {/* 1. Fact Reading */}
            <div>
                {/* Header: text-base -> text-xl (약 25% 증가) */}
                <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${labelText}`}>
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Fact Reading (현황)
                </h3>
                {/* Content: text-sm -> text-base (약 15-20% 증가) */}
                <ul className={`space-y-4 text-base ${isPrintMode ? 'text-gray-700' : 'text-gray-300'}`}>
                    <li className="flex justify-between items-center border-b border-gray-600/20 pb-2">
                        <span>가장 활발한 여정 단계</span>
                        <span className={`${CDJ_STAGES_DETAILS[dominantStage].color} font-bold`}>{dominantStage} ({dominantStagePercent}%)</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-gray-600/20 pb-2">
                        <span>주요 검색 의도</span>
                        <span className="text-brand-gold font-bold">{dominantIntent}</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-gray-600/20 pb-2">
                        <span>최대 집중 구간 (Hotspot)</span>
                        <span className="font-bold text-white bg-brand-gold/20 px-3 py-1 rounded text-brand-gold">
                            {maxCell.stage} &times; {maxCell.intent}
                        </span>
                    </li>
                </ul>
            </div>

            {/* 2. Key Implication */}
            <div>
                 {/* Header: text-base -> text-xl */}
                 <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${labelText}`}>
                    <svg className="w-6 h-6 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Key Implication (시사점)
                </h3>
                {/* Content: text-sm -> text-base */}
                <div className={`text-base leading-relaxed p-4 rounded bg-opacity-50 ${isPrintMode ? 'bg-white text-gray-700 border border-gray-200' : 'bg-black/20 text-gray-300 border border-gray-700'}`}>
                    {/* Render the specific matrix implication without split logic */}
                    {matrixImplication.replace(/\\n/g, '\n')}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
