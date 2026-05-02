
import React from 'react';
import { ContextDashboardItem } from '../market/dashboard';

export type SortField = 'marketPressureScore' | 'avgContentScore' | 'finalPriorityScore';
export type SortOrder = 'asc' | 'desc';

interface StrategicDashboardProps {
  items: ContextDashboardItem[];
  onSelect: (id: string) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

const SortIcon = ({ active, order }: { active: boolean; order: SortOrder }) => {
  if (!active) return (
    <svg className="w-4 h-4 text-slate-400 dark:text-slate-600 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
  return (
    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {order === 'asc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );
};

export const StrategicDashboard: React.FC<StrategicDashboardProps> = ({ 
  items, 
  onSelect, 
  sortField, 
  sortOrder, 
  onSort 
}) => {
  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-in fade-in duration-700 shadow-xl dark:shadow-2xl theme-transition">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <caption className="sr-only">전략적 인텔리전스 대시보드 - 각 Context 상황에 대한 성과 및 우선순위 지표</caption>
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            {/* Headers: text-xs -> text-sm */}
            <th scope="col" className="px-10 py-6 text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Strategic Cluster</th>
            
            <th 
              scope="col"
              className="px-10 py-6 text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-center"
              onClick={() => onSort('marketPressureScore')}
              aria-sort={sortField === 'marketPressureScore' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <button className="flex items-center justify-center w-full focus:outline-none focus:underline">
                시장 압력
                <SortIcon active={sortField === 'marketPressureScore'} order={sortOrder} />
              </button>
            </th>
            
            <th 
              scope="col"
              className="px-10 py-6 text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-center"
              onClick={() => onSort('avgContentScore')}
              aria-sort={sortField === 'avgContentScore' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <button className="flex items-center justify-center w-full focus:outline-none focus:underline">
                성과 지표 (KPI)
                <SortIcon active={sortField === 'avgContentScore'} order={sortOrder} />
              </button>
            </th>
            
            <th 
              scope="col"
              className="px-10 py-6 text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-center"
              onClick={() => onSort('finalPriorityScore')}
              aria-sort={sortField === 'finalPriorityScore' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              <button className="flex items-center justify-center w-full focus:outline-none focus:underline">
                Priority Score
                <SortIcon active={sortField === 'finalPriorityScore'} order={sortOrder} />
              </button>
            </th>
            
            <th scope="col" className="px-10 py-6 text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right">Manage</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr 
              key={item.contextId} 
              className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <td className="px-10 py-7">
                <div className="max-w-md">
                  <div className="flex items-center gap-2 mb-2">
                    {/* Content: text-lg -> text-xl */}
                    <div className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 tracking-tight">
                        {item.situation}
                    </div>
                    {item.strategyState === 'pre-strategy' && (
                        <span className="px-2.5 py-1 text-xs font-bold rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 shrink-0 border border-amber-200 dark:border-amber-800/30">
                            전략 준비 중
                        </span>
                    )}
                  </div>
                  {/* Meta: text-[10px] -> text-xs */}
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                    REF: {item.contextId.slice(0, 8)}
                  </div>
                </div>
              </td>
              <td className="px-10 py-7">
                <div className="flex flex-col items-center">
                  {/* Score: text-base -> text-lg */}
                  <span className={`text-lg font-mono font-black mb-2 ${sortField === 'marketPressureScore' ? 'text-sky-700 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.marketPressureScore}%
                  </span>
                  <div className="w-24 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner">
                    <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${item.marketPressureScore}%` }} />
                  </div>
                </div>
              </td>
              <td className="px-10 py-7">
                <div className="flex flex-col items-center">
                  {/* Score: text-base -> text-lg */}
                  <span className={`text-lg font-mono font-black mb-2 ${sortField === 'avgContentScore' ? 'text-indigo-700 dark:text-indigo-400' : (item.avgContentScore > 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600')}`}>
                    {item.avgContentScore > 0 ? `${item.avgContentScore}%` : 'Awaiting'}
                  </span>
                  <div className="w-24 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${item.avgContentScore}%` }} />
                  </div>
                </div>
              </td>
              <td className="px-10 py-7">
                <div className="flex justify-center">
                  <div className={`px-4 py-2 rounded-xl border font-mono font-black text-base ${sortField === 'finalPriorityScore' ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400'}`}>
                    {item.finalPriorityScore}
                  </div>
                </div>
              </td>
              <td className="px-10 py-7 text-right">
                <button 
                  onClick={() => onSelect(item.contextId)}
                  aria-label={`상세 분석: ${item.situation}`}
                  // Button: text-xs -> text-sm
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 transition-all shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  상세 분석
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StrategicDashboard;
