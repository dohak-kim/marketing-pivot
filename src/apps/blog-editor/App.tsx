import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateArticleSchema, generateFaqSchema, generateBreadcrumbSchema } from '@/lib/blogSchema';
import type { BlogPost, BlogFaq } from '@/types/blog';

const ADMIN_PW   = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'aegis2026';
const DRAFT_KEY  = 'blog-editor-draft';
const CATEGORIES = ['AEO 인사이트', 'CDJ 전략', 'C³ Cube', 'GEO 전략', '마케팅 인사이트'];
const DEFAULT_AUTHOR = { name: '김도학', role: 'CSO · 경영학 박사', org: '이너스커뮤니티' };

function makeEmpty(): BlogPost {
  return {
    slug: '', title: '', description: '', excerpt: '',
    category: CATEGORIES[0], tags: [], author: DEFAULT_AUTHOR,
    publishedAt: new Date().toISOString().slice(0, 10),
    updatedAt:   new Date().toISOString().slice(0, 10),
    readingTime: 5, heroImage: '', content: '', faqs: [], published: true,
  };
}

function toSlug(title: string) {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9ㄱ-힣-]/g, '').slice(0, 80);
}

function calcReadTime(text: string) {
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));
}

// ── 마크다운 미리보기 컴포넌트 ──────────────────────────────────────────────
const mdComp: Record<string, React.FC<any>> = {
  h2: ({ children }) => <h2 className="text-sm font-black text-white mt-6 mb-2 pb-1 border-b border-white/10">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xs font-black text-indigo-300 mt-4 mb-1.5">{children}</h3>,
  p:  ({ children }) => <p  className="text-xs text-slate-300 leading-relaxed mb-3 break-keep">{children}</p>,
  strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-indigo-500 bg-indigo-500/5 px-3 py-1 my-3 rounded-r-lg text-slate-300 text-xs">{children}</blockquote>
  ),
  code: ({ inline, children }: any) =>
    inline
      ? <code className="text-indigo-300 bg-slate-800 px-1 rounded text-[11px] font-mono">{children}</code>
      : <pre className="bg-slate-800 rounded-lg p-3 overflow-x-auto my-2"><code className="text-slate-300 text-[11px] font-mono">{children}</code></pre>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-slate-300">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-slate-300">{children}</ol>,
  li: ({ children }) => <li className="text-xs leading-relaxed">{children}</li>,
  table: ({ children }) => <div className="overflow-x-auto my-3"><table className="w-full text-xs border-collapse">{children}</table></div>,
  thead: ({ children }) => <thead className="border-b border-white/10 bg-slate-800/50">{children}</thead>,
  tr:   ({ children }) => <tr className="border-b border-white/5">{children}</tr>,
  th:   ({ children }) => <th className="text-left py-1.5 px-2 text-[10px] font-bold text-slate-300">{children}</th>,
  td:   ({ children }) => <td className="py-1.5 px-2 text-[10px] text-slate-400">{children}</td>,
  hr:   () => <hr className="border-white/10 my-4" />,
};

// ── 비밀번호 게이트 ─────────────────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw]   = useState('');
  const [err, setErr] = useState(false);

  const check = () => {
    if (pw === ADMIN_PW) { onAuth(); }
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 w-80 space-y-4 shadow-2xl">
        <div className="text-center">
          <img src="/logo-aegis-icon.png" alt="Project AEGIS" className="h-14 w-auto object-contain mx-auto mb-3" style={{ filter: 'brightness(0) invert(1)' }} />
          <h1 className="text-white font-black text-base">Blog Admin</h1>
          <p className="text-slate-500 text-xs mt-1">Marketing Pivot · Project AEGIS</p>
        </div>
        <input type="password" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="Password"
          autoFocus
          className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors ${err ? 'border-rose-500 animate-pulse' : 'border-white/10 focus:border-indigo-500'}`}
        />
        <button onClick={check}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-colors">
          로그인
        </button>
      </div>
    </div>
  );
}

// ── 메인 에디터 ────────────────────────────────────────────────────────────
export default function BlogEditorApp() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('blog-admin') === '1');
  const [post, setPost]     = useState<BlogPost>(makeEmpty);
  const [tagsRaw, setTagsRaw]   = useState('');
  const [rightTab, setRightTab] = useState<'preview' | 'schema'>('preview');
  const [savedAt, setSavedAt]   = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // 자동저장 (변경 3초 후)
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(post));
      setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 3000);
    return () => clearTimeout(saveTimer.current);
  }, [post]);

  const handleAuth = () => { sessionStorage.setItem('blog-admin', '1'); setAuthed(true); };

  const set = useCallback(<K extends keyof BlogPost>(key: K, val: BlogPost[K]) => {
    setPost(prev => {
      const next = { ...prev, [key]: val };
      if (key === 'title' && !prev.slug) next.slug = toSlug(val as string);
      if (key === 'content') next.readingTime = calcReadTime(val as string);
      return next;
    });
  }, []);

  const newPost = () => { setPost(makeEmpty()); setTagsRaw(''); };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as BlogPost;
      setPost(data);
      setTagsRaw(data.tags.join(', '));
    } catch {}
  };

  const importJson = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as BlogPost;
          setPost(data);
          setTagsRaw(data.tags.join(', '));
        } catch { alert('JSON 파일을 파싱할 수 없습니다.'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const exportJson = () => {
    const data = { ...post, tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${post.slug || 'post'}.json`; a.click();
  };

  const addFaq    = () => set('faqs', [...post.faqs, { q: '', a: '' }]);
  const removeFaq = (i: number) => set('faqs', post.faqs.filter((_, idx) => idx !== i));
  const editFaq   = (i: number, f: keyof BlogFaq, v: string) => {
    const next = post.faqs.map((item, idx) => idx === i ? { ...item, [f]: v } : item);
    set('faqs', next);
  };

  const schemas = [
    generateArticleSchema(post),
    post.faqs.length ? generateFaqSchema(post.faqs) : null,
    generateBreadcrumbSchema(post),
  ].filter(Boolean) as object[];

  if (!authed) return <PasswordGate onAuth={handleAuth} />;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col" style={{ height: '100vh' }}>

      {/* 상단 툴바 */}
      <div className="shrink-0 border-b border-white/5 bg-slate-900 px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-aegis-icon.png" alt="AEGIS" className="h-6 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          <span className="text-sm font-black text-white">Blog Admin</span>
          {savedAt && (
            <span className="text-[10px] text-slate-600">자동저장 {savedAt}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={newPost}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors">
            새 글
          </button>
          <button onClick={loadDraft}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors">
            임시글 불러오기
          </button>
          <button onClick={importJson}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors">
            JSON 가져오기
          </button>
          <button onClick={exportJson}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg transition-colors">
            JSON 내보내기 ↓
          </button>
        </div>
      </div>

      {/* 3열 본문 */}
      <div className="flex flex-1 min-h-0">

        {/* 열 1: 메타 설정 */}
        <div className="w-60 shrink-0 border-r border-white/5 bg-slate-900/40 overflow-y-auto p-4 space-y-3.5">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">메타 설정</p>

          {[
            { label: '제목', key: 'title' as const, placeholder: '글 제목' },
            { label: '슬러그', key: 'slug' as const, placeholder: 'url-slug', mono: true },
          ].map(({ label, key, placeholder, mono }) => (
            <div key={key}>
              <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
              <input value={post[key] as string} onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-slate-800 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 ${mono ? 'font-mono text-slate-300' : ''}`}
              />
            </div>
          ))}

          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              설명 SEO <span className="text-slate-600 normal-case">{post.description.length}/160</span>
            </label>
            <textarea value={post.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="SEO meta description (160자 이내)"
              className="w-full bg-slate-800 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none" />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">요약 (카드 표시)</label>
            <textarea value={post.excerpt} onChange={e => set('excerpt', e.target.value)}
              rows={2} placeholder="2-3줄 요약"
              className="w-full bg-slate-800 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none" />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">카테고리</label>
            <select value={post.category} onChange={e => set('category', e.target.value)}
              className="w-full bg-slate-800 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">태그 (쉼표 구분)</label>
            <input value={tagsRaw} onChange={e => {
              setTagsRaw(e.target.value);
              set('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean));
            }}
              placeholder="GEO, AEO, 마케팅전략"
              className="w-full bg-slate-800 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">발행일</label>
            <input type="date" value={post.publishedAt} onChange={e => set('publishedAt', e.target.value)}
              className="w-full bg-slate-800 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
              읽기 시간 (분) <span className="text-slate-600 normal-case font-normal">자동 계산됨</span>
            </label>
            <input type="number" value={post.readingTime} onChange={e => set('readingTime', parseInt(e.target.value) || 1)}
              className="w-full bg-slate-800 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Hero 이미지 URL</label>
            <input value={post.heroImage || ''} onChange={e => set('heroImage', e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-800 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => set('published', !post.published)}
              className={`relative w-9 h-5 rounded-full transition-colors ${post.published ? 'bg-indigo-600' : 'bg-slate-700'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${post.published ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-xs text-slate-400">{post.published ? '게시됨' : '비공개'}</span>
          </div>
        </div>

        {/* 열 2: 본문 에디터 + FAQ */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-white/5">
          {/* 마크다운 에디터 */}
          <div className="flex-1 flex flex-col p-4 min-h-0">
            <label className="block text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-widest shrink-0">
              본문 Markdown · {calcReadTime(post.content)}분 읽기 추정
            </label>
            <textarea
              value={post.content}
              onChange={e => set('content', e.target.value)}
              spellCheck={false}
              placeholder={`## Executive Summary\n\n본문을 Markdown으로 작성하세요.\n\n## 1. 섹션 제목\n\n내용...`}
              className="flex-1 bg-slate-900 border border-white/5 rounded-xl p-4 text-xs text-slate-200 font-mono leading-6 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* FAQ 빌더 */}
          <div className="shrink-0 border-t border-white/5 p-4">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                FAQ ({post.faqs.length}개)
              </label>
              <button onClick={addFaq}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                + 추가
              </button>
            </div>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {post.faqs.map((faq, i) => (
                <div key={i} className="bg-slate-900 border border-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-400 shrink-0">Q.</span>
                    <input value={faq.q} onChange={e => editFaq(i, 'q', e.target.value)}
                      placeholder="질문"
                      className="flex-1 bg-slate-800 border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none" />
                    <button onClick={() => removeFaq(i)} className="text-slate-600 hover:text-rose-400 text-sm shrink-0">✕</button>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-600 shrink-0 mt-1">A.</span>
                    <textarea value={faq.a} onChange={e => editFaq(i, 'a', e.target.value)}
                      rows={2} placeholder="답변"
                      className="flex-1 bg-slate-800 border border-white/5 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none resize-none" />
                  </div>
                </div>
              ))}
              {post.faqs.length === 0 && (
                <p className="text-[10px] text-slate-700 text-center py-2">+ 추가 버튼으로 FAQ를 입력하세요</p>
              )}
            </div>
          </div>
        </div>

        {/* 열 3: 미리보기 / 스키마 */}
        <div className="w-96 shrink-0 flex flex-col min-h-0">
          <div className="shrink-0 border-b border-white/5 flex">
            {(['preview', 'schema'] as const).map(tab => (
              <button key={tab} onClick={() => setRightTab(tab)}
                className={`flex-1 py-2.5 text-[11px] font-bold transition-colors border-b-2 ${
                  rightTab === tab
                    ? 'text-white border-indigo-500'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}>
                {tab === 'preview' ? '미리보기' : 'JSON-LD 스키마'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === 'preview' ? (
              post.content
                ? <ReactMarkdown components={mdComp}>{post.content}</ReactMarkdown>
                : <p className="text-[10px] text-slate-700 text-center mt-10">본문을 입력하면 미리보기가 표시됩니다.</p>
            ) : (
              <div className="space-y-4">
                {schemas.length === 0 && (
                  <p className="text-[10px] text-slate-700 text-center mt-10">글 정보를 입력하면 스키마가 생성됩니다.</p>
                )}
                {schemas.map((s, i) => (
                  <div key={i}>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      {(s as any)['@type']}
                    </p>
                    <pre className="bg-slate-900 border border-white/5 rounded-xl p-3 text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(s, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
