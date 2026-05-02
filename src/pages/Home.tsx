import React from 'react';
import { Link } from 'react-router-dom';

// ── Schema: Organization + WebSite (AEO/GEO 기반 엔티티 선언) ──────────────
const OrgSchema = () => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Marketing Pivot",
    "url": "https://marketing-pivot.com",
    "description": "AI 기반 마케팅 전략 플랫폼 — From Classic to Drastic",
    "founder": { "@type": "Person", "name": "김도학", "jobTitle": "Marketing Architect, Ph.D." },
    "sameAs": ["https://github.com/dohak-kim/-project-aegis"]
  })}} />
);

// ── 섹션: Hero ──────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden">
    {/* 배경 그라디언트 */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-slate-950 to-slate-950" />
    <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />

    <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8">
        Project AEGIS · Marketing Intelligence Platform
      </div>
      <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none mb-6">
        Marketing<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Pivot</span>
      </h1>
      <p className="text-xl md:text-2xl text-slate-300 font-medium mb-4 break-keep leading-relaxed">
        From <span className="text-blue-400 font-black">Classic</span> to <span className="text-indigo-400 font-black">Drastic</span>
      </p>
      <p className="text-base text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed break-keep">
        30년 마케팅 현장 경험과 AI를 융합한 차세대 전략 프레임워크.<br />
        전통적 마케팅의 한계를 넘어, 생성형 AI 검색 시대의 새로운 기준을 제시합니다.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/product" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-base transition-all shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.4)]">
          솔루션 보기 →
        </Link>
        <Link to="/guides" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl text-base transition-all">
          무료 가이드
        </Link>
      </div>
    </div>

    {/* 스크롤 인디케이터 */}
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
      <span className="text-[10px] font-bold uppercase tracking-widest">Scroll</span>
      <div className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent" />
    </div>
  </section>
);

// ── 섹션: AEGIS 프레임워크 A→E→G→I→S ──────────────────────────────────────
const AegisFramework = () => {
  const steps = [
    { key: 'A', label: 'Acquisition', desc: '정보 탐색 트래픽 확보', color: 'from-blue-500 to-blue-600', page: '/guides' },
    { key: 'E', label: 'Engagement', desc: '솔루션 도입 판단 지원', color: 'from-violet-500 to-violet-600', page: '/compare' },
    { key: 'G', label: 'Generation', desc: 'AI 검색 인용 최적화', color: 'from-emerald-500 to-emerald-600', page: '/blog' },
    { key: 'I', label: 'Intelligence', desc: 'CDJ·CEP 구매경로 분석', color: 'from-amber-500 to-amber-600', page: '/tools/c3' },
    { key: 'S', label: 'Sales', desc: '확신→리스크 제거→전환', color: 'from-rose-500 to-rose-600', page: '/pricing' },
  ];
  return (
    <section className="py-24 bg-slate-900">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Core Framework</span>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-4">AEGIS 고객여정 엔진</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed break-keep">
            방문자의 구매여정 5단계에 1:1로 대응하는 콘텐츠·전략·전환 시스템
          </p>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {steps.map((s, i) => (
            <Link key={s.key} to={s.page} className="group relative flex flex-col items-center text-center p-6 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl font-black text-white mb-3 shadow-lg`}>
                {s.key}
              </div>
              <div className="text-xs font-black text-white mb-1">{s.label}</div>
              <div className="text-[10px] text-slate-400 leading-snug">{s.desc}</div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-600 text-lg z-10">→</div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── 섹션: 서비스 3종 ──────────────────────────────────────────────────────
const Services = () => {
  const services = [
    {
      badge: 'Classic',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: '📡',
      name: 'AEGIS Radar',
      desc: '전통적 마케팅 프레임워크(PEST·3C·SWOT·STP)를 온라인 실측 데이터(Naver News·DataLab) 기반으로 자동 분석합니다.',
      features: ['시장규모 자동 분석', 'PEST·3C·SWOT', 'STP 전략 도출', 'PDF 보고서'],
      cta: '무료 분석 시작',
      path: '/tools/aesa',
      border: 'border-blue-500/20',
    },
    {
      badge: 'Flagship',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      icon: '⚡',
      name: 'AEGIS Cube',
      desc: 'Context × Conversion × Cognition 큐브 전략 모델. 실측 SERP 데이터 기반 CEP 분석부터 Hub & Spoke 미디어 전략, FORGE 콘텐츠 생성까지 원스톱.',
      features: ['실측 SERP 데이터', 'CEP 클러스터링', 'Hub & Spoke 전략', 'AEGIS FORGE'],
      cta: '전략 분석 시작',
      path: '/tools/c3',
      border: 'border-indigo-500/20',
      highlight: true,
    },
    {
      badge: 'Next-Gen',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: '🎬',
      name: 'AEGIS Vision',
      desc: '영상 콘텐츠의 멀티모달(OCR·STT) 신호를 분석해 AEO·GEO 최적화 점수와 개선 방향을 제시합니다.',
      features: ['OCR·STT 분석', '플랫폼별 스코어링', 'Action Items', 'PDF 진단 리포트'],
      cta: '영상 진단 시작',
      path: '/tools/video',
      border: 'border-emerald-500/20',
    },
  ];
  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Solutions</span>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-4">Project AEGIS 솔루션</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm break-keep leading-relaxed">
            Classic에서 Drastic으로, 그리고 미래로 — 단계별 마케팅 인텔리전스 도구
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map(s => (
            <div key={s.name} className={`relative flex flex-col p-8 rounded-3xl bg-slate-900 border ${s.border} ${s.highlight ? 'ring-1 ring-indigo-500/30' : ''}`}>
              {s.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                  대표 솔루션
                </div>
              )}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider mb-4 w-fit ${s.badgeColor}`}>
                {s.badge}
              </div>
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="text-xl font-black text-white mb-3">{s.name}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 break-keep flex-1">{s.desc}</p>
              <ul className="space-y-2 mb-8">
                {s.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link to={s.path} className={`text-center py-3 px-6 rounded-xl font-black text-sm transition-all ${s.highlight ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
                {s.cta} →
              </Link>
            </div>
          ))}
        </div>
        {/* 보조 도구 */}
        <div className="mt-8 p-6 rounded-2xl bg-slate-900/50 border border-white/5">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">C³ Cube 프로토타입 도구 (무료)</p>
          <div className="flex flex-wrap gap-3">
            {[{ name: 'AEGIS Pathfinder', desc: 'CDJ 여정 분석', path: '/tools/pathfinder', color: 'text-amber-400' },
              { name: 'AEGIS Signal',     desc: 'CEP 트렌드 분석', path: '/tools/signal', color: 'text-violet-400' }].map(t => (
              <Link key={t.name} to={t.path} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 transition-all">
                <span className={`text-xs font-black ${t.color}`}>{t.name}</span>
                <span className="text-[10px] text-slate-500">{t.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ── 섹션: 저자 소개 ──────────────────────────────────────────────────────
const Author = () => (
  <section className="py-24 bg-slate-900">
    <div className="max-w-4xl mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center gap-12">
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-5xl shrink-0 shadow-2xl">
          🛡️
        </div>
        <div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Author & Developer</span>
          <h2 className="text-2xl font-black text-white mt-2 mb-1">김도학 <span className="text-slate-400 font-medium text-lg">Ph.D.</span></h2>
          <p className="text-indigo-400 text-sm font-bold mb-4">Marketing Architect · Project AEGIS 개발자</p>
          <p className="text-slate-300 text-sm leading-relaxed break-keep mb-6">
            30년 마케팅 현장 경험을 바탕으로 AI·데이터 기반의 차세대 마케팅 프레임워크를 연구·개발하고 있습니다.
            전통적 마케팅의 정수를 살리면서도 생성형 AI 검색 시대(AEO·GEO)에 최적화된
            실천적 전략 모델 <strong className="text-white">「Marketing Pivot」</strong>을 집필 중이며,
            이를 실증하는 플랫폼이 <strong className="text-white">Project AEGIS</strong>입니다.
          </p>
          <div className="flex flex-wrap gap-2">
            {['마케팅 전략', 'AI·데이터 분석', 'AEO/GEO 최적화', 'CDJ·CEP 프레임워크', 'B2B 컨설팅'].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-slate-800 border border-white/5 text-slate-300 text-xs font-medium">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── 섹션: FAQ (FAQPage Schema 포함) ──────────────────────────────────────
const HomeFAQ = () => {
  const faqs = [
    { q: 'Marketing Pivot이란 무엇인가요?', a: 'AI·데이터 기반으로 전통 마케팅 방법론(Classic)을 혁신적 전략(Drastic)으로 전환하는 실천 프레임워크입니다. 저자 김도학 박사가 30년 현장 경험을 집대성한 책이자, Project AEGIS를 통해 실증되는 방법론입니다.' },
    { q: 'Project AEGIS는 어떤 솔루션인가요?', a: 'Marketing Pivot 방법론을 AI로 구현한 마케팅 인텔리전스 플랫폼입니다. AESA Radar(전통 분석), C³ Cube Strategy(CEP·CDJ·Intent 통합 전략), Video AEO/GEO Analyzer(멀티모달 최적화) 등 5개 도구로 구성됩니다.' },
    { q: 'AEO/GEO 최적화가 왜 필요한가요?', a: '검색의 패러다임이 Google 검색에서 ChatGPT·Perplexity 등 답변 엔진(Answer Engine)으로 이동하고 있습니다. AEO(Answer Engine Optimization)와 GEO(Generative Engine Optimization)는 AI가 귀사를 신뢰할 수 있는 출처로 인용하도록 최적화하는 새로운 기준입니다.' },
    { q: '무료로 사용할 수 있나요?', a: '현재 AEGIS Pathfinder(CDJ 분석)와 AEGIS Signal(CEP 분석)은 무료로 이용할 수 있습니다. C³ Cube Strategy와 AESA Radar의 고급 기능은 유료 플랜에서 제공됩니다.' },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };

  return (
    <section className="py-24 bg-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">FAQ</span>
          <h2 className="text-2xl font-black text-white mt-3">자주 묻는 질문</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="p-6 rounded-2xl bg-slate-900 border border-white/5">
              <h3 className="text-sm font-black text-white mb-2 flex items-start gap-2">
                <span className="text-indigo-400 shrink-0">Q.</span>{f.q}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed pl-5 break-keep">
                <span className="text-slate-500 font-bold mr-1">A.</span>{f.a}
              </p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/faq" className="text-indigo-400 hover:text-indigo-300 text-sm font-bold transition-colors">
            더 많은 질문 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
};

// ── 섹션: CTA ────────────────────────────────────────────────────────────
const CTA = () => (
  <section className="py-24 bg-gradient-to-br from-indigo-950 to-slate-950 border-t border-white/5">
    <div className="max-w-3xl mx-auto px-6 text-center">
      <h2 className="text-3xl md:text-4xl font-black text-white mb-4 break-keep">
        지금 내 브랜드에 맞는<br />AEGIS 솔루션을 시작하세요
      </h2>
      <p className="text-slate-400 mb-10 text-sm leading-relaxed break-keep">
        Classic 분석부터 Drastic 전략, 그리고 AI 검색 최적화까지<br />
        Marketing Pivot 여정을 함께합니다.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/pricing" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-[0_0_40px_rgba(99,102,241,0.3)]">
          요금제 및 도입 문의
        </Link>
        <Link to="/tools/aesa" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all">
          무료로 시작하기
        </Link>
      </div>
    </div>
  </section>
);

// ── 메인 홈 ──────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      <OrgSchema />
      <Hero />
      <AegisFramework />
      <Services />
      <Author />
      <HomeFAQ />
      <CTA />
    </>
  );
}
