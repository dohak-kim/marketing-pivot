import { ContentEvaluation } from "./model";
import { buildImprovementPrompt } from "./improvement";
import { callGemini } from "../ai/geminiClient";

/**
 * Automatically improves marketing content by evaluating it against 
 * strategic benchmarks and feeding issues back into the AI engine.
 */
export async function autoImproveContent(
  content: string,
  evaluation: ContentEvaluation
): Promise<string> {
  const prompt = buildImprovementPrompt(content, evaluation);

  const improvedContent = await callGemini(prompt);

  return improvedContent;
}
