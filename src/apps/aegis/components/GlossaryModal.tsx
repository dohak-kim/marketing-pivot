
import React, { useState } from 'react';

interface GlossaryModalProps {
  onClose: () => void;
}

const sections = [
  {
    id: 'node',
    title: '01. Intelligence Node',
    titleKo: '인텔리전스 노드',
    badge: 'Data Layer',
    badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    description: '시장 데이터를 수집·해석하는 최소 단위의 지능형 탐침(Probe)입니다. 검색 엔진의 알고리즘이 1차 검증한 시맨틱 클러스터를 역추적하여 추출합니다.',
    items: [
      { name: 'Neural Sampling', ko: '추출 원리', desc: '단순 크롤링이 아닙니다. 상위 랭킹 알고리즘이 검증한 고품질 시맨틱 클러스터를 역추적합니다. Lv.1~5까지 소스 깊이를 설정할 수 있습니다.' },
      { name: 'Statistical Significance', ko: '통계적 대표성', desc: '1개 노드 = 약 1,000~1,500건 연관 쿼리 벡터 대표. Max 15 CEPs(Google Lv.5 + Naver Lv.5) 활성화 시 시맨틱 커버리지 95% 이상 달성.' },
      { name: 'Source Dynamics', ko: '소스 특성', desc: 'Google: 문제 해결·심층 정보(Cognition-driven). Naver: 커뮤니티 담론·시의성(Buzz-driven). 하이브리드 모드가 사각지대 최소화.' },
      { name: '5x Deep Sampling', ko: '5배수 심층 샘플링', desc: 'Lv.4~5 설정 시 적용. 롱테일 키워드와 틈새 시장 신호까지 포착하여 통계적 대표성을 극대화합니다.' },
    ],
  },
  {
    id: 'conversion',
    title: '02. Conversion Journey',
    titleKo: '전환 여정',
    badge: 'C² Layer',
    badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    description: '고객이 브랜드를 인지하고 구매에 이르기까지 거치는 4단계 전환 여정입니다.',
    items: [
      { name: 'Awareness', ko: '인지', desc: '브랜드·제품의 존재를 처음 알게 되거나 문제(Need)를 인식하는 초기 단계. 브랜드 최초 상기도 선점이 목표.' },
      { name: 'Consideration', ko: '탐색·고려', desc: '정보를 수집하고 다양한 브랜드를 후보군에 올리는 단계. 후보군(Long-list) 진입이 핵심.' },
      { name: 'Decision', ko: '결정', desc: '최종 후보 중 하나를 선택하기 위해 스펙·가격을 비교하고 구매하는 단계. 경쟁 우위 입증이 관건.' },
      { name: 'Post-Purchase', ko: '사후관리', desc: '구매 후 경험으로 충성도를 형성하거나 재구매를 고려하는 단계. 고객을 옹호자(Advocate)로 만드는 것이 목표.' },
    ],
  },
  {
    id: 'cognition',
    title: '03. Cognition Vector',
    titleKo: '다차원 인지 분석',
    badge: 'C³ Layer',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    description: '사용자가 검색창에 키워드를 입력할 때의 숨겨진 심리적 목적입니다. 하나의 Context가 복수의 인지를 동시에 가질 수 있으며, 수치는 비중이 아닌 강도(Intensity)를 의미합니다.',
    items: [
      { name: 'Informational', ko: '콘텐츠 제작', desc: '지식·방법·답변을 찾으려는 의도. AEO FAQ와 SEO 롱폼 허브 콘텐츠가 최적 대응.' },
      { name: 'Exploratory', ko: '비교·가이드', desc: '특정 브랜드나 서비스를 비교·탐색하려는 의도. Spoke 지원 아티클과 비교 가이드가 효과적.' },
      { name: 'Commercial', ko: 'USP·메시지', desc: '구매를 염두에 두고 제품을 비교·분석하려는 의도. GEO 엔티티 콘텐츠 + 페이드 광고 소재.' },
      { name: 'Transactional', ko: '전환·오퍼', desc: '구매·예약·다운로드 등 즉각적인 행동 의도. 랜딩페이지 카피와 CTA 광고 소재.' },
    ],
  },
  {
    id: 'strategy',
    title: '04. Strategy Framework',
    titleKo: '5전략 방향',
    badge: 'Decision Layer',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    description: 'C³ 분석 결과를 기반으로 실행 방향을 결정하는 5가지 전략 프레임워크입니다. AEGIS FORGE가 각 방향에 맞는 최적 콘텐츠를 자동 추천합니다.',
    items: [
      { name: 'Offensive (공격)', ko: '시장 점유 확대', desc: '전환 가치 높음 + 경쟁 치열. SEO 상위 진입 + 전환형 콘텐츠 집중 + Paid 비교 광고 집행.' },
      { name: 'Defensive (방어)', ko: '브랜드 권위 강화', desc: '이미 높은 점유율. 기존 콘텐츠 최신성 유지 + GEO 엔티티 권위글 + 고객 리뷰 방어벽.' },
      { name: 'Niche Capture (신규 진입)', ko: '틈새 시장 선점', desc: '경쟁 낮고 지배적 플레이어 없음. AEO FAQ로 카테고리 정의 선점 + 롱테일 키워드 확보.' },
      { name: 'Brand Build (브랜드 빌드)', ko: '인지도·신뢰 구축', desc: '장기 인지 자산 축적. 트렌드 리포트 + GEO 권위 콘텐츠 + 인플루언서 브리프.' },
      { name: 'Monitor (관찰)', ko: '수요 모니터링', desc: 'ROI 낮음. 최소 Spoke 콘텐츠 유지 + Temporal 비교 분석으로 트렌드 변화 감지.' },
    ],
  },
  {
    id: 'hubspoke',
    title: '05. Hub & Spoke',
    titleKo: '허브 앤 스포크',
    badge: 'Content Architecture',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    description: 'Triple Media 전략을 Hub와 Spoke로 구조화합니다. Hub = Owned Media(자체 제작·보유), Spoke = Earned Media(언드) + Paid Media(페이드). Hub가 SEO/AEO/GEO 권위의 원천이 되고, Spoke 두 채널이 그 권위를 외부로 증폭합니다.',
    items: [
      { name: 'Hub = Owned Media', ko: '핵심 허브 (자체 미디어)', desc: 'H1/H2/H3 계층 구조 + AEO FAQ + GEO 엔티티 정의로 SEO·AEO·GEO 3중 최적화를 받는 유일한 미디어. 모든 Spoke의 내부 링크 목적지.' },
      { name: 'Spoke 1 = Earned Media', ko: 'Spoke 1 (획득 미디어)', desc: 'PR·인플루언서·커뮤니티 게시물. Hub 콘텐츠를 외부 채널로 앰플리파이. GEO(브랜드 인용) + AEO(Q&A 시딩) 간접 기여.' },
      { name: 'Spoke 2 = Paid Media', ko: 'Spoke 2 (유료 미디어)', desc: '검색광고·소셜광고·랜딩페이지. SEO 공백 즉시 커버(SEM) + Hub 방문자 리타게팅 + CPA 전환 최적화. Owned 투자 ROI를 극대화.' },
      { name: 'Content Velocity', ko: '콘텐츠 속도', desc: 'Hub 1개 발행 → Spoke 1 앰플리파이 → Spoke 2 가속화 → 브랜드 권위 누적. 시간이 지날수록 복리 효과로 SEO·AI 검색 권위가 축적됩니다.' },
    ],
  },
  {
    id: 'optimization',
    title: '06. SEO / AEO / GEO',
    titleKo: '3층 최적화',
    badge: 'Optimization Layer',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    description: 'SEO를 기반으로 AEO와 GEO가 상위 레이어를 형성합니다. AEGIS FORGE는 세 레이어를 토글로 조합하여 생성합니다.',
    items: [
      { name: 'SEO', ko: '검색 엔진 최적화 (기반)', desc: '모든 콘텐츠의 필수 전제. 키워드 배치, H1/H2/H3 구조, 메타 설명, 내부 링크. 항상 활성화됩니다.' },
      { name: 'AEO', ko: 'Answer Engine Optimization', desc: 'Google SGE · 네이버 AI 검색 · Featured Snippet 직접 답변 최적화. FAQ 구조 + PAA(People Also Ask) 형식 + 50자 이내 직접 답변.' },
      { name: 'GEO', ko: 'Generative Engine Optimization', desc: 'ChatGPT · Gemini · Perplexity 등 생성형 AI 인용 최적화. 엔티티 명시 + 권위적 사실 서술 + 인용 가능한 정의·수치 포함.' },
      { name: 'Quality Score', ko: '콘텐츠 품질 지표', desc: 'AEGIS FORGE 생성 후 SEO(0~100) / AEO(0~100) / GEO(0~100) 자가 평가 점수와 체크리스트를 제공합니다.' },
    ],
  },
  {
    id: 'forge',
    title: '07. AEGIS FORGE',
    titleKo: '콘텐츠 단조 엔진',
    badge: 'Execution Engine',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    description: 'C³ 인텔리전스 × 전략 방향 × 미디어 유형을 결합해 SEO/AEO/GEO 최적화 콘텐츠를 자동 생성하는 실행 엔진입니다.',
    items: [
      { name: 'Owned Hub', ko: '허브 콘텐츠', desc: 'SEO 롱폼 아티클 / AEO FAQ 가이드 / GEO 엔티티 권위글 3가지 서브타입. 브랜드 검색 권위의 핵심.' },
      { name: 'Owned Spoke', ko: 'Spoke 지원 콘텐츠', desc: '지원 아티클 / FAQ 확장글 / 케이스 스터디. Hub와 내부 링크로 연결되어 롱테일 트래픽을 포착.' },
      { name: 'Earned Media', ko: '언드 미디어', desc: '보도자료 / 인플루언서 브리프 / 커뮤니티 게시물. 외부 채널을 통한 브랜드 권위 확산.' },
      { name: 'Paid Media', ko: '페이드 미디어', desc: '검색광고 3종 세트 / 소셜광고 A/B/C 변형 / 랜딩페이지 카피. Cognition × 전략 방향 기반 자동 추천.' },
    ],
  },
  {
    id: 'temporal',
    title: '08. Temporal Intelligence',
    titleKo: '시계열 인텔리전스',
    badge: 'Comparison Layer',
    badgeColor: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300',
    description: '두 기간의 Context 블록을 비교 분석하여 시장 변화 방향과 AEO·GEO 기회를 도출합니다. 스냅샷으로 저장하면 추후 비교의 기준 기간으로 활용 가능합니다.',
    items: [
      { name: 'Sankey Diagram', ko: '흐름 시각화', desc: '기간 A → 기간 B의 Context 흐름을 시각화. 성장/쇠퇴/신규/소멸 4가지 상태로 색상 구분하여 한눈에 파악.' },
      { name: 'CEP Matching', ko: '군집 매칭', desc: 'Jaccard 유사도 기반으로 두 기간의 Context 클러스터를 자동 매칭(임계값 0.25). 인텐트 전환(Cognition Shift) 발생 시 별도 표시.' },
      { name: 'AI Temporal Insights', ko: 'AI 시사점 도출', desc: 'AEO · GEO · Trend · Opportunity · Warning 5가지 유형으로 분류된 전략적 시사점을 자동 생성.' },
      { name: 'Snapshot Storage', ko: '스냅샷 저장', desc: '현재 분석 결과를 로컬에 저장(최대 20개)하여 추후 비교 분석의 기준(Period A)으로 즉시 불러올 수 있습니다.' },
    ],
  },
  {
    id: 'journey_ladder',
    title: '09. C³ Journey Ladder',
    titleKo: '여정 래더 시각화',
    badge: 'Visualization',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    description: '정성조사의 Laddering(Value→Benefit→Attribute) 방법론을 C³에 적용한 전략 시각화입니다. CDJ 4단계를 가로축으로, CEP와 키워드 속성을 세로로 계층화하여 시장 전체 구조를 한눈에 파악합니다.',
    items: [
      { name: 'CDJ 4컬럼 구조', ko: '여정 단계 배열', desc: '인지(Awareness) → 고려(Consideration) → 구매결정(Decision) → 구매후관리(Post-Purchase) 순으로 좌→우 배치. 각 컬럼의 너비는 CEP 비중에 비례합니다.' },
      { name: 'CEP 카드 (Level 2)', ko: '전략 블록', desc: '각 CDJ 단계 내 CEP를 Priority Score 내림차순으로 배치. 좌측 컬러 보더 = Cognition 유형, 전략 방향 뱃지(Offensive/Defensive 등) 동시 표시.' },
      { name: '키워드 속성 (Level 3)', ko: 'Attribute 레이어', desc: 'CEP 하위에 점선 구분선으로 분리된 키워드 칩. 각 키워드의 Cognition 색상으로 의도 분포 즉시 확인 가능.' },
      { name: 'Laddering 용어 매핑', ko: '정성조사 연계', desc: 'CDJ Stage = Value(Why), CEP = Benefit(Rational/Emotional), Keywords = Attributes. 마케팅 리서치 방법론과 동일한 사고 구조로 전략을 직관적으로 해석.' },
    ],
  },
];

const GlossaryModal: React.FC<GlossaryModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('node');

  const current = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="shrink-0 px-8 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/3 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              전략 용어 해설
              <span className="ml-3 text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                Strategic Glossary
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">C³ Cube Strategy Model · AEGIS Intelligence System v2.6</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar nav */}
          <div className="shrink-0 w-52 border-r border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 overflow-y-auto no-scrollbar py-3">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-4 py-3 transition-all ${
                  activeSection === s.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-r-2 border-indigo-500'
                    : 'hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div className={`text-[10px] font-black uppercase tracking-widest leading-tight ${activeSection === s.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {s.title.split('.')[0]}.
                </div>
                <div className={`text-[11px] font-bold mt-0.5 ${activeSection === s.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-500'}`}>
                  {s.titleKo}
                </div>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{current.title}</h3>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${current.badgeColor}`}>{current.badge}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{current.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {current.items.map((item, i) => (
                <div key={i} className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all group">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0 group-hover:bg-indigo-400 transition-colors" />
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{item.name}</h4>
                      <span className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400">{item.ko}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-3.5 border-l border-slate-200 dark:border-white/10 group-hover:border-indigo-400 dark:group-hover:border-indigo-500/50 transition-colors">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-8 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/3 flex items-center justify-between">
          <p className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">
            {sections.findIndex(s => s.id === activeSection) + 1} / {sections.length}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const i = sections.findIndex(s => s.id === activeSection);
                if (i > 0) setActiveSection(sections[i - 1].id);
              }}
              disabled={activeSection === sections[0].id}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-30"
            >
              ← 이전
            </button>
            {activeSection === sections[sections.length - 1].id ? (
              <button onClick={onClose} className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md">
                완료
              </button>
            ) : (
              <button
                onClick={() => {
                  const i = sections.findIndex(s => s.id === activeSection);
                  setActiveSection(sections[i + 1].id);
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md"
              >
                다음 →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlossaryModal;
