import type { BlogPost } from '@/types/blog';

const BASE_URL = 'https://marketing-pivot.vercel.app';

export function generateArticleSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    url: `${BASE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
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
    ...(post.heroImage ? { image: post.heroImage } : {}),
  };
}

export function generateFaqSchema(faqs: BlogPost['faqs']) {
  if (!faqs.length) return null;
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

export function generateBreadcrumbSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: '인사이트', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${BASE_URL}/blog/${post.slug}` },
    ],
  };
}
