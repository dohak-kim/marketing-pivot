import { GoogleGenAI } from "@google/genai";

function resolveApiKey(): string {
  const sources = [
    () => process.env.GEMINI_API_KEY,
    () => process.env.API_KEY,
    () => (import.meta as any)?.env?.VITE_API_KEY,
  ];
  for (const get of sources) {
    try { const v = get(); if (v && v !== 'undefined') return String(v).trim(); } catch {}
  }
  return '';
}

export async function callGemini(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: resolveApiKey() });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw error;
  }
}
