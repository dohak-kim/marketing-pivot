
import React, { useState } from 'react';
import { BattleFieldInput } from '../core/context';
import SearchConfigPanel from './SearchConfigPanel';

interface BattleFieldFormProps {
  isLoading?: boolean;
  disabled?: boolean;
  onSubmit: (data: BattleFieldInput) => void;
  initialCategory?: string;
  initialBrandName?: string;
}

const BattleFieldForm: React.FC<BattleFieldFormProps> = ({
  isLoading = false,
  disabled = false,
  onSubmit,
  initialCategory = '',
  initialBrandName = '',
}) => {
  const [category, setCategory] = useState(initialCategory);
  const [brandName, setBrandName] = useState(initialBrandName);
  const [competitors, setCompetitors] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim()) return;
    onSubmit({
      category,
      brandName,
      competitors: competitors.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  const canSubmit = !isLoading && !disabled && category.trim().length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto">

      {/* ── Hero 브랜드 섹션 ── */}
      <div className="text-center mb-14 relative">
        {/* 배경 글로우 */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[200px] bg-indigo-500/8 dark:bg-indigo-500/12 rounded-full blur-[80px]" />
        </div>

        {/* 로고 워드마크 */}
        <div className="inline-flex items-center gap-3 mb-6 select-none">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shadow-brand-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter">MAP</span>
            <span className="text-3xl font-bold italic text-indigo-600 dark:text-indigo-400 tracking-tighter">HACK</span>
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-teal-400">
            C³ Cube Strategy
          </span>
          <br />
          <span className="text-slate-800 dark:text-slate-100">Intelligence Engine</span>
        </h1>

        {/* ── C³ 모델 정의 블록 ── */}
        <div className="max-w-3xl mx-auto mb-8">
          {/* 수식 레이블 */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-indigo-200 dark:to-indigo-800/60" />
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-500 dark:text-indigo-400 px-3">
              C³ = Context × Conversion × Cognition
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-indigo-200 dark:to-indigo-800/60" />
          </div>

          {/* 3개 카드 — 가로 1행 */}
          <div className="flex items-stretch gap-3">
            {/* C¹ Context */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-800/40 p-4 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full -mr-6 -mt-6 pointer-events-none" />
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none">C<sup className="text-sm">1</sup></span>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-700/40 uppercase tracking-wider shrink-0">CEP 확장</span>
              </div>
              <p className="text-[13px] font-black text-slate-800 dark:text-slate-100 mb-1">Context</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed break-keep">
                소비자가 브랜드를 처음 인식하는 <strong className="text-indigo-600 dark:text-indigo-400">전략적 진입점(CEP)</strong>을 확장 — 시장 내 모든 소비 맥락과 상황을 구조화합니다.
              </p>
            </div>

            {/* × */}
            <div className="flex items-center justify-center w-5 shrink-0">
              <span className="text-lg font-black text-slate-300 dark:text-slate-600">×</span>
            </div>

            {/* C² Conversion */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-sky-800/40 p-4 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 dark:bg-sky-400/5 rounded-full -mr-6 -mt-6 pointer-events-none" />
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-2xl font-black text-sky-600 dark:text-sky-400 leading-none">C<sup className="text-sm">2</sup></span>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/40 text-sky-500 dark:text-sky-400 border border-sky-100 dark:border-sky-700/40 uppercase tracking-wider shrink-0">CDJ 확장</span>
              </div>
              <p className="text-[13px] font-black text-slate-800 dark:text-slate-100 mb-1">Conversion</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed break-keep">
                인지 → 고려 → 결정 → 구매후로 이어지는 <strong className="text-sky-600 dark:text-sky-400">고객 구매여정(CDJ)</strong>을 확장 — 단계별 전환 장벽과 기회를 식별합니다.
              </p>
            </div>

            {/* × */}
            <div className="flex items-center justify-center w-5 shrink-0">
              <span className="text-lg font-black text-slate-300 dark:text-slate-600">×</span>
            </div>

            {/* C³ Cognition */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-violet-100 dark:border-violet-800/40 p-4 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 dark:bg-violet-400/5 rounded-full -mr-6 -mt-6 pointer-events-none" />
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-2xl font-black text-violet-600 dark:text-violet-400 leading-none">C<sup className="text-sm">3</sup></span>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/40 text-violet-500 dark:text-violet-400 border border-violet-100 dark:border-violet-700/40 uppercase tracking-wider shrink-0">Intent 확장</span>
              </div>
              <p className="text-[13px] font-black text-slate-800 dark:text-slate-100 mb-1">Cognition</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed break-keep">
                검색 키워드 이면의 <strong className="text-violet-600 dark:text-violet-400">검색 의도(Intent)</strong>를 확장 — 정보 탐색부터 전환까지 4단계 인지 유형으로 분류·분석합니다.
              </p>
            </div>
          </div>

          {/* 통합 설명 한 줄 */}
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-3 leading-relaxed">
            세 축의 교차점에서 <span className="text-indigo-500 dark:text-indigo-400 font-bold">최우선 전략 기회(Context × Conversion × Cognition)</span>를 자동 식별합니다
          </p>
        </div>

        <p className="text-base text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed break-keep text-center">
          키워드 하나를 입력하면 AI가 시장의
          <span className="text-indigo-600 dark:text-indigo-400 font-bold"> CEP(전략 진입점)</span>를 자동 추출하고,
          <span className="text-sky-600 dark:text-sky-400 font-bold"> CDJ Journey Ladder</span>로 전략 지도를 시각화합니다.
          <span className="text-emerald-600 dark:text-emerald-400 font-bold"> 5 Strategy Framework</span>으로 포지션을 분류하고,
          <span className="text-violet-600 dark:text-violet-400 font-bold"> Hub &amp; Spoke Triple Media</span> 전략(Owned·Earned·Paid × SEO·AEO·GEO)을 수립하며,
          <span className="text-rose-600 dark:text-rose-400 font-bold"> AEGIS FORGE</span>로 즉시 실행 가능한 콘텐츠를 단조합니다.
        </p>

        {/* 핵심 기능 칩 */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {[
            { label: 'CEP 분석',         color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700/30' },
            { label: 'CDJ Ladder',       color: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-700/30' },
            { label: '5 Strategy',       color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/30' },
            { label: 'Hub & Spoke',      color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700/30' },
            { label: 'SEO·AEO·GEO',     color: 'bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-700/30' },
            { label: 'AEGIS FORGE',      color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-700/30' },
            { label: 'Temporal Analysis',color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700/30' },
            { label: 'Brand SOV',        color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600/30' },
          ].map(({ label, color }) => (
            <span key={label} className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${color}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── 폼 카드 ── */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">

          {/* ── Step 1: 전장 설정 ── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-brand-sm overflow-hidden">
            {/* 스텝 헤더 */}
            <div className="flex items-center gap-3 px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/3">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-black text-white">01</span>
              </div>
              <div>
                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  Define Your Battle Field
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  분석할 카테고리와 브랜드를 입력하세요
                </p>
              </div>
            </div>

            {/* 입력 필드 */}
            <div className="p-8 space-y-5">
              {/* 카테고리 */}
              <div>
                <label htmlFor="category" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  Target Category <span className="text-rose-500">*</span>
                </label>
                <input
                  id="category"
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="분석할 카테고리 (예: 다이어트 식품, 남성 스킨케어, 클라우드 SaaS)..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-4 px-5 text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all"
                  required
                  autoFocus
                />
              </div>

              {/* 브랜드 + 경쟁사 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="brand" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    My Brand
                  </label>
                  <input
                    id="brand"
                    type="text"
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    placeholder="자사 브랜드명 (선택)..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 px-5 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="competitors" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Competitors
                    <span className="ml-2 text-slate-300 dark:text-slate-600 font-normal normal-case tracking-normal">쉼표로 구분</span>
                  </label>
                  <input
                    id="competitors"
                    type="text"
                    value={competitors}
                    onChange={e => setCompetitors(e.target.value)}
                    placeholder="주요 경쟁사 (쉼표로 구분)..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3.5 px-5 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all"
                  />
                  {/* 경쟁 강도 안내 */}
                  <div className="mt-2 flex items-start gap-1.5 px-1">
                    <svg className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
                      <span className="font-black text-slate-500 dark:text-slate-400">AI SOV 분석 안내</span>
                      {' '}— 경쟁사 수에 따라 개별 점유율이 달라질 수 있습니다.
                      전략 분류는 <span className="font-bold">경쟁사 수를 고려한 상대적 위치(Relative Position)</span>로
                      자동 보정되어 1:1·1:n 구조 모두 공정하게 평가합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Step 2: 소스·기간 설정 ── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-brand-sm overflow-hidden">
            {/* 스텝 헤더 */}
            <div className="flex items-center gap-3 px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/3">
              <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">02</span>
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Configure Data Source &amp; Scope
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  소스 분석 레벨과 분석 기간을 설정하세요
                </p>
              </div>
            </div>

            <div className="p-8">
              <SearchConfigPanel />
            </div>
          </div>

          {/* ── Execute 버튼 ── */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-5 rounded-2xl text-base font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group ${
              canSubmit
                ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-brand-lg hover:shadow-brand-glow hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            {/* 글로우 오버레이 */}
            {canSubmit && (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-white/10 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            )}

            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Intelligence Core 초기화 중...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {disabled
                  ? '소스를 최소 1개 이상 활성화하세요'
                  : !category.trim()
                    ? '카테고리를 입력하세요'
                    : '전장 분석 시작 (Execute)'}
              </span>
            )}
          </button>

          {/* 하단 안내 */}
          <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 pb-2">
            소스 레벨과 기간 설정 완료 후 실행하세요 · 분석에는 20-60초 소요됩니다
          </p>
        </div>
      </form>
    </div>
  );
};

export default BattleFieldForm;
