import { VeoPromptInput } from "./veoPrompt";

/**
 * Constructs a structured, high-fidelity prompt for the Veo video generation engine.
 * Maps Context and Creative Blueprints into cinematic instructions.
 */
export function buildVeoPrompt(input: VeoPromptInput): string {
  const { context: contextData, action, blueprint, channel, durationSec } = input;

  return `
You are a professional video ad director and creative strategist specializing in high-conversion performance marketing.

[CONTEXT – SITUATION]
Situation: ${contextData.situation}
Category: ${contextData.category}

[STRATEGIC ACTION]
Action Goal: ${action.label}
Conversion Stage: ${action.conversionStage}

[CREATIVE BLUEPRINT]
Narrative Goal: ${blueprint.headlineGoal}
Key Message: ${blueprint.keyMessage}
CTA: ${blueprint.callToAction}

[CHANNEL RULES]
Channel: ${channel}
Duration: ${durationSec} seconds
- Mandatory: Compelling hook in the first 3 seconds to ensure scroll-stop performance.
- Preference: Emphasize visual storytelling, atmospheric lighting, and high-fidelity textures over explicit text.
- Resolution: Cinematic 16:9 aspect ratio.
- Closing: Finish with a clear, visually integrated Call to Action.

[OUTPUT]
Generate a concise, scene-by-scene video concept optimized for cinematic rendering with the Veo 3.1 engine.
Focus on lighting mood, camera movement (tracking, panning), and character reactions that align with the CDJ stage.
`;
}