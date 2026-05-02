
import React, { useMemo } from 'react';
import { Context, ConversionStage, CognitionKey } from '../core/context';

interface CDJLadderViewProps {
  contexts: Context[];
  category: string;
  onSelectContext: (context: Context) => void;
}

// ── Stage 정의 ────────────────────────────────────────────────────────────────

const STAGES: {
  key: ConversionStage;
  labelKo: string;
  labelEn: string;
  description: string;
  level: string;     // Laddering 레이어 레이블
  barColor: string;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  headerSubText: string;
  emptyText: string;
}[] = [
  {
    key: ConversionStage.AWARENESS,
    labelKo: '인지',
    labelEn: 'AWARENESS',
    description: '문제 인식 · 정보 탐색',
    level: 'Value Layer',
    barColor: 'bg-slate-400',
    headerBg: 'bg-slate-50 dark:bg-slate-800/40',
    headerBorder: 'border-slate-200 dark:border-slate-700/60',
    headerText: 'text-slate-600 dark:text-slate-300',
    headerSubText: 'text-slate-400 dark:text-slate-500',
    emptyText: '인지 단계 신호 없음',
  },
  {
    key: ConversionStage.CONSIDERATION,
    labelKo: '고려',
    labelEn: 'CONSIDERATION',
    description: '대안 비교 · 브랜드 탐색',
    level: 'Benefit — Rational',
    barColor: 'bg-sky-400',
    headerBg: 'bg-sky-50 dark:bg-sky-900/20',
    headerBorder: 'border-sky-200 dark:border-sky-700/40',
    headerText: 'text-sky-700 dark:text-sky-300',
    headerSubText: 'text-sky-400 dark:text-sky-500',
    emptyText: '고려 단계 신호 없음',
  },
  {
    key: ConversionStage.DECISION,
    labelKo: '구매결정',
    labelEn: 'DECISION',
    description: '최종 선택 · 전환 트리거',
    level: 'Benefit — Emotional',
    barColor: 'bg-amber-400',
    headerBg: 'bg-amber-50 dark:bg-amber-900/20',
    headerBorder: 'border-amber-200 dark:border-amber-700/40',
    headerText: 'text-amber-700 dark:text-amber-300',
    headerSubText: 'text-amber-400 dark:text-amber-500',
    emptyText: '구매결정 단계 신호 없음',
  },
  {
    key: ConversionStage.POST_PURCHASE,
    labelKo: '구매후관리',
    labelEn: 'POST-PURCHASE',
    description: '재구매 · 충성도 · 리텐션',
    level: 'Attribute Layer',
    barColor: 'bg-emerald-400',
    headerBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    headerBorder: 'border-emerald-200 dark:border-emerald-700/40',
    headerText: 'text-emerald-700 dark:text-emerald-300',
    headerSubText: 'text-emerald-400 dark:text-emerald-500',
    emptyText: '구매후관리 단계 신호 없음',
  },
];

// ── Cognition 메타 ─────────────────────────────────────────────────────────────

const COG_META: Record<CognitionKey, {
  label: string;
  labelShort: string;
  dot: string;
  leftBorder: string;
  pill: string;
  pillText: string;
}> = {
  informational: {
    label: 'Informational',
    labelShort: 'INFO',
    dot: 'bg-blue-500',
    leftBorder: 'border-l-blue-400 dark:border-l-blue-500',
    pill: 'bg-blue-100 dark:bg-blue-900/40',
    pillText: 'text-blue-700 dark:text-blue-300',
  },
  exploratory: {
    label: 'Exploratory',
    labelShort: 'EXPL',
    dot: 'bg-violet-500',
    leftBorder: 'border-l-violet-400 dark:border-l-violet-500',
    pill: 'bg-violet-100 dark:bg-violet-900/40',
    pillText: 'text-violet-700 dark:text-violet-300',
  },
  commercial: {
    label: 'Commercial',
    labelShort: 'COMM',
    dot: 'bg-amber-500',
    leftBorder: 'border-l-amber-400 dark:border-l-amber-500',
    pill: 'bg-amber-100 dark:bg-amber-900/40',
    pillText: 'text-amber-700 dark:text-amber-300',
  },
  transactional: {
    label: 'Transactional',
    labelShort: 'TRAN',
    dot: 'bg-emerald-500',
    leftBorder: 'border-l-emerald-400 dark:border-l-emerald-500',
    pill: 'bg-emerald-100 dark:bg-emerald-900/40',
    pillText: 'text-emerald-700 dark:text-emerald-300',
  },
};

// 키워드 칩 색상 (Cognition 기반)
const KW_CHIP: Record<string, string> = {
  informational: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-200 dark:ring-blue-700/50',
  exploratory:   'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 ring-1 ring-inset ring-violet-200 dark:ring-violet-700/50',
  commercial:    'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-200 dark:ring-amber-700/50',
  transactional: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-700/50',
};

// 전략 유형 뱃지
const STRATEGY_BADGE: Record<string, string> = {
  offensive:     'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  defensive:     'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  niche_capture: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  brand_build:   'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  monitor:       'bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400',
};
const STRATEGY_LABEL: Record<string, string> = {
  offensive: 'Offensive', defensive: 'Defensive', niche_capture: 'Niche',
  brand_build: 'Brand Build', monitor: 'Monitor',
};

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export const CDJLadderView: React.FC<CDJLadderViewProps> = ({ contexts, category, onSelectContext }) => {

  const grouped = useMemo(() => {
    const map = new Map<ConversionStage, Context[]>();
    STAGES.forEach(s => map.set(s.key, []));
    contexts.forEach(ctx => {
      const stage = ctx.journey?.conversionStage as ConversionStage;
      if (stage && map.has(stage)) {
        map.get(stage)!.push(ctx);
      } else {
        map.get(ConversionStage.AWARENESS)!.push(ctx);
      }
    });
    // 각 단계 내 Priority Score 내림차순 정렬
    map.forEach((ceps, key) => {
      map.set(key, [...ceps].sort((a, b) =>
        (b.marketSignal?.priorityScore ?? 0) - (a.marketSignal?.priorityScore ?? 0)
      ));
    });
    return map;
  }, [contexts]);

  const totalCeps = contexts.length;
  if (totalCeps === 0) return null;

  // 인지 유형 분포 요약 (범례용)
  const cogSummary = useMemo(() => {
    const counts: Record<CognitionKey, number> = { informational: 0, exploratory: 0, commercial: 0, transactional: 0 };
    contexts.forEach(ctx => {
      const cog = (ctx.cognition || 'informational') as CognitionKey;
      if (counts[cog] !== undefined) counts[cog]++;
    });
    return counts;
  }, [contexts]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">

      {/* ── 패널 헤더 ── */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-slate-400 via-sky-400 via-amber-400 to-emerald-400" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                C³ Journey Ladder
              </h3>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 uppercase tracking-widest">
                Laddering
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              {category} · {totalCeps}개 전략 블록 · CDJ 4단계 × C³ 인지 의도 맵핑
            </p>
          </div>
        </div>

        {/* 인지 유형 mini 분포 */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-100 dark:border-white/5">
          {(Object.keys(cogSummary) as CognitionKey[]).map(cog => (
            cogSummary[cog] > 0 && (
              <div key={cog} className="flex items-center gap-1 px-2">
                <div className={`w-2 h-2 rounded-full ${COG_META[cog].dot}`} />
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400">{cogSummary[cog]}</span>
              </div>
            )
          ))}
          <div className="w-px h-3 bg-slate-200 dark:bg-slate-600 mx-1" />
          <span className="text-[9px] text-slate-400 font-semibold">intent dist.</span>
        </div>
      </div>

      {/* ── Laddering 레이어 레이블 (3단계 시각화) ── */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-white/5 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-white/5">
        {STAGES.map(stage => (
          <div key={stage.key} className="px-4 py-1.5 flex items-center gap-1.5">
            <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.15em]">
              {stage.level}
            </span>
          </div>
        ))}
      </div>

      {/* ── 4컬럼 Ladder 그리드 ── */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-white/5">
        {STAGES.map((stage, stageIdx) => {
          const ceps = grouped.get(stage.key) || [];
          const pct = totalCeps > 0 ? Math.round((ceps.length / totalCeps) * 100) : 0;

          return (
            <div key={stage.key} className="flex flex-col">

              {/* Stage 헤더 */}
              <div className={`px-4 py-3 ${stage.headerBg} border-b ${stage.headerBorder}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-black uppercase tracking-[0.18em] ${stage.headerText}`}>
                    {stage.labelEn}
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${stage.headerBorder} ${stage.headerText}`}>
                    {ceps.length}개
                  </span>
                </div>
                <div className={`text-sm font-black leading-none ${stage.headerText}`}>
                  {stage.labelKo}
                </div>
                <div className={`text-[9px] mt-0.5 leading-tight ${stage.headerSubText}`}>
                  {stage.description}
                </div>

                {/* 점유 비중 바 */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-300 dark:text-slate-600 font-bold">볼륨 비중</span>
                    <span className={`text-[8px] font-black ${stage.headerSubText}`}>{pct}%</span>
                  </div>
                  <div className="h-1 bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${stage.barColor}`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ── CEP 카드 목록 (Laddering Level 2) ── */}
              <div className="flex-1 p-3 space-y-2.5 min-h-[240px]">
                {ceps.length === 0 ? (
                  <div className="h-full min-h-[180px] flex flex-col items-center justify-center gap-2 opacity-40">
                    <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600" />
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest text-center leading-snug">
                      {stage.emptyText}
                    </p>
                  </div>
                ) : (
                  ceps.map(ctx => {
                    const cog = (ctx.cognition || 'informational') as CognitionKey;
                    const meta = COG_META[cog];
                    const clusterName = ctx.marketSignal?.clusterName || ctx.queryGroup || ctx.situation;
                    const score = ctx.marketSignal?.priorityScore ?? 0;
                    const strategy = ctx.strategyType;
                    const keywords = (ctx.metadata?.keywords || []).slice(0, 6);

                    return (
                      <button
                        key={ctx.id}
                        onClick={() => onSelectContext(ctx)}
                        className={`
                          w-full text-left rounded-xl border-l-4 ${meta.leftBorder}
                          border border-slate-200 dark:border-white/5
                          bg-slate-50 dark:bg-slate-800/40
                          hover:bg-white dark:hover:bg-slate-800
                          hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60
                          hover:-translate-y-0.5
                          active:translate-y-0
                          transition-all duration-200 group
                          overflow-hidden
                        `}
                      >
                        {/* ── CEP 헤더 (Level 2: Benefit) ── */}
                        <div className="px-3 pt-2.5 pb-2">
                          <div className="flex items-start justify-between gap-1.5 mb-2">
                            <span
                              title={clusterName}
                              className="text-[11px] font-black text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors flex-1"
                            >
                              {clusterName}
                            </span>
                            <span className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full ${meta.pill} ${meta.pillText}`}>
                              {score}pt
                            </span>
                          </div>

                          {/* Cognition + Strategy 뱃지 행 */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                              <span className={`text-[8px] font-black uppercase tracking-wider ${meta.pillText}`}>
                                {meta.labelShort}
                              </span>
                            </div>
                            {strategy && (
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${STRATEGY_BADGE[strategy] || ''}`}>
                                {STRATEGY_LABEL[strategy] || strategy}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ── 키워드 칩 (Level 3: Attributes) ── */}
                        {keywords.length > 0 && (
                          <>
                            {/* Ladder 구분선 */}
                            <div className="mx-3 border-t border-dashed border-slate-200 dark:border-white/5" />
                            <div className="px-3 py-2 flex flex-wrap gap-1">
                              {keywords.map((kw, i) => {
                                const kwCog = (kw.cognition || (kw as any).intent || cog) as string;
                                return (
                                  <span
                                    key={i}
                                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${KW_CHIP[kwCog] || KW_CHIP.informational}`}
                                  >
                                    {kw.keyword}
                                  </span>
                                );
                              })}
                            </div>
                          </>
                        )}

                        {/* 클릭 힌트 */}
                        <div className="px-3 pb-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] text-indigo-500 dark:text-indigo-400 font-black">C³ 전략 상세 →</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 하단 범례 INDEX ── */}
      <div className="px-6 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">
            INDEX
          </span>

          {/* ① CDJ 단계 범례 — 좌측 고정 */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">CDJ 단계</span>
            {STAGES.map(s => (
              <div key={s.key} className="flex items-center gap-1.5">
                <div className={`w-3 h-1.5 rounded-full ${s.barColor}`} />
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">{s.labelKo}</span>
              </div>
            ))}
          </div>

          <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 shrink-0" />

          {/* ② 인지 의도 범례 — 우측 */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">인지 의도</span>
            {(Object.keys(COG_META) as CognitionKey[]).map(cog => (
              <div key={cog} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${COG_META[cog].dot}`} />
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">{COG_META[cog].label}</span>
              </div>
            ))}
          </div>

          <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 shrink-0" />

          {/* ③ 카드 구조 안내 */}
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-4 bg-indigo-400 rounded-full" />
            <span className="text-[8px] text-slate-400 dark:text-slate-500">CEP</span>
            <span className="text-[8px] text-slate-300 dark:text-slate-600">·····</span>
            <span className="text-[8px] text-slate-400 dark:text-slate-500">키워드 속성</span>
          </div>

          <div className="ml-auto text-[8px] text-slate-300 dark:text-slate-600 font-mono hidden md:block">
            카드 클릭 → AEGIS 전략 분석 실행
          </div>
        </div>
      </div>
    </div>
  );
};

export default CDJLadderView;
