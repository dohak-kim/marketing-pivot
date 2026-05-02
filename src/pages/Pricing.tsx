import React, { useState } from 'react';

export default function Pricing() {
  const [submitted, setSubmitted] = useState(false);
  const plans = [
    { name: 'Free', price: '무료', desc: '개인 탐색용', features: ['AEGIS Pathfinder', 'AEGIS Signal', '월 10회 분석'], cta: '무료 시작', highlight: false },
    { name: 'Pro', price: '₩49,000', period: '/월', desc: '마케터·스타트업', features: ['C³ Cube Strategy 전체 기능', 'AESA Radar', 'Video AEO/GEO', '무제한 분석', 'PDF 내보내기'], cta: '도입 문의', highlight: true },
    { name: 'Enterprise', price: '문의', desc: 'B2B 맞춤 도입', features: ['전 기능 + 커스텀', '전담 온보딩', 'API 연동 지원', 'SLA 보장', '맞춤 컨설팅'], cta: '제안서 요청', highlight: false },
  ];
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">S — Sales · Pricing</span>
          <h1 className="text-4xl font-black text-white mt-3 mb-3">요금제</h1>
          <p className="text-slate-400 text-sm">구독형과 구축형 중 목적에 맞게 선택하세요.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map(p => (
            <div key={p.name} className={`flex flex-col p-8 rounded-3xl border ${p.highlight ? 'bg-indigo-950/50 border-indigo-500/40 ring-1 ring-indigo-500/20' : 'bg-slate-900 border-white/5'}`}>
              {p.highlight && <div className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">추천</div>}
              <h2 className="text-lg font-black text-white mb-1">{p.name}</h2>
              <p className="text-slate-400 text-xs mb-4">{p.desc}</p>
              <div className="text-3xl font-black text-white mb-1">{p.price}<span className="text-sm text-slate-400 font-medium">{p.period}</span></div>
              <div className="h-px bg-white/5 my-5" />
              <ul className="space-y-2 flex-1 mb-8">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-emerald-400">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button className={`py-3 rounded-xl font-black text-sm transition-all ${p.highlight ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'}`}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        {/* 리드 수집 폼 */}
        <div className="p-10 rounded-3xl bg-slate-900 border border-white/5">
          <h3 className="text-xl font-black text-white mb-2">도입 문의</h3>
          <p className="text-slate-400 text-sm mb-6 break-keep">맞춤 제안이 필요하신가요? 연락처를 남겨주시면 24시간 내 연락드립니다.</p>
          {submitted ? (
            <div className="text-center py-8 text-emerald-400 font-bold">✓ 문의가 접수되었습니다. 감사합니다.</div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[['회사명', 'company', 'text'], ['담당자명', 'name', 'text'], ['이메일', 'email', 'email'], ['연락처', 'phone', 'tel']].map(([label, name, type]) => (
                <div key={name}>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">{label}</label>
                  <input type={type} required placeholder={`${label} 입력`}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/5 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1.5">문의 내용</label>
                <textarea rows={3} placeholder="도입 목적, 규모, 요청사항 등을 자유롭게 적어주세요."
                  className="w-full px-4 py-3 bg-slate-800 border border-white/5 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all">
                  문의 보내기
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
