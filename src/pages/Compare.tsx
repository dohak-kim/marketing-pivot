import React from 'react';
import { Link } from 'react-router-dom';

export default function Compare() {
  const rows = [
    { item: '데이터 기반', classic: '경험·직관', aegis: '실측 SERP·Naver API' },
    { item: '전략 도출', classic: '수동 프레임워크', aegis: 'AI 자동 분석·클러스터링' },
    { item: 'AI 검색 대응', classic: '없음', aegis: 'AEO·GEO 최적화 내장' },
    { item: '콘텐츠 생성', classic: '별도 작업', aegis: 'FORGE 자동 생성' },
    { item: '업데이트 주기', classic: '분기·반기', aegis: '실시간·온디맨드' },
    { item: '비용', classic: '컨설팅 고정비', aegis: '구독형·사용량 기반' },
  ];
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">E — Engagement</span>
          <h1 className="text-4xl font-black text-white mt-3 mb-3">기존 방식 vs Project AEGIS</h1>
          <p className="text-slate-400 text-sm leading-relaxed">전통적 마케팅 전략 수립 방식과 AI 기반 AEGIS의 핵심 차이를 비교합니다.</p>
        </div>
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-12">
          <div className="grid grid-cols-3 bg-slate-800">
            {['비교 항목', '기존 방식', 'Project AEGIS'].map((h, i) => (
              <div key={h} className={`px-5 py-3 text-xs font-black uppercase tracking-widest ${i === 2 ? 'text-indigo-300' : 'text-slate-400'}`}>{h}</div>
            ))}
          </div>
          {rows.map((r, i) => (
            <div key={r.item} className={`grid grid-cols-3 border-t border-white/5 ${i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}`}>
              <div className="px-5 py-4 text-sm font-bold text-slate-300">{r.item}</div>
              <div className="px-5 py-4 text-sm text-slate-500">{r.classic}</div>
              <div className="px-5 py-4 text-sm text-emerald-400 font-medium">{r.aegis}</div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link to="/product" className="inline-block px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all">솔루션 자세히 보기 →</Link>
        </div>
      </div>
    </div>
  );
}
