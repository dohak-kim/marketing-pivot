
/**
 * FORGE Workflow Builder
 *
 * Converts CEP + ExecutionPlan → ForgeWorkflowPlan.
 *
 * Hub & Spoke architecture:
 *   Hub (= Owned Media) is the Single Source of Truth.
 *   Spoke1 (Earned) and Spoke2 (Paid) are external amplifiers
 *   that all point BACK to Hub — forming a Closed-Loop ecosystem.
 *
 *   Spoke1 → Hub ← Spoke2
 *
 * Hub content has two roles:
 *   'primary' — SEO롱폼, GEO엔티티, AEO FAQ → SEO+AEO+GEO applied
 *   'derived' — 지원아티클, FAQ확장, 케이스스터디 → SEO + Hub link
 * Both are Owned Media. Neither is a "Spoke" in the Triple Media sense.
 */

import type { Context, StrategyType, ExecutionPlan } from '../core/context';
import type { SerpFeatureFlags } from '../core/context';
import type { ForgeWorkflowPlan, ForgeWorkflowItem, MediaTier, HubContentRole } from '../core/types/forgeWorkflow';
import type { MediaType, ContentSubType, ToneAndManner, TargetLength } from '../core/types/contentGeneration';
import { getForgeRecommendation } from '../ai/forge';

// ── Optimization resolver ─────────────────────────────────────────────────────

function resolveHubOptimization(
  hubRole: HubContentRole,
  subType: ContentSubType,
  flags: SerpFeatureFlags | undefined,
  strategyType: StrategyType,
): {
  seo: boolean; aeo: boolean; geo: boolean;
  rationale: string;
  aeoTrigger: ForgeWorkflowItem['aeoTrigger'];
  geoTrigger: ForgeWorkflowItem['geoTrigger'];
} {
  if (hubRole === 'derived') {
    return {
      seo: true, aeo: false, geo: false,
      rationale: 'SEO 기본 레이어 + Hub 내부링크 (Owned 파생 콘텐츠)',
      aeoTrigger: 'none', geoTrigger: 'none',
    };
  }

  // Primary Hub — resolve AEO and GEO
  const aeoBySerp = !!(flags?.hasFeaturedSnippet || flags?.hasPAA);
  const geoBySerp = !!(flags?.hasAIOverview);
  const aeoByStrategy = subType === 'aeo_faq' || subType === 'seo_longform'
    || strategyType === 'niche_capture' || strategyType === 'defensive';
  const geoByStrategy = subType === 'geo_entity'
    || strategyType === 'defensive' || strategyType === 'brand_build';

  const aeo = aeoBySerp || aeoByStrategy;
  const geo = geoBySerp || geoByStrategy;

  const parts: string[] = ['SEO'];
  if (aeo) parts.push(aeoBySerp ? 'AEO (SERP 피처 확인)' : 'AEO (전략 권고)');
  if (geo) parts.push(geoBySerp ? 'GEO (AI Overview 확인)' : 'GEO (전략 권고)');
  parts.push('— Hub 핵심 자산');

  return {
    seo: true, aeo, geo,
    rationale: parts.join(' + '),
    aeoTrigger: aeoBySerp ? 'serp_data' : aeo ? 'strategy_heuristic' : 'none',
    geoTrigger: geoBySerp ? 'serp_data' : geo ? 'strategy_heuristic' : 'none',
  };
}

// ── Item factory ──────────────────────────────────────────────────────────────

function makeHubItem(
  hubRole: HubContentRole,
  brief: string,
  subType: ContentSubType,
  tone: ToneAndManner,
  targetLength: TargetLength,
  flags: SerpFeatureFlags | undefined,
  strategyType: StrategyType,
  source: ForgeWorkflowItem['source'],
  idx: number,
): ForgeWorkflowItem {
  const opt = resolveHubOptimization(hubRole, subType, flags, strategyType);
  return {
    id: `hub-${hubRole}-${idx}`,
    tier: 'hub',
    hubRole,
    contentBrief: brief,
    mediaType: 'owned_hub' as MediaType,
    subType,
    tone,
    targetLength,
    optimization: { seo: opt.seo, aeo: opt.aeo, geo: opt.geo },
    optimizationRationale: opt.rationale,
    aeoTrigger: opt.aeoTrigger,
    geoTrigger: opt.geoTrigger,
    source,
  };
}

function makeExternalItem(
  tier: 'spoke1_earned' | 'spoke2_paid',
  brief: string,
  mediaType: MediaType,
  subType: ContentSubType,
  tone: ToneAndManner,
  targetLength: TargetLength,
  source: ForgeWorkflowItem['source'],
  idx: number,
): ForgeWorkflowItem {
  // ── Earned: per-subType AEO/GEO ───────────────────────────────────────────
  // press_release + influencer_brief → GEO (브랜드·엔티티 동시 노출, 인용 문구)
  // community_post                   → AEO (PAA 시딩 — Q&A 선점)
  const earnedGeo = tier === 'spoke1_earned' &&
    (subType === 'press_release' || subType === 'influencer_brief');
  const earnedAeo = tier === 'spoke1_earned' && subType === 'community_post';

  // ── Paid: per-subType AEO ─────────────────────────────────────────────────
  // landing_copy → AEO (직접 답변 구조 + 비교표 + FAQ)
  // search_ad, social_ad → 순수 전환 카피, AEO/GEO 없음
  const paidAeo = tier === 'spoke2_paid' && subType === 'landing_copy';

  const aeo = earnedAeo || paidAeo;
  const geo = earnedGeo;

  const rationale = tier === 'spoke1_earned'
    ? earnedGeo
      ? 'GEO 인용 신호 — 브랜드·엔티티 동시 노출, 인용 가능 문구 삽입 → AI Citation↑'
      : earnedAeo
        ? 'AEO PAA 시딩 — 커뮤니티 Q&A로 PAA 질문 선점 → Hub AEO 간접 강화'
        : 'Earned 채널 — SEO 백링크·멘션 신호 → Hub 도메인 권위(DA) 기여'
    : paidAeo
      ? 'AEO 랜딩 구조 — 직접 답변+비교표+FAQ → 전환 장벽 제거 + Quality Score↑'
      : 'Paid 채널 — SEO 공백 단기 보완, Hub로 직접 트래픽 유입';

  return {
    id: `${tier}-${idx}`,
    tier,
    contentBrief: brief,
    mediaType,
    subType,
    tone,
    targetLength,
    optimization: { seo: true, aeo, geo },
    optimizationRationale: rationale,
    aeoTrigger: aeo ? 'strategy_heuristic' : 'none',
    geoTrigger: geo ? 'strategy_heuristic' : 'none',
    source,
  };
}

// ── Sub-type inference from text brief ───────────────────────────────────────

function inferHubSubType(brief: string, hubRole: HubContentRole): ContentSubType {
  const b = brief.toLowerCase();
  if (hubRole === 'primary') {
    if (b.includes('faq') || b.includes('질문') || b.includes('answer') || b.includes('aeo')) return 'aeo_faq';
    if (b.includes('geo') || b.includes('엔티티') || b.includes('ai 인용') || b.includes('권위')) return 'geo_entity';
    return 'seo_longform';
  }
  // derived
  if (b.includes('케이스') || b.includes('사례')) return 'case_study';
  if (b.includes('faq') || b.includes('질문')) return 'faq_expansion';
  return 'support_article';
}

function inferEarnedSubType(brief: string): ContentSubType {
  const b = brief.toLowerCase();
  if (b.includes('인플루언서') || b.includes('크리에이터')) return 'influencer_brief';
  if (b.includes('커뮤니티') || b.includes('블로그') || b.includes('카페')) return 'community_post';
  return 'press_release';
}

function inferPaidSubType(brief: string): ContentSubType {
  const b = brief.toLowerCase();
  if (b.includes('랜딩') || b.includes('landing')) return 'landing_copy';
  if (b.includes('소셜') || b.includes('sns') || b.includes('인스타')) return 'social_ad';
  return 'search_ad';
}

function inferTone(strategyType: StrategyType, tier: MediaTier): ToneAndManner {
  if (tier === 'spoke2_paid') return 'authoritative';
  if (tier === 'spoke1_earned') return 'emotional';
  if (strategyType === 'defensive' || strategyType === 'brand_build') return 'authoritative';
  return 'expert';
}

function inferLength(subType: ContentSubType): TargetLength {
  if (['seo_longform', 'geo_entity'].includes(subType)) return 2000;
  if (['aeo_faq', 'support_article', 'case_study', 'press_release', 'influencer_brief', 'community_post', 'landing_copy'].includes(subType)) return 1000;
  return 300;
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function buildForgeWorkflow(
  context: Context,
  strategyType: StrategyType,
  executionPlan?: ExecutionPlan,
): ForgeWorkflowPlan {
  const flags = context.serpFeatureFlags;
  const tone = inferTone(strategyType, 'hub');
  const clusterName = context.marketSignal?.clusterName || context.situation;

  const hub: ForgeWorkflowItem[] = [];
  const spoke1_earned: ForgeWorkflowItem[] = [];
  const spoke2_paid: ForgeWorkflowItem[] = [];

  if (executionPlan) {
    // ── From ExecutionPlan: real AI-generated briefs ──────────────────────────

    const owned = executionPlan.ownedMedia;

    // Primary Hub items (hubContent[] from ExecutionPlan)
    owned.hubContent?.forEach((brief, i) => {
      const sub = inferHubSubType(brief, 'primary');
      hub.push(makeHubItem('primary', brief, sub, tone, inferLength(sub), flags, strategyType, 'execution_plan', i));
    });

    // Derived Hub items (spokeContent[] from ExecutionPlan — still Owned Media)
    owned.spokeContent?.forEach((brief, i) => {
      const sub = inferHubSubType(brief, 'derived');
      hub.push(makeHubItem('derived', brief, sub, inferTone(strategyType, 'hub'), 600, flags, strategyType, 'execution_plan', i));
    });

    // Spoke 1 — Earned Media
    executionPlan.earnedMedia?.forEach((brief, i) => {
      const sub = inferEarnedSubType(brief);
      spoke1_earned.push(makeExternalItem('spoke1_earned', brief, 'earned', sub, 'emotional', inferLength(sub), 'execution_plan', i));
    });

    // Spoke 2 — Paid Media
    executionPlan.paidMedia?.forEach((brief, i) => {
      const sub = inferPaidSubType(brief);
      spoke2_paid.push(makeExternalItem('spoke2_paid', brief, 'paid', sub, 'authoritative', inferLength(sub), 'execution_plan', i));
    });

  } else {
    // ── Fallback: derive from FORGE recommendation matrix ────────────────────

    const rec = getForgeRecommendation(context, strategyType);

    // Primary Hub
    const primarySub: ContentSubType = (['owned_hub', 'owned_spoke'] as MediaType[]).includes(rec.mediaType)
      ? rec.subType : 'seo_longform';
    hub.push(makeHubItem('primary', `${clusterName} — 핵심 Hub 콘텐츠`, primarySub, rec.tone, rec.targetLength, flags, strategyType, 'forge_recommendation', 0));

    // Derived Hub (2 items)
    hub.push(makeHubItem('derived', `${clusterName} — 지원 아티클 (Spoke 파생)`, 'support_article', tone, 600, flags, strategyType, 'forge_recommendation', 1));
    hub.push(makeHubItem('derived', `${clusterName} — FAQ 확장 (Spoke 파생)`, 'faq_expansion', tone, 600, flags, strategyType, 'forge_recommendation', 2));

    // Spoke 1 — Earned
    const earnedRec = getForgeRecommendation({ ...context, cognition: 'exploratory' as any }, strategyType);
    const earnedSub = earnedRec.mediaType === 'earned' ? earnedRec.subType : 'press_release';
    spoke1_earned.push(makeExternalItem('spoke1_earned', `${clusterName} — PR / 언드미디어`, 'earned', earnedSub, 'emotional', inferLength(earnedSub), 'forge_recommendation', 0));
    spoke1_earned.push(makeExternalItem('spoke1_earned', `${clusterName} — 커뮤니티 시딩`, 'earned', 'community_post', 'emotional', 600, 'forge_recommendation', 1));

    // Spoke 2 — Paid
    const paidRec = getForgeRecommendation({ ...context, cognition: 'transactional' as any }, strategyType);
    const paidSub = paidRec.mediaType === 'paid' ? paidRec.subType : 'search_ad';
    spoke2_paid.push(makeExternalItem('spoke2_paid', `${clusterName} — 검색광고 (SEO 공백 보완)`, 'paid', paidSub, 'authoritative', inferLength(paidSub), 'forge_recommendation', 0));
    spoke2_paid.push(makeExternalItem('spoke2_paid', `${clusterName} — 랜딩페이지 카피`, 'paid', 'landing_copy', 'authoritative', 600, 'forge_recommendation', 1));
  }

  return { cepId: context.id, strategyType, generatedAt: new Date().toISOString(), hub, spoke1_earned, spoke2_paid };
}
