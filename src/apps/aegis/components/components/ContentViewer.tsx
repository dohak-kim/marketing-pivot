
import React from 'react';

interface ContentViewerProps {
  content: string;
  channel?: string;
  format?: string;
}

export function ContentViewer({ content, channel, format }: ContentViewerProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative group min-h-[300px] flex flex-col overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex justify-between items-center mb-10 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">생성된 전략 에셋 (Strategic Asset)</h4>
          {channel && format && (
            <span className="text-[10px] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold font-mono tracking-tight">
              {channel} • {format}
            </span>
          )}
        </div>
        <button 
          onClick={handleCopy}
          className="w-10 h-10 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all active:scale-90 shadow-lg shadow-indigo-500/5 group/btn"
          title="클립보드에 복사"
        >
          <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 8v3m-3-3l3 3 3-3" />
          </svg>
        </button>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none relative z-10 flex-1">
        <div className="text-slate-800 dark:text-slate-200 leading-loose whitespace-pre-wrap font-sans text-base md:text-lg break-keep selection:bg-indigo-500/30 tracking-normal">
          {content.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} className="block my-2" />;
            
            // Check if line is a header (starts with # or is short and strong)
            const isHeader = line.startsWith('#') || line.startsWith('**') || (line.length < 30 && line.includes(':'));
            
            return (
              <p 
                key={i} 
                className={`
                    ${i === 0 ? 'first-letter:text-5xl first-letter:font-black first-letter:text-indigo-600 dark:first-letter:text-indigo-400 first-letter:mr-3 first-letter:float-left first-letter:mt-1' : ''} 
                    ${isHeader ? 'font-bold text-slate-900 dark:text-white mt-6 mb-3' : 'mb-4 font-medium opacity-90'}
                `}
              >
                {line.replace(/^#+\s/, '').replace(/\*\*/g, '')}
              </p>
            );
          })}
        </div>
      </div>
      
      <div className="mt-10 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center relative z-10">
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">AI 합성 결과물 (Synthesized Output)</span>
        <div className="flex space-x-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
        </div>
      </div>
    </div>
  );
}

export default ContentViewer;
