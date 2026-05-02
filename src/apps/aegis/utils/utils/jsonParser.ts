
export function safeJsonParse<T>(text: string | undefined): T {
  if (!text) {
    throw new Error("Received empty response from AI");
  }
  
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error("JSON Parse Error. Cleaned text:", cleaned);
    throw error;
  }
}
