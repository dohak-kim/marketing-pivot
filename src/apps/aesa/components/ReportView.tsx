import React, { useRef, useState, Suspense, lazy } from 'react';
import { MarketingReport, AnalysisResult } from '../types';
import { List } from './List';
import { MarketChart } from './MarketChart';
import { PositioningMap } from './PositioningMap';

const LazyPDFLink = lazy(() => import('./LazyPDFLink'));

interface ReportViewProps {
  report: MarketingReport;
  result: AnalysisResult;
  onClose: () => void;
  onPrint: () => void;
}

// Helper to remove leading numbering (e.g., "01 ", "1. ", "01. ") from titles
const cleanSlideTitle = (title: string) => {
  if (!title) return "";
  return title
    .replace(/^[\d]+\.?\s*/, '') // Removes "01 ", "1. ", "01."
    .replace(/^Step\s*[\d]+\s*:\s*/i, '') // Removes "Step 1: "
    .replace(/^[\d]+\s+/, '') // Removes "01 "
    .trim();
};

export const ReportView: React.FC<ReportViewProps> = ({ report, result, onClose, onPrint }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  return (
    <div className="animate-in fade-in duration-700 bg-slate-100 min-h-screen break-keep" ref={reportRef}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');

          @media print {
            @page {
              size: A4 landscape;
              margin: 0; /* Handle margins in CSS */
            }

            /* =========================
               PDF EMPTY PAGE FIX
               ========================= */
            html, body {
              height: auto !important;
              overflow: visible !important;
              font-family: "Noto Sans KR", sans-serif !important;
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* section/page block */
            section,
            .section,
            .slide-container {
              page-break-inside: avoid !important;
              page-break-before: always !important;
              break-inside: avoid !important;
              break-before: page !important;
              display: flex !important;
              flex-direction: column !important;
              border: none !important;
              padding: 40px 50px !important;
              box-shadow: none !important;
              width: 297mm !important; /* Full A4 Landscape width */
              height: 208mm !important; /* Reduced height to ensure it fits in one page */
              margin: 0 !important;
              position: relative !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
              background: white !important;
            }

            /* First slide should not have a break before it */
            section:first-child,
            .section:first-child,
            .slide-container:first-child {
              margin-top: 0 !important;
              page-break-before: avoid !important;
              break-before: avoid !important;
            }

            /* No break after for any slide to prevent double breaks */
            section, .section, .slide-container {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }

            .report-content {
              display: block !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .pdf-wrapper {
              width: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
            }

            .analysis-box {
              border: 1px solid #e5e5e5 !important;
              border-radius: 12px !important;
              padding: 20px !important;
              margin-top: 10px !important;
              background: #fafafa !important;
              flex-grow: 1 !important;
              display: flex !important;
              flex-direction: column !important;
              min-height: 0 !important;
            }

            .grid {
              display: grid !important;
              grid-template-columns: repeat(12, 1fr) !important;
              gap: 20px !important;
              flex-grow: 1 !important;
              min-height: 0 !important;
            }

            .col-span-7 {
              grid-column: span 7 / span 7 !important;
            }

            .col-span-5 {
              grid-column: span 5 / span 5 !important;
            }

            .section-title {
              font-size: 22pt !important;
              font-weight: 900 !important;
              margin-bottom: 8px !important;
              color: #002d72 !important;
              border-left: 6px solid #2563eb !important;
              padding-left: 12px !important;
              line-height: 1.1 !important;
            }

            .sub-title {
              font-size: 12pt !important;
              font-weight: 500 !important;
              margin-top: 4px !important;
              color: #64748b !important;
            }

            .slide-container.cover {
              justify-content: center !important;
              align-items: flex-start !important;
            }

            .slide-container.cover h1 {
              font-size: 48pt !important;
            }

            .no-print, .no-print-nav { 
              display: none !important; 
            }

            .custom-scrollbar {
              overflow: visible !important;
            }

            /* List items font size reduction for print */
            .slide-container ul, 
            .slide-container ol,
            .slide-container li {
              font-size: 9.5pt !important;
              line-height: 1.3 !important;
            }

            .slide-container p {
              font-size: 10pt !important;
            }
          }
          
          /* Screen Styles */
          .slide-container {
            aspect-ratio: 4 / 3;
            max-width: 1000px;
            width: 100%;
            background: white;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            margin-bottom: 60px;
            display: flex;
            flex-direction: column;
            padding: 40px 50px;
            position: relative;
            overflow: hidden;
          }
        `}
      </style>
      
      <div className="max-w-7xl mx-auto flex justify-between items-center py-10 no-print px-6">
        <button onClick={onClose} className="flex items-center gap-3 text-slate-500 hover:text-slate-900 font-black uppercase tracking-widest text-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-200 rounded-lg p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          편집 대시보드
        </button>
        <div className="flex gap-4">
          <Suspense fallback={
            <span className="bg-blue-500 text-white px-8 py-5 rounded-2xl font-black flex items-center gap-3 cursor-wait">
              <div className="w-5 h-5 border-[3px] border-blue-200 border-t-white rounded-full animate-spin" />
              PDF 준비 중...
            </span>
          }>
            <LazyPDFLink
              result={result}
              report={report}
              fileName={`AESA_Report_${result.threeC?.company?.name || 'Report'}_${new Date().toISOString().slice(0,10)}.pdf`}
              className="bg-blue-600 text-white px-8 py-5 rounded-2xl font-black shadow-2xl hover:scale-105 transition-all flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-blue-500"
              variant="report"
            />
          </Suspense>
        </div>
      </div>
      <div className="pb-40 flex flex-col items-center report-content">
        <div className="pdf-wrapper w-full flex flex-col items-center">
          {/* Cover Slide */}
        <div className="slide-container cover bg-white justify-center items-start border-b-8 border-[#002d72] section">
          <div className="absolute top-0 left-0 w-full h-4 bg-[#002d72] no-print"></div>
          
          {/* AESA Rader Logo */}
          <div className="flex items-center gap-5 mb-16 no-print">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M12 12a1 1 0 110-2 1 1 0 010 2z"></path>
                </svg>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">AESA <span className="text-blue-600">Rader</span></h1>
          </div>
          
          <h1 className="text-6xl font-black text-[#002d72] mb-8 leading-tight tracking-tight uppercase max-w-5xl break-keep section-title">
            {report.title}
          </h1>
          <div className="w-32 h-2 bg-blue-600 mb-10 no-print"></div>
          <p className="text-3xl text-slate-500 font-medium mb-24 leading-relaxed max-w-4xl break-keep sub-title">
            {report.subtitle}
          </p>
          
          <div className="flex justify-between w-full border-t-2 border-slate-100 pt-8 mt-auto no-print">
            <span className="text-sm font-black tracking-widest text-slate-400 uppercase">대외비 전략 보고서</span>
            <span className="text-sm font-black tracking-widest text-slate-400 uppercase">전략 분석 엔진</span>
          </div>
        </div>

        {/* Table of Contents - 2 Columns Layout */}
        <div className="slide-container bg-white section">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-8">
            <h2 className="text-4xl font-black text-[#002d72] uppercase tracking-tighter section-title">목차</h2>
            <span className="text-lg font-bold text-slate-400 no-print">전략 개요</span>
          </div>
          <div className="grid grid-cols-2 gap-x-20 gap-y-4 flex-grow content-start py-2 analysis-box">
            {report.slides.map((s, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100 group hover:bg-slate-50 transition-colors px-2 rounded-lg">
                <span className="text-xl font-black text-blue-600 w-8 tabular-nums flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-lg font-bold text-slate-700 group-hover:text-[#002d72] truncate">{cleanSlideTitle(s.title)}</span>
                <div className="flex-grow border-b border-dashed border-slate-200 mx-2 relative top-1 opacity-50"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">P.{String(i + 3).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Slides */}
        {report.slides.map((slide, idx) => (
          <section key={idx} className="slide-container bg-white flex flex-col section">
            {/* Header only for screen */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4 flex-shrink-0 no-print">
              <span className="bg-[#002d72] text-white text-[11px] px-3 py-1 rounded font-black tracking-[0.2em]">단계 {String(idx + 1).padStart(2, '0')}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{cleanSlideTitle(slide.title)}</span>
            </div>

            <div className="analysis-box flex-grow flex flex-col overflow-hidden">
              <div className="mb-6 flex-shrink-0">
                <h1 className="text-3xl font-black text-[#002d72] leading-snug break-keep border-l-[8px] border-blue-600 pl-6 section-title">
                  {idx + 1}. {cleanSlideTitle(slide.title)}
                </h1>
                <p className="mt-3 text-base font-bold text-[#002d72] px-6 py-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl leading-relaxed break-keep">{slide.headMessage}</p>
              </div>

              <div className="grid grid-cols-12 gap-10 flex-grow min-h-0">
                <div className="col-span-7 h-full overflow-y-auto pr-4 custom-scrollbar flex flex-col justify-start">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase mb-4 tracking-widest border-b border-slate-100 pb-2">주요 발견 및 분석</h4>
                  <List items={slide.content} isSlide={true} />
                </div>
                
                <div className="col-span-5 flex flex-col gap-4 h-full min-h-0">
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 flex-grow shadow-inner flex flex-col relative overflow-hidden">
                    
                    {slide.title.toLowerCase().includes("market analysis") || slide.title.includes("시장 환경") ? (
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                         <div className="w-full flex items-center justify-center"><MarketChart historical={result.marketTrend.historicalData} forecast={result.marketTrend.forecastData} unit={result.marketTrend.unit} isSmall={true} /></div>
                      </div>
                    ) : slide.title.toLowerCase().includes("positioning") || slide.title.includes("포지셔닝") ? (
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                        <div className="w-full h-full flex items-center justify-center"><PositioningMap data={result.stp.positioningMap} isSmall={true} /></div>
                      </div>
                    ) : (slide.title.toLowerCase().includes("targeting") || slide.title.includes("목표 시장")) && result.stp.targeting.personaImageUrl ? (
                      <div className="w-full h-full relative group">
                          <img src={result.stp.targeting.personaImageUrl} alt="Target Persona" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                              <p className="text-white text-lg font-bold">{result.stp.targeting.persona.split('.')[0]}</p>
                          </div>
                      </div>
                    ) : (
                      <div className="p-6 flex flex-col justify-between h-full">
                         <div className="flex-shrink-0">
                           <h4 className="text-[10px] font-black text-blue-800 uppercase mb-3 tracking-widest italic opacity-70">근거 자료</h4>
                         </div>
                         <div className="flex-grow flex items-center justify-center relative">
                           <p className="text-lg text-slate-700 italic leading-relaxed font-bold text-center z-10 relative px-4">
                             <span className="text-4xl text-blue-200 absolute -top-4 -left-2 font-serif">“</span>
                             {slide.rtb.evidence}
                             <span className="text-4xl text-blue-200 absolute -bottom-6 -right-2 font-serif">”</span>
                           </p>
                         </div>
                         <div className="mt-4 text-right flex-shrink-0">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">검증된 출처</p>
                            <p className="text-[11px] text-blue-600 font-bold uppercase tracking-widest truncate">{slide.rtb.source}</p>
                         </div>
                      </div>
                    )}
                  </div>

                  {!(slide.title.toLowerCase().includes("targeting") && result.stp.targeting.personaImageUrl) && (
                    <div className="bg-[#002d72] text-white px-5 py-4 rounded-2xl shadow-xl text-center flex-shrink-0 relative overflow-hidden flex flex-col justify-center min-h-[84px]">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                        <p className="text-[9px] text-blue-200 font-black uppercase mb-1 tracking-[0.3em] relative z-10">핵심 성과 지표</p>
                        <div className="relative z-10 flex items-center justify-center h-full">
                          <p className="text-lg font-black tracking-tight break-keep leading-tight">{slide.rtb.metric}</p>
                        </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-5 right-10 flex items-center gap-4 no-print">
               <span className="text-[10px] font-bold text-slate-300 tracking-[0.2em] uppercase">에코애널라이저 전략 보고서</span>
               <span className="text-slate-200">|</span>
               <span className="text-[10px] font-black text-[#002d72]">{idx + 3}</span>
            </div>
          </section>
        ))}
        </div>
      </div>
    </div>
  );
};