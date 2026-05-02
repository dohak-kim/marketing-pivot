
import { Context as CEP, Action } from "../core/context";
import { ContentBlueprint } from "../content/blueprint";

export interface VeoPromptInput {
  cep: CEP;
  action: Action;
  blueprint: ContentBlueprint;
  channel: "instagram_reels" | "youtube_shorts" | "ad_video";
  durationSec: number;
}
