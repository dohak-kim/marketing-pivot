
import React from 'react';
import { CognitionKey } from '../domain/visualization/contextVisualization.types';

type HeatmapData = Record<CognitionKey, number>;

interface CognitionHeatmapProps {
  data: HeatmapData;
}

const CognitionHeatmap: React.FC<CognitionHeatmapProps> = ({ data }) => {
  const intents: { key: CognitionKey; label: string; sub: string; color: string; hex: string; description: string }[] = [
    { key: 'informational', label: 'Informational', sub: '콘텐츠 제작', color: 'bg-blue-500', hex: '#3b82f6', description: '지식 습득 및 문제 해결을 위한 탐색' },
    { key: 'exploratory', label: 'Exploratory', sub: '비교·가이드', color: 'bg-purple-500', hex: '#8b5cf6', description: '특정 브랜드/제품군에 대한 광범위한 조사' },
    { key: 'commercial', label: 'Commercial', sub: 'USP·메시지', color: 'bg-amber-500', hex: '#f59e0b', description: '구매를 전제로 한 구체적인 대안 비교' },
    { key: 'transactional', label: 'Transactional', sub: '전환·오퍼', color: 'bg-emerald-500', hex: '#10b981', description: '명확한 구매/행동 의도를 가진 최종 단계' },
  ];

  const totalVolume = (Object.values(data) as number[]).reduce((sum, v) => sum + v, 0);
  const maxVolume = Math.max(...(Object.values(data) as number[]), 1); 
  
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="space-y-4 font-sans animate-in fade-in">
      <div className="grid grid-cols-2 gap-3">
        {intents.map(({ key, label, sub, hex, description }) => {
          const volume = data[key] || 0;
          const percentage = totalVolume > 0 ? (volume / totalVolume) * 100 : 0;
          // Updated logic: Increased base opacity for better visibility on white backgrounds
          const intensity = volume / maxVolume;
          const opacity = 0.4 + intensity * 0.6; 

          return (
            <div
              key={key}
              className="p-4 rounded-xl border border-white/10 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 group relative shadow-md"
              style={{ backgroundColor: hexToRgba(hex, opacity) }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {description}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
              </div>

              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-black text-white uppercase text-xs tracking-widest drop-shadow-md">{label}</span>
                  <span className="block text-[9px] font-semibold text-white/70 drop-shadow-sm mt-0.5">{sub}</span>
                </div>
                <span className="font-mono font-bold text-white/90 text-[10px] drop-shadow-sm">{percentage.toFixed(1)}%</span>
              </div>
              <div className="mt-2 text-2xl font-black text-white font-mono drop-shadow-md">
                {volume.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
       <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider pt-2">
         총 검색량: {totalVolume.toLocaleString()}
       </div>
    </div>
  );
};

export default CognitionHeatmap;
