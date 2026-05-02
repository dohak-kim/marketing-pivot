
import React from 'react';

interface GuideModalProps {
  onClose: () => void;
}

const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  const steps = [
    {
      n: '01',
      title: 'Battle Field 설정',
      sub: 'Define Your Battle Field',
      desc: '분석할 카테고리·브랜드·경쟁사를 입력하고, 소스 분석 레벨(Lv.1~5)과 분석 기간을 설정합니다. 비교 모드에서는 Period A·B 각각의 시작일·종료일을 지정할 수 있습니다.',
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      border: 'border-sky-200 dark:border-sky-500/30',
    },
    {
      n: '02',
      title: 'C³ 인텔리전스 추출',
      sub: 'Context Extraction + Journey Ladder',
      desc: 'Gemini AI가 Google·Naver SERP 데이터를 분석하여 시맨틱 클러스터(CEP)를 최대 15개 추출합니다. 결과는 C³ Journey Ladder(인지→고려→구매결정→구매후관리 4컬럼)로 시각화되며, 각 CEP 카드에서 Priority Score·Cognition·키워드 속성을 계층적으로 확인할 수 있습니다.',
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      border: 'border-indigo-200 dark:border-indigo-500/30',
    },
    {
      n: '03',
      title: '전략 방향 수립',
      sub: 'Triple Media × Hub & Spoke',
      desc: '5가지 전략 방향이 자동 분류됩니다. AI가 Hub(Owned Media) × SEO·AEO·GEO 3중 최적화 + Spoke 1(Earned) + Spoke 2(Paid) 구조로 트리플 미디어 실행 계획을 생성합니다. Earned·Paid 각각의 최적화 레이어 기여도(GEO 브랜드 인용, SEM 광고 커버 등)도 함께 표시됩니다.',
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      border: 'border-violet-200 dark:border-violet-500/30',
    },
    {
      n: '04',
      title: 'AEGIS FORGE',
      sub: 'Content Forging',
      desc: 'C³ 인텔리전스와 전략 방향을 기반으로 미디어 유형·서브타입·톤앤매너·분량을 설정하면 SEO·AEO·GEO 최적화 콘텐츠를 생성합니다. 콘텐츠 품질 지표(0~100)를 자동 평가합니다.',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-200 dark:border-rose-500/30',
    },
    {
      n: '05',
      title: 'Temporal Intelligence',
      sub: 'Period Comparison',
      desc: '두 기간의 분석 결과를 Sankey 다이어그램으로 비교합니다. 성장·쇠퇴·신규출현·소멸 Context를 한눈에 파악하고, AEO·GEO 관점의 AI 시사점을 도출합니다.',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-500/30',
    },
  ];

  const intentGuides = [
    { name: 'Informational', sub: '콘텐츠 제작', icon: '💡', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200 dark:border-sky-500/20', desc: '"알고 싶어요" — 지식·방법을 구하는 단계. AEO FAQ + SEO 롱폼 허브 콘텐츠가 최적입니다.' },
    { name: 'Exploratory', sub: '비교·가이드', icon: '🔍', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-500/20', desc: '"비교하고 싶어요" — 브랜드·제품을 탐색하는 단계. Spoke 지원 아티클과 비교 가이드가 효과적입니다.' },
    { name: 'Commercial', sub: 'USP·메시지', icon: '⚖️', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-500/20', desc: '"구매할 만한가요?" — 구매 전 대안을 비교하는 단계. GEO 엔티티 콘텐츠 + USP 강조 광고소재.' },
    { name: 'Transactional', sub: '전환·오퍼', icon: '🛒', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-500/20', desc: '"지금 사고 싶어요" — 즉각적 행동 의도. 랜딩페이지 카피 + 강력한 CTA 광고소재.' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="shrink-0 px-8 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/3 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              C³ Cube Strategy Model
              <span className="ml-3 text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                Platform Guide
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Context · Conversion · Cognition — AEGIS Intelligence System v2.6</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Workflow */}
            <div className="lg:col-span-1 space-y-6">
              <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">워크플로우 (5단계)</div>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${step.bg} ${step.border} group transition-all hover:-translate-y-0.5`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] font-black font-mono ${step.color}`}>{step.n}</span>
                      <div>
                        <div className={`text-[11px] font-black ${step.color}`}>{step.title}</div>
                        <div className="text-[9px] text-slate-400 dark:text-slate-500">{step.sub}</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cognition Guide */}
            <div className="lg:col-span-2 space-y-6">
              <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">Neural Cognition Mapping — 다차원 인지 분석</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {intentGuides.map((intent, i) => (
                  <div key={i} className={`p-5 rounded-2xl border ${intent.bg} ${intent.border} hover:shadow-sm transition-all group`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xl">{intent.icon}</span>
                      <div>
                        <h4 className={`text-sm font-black uppercase tracking-wide ${intent.color}`}>{intent.name}</h4>
                        <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">{intent.sub}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{intent.desc}</p>
                  </div>
                ))}
              </div>

              {/* Cognition Intensity note */}
              <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">인지 강도(Intensity) vs 비중 해석 가이드</h4>
                </div>
                <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
                  각 Context의 인지 수치(%)는 단순한 비중이 아닌 <span className="font-black">강도(Intensity)</span>를 의미합니다.
                  하나의 Context가 강한 'Informational' 인지와 동시에 강한 'Commercial' 인지를 가질 수 있어 <span className="font-black underline">수치의 총합이 100%를 초과</span>할 수 있습니다.
                  이는 소비자 인지 구조의 복합성을 보여주는 핵심 전략 지표입니다.
                </p>
              </div>

              {/* FORGE + Hub & Spoke flow */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">C³ 전략 선순환 구조 — Journey Ladder → FORGE → Hub & Spoke</div>
                <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold">
                  {['Journey Ladder', '→', '전략 방향', '→', 'FORGE 단조', '→', 'Hub(Owned)', '→', 'Spoke(Earned+Paid)', '→', 'AI 검색 권위 축적', '→', 'Temporal 재분석'].map((item, i) => (
                    <span key={i} className={item === '→' ? 'text-slate-300 dark:text-slate-600' : 'px-2 py-1 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-sm'}>
                      {item}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                  CDJ Journey Ladder에서 시장 구조를 파악 → FORGE로 Hub 콘텐츠 단조 → Earned·Paid Spoke로 앰플리파이 → Temporal로 기간별 변화 추적 → 재분류. 이 루프가 반복될수록 브랜드의 SEO·AEO·GEO 권위가 복리로 축적됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-8 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/3 text-center">
          <button
            onClick={onClose}
            className="px-12 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            이해했습니다
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
