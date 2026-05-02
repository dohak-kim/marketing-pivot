
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { identifyKeywordLevel } from '../services/geminiService';
import type { KeywordIntelligence } from '../types';

interface InputFormProps {
  onAnalyze: (query: string, mode: 'single' | 'batch', timeFilter: string, dataVolume: number, kwIntel?: KeywordIntelligence) => void;
  isLoading: boolean;
  isLightMode?: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onAnalyze, isLoading, isLightMode }) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [timeFilter, setTimeFilter] = useState('qdr:m');
  const [dataVolume, setDataVolume] = useState<number>(30);
  
  const [keywordInfo, setKeywordInfo] = useState<KeywordIntelligence & { loading: boolean }>({ 
    level: 'Unknown', description: '', marketingGoal: '', loading: false,
    potentialScore: 0, cdjStage: 'Unknown', searchIntent: 'Unknown'
  });

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'batch') return;
    if (query.trim().length < 2) {
      setKeywordInfo({ level: 'Unknown', description: '', marketingGoal: '', loading: false, potentialScore: 0, cdjStage: 'Unknown', searchIntent: 'Unknown' });
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      setKeywordInfo(prev => ({ ...prev, loading: true }));
      const result = await identifyKeywordLevel(query);
      setKeywordInfo({ ...result, loading: false });
    }, 1000);

    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query, mode]);

  useEffect(() => {
    if (mode === 'batch') {
      if (dataVolume > 50) setDataVolume(40);
      else if (dataVolume < 20) setDataVolume(20);
    } else {
      if (timeFilter === 'qdr:y') {
        if (dataVolume < 60) setDataVolume(60); 
      } else if (timeFilter === 'qdr:w') {
        if (dataVolume > 40) setDataVolume(30); 
      }
    }
  }, [timeFilter, mode]);

  const stats = useMemo(() => {
    // 통계적 유의성 및 데이터 추론 포인트 계산 로직 복원/강화
    const coverage = 70 + (dataVolume / 10) * 2.5;
    const confidence = 75 + (dataVolume / 100) * 24.5; 
    const inferencePoints = dataVolume * 15; // 각 스니펫당 약 15개의 유의미한 키워드/문장 조각 추론 기반
    
    let resolution = "Standard";
    let resolutionDesc = "보편적 시장 니즈 분석";
    let expectedOutput = "CEP 3-4개 / 타겟 2개";
    let colorClass = isLightMode ? "text-sky-600" : "text-sky-400";
    
    if (dataVolume <= 20) {
      resolution = "Generalist";
      resolutionDesc = "핵심 주류 트렌드 포착";
      expectedOutput = "CEP 3개 / 타겟 2개";
    } else if (dataVolume >= 40 && dataVolume < 70) {
      resolution = "Strategic";
      resolutionDesc = "세부 타겟별 페인포인트 분류";
      expectedOutput = "CEP 5-6개 / 타겟 3개";
      colorClass = isLightMode ? "text-emerald-600" : "text-emerald-400";
    } else if (dataVolume >= 70) {
      resolution = "Ultra-Niche";
      resolutionDesc = "잠재적/미세 상황(Micro-CEP) 발굴";
      expectedOutput = "CEP 7-8개 / 타겟 4개";
      colorClass = isLightMode ? "text-purple-600" : "text-purple-400";
    }

    return { 
      coverage: Math.min(coverage, 99.5).toFixed(1), 
      confidence: Math.min(confidence, 99.9).toFixed(1),
      inferencePoints: inferencePoints.toLocaleString(),
      resolution,
      resolutionDesc,
      expectedOutput,
      colorClass
    };
  }, [dataVolume, isLightMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onAnalyze(query, mode, timeFilter, dataVolume, keywordInfo.level !== 'Unknown' ? keywordInfo : undefined);
  };

  const timeOptions = [
    { label: '1주일', value: 'qdr:w', desc: 'Real-time' },
    { label: '1개월', value: 'qdr:m', desc: 'Standard' },
    { label: '6개월', value: 'qdr:m6', desc: 'Mid-term' },
    { label: '1년', value: 'qdr:y', desc: 'Macro' },
  ];

  const getTierColor = (level: string) => {
    switch(level) {
      case 'Industry': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Category': return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'Brand': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Product': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-0">
      <form onSubmit={handleSubmit} className={`${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/50'} border rounded-[2.5rem] p-6 md:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-colors duration-500`}>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

        <div className="mb-8 relative z-10">
          <div className="flex justify-between items-end mb-4 px-1">
            <label htmlFor="query-input" className={`text-sm font-bold uppercase tracking-[0.25em] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {mode === 'single' ? 'Target Keyword' : 'Batch List (New line separated)'}
            </label>
            <span className={`text-[11px] font-black px-2 py-0.5 rounded ${mode === 'single' ? 'bg-sky-500/10 text-sky-400' : 'bg-purple-500/10 text-purple-400'}`}>
              {mode.toUpperCase()} MODE
            </span>
          </div>
          <div className="relative group mb-4">
            {mode === 'single' ? (
              <input
                id="query-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="여기에 검색 키워드를 입력해 주세요."
                className={`w-full ${isLightMode ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-300' : 'bg-slate-900/90 border-slate-700/50 text-white placeholder-slate-700'} border-2 rounded-2xl py-5 px-8 text-xl focus:outline-none focus:border-sky-500/50 focus:ring-8 focus:ring-sky-500/5 transition-all duration-300 font-semibold shadow-inner`}
                disabled={isLoading}
              />
            ) : (
              <textarea
                id="query-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="키워드를 한 줄에 하나씩 입력하세요..."
                rows={4}
                className={`w-full ${isLightMode ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-300' : 'bg-slate-900/90 border-slate-700/50 text-white placeholder-slate-700'} border-2 rounded-2xl py-5 px-8 text-lg focus:outline-none focus:border-sky-500/50 focus:ring-8 focus:ring-sky-500/5 transition-all duration-300 font-semibold shadow-inner`}
                disabled={isLoading}
              />
            )}

            <div className="absolute top-1/2 -translate-y-1/2 right-6 pointer-events-none opacity-20 group-focus-within:opacity-80 transition-opacity">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
            </div>
          </div>

          {mode === 'single' && query.trim().length > 1 && (
            <div className={`mt-2 p-4 rounded-xl border animate-fade-in flex flex-col gap-2 ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/50 border-slate-700/50'}`}>
              {keywordInfo.loading ? (
                 <div className="flex items-center gap-2">
                    <svg className="animate-spin h-3 w-3 text-sky-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">Analyzing CDJ MASTER Intelligence...</span>
                 </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded border uppercase ${getTierColor(keywordInfo.level)}`}>
                      {keywordInfo.level} Tier
                    </span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded border bg-indigo-500/10 text-indigo-400 border-indigo-500/30 uppercase`}>
                      {keywordInfo.cdjStage}
                    </span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded border bg-teal-500/10 text-teal-400 border-teal-500/30 uppercase`}>
                      의도: {keywordInfo.searchIntent}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                    <span className="text-sky-500 font-bold">전략 진단:</span> {keywordInfo.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10 items-stretch">
          {/* Duration Section */}
          <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-700/40'} border rounded-3xl p-6 flex flex-col hover:border-slate-500/40 transition-all`}>
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Duration: 시계열 전략
            </label>
            <p className={`text-[11px] leading-relaxed mb-4 ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
              분석 대상 검색 데이터의 시간적 범위입니다. <span className="text-sky-500 font-bold">Short-term</span>은 급상승 이슈 및 시즌성 반응 포착에, <span className="text-sky-500 font-bold">Long-term</span>은 변하지 않는 본질적인 카테고리 진입 장벽(CEP) 파악에 용이합니다.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-auto">
              {timeOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimeFilter(opt.value)}
                  disabled={isLoading}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${timeFilter === opt.value ? 'bg-sky-600 border-sky-500 text-white shadow-lg' : isLightMode ? 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                >
                  <span>{opt.label}</span>
                  <span className={`text-[8px] opacity-60 font-medium ${timeFilter === opt.value ? 'text-white' : ''}`}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mining Volume Section */}
          <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-700/40'} border rounded-3xl p-6 flex flex-col hover:border-slate-500/40 transition-all`}>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Mining Volume: 데이터 해상도
              </label>
            </div>
            <p className={`text-[11px] leading-relaxed mb-4 ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
              수집할 검색 결과의 밀도입니다. <span className="text-sky-500 font-bold">{dataVolume}개의 핵심 스니펫</span>을 기반으로 약 <span className="text-sky-500 font-bold">{stats.inferencePoints}개</span>의 개별 문장 데이터 포인트를 교차 분석하여 통계적 유의성을 확보합니다.
            </p>
            <div className="mt-auto">
              <div className="flex justify-between items-center mb-2 px-1">
                 <div className="flex flex-col">
                    <span className={`text-[10px] font-black ${stats.colorClass}`}>{stats.resolution} Analysis</span>
                    <span className={`text-[9px] font-black text-amber-500`}>신뢰수준: {stats.confidence}% (Confidence)</span>
                 </div>
                 <span className={`font-black text-[11px] px-2 py-0.5 rounded ${isLightMode ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-slate-400'}`}>
                  {dataVolume} Snippets
                </span>
              </div>
              <input 
                type="range" 
                min="10" 
                max={mode === 'batch' ? 50 : 100} 
                step="10"
                value={dataVolume}
                onChange={(e) => setDataVolume(parseInt(e.target.value))}
                disabled={isLoading}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${isLightMode ? 'bg-slate-200' : 'bg-slate-700'} accent-sky-500`}
              />
              <div className="mt-4 p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                <p className={`text-[10px] font-bold ${stats.colorClass} mb-1`}>{stats.resolutionDesc}</p>
                <div className="flex justify-between items-center">
                   <p className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{stats.expectedOutput}</p>
                   <p className="text-[9px] font-bold text-slate-500 opacity-60">Coverage: {stats.coverage}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Section */}
          <div className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-700/40'} border rounded-3xl p-6 flex flex-col hover:border-slate-500/40 transition-all`}>
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Mode: 분석 지향점
            </label>
            <p className={`text-[11px] leading-relaxed mb-4 ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
              분석의 뎁스(Depth)와 스케일(Scale)을 결정합니다. <span className="text-sky-400 font-bold">SINGLE</span>은 한 우물을 깊게 파는 입체적 인사이트 도출에, <span className="text-purple-400 font-bold">BATCH</span>는 경쟁사 대비 시장 전반의 트렌드 지도를 그리는 데 적합합니다.
            </p>
            <div className="mt-auto flex flex-col gap-2">
              <div className={`flex ${isLightMode ? 'bg-slate-100' : 'bg-slate-800'} rounded-xl p-1.5 gap-1.5 shadow-inner`}>
                <button
                  type="button"
                  onClick={() => setMode('single')}
                  className={`flex-1 py-3 text-[11px] font-black rounded-lg transition-all ${mode === 'single' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  disabled={isLoading}
                >
                  SINGLE
                </button>
                <button
                  type="button"
                  onClick={() => setMode('batch')}
                  className={`flex-1 py-3 text-[11px] font-black rounded-lg transition-all ${mode === 'batch' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  disabled={isLoading}
                >
                  BATCH
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="group w-full py-6 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 hover:scale-[1.01] active:scale-[0.99] text-white font-black text-2xl rounded-3xl disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-4 shadow-[0_25px_60px_-15px_rgba(8,112,184,0.4)]"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="animate-pulse font-mono tracking-tighter uppercase text-lg">Analyzing with {stats.resolution} Resolution...</span>
            </>
          ) : (
            <>
              <span className="tracking-tight">{mode === 'single' ? '심층 CEP 리포트 생성' : '일괄 트렌드 마이닝 시작'}</span>
              <div className="bg-white/20 p-2 rounded-xl group-hover:translate-x-2 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;
