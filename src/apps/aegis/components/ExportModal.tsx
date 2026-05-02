
import React, { useState } from 'react';
import { Context } from '../core/context';
import { ForgeOutput } from '../core/types/contentGeneration';
import {
  exportContextsAsCsv,
  exportSessionAsJson,
  exportSessionAsMarkdown,
  exportToCsv,
} from '../utils/export';
import type { ExportSession } from '../utils/export';
import { RawDataItem } from '../core/context';

interface ExportModalProps {
  category: string;
  brandName?: string;
  contexts: Context[];
  rawData?: RawDataItem[] | null;
  forgeOutputs?: ForgeOutput[];
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  category, brandName, contexts, rawData, forgeOutputs, onClose,
}) => {
  const [done, setDone] = useState<string>('');
  const [loading, setLoading] = useState<string>('');

  const run = async (key: string, fn: () => void) => {
    setLoading(key);
    setDone('');
    try {
      await Promise.resolve(fn());
      setDone(key);
    } finally {
      setLoading('');
    }
  };

  const session: ExportSession = {
    category,
    brandName,
    exportedAt: new Date().toLocaleString('ko-KR'),
    contexts,
    forgeOutputs,
  };

  const options = [
    {
      key: 'cep_csv',
      icon: '📊',
      title: 'CEP 전략 데이터',
      desc: `${contexts.length}개 CEP의 전략 유형 · Priority Score · SOV · 실행 방향`,
      badge: 'CSV',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      fn: () => exportContextsAsCsv(contexts, brandName),
    },
    {
      key: 'raw_csv',
      icon: '🗂️',
      title: 'Raw SERP 데이터',
      desc: `${rawData?.length || 0}개 원시 데이터 포인트 (Google/Naver 스니펫)`,
      badge: 'CSV',
      badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
      fn: () => rawData?.length ? exportToCsv(rawData, `AEGIS_Raw_${category}_${new Date().toISOString().slice(0,10)}.csv`) : null,
      disabled: !rawData?.length,
    },
    {
      key: 'json',
      icon: '🔧',
      title: '전체 세션 JSON',
      desc: `CEP + 전략 + Hub & Spoke 계획${forgeOutputs?.length ? ` + FORGE ${forgeOutputs.length}건` : ''} 구조화 데이터`,
      badge: 'JSON',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      fn: () => exportSessionAsJson(session),
    },
    {
      key: 'markdown',
      icon: '📋',
      title: '전체 분석 보고서',
      desc: `CEP 목록 · 전략 방향 · Hub & Spoke · KPI${forgeOutputs?.length ? ` · FORGE ${forgeOutputs.length}건` : ''} 완전한 Markdown 문서`,
      badge: 'Markdown',
      badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
      fn: () => exportSessionAsMarkdown(session),
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">

        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">내보내기</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {category} · {contexts.length}개 CEP
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          {options.map(opt => (
            <button
              key={opt.key}
              onClick={() => !opt.disabled && run(opt.key, opt.fn)}
              disabled={!!opt.disabled || loading === opt.key}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                opt.disabled
                  ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/3'
                  : done === opt.key
                    ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/10'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'
              }`}
            >
              {/* Icon */}
              <span className="text-2xl shrink-0">{
                loading === opt.key ? '⏳'
                : done === opt.key ? '✅'
                : opt.icon
              }</span>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black text-slate-800 dark:text-slate-100">{opt.title}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${opt.badgeColor}`}>{opt.badge}</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
              </div>

              {/* Arrow */}
              {!opt.disabled && loading !== opt.key && done !== opt.key && (
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <p className="text-[9px] text-slate-400 dark:text-slate-600 text-center">
            모든 파일은 UTF-8 (BOM) 인코딩 · Excel/Notion/Claude 재활용 가능
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
