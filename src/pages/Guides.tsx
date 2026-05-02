import React from 'react';
import { Link } from 'react-router-dom';

const GuidesSchema = () => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "AEO 최적화란 무엇인가요?",
        "acceptedAnswer": { "@type": "Answer", "text": "Answer Engine Optimization의 약자로, ChatGPT·Perplexity·Google AI Overview 등 AI 답변 엔진이 귀사를 신뢰할 수 있는 출처로 인용하도록 콘텐츠를 구조화하는 최적화 방법론입니다." }},
      { "@type": "Question", "name": "CEP(Category Entry Point)란 무엇인가요?",
        "acceptedAnswer": { "@type": "Answer", "text": "소비자가 특정 카테고리를 탐색할 때 브랜드를 떠올리는 심리적 맥락 단서입니다. C³ Cube Strategy는 CEP를 실측 SERP 데이터로 분석해 전략적 기회를 도출합니다." }},
    ]
  })}} />
);

export default function Guides() {
  const guides = [
    { icon: '🔍', title: 'AEO/GEO 최적화 입문 가이드', desc: 'AI 검색 시대의 새로운 최적화 기준을 이해합니다.', badge: '입문', path: '#' },
    { icon: '🗺️', title: 'CDJ 여정 분석 실전 가이드', desc: '고객 구매여정 5단계를 데이터로 진단하는 방법.', badge: '실전', path: '#' },
    { icon: '📡', title: 'CEP 전략 수립 가이드', desc: '맥락적 진입점을 발견하고 브랜드 점유율을 높이는 전략.', badge: '전략', path: '#' },
    { icon: '⚡', title: 'C³ Cube 활용 가이드', desc: 'Context×Conversion×Cognition 큐브 전략 모델 완전 정복.', badge: '심화', path: '#' },
  ];
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <GuidesSchema />
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">A — Acquisition</span>
          <h1 className="text-4xl font-black text-white mt-3 mb-3">마케팅 가이드</h1>
          <p className="text-slate-400 text-sm leading-relaxed">AI 기반 마케팅 전략의 핵심 개념과 실전 활용법을 무료로 제공합니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          {guides.map(g => (
            <Link key={g.title} to={g.path} className="group p-6 rounded-2xl bg-slate-900 border border-white/5 hover:border-indigo-500/30 transition-all">
              <div className="flex items-start gap-4">
                <span className="text-2xl">{g.icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors">{g.title}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{g.badge}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{g.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {/* Coming Soon */}
        <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 text-center">
          <p className="text-slate-500 text-sm">더 많은 가이드가 곧 공개됩니다. 알림을 받으시려면 뉴스레터를 구독하세요.</p>
          <Link to="/pricing" className="inline-block mt-4 px-6 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 text-sm font-bold rounded-xl transition-all">도입 문의하기</Link>
        </div>
      </div>
    </div>
  );
}
