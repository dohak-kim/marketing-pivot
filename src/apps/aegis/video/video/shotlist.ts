import { VideoScriptItem, VideoScript } from './script';

export interface ShotListItem {
  shotNumber: number;
  description: string;
  cameraAngle: string;
  lighting: string;
}

export interface Shot {
  shotNumber: number;
  description: string;
  durationSec: number;
}

/**
 * Logic to translate a script into technical cinematography instructions.
 */
export const getShotListPrompt = (script: VideoScriptItem[]) => {
  return `
    Translate the following video script into a technical cinematography shot list.
    
    SCRIPT DATA:
    ${JSON.stringify(script)}
    
    For each scene, define technical execution details:
    - shotNumber: Sequence ID.
    - description: Specific action or framing.
    - cameraAngle: Technical angle (e.g., Extreme Close Up, Tracking Shot, Low Angle).
    - lighting: Visual mood and lighting setup (e.g., High-key, Moody Chiaroscuro, Golden Hour).
  `;
};

/**
 * Synchronous transformation of a VideoScript into a basic Shot list.
 */
export function generateShotList(
  script: VideoScript
): Shot[] {
  const shots: Shot[] = [];

  shots.push({
    shotNumber: 1,
    description: `Hook 시각화: ${script.hook}`,
    durationSec: 3,
  });

  script.body.forEach((scene, index) => {
    shots.push({
      shotNumber: index + 2,
      description: `설명 장면: ${scene}`,
      durationSec: 4,
    });
  });

  shots.push({
    shotNumber: shots.length + 1,
    description: `CTA 장면: ${script.ending}`,
    durationSec: 3,
  });

  return shots;
}
