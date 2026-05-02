import { GoogleGenAI } from "@google/genai";

/**
 * A generic client for simple text-based interactions with Gemini.
 * Primarily used by the evaluation and improvement modules.
 */
export async function callGemini(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
