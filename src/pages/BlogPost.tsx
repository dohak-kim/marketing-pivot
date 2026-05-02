import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { posts } from '@/data/posts';
import { generateArticleSchema, generateFaqSchema, generateBreadcrumbSchema } from '@/lib/blogSchema';

const CATEGORY_COLOR: Record<string, string> = {
  'AEO 인사이트':    'text-indigo-400',
  'CDJ 전략':        'text-amber-400',
  'C³ Cube':         'text-violet-400',
  'GEO 전략':        'text-teal-400',
  '마케팅 인사이트':  'text-rose-400',
};

const md: Record<string, React.FC<any>> = {
  h2: ({ children }) => (
    <h2 className="text-lg font-black text-white mt-10 mb-4 pb-2 border-b border-white/10 tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-black text-indigo-300 mt-6 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-bold text-slate-200 mt-4 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-sm text-slate-300 leading-7 mb-4 break-keep">{children}</p>
  ),
  strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
  em: ({ children }) => <em className="text-slate-300 italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-indigo-500 bg-indigo-500/5 px-5 py-3 my-5 rounded-r-xl text-slate-300 text-sm leading-relaxed">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }: any) =>
    inline
      ? <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
      : <pre className="bg-slate-800/80 border border-white/5 rounded-xl p-4 overflow-x-auto my-4">
          <code className="text-slate-300 text-xs font-mono leading-relaxed">{children}</code>
        </pre>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1.5 mb-4 text-slate-300">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 mb-4 text-slate-300">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} className="text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2"
      target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-5">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-white/10">{children}</thead>,
  tr: ({ children }) => <tr className="border-b border-white/5">{children}</tr>,
  th: ({ children }) => <th className="text-left py-2.5 px-3 text-xs font-bold text-slate-300 bg-slate-800/50">{children}</th>,
  td: ({ children }) => <td className="py-2.5 px-3 text-xs text-slate-400">{children}</td>,
  hr: () => <hr className="border-white/10 my-8" />,
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = posts.find(p => p.slug === slug && p.published);

  if (!post) return <Navigate to="/blog" replace />;

  const schemas = [
    generateArticleSchema(post),
    generateFaqSchema(post.faqs),
    generateBreadcrumbSchema(post),
  ].filter(Boolean);

  const catColor = CATEGORY_COLOR[post.category] ?? 'text-slate-400';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <article className="max-w-3xl mx-auto px-6 pt-20 pb-20">
        {/* 뒤로 */}
        <Link to="/blog"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors mb-10 group">
          <svg className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          인사이트 목록
        </Link>

        {/* 헤더 */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-black uppercase tracking-widest ${catColor}`}>
              {post.category}
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-[10px] text-slate-500">{post.readingTime}분 읽기</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight break-keep mb-4 tracking-tight">
            {post.title}
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed break-keep mb-6">
            {post.description}
          </p>

          {/* 저자 */}
          <div className="flex items-center justify-between py-4 border-t border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-black">
                {post.author.name[0]}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{post.author.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{post.author.role} · {post.author.org}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-600">발행일</p>
              <p className="text-xs text-slate-400 mt-0.5">{post.publishedAt}</p>
              {post.updatedAt && post.updatedAt !== post.publishedAt && (
                <p className="text-[10px] text-slate-600 mt-0.5">수정 {post.updatedAt}</p>
              )}
            </div>
          </div>

          {post.heroImage && (
            <img src={post.heroImage} alt={post.title}
              className="w-full rounded-2xl mt-6 aspect-video object-cover" />
          )}
        </header>

        {/* 본문 */}
        <div>
          <ReactMarkdown components={md}>{post.content}</ReactMarkdown>
        </div>

        {/* FAQ */}
        {post.faqs.length > 0 && (
          <section className="mt-12 pt-8 border-t border-white/5">
            <h2 className="text-base font-black text-white mb-5 flex items-center gap-2">
              <span className="text-indigo-400">📌</span> 자주 묻는 질문
            </h2>
            <div className="space-y-3">
              {post.faqs.map((faq, i) => (
                <div key={i} className="p-5 rounded-xl bg-slate-900 border border-white/5">
                  <p className="text-sm font-bold text-white mb-2">
                    <span className="text-indigo-400 mr-1.5">Q.</span>{faq.q}
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed pl-5 break-keep">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 태그 */}
        {post.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap gap-2">
            {post.tags.map(t => (
              <span key={t} className="text-xs text-slate-500 bg-slate-800 border border-white/5 px-2.5 py-1 rounded-full">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 하단 네비 */}
        <div className="mt-12">
          <Link to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-white/5 hover:border-indigo-500/30 rounded-xl text-sm font-bold text-slate-300 hover:text-white transition-all">
            ← 인사이트 목록으로
          </Link>
        </div>
      </article>
    </div>
  );
}
