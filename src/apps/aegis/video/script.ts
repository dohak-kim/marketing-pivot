
import { Context } from '../core/context';
import { ContentBlueprint } from '../content/blueprint';

export interface VideoScript {
  hook: string;
  body: string[];
  ending: string;
}

export interface VideoScriptItem {
  scene: number;
  visual: string;
  audio: string;
  duration: string;
}

/**
 * Synchronous transformation of a Blueprint into a basic Script structure.
 */
export function generateVideoScript(
  blueprint: ContentBlueprint
): VideoScript {
  return {
    hook: blueprint.narrativeStructure[0],
    body: blueprint.narrativeStructure.slice(1, -1),
    ending: blueprint.callToAction,
  };
}

/**
 * Logic to structure the script generation prompt for the AI production engine.
 */
export const getScriptPrompt = (context: Context, blueprint: ContentBlueprint) => {
  const baseScript = generateVideoScript(blueprint);
  return `
    Create a professional video production script based on this strategic structure.
    
    SITUATION: ${context.situation}
    HOOK: ${baseScript.hook}
    NARRATIVE BODY: ${baseScript.body.join(' -> ')}
    CALL TO ACTION: ${baseScript.ending}
    TONE & MANNER: ${blueprint.toneAndManner.join(', ')}
    
    Structure the script into clear, timed scenes with specific [VISUAL] directions and [AUDIO] cues.
  `;
};
