import React, { useEffect } from 'react';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative">

        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">
                AESA <span className="text-blue-600">Rader</span>
                <span className="text-lg font-bold text-slate-400 not-italic ml-2">User Guide</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">AI-Powered Marketing Intelligence Engine · v2.0</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-10 space-y-12">

          {/* 01 AESA Rader란? */}
          <section>
            <h3 className="text-xl font-black text-[#002d72] mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black">01</span>
              AESA Rader란?
            </h3>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <p className="text-base text-slate-700 leading-relaxed font-medium break-keep mb-6">
                <span className="font-black text-blue-600">AESA Rader</span>는 네이버 뉴스 API, Google Search Grounding,
                DataLab 쇼핑인사이트 등 다층적 실시간 데이터를 수집·교차검증하여
                <span className="bg-yellow-100 px-1 mx-1 rounded">환각(Hallucination) 없는</span>
                Fact 기반 마케팅 전략을 자동 도출하는 Intelligence Strategy Engine입니다.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Source 1</p>
                  <h4 className="text-blue-600 font-black text-sm mb-1">네이버 뉴스 API</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">한국어 최적화. 일 25,000건 실시간 수집. 3년 이상 기사·광고·스팸 자동 제거. 수치 포함 기사 우선 정렬.</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Source 2</p>
                  <h4 className="text-indigo-600 font-black text-sm mb-1">네이버 DataLab</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">검색어 트렌드 + 쇼핑 카테고리 클릭 추이. 소비자 관심도를 0~100 실측 지수로 정량화하여 Fact Sheet에 반영.</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Source 3</p>
                  <h4 className="text-emerald-600 font-black text-sm mb-1">Google Grounding</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">공식 브랜드 사이트 + 시장규모 통계. 자동차(KAMA), 식품(aT), 화장품(KCIA), IT(IITP) 등 산업별 특화 소스 자동 활성화.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>검증된 출처
                  </span>
                  <p className="text-xs text-slate-500">실제 URI 포함 — 링크 직접 확인 가능</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-200">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>AI 추론 기반
                  </span>
                  <p className="text-xs text-slate-500">Fact Sheet 해석 중 생성 — 원문 확인 권장</p>
                </div>
              </div>
            </div>
          </section>

          {/* 02 분석 파이프라인 */}
          <section>
            <h3 className="text-xl font-black text-[#002d72] mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black">02</span>
              분석 파이프라인 (7단계)
            </h3>
            <div className="space-y-2">
              {[
                {
                  step: 'STEP 1', label: 'Query Optimization',
                  color: 'bg-blue-50 border-blue-200', badge: 'temp=0.1', badgeColor: 'bg-blue-100 text-blue-700',
                  desc: '입력된 브랜드·카테고리·키워드를 최적 검색어로 변환. 환각 방지를 위해 최저 temperature 적용.'
                },
                {
                  step: 'STEP 2', label: 'Naver News API 수집',
                  color: 'bg-indigo-50 border-indigo-200', badge: '최대 30건', badgeColor: 'bg-indigo-100 text-indigo-700',
                  desc: '네이버 최신 뉴스 수집. 3년 이상 기사 자동 제거, 광고·스팸 패턴 필터링, 수치 데이터 포함 기사 우선 정렬.'
                },
                {
                  step: 'STEP 3', label: 'DataLab + Google Grounding',
                  color: 'bg-emerald-50 border-emerald-200', badge: 'URI 검증', badgeColor: 'bg-emerald-100 text-emerald-700',
                  desc: '검색트렌드·쇼핑인사이트(DataLab) + 공식 브랜드·시장통계(Grounding). [OFFICIAL] → [STATISTICS] → [NEWS] 신뢰도 계층으로 Fact Sheet 구성.'
                },
                {
                  step: 'STEP 4', label: 'Market + PEST + 3C + SWOT 분석',
                  color: 'bg-yellow-50 border-yellow-200', badge: 'temp=0.1', badgeColor: 'bg-yellow-100 text-yellow-700',
                  desc: 'Fact Sheet만을 근거로 엄격한 분석 수행. 시장규모 10년 히스토리 + 5년 예측 자동 계산. 데이터 없을 시 Data unavailable 강제 표기.'
                },
                {
                  step: 'STEP 5', label: 'STP + 포지셔닝 + 4P Mix',
                  color: 'bg-purple-50 border-purple-200', badge: 'temp=0.2', badgeColor: 'bg-purple-100 text-purple-700',
                  desc: 'Fact Sheet 기반 시장 세분화(3~5개 세그먼트 자동 결정) + 타겟 페르소나(AI 이미지) + X·Y축 경쟁 지형도 + 4P Mix 실행안. 세그먼트 수는 시장 복잡도에 따라 자동 결정됩니다.'
                },
                {
                  step: 'STEP 6', label: 'Communication Strategy',
                  color: 'bg-red-50 border-red-200', badge: 'temp=0.9', badgeColor: 'bg-red-100 text-red-700',
                  desc: 'Fact 기반 분석 결과를 토대로 크리에이티브 극대화. 메인 컨셉·슬로건·브랜드 스토리·톤앤매너·키워드·실행계획 도출.'
                },
                {
                  step: 'STEP 7', label: '전략 보고서 PDF 생성',
                  color: 'bg-slate-50 border-slate-200', badge: '@react-pdf', badgeColor: 'bg-slate-100 text-slate-700',
                  desc: '"최종 보고서 생성" 클릭 → ReportView 전환 → 상단 "전략 보고서 PDF 다운로드" 버튼으로 @react-pdf/renderer 기반 9페이지 A4 PDF 즉시 생성.'
                },
              ].map((item, i) => (
                <div key={i} className={`flex gap-4 p-4 rounded-2xl border ${item.color}`}>
                  <div className="flex-shrink-0 w-20 text-center pt-0.5">
                    <span className="text-[9px] font-black text-slate-400 block mb-1">{item.step}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.badgeColor}`}>{item.badge}</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 mb-1">{item.label}</p>
                    <p className="text-xs text-slate-500 leading-relaxed break-keep">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 03 분석 아웃풋 */}
          <section>
            <h3 className="text-xl font-black text-[#002d72] mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black">03</span>
              분석 아웃풋 구성
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: '📈', title: '시장 규모 & 성장률', desc: '10년 히스토리 + 5년 예측 추이 차트. 현재 시장규모·CAGR 자동 표기. 추정 데이터는 (E) 명시.' },
                { icon: '🌍', title: 'PEST 환경 분석', desc: '정치·경제·사회·기술 4분면 + 전략적 시사점. 네이버 DataLab 실측 검색지수 포함.' },
                { icon: '🔍', title: '3C 경쟁 분석', desc: '자사 강점·현재 포지션, 경쟁사별 전략, 고객 니즈·트렌드. 공식 사이트 데이터 기반.' },
                { icon: '⚡', title: 'SWOT + 전략 방향', desc: 'SO·ST·WO·WT 4전략 도출. Fact 근거 태그(SRC-N, Official, Statistics) 자동 표기.' },
                { icon: '🎯', title: 'STP + 포지셔닝 맵', desc: '세그먼트 3~5개(시장 복잡도 자동 반영) + 타겟 페르소나(AI 이미지 포함) + X·Y축 경쟁 지형 시각화.' },
                { icon: '🛠️', title: '4P Marketing Mix', desc: 'Product·Price·Place·Promotion 실행안. Fact 데이터 연결 RTB 포함.' },
                { icon: '📣', title: 'Communication 전략', desc: '크리에이티브 컨셉·슬로건·브랜드 스토리·톤앤매너·핵심 키워드·실행계획.' },
                { icon: '📄', title: '전략 보고서 PDF (9p)', desc: '커버·시장·PEST·3C·SWOT·STP·4P·커뮤니케이션·참고문헌. @react-pdf 정확 렌더링.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-sm font-black text-slate-800 mb-1">{item.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed break-keep">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 04 입력 가이드 */}
          <section>
            <h3 className="text-xl font-black text-[#002d72] mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black">04</span>
              입력 가이드 & 팁
            </h3>
            <div className="space-y-3">
              {[
                {
                  tag: '산업 카테고리', tagColor: 'bg-blue-100 text-blue-700',
                  text: '자동차, 식품, 요식업(프랜차이즈), 화장품, 전자/IT, 유통 입력 시 해당 산업 전용 공식 데이터 소스(KAMA·aT·KCIA·IITP 등)가 자동 활성화됩니다.'
                },
                {
                  tag: '경쟁사', tagColor: 'bg-indigo-100 text-indigo-700',
                  text: '최대 4개까지 입력 가능. 입력할수록 3C·SWOT·포지셔닝 맵의 정밀도가 높아집니다. 직접 경쟁사 2개 + 간접 경쟁사 1개 조합을 권장합니다.'
                },
                {
                  tag: '유관 키워드', tagColor: 'bg-purple-100 text-purple-700',
                  text: '브랜드명 외 분석하고 싶은 트렌드·기술 키워드를 추가하세요. 예) "MZ세대, 구독경제, 비건" → DataLab 검색트렌드 수집 키워드로도 활용됩니다.'
                },
                {
                  tag: '추가 컨텍스트', tagColor: 'bg-emerald-100 text-emerald-700',
                  text: '신제품 출시, 특정 채널 집중, 리브랜딩 등 분석 방향성을 구체적으로 기입하면 전략 출력의 정교함이 크게 향상됩니다.'
                },
                {
                  tag: '소요 시간', tagColor: 'bg-amber-100 text-amber-700',
                  text: '전체 분석은 약 2~4분 소요됩니다. 데이터 수집(STEP 1~3) 약 30~60초, Gemini 분석(STEP 4~6) 약 90~180초. 브라우저를 닫지 말고 대기하세요.'
                },
                {
                  tag: 'PDF 다운로드', tagColor: 'bg-rose-100 text-rose-700',
                  text: '"최종 보고서 생성" 버튼 → ReportView 화면 전환 → 상단 파란색 "전략 보고서 PDF 다운로드" 클릭. 처음 클릭 시 폰트 로딩으로 수 초 대기 후 자동 다운로드됩니다.'
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className={`font-black px-2 py-1 rounded-lg text-xs min-w-[90px] text-center mt-0.5 flex-shrink-0 ${item.tagColor}`}>{item.tag}</span>
                  <p className="text-sm text-slate-600 leading-relaxed break-keep">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 05 산업별 특화 데이터 소스 */}
          <section>
            <h3 className="text-xl font-black text-[#002d72] mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black">05</span>
              산업별 특화 데이터 소스
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { industry: '🚗 자동차', sources: 'KAMA 판매통계 · KAIDA 수입차' },
                { industry: '🍜 식품·요식업', sources: 'aT ATFIS · 공정위 가맹사업' },
                { industry: '💄 화장품', sources: 'KCIA 생산실적 · 식약처 통계' },
                { industry: '📱 전자·IT', sources: 'IITP ICT포털 · NIPA 실태조사' },
                { industry: '🛒 유통', sources: '산자부 유통조사 · DART 공시' },
                { industry: '👔 패션·기타', sources: 'Google Grounding · 네이버 DataLab' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-sm font-black text-slate-800 mb-1">{item.industry}</p>
                  <p className="text-xs text-slate-500">{item.sources}</p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-400">AESA Rader v2.0 · Powered by Gemini 2.5 Pro + Naver API</p>
          <button onClick={onClose} className="bg-[#002d72] hover:bg-blue-800 text-white px-8 py-3 rounded-xl font-black transition-colors shadow-lg text-sm">
            확인했습니다
          </button>
        </div>

      </div>
    </div>
  );
};
