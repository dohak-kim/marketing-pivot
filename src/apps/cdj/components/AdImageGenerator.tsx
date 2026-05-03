
import React, { useState, useRef, useEffect } from 'react';
import { generateAdImage } from '../services/geminiService';
import type { AspectRatio, ImageTone } from '../types';
import { GenerateIcon } from './icons/GenerateIcon';
import { overlayText } from '@/lib/canvasTextOverlay';

const aspectRatios: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '정방형 (1:1)' },
  { value: '9:16', label: '세로형 (9:16)' },
];

const imageTones: { value: ImageTone; label: string }[] = [
  { value: '실사', label: '실사' },
  { value: '일러스트레이션', label: '일러스트' },
  { value: '애니메이션', label: '애니메이션' },
];

type TextPosition = 'top' | 'middle' | 'bottom';

const textPositions: { value: TextPosition; label: string }[] = [
  { value: 'top', label: '상단' },
  { value: 'middle', label: '중앙' },
  { value: 'bottom', label: '하단' },
];

// 5단계 폰트 크기 설정 (미리보기용 rem 단위)
const previewFontSizes = [
  { '1:1': '0.9rem', '9:16': '1.2rem' }, // Level 0
  { '1:1': '1.1rem', '9:16': '1.5rem' }, // Level 1
  { '1:1': '1.3rem', '9:16': '1.8rem' }, // Level 2
  { '1:1': '1.5rem', '9:16': '2.1rem' }, // Level 3
  { '1:1': '1.7rem', '9:16': '2.4rem' }, // Level 4
];

interface AdImageGeneratorProps {
  adMessage: string;
  topic?: string;
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

export const AdImageGenerator: React.FC<AdImageGeneratorProps> = ({ adMessage, topic }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editableAdMessage, setEditableAdMessage] = useState(adMessage);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [productPreviewUrl, setProductPreviewUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageTone, setImageTone] = useState<ImageTone>('실사');
  const [textPosition, setTextPosition] = useState<TextPosition>('middle');
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(2); // 5단계의 중간값으로 초기화
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewTextRef = useRef<HTMLParagraphElement>(null);

  // adMessage prop이 변경될 때 editableAdMessage 상태를 업데이트
  useEffect(() => {
    setEditableAdMessage(adMessage);
  }, [adMessage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'product') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'logo') {
        setLogoImage(file);
        setLogoPreviewUrl(URL.createObjectURL(file));
      } else {
        setProductImage(file);
        setProductPreviewUrl(URL.createObjectURL(file));
      }
      setGeneratedImageUrl(null);
    }
  };
  
  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const logoPayload = logoImage ? await fileToBase64(logoImage) : undefined;
      const productPayload = productImage ? await fileToBase64(productImage) : undefined;
      
      const generatedBase64 = await generateAdImage({
        logoImage: logoPayload,
        productImage: productPayload,
        adMessage: editableAdMessage,
        topic: topic,
        aspectRatio,
        tone: imageTone,
        textPosition,
        textColor,
      });
      // 배경 이미지 저장 (미리보기는 CSS 오버레이로 텍스트 표시 → 인터랙티브)
      const mimeHint = generatedBase64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
      setGeneratedImageUrl(`data:${mimeHint};base64,${generatedBase64}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    try {
      // 배경 이미지에 한글 텍스트를 Canvas로 합성 → 다운로드
      const withText = await overlayText(generatedImageUrl, {
        text:     editableAdMessage,
        position: textPosition,
        color:    textColor,
      });
      const link = document.createElement('a');
      link.download = `cdj-ad-image-${Date.now()}.png`;
      link.href = withText;
      link.click();
    } catch {
      // fallback: 배경만 다운로드
      const link = document.createElement('a');
      link.download = `cdj-ad-image-${Date.now()}.png`;
      link.href = generatedImageUrl;
      link.click();
    }
  };

  const handleReset = () => {
    setIsFormVisible(false);
    setGeneratedImageUrl(null);
    setLogoImage(null);
    setProductImage(null);
    setLogoPreviewUrl(null);
    setProductPreviewUrl(null);
    setError(null);
  };

  const positionClasses: Record<TextPosition, string> = { top: 'items-start pt-8', middle: 'items-center', bottom: 'items-end pb-8' };

  // Generate button is enabled if not loading AND adMessage is not empty
  const isGenerateButtonEnabled = !isLoading && editableAdMessage.trim().length > 0;

  return (
    <div className="mt-2">
      {!isFormVisible && (
        <button
          onClick={() => setIsFormVisible(true)}
          className="w-full px-4 py-3 bg-brand-gold text-brand-dark font-bold rounded-md hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
        >
          <GenerateIcon className="w-5 h-5" />
          AI SNS 광고 이미지 만들기
        </button>
      )}

      {isFormVisible && (
        <div className="p-4 bg-black/30 rounded-lg border border-gray-700 space-y-4">
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-base font-bold text-white">SNS 광고 이미지 생성 설정</h3>
             <button onClick={handleReset} className="text-xs text-gray-400 hover:text-white underline">이전 (닫기)</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-4">
              {/* Controls */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">1. 이미지 업로드 (선택 사항)</label>
                <div className="grid grid-cols-2 gap-2">
                    {/* Logo Upload */}
                    <div className="text-center p-2 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-brand-gold" onClick={() => logoFileInputRef.current?.click()}>
                        <span className="text-xs text-gray-400">로고 이미지 (선택)</span>
                        {logoPreviewUrl ? <img src={logoPreviewUrl} alt="Logo Preview" className="mx-auto mt-2 h-14 w-14 object-contain" /> : <svg className="mx-auto mt-2 h-10 w-10 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        <p className="text-xs text-gray-500 mt-1 truncate">{logoImage ? logoImage.name : '클릭'}</p>
                        <input ref={logoFileInputRef} type="file" className="sr-only" onChange={(e) => handleImageUpload(e, 'logo')} accept="image/png, image/jpeg, image/webp" />
                    </div>
                    {/* Product Upload */}
                    <div className="text-center p-2 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-brand-gold" onClick={() => productFileInputRef.current?.click()}>
                        <span className="text-xs text-gray-400">제품 이미지 (선택)</span>
                        {productPreviewUrl ? <img src={productPreviewUrl} alt="Product Preview" className="mx-auto mt-2 h-14 w-14 object-contain" /> : <svg className="mx-auto mt-2 h-10 w-10 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        <p className="text-xs text-gray-500 mt-1 truncate">{productImage ? productImage.name : '클릭'}</p>
                        <input ref={productFileInputRef} type="file" className="sr-only" onChange={(e) => handleImageUpload(e, 'product')} accept="image/png, image/jpeg, image/webp" />
                    </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">* 이미지를 업로드하지 않으면 AI가 주제와 카피를 분석해 자동으로 생성합니다.</p>
              </div>
              <div>
                <label htmlFor="ad-copy" className="block text-sm font-medium text-gray-300 mb-2">2. 광고 카피 수정</label>
                <textarea
                  id="ad-copy"
                  value={editableAdMessage}
                  onChange={(e) => setEditableAdMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-gold transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">3. 이미지 비율</label>
                <div className="flex gap-2">{aspectRatios.map(r => <button key={r.value} onClick={() => setAspectRatio(r.value)} className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${aspectRatio === r.value ? 'bg-brand-gold text-brand-dark' : 'bg-gray-700 hover:bg-gray-600'}`}>{r.label}</button>)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">4. 이미지 톤앤매너</label>
                <div className="flex gap-2">{imageTones.map(t => <button key={t.value} onClick={() => setImageTone(t.value)} className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${imageTone === t.value ? 'bg-brand-gold text-brand-dark' : 'bg-gray-700 hover:bg-gray-600'}`}>{t.label}</button>)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">5. 텍스트 위치</label>
                <div className="flex gap-2">{textPositions.map(p => <button key={p.value} onClick={() => setTextPosition(p.value)} className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${textPosition === p.value ? 'bg-brand-gold text-brand-dark' : 'bg-gray-700 hover:bg-gray-600'}`}>{p.label}</button>)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">6. 텍스트 크기</label>
                <input type="range" min="0" max="4" step="1" value={fontSizeLevel} onChange={e => setFontSizeLevel(parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-gold" disabled={isLoading} />
                <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">7. 텍스트 색상</label>
                <div className="flex items-center gap-3 bg-gray-700 p-2 rounded-md">
                   <div className="relative">
                     <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-10 p-0 border-none cursor-pointer bg-transparent"
                        style={{'WebkitAppearance': 'none', 'MozAppearance': 'none', 'appearance': 'none'}}
                        aria-label="텍스트 색상 선택"
                     />
                     <div className="absolute inset-0 w-10 h-10 rounded-md pointer-events-none border border-gray-500" style={{backgroundColor: textColor}}></div>
                   </div>
                   <input
                     type="text"
                     value={textColor.toUpperCase()}
                     onChange={(e) => setTextColor(e.target.value)}
                     className="w-full px-3 py-1 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono"
                   />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center bg-gray-900 rounded-md h-full min-h-[300px] p-2">
              {isLoading ? (
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-brand-gold mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="mt-2 text-sm text-gray-400">이미지 생성 중...</p>
                </div>
              ) : generatedImageUrl ? (
                <div className="w-full flex flex-col items-center">
                    {/* The generated-export-target class allows the parent PDF generator to capture this element */}
                    <div ref={previewContainerRef} className="generated-export-target relative w-full bg-gray-800 rounded-md overflow-hidden" style={{ aspectRatio: aspectRatio.replace(':', '/') }}>
                        <img src={generatedImageUrl} alt="AI가 생성한 광고 배경" className="absolute inset-0 w-full h-full object-cover" />
                        <div className={`absolute inset-0 flex justify-center p-6 bg-black/20 ${positionClasses[textPosition]}`}>
                            <p ref={previewTextRef} className="font-bold text-center leading-tight" style={{ fontSize: previewFontSizes[fontSizeLevel][aspectRatio], textShadow: '0px 2px 6px rgba(0,0,0,0.8)', color: textColor }}>{editableAdMessage}</p>
                        </div>
                    </div>
                    <button onClick={handleDownload} className="mt-3 px-4 py-2 bg-brand-gold text-brand-dark font-semibold rounded-md hover:bg-amber-400 transition-colors text-sm">합성된 이미지 다운로드</button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center">옵션을 선택하고 생성 버튼을 누르면 여기에 결과 이미지가 표시됩니다.</p>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-brand-negative text-center">{error}</p>}
          <div className="flex gap-2">
             <button onClick={handleReset} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm">이전</button>
             <button onClick={handleGenerate} disabled={!isGenerateButtonEnabled} className="flex-1 px-6 py-2 bg-brand-gold text-brand-dark font-bold rounded-md hover:bg-amber-400 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">{isLoading ? '생성 중...' : '생성하기'}</button>
          </div>
        </div>
      )}
    </div>
  );
};
