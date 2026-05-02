
import React, { useState, useRef } from 'react';
import { SparklesIcon } from './icons';

interface AdImageGeneratorProps {
  adMessage: string;
  topic?: string;
  isLightMode?: boolean;
}

const AdImageGenerator: React.FC<AdImageGeneratorProps> = ({ adMessage, topic, isLightMode }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    // 실제 구현에서는 geminiService의 generateAdImage(추후 추가) 등을 호출
    // 현재는 시연을 위해 지연시간 후 더미 응답 시뮬레이션
    setTimeout(() => {
      setIsLoading(false);
      setGeneratedImage("https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop");
    }, 2000);
  };

  const handleReset = () => {
    setIsFormVisible(false);
    setGeneratedImage(null);
  };

  if (!isFormVisible) {
    return (
      <button
        onClick={() => setIsFormVisible(true)}
        className="w-full mt-4 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black rounded-xl hover:scale-[1.02] transition-all shadow-lg text-sm uppercase tracking-tighter flex items-center justify-center gap-2"
      >
        <SparklesIcon className="w-4 h-4" />
        AI SNS 광고 이미지 만들기
      </button>
    );
  }

  return (
    <div className={`mt-4 p-6 rounded-2xl border-2 animate-fade-in ${isLightMode ? 'bg-slate-50 border-sky-100' : 'bg-slate-900 border-sky-500/20'}`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-black text-sky-500 uppercase tracking-widest">AI Ad Creative Generator</h4>
        <button onClick={handleReset} className="text-xs font-bold text-slate-500 hover:text-slate-300">이전 (접기)</button>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
          <p className="text-[11px] text-slate-500 font-bold mb-1 uppercase">Target Concept</p>
          <p className={`text-sm font-medium ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>"{adMessage}"</p>
        </div>

        {!generatedImage ? (
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-4 bg-sky-600 text-white font-black rounded-xl hover:bg-sky-500 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                이미지 생성 중...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                광고 시안 생성하기
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border-2 border-sky-500/30 shadow-2xl">
              <img src={generatedImage} alt="AI Generated Ad" className="w-full h-auto" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setGeneratedImage(null)} className="flex-1 py-2 bg-slate-700 text-white text-xs font-bold rounded-lg">다시 생성</button>
              <button onClick={() => window.open(generatedImage)} className="flex-1 py-2 bg-sky-600 text-white text-xs font-bold rounded-lg">고화질 다운로드</button>
            </div>
          </div>
        )}
        
        <p className="text-[10px] text-center text-slate-500 italic">※ 한글 깨짐 방지를 위해 이미지 내 레이블은 영문으로 생성됩니다.</p>
      </div>
    </div>
  );
};

export default AdImageGenerator;
