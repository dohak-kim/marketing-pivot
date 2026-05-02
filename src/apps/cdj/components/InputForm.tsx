
import React, { useState } from 'react';

interface InputFormProps {
  onAnalyze: (params: { 
    topic: string, 
    sourceType: string, 
    dateRange: { from: string, to: string } 
  }) => void;
  isLoading: boolean;
}

const getFormattedDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
}

const individualSources = ['블로그/커뮤니티', '뉴스'];

const datePresets = [
  { label: '7일', days: 7 },
  { label: '1개월', days: 30 },
  { label: '3개월', days: 90 },
  { label: '6개월', days: 182 },
  { label: '1년', days: 365 },
  { label: '2년', days: 730 },
  { label: '3년', days: 1095 },
];

export const InputForm: React.FC<InputFormProps> = ({ onAnalyze, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());

  const today = new Date();
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(today.getFullYear() - 3);
  
  const getDefaultDateRange = () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    return {
      from: getFormattedDate(oneYearAgo),
      to: getFormattedDate(today),
    }
  }

  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const presetIndex = parseInt(e.target.value, 10);
    const preset = datePresets[presetIndex];
    
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - preset.days);

    setDateRange({
      from: getFormattedDate(fromDate),
      to: getFormattedDate(today),
    });
  };

  const handleIndividualSourceToggle = (source: string) => {
    setSelectedSources(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(source)) {
        newSelected.delete(source);
      } else {
        newSelected.add(source);
      }
      return newSelected;
    });
  };

  const handleIntegratedSearchToggle = () => {
    if (selectedSources.size === individualSources.length) {
      setSelectedSources(new Set());
    } else {
      setSelectedSources(new Set(individualSources));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading && selectedSources.size > 0) {
      const selectedArray = Array.from(selectedSources);
      let sourceTypeForApi: string;
      
      if (selectedArray.length === individualSources.length) {
        sourceTypeForApi = '통합 검색';
      } else {
        // Cast to string to resolve TypeScript error 'Type unknown is not assignable to type string'
        sourceTypeForApi = selectedArray[0] as string;
      }
      onAnalyze({ topic: topic.trim(), sourceType: sourceTypeForApi, dateRange });
    }
  };
  
  const getDefaultSliderValue = () => {
    const diffTime = Math.abs(new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Extracting an initial value helps avoid "excess property" errors on object literals passed to `reduce`.
    const initialValue = { ...datePresets[0], index: 0 };
    // FIX: Provide an explicit generic type to `reduce` because TypeScript
    // was incorrectly inferring the accumulator's type without the `index` property,
    // causing an error when trying to access `closest.index`.
    const closest = datePresets.reduce<{ label: string; days: number; index: number; }>((prev, curr, index) => {
        const prevDiff = Math.abs(prev.days - diffDays);
        const currDiff = Math.abs(curr.days - diffDays);
        const newPrev = { ...curr, index };
        return currDiff < prevDiff ? newPrev : prev;
    }, initialValue);

    return closest.index;
  };
  
  const isAllSelected = selectedSources.size === individualSources.length;

  return (
    <div className="max-w-3xl mx-auto bg-brand-light p-6 rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
            <label htmlFor="topic-input" className="sr-only">콘텐츠 주제</label>
            <input
            id="topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="분석할 콘텐츠 주제를 입력하세요... (예: 1인 가구 인테리어)"
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-gold transition-shadow"
            disabled={isLoading}
            />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">소스 유형</label>
          <div className="flex flex-wrap gap-3">
            <div key="통합 검색">
              <input
                type="checkbox"
                id="source-all"
                checked={isAllSelected}
                onChange={handleIntegratedSearchToggle}
                className="sr-only peer"
                disabled={isLoading}
              />
              <label
                htmlFor="source-all"
                className="px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 peer-checked:bg-brand-gold peer-checked:text-brand-dark peer-checked:border-brand-gold"
              >
                통합 검색
              </label>
            </div>
            {individualSources.map((option) => (
              <div key={option}>
                <input
                  type="checkbox"
                  id={`source-${option}`}
                  value={option}
                  checked={selectedSources.has(option)}
                  onChange={() => handleIndividualSourceToggle(option)}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <label
                  htmlFor={`source-${option}`}
                  className="px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 peer-checked:bg-brand-gold peer-checked:text-brand-dark peer-checked:border-brand-gold"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">분석 기간</label>
            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <label htmlFor="from-date" className="block text-xs font-medium text-gray-400 mb-1">From</label>
                    <input
                        id="from-date"
                        type="date"
                        name="from"
                        value={dateRange.from}
                        min={getFormattedDate(threeYearsAgo)}
                        max={dateRange.to}
                        onChange={handleDateChange}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label htmlFor="to-date" className="block text-xs font-medium text-gray-400 mb-1">To</label>
                    <input
                        id="to-date"
                        type="date"
                        name="to"
                        value={dateRange.to}
                        min={dateRange.from}
                        max={getFormattedDate(today)}
                        onChange={handleDateChange}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                        disabled={isLoading}
                    />
                </div>
            </div>
            <div className="mt-4">
                <input
                    type="range"
                    min="0"
                    max={datePresets.length - 1}
                    value={getDefaultSliderValue()}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                    disabled={isLoading}
                    aria-label="기간 설정 슬라이더"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                    {datePresets.map(p => <span key={p.label}>{p.label}</span>)}
                </div>
            </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !topic.trim() || selectedSources.size === 0}
          className="w-full px-6 py-3 bg-brand-gold text-brand-dark font-bold rounded-md hover:bg-amber-400 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-brand-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="whitespace-nowrap">분석 중...</span>
            </>
          ) : (
            <span className="whitespace-nowrap">분석 시작</span>
          )}
        </button>
      </form>
    </div>
  );
};
