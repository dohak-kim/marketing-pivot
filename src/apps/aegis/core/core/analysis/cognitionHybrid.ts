import { CognitionKey } from '../context';

interface CognitionScore {
  informational: number;
  exploratory: number;
  commercial: number;
  transactional: number;
}

export function resolveHybridCognition(
  llmCognition: string,
  serpFeatures: string[],
  query: string,
  myBrand: string
): string {

  const score: CognitionScore = {
    informational: 0,
    exploratory: 0,
    commercial: 0,
    transactional: 0
  };

  // 1️⃣ LLM Base Weight
  const normalizedLlm = (llmCognition || '').toLowerCase();
  
  if (normalizedLlm.includes("transactional") || normalizedLlm.includes("전환")) score.transactional += 1.5;
  else if (normalizedLlm.includes("commercial") || normalizedLlm.includes("상업")) score.commercial += 1.5;
  else if (normalizedLlm.includes("exploratory") || normalizedLlm.includes("탐색")) score.exploratory += 1.5;
  else score.informational += 1.5;

  // 2️⃣ SERP Feature Correction
  const lowerFeatures = (serpFeatures || []).map(f => f.toLowerCase());
  
  if (lowerFeatures.some(f => f.includes("shopping") || f.includes("price") || f.includes("buy"))) {
    score.transactional += 1.2;
  }

  if (lowerFeatures.some(f => f.includes("ads") || f.includes("광고") || f.includes("sponsored"))) {
    score.commercial += 0.8;
  }

  if (lowerFeatures.some(f => f.includes("review") || f.includes("리뷰") || f.includes("rating") || f.includes("best") || f.includes("top"))) {
    score.commercial += 0.5;
    score.exploratory += 0.3;
  }
  
  if (lowerFeatures.some(f => f.includes("snippet") || f.includes("knowledge") || f.includes("wiki") || f.includes("answer"))) {
    score.informational += 0.8;
  }

  // 3️⃣ Brand Query Correction
  if (myBrand && query.toLowerCase().includes(myBrand.toLowerCase())) {
    score.transactional += 0.5;
    score.exploratory += 0.5;
  }

  // Determine Final Cognition
  const finalCognition = Object.entries(score)
    .sort((a, b) => b[1] - a[1])[0][0];

  return finalCognition;
}
