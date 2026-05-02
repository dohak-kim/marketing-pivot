
import React, { useState } from 'react';
import { SparklesIcon } from './icons';

interface ReelGeneratorProps {
  adMessage: string;
  isLightMode?: boolean;
}

const ReelGenerator: React.FC<ReelGeneratorProps> = ({ adMessage, isLightMode }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storyboard, setStoryboard] = useState<any>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    // 시연용 더미 데이터
    setTimeout(() => {
      setIsLoading(false);
      setStoryboard([
        { scene: 1, action: "일상적인 공간에서 고민하는 모습", text: "아직도 고민 중이신가요?" },
        { scene: 2, action: "제품/서비스가 해결책으로 등장", text: "이제 이 방법으로 해결하세요." },
        { scene: 3, action: "만족스러운 표정과 함께 CTA", text: "지금 바로 프로필 링크 확인!" }
      ]);
    }, 2000);
  };

  const handleReset = () => {
    setIsFormVisible(false);
    setStoryboard(null);
  };

  if (!isFormVisible) {
    return (
      <button
        onClick={() => setIsFormVisible(true)}
        className="w-full mt-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-black rounded-xl hover:scale-[1.02] transition-all shadow-lg text-sm uppercase tracking-tighter flex items-center justify-center gap-2"
      >
        <SparklesIcon className="w-4 h-4" />
        AI 릴스/숏폼 기획하기
      </button>
    );
  }

  return (
    <div className={`mt-4 p-6 rounded-2xl border-2 animate-fade-in ${isLightMode ? 'bg-slate-50 border-purple-100' : 'bg-slate-900 border-purple-500/20'}`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-black text-purple-500 uppercase tracking-widest">AI Reels Storyboarder</h4>
        <button onClick={handleReset} className="text-xs font-bold text-slate-500 hover:text-slate-300">이전 (접기)</button>
      </div>

      {!storyboard ? (
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-4 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-500 transition-all flex items-center justify-center gap-3 shadow-xl"
        >
          {isLoading ? '스토리보드 구성 중...' : '숏폼 기획안 생성하기'}
        </button>
      ) : (
        <div className="space-y-4">
          {storyboard.map((s: any) => (
            <div key={s.scene} className="p-4 rounded-xl bg-black/20 border border-white/5">
              <span className="text-[10px] font-black text-purple-400">SCENE {s.scene}</span>
              <p className={`text-sm font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-200'} mb-1`}>{s.action}</p>
              <p className="text-xs text-slate-500 italic">자막: "{s.text}"</p>
            </div>
          ))}
          <button onClick={() => setStoryboard(null)} className="w-full py-2 bg-slate-700 text-white text-xs font-bold rounded-lg">초기화</button>
        </div>
      )}
    </div>
  );
};

export default ReelGenerator;
