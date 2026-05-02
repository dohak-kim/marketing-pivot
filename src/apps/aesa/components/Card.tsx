import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  color: string;
  sources?: string[];
}

export const Card: React.FC<CardProps> = ({ title, children, color, sources }) => (
  <div className={`bg-white rounded-xl shadow-sm border-l-4 ${color} overflow-hidden mb-6 h-full flex flex-col`}>
    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
      <h3 className="font-bold text-gray-800 uppercase tracking-wider text-sm">{title}</h3>
    </div>
    <div className="p-6 flex-grow">
      {children}
    </div>
    {sources && sources.length > 0 && (
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 font-bold uppercase mb-1">데이터 출처</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {sources.map((s, i) => <span key={i} className="text-[10px] text-gray-500 truncate max-w-[160px] italic">#{s}</span>)}
        </div>
      </div>
    )}
  </div>
);
