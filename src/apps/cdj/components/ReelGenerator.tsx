
import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateReelStoryboards, generateVeoVideo, generateSceneImage } from '../services/geminiService';
import type { ReelStoryboard, GeneratedVideo, StoryboardAsset, AssetType } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { GenerateIcon } from './icons/GenerateIcon';

interface ReelGeneratorProps {
  adMessage: string;
}

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        const mimeType = result.split(';')[0].split(':')[1];
        resolve({ base64, mimeType });
      };
      reader.onerror = (error) => reject(error);
    });
  };

export const ReelGenerator: React.FC<ReelGeneratorProps> = ({ adMessage }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [storyboards, setStoryboards] = useState<ReelStoryboard[]>([]);
  const [selectedStoryboard, setSelectedStoryboard] = useState<ReelStoryboard | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [isPrintMode, setIsPrintMode] = useState(false);
  const storyboardRef = useRef<HTMLDivElement>(null);

  // Asset Upload State
  const [assets, setAssets] = useState<StoryboardAsset[]>([]);
  
  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: AssetType) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
          const { base64, mimeType } = await fileToBase64(file);
          const newAsset: StoryboardAsset = {
            type,
            file,
            previewUrl: URL.createObjectURL(file),
            base64,
            mimeType
          };
          setAssets(prev => {
              // Replace existing asset of same type or add new
              const filtered = prev.filter(a => a.type !== type);
              return [...filtered, newAsset];
          });
      } catch (err) {
          console.error("File processing failed", err);
          setError("이미지 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const getAssetPreview = (type: AssetType) => assets.find(a => a.type === type)?.previewUrl;

  const handleGenerateStoryboards = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await generateReelStoryboards(adMessage);
      setStoryboards(results);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "스토리보드 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStoryboard = (sb: ReelStoryboard) => {
    setSelectedStoryboard(sb);
    setStep(2);
  };

  const handleGenerateImages = async () => {
    if (!selectedStoryboard) return;
    
    setImageGenerating(true);
    setError(null);

    try {
        const updatedScenes = await Promise.all(selectedStoryboard.scenes.map(async (scene) => {
            // 로고 노출 전략 적용:
            // 로고 자산은 첫 번째 씬(도입부)이나 마지막 씬(엔딩/CTA)에만 노출하여 과도한 브랜딩을 방지합니다.
            // 여기서는 가장 일반적인 '마지막 씬(Scene 3)에 로고 배치' 전략을 기본으로 적용합니다.
            const sceneAssets = assets.filter(asset => {
                if (asset.type === 'logo') {
                    return scene.sceneNumber === 3;
                }
                return true;
            });

            const img1 = await generateSceneImage(scene.visualDescription + " (Initial frame)", sceneAssets);
            const img2 = await generateSceneImage(scene.visualDescription + " (Action phase)", sceneAssets);
            
            return {
                ...scene,
                storyboardImages: [
                `data:image/png;base64,${img1}`,
                `data:image/png;base64,${img2}`
                ]
            };
        }));

        setSelectedStoryboard(prev => prev ? ({ ...prev, scenes: updatedScenes }) : null);

    } catch (e) {
        console.error("콘티 이미지 생성 실패", e);
        setError("이미지 생성 중 오류가 발생했습니다.");
    } finally {
        setImageGenerating(false);
    }
  };


  const handleCreateVideos = async () => {
    if (!selectedStoryboard) return;

    if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            try {
                await window.aistudio.openSelectKey();
            } catch (e) {
                console.error("API Key selection failed", e);
                setError("API 키 선택이 필요합니다.");
                return;
            }
        }
    }

    setLoading(true);
    setError(null);
    setGeneratedVideos([]);
    
    try {
      const results: GeneratedVideo[] = [];
      for (const scene of selectedStoryboard.scenes) {
        setProgress(`Scene ${scene.sceneNumber} 영상 생성 중... (Veo 모델 사용, 약 1분 소요)`);
        const videoUrl = await generateVeoVideo(scene.veoPrompt);
        results.push({ sceneNumber: scene.sceneNumber, videoUrl });
      }
      setGeneratedVideos(results);
      setStep(3);
    } catch (err) {
      setError("영상 생성 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 유효한 API 키인지 확인해주세요.");
      console.error(err);
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const handleDownloadPDF = async () => {
    if (!storyboardRef.current) return;
    
    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        const maxContentHeight = pageHeight - (margin * 2);
        
        const canvas = await html2canvas(storyboardRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: isPrintMode ? '#ffffff' : '#0F172A',
        });

        const imgData = canvas.toDataURL('image/png');
        const contentWidth = pageWidth - (margin * 2);
        let imgHeight = (canvas.height * contentWidth) / canvas.width;
        let imgWidth = contentWidth;
        
        // Fit to Page Logic: 1페이지 높이를 초과하면 비율 유지하며 축소
        if (imgHeight > maxContentHeight) {
            const ratio = maxContentHeight / imgHeight;
            imgHeight = maxContentHeight;
            imgWidth = imgWidth * ratio;
        }

        // 중앙 정렬을 위한 X 좌표 계산
        const x = margin + (contentWidth - imgWidth) / 2;
        
        pdf.addImage(imgData, 'PNG', x, margin, imgWidth, imgHeight);
        pdf.save(`Reels_Storyboard_${selectedStoryboard?.id || 'SB'}.pdf`);

    } catch (e) {
        console.error("PDF 다운로드 실패", e);
        alert("PDF 생성 중 오류가 발생했습니다.");
    }
  };

  if (storyboards.length === 0 && !loading) {
    return (
      <button 
        onClick={handleGenerateStoryboards}
        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-md hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        AI 릴스 기획
      </button>
    );
  }

  if (loading) {
     return (
        <div className="mt-2 p-6 bg-gray-800 rounded-lg text-center border border-gray-700">
            <svg className="animate-spin h-8 w-8 text-brand-gold mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-gray-300 font-medium">{step === 3 ? progress : "AI가 기획 중..."}</p>
        </div>
     )
  }

  const containerClass = isPrintMode ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-800 text-white border-gray-700';
  const headerText = isPrintMode ? 'text-gray-800' : 'text-white';
  const subText = isPrintMode ? 'text-gray-600' : 'text-gray-400';
  const accentText = isPrintMode ? 'text-purple-600' : 'text-brand-gold';
  const sceneBorder = isPrintMode ? 'border-gray-300' : 'border-gray-600';
  const sceneBg = isPrintMode ? 'bg-gray-50' : 'bg-gray-900/50';

  const AssetInput = ({ type, label }: { type: AssetType, label: string }) => (
      <label className={`flex flex-col items-center justify-center p-2 border border-dashed rounded cursor-pointer transition-colors ${isPrintMode ? 'border-gray-400 hover:bg-gray-50' : 'border-gray-600 hover:bg-gray-700/50'}`}>
          {getAssetPreview(type) ? (
              <img src={getAssetPreview(type)} alt={label} className="h-8 w-8 object-cover rounded mb-1" />
          ) : (
              <div className="h-8 w-8 bg-gray-700/50 rounded flex items-center justify-center mb-1">
                 <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
          )}
          <span className={`text-[9px] ${subText}`}>{label}</span>
          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAssetUpload(e, type)} />
      </label>
  );

  return (
    <div className={`mt-2 border rounded p-4 transition-colors ${isPrintMode && step === 2 ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400`}>
          AI Shorts/Reels Studio
        </h3>
        <button onClick={() => { setStoryboards([]); setStep(1); setSelectedStoryboard(null); setGeneratedVideos([]); setIsPrintMode(false); setAssets([]); }} className="text-xs text-gray-400 hover:text-white underline">닫기</button>
      </div>

      {step === 1 && (
        <div className="space-y-3">
            <p className="text-gray-300 text-sm">컨셉 선택</p>
            <div className="grid grid-cols-1 gap-3">
                {storyboards.map((sb) => (
                    <div key={sb.id} className="bg-gray-800 p-4 rounded border border-gray-600 hover:border-brand-gold cursor-pointer transition-colors" onClick={() => handleSelectStoryboard(sb)}>
                        <div className="flex justify-between items-start mb-1">
                            <span className="bg-brand-gold text-brand-dark text-xs px-2 py-0.5 rounded font-bold">{sb.concept}</span>
                        </div>
                        <h4 className="text-base font-bold text-white mb-2">{sb.title}</h4>
                        <div className="space-y-1">
                            {sb.scenes.map((scene) => (
                                <div key={scene.sceneNumber} className="text-xs text-gray-400 flex gap-2">
                                    <span className="text-brand-gold font-mono whitespace-nowrap">S{scene.sceneNumber}:</span>
                                    <span className="line-clamp-1">{scene.visualDescription}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {step === 2 && selectedStoryboard && (
        <div className="space-y-4">
             <div className="bg-gray-700/30 p-2 rounded space-y-2">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsPrintMode(!isPrintMode)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isPrintMode ? 'bg-purple-500' : 'bg-gray-600'}`}
                        >
                            <span className={`${isPrintMode ? 'translate-x-4' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                        </button>
                        <span className={`text-xs ${isPrintMode ? 'text-purple-600' : 'text-gray-500'}`}>Light</span>
                    </div>
                    <button onClick={handleDownloadPDF} className="flex items-center gap-1 text-xs text-white bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded">
                        <DownloadIcon className="w-3.5 h-3.5" /> PDF (1 Page)
                    </button>
                 </div>
                 
                 <div className={`p-2 rounded border ${isPrintMode ? 'bg-gray-50 border-gray-200' : 'bg-black/20 border-gray-600'}`}>
                    <p className={`text-[10px] font-bold mb-1 ${isPrintMode ? 'text-gray-700' : 'text-gray-300'}`}>
                        자산 업로드 (AI 반영)
                    </p>
                    <div className="grid grid-cols-5 gap-1">
                        <AssetInput type="logo" label="로고" />
                        <AssetInput type="product" label="제품" />
                        <AssetInput type="model" label="모델" />
                        <AssetInput type="store" label="매장" />
                        <AssetInput type="background" label="배경" />
                    </div>
                 </div>
             </div>

            {/* The generated-export-target class allows the parent PDF generator to capture this element */}
            <div ref={storyboardRef} className={`generated-export-target p-3 rounded border ${containerClass}`}>
                <div className="border-b pb-2 mb-2 border-gray-500/30">
                    <h4 className={`text-lg font-bold ${headerText}`}>{selectedStoryboard.title}</h4>
                    <p className={`text-xs ${subText}`}>Concept: {selectedStoryboard.concept} | Duration: 15s</p>
                </div>

                <div className="space-y-2">
                    {selectedStoryboard.scenes.map(scene => (
                        <div key={scene.sceneNumber} className={`border rounded p-2 ${sceneBorder} ${sceneBg}`}>
                            <div className="flex justify-between items-start mb-1">
                                <h5 className={`font-bold text-sm ${accentText}`}>Scene {scene.sceneNumber}</h5>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded bg-black/10 ${subText}`}>5s</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div className="md:col-span-1 space-y-1">
                                    <div>
                                        <p className={`text-[9px] font-bold uppercase ${subText}`}>Visual</p>
                                        <p className={`text-[11px] leading-tight ${headerText}`}>{scene.visualDescription}</p>
                                    </div>
                                    <div>
                                        <p className={`text-[9px] font-bold uppercase ${subText}`}>Audio</p>
                                        <p className={`text-[11px] italic p-1 rounded bg-black/5 leading-tight ${headerText}`}>"{scene.audioScript}"</p>
                                    </div>
                                </div>
                                
                                <div className="md:col-span-2 grid grid-cols-2 gap-2">
                                    {scene.storyboardImages ? (
                                        scene.storyboardImages.map((img, idx) => (
                                            <div key={idx} className="relative aspect-[9/16] bg-gray-200 rounded overflow-hidden shadow-sm">
                                                <img src={img} alt={`Cut ${idx+1}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className={`aspect-[9/16] rounded flex items-center justify-center border-2 border-dashed ${isPrintMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-600'}`}>
                                                <span className={`text-[9px] ${subText}`}>No Image</span>
                                            </div>
                                            <div className={`aspect-[9/16] rounded flex items-center justify-center border-2 border-dashed ${isPrintMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/50 border-gray-600'}`}>
                                                <span className={`text-[9px] ${subText}`}>No Image</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex gap-2 text-sm">
                <button onClick={() => setStep(1)} className="px-3 py-3 bg-gray-700 text-white rounded hover:bg-gray-600">이전</button>
                <button 
                    onClick={handleGenerateImages} 
                    disabled={imageGenerating} 
                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                    <GenerateIcon className="w-4 h-4" />
                    {selectedStoryboard.scenes[0].storyboardImages ? '재생성' : '콘티 생성(AI)'}
                </button>
                <button 
                    onClick={handleCreateVideos} 
                    disabled={imageGenerating} 
                    className="flex-1 py-3 bg-brand-gold text-brand-dark font-bold rounded hover:bg-amber-400 disabled:opacity-50"
                >
                    영상 생성(Veo)
                </button>
            </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
            <h4 className="text-base font-bold text-white text-center">영상 생성 완료</h4>
            <div className="grid grid-cols-1 gap-4">
                {generatedVideos.map((video) => (
                    <div key={video.sceneNumber} className="space-y-1">
                        <div className="flex justify-between items-end">
                            <span className="text-brand-gold text-xs font-bold">Scene {video.sceneNumber}</span>
                            <a href={video.videoUrl} download={`scene-${video.sceneNumber}.mp4`} className="text-[10px] text-blue-300 hover:text-blue-200 underline">다운로드</a>
                        </div>
                        <video src={video.videoUrl} controls className="w-full rounded aspect-[9/16] bg-black" />
                    </div>
                ))}
            </div>
             <button onClick={() => { setStep(1); setStoryboards([]); setSelectedStoryboard(null); setGeneratedVideos([]); setAssets([]); }} className="w-full py-3 text-sm bg-gray-700 text-white rounded hover:bg-gray-600">처음부터 다시</button>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-brand-negative/20 text-brand-negative text-xs rounded text-center">
            {error}
        </div>
      )}
    </div>
  );
};
