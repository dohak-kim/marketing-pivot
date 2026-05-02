
import React, { useMemo } from 'react';
import type { Cluster } from '../types';
import { UserGroupIcon, DesktopComputerIcon, SparklesIcon } from './icons';
import AdImageGenerator from './AdImageGenerator';
import ReelGenerator from './ReelGenerator';

interface ClusterDisplayProps {
  clusters: Cluster[];
  onGenerateAeo: (cluster: Cluster, format: 'blog' | 'linkedin') => void;
  isGeneratingAeo: boolean;
  generatingForCluster: { name: string; format: 'blog' | 'linkedin' } | null;
  isLightMode?: boolean;
}

const ClusterDisplay: React.FC<ClusterDisplayProps> = ({ clusters, onGenerateAeo, isGeneratingAeo, generatingForCluster, isLightMode }) => {
  const maxPercentage = useMemo(() => {
    if (clusters.length === 0) return 0;
    return Math.max(...clusters.map(c => c.percentage));
  }, [clusters]);

  return (
    <div className="space-y-8 print:space-y-4">
      <h2 className={`text-3xl font-bold text-center ${isLightMode ? 'text-black' : 'text-slate-200'} print:text-2xl font-black tracking-tight`}>데이터 기반 타겟 클러스터 분석</h2>
      <div className="flex justify-center">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 w-full max-w-5xl print:grid-cols-1 print:gap-4">
          {clusters.map((cluster, index) => {
            const isHighest = cluster.percentage === maxPercentage;
            const isLoadingBlog = isGeneratingAeo && generatingForCluster?.name === cluster.name && generatingForCluster?.format === 'blog';
            const isLoadingLinkedin = isGeneratingAeo && generatingForCluster?.name === cluster.name && generatingForCluster?.format === 'linkedin';

            return (
              <div 
                key={index} 
                className={`${isLightMode ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-800 border-slate-700 shadow-2xl'} p-8 rounded-2xl border transition-all duration-500 flex flex-col relative print:shadow-none print:border-slate-200 print:bg-white print:p-6 ${isHighest ? (isLightMode ? 'ring-2 ring-rose-500 border-rose-200' : 'ring-2 ring-rose-500/50 border-rose-500/50 shadow-rose-500/10') : 'hover:border-teal-500/50'}`}
              >
                {/* 시장 점유율 게이지 */}
                <div className={`absolute -top-4 -right-4 ${isHighest ? 'bg-rose-600 shadow-rose-500/40' : 'bg-teal-600'} text-white w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 ${isLightMode ? 'border-white' : 'border-slate-900'} z-10 print:top-4 print:right-4 print:w-16 print:h-16 print:border-2 print:border-slate-100`}>
                  <span className="text-[10px] font-bold leading-none uppercase mb-1">Share</span>
                  <span className="text-xl font-black">{cluster.percentage}%</span>
                </div>

                <h3 className={`text-2xl font-black ${isHighest ? 'text-rose-500' : (isLightMode ? 'text-teal-600' : 'text-teal-400')} mb-6 flex items-center gap-3 print:mb-4 print:text-xl print:text-teal-700`}>
                  <span className={`${isHighest ? 'bg-rose-500/20 text-rose-500' : 'bg-teal-500/20 text-teal-300'} px-3 py-1 rounded text-sm print:bg-teal-100 print:text-teal-600 uppercase`}>Cluster {index + 1}</span>
                  {cluster.name}
                </h3>

                <div className={`space-y-6 ${isLightMode ? 'text-slate-800' : 'text-slate-200'} flex-grow print:space-y-3 print:text-slate-800`}>
                  <div className="flex items-start">
                      <UserGroupIcon className={`w-6 h-6 mr-3 mt-1 flex-shrink-0 ${isHighest ? 'text-rose-500' : 'text-teal-500'} print:w-5 print:h-5 print:text-teal-600`} />
                      <div>
                          <strong className="block text-slate-400 text-xs uppercase tracking-wider mb-1 print:text-slate-600 print:text-xxs">Target Persona</strong>
                          <span className="font-medium">{cluster.target.demographics}</span>
                      </div>
                  </div>
                   <div className="flex items-start">
                      <DesktopComputerIcon className={`w-6 h-6 mr-3 mt-1 flex-shrink-0 ${isHighest ? 'text-rose-500' : 'text-teal-500'} print:w-5 print:h-5 print:text-teal-600`} />
                      <div>
                          <strong className="block text-slate-400 text-xs uppercase tracking-wider mb-1 print:text-slate-600 print:text-xxs">Media Strategy</strong>
                          <span className="font-medium">{cluster.target.media_habit}</span>
                      </div>
                  </div>

                  {/* 포함된 CEP 시각화 */}
                  <div className={`${isLightMode ? 'bg-slate-50 border-slate-100' : 'bg-slate-900/50 border-slate-700/50'} p-4 rounded-xl border print:bg-slate-50 print:border-slate-200 print:p-3`}>
                    <strong className="block text-slate-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-2 print:text-slate-600 print:text-xxs print:mb-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isHighest ? 'bg-rose-500' : 'bg-teal-500'}`}></span>
                      구성 데이터 (포함된 CEP)
                    </strong>
                    <div className="flex flex-wrap gap-2 print:gap-1">
                      {cluster.linkedCepIndices.map(cepIdx => (
                        <span key={cepIdx} className={`${isLightMode ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-800 border-slate-700 text-slate-400'} px-3 py-1 rounded-md text-[11px] border print:bg-slate-100 print:text-slate-700 print:border-slate-300 print:px-2 print:py-0.5 print:text-xxs`}>
                          상황 분석 #{cepIdx + 1} 반영
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`mt-8 pt-6 border-t ${isLightMode ? 'border-slate-100' : 'border-slate-700'} print:mt-4 print:pt-4 print:border-slate-200`}>
                  <h4 className={`font-bold ${isHighest ? 'text-rose-500' : 'text-amber-400'} mb-3 flex items-center gap-2 print:text-amber-700 print:text-lg print:mb-2`}>
                    <SparklesIcon className="w-5 h-5 print:w-4 print:h-4" />
                    결정적 트리거 상황 (CEP Trigger)
                  </h4>
                  <p className={`${isHighest ? (isLightMode ? 'bg-rose-50 text-slate-900 border-rose-200' : 'bg-rose-500/10 text-white border-rose-500/50') : (isLightMode ? 'bg-amber-50 text-slate-900 border-amber-200' : 'bg-amber-500/10 text-slate-200 border-amber-500')} border-l-4 p-4 rounded-r-xl italic leading-relaxed print:p-3 print:text-base`}>
                    "{cluster.cep_trigger}"
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 print:hidden">
                  <button
                      onClick={() => onGenerateAeo(cluster, 'blog')}
                      disabled={isGeneratingAeo}
                      className={`px-4 py-3 ${isHighest ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-black rounded-xl disabled:bg-slate-700 transition-all shadow-xl text-sm uppercase tracking-tighter`}
                  >
                      {isLoadingBlog ? '생성 중...' : 'Blog AEO'}
                  </button>
                   <button
                      onClick={() => onGenerateAeo(cluster, 'linkedin')}
                      disabled={isGeneratingAeo}
                      className={`px-4 py-3 ${isHighest ? 'bg-rose-700 hover:bg-rose-600' : 'bg-sky-600 hover:bg-sky-500'} text-white font-black rounded-xl disabled:bg-slate-700 transition-all shadow-xl text-sm uppercase tracking-tighter`}
                  >
                      {isLoadingLinkedin ? '생성 중...' : 'LinkedIn AEO'}
                  </button>
                </div>

                {/* Appendix: Creative Tools (Foldable via '이전' button) */}
                <div className="print:hidden">
                  <AdImageGenerator adMessage={cluster.cep_trigger} isLightMode={isLightMode} />
                  <ReelGenerator adMessage={cluster.cep_trigger} isLightMode={isLightMode} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ClusterDisplay;
