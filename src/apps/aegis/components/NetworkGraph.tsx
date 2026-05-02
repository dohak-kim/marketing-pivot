
import React, { useMemo, useState } from 'react';
import { Context, ConversionStage, CognitionKey, KeywordNode } from '../core/context';

interface NetworkGraphProps {
  rootKeyword: string;
  ceps: Context[];
  density: number;
}

interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'root' | 'context' | 'cognition' | 'signal';
  color: string;
  parentId?: string;
  size: number;
  stage?: ConversionStage;
  angle?: number;
  isStaggered?: boolean; // For zig-zag layout
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
    
    // Handle long words without spaces (common in Korean/Asian languages)
    return lines.flatMap(line => {
        if (line.length > maxLength + 2) {
            const mid = Math.ceil(line.length / 2);
            return [line.slice(0, mid), line.slice(mid)];
        }
        return [line];
    });
};

const NetworkGraph: React.FC<NetworkGraphProps> = ({ rootKeyword, ceps, density }) => {
  const width = 1000;
  const height = 1000; // 충분한 공간 확보
  const centerX = width / 2;
  const centerY = height / 2;
  
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const getConversionColor = (stage: ConversionStage) => {
    switch (stage) {
      case ConversionStage.AWARENESS: return '#38bdf8';
      case ConversionStage.CONSIDERATION: return '#818cf8';
      case ConversionStage.DECISION: return '#10b981';
      case ConversionStage.POST_PURCHASE: return '#fbbf24';
      default: return '#94a3b8';
    }
  };

  const getCognitionColor = (cognition: CognitionKey) => {
    switch(cognition) {
      case 'informational': return '#38bdf8';
      case 'exploratory': return '#818cf8';
      case 'commercial': return '#fbbf24';
      case 'transactional': return '#10b981';
      default: return '#94a3b8';
    }
  }

  const getCognitionLabel = (cognition: CognitionKey) => {
    switch(cognition) {
      case 'informational': return 'Informational';
      case 'exploratory': return 'Exploratory';
      case 'commercial': return 'Commercial';
      case 'transactional': return 'Transactional';
      default: return 'Other';
    }
  }

  const nodes = useMemo(() => {
    if (!rootKeyword || ceps.length === 0) return [];
    
    const items: GraphNode[] = [{
      id: 'root',
      x: centerX,
      y: centerY,
      label: rootKeyword,
      type: 'root',
      color: '#6366f1',
      size: 50
    }];

    const totalCeps = ceps.length;
    
    ceps.forEach((context, i) => {
      // 1. Context 계층 (360도 균등 분산)
      const angleDeg = (i * (360 / totalCeps)) - 90;
      const angleRad = angleDeg * (Math.PI / 180);
      
      // Adjusted Radius to prevent overflow (Was 240)
      const contextRadius = 180; 
      const cx = centerX + contextRadius * Math.cos(angleRad);
      const cy = centerY + contextRadius * Math.sin(angleRad);
      
      const stage = context.journey.conversionStage;
      const contextColor = getConversionColor(stage);
      
      const contextSize = 30 + (context.marketSignal.priorityScore / 100) * 40;
      const contextId = `context-${context.id}`;
      
      items.push({
        id: contextId,
        x: cx,
        y: cy,
        label: context.marketSignal.clusterName || 'Context',
        type: 'context',
        color: contextColor,
        size: contextSize,
        stage: stage,
        angle: angleRad
      });
      
      // ── Signal 소스 결정: 키워드 > 액션채널 > SERP피처 > 단축 폴백 ──
      const CHANNEL_KO: Record<string, string> = {
        INSTAGRAM: '인스타', BLOG: '블로그', YOUTUBE: '유튜브',
        VIDEO: '영상광고', WEB: '웹페이지', EMAIL: '이메일',
        LINKEDIN: '링크드인', Google: '구글광고', Naver: '네이버블로그',
        LandingPage: '랜딩페이지',
      };
      const SHORT_FALLBACK: Record<string, string[]> = {
        informational: ['AEO', 'FAQ', '가이드'],
        exploratory:   ['비교표', '리뷰', '랭킹'],
        commercial:    ['광고소재', 'USP', '랜딩'],
        transactional: ['CTA', '오퍼', '구매유도'],
      };

      // 액션을 dominant cognition으로 그룹핑
      const actionsByCognition: Record<string, string[]> = {};
      (context.actions || []).forEach(action => {
        const vec = action.cognition as Record<string, number> | undefined;
        const dominant = vec
          ? (Object.entries(vec).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'informational')
          : 'informational';
        if (!actionsByCognition[dominant]) actionsByCognition[dominant] = [];
        const label = CHANNEL_KO[action.channel] || action.channel?.slice(0, 6) || '채널';
        if (!actionsByCognition[dominant].includes(label))
          actionsByCognition[dominant].push(label);
      });

      const getSignalLabels = (cog: string): string[] => {
        // 1순위: 실제 키워드
        const rawKeywords = context.metadata?.keywords || [];
        if (rawKeywords.length > 0) {
          const filtered = rawKeywords.filter(kw => ((kw as any).cognition || (kw as any).intent) === cog);
          if (filtered.length > 0) return filtered.slice(0, 3).map(k => k.keyword.slice(0, 8));
        }
        // 2순위: 액션 채널명
        if (actionsByCognition[cog]?.length > 0) return actionsByCognition[cog].slice(0, 3);
        // 3순위: SERP 피처
        const serp = context.serpFeaturesList || [];
        if (serp.length > 0) return serp.slice(0, 3).map(f => f.slice(0, 7));
        // 4순위: 단축 폴백
        return SHORT_FALLBACK[cog] || ['Signal'];
      };

      // cognitionVector에서 활성 cognition 추출 (top 3, threshold 0.05)
      const cognitionVector = context.journey?.cognitionVector;
      const activeCognitions: CognitionKey[] = cognitionVector
        ? (Object.entries(cognitionVector) as [CognitionKey, number][])
            .filter(([, v]) => v > 0.05)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([k]) => k)
        : [];

      const totalCognitions = activeCognitions.length;

      activeCognitions.forEach((cognition, cogIdx) => {
        // 2. COGNITION 계층
        const cognitionRadius = contextRadius + 75;
        const cognitionAngleSpread = 0.20;
        const cognitionAngle = angleRad + (cogIdx - (totalCognitions - 1) / 2) * cognitionAngleSpread;

        const ix = centerX + cognitionRadius * Math.cos(cognitionAngle);
        const iy = centerY + cognitionRadius * Math.sin(cognitionAngle);
        const cognitionId = `cognition-${context.id}-${cognition}`;
        const cognitionColor = getCognitionColor(cognition);

        items.push({
          id: cognitionId,
          x: ix,
          y: iy,
          label: getCognitionLabel(cognition),
          type: 'cognition',
          color: cognitionColor,
          parentId: contextId,
          size: 18
        });

        // 3. SIGNAL 계층 — 고정 반경, 균등 분산 (stagger 제거)
        const signalLabels = getSignalLabels(cognition);
        const displayCount = signalLabels.length;
        const signalRadius = cognitionRadius + 70;
        const signalSpread = 0.28;

        signalLabels.forEach((label, kwIdx) => {
          let angleOffset = 0;
          if (displayCount > 1) {
            const step = signalSpread / (displayCount - 1);
            angleOffset = -(signalSpread / 2) + (kwIdx * step);
          }
          const leafAngle = cognitionAngle + angleOffset;
          const sx = centerX + signalRadius * Math.cos(leafAngle);
          const sy = centerY + signalRadius * Math.sin(leafAngle);

          items.push({
            id: `signal-${context.id}-${cognition}-${kwIdx}`,
            x: sx,
            y: sy,
            label,
            type: 'signal',
            color: cognitionColor,
            parentId: cognitionId,
            size: 5
          });
        });
      });
    });

    return items;
  }, [ceps, rootKeyword, centerX, centerY]);

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[4rem] p-12 overflow-hidden relative group shadow-2xl flex flex-col min-h-[1000px] theme-transition font-sans">
      {/* HUD Labels */}
      <div className="absolute top-12 left-12 z-10">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
          <h4 className="text-[13px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.5em] font-sans">Hierarchical Cognition Matrix</h4>
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter font-sans">
          3계층 전략 지능망 <span className="text-indigo-500 font-mono text-sm ml-2">V3.1</span>
        </div>
      </div>

      <div className="flex-1 relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none cursor-default font-sans">
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="matrixGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 배경 가이드 링: 반경 180(Context) / 255(Cognition) / 325(Signal) */}
          <circle cx={centerX} cy={centerY} r="420" fill="url(#matrixGradient)" />
          <g opacity="0.05" stroke="currentColor" strokeWidth="1.2">
             <circle cx={centerX} cy={centerY} r="180" fill="none" strokeDasharray="6 6" />
             <circle cx={centerX} cy={centerY} r="255" fill="none" strokeDasharray="6 6" />
             <circle cx={centerX} cy={centerY} r="325" fill="none" strokeDasharray="6 6" />
          </g>

          {/* 1. 연결선 (Links Layer) */}
          {nodes.filter(n => n.parentId).map(node => {
            const parent = nodes.find(p => p.id === node.parentId);
            if (!parent) return null;
            return (
              <line 
                key={`link-${node.id}`}
                x1={parent.x} y1={parent.y} x2={node.x} y2={node.y} 
                stroke={node.color} strokeWidth="1.2" strokeOpacity="0.25"
              />
            );
          })}

          {/* 2. 노드 (Nodes Layer) */}
          {nodes.map(node => (
            <g 
                key={`node-${node.id}`} 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
            >
              <circle 
                cx={node.x} cy={node.y} r={node.size} 
                fill={node.type === 'root' ? '#1e1b4b' : node.color} 
                fillOpacity={
                    hoveredNodeId === node.id 
                    ? 0.4 
                    : (node.type === 'context' ? 0.2 : (node.type === 'signal' ? 0.08 : 1))
                }
                stroke={node.color} 
                strokeWidth={node.type === 'root' ? 6 : 2}
                filter={node.type === 'root' ? "url(#glow)" : "none"}
                className={`transition-all duration-300 ${hoveredNodeId === node.id ? 'stroke-indigo-400' : ''}`}
              />
              
              {/* 노드 내부 텍스트 (e.g., 퍼센트)는 노드와 함께 렌더링 */}
              {node.type === 'context' && (
                <text 
                  x={node.x} y={node.y + 5} 
                  textAnchor="middle" 
                  className={`text-[11px] font-mono font-black fill-slate-700 dark:fill-white transition-opacity ${hoveredNodeId === node.id ? 'opacity-100' : 'opacity-80'}`}
                >
                  {Math.round(node.size)}%
                </text>
              )}
            </g>
          ))}

          {/* 3. 텍스트 라벨 — 중심으로부터 바깥 방향으로 배치 */}
          {nodes.map(node => {
              const isRoot = node.type === 'root';
              const isSignal = node.type === 'signal';
              const isCognition = node.type === 'cognition';

              const maxLen = isSignal ? 7 : isCognition ? 8 : 10;
              const lines = splitText(node.label, maxLen);
              const lineHeight = isSignal ? 10 : 13;

              // 중심으로부터 방향 계산 → 레이블을 항상 바깥쪽에 배치
              const dx = node.x - centerX;
              const dy = node.y - centerY;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const ux = dx / dist; // 단위 벡터
              const uy = dy / dist;

              const labelGap = node.size + (isSignal ? 12 : isRoot ? 0 : 18);
              const lx = isRoot ? node.x : node.x + ux * labelGap;
              const ly = isRoot ? node.y + node.size + 22 : node.y + uy * labelGap;

              // 텍스트 정렬: 왼쪽 반구면 end, 오른쪽이면 start, 상하면 middle
              const anchor = isRoot ? 'middle'
                : Math.abs(dx) < 40 ? 'middle'
                : dx > 0 ? 'start' : 'end';

              // 멀티라인 세로 중앙 정렬 오프셋
              const totalHeight = (lines.length - 1) * lineHeight;
              const startDy = isRoot ? 0 : -totalHeight / 2;

              return (
                <text
                    key={`label-${node.id}`}
                    x={lx}
                    y={ly}
                    textAnchor={anchor}
                    dominantBaseline="middle"
                    className={`font-sans font-black pointer-events-none tracking-tighter transition-all ${
                      isRoot        ? 'text-[15px] fill-slate-900 dark:fill-white uppercase' :
                      node.type === 'context'   ? 'text-[12px] fill-slate-800 dark:fill-slate-200 uppercase' :
                      isCognition   ? 'text-[10px] fill-indigo-600 dark:fill-indigo-400 uppercase' :
                                      'text-[9px]  fill-slate-500 dark:fill-slate-400'
                    }`}
                >
                    {lines.map((line, i) => (
                        <tspan key={i} x={lx} dy={i === 0 ? startDy : lineHeight}>
                            {line}
                        </tspan>
                    ))}
                </text>
              );
          })}
        </svg>
      </div>

      <div className="mt-8 p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-inner theme-transition font-sans">
        <div className="flex space-x-12">
           {([ConversionStage.AWARENESS, ConversionStage.CONSIDERATION, ConversionStage.DECISION, ConversionStage.POST_PURCHASE] as ConversionStage[]).map(s => (
             <div key={s} className="flex items-center space-x-3.5">
               <div className="w-4 h-4 rounded-full shadow-xl" style={{ backgroundColor: getConversionColor(s) }} />
               <span className="text-[13px] font-black text-slate-500 uppercase tracking-widest">{s.replace('_', ' ')}</span>
             </div>
           ))}
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-end">
             <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">Proportional Circle Scaling</span>
             <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Fixed 360° Radial Distribution (Context-Cognition-Signal)</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg">
             <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;
