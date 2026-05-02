import axios from "axios";
import { collectKoreanNews } from "./newsCollector";

export interface SourceItem {
  id: string;
  title: string;
  source: string;
  url: string;
  date: string;
  content: string;
}

/**
 * Extracts the main text content from a given URL using a proxy.
 * Useful for building a richer fact sheet beyond just summaries.
 */
export async function extractArticle(url: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    );

    if (!res.ok) return "";

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const paragraphs = [...doc.querySelectorAll("p")];

    const content = paragraphs
      .map(p => p.textContent?.trim())
      .filter(text => text && text.length > 20) // Filter out short fragments
      .join(" ")
      .slice(0, 4000);

    return content;
  } catch (e) {
    console.error(`Article Extraction Error for ${url}:`, e);
    return "";
  }
}
