import React from 'react';

export default function Blog() {
  const posts = [
    { icon: '📊', category: 'AEO 인사이트', title: 'AI 검색 시대, 브랜드가 살아남는 방법', date: '2026.05', badge: 'Coming Soon' },
    { icon: '🗺️', category: 'CDJ 전략', title: 'CDJ 5단계 여정 분석 실전 사례', date: '2026.05', badge: 'Coming Soon' },
    { icon: '⚡', category: 'C³ Cube', title: 'CEP 기반 전략과 기존 키워드 전략의 차이', date: '2026.05', badge: 'Coming Soon' },
  ];
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">G — Generation</span>
          <h1 className="text-4xl font-black text-white mt-3 mb-3">인사이트 리포트</h1>
          <p className="text-slate-400 text-sm leading-relaxed">AI 검색 최적화(AEO·GEO)와 마케팅 전략에 관한 실증 데이터 기반 인사이트를 공유합니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {posts.map(p => (
            <div key={p.title} className="p-6 rounded-2xl bg-slate-900 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-emerald-400 font-bold">{p.category}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-500">{p.badge}</span>
              </div>
              <div className="text-2xl mb-3">{p.icon}</div>
              <h2 className="text-sm font-black text-white mb-2 break-keep leading-snug">{p.title}</h2>
              <p className="text-[10px] text-slate-500">{p.date}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 p-8 rounded-3xl bg-slate-900/50 border border-white/5 text-center">
          <p className="text-slate-400 text-sm break-keep">
            Marketing Pivot 책의 챕터별 인사이트와 Project AEGIS 개발 스토리가 곧 공개됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
