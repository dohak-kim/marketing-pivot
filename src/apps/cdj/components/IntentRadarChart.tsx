
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { IntentDistribution } from '../types';

interface IntentRadarChartProps {
  distribution: IntentDistribution[];
  isPrintMode?: boolean;
}

const CustomLegend = ({ data, isPrintMode }: { data: Array<{ subject: string; A: number }>, isPrintMode: boolean }) => (
  <div className="mt-4">
    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
      {data.map((entry) => (
        <li key={entry.subject} className={`flex items-center ${isPrintMode ? 'text-gray-600' : 'text-gray-300'}`}>
          <span className="w-3 h-3 mr-2 rounded-sm" style={{ backgroundColor: '#FBBF24' }} />
          <span>{entry.subject}:</span>
          <strong className={`ml-1.5 ${isPrintMode ? 'text-gray-900' : 'text-white'}`}>{entry.A}%</strong>
        </li>
      ))}
    </ul>
  </div>
);


export const IntentRadarChart: React.FC<IntentRadarChartProps> = ({ distribution, isPrintMode = false }) => {
  const chartData = distribution.map(d => ({
    subject: d.intent,
    A: d.value,
    fullMark: 100,
  }));
  
  // Custom tooltip for better styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg border shadow-lg ${isPrintMode ? 'bg-white border-gray-200 text-gray-900' : 'bg-brand-light/80 backdrop-blur-sm border-gray-600'}`}>
          <p className="label text-brand-gold font-semibold">{`${label}`}</p>
          <p className={isPrintMode ? 'text-gray-800' : 'text-white'}>{`비중: ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };

  const containerClass = isPrintMode ? 'bg-white border border-gray-200 shadow-sm' : 'bg-brand-light shadow-inner';
  const gridColor = isPrintMode ? '#E5E7EB' : '#4B5563'; // gray-200 vs gray-600
  const tickColor = isPrintMode ? '#374151' : '#D1D5DB'; // gray-700 vs gray-300

  return (
    <div className={`flex flex-col h-full p-4 rounded-lg w-full min-h-[400px] ${containerClass}`}>
       <div className="w-full flex-grow">
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: tickColor, fontSize: 13, fontWeight: 500 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="의도 비중" dataKey="A" stroke="#FBBF24" fill="#FBBF24" fillOpacity={0.6} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(251, 191, 36, 0.4)', strokeWidth: 1, strokeDasharray: '3 3' }} />
            </RadarChart>
        </ResponsiveContainer>
       </div>
      <CustomLegend data={chartData} isPrintMode={isPrintMode} />
      <p className={`text-sm mt-4 text-center leading-relaxed ${isPrintMode ? 'text-gray-500' : 'text-gray-400'}`}>
        * 이 차트는 입력 주제와 관련된 전체 키워드들의 검색 의도 분포이며, 시장의 관심사 비중을 보여줍니다.
      </p>
    </div>
  );
};
