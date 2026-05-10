
import React, { useMemo, useState } from 'react';
import { useSearchConfig } from '../core/search/SearchConfigContext';
import { ANALYSIS_PERIOD_OPTIONS, AnalysisPeriod } from '../core/search/analysisPeriod.types';
import { DateRange } from '../core/search/config';
import { loadSnapshots, deleteSnapshot, formatSnapshotDate, ContextSnapshot } from '../core/analysis/snapshotStorage';

// ── Helpers ────────────────────────────────────────────────────────────────
function calcDays(range: DateRange): number {
  const ms = new Date(range.end).getTime() - new Date(range.start).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

function formatKo(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Snapshot Loader (비교 모드 — 저장된 스냅샷을 Period A로 불러오기) ────
const SnapshotLoader: React.FC = () => {
  const { setConfig } = useSearchConfig();
  const [snapshots, setSnapshots] = useState<ContextSnapshot[]>(() => loadSnapshots());
  const [open, setOpen] = useState(false);

  const refresh = () => setSnapshots(loadSnapshots());

  if (snapshots.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/8 transition-all text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
            저장된 스냅샷으로 Period A 설정
          </span>
          <span className="text-[8px] font-bold text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-full">{snapshots.length}</span>
        </div>
        <svg className={`w-3 h-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto no-scrollbar">
          {snapshots.map(snap => (
            <div key={snap.id} className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors group">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{snap.name}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{snap.cepCount}개 CEP · {formatSnapshotDate(snap.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfig(c => ({
                      ...c,
                      dateRangeA: snap.dateRange,
                      periodA: snap.period || c.periodA,
                    }));
                    setOpen(false);
                  }}
                  className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                >
                  Period A로 설정
                </button>
                <button
                  type="button"
                  onClick={() => { deleteSnapshot(snap.id); refresh(); }}
                  className="text-[9px] text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 px-1"
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Mini period picker (preset pills) ─────────────────────────────────────
const PeriodPicker: React.FC<{
  value: AnalysisPeriod;
  onChange: (v: AnalysisPeriod) => void;
  accentClass?: string;
}> = ({ value, onChange, accentClass = 'bg-indigo-600 dark:bg-indigo-500 text-white' }) => (
  <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 gap-0.5">
    {ANALYSIS_PERIOD_OPTIONS.map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${
          value === opt.value
            ? `${accentClass} shadow-sm`
            : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-white/5'
        }`}
      >
        {opt.label.replace('최근 ', '')}
      </button>
    ))}
  </div>
);

// ── Date range block (start + end pickers) ─────────────────────────────────
const DateRangeBlock: React.FC<{
  label: string;
  badge: string;
  badgeColor: string;
  range: DateRange;
  onRangeChange: (r: DateRange) => void;
  preset: AnalysisPeriod;
  onPresetChange: (v: AnalysisPeriod) => void;
  accentClass?: string;
  bgClass?: string;
  borderClass?: string;
  textClass?: string;
}> = ({
  label, badge, badgeColor, range, onRangeChange,
  preset, onPresetChange,
  accentClass = 'bg-indigo-600 dark:bg-indigo-500 text-white',
  bgClass = 'bg-indigo-50 dark:bg-indigo-900/10',
  borderClass = 'border-indigo-100 dark:border-indigo-500/20',
  textClass = 'text-indigo-600 dark:text-indigo-400',
}) => {
  const [mode, setMode] = useState<'preset' | 'custom'>('custom');
  const days = calcDays(range);

  return (
    <div className={`${bgClass} ${borderClass} border p-4 rounded-xl`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${textClass}`}>
          <span className={`w-4 h-4 rounded-full ${badgeColor} flex items-center justify-center text-white text-[8px] font-black`}>
            {badge}
          </span>
          {label}
        </span>
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-white/60 dark:bg-black/20 p-0.5 rounded-lg border border-slate-200 dark:border-white/10">
          {(['preset', 'custom'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${
                mode === m ? 'bg-white dark:bg-white/10 text-slate-700 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {m === 'preset' ? '프리셋' : '직접 지정'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'preset' ? (
        <>
          <PeriodPicker value={preset} onChange={onPresetChange} accentClass={accentClass} />
          <p className="text-[9px] mt-2 opacity-70" style={{ color: 'inherit' }}>
            {ANALYSIS_PERIOD_OPTIONS.find(p => p.value === preset)?.comment}
          </p>
        </>
      ) : (
        <>
          {/* Date range pickers */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">시작일</label>
              <input
                type="date"
                value={range.start}
                max={range.end}
                onChange={e => onRangeChange({ ...range, start: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">종료일</label>
              <input
                type="date"
                value={range.end}
                min={range.start}
                max={today()}
                onChange={e => onRangeChange({ ...range, end: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>
          {/* Duration summary */}
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 text-[9px] text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-700 dark:text-slate-200">{formatKo(range.start)}</span>
              <span className="mx-1.5 opacity-50">→</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{formatKo(range.end)}</span>
            </div>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 ${textClass}`}>
              {days}일
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// --- Precise Slider Styling & Component ---
const sliderStyles = `
  .cep-slider {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  .cep-slider:focus {
    outline: none;
  }
  
  /* Webkit Track */
  .cep-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 9999px;
    border: 1px solid rgba(0,0,0,0.05);
  }
  .dark .cep-slider::-webkit-slider-runnable-track {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255,255,255,0.05);
  }
  
  /* Webkit Thumb */
  .cep-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: currentColor;
    margin-top: -5px;
    box-shadow: 0 0 0 2px white, 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: transform 0.1s ease;
    z-index: 10;
  }
  .dark .cep-slider::-webkit-slider-thumb {
    box-shadow: 0 0 0 2px #0f172a, 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  }
`;

interface ControlSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  activeTextClass: string;
  labels: string[];
  trackColorClass?: string;
}

const ControlSlider: React.FC<ControlSliderProps> = ({ value, min, max, onChange, activeTextClass, labels, trackColorClass = "text-slate-400" }) => {
  const steps = max - min + 1;
  const thumbSize = 16;
  const thumbRadius = thumbSize / 2;

  return (
    <div className={`relative h-14 w-full select-none ${trackColorClass}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`cep-slider absolute top-0 left-0 w-full h-4 z-10`}
      />
      <div className="absolute top-6 left-0 w-full h-6 z-0">
        {labels.map((label, i) => {
          const p = steps > 1 ? i / (steps - 1) : 0;
          const isSelected = value === (min + i);
          const leftCalc = `calc(${p * 100}% + ${thumbRadius - p * thumbSize}px)`;
          return (
            <div key={i} className="absolute text-center" style={{ left: leftCalc, transform: 'translateX(-50%)' }} onClick={() => onChange(min + i)}>
              <span className={`text-[9px] font-bold uppercase tracking-tight transition-all duration-200 cursor-pointer ${isSelected ? `${activeTextClass} scale-110` : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SearchConfigPanel: React.FC = () => {
  const { config, setConfig } = useSearchConfig();
  const { depth, period, dateRange, comparisonMode, periodA, periodB, dateRangeA, dateRangeB } = config;

  const toggleComparisonMode = () => {
    setConfig(prev => ({ ...prev, comparisonMode: !prev.comparisonMode }));
  };

  const applyYoYPreset = () => {
    const toIso = (d: Date) => d.toISOString().slice(0, 10);
    const today = new Date();
    const oneYearAgo = new Date(today); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const twoYearsAgo = new Date(today); twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    setConfig(prev => ({
      ...prev,
      comparisonMode: true,
      periodA: '1y',
      periodB: '1y',
      dateRangeA: { start: toIso(twoYearsAgo), end: toIso(oneYearAgo) },
      dateRangeB: { start: toIso(oneYearAgo),  end: toIso(today) },
    }));
  };

  const updateDepth = (type: 'google' | 'naver', value: number) => {
    setConfig(prev => {
      const newDepth = { ...prev.depth, [type]: value };
      const newSources = [];
      if (newDepth.google > 0) newSources.push('google' as const);
      if (newDepth.naver > 0) newSources.push('naver' as const);
      
      return {
        ...prev,
        depth: newDepth,
        sources: newSources
      };
    });
  };

  const stats = useMemo(() => {
    const currentPeriodOption = ANALYSIS_PERIOD_OPTIONS.find(p => p.value === period) || ANALYSIS_PERIOD_OPTIONS[2];
    const googleLevel = depth.google;
    const naverLevel = depth.naver;
    const totalLevel = googleLevel + naverLevel;
    
    // Updated Logic: Reflecting Max 15 CEPs (Multiplier 1.5x)
    const effectiveNodes = Math.min(15, Math.ceil(totalLevel * 1.5));
    
    // Updated Logic: Reflecting 5x Sampling Multiplier per level
    // Google: ~5000 queries/level, Naver: ~4000 queries/level
    const estimatedQueries = (googleLevel * 5000) + (naverLevel * 4000);
    
    // Updated Logic: Confidence curve adjusted for higher data density
    // Base 60%, Maxes out at 99.9%
    const representativeness = totalLevel === 0 ? 0 : Math.min(99.9, 60 + (totalLevel * 4));
    
    const periodDesc = `${currentPeriodOption.label}간의`;
    
    let densityDesc = "";
    if (totalLevel >= 8) densityDesc = "5배수 심층 샘플링(5x Deep Sampling)으로";
    else if (totalLevel >= 4) densityDesc = "확장된 노드 탐색으로";
    else densityDesc = "기본 샘플링을 통해";

    const significanceDescription = `${periodDesc} 데이터를 ${densityDesc} 롱테일 키워드와 틈새 시장 신호까지 포착합니다. (Max 15 CEPs / 50+ Raw Data)`;

    return { totalNodes: effectiveNodes, estimatedQueries, representativeness: parseFloat(representativeness.toFixed(1)), significanceDescription };
  }, [config]);

  return (
    <div className="theme-transition">
      <style>{sliderStyles}</style>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Column 1: Source Analysis Level */}
        <div className="space-y-8">
           <div>
            <div className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6">Source Analysis Level</div>
            
            <div className="space-y-8">
                {/* Google Slider */}
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${depth.google > 0 ? 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                            Google Intent
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500">{depth.google > 0 ? `Lv.${depth.google}` : 'OFF'}</span>
                    </div>
                    <ControlSlider 
                        value={depth.google} 
                        min={0} 
                        max={5} 
                        onChange={v => updateDepth('google', v)} 
                        activeTextClass="text-sky-600 dark:text-sky-400"
                        trackColorClass="text-sky-500"
                        labels={['OFF', 'Light', 'Std', 'Deep', 'Pro', 'Max']} 
                    />
                </div>

                {/* Naver Slider */}
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${depth.naver > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                            Naver Pulse
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500">{depth.naver > 0 ? `Lv.${depth.naver}` : 'OFF'}</span>
                    </div>
                    <ControlSlider 
                        value={depth.naver} 
                        min={0} 
                        max={5} 
                        onChange={v => updateDepth('naver', v)} 
                        activeTextClass="text-emerald-600 dark:text-emerald-400"
                        trackColorClass="text-emerald-500"
                        labels={['OFF', 'Light', 'Std', 'Deep', 'Pro', 'Max']} 
                    />
                </div>
            </div>
          </div>
        </div>

        {/* Column 2: Analysis Period */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Analysis Period</div>
              {/* Temporal Comparison Toggle */}
              <button
                type="button"
                onClick={toggleComparisonMode}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                  comparisonMode
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-400 hover:text-indigo-500'
                }`}
                title="두 기간을 비교 분석하는 Temporal Comparison 모드를 활성화합니다"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                비교 모드
              </button>
            </div>

            {comparisonMode ? (
              /* ── Temporal Comparison Mode ── */
              <div className="space-y-4">
                {/* Info banner */}
                <div className="flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-xl">
                  <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
                    각 기간의 시작일·종료일을 직접 지정하거나 프리셋을 선택하세요.
                    두 기간을 순차 분석 후 Sankey 다이어그램으로 변화를 시각화합니다.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest shrink-0">빠른 설정</span>
                  <button
                    type="button"
                    onClick={applyYoYPreset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-900/20 text-[9px] font-black text-violet-700 dark:text-violet-300 uppercase tracking-widest hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                    title="최근 2년을 1년씩 나눠 연간 시즈널리티를 비교합니다"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    YoY 연간 비교
                  </button>
                </div>

                {/* Snapshot Loader for Period A */}
                <SnapshotLoader />

                {/* Period A — Baseline */}
                <DateRangeBlock
                  label="기준 기간 (Baseline)"
                  badge="A"
                  badgeColor="bg-slate-500"
                  range={dateRangeA ?? { start: '', end: '' }}
                  onRangeChange={r => setConfig(c => ({ ...c, dateRangeA: r }))}
                  preset={periodA}
                  onPresetChange={v => setConfig(c => ({ ...c, periodA: v }))}
                  accentClass="bg-slate-600 dark:bg-slate-500 text-white"
                  bgClass="bg-slate-50 dark:bg-white/5"
                  borderClass="border-slate-200 dark:border-white/5"
                  textClass="text-slate-600 dark:text-slate-400"
                />

                {/* Arrow divider */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <div className="h-px w-10 bg-indigo-400/30" />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                    <div className="h-px w-10 bg-indigo-400/30" />
                  </div>
                </div>

                {/* Period B — Current */}
                <DateRangeBlock
                  label="비교 기간 (Current)"
                  badge="B"
                  badgeColor="bg-indigo-500"
                  range={dateRangeB ?? { start: '', end: '' }}
                  onRangeChange={r => setConfig(c => ({ ...c, dateRangeB: r }))}
                  preset={periodB}
                  onPresetChange={v => setConfig(c => ({ ...c, periodB: v }))}
                  accentClass="bg-indigo-600 dark:bg-indigo-500 text-white"
                  bgClass="bg-indigo-50 dark:bg-indigo-900/10"
                  borderClass="border-indigo-100 dark:border-indigo-500/20"
                  textClass="text-indigo-600 dark:text-indigo-400"
                />
              </div>
            ) : (
              /* ── Single Period Mode ── */
              <DateRangeBlock
                label="분석 기간 (Analysis Period)"
                badge="·"
                badgeColor="bg-indigo-500"
                range={dateRange ?? { start: '', end: '' }}
                onRangeChange={r => setConfig(c => ({ ...c, dateRange: r }))}
                preset={period}
                onPresetChange={v => setConfig(c => ({ ...c, period: v, dateRange: null }))}
                accentClass="bg-indigo-600 dark:bg-indigo-500 text-white"
                bgClass="bg-slate-50 dark:bg-white/5"
                borderClass="border-slate-100 dark:border-white/5"
                textClass="text-indigo-600 dark:text-indigo-400"
              />
            )}
          </div>
        </div>

        {/* Column 3: Setup Guide (Stats) */}
        <div className="flex flex-col h-full">
          <div className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6">Setup Guide</div>
          
          <div className="flex flex-col gap-4 flex-1">
             <div className="grid grid-cols-3 gap-3 h-24">
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl flex flex-col items-center justify-center shadow-sm px-1">
                  <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter whitespace-nowrap mb-2">Nodes</div>
                  <div className="text-xl font-mono font-black text-slate-900 dark:text-white leading-none">{stats.totalNodes}</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl flex flex-col items-center justify-center shadow-sm px-1">
                  <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter whitespace-nowrap mb-2">Est. Queries</div>
                  <div className="text-xl font-mono font-black text-slate-900 dark:text-white leading-none">{Math.round(stats.estimatedQueries/1000)}k+</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex flex-col items-center justify-center shadow-sm px-1">
                  <div className="text-[9px] font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-tighter whitespace-nowrap mb-2">Confidence</div>
                  <div className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats.representativeness}%</div>
                </div>
             </div>
             
             <div className="p-5 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 rounded-xl text-center flex items-center justify-center flex-1">
                <p className="text-xs text-indigo-900/70 dark:text-indigo-200 font-medium leading-relaxed break-keep">{stats.significanceDescription}</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SearchConfigPanel;

