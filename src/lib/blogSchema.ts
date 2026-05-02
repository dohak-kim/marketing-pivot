import type { BlogPost } from '@/types/blog';

const BASE_URL = 'https://marketing-pivot.vercel.app';

function wordCount(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

// ── Article (보강: keywords, abstract, wordCount, inLanguage) ──────────────
export function generateArticleSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    abstract: post.excerpt || post.description,
    url: `${BASE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    inLanguage: 'ko',
    wordCount: wordCount(post.content),
    keywords: post.tags.join(', '),
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
      worksFor: { '@type': 'Organization', name: post.author.org },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Marketing Pivot — Project AEGIS',
      url: BASE_URL,
    },
    ...(post.heroImage ? { image: { '@type': 'ImageObject', url: post.heroImage } } : {}),
  };
}

// ── FAQPage ────────────────────────────────────────────────────────────────
export function generateFaqSchema(faqs: BlogPost['faqs']) {
  if (!faqs?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

// ── BreadcrumbList ─────────────────────────────────────────────────────────
export function generateBreadcrumbSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',      item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: '인사이트',   item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title,  item: `${BASE_URL}/blog/${post.slug}` },
    ],
  };
}

// ── HowTo ──────────────────────────────────────────────────────────────────
export function generateHowToSchema(post: BlogPost) {
  if (!post.howToSteps?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: post.title,
    description: post.excerpt || post.description,
    inLanguage: 'ko',
    step: post.howToSteps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

// ── Quotation ──────────────────────────────────────────────────────────────
export function generateQuotationSchemas(post: BlogPost) {
  if (!post.quotes?.length) return null;
  return post.quotes
    .filter(q => q.text.trim())
    .map(q => ({
      '@context': 'https://schema.org',
      '@type': 'Quotation',
      text: q.text,
      ...(q.author ? { spokenByCharacter: { '@type': 'Person', name: q.author } } : {}),
      ...(q.sourceUrl ? { citation: { '@type': 'CreativeWork', url: q.sourceUrl } } : {}),
    }));
}

// ── SpeakableSpecification ─────────────────────────────────────────────────
export function generateSpeakableSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: post.title,
    url: `${BASE_URL}/blog/${post.slug}`,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'h2', '.blog-content > p:first-of-type', '.blog-abstract'],
    },
  };
}

// ── 전체 스키마 목록 (BlogPost.tsx에서 한 번에 사용) ──────────────────────
export function generateAllSchemas(post: BlogPost) {
  const quotations = generateQuotationSchemas(post) ?? [];
  return [
    generateArticleSchema(post),
    generateFaqSchema(post),
    generateHowToSchema(post),
    ...quotations,
    generateBreadcrumbSchema(post),
    generateSpeakableSchema(post),
  ].filter(Boolean);
}
