import { buildVeoPrompt } from "./buildVeoPrompt";
import { callVeo } from "../ai/veoClient";
import { VeoPromptInput } from "./veoPrompt";

/**
 * Orchestrates the full video production cycle:
 * 1. Transforms strategic Context/Blueprint data into a cinematic prompt.
 * 2. Triggers the Veo 3.1 rendering engine.
 * 3. Returns a local URL for the generated video asset.
 */
export async function renderVeo(input: VeoPromptInput): Promise<string> {
  const prompt = buildVeoPrompt(input);
  return await callVeo(prompt);
}
