import React, { useState, useCallback } from 'react';
import AppHeader from '@/shared/components/AppHeader';
import { InputForm } from './components/InputForm';
import { InputGuide } from './components/InputGuide';
import { ResultsDashboard } from './components/ResultsDashboard';
import { Loader } from './components/Loader';
import { Modal } from './components/Modal';
import { analyzeContent } from './services/geminiService';
import type { AnalysisResult } from './types';
import { SearchConfigProvider, useSearchConfig } from '@/apps/aegis/core/search/SearchConfigContext';
import type { SearchConfig, SearchSource } from '@/apps/aegis/core/search/config';
import { generateSeedKeywords } from '@/apps/aegis/ai/gemini';
import {
  collectSerpData,
  getEnvPipelineConfig,
  hasRealApiConfig,
  type PipelineConfig,
} from '@/apps/aegis/services/dataCollection/pipeline';
import type { SerpApiPayload } from '@/apps/aegis/services/dataCollection/types';

function buildPipelineConfig(sources: SearchSource[]): PipelineConfig {
  const full = getEnvPipelineConfig();
  const useGoogle = sources.includes('google');
  const useNaver  = sources.includes('naver');
  return {
    serperApiKey:      useGoogle ? full.serperApiKey      : undefined,
    naverClientId:     useNaver  ? full.naverClientId     : undefined,
    naverClientSecret: useNaver  ? full.naverClientSecret : undefined,
    naverAdApiKey:     useNaver  ? full.naverAdApiKey     : undefined,
    naverAdSecret:     useNaver  ? full.naverAdSecret     : undefined,
    naverAdCustomerId: useNaver  ? full.naverAdCustomerId : undefined,
  };
}

function configToLegacyRange(cfg: SearchConfig) {
  if (cfg.dateRange) return { from: cfg.dateRange.start, to: cfg.dateRange.end };
  const today = new Date();
  const from = new Date(today);
  switch (cfg.period) {
    case '1w': from.setDate(today.getDate() - 7); break;
    case '1m': from.setMonth(today.getMonth() - 1); break;
    case '6m': from.setMonth(today.getMonth() - 6); break;
    case '1y': from.setFullYear(today.getFullYear() - 1); break;
    default:   from.setMonth(today.getMonth() - 3);
  }
  return { from: from.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
}

type ModalType = 'about' | 'usage' | 'interpretation' | null;

interface AnalysisParams {
  topic: string;
}

const MODAL_CONTENT: Record<Exclude<ModalType, null>, { title: string; body: string }> = {
  about: {
    title: '앱 소개',
    body: 'CDJ MASTER는 고객 구매여정(CDJ) 분석부터 크리에이티브 제작까지 마케터의 업무를 AI로 혁신하는 All-in-One 솔루션입니다.',
  },
  usage: {
    title: '사용 방법',
    body: '분석할 주제를 입력하고 분석 시작 버튼을 클릭하세요. Journey Funnel, Intent Radar, CDJ-Intent Matrix로 시장을 진단합니다.',
  },
  interpretation: {
    title: '결과 해석',
    body: 'Hotspot(색상이 가장 진한 셀)이 현재 집중 공략해야 할 포인트입니다. Strategic Outline에서 단계별 전략을 확인하세요.',
  },
};

const CdjInner: React.FC = () => {
  const { config } = useSearchConfig();
  const [isLoading, setIsLoading]           = useState(false);
  const [progressMsg, setProgressMsg]       = useState('');
  const [error, setError]                   = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeModal, setActiveModal]       = useState<ModalType>(null);
  const [currentTopic, setCurrentTopic]     = useState<string>('');

  const handleAnalysis = useCallback(async ({ topic }: AnalysisParams) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setCurrentTopic(topic);

    try {
      // Step 1: 시드 키워드 생성
      setProgressMsg('🔍 키워드 시드 생성 중...');
      const seeds = await generateSeedKeywords(topic, 12);

      // Step 2: 실시간 SERP 데이터 수집 (API 키 있을 때만)
      let serpData: SerpApiPayload | null = null;
      const pipelineCfg = buildPipelineConfig(config.sources);
      if (hasRealApiConfig(pipelineCfg)) {
        setProgressMsg('📡 실시간 데이터 수집 중...');
        serpData = await collectSerpData(
          topic,
          seeds,
          pipelineCfg,
          (step, done, total) => setProgressMsg(`📡 ${step} (${done}/${total})`),
        );
      }

      // Step 3: CDJ 분석
      setProgressMsg('🗺️ CDJ 여정 분석 중...');
      setAnalysisResult(await analyzeContent({
        topic,
        sources: config.sources,
        period: config.period,
        dateRange: config.dateRange,
        serpData,
      }));
    } catch {
      setError('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
      setProgressMsg('');
    }
  }, [config]);

  const legacyInputParams = currentTopic
    ? { topic: currentTopic, sourceType: config.sources.join(' + ').toUpperCase(), dateRange: configToLegacyRange(config) }
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <AppHeader
        icon="🗺️" name="AEGIS Pathfinder" accentPart="Pathfinder"
        subtitle="CDJ 고객 구매여정 분석 · 콘텐츠 전략 · 크리에이티브"
        accentColor="text-amber-400" iconBg="bg-amber-500" theme="dark"
        actions={<>
          {(['about','usage','interpretation'] as const).map(key => (
            <button key={key} onClick={() => setActiveModal(key)}>
              {key === 'about' ? '앱 소개' : key === 'usage' ? '사용법' : '결과 해석'}
            </button>
          ))}
        </>}
      />

      <main className="container mx-auto px-4 py-8">
        <InputForm onAnalyze={handleAnalysis} isLoading={isLoading} />
        {isLoading && <Loader message={progressMsg || undefined} />}
        {error && <p className="text-center text-rose-400 mt-8">{error}</p>}
        {!analysisResult && !isLoading && !error && <InputGuide />}
        {analysisResult && legacyInputParams && !isLoading && (
          <ResultsDashboard result={analysisResult} inputParams={legacyInputParams} />
        )}
      </main>

      {activeModal && (
        <Modal title={MODAL_CONTENT[activeModal].title} onClose={() => setActiveModal(null)}>
          <p className="text-slate-300 text-sm leading-relaxed">{MODAL_CONTENT[activeModal].body}</p>
        </Modal>
      )}
    </div>
  );
};

const CdjApp: React.FC = () => (
  <SearchConfigProvider>
    <CdjInner />
  </SearchConfigProvider>
);

export default CdjApp;
