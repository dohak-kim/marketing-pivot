// @react-pdf/renderer + PDFReport는 이 파일을 통해서만 import됨
// → 클릭 시점(report 생성 완료 후)에만 동적 로드

import { PDFDownloadLink } from '@react-pdf/renderer';
import PDFReport from './PDFReport';
import { AnalysisResult, MarketingReport } from '../types';

interface Props {
  result: AnalysisResult;
  report: MarketingReport;
  fileName: string;
  className: string;
  variant: 'analysis' | 'report';
}

export default function LazyPDFLink({ result, report, fileName, className, variant }: Props) {
  return (
    <PDFDownloadLink
      document={<PDFReport result={result} report={report} />}
      fileName={fileName}
      className={className}
    >
      {({ loading, error }) => {
        if (variant === 'analysis') {
          return (
            <span className="flex items-center gap-3">
              {loading ? (
                <>
                  <div className="w-6 h-6 border-[3px] border-blue-200 border-t-[#002d72] rounded-full animate-spin" />
                  PDF 생성 중... (폰트 로딩 포함)
                </>
              ) : error ? (
                <><span className="text-red-500">⚠</span>오류 발생 — 클릭하여 재시도</>
              ) : (
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  전략 보고서 PDF 다운로드
                </>
              )}
            </span>
          );
        }
        // variant === 'report'
        return (
          <>
            {loading ? (
              <div className="w-6 h-6 border-[3px] border-blue-100 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
            )}
            {error ? '오류 — 재시도' : loading ? 'PDF 생성 중...' : '전략 보고서 PDF 다운로드'}
          </>
        );
      }}
    </PDFDownloadLink>
  );
}
