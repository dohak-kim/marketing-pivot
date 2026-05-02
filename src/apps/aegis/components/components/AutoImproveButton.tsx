
import React, { useState } from 'react';
import { ContentEvaluation } from '../evaluation/model';
import { autoImproveContent } from '../evaluation/autoImprove';

interface AutoImproveButtonProps {
  content: string;
  evaluation: ContentEvaluation;
  onImproved: (newContent: string) => void;
  className?: string;
}

export function AutoImproveButton({
  content,
  evaluation,
  onImproved,
  className = ""
}: AutoImproveButtonProps) {
  const [isImproving, setIsImproving] = useState(false);

  const handleClick = async () => {
    if (isImproving) return;
    
    setIsImproving(true);
    try {
      const improved = await autoImproveContent(content, evaluation);
      onImproved(improved);
    } catch (error) {
      console.error("Content optimization failed:", error);
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <button 
      onClick={handleClick}
      disabled={isImproving}
      className={`relative group overflow-hidden w-full py-4 px-6 bg-indigo-600 text-white rounded-2xl text-[10px] font-bold hover:bg-indigo-500 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      {isImproving ? (
        <>
          <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="uppercase tracking-[0.2em] font-mono animate-pulse">Analyzing & Optimizing...</span>
        </>
      ) : (
        <>
          <span className="uppercase tracking-[0.2em] font-mono">Deploy A.I. Strategic Pivot</span>
          <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </>
      )}
    </button>
  );
}

export default AutoImproveButton;
