export type GenerationStep =
  | "analysis"
  | "stp"
  | "strategy"
  | "creative"
  | "keyword"
  | "default";

export function getGenerationConfig(step: GenerationStep) {
  switch (step) {
    case "analysis":
      // Fact-based, strict adherence (Low)
      return { temperature: 0.1, topP: 0.8 };

    case "stp":
      // Analytical but needs some interpretation (Low-Mid)
      return { temperature: 0.2, topP: 0.85 };

    case "strategy":
      // Balanced, insightful (Medium)
      return { temperature: 0.5, topP: 0.9 };

    case "creative":
      // Brainstorming, varied outputs (High)
      return { temperature: 0.9, topP: 0.95 };

    case "keyword":
      // Very strict for keyword generation
      return { temperature: 0.1, topP: 0.8 };

    default:
      return { temperature: 0.2, topP: 0.85 };
  }
}
