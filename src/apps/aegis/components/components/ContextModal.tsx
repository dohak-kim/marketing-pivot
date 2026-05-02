
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Context, KeywordNode, ExecutionPlan, ConversionStage, CognitionVector } from '../core/context';
import { generateExecutionPlan } from '../ai/gemini';
import { collectKeywords } from '../ai/keywords';
import { useSearchConfig } from '../core/search/SearchConfigContext';
import { ForgeOutput } from '../core/types/contentGeneration';

import ContextSelector from './ContextSelector';
import CognitionRadialGraph from './CognitionRadialGraph';
import StrategicBrief from './StrategicBrief';
import ForgeStudio from './ForgeStudio';
import PrintReport from './PrintReport';
import { ErrorBoundary } from './ErrorBoundary';

interface ContextModalProps {
  context: Context | null;
  onClose: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  brandName?: string;
  onUpdateContext?: (updatedContext: Context) => void;
}

const KeywordSpinner = () => (
  <div className="h-56 flex flex-col items-center justify-center text-center">
    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    <p className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest break-keep">Deep Keyword Analysis...</p>
  </div>
);

// ── 인지 벡터 바 차트 (RadarChart 대체 — 동일 정보, 1/3 높이) ────────────────
const CDJ_STAGE_META: Record<string, { dot: string; label: string; text: string }> = {
  awareness:      { dot: 'bg-slate-400',    label: '인지',       text: 'text-slate-500 dark:text-slate-400' },
  consideration:  { dot: 'bg-sky-400',      label: '고려',       text: 'text-sky-700 dark:text-sky-300' },
  decision:       { dot: 'bg-amber-400',    label: '구매결정',   text: 'text-amber-700 dark:text-amber-300' },
  post_purchase:  { dot: 'bg-emerald-400',  label: '구매후관리', text: 'text-emerald-700 dark:text-emerald-300' },
};

const COG_ITEMS: {
  key: keyof CognitionVector;
  label: string;
  ko: string;
  bar: string;
  text: string;
}[] = [
  { key: 'informational', label: 'Informational', ko: '정보 탐색', bar: 'bg-sky-500',     text: 'text-sky-700 dark:text-sky-400'     },
  { key: 'exploratory',   label: 'Exploratory',   ko: '비교 탐색', bar: 'bg-violet-500',  text: 'text-violet-700 dark:text-violet-400' },
  { key: 'commercial',    label: 'Commercial',    ko: '상업 조사', bar: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400'   },
  { key: 'transactional', label: 'Transactional', ko: '구매 전환', bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
];

const CognitionVectorBars: React.FC<{ vec: CognitionVector; stage?: ConversionStage }> = ({ vec, stage }) => {
  const total = COG_ITEMS.reduce((s, i) => s + (vec[i.key] || 0), 0);
  const maxVal = Math.max(...COG_ITEMS.map(i => vec[i.key] || 0), 0.01);
  const sorted = [...COG_ITEMS].sort((a, b) => (vec[b.key] || 0) - (vec[a.key] || 0));
  const stageMeta = stage ? CDJ_STAGE_META[stage] : null;

  return (
    <div className="space-y-2">
      {/* CDJ 단계 뱃지 */}
      {stageMeta && (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 ${stageMeta.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${stageMeta.dot}`} />
          CDJ · {stageMeta.label}
        </div>
      )}

      {/* 인지 강도 바 (지배 유형 순서) */}
      {sorted.map(item => {
        const val = vec[item.key] || 0;
        const pct = total > 0 ? Math.round((val / total) * 100) : 0;
        const barW = Math.round((val / maxVal) * 100);
        const dominant = val === maxVal;
        return (
          <div key={item.key} className="flex items-center gap-2 group">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.bar} ${dominant ? 'opacity-100' : 'opacity-40'}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${dominant ? item.text : 'text-slate-400 dark:text-slate-500'}`}>
                    {item.label}
                  </span>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium">{item.ko}</span>
                  {dominant && (
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${item.bar} text-white uppercase tracking-wide`}>
                      주도
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-black font-mono tabular-nums ${dominant ? item.text : 'text-slate-400 dark:text-slate-500'}`}>
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${item.bar} ${dominant ? 'opacity-100' : 'opacity-30'}`}
                  style={{ width: `${barW}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Fact Reading 컴포넌트 (클라이언트 분석, 추가 AI 호출 없음) ────────────────
const COGNITION_IMPLICATION: Record<string, { reading: string; implication: string }> = {
  informational: {
    reading: '사용자들이 이 영역에서 지식 획득·문제 해결 목적으로 검색하고 있습니다. 브랜드 인지 이전 단계로, 정보의 신뢰도가 최우선입니다.',
    implication: 'SEO 롱폼 + AEO FAQ 구조로 Featured Snippet을 선점하세요. AI 검색이 이 영역을 "정답지"로 인용하도록 GEO 엔티티 최적화가 필수입니다.',
  },
  exploratory: {
    reading: '비교·탐색 의도가 지배합니다. 사용자는 아직 결정하지 않았지만 대안을 적극적으로 평가 중입니다. 이 시점의 점유율이 최종 선택에 직결됩니다.',
    implication: '경쟁사 비교 콘텐츠와 케이스 스터디로 Hub를 구성하세요. Earned 채널(인플루언서·커뮤니티)이 탐색자의 신뢰 형성에 결정적입니다.',
  },
  commercial: {
    reading: '상업적 조사 의도가 강합니다. 가격·기능·ROI 비교가 핵심 관심사입니다. 구매 결정 직전 단계로 경쟁 강도가 가장 높습니다.',
    implication: 'USP를 명확히 드러내는 GEO 엔티티 콘텐츠와 검색광고(SEM)를 병행하세요. 랜딩 페이지 AEO 구조로 전환 장벽을 낮추세요.',
  },
  transactional: {
    reading: '전환 의도가 확인된 고가치 영역입니다. 이미 결정을 앞두고 있거나 즉각 구매를 원하는 사용자가 집중됩니다.',
    implication: 'Paid 채널이 즉각적 ROI를 창출합니다. CTA가 명확한 랜딩 페이지와 리타게팅으로 이탈 방지. 동시에 재구매를 위한 GEO 브랜드 권위도 구축하세요.',
  },
};

const FactReadingCard: React.FC<{
  keywords: import('../core/context').KeywordNode[];
  context: import('../core/context').Context;
}> = ({ keywords, context }) => {
  const vec = context.journey?.cognitionVector as Record<string, number> | undefined;
  const dominantKey = vec
    ? Object.entries(vec).reduce((a, b) => a[1] > b[1] ? a : b)[0]
    : context.cognition || 'informational';

  const impl = COGNITION_IMPLICATION[dominantKey] || COGNITION_IMPLICATION.informational;
  const cogItem = COG_ITEMS.find(c => c.key === dominantKey);

  // 키워드 인지 유형 분포
  const cogDist: Record<string, number> = {};
  keywords.forEach(kw => {
    const k = (kw as any).cognition || dominantKey;
    cogDist[k] = (cogDist[k] || 0) + 1;
  });
  const topCogs = Object.entries(cogDist).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // 상위 볼륨 키워드
  const sortedKw = [...keywords]
    .sort((a, b) => ((b as any).volume || 0) - ((a as any).volume || 0))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Fact Reading */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fact Reading</span>
        </div>
        {/* 지배 인지 */}
        <div className={`px-3 py-2 rounded-xl border ${cogItem?.bar.replace('bg-', 'border-').replace('500', '200')} bg-slate-50 dark:bg-slate-800/40`}>
          <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${cogItem?.text}`}>
            지배 인지: {cogItem?.label} ({cogItem?.ko})
          </div>
          <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">{impl.reading}</p>
        </div>
        {/* 키워드 분포 */}
        {topCogs.length > 0 && (
          <div className="space-y-1">
            <div className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">키워드 인지 분포</div>
            {topCogs.map(([k, cnt]) => {
              const ci = COG_ITEMS.find(c => c.key === k);
              const pct = Math.round((cnt / keywords.length) * 100);
              return (
                <div key={k} className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold w-20 shrink-0 ${ci?.text}`}>{ci?.ko || k}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${ci?.bar} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
        {/* 상위 키워드 */}
        {sortedKw.length > 0 && (
          <div className="space-y-1">
            <div className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">주요 키워드</div>
            <div className="flex flex-wrap gap-1">
              {sortedKw.map((kw, i) => (
                <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {(kw as any).keyword || String(kw)}
                  {(kw as any).volume ? <span className="text-slate-400 ml-1 font-mono text-[7px]">{(kw as any).volume}</span> : null}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 전략적 시사점 */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">전략적 시사점</span>
        </div>
        <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed">{impl.implication}</p>
        {/* Priority + Strategy 조합 요약 */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5">
          {[
            { k: 'Priority Score', v: `${context.marketSignal?.priorityScore}pt` },
            { k: 'SOV 자사', v: context.brandShare != null ? `${Math.round(context.brandShare * 100)}%` : undefined },
            { k: 'SOV 경쟁', v: context.competitorShare != null ? `${Math.round(context.competitorShare * 100)}%` : undefined },
            { k: 'Naver Vol', v: context.marketSignal?.naverVolumeRange ?? undefined },
            { k: '전략 유형', v: context.strategyType?.replace('_', ' ').toUpperCase() },
          ].filter(r => r.v).map(({ k, v }) => (
            <div key={k} className="flex justify-between text-[10px]">
              <span className="text-slate-400">{k}</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{v}</span>
            </div>
          ))}
        </div>
        {/* Data provenance */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[8px] font-bold ${
          context.dataProvenance === 'api'
            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
        }`}>
          {context.dataProvenance === 'api' ? '✓ 실측 API 데이터' : '~ AI 추정값 — 실측 API 미연동'}
        </div>
      </div>
    </div>
  );
};

export const ContextModal: React.FC<ContextModalProps> = ({ context, onClose, isDarkMode, toggleTheme, brandName, onUpdateContext }) => {
  const [forgeOutput, setForgeOutput] = useState<ForgeOutput | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const { config } = useSearchConfig();
  const [detailedKeywords, setDetailedKeywords] = useState<KeywordNode[] | null>(null);
  const [isKeywordsLoading, setIsKeywordsLoading] = useState(false);

  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | undefined>(undefined);
  const [isPlanLoading, setIsPlanLoading] = useState(false);

  const handlePrint = () => window.print();

  useEffect(() => {
    if (!context) {
      setDetailedKeywords(null);
      setExecutionPlan(undefined);
      return;
    }

    const fetchKeywords = async () => {
      setIsKeywordsLoading(true);
      try {
        const keywords = await collectKeywords({ context, sources: config.sources, depth: config.depth, period: config.period });
        setDetailedKeywords(keywords);
      } catch {
        setDetailedKeywords(context.metadata.keywords);
      } finally {
        setIsKeywordsLoading(false);
      }
    };

    const fetchPlan = async () => {
      if (context.executionPlan) { setExecutionPlan(context.executionPlan); return; }
      setIsPlanLoading(true);
      try {
        const plan = await generateExecutionPlan(context, brandName || '');
        setExecutionPlan(plan);
        onUpdateContext?.({ ...context, executionPlan: plan });
      } catch (e) {
        console.error('Failed to generate execution plan', e);
      } finally {
        setIsPlanLoading(false);
      }
    };

    fetchKeywords();
    fetchPlan();
  }, [context, config, brandName]);


  const vizData = useMemo(() => {
    if (!context) return null;
    return {
      contextId: context.id,
      contextLabel: context.marketSignal?.clusterName || 'Context',
      keywords: detailedKeywords || context.metadata?.keywords || [],
    };
  }, [context, detailedKeywords]);

  if (!context || !vizData) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 lg:p-6 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl animate-in fade-in" onClick={onClose} />
      
      {/* Main Container - Full Theme Sync */}
      <div className="relative w-full max-w-7xl h-full bg-slate-50 dark:bg-slate-900 border-none lg:border border-slate-200 dark:border-white/10 lg:rounded-[2rem] flex flex-col shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden theme-transition">
        
        {/* ── 섹션 인디케이터 (sticky header) ── */}
        <div className="shrink-0 px-8 py-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { n: '01', label: '컨텍스트 분석',     color: 'bg-slate-600 text-white' },
            { n: '02', label: 'AI 트리플 미디어 전략', color: 'bg-indigo-600 text-white' },
            { n: '03', label: 'AEGIS FORGE',    color: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white' },
          ].map(({ n, label, color }, i) => (
            <React.Fragment key={n}>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${color}`}>
                <span>{n}</span>
                <span>{label}</span>
              </div>
              {i < 2 && <div className="w-5 h-px bg-slate-200 dark:bg-slate-700 shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div ref={printAreaRef} className="print-area p-6 lg:p-8 space-y-12">

            {/* ══════════════════════════════════════════════════════════════
                SECTION 1: 컨텍스트 분석
            ══════════════════════════════════════════════════════════════ */}
            <section>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-[9px] font-black text-white">01</span>
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">컨텍스트 분석</span>
              </div>

              {/* Row A: 2-col — ContextSelector + CognitionVectorBars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                {/* Left: CEP 메타데이터 + SERP 피처 */}
                <div className="space-y-4">
                  <ContextSelector cep={context} />
                  {/* SERP Feature Flags */}
                  {context.serpFeatureFlags && (
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 px-4 py-3 space-y-2">
                      <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">SERP 피처 감지</span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { flag: context.serpFeatureFlags.hasFeaturedSnippet, label: 'Featured Snippet', trigger: 'AEO' },
                          { flag: context.serpFeatureFlags.hasPAA,             label: 'PAA',              trigger: 'AEO Q&A' },
                          { flag: context.serpFeatureFlags.hasAIOverview,      label: 'AI Overview',      trigger: 'GEO' },
                          { flag: context.serpFeatureFlags.hasShopping,        label: 'Shopping',         trigger: 'Paid' },
                          { flag: context.serpFeatureFlags.hasVideoCarousel,   label: 'Video',            trigger: 'Video' },
                        ].map(({ flag, label, trigger }) => flag && (
                          <span key={label} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                            {label} → {trigger}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {context.trendDirection && (() => {
                    const TREND_CONFIG = {
                      rising:   { icon: '↑', label: '상승 트렌드', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' },
                      falling:  { icon: '↓', label: '하락 트렌드', color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' },
                      stable:   { icon: '→', label: '안정 트렌드', color: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10' },
                      seasonal: { icon: '〜', label: '계절성',     color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' },
                    };
                    const cfg = TREND_CONFIG[context.trendDirection];
                    const pct = context.trendMomentum != null
                      ? `${context.trendMomentum > 1 ? '+' : ''}${Math.round((context.trendMomentum - 1) * 100)}%`
                      : '';
                    return (
                      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 px-4 py-3 space-y-2">
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">검색 트렌드 (DataLab)</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-1 rounded-full border ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          {pct && (
                            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                              전월 대비 모멘텀 {pct}
                            </span>
                          )}
                          {context.trendRecentAvg != null && (
                            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                              최근 3개월 avg {context.trendRecentAvg}/100
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right: CognitionVectorBars */}
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                  <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cognition Vector</span>
                    </div>
                    <span className="text-[8px] text-slate-300 dark:text-slate-600 font-mono">
                      {context.journey?.cognitionVector
                        ? Object.values(context.journey.cognitionVector as Record<string, number>).filter(v => v > 0.5).length > 0 ? '지배 의도 확인됨' : '복합 의도'
                        : '데이터 없음'}
                    </span>
                  </div>
                  <div className="p-4">
                    <ErrorBoundary>
                      {context.journey?.cognitionVector
                        ? <CognitionVectorBars vec={context.journey.cognitionVector} stage={context.journey.conversionStage} />
                        : <div className="h-16 flex items-center justify-center text-xs text-slate-400">인지 벡터 없음</div>
                      }
                    </ErrorBoundary>
                  </div>
                </div>
              </div>

              {/* Row B: 전폭 키워드 심층 분석 (radial graph 크게) */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden mb-5">
                <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">키워드 심층 분석</span>
                  </div>
                  {isKeywordsLoading
                    ? <span className="text-[8px] text-indigo-500 dark:text-indigo-400 font-black animate-pulse uppercase tracking-widest">분석 중...</span>
                    : <span className="text-[8px] text-slate-300 dark:text-slate-600 font-mono">{vizData.keywords.length}개 키워드</span>
                  }
                </div>
                <div className="p-6" style={{ minHeight: 360 }}>
                  <ErrorBoundary>
                    {isKeywordsLoading
                      ? <KeywordSpinner />
                      : <CognitionRadialGraph data={vizData} conversionStage={context.journey?.conversionStage} />
                    }
                  </ErrorBoundary>
                </div>
              </div>

              {/* Row C: Fact Reading + 전략적 시사점 */}
              {!isKeywordsLoading && (
                <FactReadingCard
                  keywords={vizData.keywords as any}
                  context={context}
                />
              )}
            </section>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 2: AI 트리플 미디어 전략
            ══════════════════════════════════════════════════════════════ */}
            <section>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] font-black text-white">02</span>
                <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">AI 트리플 미디어 전략</span>
                <span className="text-[8px] text-slate-400 dark:text-slate-600 ml-1">Hub &amp; Spoke Closed-Loop Architecture</span>
              </div>
              <ErrorBoundary>
                <StrategicBrief plan={executionPlan} isLoading={isPlanLoading} />
              </ErrorBoundary>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 3: AEGIS FORGE
            ══════════════════════════════════════════════════════════════ */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-[9px] font-black text-white shadow-lg shadow-indigo-500/30">03</span>
                <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">AEGIS FORGE</span>
                <span className="text-[9px] bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-sm">
                  C³ Intelligence Active
                </span>
              </div>
              <ErrorBoundary>
                <ForgeStudio
                  context={context}
                  strategyType={context.strategyType}
                  brandName={brandName}
                  executionPlan={executionPlan}
                  onOutputGenerated={setForgeOutput}
                />
              </ErrorBoundary>
            </section>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="modal-footer no-print px-10 py-5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 flex justify-between items-center z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-md" />
            <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Neural Link Active</span>
          </div>
          <div className="flex items-center gap-3">
            {/* 보고서 인쇄 버튼 */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-white/10 shadow-sm"
              title="현재 전략 보고서를 인쇄합니다"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              보고서 인쇄
            </button>
            <button
              onClick={onClose}
              className="modal-close-btn px-10 py-3 bg-slate-100 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-500/10 text-slate-700 hover:text-rose-600 dark:text-white dark:hover:text-rose-400 rounded-xl text-sm font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              세션 종료
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ── Print Report Portal — body 최상위에 렌더링, @media print 시에만 표시 ── */}
    {createPortal(
      <PrintReport
        context={context}
        executionPlan={executionPlan}
        forgeOutput={forgeOutput}
        brandName={brandName}
      />,
      document.body
    )}
  </>
  );
};

export default ContextModal;
