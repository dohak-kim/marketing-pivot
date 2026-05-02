
import { ContentEvaluation } from "./model";

export function buildImprovementPrompt(
  originalContent: string,
  evaluation: ContentEvaluation
): string {
  return `
You are an expert marketing strategist.

[ORIGINAL CONTENT]
${originalContent}

[EVALUATION SUMMARY]
- Overall Score: ${evaluation.overallScore}
- Issues:
${evaluation.improvementHints.map(h => `- ${h}`).join("\n")}

[INSTRUCTIONS]
- Improve the content to resolve the issues above
- Keep the original strategic intent
- Maintain alignment with the current Context and Conversion stage
- Do NOT add unnecessary length

Return only the revised content.
`;
}
