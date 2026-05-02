
import React, { useState, useMemo } from 'react';
import type { KeywordData, KeywordInsight } from '../types';
import { CDJStage, SearchIntent } from '../types';
import { CDJ_STAGES_DETAILS } from '../constants';

interface KeywordTableProps {
  keywords: KeywordData[];
  keywordInsights: KeywordInsight[];
  isPrintMode?: boolean;
}

const ALL_STAGES = 'All';
type FilterType = CDJStage | typeof ALL_STAGES;

type SortKey = 'keyword' | 'searchVolumeIndex' | 'cdjStage' | 'searchIntent';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

// Custom sort orders
const STAGE_ORDER: Record<CDJStage, number> = {
  [CDJStage.Awareness]: 0,
  [CDJStage.Consideration]: 1,
  [CDJStage.Decision]: 2,
  [CDJStage.Loyalty]: 3,
};

const INTENT_ORDER: Record<SearchIntent, number> = {
  [SearchIntent.Informational]: 0,
  [SearchIntent.Navigational]: 1,
  [SearchIntent.Commercial]: 2,
  [SearchIntent.Transactional]: 3,
};

export const KeywordTable: React.FC<KeywordTableProps> = ({ keywords, keywordInsights, isPrintMode = false }) => {
  const [filter, setFilter] = useState<FilterType>(ALL_STAGES);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const filterOptions: { value: FilterType, label: string }[] = [
    { value: ALL_STAGES, label: '전체 보기' },
    ...Object.values(CDJStage).map(stage => ({ value: stage, label: stage })),
  ];

  const selectedInsight = useMemo(() => {
    if (filter === ALL_STAGES) return null;
    return keywordInsights.find(i => i.stage === filter)?.insight;
  }, [filter, keywordInsights]);

  // Handle Filtering and Sorting
  const processedKeywords = useMemo(() => {
    // 1. Filter
    let data = [...keywords];
    if (filter !== ALL_STAGES) {
      data = data.filter(k => k.cdjStage === filter);
    }

    // 2. Sort
    if (sortConfig) {
      data.sort((a, b) => {
        let comparison = 0;

        switch (sortConfig.key) {
          case 'keyword':
            // Korean/English alphanumeric sort
            comparison = a.keyword.localeCompare(b.keyword, 'ko-KR', { numeric: true });
            break;
          case 'searchVolumeIndex':
            // Numeric sort
            comparison = a.searchVolumeIndex - b.searchVolumeIndex;
            break;
          case 'cdjStage':
            // Custom mapped sort
            comparison = STAGE_ORDER[a.cdjStage] - STAGE_ORDER[b.cdjStage];
            break;
          case 'searchIntent':
            // Custom mapped sort
            comparison = INTENT_ORDER[a.searchIntent] - INTENT_ORDER[b.searchIntent];
            break;
          default:
            comparison = 0;
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  }, [keywords, filter, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current && current.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleReset = () => {
    setSortConfig(null);
  };

  const renderSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <span className="text-gray-500 opacity-30 ml-1">↕</span>;
    }
    return <span className="text-brand-gold ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const containerClass = isPrintMode ? 'bg-white border border-gray-200 shadow-sm' : 'bg-brand-light shadow-inner';
  const cardBg = isPrintMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-700';
  const textColor = isPrintMode ? 'text-gray-900' : 'text-gray-300';
  const thBorder = isPrintMode ? 'border-gray-300' : 'border-gray-600';
  const tdBorder = isPrintMode ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-700 hover:bg-gray-800/50';

  return (
    <div className={`p-4 sm:p-6 rounded-lg ${containerClass}`}>
      <div className="mb-6">
        {filter === ALL_STAGES ? (
          <div className={`space-y-4 p-4 rounded-lg border ${cardBg}`}>
            <h4 className="text-xl font-bold text-brand-gold">단계별 키워드 그룹 분석 요약</h4>
            {Object.values(CDJStage).map(stage => {
              const insight = keywordInsights.find(i => i.stage === stage);
              if (!insight) return null;
              const details = CDJ_STAGES_DETAILS[stage];
              const stageColor = isPrintMode ? details.printColor : details.color;
              
              return (
                <div key={stage} className="flex items-start gap-3">
                  <details.Icon className={`w-5 h-5 mt-1.5 flex-shrink-0 ${stageColor}`} />
                  <div className={`text-lg ${textColor}`}>
                    <strong className={`font-semibold ${stageColor}`}>{stage}:</strong>
                    <span className="ml-2">{insight.insight}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : selectedInsight ? (
          <div className={`p-4 rounded-lg border ${cardBg}`}>
            <h4 className="text-xl font-bold text-brand-gold mb-2">{filter} 단계 키워드 분석</h4>
            <p className={`text-lg ${textColor}`}>{selectedInsight}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-2">
            {filterOptions.map(option => (
            <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                filter === option.value
                    ? 'bg-brand-gold text-brand-dark'
                    : isPrintMode 
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
                {option.label}
            </button>
            ))}
        </div>
        
        {/* Reset Button - Placed to align with the intent column area */}
        <button
            onClick={handleReset}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors border flex items-center gap-1 ${
                isPrintMode
                 ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                 : 'bg-transparent text-gray-400 border-gray-600 hover:text-white hover:border-gray-500'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            원래대로
        </button>
      </div>

      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-left">
          <thead className={`border-b ${thBorder}`}>
            <tr className={isPrintMode ? 'text-gray-700' : 'text-gray-300'}>
              <th className="p-3 cursor-pointer hover:bg-black/10 transition-colors rounded" onClick={() => handleSort('keyword')}>
                <div className="flex items-center">
                    키워드 {renderSortIcon('keyword')}
                </div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-black/10 transition-colors rounded" onClick={() => handleSort('searchVolumeIndex')}>
                 <div className="flex items-center">
                    검색량 잠재력 {renderSortIcon('searchVolumeIndex')}
                 </div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-black/10 transition-colors rounded" onClick={() => handleSort('cdjStage')}>
                <div className="flex items-center">
                    고객 여정 단계 (CDJ) {renderSortIcon('cdjStage')}
                </div>
              </th>
              <th className="p-3 cursor-pointer hover:bg-black/10 transition-colors rounded" onClick={() => handleSort('searchIntent')}>
                <div className="flex items-center">
                    검색 의도 {renderSortIcon('searchIntent')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {processedKeywords.map((item, index) => {
               const details = CDJ_STAGES_DETAILS[item.cdjStage];
               
               // Apply specific badge styling based on print mode
               const badgeClass = isPrintMode 
                 ? `${details.printBgColor} ${details.printColor} border ${details.printBorderColor}`
                 : `${details.bgColor} ${details.color}`;

               return (
                <tr key={index} className={`border-b ${tdBorder}`}>
                  <td className={`p-3 font-medium ${isPrintMode ? 'text-gray-900' : 'text-white'}`}>{item.keyword}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-20 rounded-full h-2.5 ${isPrintMode ? 'bg-gray-300' : 'bg-gray-700'}`}>
                        <div className="bg-brand-gold h-2.5 rounded-full" style={{ width: `${item.searchVolumeIndex}%` }}></div>
                      </div>
                      <span className={`font-mono text-sm w-8 text-right ${isPrintMode ? 'text-gray-600' : 'text-gray-300'}`}>{item.searchVolumeIndex}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${badgeClass}`}>
                        <details.Icon className="w-4 h-4" />
                        {item.cdjStage}
                    </span>
                  </td>
                  <td className={`p-3 ${isPrintMode ? 'text-gray-600' : 'text-gray-300'}`}>{item.searchIntent}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
       {processedKeywords.length === 0 && (
          <div className={`text-center py-8 ${isPrintMode ? 'text-gray-500' : 'text-gray-400'}`}>
            해당 단계에 해당하는 키워드가 없습니다.
          </div>
       )}
    </div>
  );
};
