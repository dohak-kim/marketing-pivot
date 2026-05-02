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

  const prompt = `
Create a professional ${style.type} for a digital marketing blog article.
Theme: "${heading}" (translate the core concept of this Korean heading into a strong visual metaphor).
Visual Style: ${style.tone} manner, ${style.color} color palette.
Aspect ratio: 16:9, high resolution, 4K quality, professional composition.

Context: "${context.substring(0, 200)}"

STRICT RULES:
- NO Korean characters — they render broken.
- If labels are needed, use ONLY simple English keywords (MAX 3 words).
- Prefer a clean, text-free composition with strong symbolic visuals.
- The image must feel premium and editorial.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-05-14',
    contents: { parts: [{ text: prompt }] },
    config: { responseModalities: ['IMAGE', 'TEXT'] },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error('이미지 데이터가 응답에 포함되지 않았습니다.');
}
