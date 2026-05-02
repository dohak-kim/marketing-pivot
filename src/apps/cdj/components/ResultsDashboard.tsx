
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { AnalysisResult } from '../types';
import { CDJStage } from '../types';
import { JourneyFunnel } from './JourneyFunnel';
import { IntentRadarChart } from './IntentRadarChart';
import { KeywordTable } from './KeywordTable';
import { StrategicOutline } from './StrategicOutline';
import { CDJIntentMatrix } from './CDJIntentMatrix';
import { DownloadIcon } from './icons/DownloadIcon';

interface AnalysisParams {
    topic: string;
    sourceType: string;
    dateRange: {
      from: string;
      to: string;
    };
  }

interface ResultsDashboardProps {
  result: AnalysisResult;
  inputParams: AnalysisParams;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result, inputParams }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Calculate Dominant Stage for Recommendations
  const stageCounts = result.keywords.reduce((acc, kw) => {
      acc[kw.cdjStage] = (acc[kw.cdjStage] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);
  
  const dominantStageEntry = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0];
  const dominantStage = dominantStageEntry ? (dominantStageEntry[0] as CDJStage) : CDJStage.Awareness;

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;
    setIsDownloading(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      
      let currentHeight = margin;

      // 1. Capture Main Report Sections (Defined by .pdf-section)
      const sections = dashboardRef.current.querySelectorAll('.pdf-section');
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        if (section.offsetHeight === 0) continue; 

        if (i > 0) {
             pdf.addPage();
             currentHeight = margin;
        }

        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: isPrintMode ? '#ffffff' : '#0F172A',
          ignoreElements: (element) => element.classList.contains('hide-on-pdf'), // Hide interactive tools in main pages
        });

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        let finalHeight = imgHeight;
        let finalWidth = contentWidth;
        
        if (imgHeight > (pageHeight - margin * 2)) {
             const ratio = (pageHeight - margin * 2) / imgHeight;
             finalHeight = pageHeight - margin * 2;
             finalWidth = contentWidth * ratio;
             const xOffset = margin + (contentWidth - finalWidth) / 2;
             pdf.addImage(imgData, 'PNG', xOffset, margin, finalWidth, finalHeight);
        } else {
             pdf.addImage(imgData, 'PNG', margin, currentHeight, finalWidth, finalHeight);
        }
      }

      // 2. Capture Generated Creative Assets (Append as new pages)
      const generatedAssets = dashboardRef.current.querySelectorAll('.generated-export-target');
      
      if (generatedAssets.length > 0) {
          for (let i = 0; i < generatedAssets.length; i++) {
              const asset = generatedAssets[i] as HTMLElement;
              
              pdf.addPage(); 
              
              // Direct capture of the asset element (even if hidden in parent via ignoreElements)
              const canvas = await html2canvas(asset, {
                  scale: 2,
                  useCORS: true,
                  logging: false,
                  backgroundColor: isPrintMode ? '#ffffff' : '#0F172A', 
              });
              
              const imgData = canvas.toDataURL('image/png');
              const imgHeight = (canvas.height * contentWidth) / canvas.width;
              
              pdf.setFontSize(10);
              pdf.setTextColor(150);
              pdf.text(`Appendix: Generated Creative #${i + 1}`, margin, margin - 2);

              let finalHeight = imgHeight;
              let finalWidth = contentWidth;
              
              if (imgHeight > (pageHeight - margin * 2)) {
                  const ratio = (pageHeight - margin * 2) / imgHeight;
                  finalHeight = pageHeight - margin * 2;
                  finalWidth = contentWidth * ratio;
                  const xOffset = margin + (contentWidth - finalWidth) / 2;
                  pdf.addImage(imgData, 'PNG', xOffset, margin, finalWidth, finalHeight);
              } else {
                  pdf.addImage(imgData, 'PNG', margin, margin, finalWidth, finalHeight);
              }
          }
      }

      pdf.save(`CDJ_Report_${inputParams.topic.replace(/\s+/g, '_')}_${isPrintMode ? 'Print' : 'Dark'}.pdf`);

    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  const containerClass = isPrintMode ? 'bg-white text-gray-900' : 'bg-brand-dark text-white';
  const headerBorderClass = isPrintMode ? 'border-gray-300' : 'border-gray-700';
  const summaryBoxClass = isPrintMode ? 'bg-gray-50 border-gray-200' : 'bg-brand-light border-gray-700';
  const summaryTextClass = isPrintMode ? 'text-gray-700' : 'text-gray-300';
  const sectionTitleClass = isPrintMode ? 'text-gray-900' : 'text-brand-gold';
  const metaLabelClass = isPrintMode ? 'text-gray-500' : 'text-gray-400';
  const metaValueClass = isPrintMode ? 'text-gray-900 font-bold' : 'text-white font-bold';

  const renderExecutiveSummary = (text: string) => {
      const cleanText = text.replace(/\\n/g, '\n');
      const separator = '💡 추천 크리에이티브 유형';
      const parts = cleanText.split(separator);
      
      if (parts.length > 1) {
          const mainContent = parts[0].trim();
          let creativeContent = parts[1].trim();
          if (creativeContent.startsWith(':')) {
              creativeContent = creativeContent.substring(1).trim();
          }
          return (
              <>
                  <div className="whitespace-pre-wrap">{mainContent}</div>
                  <div className="mt-5 pt-4 border-t border-gray-600/30">
                      <span className="font-bold text-brand-gold text-lg block mb-2">{separator}</span>
                      <div className="whitespace-pre-wrap pl-2 border-l-2 border-brand-gold/30">
                          {creativeContent}
                      </div>
                  </div>
              </>
          );
      }
      return <div className="whitespace-pre-wrap">{cleanText}</div>;
  };

  return (
    <div className="mt-12 max-w-7xl mx-auto">
      {/* Control Panel */}
      <div className="flex flex-col sm:flex-row justify-end items-center mb-6 px-4 gap-4">
        <div className="flex items-center gap-3 bg-gray-800/50 p-2 rounded-lg border border-gray-700">
            <span className={`text-sm font-medium ${isPrintMode ? 'text-gray-400' : 'text-white'}`}>Dark Mode</span>
            <button 
                onClick={() => setIsPrintMode(!isPrintMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isPrintMode ? 'bg-brand-gold' : 'bg-gray-600'}`}
            >
                <span className="sr-only">인쇄 모드 토글</span>
                <span className={`${isPrintMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
            </button>
            <span className={`text-sm font-medium ${isPrintMode ? 'text-brand-gold' : 'text-gray-400'}`}>인쇄용 (White)</span>
        </div>

        <button 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-500 w-full sm:w-auto justify-center"
        >
          {isDownloading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <DownloadIcon className="w-5 h-5" />
          )}
          <span>통합 PDF 다운로드</span>
        </button>
      </div>

      <div ref={dashboardRef} className={`space-y-6 p-4 md:p-8 rounded-xl transition-colors duration-300 ${containerClass}`}>
        
        {/* --- PAGE 1: Header + Summary + Funnel/Radar + Matrix --- */}
        <div className={`pdf-section flex flex-col gap-6 min-h-[1400px]`}> 
            {/* Header */}
            <div className={`border-b-2 pb-6 ${headerBorderClass} text-center`}>
                <h1 className={`text-3xl font-extrabold mb-2 ${sectionTitleClass}`}>CDJ 콘텐츠 진단 및 최적화 방안 결과 보고서</h1>
                <p className={`text-sm mb-6 ${isPrintMode ? 'text-gray-500' : 'text-gray-400'}`}>Content Journey Analysis & Strategic Optimization Report</p>
                <div className={`grid grid-cols-3 gap-4 max-w-4xl mx-auto p-4 rounded-lg ${isPrintMode ? 'bg-gray-50 border border-gray-200' : 'bg-gray-800/50 border border-gray-700'}`}>
                    <div>
                        <p className={`text-xs uppercase mb-1 ${metaLabelClass}`}>검색 키워드</p>
                        <p className={`text-lg ${metaValueClass}`}>{inputParams.topic}</p>
                    </div>
                    <div>
                        <p className={`text-xs uppercase mb-1 ${metaLabelClass}`}>분석 소스</p>
                        <p className={`text-lg ${metaValueClass}`}>{inputParams.sourceType}</p>
                    </div>
                     <div>
                        <p className={`text-xs uppercase mb-1 ${metaLabelClass}`}>분석 기간</p>
                        <p className={`text-sm ${metaValueClass}`}>{inputParams.dateRange.from} ~ {inputParams.dateRange.to}</p>
                    </div>
                </div>
            </div>

            {/* Executive Summary */}
            <div className={`p-5 rounded-lg border ${summaryBoxClass}`}>
                <h2 className="text-xl font-bold mb-3 text-brand-gold">Executive Summary</h2>
                <div className={`text-base leading-relaxed ${summaryTextClass}`}>
                    {renderExecutiveSummary(result.strategicInsights)}
                </div>
            </div>

            {/* Funnel & Radar Charts (Moved to Page 1) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[350px]">
                <div className="flex flex-col h-full">
                    <h2 className={`text-lg font-bold mb-3 text-center ${sectionTitleClass}`}>고객 여정 퍼널</h2>
                    <div className="flex-grow">
                        <JourneyFunnel keywords={result.keywords} isPrintMode={isPrintMode} />
                    </div>
                </div>
                <div className="flex flex-col h-full">
                    <h2 className={`text-lg font-bold mb-3 text-center ${sectionTitleClass}`}>검색 의도 분포</h2>
                    <div className="flex-grow">
                        <IntentRadarChart distribution={result.intentDistribution} isPrintMode={isPrintMode} />
                    </div>
                </div>
            </div>

            {/* Matrix (Hotspot) */}
            <div className="mt-2 flex-grow">
                 <h2 className={`text-lg font-bold mb-3 text-center ${sectionTitleClass}`}>여정-의도 교차 분석 (Opportunity Matrix)</h2>
                 <CDJIntentMatrix 
                    keywords={result.keywords} 
                    matrixImplication={result.matrixImplication}
                    isPrintMode={isPrintMode} 
                 />
            </div>
        </div>

        {/* --- PAGE 2: Keyword Table Only --- */}
        <div className="pdf-section pt-8 min-h-[1000px]">
            <h2 className={`text-lg font-bold mb-3 text-center ${sectionTitleClass}`}>핵심 키워드 분석</h2>
            <KeywordTable keywords={result.keywords} keywordInsights={result.keywordInsights} isPrintMode={isPrintMode} />
        </div>

        {/* --- PAGE 3: Strategic Outline --- */}
        {/* Rendered by StrategicOutline component (First .pdf-section) */}

        {/* --- PAGE 4: Appendix (Text) --- */}
        {/* Rendered by StrategicOutline component (Second .pdf-section) */}

        <StrategicOutline 
            outlines={result.strategicOutlines} 
            isPrintMode={isPrintMode} 
            recommendedStage={dominantStage}
            topic={inputParams.topic}
        />
        
        {/* --- PAGE 5+: Generated Creatives (Appended automatically) --- */}

        {/* Footer */}
        <div className={`pdf-section text-center text-xs border-t pt-4 mt-8 ${headerBorderClass} ${isPrintMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>Generated by CDJ Analytics & Optimizer | Powered by Google Gemini</p>
        </div>
      </div>
    </div>
  );
};
