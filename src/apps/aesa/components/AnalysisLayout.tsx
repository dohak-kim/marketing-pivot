import React, { useState, useMemo, useRef } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PDFReport from './PDFReport';
import { AnalysisResult, MarketingReport, CategorizedSources } from '../types';
import { Card } from './Card';
import { List } from './List';
import { MarketChart } from './MarketChart';
import { PositioningMap } from './PositioningMap';

interface AnalysisLayoutProps {
  result: AnalysisResult;
  keyword: string;
  onGenerateReport: () => Promise<MarketingReport>;
}

export const AnalysisLayout: React.FC<AnalysisLayoutProps> = ({ result, keyword, onGenerateReport }) => {
  const [report, setReport] = useState<MarketingReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const categorizedSources = useMemo((): CategorizedSources => {
    const verified = (result.sources || []).filter(
      (s) => s.uri && s.uri.startsWith('http')
    );
    const aiTextSources = [
      ...(result.pest?.sources || []),
      ...(result.threeC?.company?.sources || []),
      ...(result.threeC?.competitor?.sources || []),
      ...(result.threeC?.customer?.sources || []),
      ...(result.swot?.sources || []),
    ];
    const verifiedTitles = new Set(verified.map((s) => s.title?.toLowerCase()));
    const aiGenerated = Array.from(new Set(aiTextSources)).filter(
      (s) => s && s.trim().length > 3 && !verifiedTitles.has(s.toLowerCase())
    );
    return { verified, aiGenerated };
  }, [result]);

  const handleCreateReport = async () => {
    setIsGenerating(true);
    try {
      const generated = await onGenerateReport();
      setReport(generated);
    } catch (e) { console.error(e); alert('보고서 생성 실패: ' + e); } finally { setIsGenerating(false); }
  };

  const handlePrint = () => { window.print(); };

  return (
    <div className="space-y-24 pb-48 break-keep text-slate-800" ref={reportRef}>
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            section { page-break-inside: avoid; break-inside: avoid; margin-bottom: 2rem; }
            .page-break { page-break-before: always; break-before: page; }
          }
          .pdf-section { break-inside: avoid; page-break-inside: avoid; }
        `}
      </style>

      {/* Action Buttons (Top) */}
      <div className="flex justify-end gap-4 no-print mb-8">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-xl font-black border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          <span>인쇄</span>
        </button>
      </div>

      {/* 1. Market Size & Growth Rate */}
      <section className="pdf-section">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="bg-[#002d72] text-white px-6 py-2.5 rounded-xl font-black text-xs tracking-[0.3em] uppercase">시장 규모</div>
            <h2 className="text-5xl font-black text-slate-900 whitespace-nowrap">1. 시장 규모 및 성장률</h2>
          </div>
          <div className="flex gap-3">
            <div className="bg-white p-4 rounded-2xl border shadow-lg border-blue-50 w-[160px] flex flex-col justify-center">
              <p className="text-[10px] text-blue-800 font-black uppercase tracking-widest mb-1 truncate">추정 시장 규모</p>
              <p className="text-base font-black text-[#002d72] break-keep leading-tight">{result.marketTrend.currentMarketSize || 'N/A'}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border shadow-lg w-[160px] flex flex-col justify-center">
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1 truncate">최근 10년 성장률</p>
              <p className="text-base font-black text-[#002d72] break-keep leading-tight">{result.marketTrend.cagrHistorical}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border shadow-lg w-[160px] flex flex-col justify-center">
              <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mb-1 truncate">향후 5년 예측 성장률</p>
              <p className="text-base font-black text-[#002d72] break-keep leading-tight">{result.marketTrend.cagrForecast}</p>
            </div>
          </div>
        </div>
        <MarketChart historical={result.marketTrend.historicalData} forecast={result.marketTrend.forecastData} unit={result.marketTrend.unit} />
        <div className="mt-8 bg-slate-900 text-white p-12 rounded-3xl shadow-xl"><p className="text-2xl font-medium leading-relaxed italic break-keep">"{result.marketTrend.description}"</p></div>
      </section>

      {/* 2. PEST & Implications */}
      <section className="pdf-section">
        <div className="flex items-center gap-6 mb-12">
          <div className="bg-[#002d72] text-white px-6 py-2.5 rounded-xl font-black text-xs tracking-[0.3em] uppercase">PEST 환경 분석</div>
          <h2 className="text-5xl font-black text-slate-900">2. PEST 분석 및 시사점</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card title="Political (정치)" color="border-blue-500" sources={result.pest.sources}><List items={result.pest.political} /></Card>
          <Card title="Economic (경제)" color="border-green-500" sources={result.pest.sources}><List items={result.pest.economic} /></Card>
          <Card title="Social (사회)" color="border-orange-500" sources={result.pest.sources}><List items={result.pest.social} /></Card>
          <Card title="Technological (기술)" color="border-purple-500" sources={result.pest.sources}><List items={result.pest.technological} /></Card>
        </div>
        <div className="mt-8 bg-blue-50 p-10 rounded-3xl border-l-8 border-blue-600 shadow-sm break-keep">
          <h4 className="text-base font-black text-blue-800 uppercase mb-6 tracking-widest">PEST 전략적 시사점</h4>
          <List items={result.pest.implications} />
        </div>
      </section>

      {/* 3. 3C & Implications */}
      <section className="pdf-section">
        <div className="flex items-center gap-6 mb-12">
          <div className="bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-black text-xs tracking-[0.3em] uppercase">3C 분석</div>
          <h2 className="text-5xl font-black text-slate-900">3. 3C 분석 및 시사점</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Card title="Company (자사)" color="border-blue-600" sources={result.threeC.company.sources}>
            <p className="text-base font-black text-slate-800 mb-5">{result.threeC.company.name}</p>
            <List items={result.threeC.company.strengths} />
          </Card>
          <Card title="Competitor (경쟁사)" color="border-red-500" sources={result.threeC.competitor.sources}>
            {(result.threeC.competitor.rivals || []).map((r, i) => (
              <div key={i} className="mb-8 break-keep">
                <p className="text-base font-black text-slate-800 mb-2">{r.name}</p>
                <List items={[r.strategy]} />
              </div>
            ))}
          </Card>
          <Card title="Customer (고객)" color="border-yellow-500" sources={result.threeC.customer.sources}>
            <List items={result.threeC.customer.segments} />
            <div className="mt-6 pt-6 border-t border-slate-100"><List items={result.threeC.customer.trends} /></div>
          </Card>
        </div>
        <div className="mt-8 bg-emerald-50 p-10 rounded-3xl border-l-8 border-emerald-600 shadow-sm break-keep">
          <h4 className="text-base font-black text-emerald-800 uppercase mb-6 tracking-widest">3C 전략적 시사점</h4>
          <List items={result.threeC.competitor.implications} />
        </div>
      </section>

      {/* 4. SWOT & Strategic Direction */}
      <section className="pdf-section">
        <div className="flex items-center gap-6 mb-12">
          <div className="bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-black text-xs tracking-[0.3em] uppercase">SWOT 매트릭스</div>
          <h2 className="text-5xl font-black text-slate-900">4. SWOT 분석 및 전략 방향</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-green-50 p-8 rounded-3xl border border-green-100 shadow-sm"><h5 className="font-black text-green-800 text-[12px] uppercase mb-5">Strengths (강점)</h5><List items={result.swot.strengths} /></div>
          <div className="bg-red-50 p-8 rounded-3xl border border-red-100 shadow-sm"><h5 className="font-black text-red-800 text-[12px] uppercase mb-5">Weaknesses (약점)</h5><List items={result.swot.weaknesses} /></div>
          <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 shadow-sm"><h5 className="font-black text-blue-800 text-[12px] uppercase mb-5">Opportunities (기회)</h5><List items={result.swot.opportunities} /></div>
          <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 shadow-sm"><h5 className="font-black text-orange-800 text-[12px] uppercase mb-5">Threats (위협)</h5><List items={result.swot.threats} /></div>
        </div>
        <div className="bg-[#002d72] text-white p-16 rounded-[3rem] shadow-2xl">
          <h4 className="text-2xl font-black mb-12 border-b border-white/20 pb-6 tracking-tight">전략 방향성 도출</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="break-keep"><p className="text-[12px] text-blue-300 font-black uppercase mb-4 tracking-widest">SO 전략 (강점-기회)</p><p className="text-xl leading-relaxed font-semibold">{result.swot.strategies.SO}</p></div>
            <div className="break-keep"><p className="text-[12px] text-blue-300 font-black uppercase mb-4 tracking-widest">WT 전략 (약점-위협)</p><p className="text-xl leading-relaxed font-semibold">{result.swot.strategies.WT}</p></div>
          </div>
        </div>
      </section>

      {/* 5. STP */}
      <section className="pdf-section">
        <div className="flex items-center gap-6 mb-12">
          <div className="bg-purple-700 text-white px-6 py-2.5 rounded-xl font-black text-xs tracking-[0.3em] uppercase">STP 전략 수립</div>
          <h2 className="text-5xl font-black text-slate-900">5. STP 분석</h2>
        </div>
        
        {/* 1. Segmentation (Cards) */}
        <div className="mb-16">
          <h3 className="text-2xl font-black text-purple-800 mb-8 border-b-2 border-purple-100 pb-2 inline-block">1. 시장 세분화 (Segmentation)</h3>
          
          {/* Segmentation Logic Box */}
          <div className="mb-10 bg-purple-50 p-8 rounded-2xl border-l-8 border-purple-300 shadow-sm">
             <h4 className="text-[12px] text-purple-700 font-black uppercase tracking-widest mb-3">세분화 로직</h4>
             <p className="text-base text-slate-700 leading-relaxed font-semibold">{result.stp.segmentationLogic}</p>
          </div>

          {/* 세그먼트 3~5개 동적 그리드 — 3개: 3열, 4개: 2+2, 5개: 3+2 */}
          <div className={`grid gap-5 ${
            result.stp.segmentation.length <= 3
              ? 'grid-cols-1 md:grid-cols-3'
              : result.stp.segmentation.length === 4
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {result.stp.segmentation.slice(0, 5).map((seg, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-purple-100 shadow-lg hover:shadow-xl transition-shadow flex flex-col overflow-hidden">
                {/* 헤더 */}
                <div className="bg-purple-50 px-6 pt-6 pb-4 border-b border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-purple-600 text-white font-black px-3 py-1 rounded-full text-[10px] tracking-widest uppercase">세그먼트 {idx + 1}</span>
                    <div className="text-right">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest">추정 규모</span>
                      <span className="text-sm font-black text-purple-600 leading-tight">{seg.size}</span>
                    </div>
                  </div>
                  <h4 className="text-base font-black text-slate-800 leading-snug break-keep mt-2">{seg.name}</h4>
                </div>

                {/* 본문 */}
                <div className="px-6 py-4 flex flex-col flex-grow gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">분류 기준</p>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed break-keep">{seg.criteria}</p>
                  </div>
                  <div className="flex-grow">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">프로필</p>
                    <p className="text-xs text-slate-600 leading-relaxed break-keep">{seg.description}</p>
                  </div>
                </div>

                {/* 푸터 — 데이터 근거 */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 mt-auto">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">데이터 근거</p>
                  <p className="text-[10px] text-slate-500 italic leading-relaxed break-keep">{seg.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Targeting (Hero Box) */}
        <div className="mb-16">
          <h3 className="text-2xl font-black text-purple-800 mb-8 border-b-2 border-purple-100 pb-2 inline-block">2. 타겟팅 전략 (Targeting)</h3>
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
               {/* Left: Primary Target Segment */}
               <div className="border-b lg:border-b-0 lg:border-r border-white/20 pb-8 lg:pb-0 lg:pr-12 flex flex-col">
                  <p className="text-[12px] text-purple-300 font-black uppercase tracking-widest mb-6">핵심 타겟 세그먼트</p>
                  <div className="flex-grow flex flex-col justify-between">
                     <p className="text-4xl font-black text-white leading-tight mb-8 break-keep">{result.stp.targeting.selectedSegment}</p>
                     <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm mt-auto">
                        <p className="text-[11px] text-purple-200 font-bold uppercase tracking-widest mb-3">선정 근거</p>
                        <p className="text-base text-white/90 leading-relaxed font-medium">{result.stp.targeting.rationale}</p>
                     </div>
                  </div>
               </div>
               
               {/* Right: Target Persona Profile */}
               <div className="flex flex-col">
                  <p className="text-[12px] text-purple-300 font-black uppercase tracking-widest mb-6">타겟 페르소나</p>
                  <div className="flex flex-col xl:flex-row gap-6 items-start h-full">
                     <div className="xl:flex-[4] order-2 xl:order-1">
                        <p className="text-xl text-white leading-relaxed font-medium italic break-keep">"{result.stp.targeting.persona}"</p>
                     </div>
                     <div className="xl:flex-[6] w-full order-1 xl:order-2">
                        <div className="aspect-square w-full bg-white/10 rounded-2xl overflow-hidden shadow-lg border border-white/10 relative group">
                            {result.stp.targeting.personaImageUrl ? (
                                <img src={result.stp.targeting.personaImageUrl} alt="Target Persona" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center flex-col gap-2 text-purple-200/50">
                                    <div className="w-8 h-8 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">페르소나 생성 중...</span>
                                </div>
                            )}
                        </div>
                     </div>
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* 3. Positioning (Split View) */}
        <div className="mb-16">
          <h3 className="text-2xl font-black text-purple-800 mb-8 border-b-2 border-purple-100 pb-2 inline-block">3. 포지셔닝 전략 (Positioning)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[2rem] border-l-[12px] border-indigo-600 shadow-lg flex flex-col h-full">
               <h4 className="text-sm font-black text-indigo-800 uppercase tracking-widest mb-6">포지셔닝 선언문</h4>
               <p className="text-xl font-bold text-slate-800 leading-relaxed break-keep">"{result.stp.positioning.statement}"</p>
            </div>
            <div className="bg-indigo-50 p-10 rounded-[2rem] border-l-[12px] border-indigo-400 shadow-inner flex flex-col h-full">
               <h4 className="text-sm font-black text-indigo-800 uppercase tracking-widest mb-6">차별화 포인트 (POD)</h4>
               <p className="text-xl font-bold text-slate-700 leading-relaxed break-keep">{result.stp.positioning.differentiation}</p>
            </div>
          </div>
        </div>

        {/* Positioning Map */}
        <PositioningMap data={result.stp.positioningMap} />
      </section>

      {/* 6. 4P's Mix */}
      <section className="pdf-section">
        <div className="flex items-center gap-6 mb-12">
          <div className="bg-blue-800 text-white px-6 py-2.5 rounded-xl font-black text-xs tracking-[0.3em] uppercase">실행 전략</div>
          <h2 className="text-5xl font-black text-slate-900">6. 4P's Mix</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-white px-6 py-12 rounded-[2.5rem] border border-gray-100 border-b-[15px] border-blue-600 shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl">
            <h4 className="text-lg font-black text-blue-600 uppercase tracking-tight whitespace-nowrap mb-10 pb-4 border-b border-gray-50">Product (제품)</h4>
            <List items={result.marketingMix.product} />
          </div>
          <div className="bg-white px-6 py-12 rounded-[2.5rem] border border-gray-100 border-b-[15px] border-blue-500 shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl">
            <h4 className="text-lg font-black text-blue-500 uppercase tracking-tight whitespace-nowrap mb-10 pb-4 border-b border-gray-50">Price (가격)</h4>
            <List items={result.marketingMix.price} />
          </div>
          <div className="bg-white px-6 py-12 rounded-[2.5rem] border border-gray-100 border-b-[15px] border-blue-400 shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl">
            <h4 className="text-lg font-black text-blue-400 uppercase tracking-tight whitespace-nowrap mb-10 pb-4 border-b border-gray-50">Place (유통)</h4>
            <List items={result.marketingMix.place} />
          </div>
          <div className="bg-white px-6 py-12 rounded-[2.5rem] border border-gray-100 border-b-[15px] border-blue-300 shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl">
            <h4 className="text-lg font-black text-blue-300 uppercase tracking-tight whitespace-nowrap mb-10 pb-4 border-b border-gray-50">Promotion (프로모션)</h4>
            <List items={result.marketingMix.promotion} />
          </div>
        </div>
      </section>

      {/* 7. Communication Strategy (Creative Text) */}
      <section className="pdf-section">
        <div className="flex items-center gap-6 mb-12">
          <div className="bg-rose-700 text-white px-6 py-2.5 rounded-xl font-black text-xs tracking-[0.3em] uppercase">크리에이티브 전략</div>
          <h2 className="text-5xl font-black text-slate-900">7. 커뮤니케이션 전략</h2>
        </div>
        
        {/* Main Concept & Slogan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-[#0f172a] text-white p-12 rounded-[2.5rem] shadow-2xl flex flex-col h-full group">
                <div className="flex-shrink-0 mb-8">
                    <p className="text-[12px] text-rose-400 font-black uppercase tracking-widest">크리에이티브 컨셉</p>
                </div>
                <div className="flex-grow flex items-center">
                    <p className="text-3xl font-black leading-snug break-keep">{result.communication.mainConcept}</p>
                </div>
            </div>
            <div className="bg-gradient-to-br from-[#be123c] to-[#881337] text-white p-12 rounded-[2.5rem] shadow-2xl flex flex-col h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>
                <div className="flex-shrink-0 mb-8">
                    <p className="text-[12px] text-rose-200 font-black uppercase tracking-widest relative z-10">핵심 슬로건</p>
                </div>
                <div className="flex-grow flex items-center relative z-10">
                    <p className="text-3xl font-black leading-tight break-keep">"{result.communication.slogan}"</p>
                </div>
            </div>
        </div>

        {/* Brand Story (The 'Creative Text') */}
        <div className="bg-white p-12 rounded-[2.5rem] border border-rose-100 shadow-lg mb-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-2 h-full bg-rose-600"></div>
             <h4 className="text-sm font-black text-rose-700 uppercase tracking-widest mb-6">브랜드 스토리</h4>
             <p className="text-xl leading-loose font-medium text-slate-700 break-keep whitespace-pre-line">
               {result.communication.brandStory}
             </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">톤앤매너</h4>
                <p className="text-lg font-bold text-slate-800">{result.communication.toneAndVoice}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">키워드</h4>
                <div className="flex flex-wrap gap-2">
                    {result.communication.keyKeywords.map((k, i) => (
                        <span key={i} className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-sm font-bold">#{k}</span>
                    ))}
                </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">실행 계획</h4>
                <ul className="space-y-2">
                    {result.communication.actionPlan.map((plan, i) => (
                        <li key={i} className="text-sm font-medium text-slate-600 flex gap-2">
                            <span className="text-rose-500">•</span> {plan}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </section>

      {/* Strategic Glossary & References */}
      <section className="bg-white rounded-[4rem] p-24 border border-slate-100 shadow-2xl pdf-section">
        <div className="flex items-center gap-8 mb-20 border-b border-slate-50 pb-12">
            <svg className="w-16 h-16 text-[#002d72]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <h3 className="text-5xl font-black text-slate-900 tracking-tight">전략 용어 사전 및 참고문헌</h3>
        </div>
        
        <div className="flex flex-col gap-24">
            {/* 1. Strategic Glossary (Updated Design) */}
            <div className="bg-slate-50 p-14 rounded-[3.5rem] border border-slate-100 shadow-inner">
                <h4 className="text-[14px] font-black text-[#002d72] uppercase tracking-[0.4em] mb-10">전략 용어 사전</h4>
                <div className="flex flex-col gap-8">
                    {result.glossary.map((g, i) => (
                        <div key={i} className="flex flex-col gap-1 break-keep">
                            <p className="text-xl font-black text-[#002d72] uppercase tracking-wide flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1"></span>
                                {g.term}
                            </p>
                            <p className="text-lg text-slate-800 leading-snug font-medium pl-5 opacity-90">
                                {g.definition}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="pt-14 mt-14 border-t border-slate-200">
                    <p className="text-[12px] text-[#002d72] font-black uppercase mb-6 italic tracking-widest">"검증된 데이터 노드"에 대하여</p>
                    <p className="text-[13px] text-slate-400 leading-relaxed break-keep font-medium">본 시스템에서 'Verified Environmental Data Node'는 실시간 검색 증강 기술을 통해 교차 검증된 공신력 있는 웹 소스를 의미하며, 분석의 객관적 무결성을 담보하기 위한 고정된 지식 참조 지점입니다.</p>
                </div>
            </div>

            {/* 2. References — 2-tier 신뢰도 분류 */}
            <div>
                <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">참고문헌</h4>

                {categorizedSources.verified.length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        검증된 출처 — 링크 확인 가능
                      </span>
                      <span className="text-xs text-slate-400">{categorizedSources.verified.length}건</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                      {categorizedSources.verified.map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" rel="noreferrer"
                           className="flex gap-3 group transition-all items-start hover:bg-emerald-50 p-2 rounded-xl -m-2">
                          <span className="text-emerald-600 font-black text-sm mt-0.5 min-w-[28px]">[V{i+1}]</span>
                          <div className="overflow-hidden">
                            <p className="text-base font-bold text-slate-800 group-hover:text-emerald-800 leading-tight break-keep">{s.title}</p>
                            <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5 group-hover:text-emerald-600">{s.uri}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {categorizedSources.aiGenerated.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[11px] font-black px-3 py-1 rounded-full border border-amber-200">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                        AI 추론 기반 — 원문 확인 권장
                      </span>
                      <span className="text-xs text-slate-400">{categorizedSources.aiGenerated.length}건</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      {categorizedSources.aiGenerated.map((s, i) => (
                        <div key={i} className="flex gap-3 items-start opacity-75">
                          <span className="text-amber-500 font-black text-sm mt-0.5 min-w-[28px]">[A{i+1}]</span>
                          <p className="text-sm font-medium text-slate-600 leading-tight break-keep">{s}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-6 text-[11px] text-slate-400 italic leading-relaxed">
                      ※ AI 추론 기반 출처는 분석 모델이 Fact Sheet를 해석하는 과정에서 생성된 참조입니다. 직접 URL이 확인되지 않으므로 중요 수치는 원문 검색을 권장합니다.
                    </p>
                  </div>
                )}
            </div>
        </div>
      </section>

      <div className="bg-gradient-to-br from-[#002d72] via-[#0047bb] to-[#002d72] rounded-[2.5rem] p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 no-print">
        <div className="max-w-4xl">
          <h2 className="text-4xl font-black mb-4 leading-tight tracking-tight break-keep">모든 분석이 완료되었습니다.</h2>
          <p className="text-blue-100 text-lg opacity-90 leading-relaxed font-light italic break-keep">시장 트렌드 및 환경분석, STP 및 4P's Mix 전략까지 총괄한 자사의 마케팅 전략 보고서를 다운로드하세요.</p>
        </div>
        {report ? (
          <PDFDownloadLink
            document={<PDFReport result={result} report={report} />}
            fileName={`AESA_Report_${new Date().toISOString().slice(0,10)}.pdf`}
            className="bg-white text-[#002d72] px-10 py-4 rounded-2xl font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shrink-0 no-underline"
          >
            {({ loading }) => loading ? (
              <span className="flex items-center gap-3">
                <div className="w-6 h-6 border-[3px] border-blue-200 border-t-[#002d72] rounded-full animate-spin"></div>
                PDF 생성 중...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                전략 보고서 PDF 다운로드
              </span>
            )}
          </PDFDownloadLink>
        ) : (
          <button onClick={handleCreateReport} disabled={isGenerating} className="bg-white text-[#002d72] px-10 py-4 rounded-2xl font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50 shrink-0 focus:outline-none focus:ring-4 focus:ring-blue-300">
            {isGenerating ? (
              <span className="flex items-center gap-3">
                <div className="w-6 h-6 border-[3px] border-blue-100 border-t-[#002d72] rounded-full animate-spin"></div>
                보고서 생성 중...
              </span>
            ) : "최종 보고서 생성"}
          </button>
        )}
      </div>
    </div>
  );
};
