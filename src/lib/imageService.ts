import { GoogleGenAI } from '@google/genai';

export type ImageType  = 'Infographic' | 'Illustration' | 'Photography' | 'Cartoon';
export type ImageTone  = 'Professional' | 'Friendly' | 'Futuristic' | 'Minimalist';
export type ImageColor = 'Vibrant' | 'Pastel' | 'Monochrome' | 'Warm' | 'Cool';

export interface ImageStyleConfig {
  type:  ImageType;
  tone:  ImageTone;
  color: ImageColor;
}

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

export async function generateBlogImage(
  heading: string,
  context: string,
  style: ImageStyleConfig,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: resolveApiKey() });

  const prompt = [
    `Professional ${style.type} for a digital marketing blog article.`,
    `Theme: translate the Korean concept "${heading}" into a strong visual metaphor.`,
    `Style: ${style.tone}, ${style.color} color palette.`,
    `Aspect ratio: 16:9. High resolution, premium editorial quality.`,
    context ? `Context: ${context.substring(0, 200)}` : '',
    `Rules: absolutely NO text, NO characters, NO words in the image.`,
    `Prefer clean symbolic visuals over text-based infographics.`,
  ].filter(Boolean).join('\n');

  // Imagen 3: 전문 이미지 생성 모델, 텍스트 없는 고품질 비주얼에 최적
  const response = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt,
    config: { numberOfImages: 1, aspectRatio: '16:9' },
  });

  const bytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!bytes) throw new Error('이미지 데이터가 응답에 포함되지 않았습니다.');
  return `data:image/jpeg;base64,${bytes}`;
}
