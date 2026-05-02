
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExecutionPlan, OwnedMediaPlan, VeoPromptPair } from '../core/context';

// ── 구형 plan 마이그레이션 ───────────────────────────────────────────────────
function migrateLegacyPlan(plan: any): ExecutionPlan {
  if (plan.ownedMedia) return plan as ExecutionPlan;
  const owned: OwnedMediaPlan = {
    hubContent:   plan.contentStrategy ?? [],
    spokeContent: [],
    seoStrategy:  plan.seoStrategy ?? [],
    aeoStrategy:  [],
    geoStrategy:  [],
  };
  return {
    situationSummary:  plan.situationSummary ?? '',
    executionPriority: plan.executionPriority ?? 'Low',
    resourceIntensity: plan.resourceIntensity ?? 'light',
    ownedMedia:   owned,
    earnedMedia:  [],
    paidMedia:    plan.paidStrategy ?? [],
    kpiFramework: plan.kpiFramework ?? [],
  };
}

// ── 공통 UI 블록 ─────────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<string, string> = {
  High:   'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
  Low:    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/40',
};

const INTENSITY_LABEL: Record<string, string> = {
  light:      '경량 운영',
  moderate:   '중강도',
  aggressive: '고강도',
};

interface BulletProps { items: string[]; dot: string; }
const BulletList: React.FC<BulletProps> = ({ items, dot }) => (
  <ul className="space-y-1.5">
    {(items ?? []).filter(Boolean).map((item, i) => (
      <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 leading-snug break-keep">
        <span className={`mt-[3px] w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
        {item}
      </li>
    ))}
  </ul>
);

interface SubSectionProps { label: string; badge?: string; items: string[]; dot: string; }
const SubSection: React.FC<SubSectionProps> = ({ label, badge, items, dot }) => {
  if (!items?.length) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
        <span className={`text-[9px] font-black uppercase tracking-widest ${dot.replace('bg-', 'text-')}`}>
          {label}
        </span>
        {badge && (
          <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <BulletList items={items} dot={dot} />
    </div>
  );
};

const LayerTag = ({ label, color }: { label: string; color: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${color}`}>
    {label}
  </span>
);

// ── 미디어 섹션 컴포넌트 (개별 접기/펼치기) ─────────────────────────────────────

interface MediaSectionProps {
  tier: 'owned' | 'earned' | 'paid';
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const TIER_HEADER = {
  owned: {
    label: 'HUB · Owned Media',
    badge: 'Single Source of Truth',
    dot: 'bg-indigo-600',
    headerBg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    layers: ['SEO', 'AEO', 'GEO'],
    layerColors: [
      'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
      'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
      'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
    ],
  },
  earned: {
    label: 'SPOKE 1 · Earned Media',
    badge: '신뢰도 증폭기',
    dot: 'bg-emerald-500',
    headerBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    layers: ['GEO↑', 'AEO↑', 'DA↑'],
    layerColors: [
      'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
      'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    ],
  },
  paid: {
    label: 'SPOKE 2 · Paid Media',
    badge: '트래픽 모터',
    dot: 'bg-rose-500',
    headerBg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    layers: ['SEM', 'CPA', 'RTG'],
    layerColors: [
      'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
      'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    ],
  },
};

const MediaSection: React.FC<MediaSectionProps> = ({ tier, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const h = TIER_HEADER[tier];
  return (
    <div className={`rounded-2xl border ${h.border} overflow-hidden`}>
      {/* 섹션 헤더 — 항상 표시 */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 ${h.headerBg} transition-colors hover:opacity-90`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${h.dot}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${h.text}`}>{h.label}</span>
          <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
            {h.badge}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Optimization layer tags */}
          <div className="flex gap-1">
            {h.layers.map((l, i) => (
              <span key={l} className={`text-[7px] font-black px-1 py-0.5 rounded ${h.layerColors[i]}`}>{l}</span>
            ))}
          </div>
          <svg
            className={`w-3.5 h-3.5 ${h.text} transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {/* 콘텐츠 — 펼쳐질 때 표시 */}
      {open && (
        <div className="p-4 bg-white dark:bg-white/[0.02] space-y-4 animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

// ── FORGE Veo 크리에이티브 섹션 ────────────────────────────────────────────────

interface ForgeVeoSectionProps { prompts: VeoPromptPair; situationSummary?: string; }

const ForgeVeoSection: React.FC<ForgeVeoSectionProps> = ({ prompts, situationSummary }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const navigate = useNavigate();

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openInForge = () => {
    sessionStorage.setItem('forge_context', JSON.stringify({
      source: 'c3',
      situationSummary: situationSummary ?? '',
      reels15s: prompts.reels15s,
      shorts30s: prompts.shorts30s,
    }));
    navigate('/tools/forge');
  };

  const cards = [
    {
      key: 'reels15s',
      label: 'REELS 15S',
      badge: '숏폼 · 9:16',
      desc: '강한 첫 3초 훅',
      text: prompts.reels15s,
      gradient: 'from-orange-500 to-rose-500',
    },
    {
      key: 'shorts30s',
      label: 'SHORTS 30S',
      badge: '스토리텔링 · 9:16',
      desc: '문제 → 해결 → CTA',
      text: prompts.shorts30s,
      gradient: 'from-violet-500 to-indigo-500',
    },
  ];

  return (
    <div className="rounded-2xl border border-orange-200 dark:border-orange-500/20 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-50 to-rose-50 dark:from-orange-900/20 dark:to-rose-900/20 px-4 py-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-orange-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-300">
          FORGE · Veo 크리에이티브
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Veo 3.1
          </span>
          <button
            onClick={openInForge}
            className="flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            FORGE에서 열기
          </button>
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-white/[0.02] space-y-3">
        {cards.filter(c => c.text).map(card => (
          <div key={card.key} className="rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/40 px-3 py-2 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-1.5">
                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded bg-gradient-to-r ${card.gradient} text-white`}>
                  {card.label}
                </span>
                <span className="text-[8px] text-slate-500 dark:text-slate-400">{card.badge}</span>
                <span className="text-[7px] text-slate-400 dark:text-slate-500">/ {card.desc}</span>
              </div>
              <button
                onClick={() => copy(card.text, card.key)}
                className="text-[9px] font-bold px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                {copiedKey === card.key ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-3">
              <p className="text-[10px] font-mono text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                {card.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

interface StrategicBriefProps {
  plan: ExecutionPlan | undefined;
  isLoading: boolean;
}

const StrategicBrief: React.FC<StrategicBriefProps> = ({ plan: rawPlan, isLoading }) => {
  const plan = useMemo(() => rawPlan ? migrateLegacyPlan(rawPlan as any) : undefined, [rawPlan]);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[12, 40, 40, 40].map((h, i) => (
          <div key={i} style={{ height: `${h * 4}px` }} className="bg-slate-200 dark:bg-white/10 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (!plan) return null;

  return (
    <div className="space-y-4">

      {/* ── 1. Closed-Loop 다이어그램 ── */}
      <div className="rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="flex items-stretch text-[8px] font-black">
          <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-2 flex flex-col gap-0.5">
            <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Spoke 1</span>
            <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300">Earned</span>
            <div className="flex gap-1 mt-0.5">
              <span className="text-[7px] px-1 py-0.5 rounded bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 font-bold">GEO↑</span>
              <span className="text-[7px] px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold">AEO↑</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800/60 px-1.5">
            <span className="text-emerald-400 dark:text-emerald-600 text-xs">→</span>
          </div>
          <div className="flex-[1.4] bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 flex flex-col gap-0.5 border-x border-slate-200 dark:border-white/5">
            <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">HUB · Single Source of Truth</span>
            <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-300">Owned Media</span>
            <div className="flex gap-1 mt-0.5">
              <span className="text-[7px] px-1 py-0.5 rounded bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-bold">SEO</span>
              <span className="text-[7px] px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold">AEO</span>
              <span className="text-[7px] px-1 py-0.5 rounded bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 font-bold">GEO</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800/60 px-1.5">
            <span className="text-rose-400 dark:text-rose-600 text-xs">←</span>
          </div>
          <div className="flex-1 bg-rose-50 dark:bg-rose-900/20 px-2.5 py-2 flex flex-col gap-0.5">
            <span className="text-[7px] font-black text-rose-400 uppercase tracking-widest">Spoke 2</span>
            <span className="text-[9px] font-black text-rose-700 dark:text-rose-300">Paid</span>
            <div className="flex gap-1 mt-0.5">
              <span className="text-[7px] px-1 py-0.5 rounded bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-bold">SEM</span>
              <span className="text-[7px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold">CPA</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/30 px-3 py-1 border-t border-slate-200 dark:border-white/5 flex items-center justify-center">
          <span className="text-[7px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            Closed-Loop — 모든 Spoke 신호가 Hub(AI 정답지)로 수렴
          </span>
        </div>
      </div>

      {/* ── 2. Strategic Context ── */}
      <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-white/10 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Strategic Context</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${PRIORITY_STYLE[plan.executionPriority] || PRIORITY_STYLE.Low}`}>
              {plan.executionPriority} Priority
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-500 font-mono">
              {INTENSITY_LABEL[plan.resourceIntensity] || plan.resourceIntensity}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed italic break-keep">
          "{plan.situationSummary}"
        </p>
      </div>

      {/* ── 3. HUB · Owned Media ── */}
      <MediaSection tier="owned" defaultOpen={true}>
        <SubSection
          label="Hub 핵심 콘텐츠 (Primary)"
          badge="SEO+AEO+GEO 직접 적용"
          items={plan.ownedMedia.hubContent ?? []}
          dot="bg-indigo-600"
        />
        <SubSection
          label="파생 채널 콘텐츠 (Derived)"
          badge="SEO + Hub 내부링크"
          items={plan.ownedMedia.spokeContent ?? []}
          dot="bg-indigo-300 dark:bg-indigo-700"
        />
        {/* 검색 최적화 레이어 */}
        {(plan.ownedMedia.seoStrategy?.length > 0 || plan.ownedMedia.aeoStrategy?.length > 0 || plan.ownedMedia.geoStrategy?.length > 0) && (
          <div className="rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2 flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">검색 최적화 레이어</span>
              <div className="ml-auto flex gap-1">
                <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-black">SEO</span>
                <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-black">AEO</span>
                <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 font-black">GEO</span>
              </div>
            </div>
            <div className="p-3 space-y-3 bg-white dark:bg-white/[0.02]">
              <SubSection label="SEO — 검색엔진 최적화" badge="키워드·E-E-A-T·내부링크" items={plan.ownedMedia.seoStrategy ?? []} dot="bg-sky-500" />
              <SubSection label="AEO — 답변 엔진 최적화" badge="Featured Snippet·PAA·FAQ" items={plan.ownedMedia.aeoStrategy ?? []} dot="bg-violet-500" />
              <SubSection label="GEO — 생성형 AI 검색" badge="ChatGPT·Gemini·Perplexity 인용" items={plan.ownedMedia.geoStrategy ?? []} dot="bg-fuchsia-500" />
            </div>
          </div>
        )}
      </MediaSection>

      {/* ── 4. SPOKE 1 · Earned Media ── */}
      <MediaSection tier="earned" defaultOpen={true}>
        <BulletList items={plan.earnedMedia ?? []} dot="bg-emerald-500" />
        <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hub로 수렴하는 최적화 신호</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <LayerTag label="GEO ↑" color="bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200 dark:bg-fuchsia-900/20 dark:text-fuchsia-400 dark:border-fuchsia-700/30" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">보도자료·인플루언서 브리프에 브랜드+기술 엔티티 동시 노출(Co-occurrence) → AI Citation 신뢰 가중치 상승</span>
            </div>
            <div className="flex items-start gap-2">
              <LayerTag label="AEO ↑" color="bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-700/30" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">커뮤니티 게시글에 Q&A 구조로 PAA 질문 선점 시딩 → Hub AEO FAQ 간접 강화</span>
            </div>
            <div className="flex items-start gap-2">
              <LayerTag label="SEO DA↑" color="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/30" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">외부 언론·커뮤니티 백링크 + Unlinked Mention 축적 → Hub 도메인 권위(DA · E-E-A-T) 보강</span>
            </div>
          </div>
        </div>
      </MediaSection>

      {/* ── 5. SPOKE 2 · Paid Media ── */}
      <MediaSection tier="paid" defaultOpen={true}>
        <BulletList items={plan.paidMedia ?? []} dot="bg-rose-500" />
        <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hub로 트래픽을 쏟는 전략</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <LayerTag label="SEM" color="bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-700/30" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">오가닉 SEO 공백 키워드 단기 점유 → SERP 상단 즉각 확보, Hub 트래픽 유입</span>
            </div>
            <div className="flex items-start gap-2">
              <LayerTag label="AEO 랜딩" color="bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-700/30" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">랜딩 페이지 직접 답변 구조(역피라미드) + 비교표 + FAQ → 전환 장벽 해소 + Quality Score↑</span>
            </div>
            <div className="flex items-start gap-2">
              <LayerTag label="Retargeting" color="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">Hub 방문자 리타게팅 → Owned 자산 ROI 극대화, GEO 고부가 자산(백서) 타겟 배포</span>
            </div>
          </div>
        </div>
      </MediaSection>

      {/* ── 6. KPI Framework ── */}
      {(plan.kpiFramework ?? []).length > 0 && (
        <div className="border-t border-slate-200 dark:border-white/5 pt-3">
          <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">KPI Framework</div>
          <div className="flex flex-wrap gap-1.5">
            {plan.kpiFramework.map((kpi, i) => (
              <span key={i} className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold break-keep">
                {kpi}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. AEGIS FORGE — Veo 크리에이티브 프롬프트 ── */}
      {plan.veoPrompts && (plan.veoPrompts.reels15s || plan.veoPrompts.shorts30s) && (
        <ForgeVeoSection prompts={plan.veoPrompts} situationSummary={plan.situationSummary} />
      )}
    </div>
  );
};

export default StrategicBrief;
