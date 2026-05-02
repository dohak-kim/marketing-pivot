import React from 'react';
import { MarketTrendPoint } from '../types';

interface MarketChartProps {
  historical: MarketTrendPoint[];
  forecast: MarketTrendPoint[];
  unit: string;
  isSmall?: boolean;
}

export const MarketChart: React.FC<MarketChartProps> = ({ historical, forecast, unit, isSmall = false }) => {
  const combined = [...(historical || []), ...(forecast || [])];
  if (combined.length === 0) return <div>No data available</div>;
  
  const maxValue = Math.max(...combined.map(p => p.value)) * 1.3;
  const padding = isSmall ? 30 : 70;
  const width = 1200;
  const height = 450;
  
  const points = combined.map((p, i) => {
    const x = padding + (i * (width - padding * 2) / (combined.length - 1));
    const y = height - padding - (p.value * (height - padding * 2) / maxValue);
    return { x, y, ...p };
  });

  const path = points.filter(p => !p.isForecast).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const forecastPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className={`w-full bg-white ${isSmall ? 'p-4 rounded-xl' : 'p-12 rounded-3xl'} overflow-hidden border border-gray-100 shadow-sm`} role="img" aria-label={`시장 규모 차트. 단위: ${unit}.`}>
      {!isSmall && (
        <div className="flex justify-between items-center mb-10">
          <div>
            <h4 className="text-xl font-black text-[#002d72] uppercase tracking-widest">시장 규모 추이</h4>
            <p className="text-sm text-gray-400 italic font-medium">과거 데이터 및 AI 예측</p>
          </div>
          <p className="text-sm font-black text-white bg-blue-600 px-4 py-1.5 rounded-full uppercase">단위: {unit}</p>
        </div>
      )}
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {[0, 0.25, 0.5, 0.75, 1].map(v => {
            const yPos = height - padding - v * (height - padding * 2);
            return (
              <g key={v}>
                <line x1={padding} y1={yPos} x2={width - padding} y2={yPos} stroke="#f1f5f9" strokeWidth="1" />
                {!isSmall && <text x={padding - 15} y={yPos + 4} textAnchor="end" fontSize="13" fill="#94a3b8" fontWeight="bold">{Math.round(maxValue * v).toLocaleString()}</text>}
              </g>
            );
          })}
          <rect x={points.find(p => p.isForecast)?.x || 0} y={padding} width={width - (points.find(p => p.isForecast)?.x || 0) - padding} height={height - padding * 2} fill="#f0f7ff" opacity="0.6" />
          <path d={forecastPath} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8,5" />
          <path d={path} fill="none" stroke="#002d72" strokeWidth="5" strokeLinecap="round" />
          {points.map((p, i) => {
            const displayYear = `${p.year}${p.isEstimated ? '(E)' : ''}`;
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={isSmall ? "6" : "7"} fill={p.isForecast ? "#94a3b8" : "#002d72"} stroke="white" strokeWidth="3" />
                <text x={p.x} y={p.y - (isSmall ? 16 : 20)} textAnchor="middle" fontSize={isSmall ? "18" : "14"} fill={p.isForecast ? "#64748b" : "#002d72"} fontWeight="black">{p.value.toLocaleString()}</text>
                <text x={p.x} y={height - padding + (isSmall ? 24 : 40)} textAnchor="middle" fontSize={isSmall ? "14" : "12"} fill="#64748b" fontWeight="black">{displayYear}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
