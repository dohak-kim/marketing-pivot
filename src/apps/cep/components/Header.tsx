
import React, { useState } from 'react';

interface HeaderProps {
  isLightMode?: boolean;
  onToggleLightMode?: () => void;
  onPrint?: () => void;
  showPrintControls?: boolean;
  version?: string;
}

const Header: React.FC<HeaderProps> = ({ isLightMode, onToggleLightMode, onPrint, showPrintControls, version = "Ver.1.0" }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuContent: { [key: string]: { title: string; content: React.ReactNode } } = {
    intro: {
      title: "시스템 소개 (System Information)",
      content: (
        <div className="space-y-4 text-sm leading-relaxed">
          <p className="font-medium">본 솔루션은 빅데이터와 생성형 AI를 결합하여 기업의 디지털 마케팅 전략을 자동화하는 전문가용 도구입니다.</p>
          <div className={`p-4 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
            <h5 className="font-black text-sky-500 mb-2 uppercase text-xs tracking-widest">Core Intelligence</h5>
            <ul className="space-y-2 text-xs opacity-80">
              <li>✔ 카테고리 진입 접점(CEP) 규명</li>
              <li>✔ 타겟 페르소나 및 고통점(Pain Point) 클러스터링</li>
              <li>✔ AI 답변 엔진 최적화(AEO) 콘텐츠 자동 생성</li>
            </ul>
          </div>
          <div className="pt-4 border-t border-slate-700/50">
            <div className="grid grid-cols-2 gap-x-4 text-[11px]">
              <span className="opacity-60">개발자:</span> <span className="font-bold">KIM DO HAK</span>
              <span className="opacity-60">버전:</span> <span className="font-bold">{version}</span>
            </div>
          </div>
        </div>
      )
    },
    usage: {
      title: "사용 방법 (Step-by-Step Guide)",
      content: (
        <div className="space-y-5 text-sm leading-relaxed">
          <section className="flex gap-4">
            <div className="bg-sky-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xs">1</div>
            <div>
              <h5 className="font-bold">키워드 분석</h5>
              <p className="text-xs opacity-60">분석할 키워드를 입력하고 데이터 볼륨(해상도)을 설정하세요.</p>
            </div>
          </section>
          <section className="flex gap-4">
            <div className="bg-sky-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xs">2</div>
            <div>
              <h5 className="font-bold">CEP 및 타겟 클러스터 검토</h5>
              <p className="text-xs opacity-60">도출된 상세 상황과 페인포인트를 기반으로 시장 결핍을 파악하세요.</p>
            </div>
          </section>
          <section className="flex gap-4">
            <div className="bg-sky-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xs">3</div>
            <div>
              <h5 className="font-bold">AEO 콘텐츠 제작</h5>
              <p className="text-xs opacity-60">AI 엔진이 채택하기 좋은 최적화 콘텐츠를 생성하고 진단 받으세요.</p>
            </div>
          </section>
        </div>
      )
    },
    interpret: {
      title: "해석 가이드 및 용어 사전 (Intelligence Guide)",
      content: (
        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-8 text-sm leading-relaxed">
          {/* 주요 지표 해석 */}
          <section className="space-y-4">
            <div className="space-y-2">
              <h5 className="font-black text-emerald-400 border-b border-emerald-400/20 pb-1 uppercase tracking-tighter">CDJ MASTER 4단계</h5>
              <div className="grid grid-cols-1 gap-1 text-[11px] opacity-80">
                <p><strong>• 인지(Awareness)</strong>: '무엇인가?', '정의' 위주의 정보성 검색 단계</p>
                <p><strong>• 고려(Consideration)</strong>: '추천', '비교' 위주의 탐색성/상업성 검색 단계</p>
                <p><strong>• 결정(Decision)</strong>: '가격', '구매' 위주의 상업성/전환성 검색 단계</p>
                <p><strong>• 사후 관리(Post-Mng)</strong>: '사용법', 'AS' 위주의 정보성/탐색성 검색 단계</p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-black text-sky-400 border-b border-sky-400/20 pb-1 uppercase tracking-tighter">검색 의도 4유형</h5>
              <div className="grid grid-cols-1 gap-1 text-[11px] opacity-80">
                <p><strong>• 정보성</strong>: 지식 습득 목적 ("~방법", "~뜻")</p>
                <p><strong>• 탐색성</strong>: 특정 장소나 사이트 방문 목적 ("~사이트", "~위치")</p>
                <p><strong>• 상업성</strong>: 구매 전 제품 조사 목적 ("~추천", "~비교")</p>
                <p><strong>• 전환성</strong>: 즉각적 구매/행동 목적 ("~구매", "~예약")</p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-black text-purple-400 border-b border-purple-400/20 pb-1 uppercase tracking-tighter">CEP 4대 요소</h5>
              <p className="text-[11px] opacity-80">소비자가 카테고리에 진입하는 순간을 <strong>상황(When), 장소(Where), 목적(Why), 동반자(With)</strong>의 4차원으로 분석하여 맥락을 규명합니다.</p>
            </div>
          </section>

          {/* 용어 사전 섹션 (하단 배치) */}
          <section className={`p-5 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700'}`}>
            <h5 className="font-black text-slate-400 mb-4 uppercase text-[10px] tracking-widest">전문 용어 사전 (Glossary)</h5>
            <dl className="space-y-4">
              <div>
                <dt className="text-sky-500 font-black text-xs">CEP (Category Entry Point)</dt>
                <dd className="text-[10px] opacity-70 mt-1">소비자가 특정 욕구가 생겼을 때 브랜드를 떠올리게 하는 정신적 가용성 접점입니다.</dd>
              </div>
              <div>
                <dt className="text-purple-500 font-black text-xs">AEO (Answer Engine Optimization)</dt>
                <dd className="text-[10px] opacity-70 mt-1">AI 답변 엔진(SearchGPT 등)이 콘텐츠를 정답으로 채택하도록 구조와 엔티티를 최적화하는 전략입니다.</dd>
              </div>
              <div>
                <dt className="text-emerald-500 font-black text-xs">Entity (엔티티)</dt>
                <dd className="text-[10px] opacity-70 mt-1">단순 키워드를 넘어 고유한 속성을 가진 대상(데이터, 명칭 등)입니다. AI는 이들의 관계를 분석해 답변을 생성합니다.</dd>
              </div>
              <div>
                <dt className="text-amber-500 font-black text-xs">Pain Point (페인포인트)</dt>
                <dd className="text-[10px] opacity-70 mt-1">소비자가 특정 상황에서 겪는 실질적인 불편함이나 해결되지 않은 결핍 상태를 의미합니다.</dd>
              </div>
            </dl>
          </section>
        </div>
      )
    }
  };

  return (
    <header className="relative w-full mb-10">
      <div className={`flex justify-between items-center w-full py-4 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'} mb-8 print:hidden`}>
        <div className={`text-sm font-mono font-black uppercase tracking-widest flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500'}`}>
          <span className="bg-sky-600 text-white px-2 py-0.5 rounded text-[10px]">LIVE</span>
          CEP Trend Analyzer <span className="text-sky-500 ml-1">{version}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className={`flex gap-5 text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            <button onClick={() => setActiveMenu('intro')}>앱 소개</button>
            <button onClick={() => setActiveMenu('usage')}>사용 방법</button>
            <button onClick={() => setActiveMenu('interpret')}>해석 가이드</button>
          </nav>
          <div className="flex items-center gap-2">
             <button onClick={onToggleLightMode} className="p-2 rounded-lg border">{isLightMode ? '🌙' : '☀️'}</button>
             {showPrintControls && (
                <button onClick={onPrint} className="px-4 py-2 bg-sky-600 text-white text-xs font-black rounded-lg">PDF 리포트</button>
             )}
          </div>
        </div>
      </div>

      <div className="text-center print:text-left">
        <h1 className={`text-4xl sm:text-5xl font-black mb-4 tracking-tight ${isLightMode ? 'text-slate-900' : 'text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-sky-400'} print:text-black print:text-3xl`}>
          CEP 기반 전략적 콘텐츠 자동 제작 솔루션
        </h1>
        <p className={`text-sm sm:text-base max-w-4xl mx-auto leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'} print:text-slate-700`}>
          데이터 해상도 기반의 <span className="text-sky-500 font-bold">CEP 상황 분석</span>과 <span className="underline decoration-sky-500/50">AEO 최적 콘텐츠</span>를 통해 차별화된 마케팅 성과를 지원합니다.
        </p>
      </div>

      {activeMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:hidden">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-200'} border border-slate-700/50`}>
            <div className={`p-5 border-b flex justify-between items-center ${isLightMode ? 'bg-slate-50' : 'bg-slate-800'}`}>
              <h3 className="font-black text-sm uppercase tracking-widest">{menuContent[activeMenu].title}</h3>
              <button onClick={() => setActiveMenu(null)} className="text-2xl">×</button>
            </div>
            <div className="p-7">{menuContent[activeMenu].content}</div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
