import React, { useState, useCallback } from 'react';
import type { AnalysisResultItem, Cluster, ClusterResult, AeoContent, AeoScoreReport, KeywordIntelligence, FullAnalysisResult } from './types';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import ClusterDisplay from './components/ClusterDisplay';
import AeoDisplay from './components/AeoDisplay';
import Loader from './components/Loader';
import ErrorMessage from './components/ErrorMessage';
import BatchResultsDisplay from './components/BatchResultsDisplay';
import ComparisonReport from './components/ComparisonReport';
import AeoDiagnosisDisplay from './components/AeoDiagnosisDisplay';
import { getSearchData, analyzeTrends, generateTargetProfiles, generateAeoContent, rewriteAeoContent, generateComparisonReport, getAeoScore, improveAeoContentBasedOnDiagnosis, identifyKeywordLevel } from './services/geminiService';

const CepApp: React.FC = () => {
  const [isLoading, setIsLoading]                   = useState(false);
  const [error, setError]                           = useState<string | null>(null);
  const [analysisResult, setAnalysisResult]         = useState<AnalysisResultItem[] | null>(null);
  const [clusterResult, setClusterResult]           = useState<ClusterResult | null>(null);
  const [keywordIntelligence, setKeywordIntelligence] = useState<KeywordIntelligence | null>(null);
  const [isGeneratingAeo, setIsGeneratingAeo]       = useState(false);
  const [aeoError, setAeoError]                     = useState<string | null>(null);
  const [aeoContent, setAeoContent]                 = useState<AeoContent | null>(null);
  const [generatingForCluster, setGeneratingForCluster] = useState<{name: string; format: 'blog' | 'linkedin'} | null>(null);
  const [isRewritingAeo, setIsRewritingAeo]         = useState(false);
  const [isImprovingAeo, setIsImprovingAeo]         = useState(false);
  const [isDiagnosingAeo, setIsDiagnosingAeo]       = useState(false);
  const [aeoScoreReport, setAeoScoreReport]         = useState<AeoScoreReport | null>(null);
  const [currentQuery, setCurrentQuery]             = useState('');
  const [currentTimeFilter, setCurrentTimeFilter]   = useState('qdr:m');
  const [currentDataVolume, setCurrentDataVolume]   = useState(20);
  const [isComparing, setIsComparing]               = useState(false);
  const [comparisonError, setComparisonError]       = useState<string | null>(null);
  const [comparisonReport, setComparisonReport]     = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing]   = useState(false);
  const [batchResults, setBatchResults]             = useState<FullAnalysisResult[] | null>(null);
  const [batchProgress, setBatchProgress]           = useState<{ current: number; total: number } | null>(null);
  const [showPrintGuide, setShowPrintGuide]         = useState(false);

  const isLightMode = false; // Marketing-Pivot 다크 테마 고정

  const handlePrint = () => {
    setShowPrintGuide(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.print();
      setTimeout(() => setShowPrintGuide(false), 500);
    }));
  };

  const resetAllState = (isNewQuery = true) => {
    setIsLoading(false); setError(null); setAnalysisResult(null); setClusterResult(null);
    setKeywordIntelligence(null); setIsGeneratingAeo(false); setAeoError(null);
    setAeoContent(null); setGeneratingForCluster(null); setIsRewritingAeo(false);
    setIsImprovingAeo(false); setIsBatchProcessing(false); setBatchResults(null);
    setBatchProgress(null); setAeoScoreReport(null); setIsDiagnosingAeo(false);
    if (isNewQuery) { setCurrentQuery(''); setComparisonReport(null); setComparisonError(null); }
  };

  const handleSingleAnalyze = useCallback(async (query: string, timeFilter: string, dataVolume: number, kwIntel?: KeywordIntelligence) => {
    resetAllState(true);
    setIsLoading(true); setCurrentQuery(query); setCurrentTimeFilter(timeFilter); setCurrentDataVolume(dataVolume);
    try {
      const intel = kwIntel || await identifyKeywordLevel(query);
      setKeywordIntelligence(intel);
      const { snippets, related } = await getSearchData(query, timeFilter, dataVolume);
      if (!snippets && !related) throw new Error("실시간 검색 결과가 없습니다.");
      const trends = await analyzeTrends(snippets, related, dataVolume, intel);
      setAnalysisResult(trends);
      if (trends.length > 0) setClusterResult(await generateTargetProfiles(trends, dataVolume, intel));
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.');
    } finally { setIsLoading(false); }
  }, []);

  const handleBatchAnalyze = useCallback(async (queriesString: string, timeFilter: string, dataVolume: number) => {
    resetAllState(true); setIsBatchProcessing(true);
    const queries = queriesString.split('\n').map(q => q.trim()).filter(Boolean);
    const results: FullAnalysisResult[] = [];
    for (let i = 0; i < queries.length; i++) {
      setBatchProgress({ current: i + 1, total: queries.length });
      let fullResult: FullAnalysisResult = { query: queries[i], analysisResult: [], clusterResult: null, aeoContent: null };
      try {
        const intel = await identifyKeywordLevel(queries[i]);
        fullResult.keywordIntelligence = intel;
        await new Promise(r => setTimeout(r, 800));
        const { snippets, related } = await getSearchData(queries[i], timeFilter, dataVolume);
        await new Promise(r => setTimeout(r, 1500));
        if (!snippets && !related) throw new Error("검색 결과 없음");
        const trends = await analyzeTrends(snippets, related, dataVolume, intel);
        fullResult.analysisResult = trends;
        if (trends.length > 0) {
          await new Promise(r => setTimeout(r, 1500));
          fullResult.clusterResult = await generateTargetProfiles(trends, dataVolume, intel);
        }
      } catch (e) { fullResult.error = e instanceof Error ? e.message : '오류'; }
      results.push(fullResult); setBatchResults([...results]);
    }
    setIsBatchProcessing(false); setBatchProgress(null);
  }, []);

  const handleAnalyze = useCallback((query: string, mode: 'single' | 'batch', timeFilter: string, dataVolume: number, kwIntel?: KeywordIntelligence) => {
    mode === 'single' ? handleSingleAnalyze(query, timeFilter, dataVolume, kwIntel) : handleBatchAnalyze(query, timeFilter, dataVolume);
  }, [handleSingleAnalyze, handleBatchAnalyze]);

  const handleGenerateAeo = useCallback(async (cluster: Cluster, format: 'blog' | 'linkedin') => {
    setIsGeneratingAeo(true); setAeoError(null); setAeoContent(null); setGeneratingForCluster({ name: cluster.name, format });
    try {
      const result = await generateAeoContent(cluster, format);
      setAeoContent(result); setIsDiagnosingAeo(true);
      setAeoScoreReport(await getAeoScore(result, currentQuery));
    } catch (e) { setAeoError(e instanceof Error ? e.message : '콘텐츠 생성 중 오류'); }
    finally { setIsGeneratingAeo(false); setIsDiagnosingAeo(false); setGeneratingForCluster(null); }
  }, [currentQuery]);

  const handleRewriteAeo = useCallback(async (contentToRewrite: AeoContent) => {
    const cluster = clusterResult?.clusters.find(c => c.name === contentToRewrite.targetClusterName);
    if (!cluster) return;
    setIsRewritingAeo(true);
    try {
      const result = await rewriteAeoContent(contentToRewrite, cluster);
      setAeoContent(result); setAeoScoreReport(await getAeoScore(result, currentQuery));
    } catch (e) { setAeoError(e instanceof Error ? e.message : '오류'); }
    finally { setIsRewritingAeo(false); }
  }, [clusterResult, currentQuery]);

  const handleImproveAeo = useCallback(async () => {
    if (!aeoContent || !aeoScoreReport) return;
    const cluster = clusterResult?.clusters.find(c => c.name === aeoContent.targetClusterName);
    if (!cluster) return;
    setIsImprovingAeo(true);
    try {
      const result = await improveAeoContentBasedOnDiagnosis(aeoContent, aeoScoreReport, cluster, currentQuery);
      setAeoContent(result); setAeoScoreReport(await getAeoScore(result, currentQuery));
    } catch { setAeoError('개선 실패'); }
    finally { setIsImprovingAeo(false); }
  }, [aeoContent, aeoScoreReport, clusterResult, currentQuery]);

  const handleCompare = useCallback(async (period_a: string, period_b: string) => {
    setIsComparing(true);
    try {
      const { snippets: sa } = await getSearchData(currentQuery, period_a, currentDataVolume);
      const { snippets: sb } = await getSearchData(currentQuery, period_b, currentDataVolume);
      setComparisonReport(await generateComparisonReport(sa, period_a, sb, period_b));
    } catch { setComparisonError('비교 분석 실패'); }
    finally { setIsComparing(false); }
  }, [currentQuery, currentDataVolume]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      {showPrintGuide && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md print:hidden">
          <div className="bg-white text-slate-900 p-10 rounded-[2.5rem] max-w-md text-center shadow-2xl">
            <h3 className="text-2xl font-black mb-3">리포트 출력 준비 중</h3>
            <p className="text-sm text-sky-800">프린터 설정에서 '배경 그래픽'을 켜주세요.</p>
          </div>
        </div>
      )}

      {/* 앱 헤더 */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            AEGIS <span className="text-violet-400">Signal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">CEP 트렌드 · 타겟 페르소나 · AEO 콘텐츠 분석</p>
        </div>
        {(analysisResult || batchResults) && (
          <button onClick={handlePrint} className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors print:hidden">
            PDF 출력
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="print:hidden">
          <InputForm onAnalyze={handleAnalyze} isLoading={isLoading || isBatchProcessing} isLightMode={isLightMode} />
        </div>
        <div className="mt-8">
          {batchResults ? (
            <div className="printable-section">
              {isBatchProcessing && batchProgress && <Loader message={`(${batchProgress.current}/${batchProgress.total}) 처리 중...`} />}
              <BatchResultsDisplay results={batchResults} isLightMode={isLightMode} />
            </div>
          ) : (
            <div id="report-content" className="flex flex-col items-center w-full">
              {isLoading && <Loader message="CEP 및 타겟 페르소나 분석 중..." />}
              {error && <ErrorMessage message={error} />}
              {analysisResult && (
                <div className="w-full mt-8 printable-section">
                  <ResultsDisplay results={analysisResult} timeFilter={currentTimeFilter} dataVolume={currentDataVolume} isLightMode={isLightMode} keywordIntel={keywordIntelligence} query={currentQuery} />
                </div>
              )}
              {clusterResult && (
                <div className="w-full mt-12 printable-section print-page-break">
                  <ClusterDisplay clusters={clusterResult.clusters} onGenerateAeo={handleGenerateAeo} isGeneratingAeo={isGeneratingAeo} generatingForCluster={generatingForCluster} isLightMode={isLightMode} />
                </div>
              )}
              {aeoContent && (
                <div className="w-full max-w-4xl mt-12 printable-section print-page-break">
                  <AeoDisplay key={JSON.stringify(aeoContent)} content={aeoContent} onRewrite={handleRewriteAeo} isRewriting={isRewritingAeo || isImprovingAeo} isLightMode={isLightMode} query={currentQuery} aeoScore={aeoScoreReport?.score} />
                </div>
              )}
              {aeoScoreReport && aeoContent && (
                <div className="w-full max-w-4xl mt-12 printable-section print-page-break">
                  <AeoDiagnosisDisplay report={aeoScoreReport} query={currentQuery} onImprove={handleImproveAeo} isImproving={isImprovingAeo} isLightMode={isLightMode} />
                </div>
              )}
              {comparisonReport && (
                <div className="w-full mt-12 printable-section print-page-break">
                  <ComparisonReport onCompare={handleCompare} isLoading={isComparing} report={comparisonReport} error={comparisonError} query={currentQuery} isLightMode={isLightMode} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CepApp;
