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
    model: 'gemini-3-flash',
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
    model: 'gemini-3-flash',
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

// ── 광고 이미지 생성 (배경만 생성 — 텍스트는 호출부에서 canvasTextOverlay로 합성) ──
// 참조 이미지 없음 → Imagen 3 (고품질 text-to-image)
// 참조 이미지 있음 → Gemini 2.5 Flash (멀티모달 필수)
// 반환값: raw base64 문자열 (data: URI 접두사 없음)
export async function generateAdImage(params: AdImageParams): Promise<string> {
  const { logoImage, productImage, adMessage, topic, aspectRatio, tone, textPosition, textColor } = params;
  const translatedTone = toneToEnglish(tone);
  const hasRef = !!(logoImage || productImage);

  const bgPrompt = [
    `Expert graphic designer's social media ad background. DO NOT render any text, letters, or characters.`,
    `Mood: "${adMessage}" — express visually, not literally.`,
    `Style: ${translatedTone}.`,
    `Composition: ${textPosition} area should be quieter (soft focus) for text overlay contrast with ${textColor}.`,
    `Aspect ratio: ${aspectRatio}. Premium quality. No words anywhere.`,
  ].join('\n');

  if (!hasRef) {
    // Imagen 3 — 참조 이미지 없을 때 최고 품질
    const topicHint = topic ? `Category: ${topic}.` : '';
    const response = await getAi().models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: `${bgPrompt}\n${topicHint}`,
      config: { numberOfImages: 1, aspectRatio },
    });
    const bytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!bytes) throw new Error('광고 이미지 데이터가 응답에 없습니다.');
    return bytes; // raw base64 (JPEG)
  }

  // Gemini 2.5 Flash — 로고·상품 참조 이미지 멀티모달 합성
  const imageParts: any[] = [];
  let coreVisualPrompt = '';
  if (productImage) {
    imageParts.push({ inlineData: { data: productImage.base64, mimeType: productImage.mimeType } });
    coreVisualPrompt += 'Product image provided — make it the central focus. ';
  }
  if (logoImage) {
    imageParts.push({ inlineData: { data: logoImage.base64, mimeType: logoImage.mimeType } });
    coreVisualPrompt += productImage
      ? 'Brand logo also provided — integrate subtly (corner or watermark).'
      : 'Brand logo provided — create thematic background matching brand identity.';
  }

  const response = await getAi().models.generateContent({
    model: 'gemini-3-flash',
    contents: { parts: [...imageParts, { text: `${bgPrompt}\n${coreVisualPrompt}` }] },
    config: { imageConfig: { aspectRatio } },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) return part.inlineData.data;
  }
  throw new Error('광고 이미지 데이터가 응답에 없습니다.');
}
