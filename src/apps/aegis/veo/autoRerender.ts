import { renderVeo } from "./renderVeo";
import { shouldRerenderVeo } from "./shouldRerender";
import { VeoPromptInput } from "./veoPrompt";
import { ContentEvaluation } from "../evaluation/model";

/**
 * Automatically triggers a cinematic re-render for video assets that fail to meet
 * strategic quality benchmarks. Refines the creative blueprint's messaging based on 
 * evaluation feedback before invoking the Veo 3.1 engine.
 */
export async function autoRerenderVeo(
  input: VeoPromptInput,
  evaluation: ContentEvaluation
): Promise<string | null> {
  // Check if re-render is strategically required based on quality thresholds
  if (!shouldRerenderVeo(evaluation)) {
    return null;
  }

  // Construct an optimized production input
  // Note: We map 'coreMessage' from the suggestion to 'keyMessage' used in our ContentBlueprint type
  const improvedInput: VeoPromptInput = {
    ...input,
    blueprint: {
      ...input.blueprint,
      keyMessage:
        input.blueprint.keyMessage +
        " (Strategic Production Note: Ensure the core message is delivered with maximum clarity and heightened emotional resonance to drive conversion.)"
    }
  };

  // Re-invoke the cinematic production pipeline
  return await renderVeo(improvedInput);
}