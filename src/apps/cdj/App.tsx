import React, { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { InputGuide } from './components/InputGuide';
import { ResultsDashboard } from './components/ResultsDashboard';
import { Loader } from './components/Loader';
import { Modal } from './components/Modal';
import { analyzeContent } from './services/geminiService';
import type { AnalysisResult } from './types';

type ModalType = 'about' | 'usage' | 'interpretation' | null;

interface AnalysisParams {
  topic: string;
  sourceType: string;
  dateRange: { from: string; to: string };
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

const CdjApp: React.FC = () => {
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeModal, setActiveModal]       = useState<ModalType>(null);
  const [currentParams, setCurrentParams]   = useState<AnalysisParams | null>(null);

  const handleAnalysis = useCallback(async (params: AnalysisParams) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setCurrentParams(params);
    try {
      setAnalysisResult(await analyzeContent(params));
    } catch {
      setError('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* 앱 헤더 (GlobalNav 아래) */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            CDJ <span className="text-amber-400">마스터</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">고객 구매여정 분석 · 콘텐츠 전략 · 크리에이티브 One-Stop</p>
        </div>
        <div className="flex gap-2">
          {(['about', 'usage', 'interpretation'] as const).map(key => (
            <button
              key={key}
              onClick={() => setActiveModal(key)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            >
              {key === 'about' ? '앱 소개' : key === 'usage' ? '사용법' : '결과 해석'}
            </button>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <InputForm onAnalyze={handleAnalysis} isLoading={isLoading} />
        {isLoading && <Loader />}
        {error && <p className="text-center text-rose-400 mt-8">{error}</p>}
        {!analysisResult && !isLoading && !error && <InputGuide />}
        {analysisResult && currentParams && !isLoading && (
          <ResultsDashboard result={analysisResult} inputParams={currentParams} />
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

export default CdjApp;
