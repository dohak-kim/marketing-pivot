import React from 'react';
import { Link } from 'react-router-dom';

const ProductSchema = () => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    "name": "Project AEGIS — C³ Cube Strategy",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "실측 SERP 데이터 기반 CEP 분석·전략 수립·콘텐츠 생성 통합 마케팅 인텔리전스 플랫폼",
    "offers": { "@type": "Offer", "priceCurrency": "KRW", "price": "0", "description": "무료 체험 제공" },
    "author": { "@type": "Person", "name": "김도학" }
  })}} />
);

export default function Product() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <ProductSchema />
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">S — Sales</span>
          <h1 className="text-4xl font-black text-white mt-3 mb-3">Project AEGIS 솔루션</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl break-keep">
            마케팅 전략 수립부터 AI 검색 최적화까지, 단계별로 선택하거나 통합 패키지로 도입하세요.
          </p>
        </div>

        {/* 3개 솔루션 카드 */}
        {[
          { badge: 'Classic', color: 'border-blue-500/30', icon: '📡', name: 'AEGIS AESA Radar', tagline: '전통 마케팅 프레임워크의 데이터 기반 혁신', features: ['시장 규모 자동 분석', 'PEST·3C·SWOT·STP', '경쟁 포지셔닝 맵', '전략 보고서 PDF'], path: '/tools/aesa' },
          { badge: 'Flagship', color: 'border-indigo-500/30 ring-1 ring-indigo-500/20', icon: '⚡', name: 'AEGIS C³ Cube Strategy', tagline: 'CEP·CDJ·Intent 통합 마케팅 인텔리전스 (C³ Cube Strategy)', features: ['실측 SERP 데이터 (Serper·Naver)', 'CEP 자동 클러스터링', 'Hub & Spoke 미디어 전략', 'AEGIS FORGE 콘텐츠 생성', '4종 내보내기 (CSV·JSON·MD·PDF)'], path: '/tools/c3' },
          { badge: 'Next-Gen', color: 'border-emerald-500/30', icon: '🎬', name: 'AEGIS Vision', tagline: '멀티모달 영상 콘텐츠 AEO/GEO 최적화 진단', features: ['OCR·STT 멀티모달 분석', '플랫폼별 AEO 스코어링', 'Top 3 Action Items', 'PDF 진단 리포트'], path: '/tools/video' },
        ].map(p => (
          <div key={p.name} className={`mb-6 p-8 rounded-3xl bg-slate-900 border ${p.color}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{p.badge}</span>
                  <h2 className="text-xl font-black text-white mt-0.5 mb-1">{p.name}</h2>
                  <p className="text-slate-400 text-sm mb-4 break-keep">{p.tagline}</p>
                  <ul className="flex flex-wrap gap-2">
                    {p.features.map(f => (
                      <li key={f} className="text-xs text-slate-300 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-indigo-400" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link to={p.path} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-xl transition-all whitespace-nowrap text-center">
                  바로 사용하기 →
                </Link>
                <Link to="/pricing" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-xl transition-all whitespace-nowrap text-center">
                  요금제 보기
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* FAQ */}
        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-black text-white mb-6">자주 묻는 질문</h3>
          {[
            { q: '바로 사용할 수 있나요?', a: '네, API 키(Gemini, Serper)를 준비하면 즉시 사용 가능합니다. 온보딩 가이드를 제공합니다.' },
            { q: '기업 맞춤 컨설팅도 가능한가요?', a: '가능합니다. 도입 문의 폼을 통해 요청해 주시면 맞춤 제안을 드립니다.' },
          ].map(f => (
            <div key={f.q} className="p-5 rounded-xl bg-slate-900 border border-white/5">
              <p className="text-sm font-black text-white mb-1"><span className="text-indigo-400">Q.</span> {f.q}</p>
              <p className="text-slate-400 text-sm pl-5"><span className="text-slate-500 font-bold">A.</span> {f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
