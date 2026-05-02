
import { GoogleGenAI } from "@google/genai";

export const generateVideoForAction = async (prompt: string, onStatus: (status: string) => void) => {
  // Check if key is selected
  const hasKey = await window.aistudio.hasSelectedApiKey();
  if (!hasKey) {
    await window.aistudio.openSelectKey();
    // Proceed assuming success as per guidelines
  }

  // Fix: Create a new instance right before making an API call and use process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  onStatus("Initializing creative engine...");
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  const loadingMessages = [
    "Synthesizing visual concepts...",
    "Rendering cinematic frames...",
    "Applying professional color grading...",
    "Finalizing motion dynamics...",
    "Optimizing for high-bitrate playback..."
  ];

  let msgIndex = 0;
  while (!operation.done) {
    onStatus(loadingMessages[msgIndex % loadingMessages.length]);
    msgIndex++;
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed - no URI returned");

  // Fetch with API key appended
  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
};
