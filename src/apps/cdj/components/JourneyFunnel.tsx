
import React from 'react';
import type { KeywordData } from '../types';
import { CDJStage } from '../types';
import { CDJ_STAGES_DETAILS } from '../constants';

interface JourneyFunnelProps {
  keywords: KeywordData[];
  isPrintMode?: boolean;
}

export const JourneyFunnel: React.FC<JourneyFunnelProps> = ({ keywords, isPrintMode = false }) => {
  const stageCounts = {
    [CDJStage.Awareness]: keywords.filter(k => k.cdjStage === CDJStage.Awareness).length,
    [CDJStage.Consideration]: keywords.filter(k => k.cdjStage === CDJStage.Consideration).length,
    [CDJStage.Decision]: keywords.filter(k => k.cdjStage === CDJStage.Decision).length,
    [CDJStage.Loyalty]: keywords.filter(k => k.cdjStage === CDJStage.Loyalty).length,
  };

  const funnelStages = [
    { stage: CDJStage.Awareness, widthClass: 'w-full' },
    { stage: CDJStage.Consideration, widthClass: 'w-11/12' },
    { stage: CDJStage.Decision, widthClass: 'w-10/12' },
    { stage: CDJStage.Loyalty, widthClass: 'w-9/12' },
  ];

  const containerClass = isPrintMode ? 'bg-white border border-gray-200 shadow-sm' : 'bg-brand-light shadow-inner';
  const countColor = isPrintMode ? 'text-gray-900' : 'text-white';
  const subTextColor = isPrintMode ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className={`flex flex-col h-full p-4 rounded-lg ${containerClass}`}>
      <div className="flex-grow w-full mx-auto flex flex-col items-center justify-center space-y-3">
        {funnelStages.map(({ stage, widthClass }) => {
          const details = CDJ_STAGES_DETAILS[stage];
          const count = stageCounts[stage];
          
          // Determine colors based on print mode
          const iconColor = isPrintMode ? details.printColor : details.color;
          const textColor = isPrintMode ? details.printColor : details.color;
          const borderColor = isPrintMode ? details.printBorderColor : details.borderColor;
          const bgColor = isPrintMode ? details.printBgColor : details.bgColor;

          return (
            <div
              key={stage}
              className={`${widthClass} h-20 rounded-md transition-all duration-300 flex items-center justify-between px-4 sm:px-6 shadow-sm border-l-4 ${borderColor} ${bgColor}`}
            >
              <div className="flex items-center space-x-3">
                <details.Icon className={`w-6 h-6 transition-colors ${iconColor}`} />
                <span className={`font-semibold transition-colors ${textColor}`}>{details.name}</span>
              </div>
              <span className={`text-2xl font-bold tabular-nums ${countColor}`}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
      <p className={`text-sm mt-4 text-center ${subTextColor}`}>* 각 단계는 해당 키워드 수를 나타내며, 퍼널은 고객 여정의 흐름을 시각화합니다.</p>
    </div>
  );
};
