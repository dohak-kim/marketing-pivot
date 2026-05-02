
// ── AEGIS Print Report — Portal-rendered, print-only component ────────────
// Rendered at document.body level via React Portal.
// Normally hidden (display:none). @media print shows ONLY this component.

import React from 'react';
import { Context, ExecutionPlan } from '../core/context';
import { ForgeOutput } from '../core/types/contentGeneration';

interface PrintReportProps {
  context: Context | null;
  executionPlan?: ExecutionPlan;
  forgeOutput?: ForgeOutput | null;
  brandName?: string;
}

// ── Sub-components (all inline styles for print reliability) ─────────────

const Divider: React.FC = () => (
  <div style={{ height: 1, background: '#dcdcf5', margin: '14px 0' }} />
);

const SectionHeader: React.FC<{ title: string; badge?: string; badgeColor?: string }> = ({
  title, badge, badgeColor = '#4a40dc',
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 6, borderBottom: '1.5px solid #4a40dc' }}>
    <h2 style={{ margin: 0, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#4a40dc' }}>
      {title}
    </h2>
    {badge && (
      <span style={{ fontSize: 7.5, fontWeight: 900, background: '#e4e3ff', color: badgeColor, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {badge}
      </span>
    )}
  </div>
);

const MetaChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ background: '#f6f6fe', borderRadius: 6, padding: '5px 8px', minWidth: 80 }}>
    <div style={{ fontSize: 7, color: '#9291cc', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: 9.5, fontWeight: 800, color: '#3d3c72', marginTop: 1 }}>{value}</div>
  </div>
);

const ScoreBadge: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', background: '#f6f6fe', borderRadius: 8, padding: '8px 6px', minWidth: 64 }}>
    <div style={{ fontSize: 7.5, color: '#9291cc', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1.1, marginTop: 2 }}>{value}</div>
  </div>
);

const CognitionBar: React.FC<{ label: string; ko: string; value: number; color: string }> = ({ label, ko, value, color }) => (
  <div style={{ marginBottom: 6 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
      <span style={{ fontSize: 8.5, fontWeight: 700, color: '#525190' }}>{label} <span style={{ color: '#9291cc', fontWeight: 600 }}>· {ko}</span></span>
      <span style={{ fontSize: 8.5, fontWeight: 900, color, fontFamily: 'monospace' }}>{value}%</span>
    </div>
    <div style={{ height: 5, background: '#ededfb', borderRadius: 999 }}>
      <div style={{ height: 5, width: `${Math.min(value, 100)}%`, background: color, borderRadius: 999 }} />
    </div>
  </div>
);

const BulletList: React.FC<{ items: string[]; borderColor: string; max?: number }> = ({ items, borderColor, max = 4 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {items.slice(0, max).map((item, i) => (
      <div key={i} style={{ fontSize: 9, color: '#3d3c72', paddingLeft: 8, borderLeft: `2px solid ${borderColor}`, lineHeight: 1.55 }}>
        {item}
      </div>
    ))}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

const PrintReport: React.FC<PrintReportProps> = ({ context, executionPlan, forgeOutput, brandName }) => {
  if (!context) return null;

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  const cognitionVec = context.journey?.cognitionVector as Record<string, number> | undefined;
  const cogItems = [
    { label: 'Informational', ko: '콘텐츠 제작', val: Math.round((cognitionVec?.informational || 0) * 100), color: '#3b82f6' },
    { label: 'Exploratory',   ko: '비교·가이드',   val: Math.round((cognitionVec?.exploratory   || 0) * 100), color: '#8b5cf6' },
    { label: 'Commercial',    ko: 'USP·메시지',    val: Math.round((cognitionVec?.commercial    || 0) * 100), color: '#f59e0b' },
    { label: 'Transactional', ko: '전환·오퍼',     val: Math.round((cognitionVec?.transactional || 0) * 100), color: '#10b981' },
  ].sort((a, b) => b.val - a.val);

  const strategyLabelMap: Record<string, string> = {
    offensive: 'Offensive — 공격', defensive: 'Defensive — 방어',
    niche_capture: 'Niche Capture — 신규 진입', brand_build: 'Brand Build', monitor: 'Monitor — 관찰',
  };
  const strategyType = (context as any).strategyType || '';

  const plan = executionPlan;
  const forge = forgeOutput;
  const forgePrimaryContent = forge ? (forge.variants ? forge.variants[0] : forge.mainContent) : '';

  return (
    // .print-root — hidden by default, shown exclusively by @media print
    <div
      className="print-root"
      style={{
        display: 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'white',
        fontFamily: '"Noto Sans KR", "Noto Sans", Inter, sans-serif',
        color: '#131230',
        fontSize: 10,
        lineHeight: 1.65,
        padding: 0,
        margin: 0,
      }}
    >
      {/* Inner content: actual A4 page body */}
      <div style={{ padding: '0 0', maxWidth: '100%' }}>

        {/* ── Document Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 10, marginBottom: 16, borderBottom: '2.5px solid #4a40dc' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: '#1e1b4b', lineHeight: 1 }}>
              MAP<span style={{ color: '#4a40dc' }}>HACK</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#4a40dc', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 3 }}>
              C³ Cube Strategy — Intelligence Report
            </div>
            <div style={{ fontSize: 8.5, color: '#6b6aaa', marginTop: 2 }}>
              Project AEGIS · {brandName || '브랜드 미지정'} · {today} {timeStr}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 8, color: '#9291cc', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Priority Score</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#4a40dc', fontFamily: 'monospace', lineHeight: 1 }}>
              {context.marketSignal?.priorityScore ?? '—'}
            </div>
            <div style={{ fontSize: 8, color: '#9291cc' }}>/100</div>
          </div>
        </div>

        {/* ── Section 01: Context Intelligence ── */}
        <div style={{ marginBottom: 18 }}>
          <SectionHeader title="01. Context Intelligence" badge="C³ Analysis" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Left */}
            <div>
              <div style={{ background: '#f0efff', borderRadius: 8, padding: '9px 12px', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#3830b8', marginBottom: 4, lineHeight: 1.3 }}>
                  {context.marketSignal?.clusterName || context.situation}
                </div>
                <div style={{ fontSize: 9, color: '#525190', lineHeight: 1.65 }}>
                  {(context.description || context.situation || '').slice(0, 160)}
                  {(context.description || context.situation || '').length > 160 ? '…' : ''}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <MetaChip label="Conversion Stage" value={context.journey?.conversionStage || '—'} />
                <MetaChip label="Strategy Type"    value={strategyLabelMap[strategyType] || strategyType || '—'} />
                <MetaChip label="Naver Score"      value={`${context.marketSignal?.naverScore || 0}pt`} />
                <MetaChip label="Google Score"     value={`${context.marketSignal?.googleScore || 0}pt`} />
              </div>

              {/* Brand Presence */}
              {(context.brandPresence || []).length > 0 && (
                <div style={{ marginTop: 10, background: '#f6f6fe', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 7.5, color: '#9291cc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Brand Presence (SERP Top 10)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(context.brandPresence || []).slice(0, 6).map((b: any, i: number) => (
                      <span key={i} style={{ fontSize: 8.5, background: 'white', border: '1px solid #dcdcf5', borderRadius: 4, padding: '2px 6px', color: '#3d3c72', fontWeight: 700 }}>
                        {b.brand} <span style={{ color: '#4a40dc', fontFamily: 'monospace' }}>{b.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Cognition Vector */}
            <div>
              <div style={{ fontSize: 8, fontWeight: 900, color: '#9291cc', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Cognition Vector (Intensity)</div>
              {cogItems.map(ci => (
                <CognitionBar key={ci.label} label={ci.label} ko={ci.ko} value={ci.val} color={ci.color} />
              ))}
              <div style={{ fontSize: 7.5, color: '#c2c1e8', marginTop: 6, lineHeight: 1.5 }}>
                * 수치는 강도(Intensity). 총합이 100%를 초과할 수 있습니다.
              </div>

              {/* SERP Features */}
              {(context.serpFeaturesList || []).length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 7.5, color: '#9291cc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>SERP Features</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(context.serpFeaturesList || []).slice(0, 8).map((f: string, i: number) => (
                      <span key={i} style={{ fontSize: 8, background: '#ededfb', borderRadius: 4, padding: '1.5px 5px', color: '#525190' }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Divider />

        {/* ── Section 02: AI Triple Media Strategy — Hub & Spoke ── */}
        {plan && (
          <div style={{ marginBottom: 18 }}>
            <SectionHeader title="02. AI Triple Media Strategy — Hub & Spoke" badge="Owned · Earned · Paid" />

            {/* Situation Summary */}
            {plan.situationSummary && (
              <div style={{ background: '#f0efff', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 9.5, color: '#3d3c72', lineHeight: 1.7, fontStyle: 'italic' }}>
                {plan.situationSummary.slice(0, 220)}{plan.situationSummary.length > 220 ? '…' : ''}
              </div>
            )}

            {/* Hub & Spoke 아키텍처 다이어그램 (인쇄용) */}
            <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: 8, overflow: 'hidden', border: '1px solid #dcdcf5', marginBottom: 10 }}>
              {/* HUB */}
              <div style={{ flex: 2, background: '#ededfb', padding: '7px 10px' }}>
                <div style={{ fontSize: 7, fontWeight: 900, color: '#9291cc', textTransform: 'uppercase', letterSpacing: '0.12em' }}>HUB</div>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#4a40dc' }}>Owned Media</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                  {['SEO', 'AEO', 'GEO'].map(l => (
                    <span key={l} style={{ fontSize: 7, fontWeight: 800, background: 'white', border: '1px solid #cccaff', borderRadius: 3, padding: '1px 5px', color: '#4a40dc' }}>{l}</span>
                  ))}
                </div>
              </div>
              {/* 화살표 */}
              <div style={{ background: '#f6f6fe', padding: '7px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #dcdcf5', borderRight: '1px solid #dcdcf5' }}>
                <div style={{ fontSize: 7, fontWeight: 900, color: '#9291cc', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SPOKE</div>
                <div style={{ fontSize: 10, color: '#c2c1e8' }}>→</div>
              </div>
              {/* SPOKE 1: Earned */}
              <div style={{ flex: 1.5, background: '#ecfdf5', padding: '7px 10px', borderRight: '1px solid #dcdcf5' }}>
                <div style={{ fontSize: 7, fontWeight: 900, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SPOKE 1</div>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#059669' }}>Earned</div>
                <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
                  {['GEO↑', 'AEO↑'].map(l => (
                    <span key={l} style={{ fontSize: 7, fontWeight: 800, background: 'white', border: '1px solid #a7f3d0', borderRadius: 3, padding: '1px 4px', color: '#059669' }}>{l}</span>
                  ))}
                </div>
              </div>
              {/* SPOKE 2: Paid */}
              <div style={{ flex: 1.5, background: '#fff5f5', padding: '7px 10px' }}>
                <div style={{ fontSize: 7, fontWeight: 900, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SPOKE 2</div>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#dc2626' }}>Paid</div>
                <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
                  {['SEM', 'CPA'].map(l => (
                    <span key={l} style={{ fontSize: 7, fontWeight: 800, background: 'white', border: '1px solid #fecaca', borderRadius: 3, padding: '1px 4px', color: '#dc2626' }}>{l}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 3컬럼 전략 상세 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>

              {/* ── Owned Media (Hub) ── */}
              <div style={{ border: '1.5px solid #cccaff', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: '#ededfb', padding: '5px 10px', borderBottom: '1px solid #cccaff' }}>
                  <div style={{ fontSize: 7.5, fontWeight: 900, color: '#4a40dc', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    HUB · Owned Media
                  </div>
                </div>
                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Hub & Spoke 콘텐츠 */}
                  {(plan.ownedMedia?.hubContent || []).length > 0 && (
                    <div>
                      <div style={{ fontSize: 7, fontWeight: 900, color: '#6b6aaa', textTransform: 'uppercase', marginBottom: 3 }}>Hub 핵심 콘텐츠</div>
                      <BulletList items={plan.ownedMedia.hubContent} borderColor="#cccaff" max={2} />
                    </div>
                  )}
                  {(plan.ownedMedia?.spokeContent || []).length > 0 && (
                    <div>
                      <div style={{ fontSize: 7, fontWeight: 900, color: '#9291cc', textTransform: 'uppercase', marginBottom: 3 }}>Spoke 파생 콘텐츠</div>
                      <BulletList items={plan.ownedMedia.spokeContent} borderColor="#ddd6fe" max={2} />
                    </div>
                  )}
                  {/* 검색 최적화 레이어 */}
                  {(plan.ownedMedia?.seoStrategy || []).length > 0 && (
                    <div>
                      <div style={{ fontSize: 7, fontWeight: 900, color: '#0284c7', textTransform: 'uppercase', marginBottom: 3 }}>SEO</div>
                      <BulletList items={plan.ownedMedia.seoStrategy} borderColor="#bae6fd" max={2} />
                    </div>
                  )}
                  {(plan.ownedMedia?.aeoStrategy || []).length > 0 && (
                    <div>
                      <div style={{ fontSize: 7, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 3 }}>AEO</div>
                      <BulletList items={plan.ownedMedia.aeoStrategy} borderColor="#ddd6fe" max={2} />
                    </div>
                  )}
                  {(plan.ownedMedia?.geoStrategy || []).length > 0 && (
                    <div>
                      <div style={{ fontSize: 7, fontWeight: 900, color: '#c026d3', textTransform: 'uppercase', marginBottom: 3 }}>GEO</div>
                      <BulletList items={plan.ownedMedia.geoStrategy} borderColor="#f0abfc" max={2} />
                    </div>
                  )}
                </div>
              </div>

              {/* ── Earned Media (Spoke 1) ── */}
              <div style={{ border: '1.5px solid #a7f3d0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: '#ecfdf5', padding: '5px 10px', borderBottom: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: 7.5, fontWeight: 900, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    SPOKE 1 · Earned
                  </div>
                </div>
                <div style={{ padding: 10 }}>
                  <BulletList items={plan.earnedMedia || []} borderColor="#a7f3d0" max={4} />
                  {/* 최적화 기여 태그 */}
                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed #a7f3d0' }}>
                    <div style={{ fontSize: 7, color: '#6ee7b7', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>최적화 기여</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ fontSize: 7.5, color: '#3d3c72', paddingLeft: 6, borderLeft: '2px solid #c026d3' }}>GEO: 브랜드 인용 → AI 검색 노출</div>
                      <div style={{ fontSize: 7.5, color: '#3d3c72', paddingLeft: 6, borderLeft: '2px solid #7c3aed' }}>AEO: Q&A 시딩 → PAA 선점</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Paid Media (Spoke 2) ── */}
              <div style={{ border: '1.5px solid #fca5a5', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: '#fff5f5', padding: '5px 10px', borderBottom: '1px solid #fca5a5' }}>
                  <div style={{ fontSize: 7.5, fontWeight: 900, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    SPOKE 2 · Paid
                  </div>
                </div>
                <div style={{ padding: 10 }}>
                  <BulletList items={plan.paidMedia || []} borderColor="#fca5a5" max={4} />
                  {/* 최적화 기여 태그 */}
                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed #fca5a5' }}>
                    <div style={{ fontSize: 7, color: '#fca5a5', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>최적화 기여</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ fontSize: 7.5, color: '#3d3c72', paddingLeft: 6, borderLeft: '2px solid #0284c7' }}>SEM: SEO 공백 즉시 커버</div>
                      <div style={{ fontSize: 7.5, color: '#3d3c72', paddingLeft: 6, borderLeft: '2px solid #f59e0b' }}>CPA: 랜딩 + AEO FAQ 전환</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority + KPIs */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ background: '#f0efff', borderRadius: 6, padding: '5px 10px', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 7.5, color: '#9291cc', fontWeight: 700, textTransform: 'uppercase' }}>Priority</div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#4a40dc' }}>{plan.executionPriority || '—'}</div>
              </div>
              <div style={{ background: '#f0efff', borderRadius: 6, padding: '5px 10px', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 7.5, color: '#9291cc', fontWeight: 700, textTransform: 'uppercase' }}>Intensity</div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#4a40dc' }}>{plan.resourceIntensity || '—'}</div>
              </div>
              {(plan.kpiFramework || []).length > 0 && (
                <div style={{ flex: 1, background: '#f6f6fe', borderRadius: 6, padding: '5px 10px' }}>
                  <div style={{ fontSize: 7.5, color: '#9291cc', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>KPI Framework</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(plan.kpiFramework || []).map((k: string, i: number) => (
                      <span key={i} style={{ fontSize: 8, background: '#ededfb', padding: '1.5px 5px', borderRadius: 4, color: '#525190' }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Section 03: AEGIS FORGE Output ── */}
        {forge && forgePrimaryContent && (
          <>
            <Divider />
            <div style={{ marginBottom: 18 }}>
              <SectionHeader
                title="03. AEGIS FORGE — Generated Content"
                badge={`${forge.mediaType.replace('_',' ')} · ${forge.subType.replace(/_/g,' ')}`}
              />

              {/* Config + Quality */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 14 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { k: 'Media',        v: forge.mediaType.replace(/_/g,' ').toUpperCase() },
                    { k: 'Sub-type',     v: forge.subType.replace(/_/g,' ') },
                    { k: 'Tone',         v: forge.config.tone },
                    { k: 'Target',       v: `${forge.config.targetLength}자` },
                    { k: 'Optimization', v: [forge.config.optimization.seo && 'SEO', forge.config.optimization.aeo && 'AEO', forge.config.optimization.geo && 'GEO'].filter(Boolean).join(' + ') },
                  ].map(({ k, v }) => (
                    <div key={k} style={{ fontSize: 8, background: '#f0efff', padding: '2.5px 7px', borderRadius: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ color: '#9291cc', fontWeight: 700 }}>{k}:</span>
                      <span style={{ color: '#4a40dc', fontWeight: 900 }}>{v}</span>
                    </div>
                  ))}
                </div>
                {/* Quality scores */}
                <div style={{ display: 'flex', gap: 6, shrink: 0 } as any}>
                  <ScoreBadge label="SEO"     value={forge.qualityScore.seo}     color="#059669" />
                  {forge.config.optimization.aeo && <ScoreBadge label="AEO" value={forge.qualityScore.aeo} color="#0284c7" />}
                  {forge.config.optimization.geo && <ScoreBadge label="GEO" value={forge.qualityScore.geo} color="#7c3aed" />}
                  <ScoreBadge label="Overall" value={forge.qualityScore.overall} color="#4a40dc" />
                </div>
              </div>

              {/* Content body */}
              <div style={{ border: '1px solid #dcdcf5', borderRadius: 8, padding: '12px 14px', fontSize: 9.5, color: '#292858', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                {forgePrimaryContent.slice(0, 1400)}
                {forgePrimaryContent.length > 1400 ? '\n\n─── 이하 내용은 앱에서 확인하세요 ───' : ''}
              </div>

              {/* Variants indicator */}
              {forge.variants && forge.variants.length > 1 && (
                <div style={{ marginTop: 6, fontSize: 8.5, color: '#9291cc', fontStyle: 'italic' }}>
                  * 변형 {forge.variants.length}종 생성됨. 변형 B·C는 앱 내 AEGIS FORGE에서 확인하세요.
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Footer ── */}
        <div style={{ marginTop: 20, paddingTop: 8, borderTop: '1px solid #dcdcf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 7.5, color: '#c2c1e8' }}>PROJECT AEGIS · C³ Cube Strategy Model · MAP HACK Intelligence System</div>
          <div style={{ fontSize: 7.5, color: '#c2c1e8' }}>{today} {timeStr} · Confidential</div>
        </div>

      </div>
    </div>
  );
};

export default PrintReport;
