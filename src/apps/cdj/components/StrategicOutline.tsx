
import React from 'react';
import type { StrategicOutline as StrategicOutlineType } from '../types';
import { CDJ_STAGES_DETAILS } from '../constants';
import { CDJStage } from '../types';
import { AdImageGenerator } from './AdImageGenerator';
import { ReelGenerator } from './ReelGenerator';

interface StrategicOutlineProps {
  outlines: StrategicOutlineType[];
  isPrintMode?: boolean;
  recommendedStage?: CDJStage;
  topic?: string;
}

export const StrategicOutline: React.FC<StrategicOutlineProps> = ({ outlines, isPrintMode = false, recommendedStage, topic }) => {
    const orderedStages: CDJStage[] = [CDJStage.Awareness, CDJStage.Consideration, CDJStage.Decision, CDJStage.Loyalty];
    const orderedOutlines = orderedStages.map(stage => outlines.find(o => o.stage === stage)).filter(Boolean) as StrategicOutlineType[];

    const containerClass = isPrintMode ? 'bg-white border border-gray-200' : 'bg-brand-light shadow-lg';
    const textBase = isPrintMode ? 'text-gray-800' : 'text-gray-300';
    const sectionTitle = isPrintMode ? 'text-gray-900' : 'text-brand-gold';
    const ctaBox = isPrintMode ? 'bg-gray-100 text-gray-800 border border-gray-200' : 'bg-black/30 text-brand-positive border border-gray-700';

    return (
        <>
            {/* Page 3: Strategic Outlines (Text Only) */}
            <div className="pdf-section min-h-[1000px] flex flex-col justify-center">
                <h2 className={`text-2xl font-bold mb-6 text-center ${sectionTitle}`}>단계별 콘텐츠 전략 (Strategic Outline)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {orderedOutlines.map((outline) => {
                        const isRecommended = outline.stage === recommendedStage;
                        const details = CDJ_STAGES_DETAILS[outline.stage];
                        const headerColor = isPrintMode ? details.printColor : details.color;
                        const headerBg = isPrintMode ? details.printBgColor : details.bgColor;
                        const headerBorder = isPrintMode ? `border-b ${details.printBorderColor}` : `border-b ${details.borderColor}`;
                        
                        const containerStyle = isRecommended 
                            ? (isPrintMode ? 'border-2 border-red-400 shadow-md ring-2 ring-red-100' : 'border-2 border-brand-gold/70 shadow-[0_0_15px_rgba(251,191,36,0.2)]')
                            : '';

                        return (
                            <div key={`text-${outline.stage}`} className={`rounded-lg p-5 flex flex-col ${containerClass} ${containerStyle}`}>
                                <div className={`flex items-center justify-between pb-3 mb-4 ${headerBorder}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-full ${headerBg}`}>
                                            <details.Icon className={`w-5 h-5 ${headerColor}`} />
                                        </div>
                                        <h3 className={`text-xl font-bold ${headerColor}`}>{outline.stage}</h3>
                                    </div>
                                    {isRecommended && (
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse ${isPrintMode ? 'bg-red-100 text-red-600' : 'bg-red-900/50 text-red-400'}`}>
                                            🔥 1순위 집중 단계
                                        </span>
                                    )}
                                </div>
                                
                                <div className={`space-y-4 flex-grow text-sm ${textBase}`}>
                                    <div>
                                        <h4 className={`font-bold mb-1 ${isPrintMode ? 'text-gray-900' : 'text-brand-gold'}`}>AI 선호 정보</h4>
                                        <p className="leading-relaxed">{outline.explanation}</p>
                                    </div>
                                    <div>
                                        <h4 className={`font-bold mb-1 ${isPrintMode ? 'text-gray-900' : 'text-brand-gold'}`}>톤앤매너</h4>
                                        <p className="leading-relaxed">{outline.toneAndManner}</p>
                                    </div>
                                    <div>
                                        <h4 className={`font-bold mb-1 ${isPrintMode ? 'text-gray-900' : 'text-brand-gold'}`}>Call To Action (CTA)</h4>
                                        <p className={`font-mono p-2 rounded ${ctaBox}`}>{outline.cta}</p>
                                    </div>
                                    <div>
                                        <h4 className={`font-bold mb-1 ${isPrintMode ? 'text-gray-900' : 'text-brand-gold'}`}>추천 광고 메시지</h4>
                                        <ul className="list-disc list-inside space-y-1 pl-1">
                                            {outline.adMessages.map((msg, i) => (
                                                <li key={i} className={`italic ${isRecommended && i === 0 ? (isPrintMode ? 'text-red-600 font-bold' : 'text-brand-positive font-bold') : ''}`}>
                                                    {isRecommended && i === 0 ? `💡 "${msg}" (추천)` : `"${msg}"`}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Page 4: Appendix (Creative Drafts - Text) */}
            {/* The tools (Generator Forms) are hidden in PDF capture via 'hide-on-pdf' class, 
                so this page only shows the Copy & Plan. Generated visuals are appended as separate pages. */}
            <div className="pdf-section pt-8 min-h-[1000px]">
                <div className={`border-t-2 border-dashed my-8 ${isPrintMode ? 'border-gray-300' : 'border-gray-700'}`} />
                <h2 className={`text-2xl font-bold mb-6 text-center ${sectionTitle}`}>Appendix: Creative Drafts & Storyboards</h2>
                <p className={`text-center mb-8 text-sm ${isPrintMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    AI가 제안하는 단계별 광고 카피 및 크리에이티브 초안입니다. (시안 생성 전 Default)
                </p>

                <div className="grid grid-cols-1 gap-8">
                    {orderedOutlines.map((outline) => {
                        const isRecommended = outline.stage === recommendedStage;
                        const details = CDJ_STAGES_DETAILS[outline.stage];
                        const headerColor = isPrintMode ? details.printColor : details.color;
                        const borderColor = isPrintMode ? details.printBorderColor : details.borderColor;

                        return (
                            <div key={`creative-${outline.stage}`} className={`rounded-lg p-6 ${containerClass} ${isRecommended ? (isPrintMode ? 'ring-2 ring-red-200' : 'ring-1 ring-brand-gold/50') : ''}`}>
                                <div className={`flex items-center justify-between mb-4 border-b pb-2 ${borderColor}`}>
                                    <h3 className={`text-lg font-bold ${headerColor}`}>
                                        {outline.stage} 단계 크리에이티브
                                    </h3>
                                    {isRecommended && (
                                        <span className={`text-xs font-bold ${isPrintMode ? 'text-red-600' : 'text-red-400'}`}>
                                            ★ 1순위 추천
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {outline.adMessages.map((msg, i) => (
                                        <div key={i} className={`p-4 rounded-lg flex flex-col gap-4 ${isPrintMode ? 'bg-gray-50 border border-gray-200' : 'bg-black/20 border border-gray-700'}`}>
                                            <div className="text-center">
                                                {isRecommended && i === 0 && (
                                                    <span className="inline-block mb-1 text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                                                        💡 1순위 추천 카피
                                                    </span>
                                                )}
                                                <p className={`italic font-medium ${isPrintMode ? 'text-gray-700' : 'text-white'}`}>"{msg}"</p>
                                            </div>
                                            
                                            {/* Tools are visible on screen, but hidden in PDF Page 4 capture. 
                                                If content is generated, it is captured separately by ResultsDashboard via .generated-export-target selector */}
                                            <div className="flex-1 hide-on-pdf">
                                                <AdImageGenerator adMessage={msg} topic={topic} />
                                            </div>
                                            
                                            <div className="flex-1 pt-4 border-t border-gray-600/30 hide-on-pdf">
                                                <ReelGenerator adMessage={msg} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};
