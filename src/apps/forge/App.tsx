import React, { useState, useRef, useCallback, useEffect } from 'react';
import AppHeader from '@/shared/components/AppHeader';
import {
  generateReelStoryboards, generateSceneImage, generateVeoVideo, generateAdImage,
  type ReelStoryboard, type StoryboardAsset, type AssetType, type AdImageParams,
} from '@/lib/videoService';
import { generateBlogImage, type ImageStyleConfig } from '@/lib/imageService';

type Tab = 'reels' | 'adimage' | 'blogimage';

interface ForgeContext {
  source: 'c3';
  situationSummary: string;
  reels15s: string;
  shorts30s: string;
}

// ── 공통 유틸 ─────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      res({ base64: dataUrl.split(',')[1], mimeType: file.type });
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function Spinner({ size = 4 }: { size?: number }) {
  return <div className={`w-${size} h-${size} border-2 border-white/20 border-t-white rounded-full animate-spin`} />;
}

function ErrMsg({ msg }: { msg: string }) {
  return <p className="text-xs text-rose-400 text-center py-2">{msg}</p>;
}

// ── 탭 1: Reels 크리에이터 ────────────────────────────────────────────────
interface ReelsCreatorProps {
  injectedMessage?: string;
  injectedVeo15s?: string;
  injectedVeo30s?: string;
}

function ReelsCreator({ injectedMessage, injectedVeo15s, injectedVeo30s }: ReelsCreatorProps) {
  const [message, setMessage]         = useState(injectedMessage ?? '');
  const [assets, setAssets]           = useState<StoryboardAsset[]>([]);
  const [boards, setBoards]           = useState<ReelStoryboard[]>([]);
  const [selected, setSelected]       = useState<number | null>(null);
  const [sceneImgs, setSceneImgs]     = useState<Record<string, string>>({});
  const [videoUrls, setVideoUrls]     = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (injectedMessage) setMessage(injectedMessage);
  }, [injectedMessage]);

  const assetTypes: AssetType[] = ['logo', 'product', 'model', 'store', 'background'];
  const assetLabel: Record<AssetType, string> = {
    logo: '브랜드 로고', product: '제품 이미지', model: '모델', store: '매장', background: '배경',
  };

  const uploadAsset = async (type: AssetType, file: File) => {
    const { base64, mimeType } = await fileToBase64(file);
    setAssets(prev => {
      const filtered = prev.filter(a => a.type !== type);
      return [...filtered, { type, base64, mimeType, name: file.name }];
    });
  };

  const step1 = async () => {
    if (!message.trim()) { setError('광고 메시지 또는 콘텐츠 주제를 입력해주세요.'); return; }
    setLoading('storyboard'); setError(null); setBoards([]); setSelected(null);
    try {
      setBoards(await generateReelStoryboards(message));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(null); }
  };

  const step2 = async (boardIdx: number) => {
    setSelected(boardIdx);
    const board = boards[boardIdx];
    const logoAsset = assets.find(a => a.type === 'logo');
    const productAsset = assets.find(a => a.type === 'product');
    const filteredAssets = [logoAsset, productAsset].filter(Boolean) as StoryboardAsset[];

    for (const scene of board.scenes) {
      const key = `${boardIdx}-${scene.sceneNumber}`;
      if (sceneImgs[key]) continue;
      setLoading(`img-${key}`);
      try {
        const src = await generateSceneImage(scene.visualDescription, filteredAssets);
        setSceneImgs(prev => ({ ...prev, [key]: src }));
      } catch (e: any) { setError(e.message); }
      finally { setLoading(null); }
    }
  };

  const step3 = async (boardIdx: number, sceneNum: number, veoPrompt: string) => {
    const key = `${boardIdx}-${sceneNum}`;
    setLoading(`veo-${key}`); setError(null);
    try {
      const url = await generateVeoVideo(veoPrompt);
      setVideoUrls(prev => ({ ...prev, [key]: url }));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(null); }
  };

  const board = selected !== null ? boards[selected] : null;

  return (
    <div className="space-y-6">
      {/* C³ 주입 배너 */}
      {(injectedVeo15s || injectedVeo30s) && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
              C³ 전략에서 Veo 프롬프트가 주입되었습니다
            </span>
          </div>
          {injectedVeo15s && (
            <div className="space-y-1">
              <p className="text-[9px] font-black text-orange-300/70 uppercase tracking-wider">REELS 15S 프롬프트</p>
              <p className="text-[10px] text-slate-300 font-mono leading-relaxed bg-slate-900/60 rounded-lg px-3 py-2 break-words">{injectedVeo15s}</p>
            </div>
          )}
          {injectedVeo30s && (
            <div className="space-y-1">
              <p className="text-[9px] font-black text-violet-300/70 uppercase tracking-wider">SHORTS 30S 프롬프트</p>
              <p className="text-[10px] text-slate-300 font-mono leading-relaxed bg-slate-900/60 rounded-lg px-3 py-2 break-words">{injectedVeo30s}</p>
            </div>
          )}
        </div>
      )}

      {/* Step 1: 메시지 + 자산 */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-black text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black">1</span>
          콘텐츠 메시지 & 자산
        </h2>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          rows={3} placeholder="광고 카피 또는 콘텐츠 주제를 입력하세요&#10;예: 지금 바로 시작하는 AI 마케팅 자동화"
          className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none" />

        {/* 자산 업로드 */}
        <div className="grid grid-cols-5 gap-2">
          {assetTypes.map(type => {
            const existing = assets.find(a => a.type === type);
            return (
              <label key={type} className="cursor-pointer group">
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadAsset(type, f); }} />
                <div className={`rounded-xl border-2 border-dashed p-3 text-center transition-all ${existing ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 hover:border-white/20'}`}>
                  {existing
                    ? <img src={`data:${existing.mimeType};base64,${existing.base64}`} alt={type} className="w-full h-12 object-contain rounded mb-1" />
                    : <div className="w-full h-12 flex items-center justify-center text-slate-600 text-2xl">+</div>
                  }
                  <p className="text-[9px] text-slate-400 font-bold">{assetLabel[type]}</p>
                </div>
              </label>
            );
          })}
        </div>

        {error && <ErrMsg msg={error} />}
        <button onClick={step1} disabled={loading === 'storyboard'}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
          {loading === 'storyboard' ? <><Spinner />스토리보드 생성 중...</> : '🎬 스토리보드 3개 생성'}
        </button>
      </div>

      {/* Step 2: 스토리보드 선택 */}
      {boards.length > 0 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black">2</span>
            시나리오 선택 · 콘티 이미지 생성
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {boards.map((b, i) => (
              <button key={b.id} onClick={() => step2(i)}
                className={`p-4 rounded-xl border text-left transition-all ${selected === i ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 hover:border-white/15 bg-slate-800'}`}>
                <p className="text-[10px] font-black text-indigo-400 mb-1">{b.concept}</p>
                <p className="text-xs font-bold text-white mb-2">{b.title}</p>
                <div className="space-y-1">
                  {b.scenes.map(s => (
                    <p key={s.sceneNumber} className="text-[9px] text-slate-500 line-clamp-1">
                      씬{s.sceneNumber}: {s.visualDescription}
                    </p>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: 씬 상세 + Veo */}
      {board && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black">3</span>
            씬별 콘티 & Veo 영상 생성
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {board.scenes.map(scene => {
              const key = `${selected}-${scene.sceneNumber}`;
              const imgSrc = sceneImgs[key];
              const videoUrl = videoUrls[key];
              const isGenImg  = loading === `img-${key}`;
              const isGenVeo  = loading === `veo-${key}`;

              return (
                <div key={scene.sceneNumber} className="space-y-3">
                  {/* 콘티 */}
                  <div className="aspect-[9/16] bg-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center border border-white/5">
                    {videoUrl
                      ? <video src={videoUrl} controls className="w-full h-full object-cover" />
                      : imgSrc
                        ? <img src={imgSrc} alt={`씬${scene.sceneNumber}`} className="w-full h-full object-cover" />
                        : isGenImg
                          ? <Spinner size={6} />
                          : <p className="text-[10px] text-slate-600 text-center px-2">콘티 생성 대기</p>
                    }
                    <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-0.5">
                      <p className="text-[9px] font-black text-white">씬 {scene.sceneNumber} · {scene.duration}</p>
                    </div>
                  </div>

                  {/* 자막 */}
                  <div className="bg-slate-800 rounded-xl p-3 space-y-1.5">
                    <p className="text-[9px] font-bold text-indigo-400">자막/나레이션</p>
                    <p className="text-[10px] text-slate-300 leading-relaxed">{scene.audioScript}</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-2">Veo Prompt</p>
                    <p className="text-[9px] text-slate-600 leading-relaxed font-mono">{scene.veoPrompt.slice(0, 100)}...</p>
                  </div>

                  {/* Veo 생성 버튼 */}
                  {imgSrc && !videoUrl && (
                    <button onClick={() => step3(selected!, scene.sceneNumber, scene.veoPrompt)}
                      disabled={!!loading}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-1.5">
                      {isGenVeo ? <><Spinner size={3} />영상 생성 중 (약 60초)...</> : '🎥 Veo 영상 생성'}
                    </button>
                  )}
                  {videoUrl && (
                    <a href={videoUrl} download={`scene_${scene.sceneNumber}.mp4`}
                      className="block w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl text-center transition-colors">
                      ⬇ 영상 다운로드
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 탭 2: 광고 이미지 ────────────────────────────────────────────────────
function AdImageCreator() {
  const [params, setParams] = useState<Partial<AdImageParams>>({
    adMessage: '', aspectRatio: '1:1', tone: '실사', textPosition: 'bottom', textColor: '#ffffff',
  });
  const [logo,    setLogo]    = useState<{ base64: string; mimeType: string } | undefined>();
  const [product, setProduct] = useState<{ base64: string; mimeType: string } | undefined>();
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const upload = async (file: File, setter: (v: { base64: string; mimeType: string }) => void) => {
    const { base64, mimeType } = await fileToBase64(file);
    setter({ base64, mimeType });
  };

  const generate = async () => {
    if (!params.adMessage?.trim()) { setError('광고 메시지를 입력해주세요.'); return; }
    setLoading(true); setError(null);
    try {
      const base64 = await generateAdImage({
        ...(params as AdImageParams),
        logoImage: logo, productImage: product,
      });
      setPreview(`data:image/png;base64,${base64}`);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const set = <K extends keyof AdImageParams>(k: K, v: AdImageParams[K]) =>
    setParams(p => ({ ...p, [k]: v }));

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="forge-label">광고 메시지</label>
          <textarea value={params.adMessage} onChange={e => set('adMessage', e.target.value)}
            rows={3} placeholder="광고 카피를 입력하세요"
            className="forge-input resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="cursor-pointer">
            <p className="forge-label mb-1">브랜드 로고 (선택)</p>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, setLogo); }} />
            <div className="h-20 bg-slate-800 border border-dashed border-white/10 rounded-xl flex items-center justify-center hover:border-white/20 transition-colors">
              {logo ? <img src={`data:${logo.mimeType};base64,${logo.base64}`} className="max-h-16 object-contain" alt="logo" />
                    : <span className="text-slate-600 text-2xl">+</span>}
            </div>
          </label>
          <label className="cursor-pointer">
            <p className="forge-label mb-1">제품 이미지 (선택)</p>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, setProduct); }} />
            <div className="h-20 bg-slate-800 border border-dashed border-white/10 rounded-xl flex items-center justify-center hover:border-white/20 transition-colors">
              {product ? <img src={`data:${product.mimeType};base64,${product.base64}`} className="max-h-16 object-contain" alt="product" />
                       : <span className="text-slate-600 text-2xl">+</span>}
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="forge-label">비율</label>
            <div className="flex gap-2">
              {(['1:1', '9:16'] as const).map(r => (
                <button key={r} onClick={() => set('aspectRatio', r)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${params.aspectRatio === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="forge-label">스타일</label>
            <div className="flex gap-1">
              {(['실사', '일러스트레이션', '애니메이션'] as const).map(t => (
                <button key={t} onClick={() => set('tone', t)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${params.tone === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400'}`}>
                  {t === '일러스트레이션' ? '일러스트' : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="forge-label">텍스트 위치</label>
            <div className="flex gap-1">
              {(['top', 'middle', 'bottom'] as const).map(p => (
                <button key={p} onClick={() => set('textPosition', p)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${params.textPosition === p ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400'}`}>
                  {p === 'top' ? '상단' : p === 'middle' ? '중앙' : '하단'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="forge-label">텍스트 색상</label>
            <div className="flex items-center gap-2">
              <input type="color" value={params.textColor} onChange={e => set('textColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent" />
              <input type="text" value={params.textColor} onChange={e => set('textColor', e.target.value)}
                className="flex-1 bg-slate-800 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none" />
            </div>
          </div>
        </div>

        {error && <ErrMsg msg={error} />}
        <button onClick={generate} disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
          {loading ? <><Spinner />이미지 생성 중...</> : '🖼 광고 이미지 생성'}
        </button>
      </div>

      <div className="space-y-3">
        <label className="forge-label">미리보기</label>
        <div className={`bg-slate-800 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden ${params.aspectRatio === '9:16' ? 'aspect-[9/16] max-h-96 mx-auto' : 'aspect-square'}`}>
          {preview
            ? <img src={preview} alt="Ad" className="w-full h-full object-cover" />
            : <p className="text-[10px] text-slate-600 text-center">생성 버튼 클릭 후 미리보기 표시</p>
          }
        </div>
        {preview && (
          <a href={preview} download="aegis_ad.png"
            className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl text-center transition-colors">
            ⬇ 이미지 다운로드
          </a>
        )}
      </div>
    </div>
  );
}

// ── 탭 3: 블로그 이미지 ─────────────────────────────────────────────────
const IMAGE_TYPES  = ['Infographic', 'Illustration', 'Photography', 'Cartoon'] as const;
const IMAGE_TONES  = ['Professional', 'Friendly', 'Futuristic', 'Minimalist'] as const;
const IMAGE_COLORS = ['Vibrant', 'Pastel', 'Monochrome', 'Warm', 'Cool'] as const;
const TONE_KR  = { Professional: '전문적', Friendly: '친근한', Futuristic: '미래적', Minimalist: '미니멀' };
const COLOR_KR = { Vibrant: '선명', Pastel: '파스텔', Monochrome: '모노크롬', Warm: '웜톤', Cool: '쿨톤' };
const TYPE_KR  = { Infographic: '인포그래픽', Illustration: '일러스트', Photography: '포토', Cartoon: '카툰' };

function BlogImageCreator() {
  const [heading, setHeading] = useState('');
  const [context, setContext] = useState('');
  const [style, setStyle]     = useState<ImageStyleConfig>({ type: 'Infographic', tone: 'Professional', color: 'Vibrant' });
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const generate = async () => {
    if (!heading.trim()) { setError('이미지 주제를 입력해주세요.'); return; }
    setLoading(true); setError(null);
    try { setPreview(await generateBlogImage(heading, context, style)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="forge-label">섹션 제목 (이미지 주제)</label>
          <input value={heading} onChange={e => setHeading(e.target.value)}
            placeholder="예: AI 검색 최적화의 3단계" className="forge-input" />
        </div>
        <div>
          <label className="forge-label">맥락 설명 (선택)</label>
          <textarea value={context} onChange={e => setContext(e.target.value)}
            rows={3} placeholder="이미지와 함께 표현할 내용을 간략히 입력하세요"
            className="forge-input resize-none" />
        </div>
        <div>
          <label className="forge-label">이미지 유형</label>
          <div className="grid grid-cols-4 gap-1.5">
            {IMAGE_TYPES.map(t => (
              <button key={t} onClick={() => setStyle(s => ({ ...s, type: t }))}
                className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${style.type === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'}`}>
                {TYPE_KR[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="forge-label">톤</label>
            <div className="grid grid-cols-2 gap-1.5">
              {IMAGE_TONES.map(t => (
                <button key={t} onClick={() => setStyle(s => ({ ...s, tone: t }))}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${style.tone === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'}`}>
                  {TONE_KR[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="forge-label">색상</label>
            <div className="grid grid-cols-2 gap-1.5 flex-wrap">
              {IMAGE_COLORS.map(c => (
                <button key={c} onClick={() => setStyle(s => ({ ...s, color: c }))}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${style.color === c ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'}`}>
                  {COLOR_KR[c]}
                </button>
              ))}
            </div>
          </div>
        </div>
        {error && <ErrMsg msg={error} />}
        <button onClick={generate} disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
          {loading ? <><Spinner />이미지 생성 중...</> : '✨ 블로그 이미지 생성'}
        </button>
      </div>
      <div className="space-y-3">
        <label className="forge-label">미리보기 (16:9)</label>
        <div className="aspect-video bg-slate-800 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
          {preview
            ? <img src={preview} alt="Blog" className="w-full h-full object-cover" />
            : <p className="text-[10px] text-slate-600">생성 버튼 클릭 후 미리보기 표시</p>
          }
        </div>
        {preview && (
          <a href={preview} download="aegis_blog_image.png"
            className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl text-center transition-colors">
            ⬇ 이미지 다운로드
          </a>
        )}
        {preview && (
          <button onClick={generate} disabled={loading}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors">
            🔄 재생성
          </button>
        )}
      </div>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────────────────
const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'reels',    icon: '🎬', label: 'Reels 크리에이터' },
  { key: 'adimage',  icon: '🖼',  label: '광고 이미지' },
  { key: 'blogimage',icon: '📸', label: '블로그 이미지' },
];

export default function ForgeApp() {
  const [tab, setTab]                     = useState<Tab>('reels');
  const [forgeCtx, setForgeCtx]           = useState<ForgeContext | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('forge_context');
    if (!raw) return;
    try {
      const ctx: ForgeContext = JSON.parse(raw);
      setForgeCtx(ctx);
      setTab('reels');
    } catch {}
    sessionStorage.removeItem('forge_context');
  }, []);

  return (
    <>
      <style>{`
        .forge-label { display:block; font-size:9px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.08em; margin-bottom:4px; }
        .forge-input { width:100%; background:#1e293b; border:1px solid rgba(255,255,255,.06); border-radius:8px; padding:8px 12px; font-size:12px; color:#f1f5f9; outline:none; }
        .forge-input:focus { border-color:#6366f1; }
      `}</style>

      <div className="min-h-screen bg-slate-950 text-white font-sans">
        <AppHeader
          icon="⚒️" name="AEGIS FORGE" accentPart="FORGE"
          subtitle="AI 크리에이티브 제작 스튜디오 · Reels · 광고 이미지 · 블로그 비주얼"
          accentColor="text-orange-400" iconBg="bg-orange-500" theme="dark"
        />

        {/* 탭 */}
        <div className="border-b border-white/5 bg-slate-900/50">
          <div className="max-w-6xl mx-auto px-6 flex gap-1 pt-2">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${tab === t.key ? 'text-white border-orange-400 bg-white/5' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* C³ 전략 컨텍스트 배너 */}
        {forgeCtx && forgeCtx.situationSummary && (
          <div className="bg-slate-900/80 border-b border-orange-500/20">
            <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center gap-2">
              <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest shrink-0">C³ 전략 컨텍스트</span>
              <p className="text-[10px] text-slate-400 truncate">{forgeCtx.situationSummary}</p>
              <button
                onClick={() => setForgeCtx(null)}
                className="shrink-0 ml-auto text-[9px] text-slate-600 hover:text-slate-400 transition-colors"
              >✕</button>
            </div>
          </div>
        )}

        <main className="max-w-6xl mx-auto px-6 py-8">
          {tab === 'reels' && (
            <ReelsCreator
              injectedMessage={forgeCtx?.situationSummary}
              injectedVeo15s={forgeCtx?.reels15s}
              injectedVeo30s={forgeCtx?.shorts30s}
            />
          )}
          {tab === 'adimage'   && <AdImageCreator />}
          {tab === 'blogimage' && <BlogImageCreator />}
        </main>
      </div>
    </>
  );
}
