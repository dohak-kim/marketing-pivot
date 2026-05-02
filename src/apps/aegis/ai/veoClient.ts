import { GoogleGenAI } from "@google/genai";

/**
 * Low-level client for Veo video generation.
 * Handles API key selection, model invocation, and operation polling.
 */
export async function callVeo(prompt: string): Promise<string> {
  // 1. Mandatory API Key check for Veo models as per guidelines
  const hasKey = await window.aistudio.hasSelectedApiKey();
  if (!hasKey) {
    await window.aistudio.openSelectKey();
    // Proceed assuming key selection was initiated
  }

  // 2. Initialize with the latest key from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 3. Start generation using the fast preview model
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  // 4. Poll for results (recommended interval: 10s)
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  // 5. Retrieve the download link from the operation response
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Video generation failed - no URI returned from API.");
  }

  // 6. Fetch the actual MP4 bytes (must append API key to the URI)
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!response.ok) {
    // If entity not found, it might be a stale key/session issue
    if (response.status === 404) {
      await window.aistudio.openSelectKey();
    }
    throw new Error(`Failed to fetch video: ${response.statusText}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
