import React from 'react';
import {
  Radar,
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';
import { IntentVector } from '../core/context';

interface RadarChartProps {
  data: IntentVector;
}

const CustomTick = (props: any) => {
  const { x, y, payload, index, textAnchor } = props;
  const labels = [
    { name: 'Informational', icon: '📘', key: 'informational' },
    { name: 'Exploratory', icon: '🔍', key: 'exploratory' },
    { name: 'Commercial', icon: '💡', key: 'commercial' },
    { name: 'Transactional', icon: '🛒', key: 'transactional' },
  ];

  const item = labels[index];
  if (!item) return null;

  const score = (props as any)[item.key];

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor={textAnchor}
        dominantBaseline="central"
        className="font-sans"
      >
        <tspan x="0" dy="-0.6em" fill="currentColor" fontSize={10} fontWeight={800} className="uppercase tracking-widest opacity-60">{item.name}</tspan>
        <tspan x="0" dy="1.4em" fill="#6366f1" fontSize={12} fontWeight={900} className="font-mono">
          {(score * 10).toFixed(1)}
        </tspan>
      </text>
    </g>
  );
};

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const chartData = [
    { subject: 'Informational', value: data.informational },
    { subject: 'Exploratory', value: data.exploratory },
    { subject: 'Commercial', value: data.commercial },
    { subject: 'Transactional', value: data.transactional },
  ];

  return (
    <div className="w-full h-72 flex items-center justify-center relative text-slate-500 dark:text-slate-400">
      <ResponsiveContainer width="100%" height="100%">
        <ReRadarChart
          cx="50%"
          cy="50%"
          outerRadius="65%"
          data={chartData}
          margin={{ top: 20, right: 40, bottom: 20, left: 40 }}
        >
          <PolarGrid stroke="currentColor" strokeOpacity={0.1} />
          <PolarAngleAxis
            dataKey="subject"
            tick={(props) => (
              <CustomTick
                {...props}
                informational={data.informational}
                exploratory={data.exploratory}
                transactional={data.transactional}
                commercial={data.commercial}
              />
            )}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 1]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="인지 강도"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={3}
            fill="#6366f1"
            fillOpacity={0.3}
            animationDuration={1500}
            dot={{ r: 3, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
          />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
