export interface BlogAuthor {
  name: string;
  role: string;
  org: string;
}

export interface BlogFaq {
  q: string;
  a: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  author: BlogAuthor;
  publishedAt: string;
  updatedAt?: string;
  readingTime: number;
  heroImage?: string;
  excerpt: string;
  content: string;
  faqs: BlogFaq[];
  published: boolean;
}
