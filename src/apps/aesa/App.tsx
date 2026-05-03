import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisResult, AnalysisStep, MarketingReport, AnalysisInputs } from './types';
import { GeminiService } from './services/geminiService';
import { AnalysisLayout } from './components/AnalysisLayout';
import { UserGuide } from './components/UserGuide';
import AppHeader from '@/shared/components/AppHeader';

const AesaApp: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory]       = useState('');
  const [ownBrand, setOwnBrand]       = useState('');
  const [competitor1, setCompetitor1] = useState('');
  const [competitor2, setCompetitor2] = useState('');
  const [competitor3, setCompetitor3] = useState('');
  const [competitor4, setCompetitor4] = useState('');
  const [keywords, setKeywords]       = useState('');
  const [context, setContext]         = useState('');
  const [step, setStep]               = useState<AnalysisStep>('idle');
  const [result, setResult]           = useState<AnalysisResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [showGuide, setShowGuide]     = useState(false);

  const handleStartAnalysis = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !ownBrand.trim()) return;
    setStep('searching' as any);
    setError(null);
    setResult(null);
    const inputs: AnalysisInputs = {
      category, ownBrand,
      competitors: [competitor1, competitor2, competitor3, competitor4].filter(c => c.trim()),
      keywords, context,
    };
    try {
      const gemini = new GeminiService();
      const analysis = await gemini.runFullAnalysis(inputs, (s: AnalysisStep) => setStep(s));
      setStep('generating-report');
      setResult(analysis);
      setStep('complete');
      if (analysis.stp.targeting.persona) {
        gemini.generatePersonaImage(analysis.stp.targeting.persona).then(url => {
          if (url) setResult(prev => prev ? { ...prev, stp: { ...prev.stp, targeting: { ...prev.stp.targeting, personaImageUrl: url } } } : null);
        });
      }
    } catch (err: any) {
      setError(err.message || '분석 중 오류가 발생했습니다.');
      setStep('error');
    }
  }, [category, ownBrand, competitor1, competitor2, competitor3, competitor4, keywords, context]);

  const handleGenerateReport = async (): Promise<MarketingReport> => {
    if (!result) throw new Error("분석 결과가 없습니다.");
    const gemini = new GeminiService();
    return await gemini.generateMarketingReport(
      { category, ownBrand, competitors: [competitor1, competitor2, competitor3, competitor4].filter(c => c.trim()), keywords, context },
      result
    );
  };

  const handleReset = () => {
    setStep('idle'); setResult(null); setError(null);
    setCategory(''); setOwnBrand('');
    setCompetitor1(''); setCompetitor2(''); setCompetitor3(''); setCompetitor4('');
    setKeywords(''); setContext('');
  };

  const handleGoToC3 = () => {
    sessionStorage.setItem('aesa_to_c3', JSON.stringify({
      category,
      brandName: ownBrand,
      competitors: [competitor1, competitor2, competitor3, competitor4].filter(c => c.trim()),
    }));
    navigate('/tools/c3');
  };

  const getStatusMessage = () => {
    const map: Record<string, string> = {
      'optimizing-query':  '🔍 Query Optimization: 네이버 최적 검색어 도출 중...',
      'fetching-news':     '📰 Naver News API: 최신 뉴스 수집 중...',
      'fetching-gdelt':    '📊 Naver DataLab: 검색트렌드 + 쇼핑인사이트 수집 중...',
      'parsing-articles':  '📄 Article Parser: 주요 기사 본문 추출 및 정제 중...',
      'building-facts':    '🧱 Fact Builder: 신뢰도 계층 구성 중...',
      'validating-facts':  '✅ Fact Validator: 필터링 + 수치 데이터 정렬 중...',
      'analyzing-market':  '📈 Gemini Analysis: 시장규모·PEST·3C·SWOT 분석 중...',
      'intent-analysis':   '🎯 STP Engine: CDJ·CEP 기반 세분화·타겟·포지셔닝 도출 중...',
      'generating-report': '✍️ Creative Strategy: 커뮤니케이션 전략 생성 중...',
      'generating-slides': '📑 Report Builder: 슬라이드 구조화 중...',
      'error':             '⚠️ 분석 중 오류가 발생했습니다.',
    };
    return map[step] || '분석 준비 완료';
  };

  const STEPS = ['optimizing-query','fetching-news','fetching-gdelt','parsing-articles','building-facts','validating-facts','analyzing-market','intent-analysis','generating-report','generating-slides','complete'];

  return (
    // AESA는 라이트 테마 유지 — "Classic" 아이덴티티
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <UserGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* 앱 헤더 */}
      <AppHeader
        icon="📡" name="AEGIS AESA Radar" accentPart="AESA Radar"
        subtitle="Intelligence Strategy Engine · PEST·3C·SWOT·STP"
        accentColor="text-blue-600" iconBg="bg-blue-600" theme="light"
        actions={<>
          {step === 'complete' && (
            <button
              onClick={handleGoToC3}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-colors"
            >
              <span>⚡</span>C³에서 전략 수립
            </button>
          )}
          {step !== 'idle' && step !== 'error' && (
            <button onClick={handleReset}>새로운 분석</button>
          )}
          <button onClick={() => setShowGuide(true)}>가이드</button>
        </>}
      />

      <main className="max-w-7xl mx-auto px-8 py-12">
        {(step === 'idle' || step === 'error') ? (
          <div className="max-w-5xl mx-auto no-print">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-black uppercase tracking-widest mb-4">
                Classic Strategy
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                Intelligence Strategy Engine 기반<br />마케팅 전략 수립
              </h2>
              <p className="text-lg text-gray-500 font-medium break-keep leading-relaxed">
                신뢰성 높은 News Collector와 Fact Builder를 통해<br className="hidden md:block" />
                환각(hallucination)을 최소화하고 신뢰할 수 있는 전략을 도출합니다.
              </p>
            </div>

            <form onSubmit={handleStartAnalysis} className="bg-white p-10 rounded-[3rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.08)] border border-gray-100 space-y-8">
              {error && <div className="bg-red-50 text-red-700 p-6 rounded-2xl font-bold border border-red-100">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">분석 산업 / 카테고리 *</label>
                  <input type="text" value={category} onChange={e => setCategory(e.target.value)}
                    placeholder="예: 전기차, 스페셜티 커피, 클라우드 컴퓨팅"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-base text-slate-800 transition-all" required />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">자사 브랜드 *</label>
                  <input type="text" value={ownBrand} onChange={e => setOwnBrand(e.target.value)}
                    placeholder="분석의 기준이 될 브랜드명"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-base text-slate-800 transition-all" required />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">주요 경쟁사 (최대 4개)</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[competitor1, competitor2, competitor3, competitor4].map((val, i) => (
                    <input key={i} type="text" value={val}
                      onChange={e => [setCompetitor1,setCompetitor2,setCompetitor3,setCompetitor4][i](e.target.value)}
                      placeholder={`경쟁사 ${i + 1}`}
                      className="px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-sm transition-all" />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">유관 키워드 (쉼표 구분)</label>
                  <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)}
                    placeholder="예: 자율주행, 구독 모델, 친환경 소재"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-base transition-all" />
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">AI가 산업 트렌드를 읽을 때 중점 참고할 키워드</p>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">추가 컨텍스트 (선택)</label>
                  <input type="text" value={context} onChange={e => setContext(e.target.value)}
                    placeholder="분석 목적, 시장 상황 등..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-base transition-all" />
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">신제품 런칭, 리브랜딩 등 분석 목적</p>
                </div>
              </div>

              <button type="submit" disabled={!category.trim() || !ownBrand.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-5 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.35)] transition-all flex items-center justify-center gap-4 text-xl group active:scale-95">
                <svg className="w-7 h-7 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                분석 프로세스 시작
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full">
            {step !== 'complete' ? (
              <div className="flex flex-col items-center justify-center py-40 space-y-12 no-print">
                <div className="relative">
                  <div className="w-32 h-32 border-[12px] border-blue-50 border-t-blue-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full shadow-xl animate-pulse" />
                  </div>
                </div>
                <div className="text-center max-w-2xl">
                  <h3 className="text-3xl font-black text-slate-900 mb-6 break-keep">{getStatusMessage()}</h3>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                    {STEPS.map((s, i) => (
                      <React.Fragment key={s}>
                        <span className={step === s ? 'text-blue-600' : ''}>{s.replace(/-/g,' ')}</span>
                        {i < STEPS.length - 1 && <span>→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              result && <AnalysisLayout result={result} keyword={ownBrand} onGenerateReport={handleGenerateReport} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AesaApp;
