import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { posts } from '@/data/posts';
import type { BlogPost } from '@/types/blog';

const CATEGORY_COLOR: Record<string, { badge: string }> = {
  'AEO 인사이트':    { badge: 'text-indigo-400  bg-indigo-400/10  border-indigo-400/20' },
  'CDJ 전략':        { badge: 'text-amber-400   bg-amber-400/10   border-amber-400/20'  },
  'C³ Cube':         { badge: 'text-violet-400  bg-violet-400/10  border-violet-400/20' },
  'GEO 전략':        { badge: 'text-teal-400    bg-teal-400/10    border-teal-400/20'   },
  '마케팅 인사이트':  { badge: 'text-rose-400    bg-rose-400/10    border-rose-400/20'   },
};
const DEFAULT_BADGE = 'text-slate-400 bg-slate-400/10 border-slate-400/20';

function PostCard({ post }: { post: BlogPost }) {
  const badge = (CATEGORY_COLOR[post.category] ?? { badge: DEFAULT_BADGE }).badge;
  return (
    <Link to={`/blog/${post.slug}`}
      className="group flex flex-col p-5 rounded-2xl bg-white border border-gray-200 hover:border-indigo-400/50 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${badge}`}>
          {post.category}
        </span>
        <span className="text-[10px] text-slate-400">{post.readingTime}분</span>
      </div>

      <h2 className="text-sm font-black text-slate-900 leading-snug mb-2 break-keep group-hover:text-indigo-600 transition-colors flex-1"
        style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {post.title}
      </h2>

      <p className="text-xs text-slate-500 leading-relaxed mb-4 break-keep"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {post.excerpt}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] font-black text-white">
            {post.author.name[0]}
          </div>
          <span className="text-[11px] text-slate-600">{post.author.name}</span>
        </div>
        <span className="text-[10px] text-slate-400">{post.publishedAt.slice(0, 7).replace('-', '.')}</span>
      </div>

      {post.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {post.tags.slice(0, 3).map(t => (
            <span key={t} className="text-[9px] text-slate-500 bg-gray-100 px-1.5 py-0.5 rounded">#{t}</span>
          ))}
        </div>
      )}
    </Link>
  );
}

export default function Blog() {
  const published = useMemo(() =>
    posts.filter(p => p.published)
         .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
  []);

  const categories = useMemo(() =>
    ['전체', ...Array.from(new Set(published.map(p => p.category)))],
  [published]);

  const [active, setActive] = useState('전체');
  const filtered = active === '전체' ? published : published.filter(p => p.category === active);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Blog',
        name: 'Marketing Pivot 인사이트',
        url: 'https://marketing-pivot.vercel.app/blog',
        description: 'AI 검색 최적화(AEO·GEO)와 마케팅 전략 실증 데이터 기반 인사이트',
        author: { '@type': 'Person', name: '김도학', jobTitle: 'CEO · 경영학 박사' },
      })}} />

      <div className="max-w-5xl mx-auto px-6 pt-16 pb-20">
        <div className="mb-10">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">G — Generation</span>
          <h1 className="text-3xl font-black text-slate-900 mt-2 mb-2 tracking-tight">인사이트 리포트</h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-lg break-keep">
            AI 검색 최적화(AEO·GEO)와 마케팅 전략에 관한 실증 데이터 기반 인사이트.
            30년 현장 경험과 AI를 결합한 김도학 박사의 연구를 공유합니다.
          </p>
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActive(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                  active === cat
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-gray-200 text-slate-500 hover:border-gray-400 hover:text-slate-900'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(post => <PostCard key={post.slug} post={post} />)}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-slate-400 text-sm">
              {published.length === 0
                ? 'Marketing Pivot 책의 챕터별 인사이트가 곧 공개됩니다.'
                : '해당 카테고리의 글이 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
