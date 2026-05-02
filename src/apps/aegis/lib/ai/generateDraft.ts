
import { GoogleGenAI, Type } from "@google/genai";
import { DraftContent } from "../../content/strategy";
import { safeJsonParse } from "../../utils/jsonParser";

export async function generateDraft(
  prompt: string
): Promise<DraftContent> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          hook: { type: Type.STRING },
          body: { type: Type.STRING },
          cta: { type: Type.STRING },
        },
        required: ["title", "hook", "body"]
      }
    }
  });

  const res = safeJsonParse<{ title?: string; hook?: string; body?: string; cta?: string }>(response.text);

  return {
    id: crypto.randomUUID(),
    blueprintId: "",

    format: "ARTICLE",
    channel: "BLOG",

    title: res.title || "Generated Title",
    hook: res.hook || "",
    body: res.body || "",
    cta: res.cta,
  }
}
