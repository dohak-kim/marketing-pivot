import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <div className="text-center py-40 border border-dashed border-slate-200 dark:border-white/10 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-700">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10h.01M15 10h.01M9 14h6" />
        </svg>
      </div>
      <h3 className="text-2xl font-black text-slate-700 dark:text-slate-200 mb-2 tracking-tight">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 font-medium">{description}</p>
    </div>
  );
};

export default EmptyState;