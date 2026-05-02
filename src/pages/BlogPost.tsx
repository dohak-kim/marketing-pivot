import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { posts } from '@/data/posts';
import { generateAllSchemas } from '@/lib/blogSchema';

const CATEGORY_COLOR: Record<string, string> = {
  'AEO 인사이트':    'text-indigo-400',
  'CDJ 전략':        'text-amber-400',
  'C³ Cube':         'text-violet-400',
  'GEO 전략':        'text-teal-400',
  '마케팅 인사이트':  'text-rose-400',
};

const BLOG_CONTENT_STYLE = `
  .blog-content h2 { font-size: 1.15rem; font-weight: 900; color: #f1f5f9; margin: 2.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .blog-content h3 { font-size: 1rem; font-weight: 800; color: #a5b4fc; margin: 1.75rem 0 0.75rem; }
  .blog-content h4 { font-size: 0.9rem; font-weight: 700; color: #e2e8f0; margin: 1.25rem 0 0.5rem; }
  .blog-content p  { font-size: 0.875rem; color: #cbd5e1; line-height: 1.85; margin-bottom: 1rem; word-break: keep-all; }
  .blog-content strong { color: #f1f5f9; font-weight: 700; }
  .blog-content em { font-style: italic; }
  .blog-content u  { text-decoration: underline; }
  .blog-content blockquote { border-left: 4px solid #6366f1; background: rgba(99,102,241,0.06); padding: 1rem 1.25rem; margin: 1.5rem 0; border-radius: 0 0.75rem 0.75rem 0; color: #cbd5e1; font-size: 0.875rem; }
  .blog-content ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
  .blog-content ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
  .blog-content li { font-size: 0.875rem; color: #cbd5e1; line-height: 1.75; margin-bottom: 0.35rem; }
  .blog-content a  { color: #818cf8; text-decoration: underline; text-underline-offset: 2px; }
  .blog-content a:hover { color: #a5b4fc; }
  .blog-content code { background: #1e293b; color: #a5b4fc; padding: 0.15rem 0.45rem; border-radius: 0.3rem; font-size: 0.78rem; font-family: monospace; }
  .blog-content pre { background: #1e293b; border: 1px solid rgba(255,255,255,0.05); border-radius: 0.75rem; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
  .blog-content pre code { background: none; color: #94a3b8; font-size: 0.78rem; }
  .blog-content table { border-collapse: collapse; width: 100%; margin: 1.25rem 0; font-size: 0.8rem; }
  .blog-content th { background: rgba(255,255,255,0.04); padding: 0.6rem 0.9rem; text-align: left; font-weight: 700; color: #94a3b8; border: 1px solid rgba(255,255,255,0.08); }
  .blog-content td { padding: 0.6rem 0.9rem; color: #94a3b8; border: 1px solid rgba(255,255,255,0.05); }
  .blog-content hr { border-color: rgba(255,255,255,0.08); margin: 2rem 0; }
  .blog-content img { max-width: 100%; border-radius: 0.75rem; margin: 1rem 0; }
`;

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

  const schemas = generateAllSchemas(post);

  const catColor = CATEGORY_COLOR[post.category] ?? 'text-slate-400';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <style>{BLOG_CONTENT_STYLE}</style>
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
        <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />

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
