import React, { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Context, ConversionStage } from '../core/context';
import { buildContextNetwork, densityToThreshold } from '../utils/vector';
import { StrategicEngine } from '../services/strategicEngine';
import StrategyBlockList from './StrategyBlockList';
import { StrategicType } from '../models/strategicCluster';

interface ContextForceGraphProps {
  ceps: Context[];
  onNodeClick?: (nodeId: string) => void;
}

// Helper to split text into multiple lines for better fitting
const splitText = (text: string, maxLength: number): string[] => {
    if (!text) return [];
    if (text.length <= maxLength) return [text];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if ((currentLine + ' ' + words[i]).length <= maxLength) {
            currentLine += ' ' + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines.flatMap(line => {
        if (line.length > maxLength + 2) {
            const mid = Math.ceil(line.length / 2);
            return [line.slice(0, mid), line.slice(mid)];
        }
        return [line];
    });
};

const getStageColor = (label: string, ceps: Context[]) => {
  const cep = ceps.find(c => c.situation === label || c.id === label);
  const stage = cep?.journey?.conversionStage;
  
  switch (stage) {
    case ConversionStage.AWARENESS: return '#38bdf8'; // Sky
    case ConversionStage.CONSIDERATION: return '#818cf8'; // Indigo
    case ConversionStage.DECISION: return '#10b981'; // Emerald
    case ConversionStage.POST_PURCHASE: return '#fbbf24'; // Amber
    default: return '#94a3b8'; // Slate
  }
};

const getStrategyColor = (type: StrategicType | undefined) => {
    switch (type) {
        case "Defensive Hold": return '#6366f1'; // Indigo
        case "Concentrated Attack": return '#f43f5e'; // Rose
        case "Flank Opportunity": return '#10b981'; // Emerald
        case "Experimental Zone": return '#94a3b8'; // Slate
        default: return '#475569';
    }
};

const DensityComment = ({ density }: { density: number }) => {
  if (density < 35)
    return <p className="text-sm text-slate-500 font-medium">카테고리 전반의 맥락을 탐색 중입니다.</p>

  if (density < 70)
    return <p className="text-sm text-slate-500 font-medium">실행 가능한 콘텐츠 전략 단위가 형성됩니다.</p>

  return <p className="text-sm text-slate-500 font-medium">크리에이티브 단위까지 정밀하게 묶입니다.</p>
}

const ContextForceGraph: React.FC<ContextForceGraphProps> = ({ ceps, onNodeClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [density, setDensity] = useState(100);
  const [colorMode, setColorMode] = useState<'Conversion' | 'STRATEGY'>('Conversion');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   (!document.documentElement.classList.contains('light'));
    setIsDarkMode(isDark);
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(500, containerRef.current.clientHeight || 580)
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const baseNetwork = useMemo(() => {
    return buildContextNetwork(ceps, 0); 
  }, [ceps]);

  const { graphData, strategicClusters } = useMemo(() => {
    const threshold = densityToThreshold(density);
    const filteredEdges = baseNetwork.edges.filter(e => e.weight >= threshold);
    const clusters = StrategicEngine.analyzeClusters(ceps, densityToThreshold(density));
    
    const nodeStrategyMap = new Map<string, StrategicType>();
    const blockNodeIds = new Set<string>();
    
    clusters.forEach(b => {
      if (b.ceps.length > 1) { 
        b.ceps.forEach(c => {
            blockNodeIds.add(c.id);
            nodeStrategyMap.set(c.id, b.strategyType);
        });
      }
    });

    return {
      graphData: {
        nodes: baseNetwork.nodes.map(n => ({
          ...n,
          val: 1, 
          color: colorMode === 'Conversion' 
            ? getStageColor(n.label, ceps) 
            : getStrategyColor(nodeStrategyMap.get(n.id)),
          isClustered: blockNodeIds.has(n.id),
          strategyType: nodeStrategyMap.get(n.id)
        })),
        links: filteredEdges.map(e => ({
          source: e.source,
          target: e.target,
          value: e.weight
        }))
      },
      strategicClusters: clusters
    };
  }, [baseNetwork, density, ceps, colorMode]);

  const currentThreshold = densityToThreshold(density);
  const meaningfulBlocks = strategicClusters.filter(b => b.ceps.length > 1);

  const legendItems = colorMode === 'Conversion' ? [
    { color: '#38bdf8', label: 'Awareness' },
    { color: '#818cf8', label: 'Consideration' },
    { color: '#10b981', label: 'Decision' },
    { color: '#fbbf24', label: 'Post-Purchase' },
  ] : [
    { color: '#6366f1', label: 'Defensive Hold' },
    { color: '#f43f5e', label: 'Concentrated Attack' },
    { color: '#10b981', label: 'Flank Opportunity' },
    { color: '#94a3b8', label: 'Experimental Zone' },
  ];

  return (
    <div className="w-full flex bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl theme-transition">

      {/* ── 좌측 사이드패널 ── */}
      <div className="w-80 shrink-0 flex flex-col p-6 border-r border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/20 overflow-y-auto no-scrollbar">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${colorMode === 'STRATEGY' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
            Cluster Analysis
          </span>
        </div>
        <div className="text-xl font-black text-slate-900 dark:text-white tracking-tighter mb-5">
          Similarity Network
        </div>

        {/* 전략 밀도 슬라이더 */}
        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
            <span>Broad</span>
            <span className="text-indigo-500 font-mono">{density}</span>
            <span>Focused</span>
          </div>
          <input
            type="range" min="0" max="100" value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-500"
          />
          <DensityComment density={density} />
        </div>

        {/* 뷰 모드 */}
        <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5 mb-5">
          {(['Conversion', 'STRATEGY'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setColorMode(mode)}
              className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${colorMode === mode ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}
            >
              {mode === 'Conversion' ? 'Conversion' : 'Strategy'}
            </button>
          ))}
        </div>

        {/* 클러스터 카운트 */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-white/10">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Active Clusters</span>
          <span className={`text-lg font-black font-mono ${meaningfulBlocks.length > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
            {meaningfulBlocks.length}
          </span>
        </div>

        {/* 전략 블록 리스트 */}
        {meaningfulBlocks.length > 0 && (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <StrategyBlockList blocks={meaningfulBlocks} />
          </div>
        )}

        {/* 범례 */}
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/10 space-y-1.5">
          {legendItems.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[9px] uppercase font-bold text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 우측 그래프 영역 ── */}
      <div ref={containerRef} className="flex-1 relative min-h-[580px]">
        <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor={isDarkMode ? "#020617" : "#f8fafc"} 
        nodeLabel="label"
        nodeColor="color"
        nodeRelSize={6}
        linkColor={() => isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
        linkWidth={link => link.value * 3}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={d => d.value * 0.005}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
        onNodeClick={(node) => {
            if (onNodeClick) onNodeClick(node.id as string);
            fgRef.current?.centerAt(node.x, node.y, 1000);
            fgRef.current?.zoom(3, 2000);
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.label as string;
            const fontSize = 12/globalScale;
            const isClustered = (node as any).isClustered;
            
            // 1. Draw Cluster Glow
            if (isClustered) {
                const glowColor = (node as any).color || '#6366f1';
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, 12, 0, 2 * Math.PI, false);
                ctx.fillStyle = isDarkMode 
                    ? `${glowColor}40` // 25% opacity hex
                    : `${glowColor}26`; // 15% opacity hex
                ctx.fill();
            }

            // 2. Draw Node Circle
            const r = 5;
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color as string;
            ctx.fill();
            
            // 3. Draw Text Label
            if (globalScale > 0.8) { 
                const lines = splitText(label, 12);
                const lineHeight = fontSize * 1.2;
                
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                ctx.strokeStyle = isDarkMode ? '#020617' : '#f8fafc'; 
                ctx.lineWidth = 3 / globalScale;
                ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';

                lines.forEach((line, i) => {
                    const yOffset = node.y! + 8 + (i * lineHeight);
                    ctx.strokeText(line, node.x!, yOffset);
                    ctx.fillText(line, node.x!, yOffset);
                });
            }
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, 8, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
      />
      </div>
    </div>
  );
};

export default ContextForceGraph;