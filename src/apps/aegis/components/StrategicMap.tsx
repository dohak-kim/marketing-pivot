
// NOTE: StrategicMap (2-depth inner tab wrapper) is superseded by App.tsx's
// 3-tab flat layout (vizMode: 'ladder' | 'heatmap' | 'network').
// ContextCognitionMatrix and ContextForceGraph are now rendered directly.
// This file is retained for reference only — not imported from the main app.

import React, { useState } from 'react';
import { Context } from '../core/context';
import ContextForceGraph from './ContextForceGraph';
import { ContextCognitionMatrix } from './ContextCognitionMatrix';

interface StrategicMapProps {
  rootKeyword: string;
  ceps: Context[];
  density: number;
  onNodeClick?: (id: string) => void;
}

type MapTab = 'matrix' | 'network';

const StrategicMap: React.FC<StrategicMapProps> = ({ rootKeyword, ceps, density, onNodeClick }) => {
  const [activeTab, setActiveTab] = useState<MapTab>('network');

  const tabCls = (t: MapTab) =>
    `px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
      activeTab === t
        ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
    }`;

  return (
    <div className="space-y-4">
      {/* Tab 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Strategic Intelligence Map
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            CEP 유사도 클러스터 분석 · Context × Cognition 분포
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button onClick={() => setActiveTab('network')} className={tabCls('network')}>
            Similarity Network
          </button>
          <button onClick={() => setActiveTab('matrix')} className={tabCls('matrix')}>
            Cognition Matrix
          </button>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'network' && (
          <ContextForceGraph ceps={ceps} onNodeClick={onNodeClick} />
        )}
        {activeTab === 'matrix' && (
          <ContextCognitionMatrix ceps={ceps} />
        )}
      </div>
    </div>
  );
};

export default StrategicMap;
