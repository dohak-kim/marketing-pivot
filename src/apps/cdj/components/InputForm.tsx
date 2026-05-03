import React, { useState } from 'react';
import { useSearchConfig } from '@/apps/aegis/core/search/SearchConfigContext';
import { ANALYSIS_PERIOD_OPTIONS } from '@/apps/aegis/core/search/analysisPeriod.types';
import type { SearchSource } from '@/apps/aegis/core/search/config';

interface InputFormProps {
  onAnalyze: (params: { topic: string }) => void;
  isLoading: boolean;
}

const SOURCE_CONFIG: { value: SearchSource; label: string; icon: string }[] = [
  { value: 'naver', label: 'Naver',  icon: '🇰🇷' },
  { value: 'google', label: 'Google', icon: '🌐' },
];

export const InputForm: React.FC<InputFormProps> = ({ onAnalyze, isLoading }) => {
  const [topic, setTopic] = useState('');
  const { config, setConfig } = useSearchConfig();

  const toggleSource = (src: SearchSource) => {
    setConfig(prev => {
      const has = prev.sources.includes(src);
      if (has && prev.sources.length === 1) return prev; // 최소 1개 유지
      return {
        ...prev,
        sources: has ? prev.sources.filter(s => s !== src) : [...prev.sources, src],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onAnalyze({ topic: topic.trim() });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 주제 입력 */}
        <div>
          <label htmlFor="topic-input" className="sr-only">콘텐츠 주제</label>
          <input
            id="topic-input"
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="분석할 콘텐츠 주제를 입력하세요... (예: 1인 가구 인테리어)"
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow placeholder-slate-400"
            disabled={isLoading}
          />
        </div>

        {/* 소스 + 기간 */}
        <div className="flex flex-wrap items-center gap-6">
          {/* 소스 토글 */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">분석 소스</p>
            <div className="flex gap-2">
              {SOURCE_CONFIG.map(({ value, label, icon }) => {
                const active = config.sources.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleSource(value)}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      active
                        ? 'bg-amber-500 border-amber-400 text-slate-900'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-amber-500 hover:text-white'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 기간 */}
          <div className="flex-1 min-w-[260px]">
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">분석 기간</p>
            <div className="flex gap-1.5 flex-wrap">
              {ANALYSIS_PERIOD_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, period: value, dateRange: null }))}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    config.period === value && !config.dateRange
                      ? 'bg-amber-500 border-amber-400 text-slate-900'
                      : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-amber-500 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 제출 */}
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full px-6 py-3 bg-amber-500 text-slate-900 font-black rounded-lg hover:bg-amber-400 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>분석 중...</span>
            </>
          ) : (
            <span>분석 시작</span>
          )}
        </button>
      </form>
    </div>
  );
};
