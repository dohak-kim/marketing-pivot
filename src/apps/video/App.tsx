import React, { useState, useRef } from 'react';
import AppHeader from '@/shared/components/AppHeader';
import { UploadCloud, Video, AlertCircle, Loader2, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Radar, Doughnut } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ArcElement);

function resolveApiKey(): string {
  const sources = [
    () => process.env.GEMINI_API_KEY,
    () => process.env.API_KEY,
    () => (import.meta as any)?.env?.VITE_API_KEY,
  ];
  for (const get of sources) {
    try { const v = get(); if (v && v !== 'undefined') return v.trim(); } catch {}
  }
  return '';
}

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const textCenterPlugin = {
  id: 'textCenter',
  beforeDraw: function(chart: any) {
    if (chart.config.type !== 'doughnut') return;
    const { width, height, ctx } = chart;
    ctx.restore();
    ctx.font = `bold ${(height / 4).toFixed(2)}px 'Noto Sans KR'`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a237e';
    const text = chart.config.data.datasets[0].data[0] + '점';
    ctx.fillText(text, Math.round((width - ctx.measureText(text).width) / 2), height / 2);
    ctx.save();
  },
};

const PLATFORMS = [
  'YouTube Shorts (Under 60s)',
  'Instagram Reels (Under 60s)',
  'TikTok (Under 60s)',
  'YouTube Long-form (Over 5m)',
  'Video Ads (15s/30s)',
];

const PLATFORM_WEIGHTS: Record<string, { ocr: number; stt: number; context: number; metadata: number }> = {
  'YouTube Long-form (Over 5m)':    { ocr: 15, stt: 35, context: 20, metadata: 30 },
  'YouTube Shorts (Under 60s)':     { ocr: 40, stt: 20, context: 25, metadata: 15 },
  'Instagram Reels (Under 60s)':    { ocr: 40, stt: 20, context: 25, metadata: 15 },
  'TikTok (Under 60s)':             { ocr: 40, stt: 20, context: 25, metadata: 15 },
  'Video Ads (15s/30s)':            { ocr: 25, stt: 15, context: 40, metadata: 20 },
};

export default function VideoApp() {
  const [file, setFile]             = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [platform, setPlatform]     = useState(PLATFORMS[0]);
  const [keyword, setKeyword]       = useState('');
  const [duration, setDuration]     = useState<number | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport]         = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [error, setError]           = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSnapshotAtTime = (time: number) => {
    if (!previewUrl) return;
    const video = document.createElement('video');
    video.src = previewUrl;
    video.crossOrigin = 'anonymous';
    video.onloadedmetadata = () => { video.currentTime = Math.min(time, video.duration - 0.1); };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); setSnapshotUrl(canvas.toDataURL('image/jpeg')); }
    };
  };

  const extractVideoMetadata = (fileUrl: string) => {
    const video = document.createElement('video');
    video.src = fileUrl; video.crossOrigin = 'anonymous';
    video.onloadedmetadata = () => { setDuration(video.duration); video.currentTime = 1.0; };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); setSnapshotUrl(canvas.toDataURL('image/jpeg')); }
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) { setError('동영상 파일만 업로드할 수 있습니다.'); return; }
    if (f.size > 50 * 1024 * 1024) { setError('50MB 이하의 파일만 지원합니다.'); return; }
    setFile(f); const url = URL.createObjectURL(f); setPreviewUrl(url); extractVideoMetadata(url); setError(null); setReport(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) { setError('동영상 파일만 업로드할 수 있습니다.'); return; }
    if (f.size > 50 * 1024 * 1024) { setError('50MB 이하의 파일만 지원합니다.'); return; }
    setFile(f); const url = URL.createObjectURL(f); setPreviewUrl(url); extractVideoMetadata(url); setError(null); setReport(null);
  };

  const fileToBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(f);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

  const analyzeVideo = async () => {
    if (!file || !keyword.trim()) { setError('동영상과 타겟 키워드를 모두 입력해 주세요.'); return; }
    setIsAnalyzing(true); setError(null); setReport(null);
    try {
      const apiKey = resolveApiKey();
      if (!apiKey) throw new Error('Gemini API key is missing.');
      const weights = PLATFORM_WEIGHTS[platform] || PLATFORM_WEIGHTS['YouTube Shorts (Under 60s)'];
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = await fileToBase64(file);
      const base64String = base64Data.split(',')[1];

      const prompt = `
[Role] You are a top-tier Marketing Architect and expert in Multimodal AEO/GEO. Analyze user-uploaded videos for Project AEGIS.

[Target_Platform]: ${platform}
[Target_Keyword]: ${keyword}

[Weighting System] For ${platform}:
- 시각 데이터(OCR): ${weights.ocr}점
- 청각 데이터(STT): ${weights.stt}점
- 맥락 동기화: ${weights.context}점
- 메타데이터: ${weights.metadata}점

[Output Format] Respond in Korean. Include exactly THREE parts:

[JSON_DATA]
{"totalScore":<0-100>,"radarScores":{"ocr":<0-${weights.ocr}>,"stt":<0-${weights.stt}>,"context":<0-${weights.context}>,"metadata":<0-${weights.metadata}>},"grade":"<A/B/C/D/F>","oneLineReview":"<summary>","radarSummary":"<e.g. 시각 강점/음성 약점>","actionItems":["<item1>","<item2>","<item3>"]}
[/JSON_DATA]

[REPORT_MARKDOWN]
**[시각 데이터 및 구조 - X/${weights.ocr}점]**
<explanation>

**[청각 데이터 및 발화 - X/${weights.stt}점]**
<explanation>

**[멀티모달 맥락 동기화 - X/${weights.context}점]**
<explanation>

**[플랫폼 문법 및 메타데이터 - X/${weights.metadata}점]**
<explanation>
[/REPORT_MARKDOWN]

[BEST_FRAME_SEC: <seconds>]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{ parts: [{ inlineData: { mimeType: file.type, data: base64String } }, { text: prompt }] }],
      });

      let responseText = response.text || '';
      const jsonMatch = responseText.match(/\[JSON_DATA\]([\s\S]*?)\[\/JSON_DATA\]/);
      if (jsonMatch?.[1]) { try { setReportData(JSON.parse(jsonMatch[1].trim())); } catch {} }
      const mdMatch = responseText.match(/\[REPORT_MARKDOWN\]([\s\S]*?)\[\/REPORT_MARKDOWN\]/);
      if (mdMatch?.[1]) setReportMarkdown(mdMatch[1].trim());
      const frameMatch = responseText.match(/\[BEST_FRAME_SEC:\s*([\d.]+)\]/);
      if (frameMatch?.[1]) { updateSnapshotAtTime(parseFloat(frameMatch[1])); responseText = responseText.replace(/\[BEST_FRAME_SEC:\s*([\d.]+)\]/, '').trim(); }
      setReport(responseText);
    } catch (err: any) {
      setError(err.message || '분석 중 오류가 발생했습니다.');
    } finally { setIsAnalyzing(false); }
  };

  const downloadPDF = () => {
    const el = document.getElementById('report-container');
    if (!el) return;
    html2pdf().set({ margin: 0, filename: 'AEGIS_AEO_GEO_Report.pdf', image: { type: 'jpeg', quality: 1.0 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } }).from(el).save();
  };

  const Modal = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
    if (activeModal !== id) return null;
    return (
      <div className="fixed inset-0 bg-black/50 z-[999] flex justify-center items-center p-4" onClick={() => setActiveModal(null)}>
        <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl p-8 relative overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          <button className="absolute top-4 right-6 text-2xl font-bold text-slate-400 hover:text-rose-500 transition-colors" onClick={() => setActiveModal(null)}>&times;</button>
          <h2 className="text-2xl font-bold text-indigo-900 border-b-2 border-slate-100 pb-3 mb-6">{title}</h2>
          <div className="text-slate-600 space-y-4 text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    );
  };

  const ReportLayout = ({ isPdf = false }: { isPdf?: boolean }) => {
    if (!reportData) return null;
    const weights = PLATFORM_WEIGHTS[platform] || PLATFORM_WEIGHTS['YouTube Shorts (Under 60s)'];
    const maxWeight = Math.max(weights.ocr, weights.stt, weights.context, weights.metadata);
    const scoreData = { labels: ['획득', '감점'], datasets: [{ data: [reportData.totalScore, 100 - reportData.totalScore], backgroundColor: ['#1a237e', '#e0e0e0'], borderWidth: 0 }] };
    const radarData = { labels: ['시각/OCR', '청각/STT', '맥락 일치', '메타데이터'], datasets: [{ label: '획득 스코어', data: [reportData.radarScores.ocr, reportData.radarScores.stt, reportData.radarScores.context, reportData.radarScores.metadata], backgroundColor: 'rgba(26,35,126,0.2)', borderColor: '#1a237e', pointBackgroundColor: '#d32f2f', borderWidth: 2 }] };
    const chartOpts = { animation: false, responsive: true, maintainAspectRatio: false };
    return (
      <div id={isPdf ? 'report-container' : undefined} style={{ background: 'white', lineHeight: '1.6', fontFamily: "'Noto Sans KR', sans-serif", color: '#333' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #1a237e', paddingBottom: 15, marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, color: '#1a237e', fontWeight: 'bold', margin: 0 }}>Project AEGIS AEO/GEO 진단 리포트</h1>
          <p style={{ fontSize: 11, color: '#777', margin: '4px 0 0' }}>진단 일시: {new Date().toLocaleString('ko-KR')}</p>
        </div>
        <div style={{ fontSize: 16, fontWeight: 'bold', backgroundColor: '#f5f7fa', padding: '8px 14px', marginBottom: 14, borderLeft: '5px solid #1a237e', color: '#1a237e' }}>1. Executive Summary</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, textAlign: 'center', background: '#fafafa' }}>
            <h3 style={{ fontSize: 13, color: '#555', margin: '0 0 8px', borderBottom: '1px dashed #ccc', paddingBottom: 4 }}>최종 AEO 스코어</h3>
            <div style={{ position: 'relative', height: 130 }}><Doughnut data={scoreData} options={{ ...chartOpts, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } } } as any} plugins={[textCenterPlugin]} /></div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#d32f2f', margin: '8px 0' }}>등급: {reportData.grade}</div>
            <p style={{ fontSize: 11, color: '#444', background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #eee', textAlign: 'left' }}>"{reportData.oneLineReview}"</p>
          </div>
          <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, textAlign: 'center', background: '#fafafa' }}>
            <h3 style={{ fontSize: 13, color: '#555', margin: '0 0 8px', borderBottom: '1px dashed #ccc', paddingBottom: 4 }}>4대 핵심 지표 (방사형)</h3>
            <div style={{ position: 'relative', height: 130 }}><Radar data={radarData} options={{ ...chartOpts, scales: { r: { angleLines: { display: true }, suggestedMin: 0, suggestedMax: maxWeight, ticks: { display: false } } }, plugins: { legend: { display: false } } } as any} /></div>
            <p style={{ fontSize: 11, color: '#444', background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #eee', marginTop: 8 }}>{reportData.radarSummary}</p>
          </div>
        </div>
        <div style={{ border: '1px solid #ffcdd2', borderLeft: '5px solid #d32f2f', background: '#ffebee', padding: 14, borderRadius: 4, marginBottom: 20 }}>
          <div style={{ color: '#b71c1c', fontWeight: 'bold', marginBottom: 8, fontSize: 14 }}>Top 3 우선순위 개선 과제</div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, listStyleType: 'disc' }}>
            {reportData.actionItems.map((item: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
          </ul>
        </div>
        <div style={{ fontSize: 16, fontWeight: 'bold', backgroundColor: '#f5f7fa', padding: '8px 14px', marginBottom: 14, borderLeft: '5px solid #1a237e', color: '#1a237e' }}>2. 분석 에셋 정보</div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div style={{ width: 240, height: 135, background: '#000', borderRadius: 6, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {snapshotUrl ? <img src={snapshotUrl} style={{ maxWidth: '100%', maxHeight: '100%' }} alt="Snapshot" /> : <span style={{ color: 'white', fontSize: 12 }}>스냅샷 대기중...</span>}
          </div>
          <div style={{ flex: 1, fontSize: 13 }}>
            {[['타겟 플랫폼', platform], ['타겟 키워드', keyword], ['재생 시간', duration ? `${Math.floor(duration/60)}분 ${Math.floor(duration%60)}초` : '-'], ['파일명', file?.name || '-']].map(([label, val]) => (
              <div key={label} style={{ borderBottom: '1px solid #eee', padding: '4px 0', marginBottom: 4 }}><span style={{ fontWeight: 'bold', color: '#555', display: 'inline-block', width: 90 }}>{label}:</span> {val}</div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 'bold', backgroundColor: '#f5f7fa', padding: '8px 14px', marginBottom: 14, borderLeft: '5px solid #1a237e', color: '#1a237e' }}>3. 세부 스코어링 내역</div>
        <div className="prose prose-sm max-w-none"><Markdown>{reportMarkdown}</Markdown></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Modals */}
      <Modal id="guide" title="💡 앱 소개 및 사용법">
        <p>검색의 패러다임이 답변 엔진(Answer Engine)으로 변화하고 있습니다. 이 모듈은 영상 콘텐츠의 멀티모달 AEO/GEO 최적화 점수를 진단합니다.</p>
        <ol className="list-decimal pl-5 space-y-1"><li>분석할 동영상 파일 업로드 (최대 50MB)</li><li>타겟 플랫폼 및 키워드 선택</li><li>Generate AEO/GEO Report 버튼 클릭</li><li>결과 확인 후 PDF 다운로드</li></ol>
      </Modal>
      <Modal id="score" title="📊 AEO/GEO 스코어링 기준">
        <p>플랫폼 유형에 따라 4개 지표의 가중치가 자동으로 조정됩니다.</p>
        <table className="w-full border-collapse text-xs text-center mt-2">
          <thead><tr className="bg-indigo-900 text-white"><th className="p-2 border">포맷</th><th className="p-2 border">시각</th><th className="p-2 border">청각</th><th className="p-2 border">맥락</th><th className="p-2 border">메타</th></tr></thead>
          <tbody>
            {[['롱폼(5분+)','15','35','20','30'],['숏폼','40','20','25','15'],['광고소재','25','15','40','20']].map(([n,...v]) => (
              <tr key={n}><td className="p-2 border bg-slate-50 font-medium">{n}</td>{v.map((val,i) => <td key={i} className="p-2 border">{val}점</td>)}</tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* 앱 헤더 */}
      <AppHeader
        icon="🎬" name="AEGIS Vision" accentPart="Vision"
        subtitle="멀티모달 AEO·GEO 최적화 점수 진단"
        accentColor="text-rose-600" iconBg="bg-rose-600" theme="light"
        actions={<>
          {['guide','score'].map(id => (
            <button key={id} onClick={() => setActiveModal(id)}>
              {id === 'guide' ? '앱 안내' : '평가 기준'}
            </button>
          ))}
        </>}
      />

      {/* 히든 PDF 컨테이너 */}
      <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
        <ReportLayout isPdf={true} />
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 좌측: 업로드 폼 */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-rose-500" /> Upload Asset
              </h2>
              <div
                className={cn('border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                  file ? 'border-rose-200 bg-rose-50/50' : 'border-slate-300 hover:border-rose-400 hover:bg-slate-50')}
                onDragOver={e => e.preventDefault()} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" accept="video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                {previewUrl ? (
                  <div className="space-y-3">
                    <video src={previewUrl} className="w-full h-48 object-contain rounded-lg bg-black" controls />
                    <div className="flex items-center justify-center gap-2 text-sm text-rose-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />{file?.name} ({(file!.size / 1024 / 1024).toFixed(1)}MB)
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Click or drag and drop</p>
                    <p className="text-xs text-slate-400">MP4, WebM, MOV · 최대 50MB</p>
                  </div>
                )}
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Target Platform</label>
                  <select value={platform} onChange={e => setPlatform(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Target Keyword (Entity)</label>
                  <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
                    placeholder="예: AI 마케팅 자동화"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
                </div>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><p>{error}</p>
                </div>
              )}
              <button onClick={analyzeVideo} disabled={!file || !keyword.trim() || isAnalyzing}
                className="w-full mt-5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <>Generate AEO/GEO Report <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>

          {/* 우측: 리포트 */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  Analysis Report
                  {report && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Complete</span>}
                </h2>
                {report && (
                  <button onClick={downloadPDF} className="flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />Download PDF
                  </button>
                )}
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 text-slate-400">
                    <div className="relative w-16 h-16">
                      <div className="w-16 h-16 border-4 border-slate-100 rounded-full absolute" />
                      <div className="w-16 h-16 border-4 border-rose-500 rounded-full border-t-transparent animate-spin absolute" />
                    </div>
                    <p className="text-sm animate-pulse">OCR & STT 신호 추출 중...</p>
                  </div>
                ) : reportData && reportMarkdown ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto">
                    <ReportLayout isPdf={false} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3">
                    <Video className="w-10 h-10" />
                    <p className="text-sm">동영상을 업로드하고 키워드를 입력하면 리포트가 생성됩니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
