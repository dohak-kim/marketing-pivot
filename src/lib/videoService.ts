import { GoogleGenAI, Type } from '@google/genai';

// ── 타입 ──────────────────────────────────────────────────────────────────
export type AspectRatio  = '1:1' | '9:16' | '16:9';
export type ImageTone    = '실사' | '일러스트레이션' | '애니메이션';
export type AssetType    = 'logo' | 'product' | 'model' | 'store' | 'background';

export interface StoryboardAsset {
  type: AssetType;
  base64: string;
  mimeType: string;
  name?: string;
}

export interface ReelScene {
  sceneNumber: number;
  duration: string;
  visualDescription: string;
  audioScript: string;
  veoPrompt: string;
  sceneImages?: string[];
  videoUrl?: string;
}

export interface ReelStoryboard {
  id: string;
  title: string;
  concept: string;
  scenes: ReelScene[];
}

export interface AdImageParams {
  logoImage?:    { base64: string; mimeType: string };
  productImage?: { base64: string; mimeType: string };
  adMessage:     string;
  topic?:        string;
  aspectRatio:   AspectRatio;
  tone:          ImageTone;
  textPosition:  'top' | 'middle' | 'bottom';
  textColor:     string;
}

// ── API 키 ────────────────────────────────────────────────────────────────
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

const getAi = () => new GoogleGenAI({ apiKey: resolveApiKey() });

function toneToEnglish(tone: ImageTone): string {
  return tone === '실사' ? 'photorealistic' : tone === '일러스트레이션' ? 'illustration' : 'anime or cartoon';
}

// ── 스토리보드 생성 ───────────────────────────────────────────────────────
export async function generateReelStoryboards(adMessage: string): Promise<ReelStoryboard[]> {
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id:      { type: Type.STRING },
        title:   { type: Type.STRING },
        concept: { type: Type.STRING },
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneNumber:       { type: Type.NUMBER },
              duration:          { type: Type.STRING },
              visualDescription: { type: Type.STRING },
              audioScript:       { type: Type.STRING },
              veoPrompt:         { type: Type.STRING },
            },
            required: ['sceneNumber', 'duration', 'visualDescription', 'audioScript', 'veoPrompt'],
          },
        },
      },
      required: ['id', 'title', 'concept', 'scenes'],
    },
  };

  const response = await getAi().models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `
당신은 숏폼 비디오(Reels/Shorts) 전문 기획자입니다.
광고 메시지 "${adMessage}"를 기반으로 15초 분량의 스토리보드 3개를 기획하세요.
각 스토리보드는 서로 다른 톤앤매너(감성적/유머러스/정보전달 등)를 가집니다.
각 스토리보드는 정확히 3개의 씬(각 5초)으로 구성됩니다.
veoPrompt는 Google Veo 모델용 상세한 영문 프롬프트여야 합니다.
결과는 JSON 배열로 반환하세요.`,
    config: { responseMimeType: 'application/json', responseSchema: schema },
  });

  return JSON.parse(response.text ?? '[]') as ReelStoryboard[];
}

// ── 씬 콘티 이미지 생성 ──────────────────────────────────────────────────
export async function generateSceneImage(
  description: string,
  assets: StoryboardAsset[] = [],
): Promise<string> {
  const parts: any[] = [];
  let assetPrompt = '';

  for (const asset of assets) {
    if (asset.base64 && asset.mimeType) {
      parts.push({ inlineData: { data: asset.base64, mimeType: asset.mimeType } });
      assetPrompt += `- [${asset.type}]: incorporate this visual element.\n`;
    }
  }

  parts.push({ text: `
Create a photorealistic, high-quality storyboard frame for a video scene.
Scene: ${description}
${assetPrompt ? `\nReference assets:\n${assetPrompt}` : ''}
Style: Cinematic, no text overlays, 9:16 composition, professional lighting.
` });

  const response = await getAi().models.generateContent({
    model: 'gemini-2.5-flash-preview-05-14',
    contents: { parts },
    config: { imageConfig: { aspectRatio: '9:16' } },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error('콘티 이미지 데이터가 응답에 없습니다.');
}

// ── Veo 영상 생성 (버그 수정: API_KEY 미정의 변수 제거) ──────────────────
export async function generateVeoVideo(prompt: string): Promise<string> {
  const apiKey = resolveApiKey();
  if (!apiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.');

  const veoAi = new GoogleGenAI({ apiKey });

  let operation = await veoAi.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '9:16' },
  });

  while (!operation.done) {
    await new Promise(r => setTimeout(r, 5000));
    operation = await veoAi.operations.getVideosOperation({ operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error('영상 생성 완료됐으나 URI가 반환되지 않았습니다.');

  const videoRes = await fetch(`${videoUri}&key=${apiKey}`);
  if (!videoRes.ok) throw new Error(`영상 다운로드 실패: ${videoRes.statusText}`);

  const blob = await videoRes.blob();
  return URL.createObjectURL(blob);
}

// ── 광고 이미지 생성 ──────────────────────────────────────────────────────
export async function generateAdImage(params: AdImageParams): Promise<string> {
  const { logoImage, productImage, adMessage, topic, aspectRatio, tone, textPosition, textColor } = params;
  const translatedTone = toneToEnglish(tone);
  const imageParts: any[] = [];
  let coreVisualPrompt = '';

  if (productImage) {
    imageParts.push({ inlineData: { data: productImage.base64, mimeType: productImage.mimeType } });
    coreVisualPrompt += 'A product image is provided — make it the central focus. ';
  }
  if (logoImage) {
    imageParts.push({ inlineData: { data: logoImage.base64, mimeType: logoImage.mimeType } });
    coreVisualPrompt += productImage
      ? 'A brand logo is also provided — integrate it subtly (corner or watermark).'
      : 'A brand logo is provided — create a thematic background matching the brand identity.';
  }
  if (imageParts.length === 0) {
    coreVisualPrompt += `Create a high-quality advertising background for "${topic || 'General Marketing'}" themed around: "${adMessage}". Premium stock-photo quality, ready for text overlay.`;
  }

  const response = await getAi().models.generateContent({
    model: 'gemini-2.5-flash-preview-05-14',
    contents: {
      parts: [
        ...imageParts,
        { text: `
You are an expert graphic designer creating a background image for a social media ad.
DO NOT RENDER ANY TEXT.
Theme: "${adMessage}" — capture its mood visually, not literally.
Core visual: ${coreVisualPrompt}
Style: ${translatedTone}
Text will be placed in the ${textPosition} — keep that area naturally quieter (soft focus, less detail).
Ensure good contrast for ${textColor} text in the ${textPosition}.
Aspect ratio: ${aspectRatio}. No letters, characters, or words anywhere.
` },
      ],
    },
    config: { imageConfig: { aspectRatio } },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) return part.inlineData.data;
  }
  throw new Error('광고 이미지 데이터가 응답에 없습니다.');
}
