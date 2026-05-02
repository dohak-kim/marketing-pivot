
/**
 * FORGE Workflow Plan — Hub & Spoke Architecture
 *
 * 3-tier model (NOT 4):
 *   HUB   = Owned Media  (Single Source of Truth)
 *   SPOKE1 = Earned Media (신뢰도 증폭 — 외부 신호가 Hub로 수렴)
 *   SPOKE2 = Paid Media  (트래픽 모터 — 트래픽이 Hub로 수렴)
 *
 * Key principle: Spoke1 → Hub ← Spoke2 (Closed-Loop, all arrows pointing TO Hub)
 *
 * Within Hub (Owned), content items are further classified by role:
 *   'primary'  — 핵심 허브 콘텐츠 (SEO롱폼, GEO엔티티, AEO FAQ)
 *               가장 강력한 3중 최적화 레이어(SEO+AEO+GEO) 직접 적용
 *   'derived'  — 허브에서 파생된 채널 적응 콘텐츠 (지원아티클, FAQ확장, 케이스스터디)
 *               SEO 기본 레이어 + Hub로의 내부링크 의무화
 * Both roles live inside Owned Media — neither is a separate "Spoke" layer.
 */

import type { MediaType, ContentSubType, ToneAndManner, TargetLength } from './contentGeneration';
import type { StrategyType } from '../context';

/** Top-level triple media tier */
export type MediaTier = 'hub' | 'spoke1_earned' | 'spoke2_paid';

/** Content role within Hub (Owned Media) only */
export type HubContentRole = 'primary' | 'derived';

export interface ForgeWorkflowItem {
  id: string;

  /** Which media tier this item belongs to */
  tier: MediaTier;

  /**
   * Role within Hub. Only relevant when tier === 'hub'.
   * - 'primary': core hub asset, SEO+AEO+GEO
   * - 'derived': channel-adapted derivative, SEO + internal link to Hub
   */
  hubRole?: HubContentRole;

  /** Human-readable brief from ExecutionPlan or FORGE recommendation */
  contentBrief: string;

  /** FORGE generation config */
  mediaType: MediaType;
  subType: ContentSubType;
  tone: ToneAndManner;
  targetLength: TargetLength;
  optimization: {
    seo: boolean;
    aeo: boolean;
    geo: boolean;
  };

  /** Plain language rationale shown in UI */
  optimizationRationale: string;

  /** Was AEO/GEO triggered by real SERP data or strategy heuristic? */
  aeoTrigger: 'serp_data' | 'strategy_heuristic' | 'none';
  geoTrigger: 'serp_data' | 'strategy_heuristic' | 'none';

  source: 'execution_plan' | 'forge_recommendation';
}

export interface ForgeWorkflowPlan {
  cepId: string;
  strategyType: StrategyType;
  generatedAt: string;

  /** Owned Media — Hub (Single Source of Truth) */
  hub: ForgeWorkflowItem[];

  /** Earned Media — Spoke 1 (신뢰도 증폭: GEO 인용 신호 + AEO Q&A 시딩) */
  spoke1_earned: ForgeWorkflowItem[];

  /** Paid Media — Spoke 2 (트래픽 모터: SEO 공백 보완, Hub로 트래픽 유입) */
  spoke2_paid: ForgeWorkflowItem[];
}
