import React, { useState, useEffect } from 'react';
import type { 
  AeoContent, 
  BlogAeoContent, 
  LinkedInAeoContent, 
  ImageStyleConfig, 
  ImageType, 
  ImageTone, 
  ImageColor 
} from '../types';
import { generateSectionImage } from '../services/geminiService';

interface AeoDisplayProps {
  content: AeoContent;
  onRewrite: (content: AeoContent) => void;
  isRewriting: boolean;
  isLightMode?: boolean;
  query?: string;
  aeoScore?: number;
}

const AeoDisplay: React.FC<AeoDisplayProps> = ({ content, onRewrite, isRewriting, isLightMode, query, aeoScore }) => {
  const [editableContent, setEditableContent] = useState(content);
  const [copyStatus, setCopyStatus] = useState('Copy');
  const [isPrintDarkMode, setIsPrintDarkMode] = useState(false);
  const [imageConfig, setImageConfig] = useState<ImageStyleConfig>({
    type: 'Illustration',
    tone: 'Professional',
    color: 'Vibrant'
  });
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setEditableContent(content);
  }, [content]);
  
  const handleCopyToClipboard = () => {
    let textToCopy = '';
    if (editableContent.format === 'blog') {
      const blogContent = editableContent as BlogAeoContent;
      textToCopy = `
# ${blogContent.title}

**Introduction:**
${blogContent.introduction}

${blogContent.sections.map(sec => `## ${sec.heading}\n${sec.body}`).join('\n\n')}

**Conclusion:**
${blogContent.conclusion}
      `.trim();
    } else {
      const linkedinContent = editableContent as LinkedInAeoContent;
      textToCopy = `
${linkedinContent.hook}

${linkedinContent.body}

${linkedinContent.hashtags}
      `.trim();
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy'), 2000);
    });
  };

  const handleRewrite = () => {
      onRewrite(editableContent);
  }

  const handlePrintSection = () => {
    window.print();
  };

  const handleGenerateImage = async (index: number) => {
    if (editableContent.format !== 'blog') return;
    const blogContent = editableContent as BlogAeoContent;
    const section = blogContent.sections[index];
    
    setGeneratingImages(prev => ({ ...prev, [index]: true }));
    try {
      const imageUrl = await generateSectionImage(section.heading, section.body, imageConfig);
      const newSections = [...blogContent.sections];
      newSections[index] = { ...newSections[index], imageUrl };
      // FIX: Spread editableContent instead of blogContent to ensure targetClusterName is preserved in the AeoContent type
      setEditableContent({ ...editableContent, sections: newSections } as AeoContent);
    } catch (e) {
      alert(e instanceof Error ? e.message : '이미지 생성 실패');
    } finally {
      setGeneratingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const renderBlogEditor = (blogContent: BlogAeoContent) => {
    const handleBlogChange = (field: keyof BlogAeoContent, value: any) => {
        setEditableContent(prev => ({ ...prev, [field]: value }) as AeoContent);
    };
    const handleSectionChange = (index: number, field: 'heading' | 'body', value: string) => {
        const newSections = [...blogContent.sections];
        newSections[index][field as any] = value;
        handleBlogChange('sections', newSections);
    };

    return (
        <div className="aeo-print-target">
            {/* 비주얼 옵션 패널 (인쇄 제외) */}
            <section className={`mb-10 p-6 rounded-3xl border-2 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-indigo-500/20'} print:hidden relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-2">
                 <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-black uppercase animate-pulse">High-Quality Mode</span>
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Visual Style Configuration (AI Image Module)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Image Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Infographic', 'Cartoon', 'Illustration', 'Photography'].map(t => (
                      <button
                        key={t}
                        onClick={() => setImageConfig(prev => ({ ...prev, type: t as ImageType }))}
                        className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${imageConfig.type === t ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : isLightMode ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Tone & Manner</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Professional', 'Friendly', 'Futuristic', 'Minimalist'].map(t => (
                      <button
                        key={t}
                        onClick={() => setImageConfig(prev => ({ ...prev, tone: t as ImageTone }))}
                        className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${imageConfig.tone === t ? 'bg-sky-600 border-sky-500 text-white shadow-lg' : isLightMode ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Color Palette</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Vibrant', 'Pastel', 'Monochrome', 'Warm', 'Cool'].map(t => (
                      <button
                        key={t}
                        onClick={() => setImageConfig(prev => ({ ...prev, color: t as ImageColor }))}
                        className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${imageConfig.color === t ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : isLightMode ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-indigo-500/10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-[10px] font-medium text-slate-500 italic">가독성 최적화를 위해 이미지 내 텍스트(레이블)는 영문으로 생성됩니다.</p>
              </div>
            </section>

            <section className="mb-8 print:mb-12">
                <label className={`text-lg font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-300'} block mb-2 print:hidden`}>블로그 제목</label>
                <textarea 
                    value={blogContent.title} 
                    onChange={(e) => handleBlogChange('title', e.target.value)} 
                    className={`w-full ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/70 border-slate-600 text-slate-100'} border rounded-xl p-4 font-black text-xl focus:ring-2 focus:ring-indigo-500 print:hidden`} 
                    rows={2}
                />
                <h1 className="hidden print:block text-4xl font-black text-indigo-700 mb-8 text-center leading-tight">
                    {blogContent.title}
                </h1>
            </section>
            
            <section className="mb-10 print:mb-16">
                <div className="flex items-center gap-2 mb-2 print:hidden">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    <label className={`text-sm font-black uppercase tracking-widest ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>도입부 (AEO Snippet)</label>
                </div>
                <textarea 
                    value={blogContent.introduction} 
                    onChange={(e) => handleBlogChange('introduction', e.target.value)} 
                    className={`w-full ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/70 border-slate-600 text-slate-300'} border rounded-xl p-5 text-slate-300 leading-relaxed focus:ring-2 focus:ring-indigo-500 print:hidden`} 
                    rows={4}
                />
                <div className="hidden print:block bg-slate-50 p-8 rounded-[2rem] border border-indigo-200/50 italic text-slate-800 leading-relaxed text-lg shadow-sm">
                    {blogContent.introduction}
                </div>
            </section>

            {blogContent.sections.map((section, i) => (
                <section key={i} className="mb-14 print:mb-20 print:page-break-inside-avoid">
                    <div className="flex justify-between items-center mb-4 print:hidden">
                        <div className="space-y-2 flex-grow mr-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Section #{i+1} Heading</label>
                            <input 
                                type="text" 
                                value={section.heading} 
                                onChange={(e) => handleSectionChange(i, 'heading', e.target.value)} 
                                className={`w-full ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/70 border-slate-600 text-slate-100'} border rounded-xl p-3 font-black focus:ring-2 focus:ring-indigo-500`} 
                            />
                        </div>
                        <button
                          onClick={() => handleGenerateImage(i)}
                          disabled={generatingImages[i]}
                          className={`px-4 py-3 rounded-xl font-black text-[11px] uppercase transition-all flex items-center gap-2 shadow-lg ${generatingImages[i] ? 'bg-slate-700 text-slate-400' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 active:scale-95'}`}
                        >
                          {generatingImages[i] ? (
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          )}
                          {generatingImages[i] ? '생성 중...' : '이미지 생성'}
                        </button>
                    </div>

                    <h3 className="hidden print:block border-l-[10px] border-indigo-600 pl-6 py-2 font-black text-2xl mb-6 text-slate-900 leading-tight">
                        {section.heading}
                    </h3>

                    {section.imageUrl && (
                      <div className="mb-8 rounded-[2.5rem] overflow-hidden border-4 border-slate-700/10 shadow-2xl print:shadow-none print:border-none print:rounded-3xl">
                        <img src={section.imageUrl} alt={section.heading} className="w-full h-auto object-cover max-h-[500px]" />
                      </div>
                    )}

                    <textarea 
                        value={section.body} 
                        onChange={(e) => handleSectionChange(i, 'body', e.target.value)} 
                        className={`w-full ${isLightMode ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/70 border-slate-600 text-slate-300'} border rounded-xl p-5 leading-relaxed focus:ring-2 focus:ring-indigo-500 print:hidden`} 
                        rows={6}
                    />
                    <div className="hidden print:block text-slate-800 leading-relaxed whitespace-pre-wrap text-lg pl-2">
                        {section.body}
                    </div>
                </section>
            ))}

            <section className="mt-16 pt-10 border-t-2 border-slate-200/50 print:border-indigo-100 print:mt-20 print:page-break-inside-avoid">
                <label className={`text-lg font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-300'} block mb-2 print:hidden`}>맺음말 (Conclusion)</label>
                <textarea 
                    value={blogContent.conclusion} 
                    onChange={(e) => handleBlogChange('conclusion', e.target.value)} 
                    className={`w-full ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/70 border-slate-600 text-slate-300'} border rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 print:hidden`} 
                    rows={3}
                />
                <div className="hidden print:block font-black text-xl text-slate-900 bg-indigo-50/50 p-8 rounded-[2.5rem] border-2 border-indigo-100">
                    <span className="text-indigo-600 mr-3 opacity-50 uppercase tracking-tighter">Summary</span> {blogContent.conclusion}
                </div>
            </section>
        </div>
    )
  }

  const renderLinkedInEditor = (linkedinContent: LinkedInAeoContent) => {
    const handleLinkedInChange = (field: keyof LinkedInAeoContent, value: string) => {
        setEditableContent(prev => ({ ...prev, [field]: value }) as AeoContent);
    };
    return (
        <div className="aeo-print-target max-w-2xl mx-auto">
            <section className="mb-8 print:mb-12">
                <label className={`text-sm font-black uppercase tracking-widest ${isLightMode ? 'text-slate-500' : 'text-slate-400'} mb-2 block print:hidden`}>AI-First Hook (첫 문장)</label>
                <textarea 
                    value={linkedinContent.hook} 
                    onChange={(e) => handleLinkedInChange('hook', e.target.value)} 
                    className={`w-full ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/70 border-slate-600 text-slate-100'} border rounded-xl p-4 font-black text-xl leading-snug focus:ring-2 focus:ring-indigo-500 print:hidden`} 
                    rows={2}
                />
                <div className="hidden print:block text-2xl font-black text-indigo-700 leading-tight mb-10 border-l-[12px] border-indigo-600 pl-8 py-4 bg-slate-50 rounded-r-3xl">
                    {linkedinContent.hook}
                </div>
            </section>
            
            <section className="mb-10 print:mb-16">
                <label className={`text-sm font-black uppercase tracking-widest ${isLightMode ? 'text-slate-500' : 'text-slate-400'} mb-2 block print:hidden`}>LinkedIn Body (Valuable Insight)</label>
                <textarea 
                    value={linkedinContent.body} 
                    onChange={(e) => handleLinkedInChange('body', e.target.value)} 
                    className={`w-full ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/70 border-slate-600 text-slate-300'} border rounded-xl p-5 text-slate-300 leading-relaxed focus:ring-2 focus:ring-indigo-500 print:hidden`} 
                    rows={10}
                />
                <div className="hidden print:block text-xl leading-relaxed text-slate-800 whitespace-pre-wrap px-4">
                    {linkedinContent.body}
                </div>
            </section>

             <section className="mt-8 print:mt-12">
                <label className={`text-sm font-black uppercase tracking-widest ${isLightMode ? 'text-slate-500' : 'text-slate-400'} mb-2 block print:hidden`}>Hashtags</label>
                <input 
                    type="text" 
                    value={linkedinContent.hashtags} 
                    onChange={(e) => handleLinkedInChange('hashtags', e.target.value)} 
                    className={`w-full ${isLightMode ? 'bg-white border-slate-200 text-indigo-600' : 'bg-slate-900/70 border-slate-600 text-indigo-400'} border rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 print:hidden`}
                />
                <div className="hidden print:block text-indigo-600 font-black mt-10 text-lg italic border-t border-slate-100 pt-6">
                    {linkedinContent.hashtags}
                </div>
            </section>
        </div>
    )
  }


  return (
    <div className={`${isLightMode ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-800/50 border-slate-700 shadow-2xl'} border rounded-[2rem] animate-fade-in print:shadow-none print:border-none print:bg-transparent ${isPrintDarkMode ? 'print:is-dark' : 'print:is-light'}`}>
        <header className="p-8 sm:p-10 border-b border-indigo-500/20 flex justify-between items-center flex-wrap gap-4 print:p-0 print:border-none print:mb-16">
            <div className="print:w-full">
                <div className="flex items-center gap-2 mb-1 print:hidden">
                    <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">AEO Strategy</span>
                    <p className={`text-xs font-bold ${isLightMode ? 'text-indigo-600' : 'text-indigo-400'}`}>
                        {content.format === 'blog' ? 'Blog' : 'LinkedIn'} Optimization Output
                    </p>
                </div>
                <h2 className={`text-3xl sm:text-4xl font-black ${isLightMode ? 'text-slate-900' : 'text-slate-100'} print:text-black print:text-3xl print:border-b-4 print:border-indigo-600 print:pb-4`}>
                    Target Insight: {content.targetClusterName}
                </h2>
                <p className="hidden print:block text-slate-400 text-xs mt-2 uppercase font-black tracking-widest">AEO Intelligence Content Report</p>
            </div>

            {/* 인쇄 스타일 제어 패널 (화면용) */}
            <div className="flex items-center gap-3 print:hidden">
                <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-700'}`}>
                    <span className="text-[9px] font-black uppercase text-slate-500 ml-2">Print Style</span>
                    <button 
                        onClick={() => setIsPrintDarkMode(false)}
                        className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${!isPrintDarkMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        WHITE
                    </button>
                    <button 
                        onClick={() => setIsPrintDarkMode(true)}
                        className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${isPrintDarkMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                    >
                        DARK
                    </button>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={handlePrintSection}
                        className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        PDF 저장 / 인쇄
                    </button>
                    <button
                        onClick={handleRewrite}
                        disabled={isRewriting}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl disabled:bg-slate-700 transition-all shadow-lg"
                    >
                         {isRewriting ? '재구성 중...' : 'AI 재작성'}
                    </button>
                    <button 
                        onClick={handleCopyToClipboard}
                        className={`px-5 py-2.5 ${isLightMode ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-200'} font-black text-xs rounded-xl hover:bg-slate-600 hover:text-white transition-all`}
                    >
                        {copyStatus}
                    </button>
                </div>
            </div>
        </header>

      <article className="p-8 sm:p-10 space-y-6 print:p-0">
        {editableContent.format === 'blog' 
            ? renderBlogEditor(editableContent as BlogAeoContent)
            : renderLinkedInEditor(editableContent as LinkedInAeoContent)
        }
      </article>

      {/* 인쇄 시 하단 정보 */}
      <footer className="hidden print:block mt-20 border-t border-slate-100 pt-8 text-center">
          <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em]">Generated by CEP Trend Analyzer AEO Module</p>
      </footer>

      <style>{`
        @media print {
            .print\\:is-dark { 
                background: #0f172a !important; 
                color: #f1f5f9 !important; 
                -webkit-print-color-adjust: exact;
            }
            .print\\:is-dark h1, .print\\:is-dark h2, .print\\:is-dark h3 { color: #818cf8 !important; }
            .print\\:is-dark .text-slate-800 { color: #cbd5e1 !important; }
            .print\\:is-dark .bg-slate-50 { background: #1e293b !important; border-color: #334155 !important; }
            .print\\:is-dark .bg-indigo-50 { background: #312e81 !important; border-color: #4338ca !important; }
            .print\\:is-dark .text-slate-900 { color: #f8fafc !important; }

            .print\\:is-light {
                background: white !important;
                color: black !important;
            }
            
            body { 
                margin: 0 !important; 
                padding: 0 !important;
            }
            
            .aeo-print-target {
                width: 100% !important;
                padding: 0 !important;
            }

            @page {
                margin: 20mm;
                size: A4;
            }

            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
      `}</style>
    </div>
  );
};

export default AeoDisplay;