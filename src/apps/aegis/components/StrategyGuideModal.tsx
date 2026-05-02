
import React, { useState } from 'react';

interface StrategyGuideModalProps {
  onClose: () => void;
}

const strategies = [
  {
    type: 'Offensive',
    typeKo: '공격',
    color: 'rose',
    icon: '⚔️',
    condition: 'High Intent · High Ownership Gap',
    conditionKo: '높은 전환 의도, 낮은 점유율',
    meaning: '지금 뺏어와야 하는 영역입니다. 전환 가치가 높고 경쟁이 치열하지만, 공격적 투자로 시장 점유율을 확보해야 합니다.',
    forgeRec: {
      media: 'Paid + Owned Hub',
      subType: '검색광고 3종 세트 + SEO 롱폼 허브',
      optimization: 'SEO + AEO',
      tone: '권위적 (Authoritative)',
    },
    actions: [
      'SEO 상위 3위 진입 목표 — 허브 콘텐츠 발행',
      'Transactional 인지 타겟 전환형 콘텐츠 집중',
      '경쟁사 비교 검색광고 + CRO 강화',
      'AEO FAQ로 구매 결정 단계 직접 답변 선점',
    ],
  },
  {
    type: 'Defensive',
    typeKo: '방어',
    color: 'sky',
    icon: '🛡️',
    condition: 'High Intent · Low Ownership Gap',
    conditionKo: '높은 전환 의도, 높은 점유율',
    meaning: '절대 빼앗기면 안 되는 핵심 수성 영역입니다. 이미 높은 점유율을 확보했으므로 유지하고 고객을 Lock-in합니다.',
    forgeRec: {
      media: 'Owned Hub + Earned',
      subType: 'GEO 엔티티 권위글 + 보도자료',
      optimization: 'SEO + GEO',
      tone: '권위적 (Authoritative)',
    },
    actions: [
      '기존 상위 콘텐츠 최신성(Freshness) 주기적 업데이트',
      'GEO 엔티티 권위글로 AI 검색 인용 방어',
      '브랜드 키워드 광고 점유율 방어',
      '성공 사례·리뷰 방어벽 + 재구매 캠페인',
    ],
  },
  {
    type: 'Niche Capture',
    typeKo: '신규 진입',
    color: 'amber',
    icon: '🎯',
    condition: 'Low Competition · High Opportunity Gap',
    conditionKo: '낮은 경쟁, 높은 기회 공백',
    meaning: '경쟁도가 낮고 지배적 플레이어가 없는 Blue Ocean 영역입니다. 자원 투입 강도에 따라 2가지 모드로 운용됩니다.',
    isDualMode: true,
    modes: [
      { name: 'Exploration Mode', nameKo: '검증형', desc: '시장 반응 확인이 목표', action: '1~2개 AEO FAQ + 최소 광고로 CTR·초기 전환율 검증' },
      { name: 'Dominance Mode', nameKo: '선점형', desc: '빠른 카테고리 리더십 목표', action: 'SEO Hub + 광고 동시 집행으로 경쟁사 진입 전 방어선 구축' },
    ],
    forgeRec: {
      media: 'Owned Hub (AEO)',
      subType: 'AEO FAQ 가이드',
      optimization: 'SEO + AEO + GEO',
      tone: '전문적 (Expert)',
    },
    actions: [
      'AEO FAQ로 카테고리 최초 정의 선점',
      '롱테일 키워드 Hub + Spoke 대량 구조 구축',
      'GEO 엔티티로 AI 검색 내 카테고리 권위 확립',
      '커뮤니티 초기 여론 형성 (Seeding)',
    ],
  },
  {
    type: 'Brand Build',
    typeKo: '브랜드 빌드',
    color: 'emerald',
    icon: '🌱',
    condition: 'Low Intent · High Ownership Gap',
    conditionKo: '낮은 전환 의도, 경쟁 존재',
    meaning: '장기적인 인지 자산을 쌓아야 하는 영역입니다. 당장의 전환보다는 미래 수요를 창출하고 브랜드 신뢰를 형성합니다.',
    forgeRec: {
      media: 'Owned Hub + Earned',
      subType: 'GEO 엔티티 권위글 + 인플루언서 브리프',
      optimization: 'SEO + GEO',
      tone: '권위적 (Authoritative)',
    },
    actions: [
      'GEO 엔티티 콘텐츠로 AI 검색 브랜드 권위 구축',
      '트렌드 리포트·인사이트 발행 (Thought Leadership)',
      '인플루언서 브리프로 탐색 단계 브랜드 노출',
      '잠재 고객 리타겟팅 풀(Pool) 확보',
    ],
  },
  {
    type: 'Monitor',
    typeKo: '관찰',
    color: 'slate',
    icon: '👁️',
    condition: 'Low ROI Expectation',
    conditionKo: '낮은 ROI, 최소 대응',
    meaning: '투입 대비 효율이 낮아 최소한의 모니터링만 유지합니다. Temporal 비교 분석으로 트렌드 변화를 감지합니다.',
    forgeRec: {
      media: 'Owned Spoke',
      subType: 'FAQ 확장글 / Spoke 지원 아티클',
      optimization: 'SEO',
      tone: '친근한 (Casual)',
    },
    actions: [
      '시장 트렌드 Temporal 비교 분석 주기적 실행',
      'Spoke 최소 콘텐츠 유지 (자연 유입 현황 체크)',
      '이슈 발생 시 즉시 대응 가능한 최소 리소스 유지',
      'CEP Priority Score 급등 시 전략 방향 재분류',
    ],
  },
];

const colorMap: Record<string, { badge: string; border: string; dot: string; text: string; bg: string; forgeBg: string }> = {
  rose:    { badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-500/30', dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/10', forgeBg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-500/20' },
  sky:     { badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-500/30', dot: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/10', forgeBg: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-500/20' },
  amber:   { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-500/30', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10', forgeBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/20' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/10', forgeBg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/20' },
  slate:   { badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-600/30', dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/30', forgeBg: 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-600/20' },
};

const intentColorMap: Record<string, string> = {
  slate:  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  sky:    'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  amber:  'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  rose:   'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
};

const ForgeRow: React.FC<{ intent: string; intentColor: string; media: string; content: string; opt: string }> = ({ intent, intentColor, media, content, opt }) => (
  <div className="grid grid-cols-[56px_1fr_1fr_1fr] gap-1 items-center">
    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded text-center ${intentColorMap[intentColor] ?? intentColorMap.slate}`}>
      {intent}
    </span>
    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 truncate">{media}</span>
    <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{content}</span>
    <span className="text-[8px] font-mono text-indigo-500 dark:text-indigo-400 truncate">{opt}</span>
  </div>
);

const StrategyGuideModal: React.FC<StrategyGuideModalProps> = ({ onClose }) => {
  const [selected, setSelected] = useState(0);
  const s = strategies[selected];
  const c = colorMap[s.color];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="shrink-0 px-8 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/3 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              5 Strategy Framework
              <span className="ml-3 text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                Execution Model
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">C³ 분석 결과 × AEGIS FORGE 콘텐츠 단조 전략</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Strategy tabs */}
        <div className="shrink-0 flex border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/10 overflow-x-auto no-scrollbar">
          {strategies.map((st, i) => (
            <button
              key={st.type}
              onClick={() => setSelected(i)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
                selected === i
                  ? `${colorMap[st.color].text} border-current bg-white dark:bg-slate-900`
                  : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span>{st.icon}</span>
              <span className="hidden sm:inline">{st.typeKo}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: Strategy Overview */}
            <div className="space-y-5">
              {/* Header */}
              <div className={`p-5 rounded-2xl ${c.bg} border ${c.border}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${c.badge}`}>{s.type}</span>
                    <h3 className={`text-lg font-black mt-0.5 ${c.text}`}>{s.typeKo} 전략</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">발동 조건</div>
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{s.condition}</p>
                    <p className={`text-[10px] font-semibold ${c.text}`}>{s.conditionKo}</p>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 mt-3">전략 인사이트</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{s.meaning}</p>
                  </div>
                </div>
              </div>

              {/* Niche dual mode */}
              {s.isDualMode && s.modes && (
                <div className="space-y-3">
                  <div className={`text-[9px] font-black uppercase tracking-widest ${c.text}`}>Dual Mode Strategy</div>
                  {s.modes.map((m, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${c.forgeBg}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${c.badge}`}>{i + 1}</span>
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">{m.name}</span>
                        <span className={`text-[9px] font-semibold ${c.text}`}>({m.nameKo})</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{m.desc}</p>
                      <p className={`text-[10px] font-semibold mt-1 ${c.text}`}>→ {m.action}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Template */}
              <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Action Template</div>
                <ul className="space-y-2.5">
                  {s.actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                      <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: AEGIS FORGE Recommendation */}
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border border-indigo-200 dark:border-indigo-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">⚡</span>
                  <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">AEGIS FORGE 추천 설정</div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: '미디어 유형', value: s.forgeRec.media },
                    { label: '콘텐츠 서브타입', value: s.forgeRec.subType },
                    { label: '최적화 레이어', value: s.forgeRec.optimization },
                    { label: '톤앤매너', value: s.forgeRec.tone },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">{label}</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hub & Spoke Guide */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Hub & Spoke 구조 적용</div>
                <div className="space-y-2">
                  {s.type === 'Offensive' && <>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Hub:</span> 전환 의도 타겟 SEO 롱폼 — 비교·가격·구매 가이드</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Spoke:</span> 경쟁사 비교 케이스 스터디 + 구매 FAQ</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Earned:</span> 구매 후기·리뷰 PR로 Hub 권위 증폭</p>
                  </>}
                  {s.type === 'Defensive' && <>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Hub:</span> GEO 엔티티 권위글 — 브랜드·카테고리 정의 선점</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Spoke:</span> 제품 심층 가이드 + 사용 후기 FAQ</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Paid:</span> 브랜드 검색어 방어 광고</p>
                  </>}
                  {s.type === 'Niche Capture' && <>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Hub:</span> AEO FAQ로 카테고리 최초 정의 — AI 검색 선점</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Spoke:</span> 롱테일 키워드 다수 Spoke로 시장 커버리지 확대</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Earned:</span> 커뮤니티 Seeding으로 초기 담론 형성</p>
                  </>}
                  {s.type === 'Brand Build' && <>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Hub:</span> GEO 권위 콘텐츠 — 업계 리포트·인사이트</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Spoke:</span> SNS 요약 콘텐츠 + 브랜드 스토리 시리즈</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Earned:</span> 인플루언서 브리프로 탐색 단계 노출</p>
                  </>}
                  {s.type === 'Monitor' && <>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Hub:</span> 기존 Hub 유지·업데이트만 (신규 미발행)</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Spoke:</span> 최소 FAQ Spoke 1~2개 유지</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Temporal:</span> 비교 분석으로 Priority Score 급등 CEP 모니터링</p>
                  </>}
                </div>
              </div>

              {/* Temporal Tip */}
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20">
                <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">Temporal Intelligence 활용</div>
                <p className="text-[10px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  {s.type === 'Offensive' && '경쟁이 심화되기 전 기간 비교 분석으로 점유율 상승 추세를 확인하고 투자 강도를 조정하세요.'}
                  {s.type === 'Defensive' && '기간 비교에서 Priority Score 하락 신호가 보이면 즉시 콘텐츠 업데이트와 GEO 강화로 대응하세요.'}
                  {s.type === 'Niche Capture' && '신규 출현(Emerging) Context를 빠르게 감지하여 경쟁사 진입 전 선점 시점을 포착하세요.'}
                  {s.type === 'Brand Build' && '기간 비교로 Informational → Commercial 인텐트 전환 신호를 감지하면 전략을 Offensive로 업그레이드하세요.'}
                  {s.type === 'Monitor' && '소멸(Disappeared) Context는 추적 중단, Priority Score가 급등하는 신규 출현 Context는 전략 재분류하세요.'}
                </p>
              </div>

              {/* Cognition × Strategy FORGE 매트릭스 */}
              <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Cognition × FORGE 추천 매트릭스
                </div>
                <div className="space-y-1.5">
                  {/* Header row */}
                  <div className="grid grid-cols-[56px_1fr_1fr_1fr] gap-1 pb-1 border-b border-slate-100 dark:border-white/5">
                    <span className="text-[7px] font-black text-slate-300 dark:text-slate-600 uppercase">Intent</span>
                    <span className="text-[7px] font-black text-slate-300 dark:text-slate-600 uppercase">Media</span>
                    <span className="text-[7px] font-black text-slate-300 dark:text-slate-600 uppercase">Content</span>
                    <span className="text-[7px] font-black text-slate-300 dark:text-slate-600 uppercase">Opt.</span>
                  </div>

                  {/* Offensive rows */}
                  {s.type === 'Offensive' && (
                    <>
                      <ForgeRow intent="INFO" intentColor="slate" media="Owned Hub" content="SEO 롱폼" opt="SEO+AEO" />
                      <ForgeRow intent="EXPL" intentColor="sky" media="Owned Spoke" content="지원 아티클" opt="SEO" />
                      <ForgeRow intent="COMM" intentColor="amber" media="Paid" content="검색광고" opt="SEM" />
                      <ForgeRow intent="TRAN" intentColor="rose" media="Paid" content="랜딩 카피" opt="SEM+CPA" />
                    </>
                  )}

                  {/* Defensive rows */}
                  {s.type === 'Defensive' && (
                    <>
                      <ForgeRow intent="INFO" intentColor="slate" media="Owned Hub" content="GEO 엔티티" opt="SEO+AEO+GEO" />
                      <ForgeRow intent="EXPL" intentColor="sky" media="Earned" content="보도자료" opt="SEO" />
                      <ForgeRow intent="COMM" intentColor="amber" media="Owned Spoke" content="케이스 스터디" opt="SEO" />
                      <ForgeRow intent="TRAN" intentColor="rose" media="Paid" content="검색광고" opt="SEM" />
                    </>
                  )}

                  {/* Niche Capture rows */}
                  {s.type === 'Niche Capture' && (
                    <>
                      <ForgeRow intent="INFO" intentColor="slate" media="Owned Hub" content="AEO FAQ" opt="SEO+AEO+GEO" />
                      <ForgeRow intent="EXPL" intentColor="sky" media="Owned Hub" content="AEO FAQ 확장" opt="SEO+AEO" />
                      <ForgeRow intent="COMM" intentColor="amber" media="Paid" content="소셜 광고" opt="SEM" />
                      <ForgeRow intent="TRAN" intentColor="rose" media="Paid" content="소셜 광고" opt="SEM" />
                    </>
                  )}

                  {/* Brand Build rows */}
                  {s.type === 'Brand Build' && (
                    <>
                      <ForgeRow intent="INFO" intentColor="slate" media="Owned Hub" content="SEO 롱폼" opt="SEO+AEO+GEO" />
                      <ForgeRow intent="EXPL" intentColor="sky" media="Earned" content="인플루언서" opt="SEO" />
                      <ForgeRow intent="COMM" intentColor="amber" media="Owned Hub" content="GEO 엔티티" opt="SEO+AEO+GEO" />
                      <ForgeRow intent="TRAN" intentColor="rose" media="Earned" content="커뮤니티" opt="SEO" />
                    </>
                  )}

                  {/* Monitor rows */}
                  {s.type === 'Monitor' && (
                    <>
                      <ForgeRow intent="INFO" intentColor="slate" media="Owned Spoke" content="FAQ 확장" opt="SEO+AEO" />
                      <ForgeRow intent="EXPL" intentColor="sky" media="Owned Spoke" content="케이스 스터디" opt="SEO" />
                      <ForgeRow intent="COMM" intentColor="amber" media="Owned Spoke" content="FAQ 확장" opt="SEO" />
                      <ForgeRow intent="TRAN" intentColor="rose" media="Owned Spoke" content="지원 아티클" opt="SEO" />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-8 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/3 flex items-center justify-between">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{selected + 1} / {strategies.length} 전략</p>
          <div className="flex gap-3">
            <button
              onClick={() => setSelected(i => Math.max(0, i - 1))}
              disabled={selected === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-30"
            >
              ← 이전
            </button>
            {selected === strategies.length - 1 ? (
              <button onClick={onClose} className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md">
                완료
              </button>
            ) : (
              <button
                onClick={() => setSelected(i => Math.min(strategies.length - 1, i + 1))}
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

export default StrategyGuideModal;
