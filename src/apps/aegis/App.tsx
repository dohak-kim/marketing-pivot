
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Context, RawDataItem, BattleFieldInput, BrandPresence, StrategyType, CognitionKey } from './core/context';
import {
  suggestContexts, fetchAndClassifyRawData, RetrievalDensity,
  generateExecutionPlan, generateTemporalInsights,
  generateLadderSummary, generateHeatmapSummary, generateNetworkSummary,
  type VizSummary,
} from './ai/gemini';
import ContextList from './components/ContextList';
import ContextModal from './components/ContextModal';
import { StrategicDashboard, SortField, SortOrder } from './components/StrategicDashboard';
import { mapContextToDashboardItem } from './market/dashboard';
import GlossaryModal from './components/GlossaryModal';
import GuideModal from './components/GuideModal';
import StrategyGuideModal from './components/StrategyGuideModal';
import { exportToCsv } from './utils/export';
import { SearchConfigProvider, useSearchConfig } from './core/search/SearchConfigContext';
import EmptyState from './components/EmptyState';
import BattleFieldForm from './components/BattleFieldForm';
import { ContextCognitionMatrix } from './components/ContextCognitionMatrix';
import ContextForceGraph from './components/ContextForceGraph';
import PrintAnalysisViz from './components/PrintAnalysisViz';
import { calculateBrandPresence } from './core/analysis/brandDetection';
import { groupByCluster } from './core/analysis/groupByCluster';
import { resolveHybridCognition } from './core/analysis/cognitionHybrid';
import { classifyStrategy, generateStrategyAction } from './core/analysis/strategy';
import { SerpRawRow } from './core/types/serpRaw';
import { calculateBrandMetrics } from './services/brandShareEngine';
import { ErrorBoundary } from './components/ErrorBoundary';
import TemporalComparisonView from './components/TemporalComparisonView';
import { TemporalComparison, TemporalInsight, buildTemporalComparison, getPeriodLabel } from './core/analysis/temporalComparison';
import { AnalysisPeriod } from './core/search/analysisPeriod.types';
import { DateRange } from './core/search/config';
import { saveSnapshot, loadSnapshots, ContextSnapshot } from './core/analysis/snapshotStorage';
import CDJLadderView from './components/CDJLadderView';
import VizSummaryPanel from './components/VizSummaryPanel';
import { generateSeedKeywords } from './ai/gemini';
import { collectSerpData, countBrandMentions, getEnvPipelineConfig, hasRealApiConfig } from './services/dataCollection/pipeline';
import type { SerpApiPayload } from './services/dataCollection/types';
import ExportModal from './components/ExportModal';
import { ForgeOutput } from './core/types/contentGeneration';

declare global {
  interface AIStudio {
    openSelectKey: () => Promise<void>;
    hasSelectedApiKey: () => Promise<boolean>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

type TabView = 'all' | 'auto' | 'user';
type FilterStrategyType = StrategyType | 'ALL';

const AppContent: React.FC = () => {
  const { config } = useSearchConfig();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Master Data
  const [contexts, setContexts] = useState<Context[]>([]);
  
  // Strategy Segments & Filters
  const [autoContexts, setAutoContexts] = useState<Context[]>([]);
  const [userContexts, setUserContexts] = useState<Context[]>([]);
  const [currentTab, setCurrentTab] = useState<TabView>('all');
  const [selectedStrategyType, setSelectedStrategyType] = useState<FilterStrategyType>('ALL');

  // Bulk Action State
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [vizMode, setVizMode] = useState<'ladder' | 'heatmap' | 'network'>('ladder');
  const [vizSummaries, setVizSummaries] = useState<Record<string, VizSummary | null>>({});
  const [vizSummaryLoading, setVizSummaryLoading] = useState<Record<string, boolean>>({});

  const [sortField, setSortField] = useState<SortField>('finalPriorityScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [battleInput, setBattleInput] = useState<BattleFieldInput | null>(null);
  const [lastDiscoveryValue, setLastDiscoveryValue] = useState('');
  const [formPrefill, setFormPrefill] = useState<{ category: string; brandName: string } | null>(() => {
    try {
      const raw = sessionStorage.getItem('cdj_to_c3');
      if (!raw) return null;
      const data = JSON.parse(raw);
      sessionStorage.removeItem('cdj_to_c3');
      return data;
    } catch { return null; }
  });
  
  const [exportableData, setExportableData] = useState<RawDataItem[] | null>(null);
  const [isExportDataLoading, setIsExportDataLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const [showGlossary, setShowGlossary] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showStrategyGuide, setShowStrategyGuide] = useState(false);

  // Temporal Comparison State
  const [comparisonResult, setComparisonResult] = useState<TemporalComparison | null>(null);
  const [comparisonInsights, setComparisonInsights] = useState<TemporalInsight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Snapshot State
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [sessionForgeOutputs, setSessionForgeOutputs] = useState<ForgeOutput[]>([]);
  const [savedSnapshots, setSavedSnapshots] = useState<ContextSnapshot[]>(() => loadSnapshots());

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

  // ── Viz AI 요약: 탭 전환 or contexts 변경 시 해당 탭 요약 자동 생성 ──────────
  useEffect(() => {
    if (!contexts.length || !lastDiscoveryValue) return;
    // 이미 생성됐거나 로딩 중이면 스킵
    if (vizSummaries[vizMode] || vizSummaryLoading[vizMode]) return;

    const generate = async () => {
      setVizSummaryLoading(prev => ({ ...prev, [vizMode]: true }));
      try {
        let summary: VizSummary;
        if (vizMode === 'ladder') {
          summary = await generateLadderSummary(contexts, lastDiscoveryValue);
        } else if (vizMode === 'heatmap') {
          summary = await generateHeatmapSummary(contexts, lastDiscoveryValue);
        } else {
          summary = await generateNetworkSummary(contexts, lastDiscoveryValue);
        }
        setVizSummaries(prev => ({ ...prev, [vizMode]: summary }));
      } catch (e) {
        console.error('[VizSummary]', e);
      } finally {
        setVizSummaryLoading(prev => ({ ...prev, [vizMode]: false }));
      }
    };
    generate();
  // contexts 길이가 바뀌면 캐시 초기화 후 재생성
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vizMode, contexts.length, lastDiscoveryValue]);

  // contexts 내용이 완전히 바뀌면 summary 캐시 초기화
  useEffect(() => {
    setVizSummaries({});
  }, [lastDiscoveryValue]);

  // Filter Contexts based on Active Tab AND Strategy Type
  const filteredContexts = useMemo(() => {
    let sourceList: Context[] = [];
    
    // 1. Filter by Tab (Source)
    switch (currentTab) {
        case 'auto':
            sourceList = autoContexts;
            break;
        case 'user':
            sourceList = userContexts;
            break;
        default:
            sourceList = contexts;
            break;
    }

    // 2. Filter by Strategy Type
    if (selectedStrategyType !== 'ALL') {
        sourceList = sourceList.filter(c => c.strategyType === selectedStrategyType);
    }

    return sourceList;
  }, [contexts, autoContexts, userContexts, currentTab, selectedStrategyType]);

  const dashboardItems = useMemo(() => {
    let items = filteredContexts.map(context => mapContextToDashboardItem(context));
    if (searchTerm.trim()) {
        const lowerTerm = searchTerm.toLowerCase();
        items = items.filter(item => item.situation.toLowerCase().includes(lowerTerm));
    }
    return items.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (sortOrder === 'asc') return valA - valB;
      return valB - valA;
    });
  }, [filteredContexts, searchTerm, sortField, sortOrder]);

  const sortedContexts = useMemo(() => {
    const sortedIds = dashboardItems.map(item => item.contextId);
    return sortedIds.map(id => filteredContexts.find(c => c.id === id)!).filter(Boolean);
  }, [filteredContexts, dashboardItems]);

  // Handle Checkbox Selection
  const handleToggleSelect = (id: string) => {
    setContexts(prev => prev.map(c => c.id === id ? { ...c, isChecked: !c.isChecked } : c));
    
    // Also sync with sub-lists if they exist there
    setAutoContexts(prev => prev.map(c => c.id === id ? { ...c, isChecked: !c.isChecked } : c));
    setUserContexts(prev => prev.map(c => c.id === id ? { ...c, isChecked: !c.isChecked } : c));
  };

  const selectedCount = useMemo(() => {
      return filteredContexts.filter(c => c.isChecked).length;
  }, [filteredContexts]);

  const handleBulkGenerate = async () => {
      if (!battleInput) return;
      
      const selectedItems = filteredContexts.filter(c => c.isChecked);
      if (selectedItems.length === 0) return;

      setIsBulkGenerating(true);
      setExportStatus(`${selectedItems.length}개 항목 전략 일괄 생성 중...`);

      try {
          const generated = await Promise.all(selectedItems.map(async (context) => {
              if (context.executionPlan) return context; 
              try {
                  const plan = await generateExecutionPlan(context, battleInput.brandName);
                  return { ...context, executionPlan: plan, isChecked: false }; // Uncheck after gen
              } catch (e) {
                  console.error("Bulk Gen Error", e);
                  return context;
              }
          }));

          // Update State
          setContexts(prev => {
              return prev.map(p => {
                  const found = generated.find(g => g.id === p.id);
                  if (found) return found;
                  if (p.isChecked && selectedItems.some(s => s.id === p.id)) return { ...p, isChecked: false };
                  return p;
              });
          });

          setUserContexts(prev => {
              const newItems = generated.filter(g => g.executionPlan); 
              const combined = [...prev];
              newItems.forEach(newItem => {
                  const idx = combined.findIndex(c => c.id === newItem.id);
                  if (idx >= 0) combined[idx] = newItem;
                  else combined.push(newItem);
              });
              return combined;
          });

          setExportStatus('전략 일괄 생성 완료.');
          
          // Switch to User tab to show results if currentTab is not 'all'
          if (currentTab === 'auto') setCurrentTab('user');

      } catch (error) {
          console.error("Bulk generation failed", error);
          setExportStatus('일괄 생성 중 오류 발생.');
      } finally {
          setIsBulkGenerating(false);
      }
  };

  const periodToDuration = (period: AnalysisPeriod): string => {
    switch (period) {
      case '1w': return '7d';
      case '1m': return '30d';
      case '3m': return '3m';
      case '6m': return '6m';
      case '1y': return '1y';
      default:   return '3m';
    }
  };

  // Converts a DateRange to a human-readable duration string for AI prompts.
  // e.g., { start: '2024-07-01', end: '2024-12-31' } → '2024-07-01 ~ 2024-12-31'
  const dateRangeToDuration = (range: DateRange | null, fallbackPeriod: AnalysisPeriod): string => {
    if (range && range.start && range.end) return `${range.start} ~ ${range.end}`;
    return periodToDuration(fallbackPeriod);
  };

  const dateRangeToLabel = (range: DateRange | null, fallbackPeriod: AnalysisPeriod): string => {
    if (range && range.start && range.end) {
      const fmt = (iso: string) => {
        const d = new Date(iso);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      };
      return `${fmt(range.start)} ~ ${fmt(range.end)}`;
    }
    return getPeriodLabel(fallbackPeriod);
  };

  // ── Runs a single full analysis for a given duration, returns processed CEPs ──
  const runSingleAnalysis = useCallback(async (
    input: BattleFieldInput,
    duration: string,
    density: RetrievalDensity,
    preferredSource: string,
  ): Promise<Context[]> => {
    const suggestions = await suggestContexts(
      input.category,
      preferredSource,
      duration,
      density,
      input.brandName,
      input.competitors,
    );
    const initialized = suggestions.map(s => ({ ...s, isChecked: false }));

    if (!input.brandName) return initialized;

    const rawData = await fetchAndClassifyRawData(input.category, density, duration);
    if (rawData.length === 0) return initialized;

    const serpRows: SerpRawRow[] = rawData.map(r => ({
      source: r.retrieval_source,
      extraction_keyword: r.extraction_keyword,
      title: r.title,
      uri: r.uri,
      snippet: r.snippet,
      context_cluster_id: r.context_cluster_id,
      serp_features: r.serp_features ? r.serp_features.split(',').map((s: string) => s.trim()) : [],
      dominant_cognition: r.dominant_cognition,
    }));

    const grouped = groupByCluster(serpRows);
    const clusterNameMap = new Map<string, string>();
    rawData.forEach(r => clusterNameMap.set(r.context_cluster_id, r.context_cluster_name));

    const rowsByClusterName = new Map<string, SerpRawRow[]>();
    Object.entries(grouped).forEach(([clusterId, rows]) => {
      const name = clusterNameMap.get(clusterId);
      if (name) rowsByClusterName.set(name, rows);
    });

    const metricsByClusterName = new Map<string, BrandPresence[]>();
    Object.entries(grouped).forEach(([clusterId, rows]) => {
      const name = clusterNameMap.get(clusterId);
      if (name) {
        const presence = calculateBrandPresence(rows, input.brandName, input.competitors);
        metricsByClusterName.set(name, presence);
      }
    });

    const processed = initialized.map(context => {
      const clusterName = context.marketSignal?.clusterName || context.queryGroup;
      if (!clusterName) return context;

      let matchedName: string | undefined;
      for (const key of metricsByClusterName.keys()) {
        if (key.includes(clusterName) || clusterName.includes(key)) { matchedName = key; break; }
      }
      if (!matchedName) return context;

      const matchedPresence = metricsByClusterName.get(matchedName);
      const matchedRows = rowsByClusterName.get(matchedName) || [];
      const allFeatures = matchedRows.flatMap(r => r.serp_features);
      const correctedCognition = resolveHybridCognition(
        context.cognition || 'informational', allFeatures, context.queryGroup || context.situation, input.brandName,
      );
      const updatedContext = { ...context, brandPresence: matchedPresence, cognition: correctedCognition as any, hybridCognition: correctedCognition };
      const metricContext = calculateBrandMetrics(updatedContext, input.brandName, input.competitors);
      const strategyType = classifyStrategy(metricContext);
      const actionPlan = generateStrategyAction(strategyType, metricContext);
      return { ...metricContext, strategyType, actionPlan };
    });

    processed.sort((a, b) => b.marketSignal.priorityScore - a.marketSignal.priorityScore);
    return processed;
  }, []);

  const handleDiscoverySuggest = async (input: BattleFieldInput) => {
    if (!input.category.trim() || config.sources.length === 0) return;

    setBattleInput(input);
    setLastDiscoveryValue(input.category);
    setIsLoading(true);
    setExportableData(null);
    setExportStatus('');
    setComparisonResult(null);
    setComparisonInsights([]);

    // Reset all state for fresh analysis
    setContexts([]);
    setAutoContexts([]);
    setUserContexts([]);
    setCurrentTab('all');
    setSelectedStrategyType('ALL');
    setSelectedContext(null);

    const retrievalDensity: RetrievalDensity = {
      google: config.depth.google,
      naver: config.depth.naver,
    };

    const discoveryDuration = dateRangeToDuration(config.dateRange, config.period);

    const preferredSource = (() => {
      if (config.depth.google > 0 && config.depth.naver > 0) return 'HYBRID';
      if (config.depth.google > 0) return 'GOOGLE';
      if (config.depth.naver > 0) return 'NAVER';
      return 'HYBRID';
    })();

    // ── COMPARISON MODE: dual analysis ────────────────────────────────────
    if (config.comparisonMode) {
      try {
        const durationA = dateRangeToDuration(config.dateRangeA, config.periodA);
        const durationB = dateRangeToDuration(config.dateRangeB, config.periodB);
        const labelA = dateRangeToLabel(config.dateRangeA, config.periodA);
        const labelB = dateRangeToLabel(config.dateRangeB, config.periodB);

        setExportStatus(`Period A (${labelA}) 분석 중...`);
        const cepsA = await runSingleAnalysis(input, durationA, retrievalDensity, preferredSource);
        setContexts(cepsA);

        setExportStatus(`Period B (${labelB}) 분석 중...`);
        const cepsB = await runSingleAnalysis(input, durationB, retrievalDensity, preferredSource);

        const snapshotA = { period: config.periodA, label: labelA, ceps: cepsA, timestamp: new Date().toISOString() };
        const snapshotB = { period: config.periodB, label: labelB, ceps: cepsB, timestamp: new Date().toISOString() };

        const comparison = buildTemporalComparison(snapshotA, snapshotB);
        setComparisonResult(comparison);

        // Show Period B as main context list (more recent)
        setContexts(cepsB);
        setExportStatus('비교 분석 완료. AI 인사이트 생성 중...');

        // Generate AI insights asynchronously
        setIsLoadingInsights(true);
        generateTemporalInsights(comparison, input.category)
          .then(ins => { setComparisonInsights(ins); setExportStatus('AI 인사이트 생성 완료.'); })
          .catch(() => { setExportStatus('인사이트 생성 중 오류가 발생했습니다.'); })
          .finally(() => setIsLoadingInsights(false));

      } catch (error: any) {
        console.error('Temporal comparison failed:', error);
        setExportStatus('비교 분석 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
        setIsExportDataLoading(false);
      }
      return; // Skip standard analysis flow
    }
    // ─────────────────────────────────────────────────────────────────────

    try {
      // ── 0. 실측 데이터 수집 (API 키 설정 시) ─────────────────────────────────
      let serpData: SerpApiPayload | undefined;
      const pipelineCfg = getEnvPipelineConfig();

      if (hasRealApiConfig(pipelineCfg)) {
        setExportStatus('실측 SERP 데이터 수집 중 — 시드 키워드 생성...');
        try {
          const seedKeywords = await generateSeedKeywords(input.category, 15);
          setExportStatus(`실측 데이터 수집 중 (${seedKeywords.length}개 키워드)...`);
          serpData = await collectSerpData(
            input.category,
            seedKeywords,
            pipelineCfg,
            (step, done, total) => setExportStatus(`${step} ${done}/${total}`),
          );
          setExportStatus(`실측 데이터 수집 완료 — ${serpData.keywords.length}개 키워드 (Serper: ${serpData.sources.serperApiUsed ? '✓' : '✗'} / Naver: ${serpData.sources.naverApiUsed ? '✓' : '✗'})`);
        } catch (e) {
          console.warn('[Pipeline] Real API 수집 실패 — Grounding 모드로 폴백:', e);
          serpData = undefined;
          setExportStatus('실측 API 수집 실패 — AI Grounding 모드로 전환...');
        }
      }

      // ── 1. Suggest Contexts (RAG 모드 or Grounding 폴백) ─────────────────────
      const suggestions = await suggestContexts(
        input.category,
        preferredSource,
        discoveryDuration,
        retrievalDensity,
        input.brandName,
        input.competitors,
        serpData,   // RAG 모드: serpData 있으면 AI는 클러스터링만 수행
      );
      // Initialize isChecked
      const initializedSuggestions = suggestions.map(s => ({ ...s, isChecked: false }));
      setContexts(prev => [...initializedSuggestions, ...prev]);

      setIsExportDataLoading(true);

      // ── 실측 Brand Presence (serpData 있을 때) ────────────────────────────
      if (serpData && input.brandName) {
        setExportStatus('실측 SERP에서 Brand Presence 계산 중...');
        const realPresence = countBrandMentions(serpData, input.brandName, input.competitors || []);
        const updatedWithPresence = initializedSuggestions.map(ctx => {
          const recalc = calculateBrandMetrics(
            { ...ctx, brandPresence: realPresence, brandPresenceSource: 'api' as const },
            input.brandName,
            input.competitors || [],
          );
          const st = classifyStrategy(recalc);
          return { ...recalc, strategyType: st, actionPlan: generateStrategyAction(st, recalc) };
        });
        updatedWithPresence.sort((a, b) => b.marketSignal.priorityScore - a.marketSignal.priorityScore);
        setContexts(prev => {
          const newIds = new Set(updatedWithPresence.map(c => c.id));
          return [...updatedWithPresence, ...prev.filter(c => !newIds.has(c.id))];
        });
        setExportStatus('실측 Brand SOV 적용 완료.');
      }

      setExportStatus('시장 원시 데이터 추출 중...');

      // 2. Fetch Raw Data
      const rawData = await fetchAndClassifyRawData(input.category, retrievalDensity, discoveryDuration);
      setExportableData(rawData);
      setExportStatus(`총 ${rawData.length}개의 데이터 추출 완료.`);

      // 3. Process Metrics & Strategy (Grounding 기반 — serpData 없을 때 실행)
      if (input.brandName && rawData.length > 0 && !serpData) {
        const serpRows: SerpRawRow[] = rawData.map(r => ({
          source: r.retrieval_source,
          extraction_keyword: r.extraction_keyword,
          title: r.title,
          uri: r.uri,
          snippet: r.snippet,
          context_cluster_id: r.context_cluster_id,
          serp_features: r.serp_features ? r.serp_features.split(',').map(s => s.trim()) : [],
          dominant_cognition: r.dominant_cognition
        }));

        const grouped = groupByCluster(serpRows);
        const clusterNameMap = new Map<string, string>();
        rawData.forEach(r => clusterNameMap.set(r.context_cluster_id, r.context_cluster_name));

        const rowsByClusterName = new Map<string, SerpRawRow[]>();
        Object.entries(grouped).forEach(([clusterId, rows]) => {
            const name = clusterNameMap.get(clusterId);
            if (name) rowsByClusterName.set(name, rows);
        });
        
        const metricsByClusterName = new Map<string, BrandPresence[]>();
        Object.entries(grouped).forEach(([clusterId, rows]) => {
            const name = clusterNameMap.get(clusterId);
            if (name) {
                const presence = calculateBrandPresence(rows, input.brandName, input.competitors);
                metricsByClusterName.set(name, presence);
            }
        });

        const processedSuggestions = initializedSuggestions.map(context => {
            const clusterName = context.marketSignal.clusterName || context.queryGroup;
            if (!clusterName) return context;
            
            let matchedName: string | undefined;
            for (const key of metricsByClusterName.keys()) {
                if (key.includes(clusterName) || clusterName.includes(key)) {
                    matchedName = key;
                    break;
                }
            }

            if (matchedName) {
                const matchedPresence = metricsByClusterName.get(matchedName);
                const matchedRows = rowsByClusterName.get(matchedName) || [];
                const allFeatures = matchedRows.flatMap(r => r.serp_features);
                
                const correctedCognition = resolveHybridCognition(
                    context.cognition || 'informational', 
                    allFeatures,
                    context.queryGroup || context.situation, 
                    input.brandName
                );

                const updatedContext = { 
                    ...context, 
                    brandPresence: matchedPresence,
                    cognition: correctedCognition as any, 
                    hybridCognition: correctedCognition 
                };
                
                const metricContext = calculateBrandMetrics(updatedContext, input.brandName, input.competitors);
                const strategyType = classifyStrategy(metricContext);
                
                // Pass full Context object to generateAction to support Dual Mode logic (Niche Exploration vs Dominance)
                const actionPlan = generateStrategyAction(strategyType, metricContext);
                
                return { ...metricContext, strategyType, actionPlan };
            }
            return context;
        });

        // Rank by Priority
        processedSuggestions.sort((a, b) => b.marketSignal.priorityScore - a.marketSignal.priorityScore);

        setContexts(prev => {
            const newIds = new Set(processedSuggestions.map(c => c.id));
            const oldContexts = prev.filter(c => !newIds.has(c.id));
            return [...processedSuggestions, ...oldContexts];
        });

        // 3.4 Auto-Generate Execution Plan for Top 5 (Background)
        const top5 = processedSuggestions.slice(0, 5);
        if (top5.length > 0) {
            setExportStatus('Top 5 전략 AI 자동 생성 중...');
            
            const top5WithStrategy = await Promise.all(top5.map(async (context) => {
                try {
                    const plan = await generateExecutionPlan(context, input.brandName);
                    return { ...context, executionPlan: plan };
                } catch (e) {
                    console.warn(`Failed to auto-generate plan for ${context.situation}`, e);
                    return context;
                }
            }));

            // Set Auto Strategies State
            setAutoContexts(top5WithStrategy);

            // Update Master List
            setContexts(prev => {
                return prev.map(p => {
                    const found = top5WithStrategy.find(t => t.id === p.id);
                    return found ? found : p;
                });
            });
            setExportStatus('분석 및 전략 수립 완료.');
        }
      }

    } catch (error: any) {
      console.error("Failed to suggest CEPs or extract data:", error);
      
      let errorMessage = '데이터 추출 중 오류가 발생했습니다.';
      
      // Handle IP Restriction Error (403)
      if (error.message?.includes('IP address restriction') || error.message?.includes('403')) {
          errorMessage = 'API Key 권한 오류: IP 제한 또는 키 설정 문제입니다.';
          
          if (window.aistudio?.openSelectKey) {
              errorMessage = 'API Key 권한 오류. 새로운 키를 선택합니다...';
              setExportStatus(errorMessage);
              try {
                  await window.aistudio.openSelectKey();
                  errorMessage = 'API Key가 선택되었습니다. 다시 "전장 분석 시작"을 클릭해주세요.';
              } catch (e) {
                  console.error("Failed to open key selector", e);
                  errorMessage = 'API Key 변경에 실패했습니다. 키 설정을 확인해주세요.';
              }
          }
      }
      
      // Handle 500 Internal Errors
      if (error.message?.includes('500') || error.message?.includes('Internal error') || error.status === 500) {
          errorMessage = 'AI 서버가 일시적으로 응답하지 않습니다 (500). 잠시 후 다시 시도해주세요.';
      }
      
      setExportStatus(errorMessage);
    } finally {
      setIsLoading(false);
      setIsExportDataLoading(false);
    }
  };

  const handleSaveSnapshot = () => {
    if (!contexts.length || !battleInput) return;
    const label = dateRangeToLabel(config.dateRange, config.period);
    const name = snapshotName.trim() || `${battleInput.category} — ${label}`;
    saveSnapshot(name, battleInput.category, contexts, label, config.period, config.dateRange);
    setSavedSnapshots(loadSnapshots());
    setSnapshotName('');
    setShowSnapshotModal(false);
  };

  const handleRefreshVizSummary = async () => {
    if (!contexts.length || !lastDiscoveryValue) return;
    setVizSummaries(prev => ({ ...prev, [vizMode]: null }));
    setVizSummaryLoading(prev => ({ ...prev, [vizMode]: true }));
    try {
      let summary: VizSummary;
      if (vizMode === 'ladder') {
        summary = await generateLadderSummary(contexts, lastDiscoveryValue);
      } else if (vizMode === 'heatmap') {
        summary = await generateHeatmapSummary(contexts, lastDiscoveryValue);
      } else {
        summary = await generateNetworkSummary(contexts, lastDiscoveryValue);
      }
      setVizSummaries(prev => ({ ...prev, [vizMode]: summary }));
    } catch (e) {
      console.error('[VizSummary refresh]', e);
    } finally {
      setVizSummaryLoading(prev => ({ ...prev, [vizMode]: false }));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };
  
  // Callback to update a specific Context (e.g. adding a generated strategy plan)
  const handleUpdateContext = (updatedContext: Context) => {
    // 1. Update Master List
    setContexts(prev => prev.map(c => c.id === updatedContext.id ? updatedContext : c));
    
    // 2. Add to User Generated List if it has a plan and isn't in Auto list
    if (updatedContext.executionPlan) {
        const isAuto = autoContexts.some(a => a.id === updatedContext.id);
        if (!isAuto) {
            setUserContexts(prev => {
                const exists = prev.some(p => p.id === updatedContext.id);
                if (exists) return prev.map(p => p.id === updatedContext.id ? updatedContext : p);
                return [...prev, updatedContext];
            });
        } else {
            // Update inside Auto list as well if modified
            setAutoContexts(prev => prev.map(p => p.id === updatedContext.id ? updatedContext : p));
        }
    }
  };
  
  const networkDensity = useMemo(() => {
      const googleDensity = config.depth.google;
      const naverDensity = config.depth.naver;
      if (googleDensity === 0 && naverDensity === 0) return 0;
      const activeSources = (googleDensity > 0 ? 1 : 0) + (naverDensity > 0 ? 1 : 0);
      return activeSources > 0 ? (googleDensity + naverDensity) / activeSources : 0;
  }, [config]);

  // ── 분석 결과 요약 stats (헤더 동적 뱃지용) ──────────────────────────────
  const analysisStats = useMemo(() => {
    if (!contexts.length) return null;
    const cogCount: Record<CognitionKey, number> = { informational: 0, exploratory: 0, commercial: 0, transactional: 0 };
    const stratCount: Record<string, number> = {};
    contexts.forEach(c => {
      const cog = (c.cognition || 'informational') as CognitionKey;
      if (cog in cogCount) cogCount[cog]++;
      if (c.strategyType) stratCount[c.strategyType] = (stratCount[c.strategyType] || 0) + 1;
    });
    const dominant = (Object.entries(cogCount).sort(([, a], [, b]) => b - a)[0]?.[0] || 'informational') as CognitionKey;
    const topStrategy = Object.entries(stratCount).sort(([, a], [, b]) => b - a)[0]?.[0];
    const avgScore = Math.round(contexts.reduce((s, c) => s + (c.marketSignal?.priorityScore || 0), 0) / contexts.length);
    return { total: contexts.length, dominant, topStrategy, avgScore };
  }, [contexts]);

  // UI Helper for Strategy Filter
  const StrategyFilterPill = ({ type, label, color }: { type: FilterStrategyType, label: string, color: string }) => {
      const isActive = selectedStrategyType === type;
      return (
          <button
            onClick={() => setSelectedStrategyType(type)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                isActive 
                ? `bg-${color}-500 text-white border-${color}-500 shadow-md`
                : `bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 hover:border-${color}-400 hover:text-${color}-500`
            }`}
          >
              {label}
          </button>
      );
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-indigo-500/30 theme-transition bg-slate-50 dark:bg-slate-900 flex flex-col">
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800" aria-label="Main Navigation">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setBattleInput(null)}>
            {/* New Icon: Strategic Map / Battle Field Target */}
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300 transform group-hover:rotate-3" aria-hidden="true">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {/* Strategic Pulse Dot Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
            {/* New Logo Text: Italicized to match footer */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black italic text-slate-900 dark:text-white tracking-tighter">MAP</span>
              <span className="text-2xl font-bold italic text-indigo-600 dark:text-indigo-400 tracking-tighter">HACK</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {battleInput && (
                <div className="hidden md:flex items-center space-x-1 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 rounded-xl p-1 backdrop-blur-sm">
                    <button 
                        onClick={() => setBattleInput(null)}
                        className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                    >
                        New Analysis
                    </button>
                    <button className="px-6 py-2 rounded-lg text-sm font-black uppercase tracking-widest bg-indigo-600 text-white shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
                        인텔리전스 피드
                    </button>
                </div>
            )}
            <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 ml-4 pl-4">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
              >
                {isDarkMode ? '🌞' : '🌜'}
              </button>
              <button 
                onClick={() => setShowGlossary(true)} 
                aria-label="Open Glossary"
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
              >
                📚
              </button>
              <button 
                onClick={() => setShowStrategyGuide(true)} 
                aria-label="Open Strategy Guide"
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-sm"
              >
                🎯
              </button>
              <button 
                onClick={() => setShowGuide(true)} 
                aria-label="Open User Guide"
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm"
              >
                ?
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full relative">
        {!battleInput ? (
           <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in duration-700">
             <BattleFieldForm
                isLoading={isLoading}
                disabled={config.sources.length === 0}
                onSubmit={handleDiscoverySuggest}
                initialCategory={formPrefill?.category ?? ''}
                initialBrandName={formPrefill?.brandName ?? ''}
             />
           </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
              <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <h2 className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter leading-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-sky-400">AEGIS C³ Cube Strategy</span>
                    <span className="block text-2xl mt-2 text-slate-400 dark:text-slate-500 font-medium tracking-normal italic uppercase opacity-70">:// {lastDiscoveryValue}</span>
                  </h2>

                  {/* 요약 태그라인 */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-[10px] font-bold text-teal-500 dark:text-teal-400">Serper·Naver 실측</span>
                    <span className="text-slate-300 dark:text-slate-700">→</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">CEP 클러스터링</span>
                    <span className="text-slate-300 dark:text-slate-700">→</span>
                    <span className="text-[10px] font-bold text-sky-500 dark:text-sky-400">CDJ Ladder</span>
                    <span className="text-slate-300 dark:text-slate-700">→</span>
                    <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400">5 Strategy</span>
                    <span className="text-slate-300 dark:text-slate-700">→</span>
                    <span className="text-[10px] font-bold text-violet-500 dark:text-violet-400">Hub &amp; Spoke</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600">(Owned · Earned · Paid</span>
                    <span className="text-[10px] font-bold text-fuchsia-500 dark:text-fuchsia-400">× SEO·AEO·GEO</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600">)</span>
                    <span className="text-slate-300 dark:text-slate-700">→</span>
                    <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400">AEGIS FORGE</span>
                  </div>

                  {/* 동적 분석 결과 뱃지 */}
                  {analysisStats && (() => {
                    const COG_CHIP: Record<CognitionKey, string> = {
                      informational: 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700/40 text-sky-700 dark:text-sky-300',
                      exploratory:   'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-700/40 text-violet-700 dark:text-violet-300',
                      commercial:    'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-300',
                      transactional: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300',
                    };
                    const COG_DOT: Record<CognitionKey, string> = {
                      informational: 'bg-sky-500', exploratory: 'bg-violet-500',
                      commercial: 'bg-amber-500', transactional: 'bg-emerald-500',
                    };
                    const COG_KO: Record<CognitionKey, string> = {
                      informational: '정보 탐색형', exploratory: '비교 탐색형',
                      commercial: '상업적 조사형', transactional: '구매 전환형',
                    };
                    const STRAT_CHIP: Record<string, string> = {
                      offensive:     'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-700/40 text-rose-700 dark:text-rose-300',
                      defensive:     'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700/40 text-indigo-700 dark:text-indigo-300',
                      niche_capture: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-300',
                      brand_build:   'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300',
                      monitor:       'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
                    };
                    const STRAT_KO: Record<string, string> = {
                      offensive: '공격', defensive: '방어', niche_capture: '틈새',
                      brand_build: '브랜드 빌드', monitor: '관찰',
                    };
                    return (
                      <div className="flex flex-wrap gap-2 items-center">
                        {/* CEP 수 */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/40 text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">
                          {analysisStats.total}개 전략 신호
                        </span>
                        {/* 지배 인지 유형 */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${COG_CHIP[analysisStats.dominant]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${COG_DOT[analysisStats.dominant]}`} />
                          {COG_KO[analysisStats.dominant]}
                        </span>
                        {/* 지배 전략 유형 */}
                        {analysisStats.topStrategy && STRAT_CHIP[analysisStats.topStrategy] && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${STRAT_CHIP[analysisStats.topStrategy]}`}>
                            {STRAT_KO[analysisStats.topStrategy]} 전략
                          </span>
                        )}
                        {/* 평균 Priority Score */}
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                          Avg {analysisStats.avgScore}pt
                        </span>
                        {/* 분석 기간 */}
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {dateRangeToLabel(config.dateRange, config.period)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  {/* 내보내기 버튼 */}
                  {contexts.length > 0 && (
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm"
                      title="CSV · JSON · Markdown 내보내기"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      내보내기
                    </button>
                  )}
                  {/* 스냅샷 저장 버튼 */}
                  {contexts.length > 0 && !config.comparisonMode && (
                    <button
                      onClick={() => setShowSnapshotModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
                      title="현재 분석 결과를 스냅샷으로 저장합니다"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                      </svg>
                      스냅샷 저장
                    </button>
                  )}
                  <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-sm">
                    <button
                      onClick={() => setViewMode('cards')}
                      aria-label="Switch to Card View"
                      className={`p-2.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      🎛️
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      aria-label="Switch to Table View"
                      className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      📄
                    </button>
                  </div>
                </div>

                {/* ── 스냅샷 저장 모달 ── */}
                {showSnapshotModal && (
                  <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSnapshotModal(false)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">스냅샷 저장</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                        현재 분석 결과 ({contexts.length}개 CEP)를 저장합니다. 추후 비교 분석의 기준 기간으로 활용할 수 있습니다.
                      </p>
                      <div className="mb-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">스냅샷 이름 (선택)</label>
                        <input
                          type="text"
                          value={snapshotName}
                          onChange={e => setSnapshotName(e.target.value)}
                          placeholder={`${battleInput?.category || ''} — ${dateRangeToLabel(config.dateRange, config.period)}`}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          onKeyDown={e => e.key === 'Enter' && handleSaveSnapshot()}
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-3 mt-5">
                        <button
                          onClick={() => setShowSnapshotModal(false)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSaveSnapshot}
                          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black transition-all shadow-md"
                        >
                          저장
                        </button>
                      </div>
                      {savedSnapshots.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">저장된 스냅샷 ({savedSnapshots.length}개)</p>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                            {savedSnapshots.slice(0, 5).map(s => (
                              <div key={s.id} className="flex items-center justify-between text-[10px]">
                                <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[70%]">{s.name}</span>
                                <span className="text-slate-400 shrink-0 ml-2">{s.cepCount}개 · {new Date(s.createdAt).toLocaleDateString('ko')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-14 space-y-8">
                  <div className="flex flex-col gap-8">
                      {contexts.length > 0 && currentTab === 'all' && selectedStrategyType === 'ALL' && (
                        <div className="space-y-3">
                          {/* ── 전략 시각화 3-Tab ── */}
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-sm">
                              {/* Tab 1: Journey Ladder */}
                              <button
                                onClick={() => setVizMode('ladder')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                  vizMode === 'ladder'
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                                }`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                                Journey Ladder
                              </button>

                              {/* Tab 2: Strategic Heatmap */}
                              <button
                                onClick={() => setVizMode('heatmap')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                  vizMode === 'heatmap'
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                                }`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
                                </svg>
                                Strategic Heatmap
                              </button>

                              {/* Tab 3: Similarity Network */}
                              <button
                                onClick={() => setVizMode('network')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                  vizMode === 'network'
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                                }`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                Similarity Network
                              </button>
                            </div>

                            {/* 서브 레이블 + PDF 인쇄 버튼 */}
                            <div className="flex items-center gap-3">
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium hidden md:block">
                                {vizMode === 'ladder'  && '인지 → 고려 → 구매결정 → 구매후관리 · Laddering 구조'}
                                {vizMode === 'heatmap' && 'Context × Cognition 4유형 인텐시티 분포 히트맵'}
                                {vizMode === 'network' && 'CEP 의미론적 유사도 클러스터 네트워크'}
                              </p>
                              <button
                                onClick={() => window.print()}
                                title="시각화 분석 3종 PDF 출력"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[9px] font-black text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                PDF 출력
                              </button>
                            </div>
                          </div>

                          {/* ── C³ Journey Ladder ── */}
                          {vizMode === 'ladder' && (
                            <>
                              <VizSummaryPanel
                                summary={vizSummaries['ladder'] ?? null}
                                isLoading={!!vizSummaryLoading['ladder']}
                                onRefresh={handleRefreshVizSummary}
                                accentColor="indigo"
                              />
                              <ErrorBoundary>
                                <CDJLadderView
                                  contexts={contexts}
                                  category={lastDiscoveryValue}
                                  onSelectContext={setSelectedContext}
                                />
                              </ErrorBoundary>
                            </>
                          )}

                          {/* ── Strategic Heatmap (Context × Cognition Matrix) ── */}
                          {vizMode === 'heatmap' && (
                            <>
                              <VizSummaryPanel
                                summary={vizSummaries['heatmap'] ?? null}
                                isLoading={!!vizSummaryLoading['heatmap']}
                                onRefresh={handleRefreshVizSummary}
                                accentColor="violet"
                              />
                              <ErrorBoundary>
                                <ContextCognitionMatrix ceps={contexts} />
                              </ErrorBoundary>
                            </>
                          )}

                          {/* ── Similarity Network ── */}
                          {vizMode === 'network' && (
                            <>
                              <VizSummaryPanel
                                summary={vizSummaries['network'] ?? null}
                                isLoading={!!vizSummaryLoading['network']}
                                onRefresh={handleRefreshVizSummary}
                                accentColor="emerald"
                              />
                              <ErrorBoundary>
                                <ContextForceGraph
                                  ceps={contexts}
                                  onNodeClick={(id) => setSelectedContext(contexts.find(c => c.id === id) || null)}
                                />
                              </ErrorBoundary>
                            </>
                          )}

                          {/* ── PDF Print Portal (3 visualizations stacked) ── */}
                          <PrintAnalysisViz contexts={contexts} category={lastDiscoveryValue} />
                        </div>
                      )}

                      {/* ── Temporal Comparison View ── */}
                      {comparisonResult && (
                        <ErrorBoundary>
                          <TemporalComparisonView
                            comparison={comparisonResult}
                            insights={comparisonInsights}
                            isLoadingInsights={isLoadingInsights}
                            category={lastDiscoveryValue}
                          />
                        </ErrorBoundary>
                      )}

                      {/* Tab Navigation & Filters */}
                      <div className="space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setCurrentTab('all')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentTab === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    All Intelligence
                                </button>
                                <button 
                                    onClick={() => setCurrentTab('auto')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${currentTab === 'auto' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
                                >
                                    AI Core Strategies
                                    {autoContexts.length > 0 && (
                                        <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{autoContexts.length}</span>
                                    )}
                                </button>
                                <button 
                                    onClick={() => setCurrentTab('user')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${currentTab === 'user' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
                                >
                                    My Strategy Deck
                                    {userContexts.length > 0 && (
                                        <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{userContexts.length}</span>
                                    )}
                                </button>
                              </div>
                              
                              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden md:block" />

                              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                                  <StrategyFilterPill type="ALL" label="All Types" color="slate" />
                                  <StrategyFilterPill type="offensive" label="Offensive" color="rose" />
                                  <StrategyFilterPill type="defensive" label="Defensive" color="indigo" />
                                  <StrategyFilterPill type="niche_capture" label="Niche" color="amber" />
                                  <StrategyFilterPill type="brand_build" label="Brand Build" color="emerald" />
                                  <StrategyFilterPill type="monitor" label="Monitor" color="slate" />
                              </div>
                          </div>

                          <div className="flex items-center gap-4 justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                              <label htmlFor="filter-input" className="sr-only">결과 필터링</label>
                              <input 
                                id="filter-input"
                                type="text" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                placeholder="추출된 지능체 내에서 고속 필터링..." 
                                className="flex-1 bg-transparent focus:outline-none text-base text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-500 font-medium"
                              />
                              
                              {isExportDataLoading && <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono animate-pulse">{exportStatus}</span>}

                              {exportableData && exportableData.length > 0 && !isExportDataLoading && (
                                  <div className="flex items-center gap-4">
                                      <span className="text-sm text-emerald-700 dark:text-emerald-400 font-bold">{exportStatus}</span>
                                      <button onClick={() => exportToCsv(exportableData, `CONTEXT_RAW_DATA_${lastDiscoveryValue.replace(/\s+/g, '_')}.csv`)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black uppercase tracking-widest rounded-lg shadow-lg transition-all active:scale-95 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                                          엑셀(CSV)로 내보내기
                                      </button>
                                  </div>
                              )}

                              {exportStatus && !isExportDataLoading && !exportableData && !isLoading && (
                                  <span className="text-xs text-rose-600 dark:text-rose-400 font-mono font-bold">{exportStatus}</span>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
              
              {isLoading ? (
                  <div className="py-40 flex flex-col items-center justify-center space-y-6">
                      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xl font-bold text-slate-500 dark:text-slate-400 animate-pulse">전략 인텔리전스 분석 중...</p>
                  </div>
              ) : dashboardItems.length > 0 ? (
                viewMode === 'cards' ? (
                  <ErrorBoundary>
                    <ContextList ceps={sortedContexts} onSelect={setSelectedContext} onToggleSelect={viewMode === 'cards' ? handleToggleSelect : undefined} />
                  </ErrorBoundary>
                ) : (
                  <StrategicDashboard 
                    items={dashboardItems} 
                    onSelect={(id) => setSelectedContext(filteredContexts.find(c => c.id === id) || null)} 
                    sortField={sortField} 
                    sortOrder={sortOrder} 
                    onSort={handleSort} 
                  />
                )
              ) : (
                <EmptyState
                    title={currentTab === 'all' && selectedStrategyType === 'ALL' ? "데이터 분석 준비 완료" : "필터링된 결과가 없습니다."}
                    description={
                        currentTab === 'all' && selectedStrategyType === 'ALL'
                        ? "상단 폼을 통해 새로운 배틀필드 분석을 시작하세요." 
                        : "선택한 조건에 맞는 전략 인텔리전스 노드가 존재하지 않습니다."
                    }
                />
              )}
          </div>
        )}

        {/* Floating Bulk Action Bar */}
        {selectedCount > 0 && !isLoading && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in">
                <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full px-6 py-3 shadow-2xl flex items-center space-x-6 border border-slate-700 dark:border-slate-200">
                    <span className="font-black text-sm whitespace-nowrap">
                        {selectedCount} Selected
                    </span>
                    <div className="h-4 w-px bg-slate-700 dark:bg-slate-300"></div>
                    <button 
                        onClick={handleBulkGenerate}
                        disabled={isBulkGenerating}
                        className="flex items-center space-x-2 font-bold text-sm uppercase tracking-widest hover:text-indigo-400 dark:hover:text-indigo-600 transition-colors disabled:opacity-50"
                    >
                        {isBulkGenerating ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                <span>Generate Strategies</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        )}
      </main>
      
      {/* FOOTER */}
      <footer className="py-20 mt-20 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-6 select-none opacity-50 hover:opacity-100 transition-opacity duration-700">
                <span className="text-3xl font-black italic text-slate-300 dark:text-slate-600 tracking-tighter">MAP</span>
                <span className="text-3xl font-bold italic text-slate-200 dark:text-slate-700 tracking-tighter">HACK</span>
            </div>
            <div className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.6em] font-sans">
                © 2026 PROJECT AEGIS
            </div>
        </div>
      </footer>

      <ErrorBoundary fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedContext(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
            <p className="text-sm font-black text-rose-600 uppercase tracking-widest mb-2">모달 오류</p>
            <p className="text-xs text-slate-500 mb-4">콘텐츠를 표시하는 중 오류가 발생했습니다.</p>
            <button onClick={() => setSelectedContext(null)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg">닫기</button>
          </div>
        </div>
      }>
        <ContextModal
          context={selectedContext}
          onClose={() => setSelectedContext(null)}
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(prev => !prev)}
          brandName={battleInput?.brandName}
          onUpdateContext={handleUpdateContext}
        />
      </ErrorBoundary>
      {showGlossary && <ErrorBoundary><GlossaryModal onClose={() => setShowGlossary(false)} /></ErrorBoundary>}
      {showGuide && <ErrorBoundary><GuideModal onClose={() => setShowGuide(false)} /></ErrorBoundary>}
      {showStrategyGuide && <ErrorBoundary><StrategyGuideModal onClose={() => setShowStrategyGuide(false)} /></ErrorBoundary>}
      {showExportModal && (
        <ErrorBoundary>
          <ExportModal
            category={battleInput?.category || ''}
            brandName={battleInput?.brandName}
            contexts={contexts}
            rawData={exportableData}
            forgeOutputs={sessionForgeOutputs}
            onClose={() => setShowExportModal(false)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SearchConfigProvider>
      <AppContent />
    </SearchConfigProvider>
  );
};

export default App;
