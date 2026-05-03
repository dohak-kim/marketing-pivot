
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Context, StrategyType } from '../core/context';
import { forgeOutputToMarkdown, copyToClipboard } from '../utils/export';
import {
  ForgeConfig, ForgeOutput, MediaType, ContentSubType,
  ToneAndManner, TargetLength, OptimizationLayer,
  MEDIA_TYPE_META, SUB_TYPE_OPTIONS, TONE_OPTIONS, LENGTH_OPTIONS,
} from '../core/types/contentGeneration';
import { generateForgeContent, getForgeRecommendation } from '../ai/forge';
import { ExecutionPlan } from '../core/context';
import { buildForgeWorkflow } from '../content/forgeWorkflow';
import type { ForgeWorkflowItem } from '../core/types/forgeWorkflow';

interface ForgeStudioProps {
  context: Context;
  strategyType?: StrategyType;
  brandName?: string;
  executionPlan?: ExecutionPlan;
  onOutputGenerated?: (output: ForgeOutput) => void;
}

// ── Quality Bar ───────────────────────────────────────────────────────────
const QualityBar: React.FC<{ label: string; value: number; color: string; enabled: boolean }> = ({ label, value, color, enabled }) => {
  if (!enabled) return null;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`text-[10px] font-mono font-black ${color}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.replace('text-','bg-')}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

// ── Copy Button ───────────────────────────────────────────────────────────
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-all"
    >
      {copied ? (
        <><svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg> 복사됨</>
      ) : (
        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> 복사</>
      )}
    </button>
  );
};

// ── Content Renderer ──────────────────────────────────────────────────────
const ContentBlock: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-sans">
      {lines.map((line, i) => {
        if (line.startsWith('# '))  return <h1 key={i} className="text-xl font-black text-slate-900 dark:text-white mt-4 mb-2 leading-tight">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-base font-black text-slate-800 dark:text-slate-100 mt-4 mb-1.5 leading-tight">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mt-3 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
        if (line.startsWith('---')) return <hr key={i} className="border-slate-200 dark:border-slate-700 my-3" />;
        if (!line.trim()) return <div key={i} className="h-2" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
};

// ── Tier meta (3-tier: Hub / Spoke1·Earned / Spoke2·Paid) ────────────────────
// MediaLayer import removed — using MediaTier now
const TIER_META = {
  hub: {
    label: 'HUB · Owned Media',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/10',
    border: 'border-indigo-200 dark:border-indigo-500/20',
    desc: 'Single Source of Truth — 3중 최적화(SEO+AEO+GEO) 직접 적용',
    roleLabel: { primary: '핵심 콘텐츠', derived: '파생 콘텐츠' },
    roleDot: { primary: 'bg-indigo-600', derived: 'bg-indigo-300 dark:bg-indigo-700' },
  },
  spoke1_earned: {
    label: 'SPOKE 1 · Earned Media',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    desc: '신뢰도 증폭 — GEO 인용 신호 + AEO Q&A 시딩 → Hub 권위 강화',
  },
  spoke2_paid: {
    label: 'SPOKE 2 · Paid Media',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/10',
    border: 'border-rose-200 dark:border-rose-500/20',
    desc: '트래픽 모터 — SEO 공백 즉시 보완, Hub로 직접 트래픽 유입',
  },
};

const OPT_BADGE: React.FC<{ active: boolean; label: string; trigger?: string }> = ({ active, label, trigger }) => {
  if (!active) return null;
  const isByData = trigger === 'serp_data';
  return (
    <span className={`text-[7px] font-black px-1 py-0.5 rounded ${isByData ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
      {label}{isByData ? ' ✓' : ''}
    </span>
  );
};

// ── Markdown Copy Button ──────────────────────────────────────────────────
const MarkdownCopyButton: React.FC<{
  output: ForgeOutput;
  clusterName?: string;
  strategyType?: StrategyType;
}> = ({ output, clusterName, strategyType }) => {
  const [state, setState] = useState<'idle' | 'done' | 'err'>('idle');
  const handle = async () => {
    const md = forgeOutputToMarkdown(output, { clusterName, strategyType });
    const ok = await copyToClipboard(md);
    setState(ok ? 'done' : 'err');
    setTimeout(() => setState('idle'), 2000);
  };
  return (
    <button
      onClick={handle}
      title="Markdown 형식으로 전체 복사"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30 transition-all"
    >
      {state === 'done' ? (
        <><svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg> MD 복사됨</>
      ) : (
        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> MD 복사</>
      )}
    </button>
  );
};

// ── 마크다운 → HTML 변환 (Blog Editor Tiptap 포맷) ───────────────────────
function forgeContentToHtml(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let listBuf: string[] = [];
  const flushList = () => { if (listBuf.length) { out.push(`<ul>${listBuf.map(i => `<li>${i}</li>`).join('')}</ul>`); listBuf = []; } };
  for (const line of lines) {
    if (line.startsWith('# '))   { flushList(); out.push(`<h1>${line.slice(2)}</h1>`); }
    else if (line.startsWith('## '))  { flushList(); out.push(`<h2>${line.slice(3)}</h2>`); }
    else if (line.startsWith('### ')) { flushList(); out.push(`<h3>${line.slice(4)}</h3>`); }
    else if (line.startsWith('- ') || line.startsWith('• ')) { listBuf.push(line.slice(2)); }
    else if (line.startsWith('---'))  { flushList(); out.push('<hr>'); }
    else if (!line.trim())            { flushList(); }
    else                              { flushList(); out.push(`<p>${line}</p>`); }
  }
  flushList();
  return out.join('');
}

// ── Main Component ─────────────────────────────────────────────────────────
const ForgeStudio: React.FC<ForgeStudioProps> = ({ context, strategyType, brandName, executionPlan, onOutputGenerated }) => {
  const navigate = useNavigate();
  const recommendation = useMemo(() => getForgeRecommendation(context, strategyType), [context, strategyType]);
  const workflow = useMemo(() => buildForgeWorkflow(context, strategyType || 'brand_build', executionPlan), [context, strategyType, executionPlan]);

  const [selectedWorkflowItem, setSelectedWorkflowItem] = useState<ForgeWorkflowItem | null>(null);

  const [mediaType, setMediaType]   = useState<MediaType>(recommendation.mediaType);
  const [subType, setSubType]       = useState<ContentSubType>(recommendation.subType);
  const [tone, setTone]             = useState<ToneAndManner>(recommendation.tone);
  const [targetLength, setLength]   = useState<TargetLength>(recommendation.targetLength);
  const [optimization, setOptimization] = useState<OptimizationLayer>(recommendation.optimization);

  const handleSelectWorkflowItem = (item: ForgeWorkflowItem) => {
    setSelectedWorkflowItem(item);
    setMediaType(item.mediaType);
    setSubType(item.subType);
    setTone(item.tone);
    setLength(item.targetLength);
    setOptimization(item.optimization);
    setOutput(null);
  };

  const [output, setOutput]         = useState<ForgeOutput | null>(null);
  const [activeVariant, setActiveVariant] = useState(0);
  const [isForging, setIsForging]   = useState(false);
  const [error, setError]           = useState('');
  const outputRef = useRef<HTMLDivElement>(null);

  const config: ForgeConfig = { mediaType, subType, tone, targetLength, optimization };

  const handleMediaTypeChange = (mt: MediaType) => {
    setMediaType(mt);
    const firstSub = SUB_TYPE_OPTIONS[mt][0];
    if (firstSub) setSubType(firstSub.value);
    setOutput(null);
  };

  const handleForge = async () => {
    setIsForging(true);
    setError('');
    setOutput(null);
    try {
      const result = await generateForgeContent(context, config, strategyType, brandName, executionPlan);
      setOutput(result);
      setActiveVariant(0);
      onOutputGenerated?.(result);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e: any) {
      setError(e?.message || '콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setIsForging(false);
    }
  };

  const handleReforge = () => { setOutput(null); handleForge(); };

  const [sentToBlog, setSentToBlog] = useState(false);
  const handleSendToBlog = () => {
    if (!output) return;
    const raw = output.variants?.[activeVariant] ?? output.mainContent;
    const firstH1 = raw.split('\n').find(l => l.startsWith('# '));
    const title = firstH1 ? firstH1.slice(2).trim() : (context.marketSignal?.clusterName ?? 'FORGE 콘텐츠');
    sessionStorage.setItem('signal_to_blog', JSON.stringify({
      title,
      content: forgeContentToHtml(raw),
      tags: [context.marketSignal?.clusterName ?? ''].filter(Boolean),
      excerpt: raw.replace(/^#+ .+\n?/gm, '').replace(/\n+/g, ' ').trim().slice(0, 160),
    }));
    setSentToBlog(true);
    setTimeout(() => { navigate('/admin/blog'); }, 500);
  };

  const meta = MEDIA_TYPE_META[mediaType];
  const st = strategyType || (context as any).strategyType;
  const strategyLabels: Record<string, { label: string; color: string }> = {
    offensive:    { label: '공격 (Offensive)',   color: 'text-rose-600 dark:text-rose-400' },
    defensive:    { label: '방어 (Defensive)',   color: 'text-sky-600 dark:text-sky-400' },
    niche_capture:{ label: '신규 진입 (Niche)', color: 'text-amber-600 dark:text-amber-400' },
    brand_build:  { label: '브랜드 빌드',        color: 'text-violet-600 dark:text-violet-400' },
    monitor:      { label: '관찰 (Monitor)',     color: 'text-slate-500 dark:text-slate-400' },
  };
  const strategyInfo = strategyLabels[st] || { label: st || '-', color: 'text-slate-500' };

  return (
    <div className="space-y-8 font-sans">

      {/* ── C³ Intelligence Banner ── */}
      <div className="bg-gradient-to-r from-indigo-600/8 to-violet-600/8 dark:from-indigo-500/10 dark:to-violet-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">C³ Intelligence Active</span>
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{context.marketSignal?.clusterName || context.situation}</p>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className={`text-[10px] font-black uppercase tracking-tight ${strategyInfo.color}`}>{strategyInfo.label}</span>
              <span className="text-[10px] text-slate-400">·</span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Priority {context.marketSignal?.priorityScore}pt</span>
            </div>
          </div>
          {/* AI Recommendation badge */}
          <div className={`shrink-0 ${meta.bg} ${meta.border} border rounded-xl p-3 text-center min-w-[140px]`}>
            <div className={`text-[8px] font-black uppercase tracking-widest ${meta.color} mb-1`}>AI 권고</div>
            <div className={`text-[11px] font-black ${meta.color}`}>{meta.label}</div>
            <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{recommendation.rationale}</div>
          </div>
        </div>
      </div>

      {/* ── Campaign Architecture: Hub & Spoke (3-tier) ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-700 dark:bg-slate-600 flex items-center justify-center text-[8px] font-black text-white">⬡</span>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Campaign Architecture — Hub &amp; Spoke</span>
          <span className="ml-auto text-[9px] text-slate-400 dark:text-slate-600">항목 클릭 → 하단 자동 설정</span>
        </div>

        {/* ── HUB: Owned Media (Single Source of Truth) ── */}
        {(() => {
          const tm = TIER_META.hub;
          const primary = workflow.hub.filter(i => i.hubRole === 'primary');
          const derived  = workflow.hub.filter(i => i.hubRole === 'derived');
          return (
            <div className={`rounded-2xl border-2 ${tm.border} ${tm.bg} p-4 space-y-3`}>
              {/* Hub header */}
              <div>
                <div className={`text-[10px] font-black uppercase tracking-widest ${tm.color}`}>{tm.label}</div>
                <div className="text-[8px] text-slate-500 dark:text-slate-400 mt-0.5">{tm.desc}</div>
                {/* Optimization layers */}
                <div className="flex gap-1 mt-2">
                  {['SEO','AEO','GEO'].map(l => (
                    <span key={l} className={`text-[7px] font-black px-1.5 py-0.5 rounded ${
                      l==='SEO' ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                    : l==='AEO' ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                    :             'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400'
                    }`}>{l}</span>
                  ))}
                  <span className="text-[7px] text-slate-400 dark:text-slate-600 ml-1">직접 적용</span>
                </div>
              </div>

              {/* Primary + Derived sub-sections */}
              {[
                { role: 'primary' as const, items: primary },
                { role: 'derived' as const, items: derived },
              ].map(({ role, items }) => items.length > 0 && (
                <div key={role} className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tm.roleLabel ? tm.roleDot?.[role] : 'bg-indigo-400'}`} />
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {role === 'primary' ? '핵심 콘텐츠 (Primary)' : '파생 채널 콘텐츠 (Derived)'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {items.map(item => {
                      const isSelected = selectedWorkflowItem?.id === item.id;
                      return (
                        <button key={item.id} onClick={() => handleSelectWorkflowItem(item)}
                          className={`w-full text-left px-3 py-2 rounded-xl border transition-all ${
                            isSelected ? `${tm.bg} ${tm.border} shadow-sm`
                            : 'bg-white/70 dark:bg-white/5 border-white dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 leading-snug flex-1">{item.contentBrief}</span>
                            {isSelected && <svg className={`w-3 h-3 shrink-0 mt-0.5 ${tm.color}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                          </div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {item.optimization.seo && <span className="text-[7px] font-black px-1 py-0.5 rounded bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">SEO</span>}
                            <OPT_BADGE active={item.optimization.aeo} label="AEO" trigger={item.aeoTrigger} />
                            <OPT_BADGE active={item.optimization.geo} label="GEO" trigger={item.geoTrigger} />
                            <span className="text-[7px] text-slate-400 dark:text-slate-600 ml-auto">{item.subType.replace(/_/g,' ')} · {item.targetLength}자</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── Spoke 1 & 2: 화살표가 Hub를 향함 (Closed-Loop) ── */}
        <div className="grid grid-cols-2 gap-3">
          {(['spoke1_earned', 'spoke2_paid'] as const).map(tierKey => {
            const tm = TIER_META[tierKey];
            const items = workflow[tierKey];
            const arrow = tierKey === 'spoke1_earned' ? '→ Hub' : 'Hub ←';
            return (
              <div key={tierKey} className={`rounded-2xl border ${tm.border} ${tm.bg} p-4 space-y-2`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${tm.color}`}>{tm.label}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${tm.bg} ${tm.border} border ${tm.color}`}>{arrow}</span>
                  </div>
                  <div className="text-[8px] text-slate-500 dark:text-slate-400 mt-0.5">{tm.desc}</div>
                </div>
                <div className="space-y-1">
                  {items.map(item => {
                    const isSelected = selectedWorkflowItem?.id === item.id;
                    return (
                      <button key={item.id} onClick={() => handleSelectWorkflowItem(item)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl border transition-all ${
                          isSelected ? `${tm.bg} ${tm.border} shadow-sm`
                          : 'bg-white/70 dark:bg-white/5 border-white dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-200 leading-snug flex-1">{item.contentBrief}</span>
                          {isSelected && <svg className={`w-3 h-3 shrink-0 mt-0.5 ${tm.color}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                        <span className="text-[7px] text-slate-400 dark:text-slate-600">{item.subType.replace(/_/g,' ')} · {item.targetLength}자</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected item rationale */}
        {selectedWorkflowItem && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20">
            <svg className="w-3 h-3 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[9px] text-indigo-700 dark:text-indigo-300 font-medium">
              {selectedWorkflowItem.optimizationRationale}
              {selectedWorkflowItem.source === 'execution_plan' && <span className="ml-1.5 font-black text-indigo-500">· AI 실행계획 기반</span>}
            </span>
          </div>
        )}
      </div>

      {/* ── Step 01: Media Type ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">01</span>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">미디어 유형 선택</span>
          <span className="text-[9px] text-slate-400 dark:text-slate-600 ml-auto">위 아키텍처에서 항목 선택 시 자동 설정됨</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(MEDIA_TYPE_META) as MediaType[]).map(mt => {
            const m = MEDIA_TYPE_META[mt];
            const isSelected = mediaType === mt;
            const isRec = recommendation.mediaType === mt;
            return (
              <button
                key={mt}
                onClick={() => handleMediaTypeChange(mt)}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected
                    ? `${m.bg} ${m.border} shadow-md`
                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {isRec && (
                  <div className="absolute -top-2 -right-2 text-[7px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest">AI 권고</div>
                )}
                <div className={`text-2xl mb-2 ${isSelected ? m.color : 'text-slate-400'}`}>{m.icon}</div>
                <div className={`text-[11px] font-black uppercase tracking-widest mb-0.5 ${isSelected ? m.color : 'text-slate-700 dark:text-slate-300'}`}>{m.label}</div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">{m.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 02: Sub-type + Optimization ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sub-type */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">02</span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">콘텐츠 유형</span>
          </div>
          <div className="space-y-2">
            {SUB_TYPE_OPTIONS[mediaType].map(opt => (
              <button
                key={opt.value}
                onClick={() => { setSubType(opt.value); setOutput(null); }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  subType === opt.value
                    ? `${meta.bg} ${meta.border} ${meta.color} shadow-sm`
                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-black">{opt.label}</div>
                <div className="text-[9px] opacity-70 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Optimization Toggles */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">·</span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">최적화 레이어</span>
          </div>
          <div className="space-y-2">
            {/* SEO — always on */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30">
              <div>
                <div className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">SEO — 기본 레이어</div>
                <div className="text-[9px] text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">항상 적용 · 검색 엔진 최적화 기반</div>
              </div>
              <div className="w-8 h-4 bg-emerald-500 rounded-full flex items-center justify-end px-0.5 shadow-inner">
                <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            {/* AEO */}
            <button
              onClick={() => setOptimization(p => ({ ...p, aeo: !p.aeo }))}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                optimization.aeo
                  ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-500/30'
                  : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="text-left">
                <div className={`text-[11px] font-black ${optimization.aeo ? 'text-sky-700 dark:text-sky-300' : 'text-slate-500'}`}>AEO</div>
                <div className={`text-[9px] mt-0.5 ${optimization.aeo ? 'text-sky-600/70 dark:text-sky-400/60' : 'text-slate-400'}`}>FAQ · Featured Snippet · PAA 최적화</div>
              </div>
              <div className={`w-8 h-4 rounded-full flex items-center px-0.5 shadow-inner transition-all ${optimization.aeo ? 'bg-sky-500 justify-end' : 'bg-slate-200 dark:bg-slate-600 justify-start'}`}>
                <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
              </div>
            </button>
            {/* GEO */}
            <button
              onClick={() => setOptimization(p => ({ ...p, geo: !p.geo }))}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                optimization.geo
                  ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-500/30'
                  : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="text-left">
                <div className={`text-[11px] font-black ${optimization.geo ? 'text-violet-700 dark:text-violet-300' : 'text-slate-500'}`}>GEO</div>
                <div className={`text-[9px] mt-0.5 ${optimization.geo ? 'text-violet-600/70 dark:text-violet-400/60' : 'text-slate-400'}`}>ChatGPT · Gemini · Perplexity 인용 최적화</div>
              </div>
              <div className={`w-8 h-4 rounded-full flex items-center px-0.5 shadow-inner transition-all ${optimization.geo ? 'bg-violet-500 justify-end' : 'bg-slate-200 dark:bg-slate-600 justify-start'}`}>
                <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Step 03: Tone + Length ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">03</span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">톤앤매너</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map(t => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tone === t.value
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-500/40 shadow-sm'
                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className={`text-[11px] font-black ${tone === t.value ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>{t.labelKo}</div>
                <div className={`text-[9px] mt-0.5 ${tone === t.value ? 'text-indigo-500/70 dark:text-indigo-400/60' : 'text-slate-400'}`}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">·</span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">목표 분량</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {LENGTH_OPTIONS.map(l => (
              <button
                key={l.value}
                onClick={() => setLength(l.value as TargetLength)}
                className={`px-4 py-2.5 rounded-xl border text-[11px] font-black transition-all ${
                  targetLength === l.value
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="p-3 bg-slate-50 dark:bg-white/3 rounded-xl border border-slate-100 dark:border-white/5">
            <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="font-black text-slate-700 dark:text-slate-200">{MEDIA_TYPE_META[mediaType].labelKo}</span>의 권장 분량:
              {mediaType === 'owned_hub' && ' 1,000~3,000자 (허브 콘텐츠)'}
              {mediaType === 'owned_spoke' && ' 300~1,000자 (Spoke 지원글)'}
              {mediaType === 'earned' && ' 600~1,000자 (외부 채널 최적화)'}
              {mediaType === 'paid' && ' 300자 이하 (광고 소재 특성상 간결하게)'}
            </p>
          </div>
        </div>
      </div>

      {/* ── FORGE Execute Button ── */}
      <button
        onClick={handleForge}
        disabled={isForging}
        className={`w-full py-5 rounded-2xl text-base font-black uppercase tracking-[0.15em] transition-all relative overflow-hidden group ${
          isForging
            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.01] active:scale-[0.99]'
        }`}
      >
        {!isForging && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        )}
        {isForging ? (
          <span className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
            단조 중... C³ 인텔리전스 처리
          </span>
        ) : (
          <span className="flex items-center justify-center gap-3">
            <span className="text-xl">⚡</span>
            AEGIS FORGE — 콘텐츠 단조 실행
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${meta.badge} font-mono`}>
              {MEDIA_TYPE_META[mediaType].label}
            </span>
          </span>
        )}
      </button>

      {/* ── Error ── */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30 rounded-xl text-sm text-rose-700 dark:text-rose-300 font-medium">
          {error}
        </div>
      )}

      {/* ── Output ── */}
      {output && (
        <div ref={outputRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          {/* Output Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">FORGE 완료</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <CopyButton text={output.variants ? output.variants[activeVariant] : output.mainContent} />
              <MarkdownCopyButton output={output} clusterName={context.marketSignal?.clusterName} strategyType={strategyType} />
              {/* Blog Editor 전송 — 텍스트 허브 콘텐츠만 */}
              {mediaType === 'owned_hub' && (
                <button
                  onClick={handleSendToBlog}
                  disabled={sentToBlog}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 transition-all disabled:opacity-50"
                >
                  {sentToBlog ? (
                    <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg> 이동 중...</>
                  ) : (
                    <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg> Blog Editor에서 편집</>
                  )}
                </button>
              )}
              <button
                onClick={handleReforge}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                재단조
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Variant tabs (Paid only) */}
              {output.variants && output.variants.length > 0 && (
                <div className="flex gap-2">
                  {output.variants.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveVariant(i)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                        activeVariant === i
                          ? `${meta.bg} ${meta.border} ${meta.color} shadow-sm`
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      변형 {String.fromCharCode(65 + i)}
                    </button>
                  ))}
                </div>
              )}

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm max-h-[500px] overflow-y-auto no-scrollbar">
                <ContentBlock content={
                  output.variants && output.variants.length > 0
                    ? output.variants[activeVariant]
                    : output.mainContent
                } />
              </div>
            </div>

            {/* Quality + Checklist */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">콘텐츠 품질 지표</div>

                {/* Score bars */}
                <div className="space-y-3">
                  <QualityBar label="SEO" value={output.qualityScore.seo} color="text-emerald-600" enabled={true} />
                  <QualityBar label="AEO" value={output.qualityScore.aeo} color="text-sky-600" enabled={optimization.aeo} />
                  <QualityBar label="GEO" value={output.qualityScore.geo} color="text-violet-600" enabled={optimization.geo} />
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <QualityBar label="Overall" value={output.qualityScore.overall} color="text-indigo-600" enabled={true} />
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">체크리스트</div>
                  {[
                    { key: 'hasHeadingStructure',  label: 'H1/H2/H3 구조' },
                    { key: 'hasKeywordInIntro',    label: '도입부 키워드' },
                    { key: 'hasDirectAnswer',      label: '직접 답변 (AEO)' },
                    { key: 'hasCitableDefinition', label: '인용 정의 (GEO)' },
                  ].map(({ key, label }) => {
                    const val = output.qualityScore.checklist[key as keyof typeof output.qualityScore.checklist];
                    const isOk = Boolean(val);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${isOk ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                          {isOk && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                        </div>
                        <span className={`text-[9px] font-semibold ${isOk ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>{label}</span>
                      </div>
                    );
                  })}
                  {output.qualityScore.checklist.faqCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-sky-500 flex items-center justify-center">
                        <span className="text-[6px] text-white font-black">{output.qualityScore.checklist.faqCount}</span>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300">FAQ {output.qualityScore.checklist.faqCount}개</span>
                    </div>
                  )}
                  {output.qualityScore.checklist.entityCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-violet-500 flex items-center justify-center">
                        <span className="text-[6px] text-white font-black">{output.qualityScore.checklist.entityCount}</span>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300">엔티티 {output.qualityScore.checklist.entityCount}개</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Config summary */}
              <div className="bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/5 rounded-xl p-4 space-y-1.5">
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">생성 설정</div>
                {[
                  { l: '미디어', v: meta.labelKo },
                  { l: '톤', v: TONE_OPTIONS.find(t => t.value === output.config.tone)?.labelKo || '' },
                  { l: '분량', v: `${output.config.targetLength}자` },
                  { l: '최적화', v: [
                    'SEO',
                    output.config.optimization.aeo ? 'AEO' : '',
                    output.config.optimization.geo ? 'GEO' : '',
                  ].filter(Boolean).join(' + ') },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-[9px] text-slate-400">{l}</span>
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgeStudio;
