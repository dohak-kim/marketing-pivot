import React, { useMemo } from 'react';
import { PositioningMapData } from '../types';

interface PositioningMapProps {
  data: PositioningMapData;
  isSmall?: boolean;
}

// Helper to remove parentheses and English text for cleaner labels
const cleanText = (text: string) => {
  if (!text) return '';
  // Remove content within parentheses
  let cleaned = text.replace(/\s*\(.*?\)/g, '');
  return cleaned.trim();
};

export const PositioningMap: React.FC<PositioningMapProps> = ({ data, isSmall = false }) => {
  if (!data || !data.brands) return null;

  const size = 600;
  // Adjusted padding for better visual balance
  const padding = isSmall ? 70 : 130;

  // Dynamic Scaling Logic
  const maxAbsValue = useMemo(() => {
    let max = 0;
    (data.brands || []).forEach(b => {
      max = Math.max(max, Math.abs(b.x), Math.abs(b.y));
    });
    // Ensure we have some domain even if values are small.
    // Allow zooming in for small values (e.g. max=10 -> domain=12), 
    // but keep a reasonable minimum (10) to avoid extreme zoom on near-zero noise.
    // Removed the upper clamp of 100 to allow values > 100 to fit if necessary.
    return max === 0 ? 100 : Math.max(max * 1.15, 10);
  }, [data.brands]);

  // Dynamic mapping function based on calculated domain
  const mapCoord = (val: number) => {
    const normalized = (val + maxAbsValue) / (maxAbsValue * 2);
    return padding + normalized * (size - padding * 2);
  };

  const wrapText = (text: string, maxChars: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    words.forEach(word => {
      if ((currentLine + word).length > maxChars) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    lines.push(currentLine.trim());
    return lines;
  };

  const wrapBrandName = (name: string, maxLen: number = 10) => {
    if (name.length <= maxLen) return [name];
    const lines = [];
    for (let i = 0; i < name.length; i += maxLen) {
      lines.push(name.substring(i, i + maxLen));
    }
    return lines;
  };

  const processedBrands = useMemo(() => {
    const brands = (data.brands || []).map(b => ({
      ...b,
      name: cleanText(b.name),
      cx: mapCoord(b.x),
      cy: mapCoord(-b.y)
    }));

    // Collision detection for labels
    // Optimized to prevent labels from being pushed too far
    const adjustedBrands = brands.map((b, i) => {
      // Base offset closer to bubble
      let labelYOffset = b.isTarget ? 30 : 26; 
      
      brands.forEach((other, j) => {
        if (i === j) return;
        
        // Calculate distance between bubble centers
        const dist = Math.sqrt(Math.pow(b.cx - other.cx, 2) + Math.pow(b.cy - other.cy, 2));
        
        // If bubbles are close
        if (dist < 45) {
          // If horizontally close, adjust vertical label position
          if (Math.abs(b.cx - other.cx) < 35) {
             // If b is visually "above" (smaller y), push label up slightly or keep default
             // If b is visually "below" (larger y), push label down
             
             if (b.cy < other.cy) {
                 // b is above other. 
                 // If we push b's label up, it might clear other's bubble.
                 // Reducing offset to negative or near zero.
                 labelYOffset -= 10;
             } else {
                 // b is below other.
                 // Push b's label further down.
                 labelYOffset += 14; 
             }
          }
        }
      });
      return { ...b, labelOffset: labelYOffset };
    });

    return adjustedBrands;
  }, [data.brands, maxAbsValue]);

  const xLabel = cleanText(data.xAxisName);
  const yLabel = cleanText(data.yAxisName);

  return (
    <div className={`bg-white ${isSmall ? 'p-4 rounded-2xl' : 'p-12 rounded-[2.5rem]'} border border-gray-100 shadow-2xl overflow-hidden`} role="img" aria-label={`포지셔닝 맵: X축 ${data.xAxisName}, Y축 ${data.yAxisName}`}>
      {!isSmall && (
        <div className="flex justify-between items-center mb-10">
          <div>
            <h4 className="text-xl font-black text-[#002d72] uppercase tracking-widest">브랜드 포지셔닝 매트릭스</h4>
            <p className="text-sm text-gray-400 italic">경쟁 지형 분석</p>
          </div>
        </div>
      )}
      <div className={`grid grid-cols-1 ${isSmall ? '' : 'lg:grid-cols-12'} gap-8`}>
        <div className={`${isSmall ? '' : 'lg:col-span-7'} relative`}>
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-inner overflow-visible p-4 relative z-0">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto overflow-visible">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                </marker>
              </defs>

              {/* Y Axis: Drawn from Bottom to Top */}
              <line x1={size/2} y1={size - padding + 20} x2={size/2} y2={padding - 20} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6,4" markerEnd="url(#arrowhead)" />
              
              {/* X Axis: Drawn from Left to Right */}
              <line x1={padding - 20} y1={size/2} x2={size - padding + 20} y2={size/2} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6,4" markerEnd="url(#arrowhead)" />
              
              <g className={`font-black uppercase fill-[#002d72] tracking-tighter ${isSmall ? 'text-[12px]' : 'text-[11px]'}`}>
                {/* Y-Axis TOP (High +) */}
                <text x={size/2} y={padding - 35} textAnchor="middle" fill="#2563eb" fontWeight="bold">높음 (+)</text>
                {wrapText(yLabel, 12).map((line, i) => (
                  <text key={`y-top-${i}`} x={size/2} y={padding - 50 - ((wrapText(yLabel, 12).length - 1 - i) * 12)} textAnchor="middle">{line}</text>
                ))}

                {/* Y-Axis BOTTOM (Low -) */}
                <text x={size/2} y={size - padding + 35} textAnchor="middle" fill="#94a3b8" fontWeight="bold" dominantBaseline="hanging">낮음 (-)</text>
                {wrapText(yLabel, 12).map((line, i) => (
                  <text key={`y-bottom-${i}`} x={size/2} y={size - padding + 55 + (i * 12)} textAnchor="middle" dominantBaseline="hanging">{line}</text>
                ))}

                {/* X-Axis RIGHT (High +) */}
                <text x={size - padding + 35} y={size/2 - (isSmall ? 15 : 20)} textAnchor="start" fill="#2563eb" fontWeight="bold">높음 (+)</text>
                {wrapText(xLabel, 8).map((line, i) => (
                  <text key={`x-right-${i}`} x={size - padding + 35} y={size/2 + (i * 12)} textAnchor="start" dominantBaseline="hanging">{line}</text>
                ))}

                {/* X-Axis LEFT (Low -) */}
                <text x={padding - 35} y={size/2 - (isSmall ? 15 : 20)} textAnchor="end" fill="#94a3b8" fontWeight="bold">낮음 (-)</text>
                {wrapText(xLabel, 8).map((line, i) => (
                  <text key={`x-left-${i}`} x={padding - 35} y={size/2 + (i * 12)} textAnchor="end" dominantBaseline="hanging">{line}</text>
                ))}
              </g>

              {/* Bubbles */}
              {processedBrands.map((b, i) => (
                <circle 
                  key={`circle-${i}`} 
                  cx={b.cx} 
                  cy={b.cy} 
                  r={b.isTarget ? (isSmall ? "18" : "18") : "14"} 
                  fill={b.isTarget ? "#2563eb" : "#94a3b8"} 
                  opacity="0.9" 
                  stroke="white" 
                  strokeWidth="3" 
                  className="drop-shadow-sm transition-all duration-300" 
                />
              ))}

              {/* Labels */}
              {processedBrands.map((b, i) => {
                const lines = wrapBrandName(b.name);
                return (
                  <text 
                    key={`text-${i}`}
                    x={b.cx} 
                    y={b.cy + b.labelOffset} 
                    textAnchor="middle" 
                    fontSize={isSmall ? "16" : "15"} 
                    fontWeight="900" 
                    fill="#1e293b"
                    stroke="white" 
                    strokeWidth="4"
                    paintOrder="stroke"
                    className="select-none pointer-events-none drop-shadow-md"
                  >
                    {lines.map((line, lineIdx) => (
                      <tspan key={lineIdx} x={b.cx} dy={lineIdx === 0 ? 0 : "1.1em"}>{line}</tspan>
                    ))}
                  </text>
                );
              })}
            </svg>
          </div>
          
          <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-gray-200 shadow-sm pointer-events-none hidden lg:block">
             <span className="text-[10px] text-gray-500 font-mono font-bold">Zoom Scale: {Math.round(10000/maxAbsValue)}%</span>
          </div>
        </div>
        {!isSmall && (
          <div className="lg:col-span-5 flex flex-col justify-center gap-8">
            <div className="bg-blue-50/50 p-10 rounded-3xl border-l-[8px] border-blue-600 shadow-sm break-keep">
              <h5 className="text-[12px] font-black text-blue-800 uppercase mb-5 tracking-[0.2em]">축의 의미 해석</h5>
              
              <div className="mb-6 space-y-2">
                 <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-500 uppercase w-6 text-center">X</span>
                    <span>{xLabel}</span>
                    <span className="flex-grow border-b border-dotted border-slate-300 mx-2"></span>
                    <span className="text-xs text-slate-400">(-) 낮음 ↔ 높음 (+)</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-500 uppercase w-6 text-center">Y</span>
                    <span>{yLabel}</span>
                    <span className="flex-grow border-b border-dotted border-slate-300 mx-2"></span>
                    <span className="text-xs text-slate-400">(-) 낮음 ↔ 높음 (+)</span>
                 </div>
              </div>

              <p className="text-lg text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">{data.factReading}</p>
            </div>
            <div className="bg-indigo-50/50 p-10 rounded-3xl border-l-[8px] border-indigo-600 shadow-sm break-keep">
              <h5 className="text-[12px] font-black text-indigo-800 uppercase mb-5 tracking-[0.2em]">전략적 시사점</h5>
              <p className="text-lg text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">{data.strategicImplication}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};