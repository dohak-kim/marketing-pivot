import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent, Extension, ReactNodeViewRenderer } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';

// ── 커스텀 들여쓰기 익스텐션 (별도 패키지 불필요) ─────────────────────────
const Indent = Extension.create({
  name: 'indent',
  addOptions() { return { types: ['paragraph', 'heading'], step: 24, max: 120 }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        indent: {
          default: 0,
          parseHTML: el => parseInt(el.style.paddingLeft) || 0,
          renderHTML: attrs => attrs.indent > 0 ? { style: `padding-left:${attrs.indent}px` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }: any) => {
        state.doc.nodesBetween(state.selection.from, state.selection.to, (node: any, pos: number) => {
          if (this.options.types.includes(node.type.name)) {
            const next = Math.min((node.attrs.indent || 0) + this.options.step, this.options.max);
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
      outdent: () => ({ tr, state, dispatch }: any) => {
        state.doc.nodesBetween(state.selection.from, state.selection.to, (node: any, pos: number) => {
          if (this.options.types.includes(node.type.name)) {
            const next = Math.max((node.attrs.indent || 0) - this.options.step, 0);
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
    } as any;
  },
  addKeyboardShortcuts() {
    return {
      Tab:       () => (this.editor.commands as any).indent(),
      'Shift-Tab': () => (this.editor.commands as any).outdent(),
    };
  },
});
import { generateAllSchemas } from '@/lib/blogSchema';
import { generateBlogImage, type ImageStyleConfig, type ImageType, type ImageTone, type ImageColor } from '@/lib/imageService';
import type { BlogPost, BlogFaq, HowToStep, BlogQuote } from '@/types/blog';

// ── 상수 ──────────────────────────────────────────────────────────────────
const ADMIN_PW   = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'aegis2026';
const DRAFT_KEY  = 'blog-editor-draft';
const CATEGORIES = ['AEO 인사이트', 'CDJ 전략', 'C³ Cube', 'GEO 전략', '마케팅 인사이트'];
const DEFAULT_AUTHOR = { name: '김도학', role: 'CEO · 경영학 박사', org: '북경아이디어큐브컨설팅' };

function makeEmpty(): BlogPost {
  return {
    slug: '', title: '', description: '', excerpt: '',
    category: CATEGORIES[0], tags: [], author: DEFAULT_AUTHOR,
    publishedAt: new Date().toISOString().slice(0, 10),
    updatedAt:   new Date().toISOString().slice(0, 10),
    readingTime: 5, heroImage: '', content: '', faqs: [], howToSteps: [], quotes: [], published: true,
  };
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function calcReadTime(html: string) {
  const text = html.replace(/<[^>]+>/g, ' ');
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));
}

// ── 체크리스트 항목 ─────────────────────────────────────────────────────────
interface CheckItem {
  id: string;
  section: string;
  label: string;
  auto?: (post: BlogPost) => boolean;
}

const CHECKLIST: CheckItem[] = [
  { id: 'h1',        section: '본문 구조',   label: 'H1 태그는 핵심 키워드를 포함하여 제목에 작성되었는가?' },
  { id: 'h2h3',      section: '본문 구조',   label: 'H2/H3 태그는 질문형이거나 정보성 문장으로 계층에 맞게 구분되었는가?' },
  { id: 'snippet',   section: '본문 구조',   label: '핵심 요약, 불릿 포인트, FAQ 등 가독성 구조화 스니펫을 활용했는가?' },
  { id: 'slug',      section: '메타 데이터', label: 'URL 슬러그는 영문 소문자와 대시(-) 조합으로 간결하게 설정되었는가?', auto: p => /^[a-z0-9-]+$/.test(p.slug) && p.slug.length > 0 },
  { id: 'meta',      section: '메타 데이터', label: '메타 타이틀과 디스크립션은 글자 수에 맞게, 매력적인 문구로 작성되었는가?', auto: p => p.title.length >= 10 && p.description.length >= 50 && p.description.length <= 160 },
  { id: 'tags',      section: '메타 데이터', label: '전략적 해시태그(대중 키워드 + 전문 키워드)가 2개 이상 포함되었는가?', auto: p => p.tags.length >= 2 },
  { id: 'author',    section: '신뢰 및 시각', label: '저자, 발행일, 업데이트일 정보가 명확히 기재되었는가?', auto: p => !!p.author.name && !!p.publishedAt },
  { id: 'altimg',    section: '신뢰 및 시각', label: '삽입된 모든 이미지에 구체적인 ALT 태그를 입력했는가?' },
  { id: 'imgopt',    section: '신뢰 및 시각', label: '이미지 용량이 최적화(압축 또는 WebP 변환)되었는가?' },
  { id: 'links',     section: '확산 및 전환', label: '근거 데이터에 대한 외부 링크와 내부 링크가 삽입되었는가?' },
  { id: 'og',        section: '확산 및 전환', label: 'SNS 공유용 OG 썸네일 이미지(Hero Image)가 지정되었는가?', auto: p => !!p.heroImage },
  { id: 'cta',       section: '확산 및 전환', label: '본문 하단에 독자의 다음 행동을 유도하는 명확한 CTA가 존재하는가?' },
];

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
          <img src="/logo-aegis-icon.png" alt="Project AEGIS"
            className="h-14 w-auto object-contain mx-auto mb-3"
            style={{ filter: 'brightness(0) invert(1)' }} />
          <h1 className="text-white font-black text-base">Blog Admin</h1>
          <p className="text-slate-500 text-xs mt-1">Marketing Pivot · Project AEGIS</p>
        </div>
        <input type="password" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="Password" autoFocus
          className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors ${err ? 'border-rose-500' : 'border-white/10 focus:border-indigo-500'}`} />
        <button onClick={check}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-colors">
          로그인
        </button>
      </div>
    </div>
  );
}

// ── 툴바 버튼 ───────────────────────────────────────────────────────────────
function ToolBtn({ active, onClick, title, children }: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} title={title}
      className={`px-2 py-1 rounded text-xs font-bold transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
      {children}
    </button>
  );
}

const SEP = () => <div className="w-px h-4 bg-white/10 mx-0.5 shrink-0" />;

// ── 이미지 생성 모달 ───────────────────────────────────────────────────────
const IMAGE_TYPES:  ImageType[]  = ['Infographic', 'Illustration', 'Photography', 'Cartoon'];
const IMAGE_TONES:  ImageTone[]  = ['Professional', 'Friendly', 'Futuristic', 'Minimalist'];
const IMAGE_COLORS: ImageColor[] = ['Vibrant', 'Pastel', 'Monochrome', 'Warm', 'Cool'];

const TONE_KR:  Record<ImageTone,  string> = { Professional: '전문적', Friendly: '친근한', Futuristic: '미래적', Minimalist: '미니멀' };
const COLOR_KR: Record<ImageColor, string> = { Vibrant: '선명', Pastel: '파스텔', Monochrome: '모노크롬', Warm: '웜톤', Cool: '쿨톤' };
const TYPE_KR:  Record<ImageType,  string> = { Infographic: '인포그래픽', Illustration: '일러스트', Photography: '포토', Cartoon: '카툰' };

function ImageGenModal({ onInsert, onClose }: {
  onInsert: (src: string, alt: string) => void;
  onClose: () => void;
}) {
  const [heading, setHeading]   = useState('');
  const [context, setContext]   = useState('');
  const [style, setStyle]       = useState<ImageStyleConfig>({ type: 'Infographic', tone: 'Professional', color: 'Vibrant' });
  const [loading, setLoading]   = useState(false);
  const [preview, setPreview]   = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const generate = async () => {
    if (!heading.trim()) { setError('이미지 주제(섹션 제목)를 입력해주세요.'); return; }
    setLoading(true); setError(null); setPreview(null);
    try {
      const src = await generateBlogImage(heading, context, style);
      setPreview(src);
    } catch (e: any) {
      setError(e.message || '이미지 생성 중 오류가 발생했습니다.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-sm font-black text-white">🖼 AI 이미지 생성</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Gemini 2.5 Flash Image · 블로그 섹션용 16:9</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl transition-colors">✕</button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-5">
          {/* 왼쪽: 설정 */}
          <div className="space-y-4">
            <div>
              <label className="meta-label">섹션 제목 (이미지 주제)</label>
              <input value={heading} onChange={e => setHeading(e.target.value)}
                placeholder="예: AI 검색 최적화의 3단계"
                className="meta-input" />
            </div>
            <div>
              <label className="meta-label">맥락 설명 (선택)</label>
              <textarea value={context} onChange={e => setContext(e.target.value)}
                rows={3} placeholder="이미지와 함께 표현할 내용을 간략히 입력하세요"
                className="meta-input resize-none" />
            </div>

            {/* 스타일 설정 */}
            <div>
              <label className="meta-label">이미지 유형</label>
              <div className="grid grid-cols-2 gap-1.5">
                {IMAGE_TYPES.map(t => (
                  <button key={t} onClick={() => setStyle(s => ({ ...s, type: t }))}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${style.type === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'}`}>
                    {TYPE_KR[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="meta-label">톤</label>
              <div className="grid grid-cols-2 gap-1.5">
                {IMAGE_TONES.map(t => (
                  <button key={t} onClick={() => setStyle(s => ({ ...s, tone: t }))}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${style.tone === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'}`}>
                    {TONE_KR[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="meta-label">색상 팔레트</label>
              <div className="grid grid-cols-3 gap-1.5">
                {IMAGE_COLORS.map(c => (
                  <button key={c} onClick={() => setStyle(s => ({ ...s, color: c }))}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${style.color === c ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'}`}>
                    {COLOR_KR[c]}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generate} disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />생성 중...</>
              ) : '✨ 이미지 생성'}
            </button>
            {error && <p className="text-[10px] text-rose-400 text-center">{error}</p>}
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="flex flex-col gap-3">
            <label className="meta-label">미리보기</label>
            <div className="flex-1 bg-slate-800 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden aspect-video">
              {preview
                ? <img src={preview} alt="Generated" className="w-full h-full object-cover rounded-xl" />
                : <p className="text-[10px] text-slate-600 text-center px-4">이미지 생성 버튼을 클릭하면<br/>여기에 미리보기가 표시됩니다</p>
              }
            </div>
            {preview && (
              <button onClick={() => onInsert(preview, heading)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-colors">
                ✅ 에디터에 삽입
              </button>
            )}
            {preview && (
              <button onClick={generate} disabled={loading}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors">
                🔄 재생성
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const COLOR_PALETTE = [
  { label: '기본',   color: '' },
  { label: '흰색',   color: '#f1f5f9' },
  { label: '빨강',   color: '#ef4444' },
  { label: '주황',   color: '#f97316' },
  { label: '노랑',   color: '#f59e0b' },
  { label: '초록',   color: '#22c55e' },
  { label: '청록',   color: '#14b8a6' },
  { label: '파랑',   color: '#3b82f6' },
  { label: '인디고', color: '#6366f1' },
  { label: '보라',   color: '#8b5cf6' },
  { label: '핑크',   color: '#ec4899' },
  { label: '회색',   color: '#94a3b8' },
];

// ── WYSIWYG 툴바 ──────────────────────────────────────────────────────────
function EditorToolbar({ editor, onImageOpen }: {
  editor: ReturnType<typeof useEditor>;
  onImageOpen: () => void;
}) {
  const [colorOpen, setColorOpen] = useState(false);
  if (!editor) return null;

  const inTable = editor.isActive('table');
  const addLink = () => {
    const url = window.prompt('URL 입력 (외부 링크는 https:// 포함):', 'https://');
    if (url) editor.chain().focus().setLink({ href: url, target: '_blank', rel: 'noopener noreferrer' }).run();
  };
  const currentColor = editor.getAttributes('textStyle').color || '';

  return (
    <div className="border-b border-white/5 bg-slate-800/60 shrink-0">
      {/* ── 1행: 메인 서식 도구 ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5">
        {/* 문단 스타일 */}
        <select
          value={editor.isActive('heading', { level: 2 }) ? '2' : editor.isActive('heading', { level: 3 }) ? '3' : '0'}
          onChange={e => {
            const v = e.target.value;
            if (v === '0') editor.chain().focus().setParagraph().run();
            else editor.chain().focus().setHeading({ level: parseInt(v) as 2|3 }).run();
          }}
          className="bg-slate-700 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none">
          <option value="0">본문</option>
          <option value="2">H2 소목차</option>
          <option value="3">H3 세부</option>
        </select>

        <SEP />

        {/* 기본 서식 */}
        <ToolBtn active={editor.isActive('bold')}      onClick={() => editor.chain().focus().toggleBold().run()}      title="굵게 Ctrl+B"><b>B</b></ToolBtn>
        <ToolBtn active={editor.isActive('italic')}    onClick={() => editor.chain().focus().toggleItalic().run()}    title="기울임 Ctrl+I"><em>I</em></ToolBtn>
        <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="밑줄 Ctrl+U"><u>U</u></ToolBtn>

        <SEP />

        {/* 글자색 */}
        <div className="relative">
          <button onClick={() => setColorOpen(p => !p)} title="글자색"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
            <span className="font-bold" style={{ color: currentColor || '#f1f5f9', textShadow: currentColor ? 'none' : undefined }}>A</span>
            <div className="w-3 h-1 rounded-sm mt-0.5" style={{ background: currentColor || '#f1f5f9' }} />
          </button>
          {colorOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-white/10 rounded-xl p-2 shadow-2xl w-44">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">글자 색상</p>
              <div className="grid grid-cols-6 gap-1">
                {COLOR_PALETTE.map(({ label, color }) => (
                  <button key={label} title={label}
                    onClick={() => { color ? editor.chain().focus().setColor(color).run() : editor.chain().focus().unsetColor().run(); setColorOpen(false); }}
                    className="w-6 h-6 rounded border border-white/10 hover:scale-110 transition-transform flex items-center justify-center"
                    style={{ background: color || 'transparent' }}>
                    {!color && <span className="text-slate-400 text-[10px]">×</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {colorOpen && <div className="fixed inset-0 z-40" onClick={() => setColorOpen(false)} />}

        <SEP />

        {/* 정렬 */}
        <ToolBtn active={editor.isActive({ textAlign: 'left' })}    onClick={() => editor.chain().focus().setTextAlign('left').run()}    title="왼쪽 정렬">≡←</ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'center' })}  onClick={() => editor.chain().focus().setTextAlign('center').run()}  title="가운데 정렬">≡↔</ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'right' })}   onClick={() => editor.chain().focus().setTextAlign('right').run()}   title="오른쪽 정렬">≡→</ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="양쪽 정렬">≡≡</ToolBtn>

        <SEP />

        {/* 들여쓰기 */}
        <ToolBtn active={false} onClick={() => (editor.commands as any).outdent()} title="내어쓰기 Shift+Tab">←들여</ToolBtn>
        <ToolBtn active={false} onClick={() => (editor.commands as any).indent()}  title="들여쓰기 Tab">들여→</ToolBtn>

        <SEP />

        {/* 목록 & 인용 */}
        <ToolBtn active={editor.isActive('bulletList')}  onClick={() => editor.chain().focus().toggleBulletList().run()}  title="불릿 목록">• 목록</ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 목록">1. 목록</ToolBtn>
        <ToolBtn active={editor.isActive('blockquote')}  onClick={() => editor.chain().focus().toggleBlockquote().run()}  title="인용구">" "</ToolBtn>

        <SEP />

        {/* 삽입 */}
        <ToolBtn active={editor.isActive('link')} onClick={addLink} title="링크 삽입">🔗 링크</ToolBtn>
        <ToolBtn active={false} onClick={onImageOpen} title="AI 이미지 생성 및 삽입">🖼 이미지</ToolBtn>
        <ToolBtn active={false} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="표 삽입 (3×3)">⊞ 표</ToolBtn>
        <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선">— 선</ToolBtn>

        <SEP />

        {/* 실행 취소/다시 */}
        <ToolBtn active={false} onClick={() => editor.chain().focus().undo().run()} title="실행 취소 Ctrl+Z">↩</ToolBtn>
        <ToolBtn active={false} onClick={() => editor.chain().focus().redo().run()} title="다시 실행 Ctrl+Y">↪</ToolBtn>
      </div>

      {/* ── 2행: 표 편집 도구 (표 안에 커서 있을 때만 표시) ── */}
      {inTable && (
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-t border-white/5 bg-teal-500/5">
          <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest mr-1">표 편집</span>
          <SEP />
          <ToolBtn active={false} onClick={() => editor.chain().focus().addRowBefore().run()} title="위에 행 추가">↑ 행추가</ToolBtn>
          <ToolBtn active={false} onClick={() => editor.chain().focus().addRowAfter().run()}  title="아래에 행 추가">↓ 행추가</ToolBtn>
          <ToolBtn active={false} onClick={() => editor.chain().focus().deleteRow().run()}    title="현재 행 삭제">행 삭제</ToolBtn>
          <SEP />
          <ToolBtn active={false} onClick={() => editor.chain().focus().addColumnBefore().run()} title="왼쪽에 열 추가">← 열추가</ToolBtn>
          <ToolBtn active={false} onClick={() => editor.chain().focus().addColumnAfter().run()}  title="오른쪽에 열 추가">→ 열추가</ToolBtn>
          <ToolBtn active={false} onClick={() => editor.chain().focus().deleteColumn().run()}    title="현재 열 삭제">열 삭제</ToolBtn>
          <SEP />
          <ToolBtn active={false} onClick={() => editor.chain().focus().toggleHeaderRow().run()} title="헤더 행 토글">헤더</ToolBtn>
          <ToolBtn active={false} onClick={() => editor.chain().focus().mergeOrSplit().run()}    title="셀 병합/분할">병합</ToolBtn>
          <ToolBtn active={false} onClick={() => editor.chain().focus().deleteTable().run()}     title="표 전체 삭제">
            <span className="text-rose-400">표 삭제</span>
          </ToolBtn>
        </div>
      )}
    </div>
  );
}

// ── 체크리스트 패널 ────────────────────────────────────────────────────────
function ChecklistPanel({ post }: { post: BlogPost }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }));

  const sections = Array.from(new Set(CHECKLIST.map(i => i.section)));
  const total  = CHECKLIST.length;
  const passed = CHECKLIST.filter(i => i.auto ? i.auto(post) : checked[i.id]).length;
  const pct    = Math.round((passed / total) * 100);

  return (
    <div className="space-y-4">
      {/* 진행률 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-400">발행 전 체크리스트</span>
          <span className={`text-[10px] font-black ${pct === 100 ? 'text-emerald-400' : pct >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
            {passed}/{total} ({pct}%)
          </span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {sections.map(sec => (
        <div key={sec}>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">{sec}</p>
          <div className="space-y-2">
            {CHECKLIST.filter(i => i.section === sec).map(item => {
              const ok = item.auto ? item.auto(post) : !!checked[item.id];
              return (
                <div key={item.id}
                  onClick={() => !item.auto && toggle(item.id)}
                  className={`flex items-start gap-2 p-2.5 rounded-lg border transition-all ${ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-slate-900'} ${!item.auto ? 'cursor-pointer hover:border-white/10' : ''}`}>
                  <span className={`text-sm shrink-0 mt-0.5 ${ok ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {ok ? '✅' : '⬜'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-300 leading-relaxed break-keep">{item.label}</p>
                    {item.auto && (
                      <span className="text-[9px] text-slate-600">자동 감지</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 메인 에디터 ────────────────────────────────────────────────────────────
export default function BlogEditorApp() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('blog-admin') === '1');
  const [post, setPost]     = useState<BlogPost>(makeEmpty);
  const [tagsRaw, setTagsRaw]   = useState('');
  const [rightTab, setRightTab] = useState<'schema' | 'checklist'>('checklist');
  const [savedAt, setSavedAt]   = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false }),
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: '여기에 본문을 작성하세요. Word에서 복사한 내용을 그대로 붙여넣으면 서식이 자동으로 유지됩니다.' }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Indent,
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    editorProps: {
      attributes: { class: 'tiptap-editor outline-none min-h-[400px] p-4 text-sm text-slate-200 leading-7' },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setPost(prev => ({ ...prev, content: html, readingTime: calcReadTime(html) }));
    },
  });

  // 자동저장
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(post));
      setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 3000);
    return () => clearTimeout(saveTimer.current);
  }, [post]);

  const handleAuth = () => { sessionStorage.setItem('blog-admin', '1'); setAuthed(true); };

  // Signal → Blog Editor 주입
  useEffect(() => {
    if (!authed || !editor) return;
    const raw = sessionStorage.getItem('signal_to_blog');
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as { title: string; content: string; tags: string[]; excerpt: string };
      setPost(prev => ({
        ...prev,
        title: data.title || prev.title,
        slug: data.title ? toSlug(data.title) : prev.slug,
        excerpt: data.excerpt || prev.excerpt,
        tags: data.tags?.length ? data.tags : prev.tags,
        content: data.content || prev.content,
        readingTime: calcReadTime(data.content || ''),
      }));
      setTagsRaw((data.tags ?? []).join(', '));
      editor.commands.setContent(data.content || '');
    } catch {}
    sessionStorage.removeItem('signal_to_blog');
  }, [authed, editor]);

  const set = useCallback(<K extends keyof BlogPost>(key: K, val: BlogPost[K]) => {
    setPost(prev => {
      const next = { ...prev, [key]: val };
      if (key === 'title' && !prev.slug) next.slug = toSlug(val as string);
      return next;
    });
  }, []);

  const newPost = () => {
    const p = makeEmpty();
    setPost(p); setTagsRaw('');
    editor?.commands.setContent('');
  };

  const loadDraft = () => {
    try {
      const data = JSON.parse(localStorage.getItem(DRAFT_KEY) || '');
      setPost(data); setTagsRaw(data.tags.join(', '));
      editor?.commands.setContent(data.content || '');
    } catch {}
  };

  const importJson = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as BlogPost;
          setPost(data); setTagsRaw(data.tags.join(', '));
          editor?.commands.setContent(data.content || '');
        } catch { alert('JSON 파일을 불러올 수 없습니다.'); }
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
  const editFaq   = (i: number, f: keyof BlogFaq, v: string) =>
    set('faqs', post.faqs.map((item, idx) => idx === i ? { ...item, [f]: v } : item));

  const addStep    = () => set('howToSteps', [...(post.howToSteps ?? []), { name: '', text: '' }]);
  const removeStep = (i: number) => set('howToSteps', (post.howToSteps ?? []).filter((_, idx) => idx !== i));
  const editStep   = (i: number, f: keyof HowToStep, v: string) =>
    set('howToSteps', (post.howToSteps ?? []).map((s, idx) => idx === i ? { ...s, [f]: v } : s));

  const addQuote    = () => set('quotes', [...(post.quotes ?? []), { text: '', author: '', sourceUrl: '' }]);
  const removeQuote = (i: number) => set('quotes', (post.quotes ?? []).filter((_, idx) => idx !== i));
  const editQuote   = (i: number, f: keyof BlogQuote, v: string) =>
    set('quotes', (post.quotes ?? []).map((q, idx) => idx === i ? { ...q, [f]: v } : q));

  const schemas = generateAllSchemas(post) as object[];

  if (!authed) return <PasswordGate onAuth={handleAuth} />;

  return (
    <>
      {/* TipTap 에디터 스타일 */}
      <style>{`
        .tiptap-editor h2 { font-size: 1.1rem; font-weight: 900; color: #f1f5f9; margin: 2rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .tiptap-editor h3 { font-size: 0.95rem; font-weight: 800; color: #a5b4fc; margin: 1.25rem 0 0.5rem; }
        .tiptap-editor p  { color: #cbd5e1; line-height: 1.8; margin-bottom: 0.75rem; }
        .tiptap-editor strong { color: #f1f5f9; font-weight: 700; }
        .tiptap-editor em { font-style: italic; color: #cbd5e1; }
        .tiptap-editor u  { text-decoration: underline; }
        .tiptap-editor blockquote { border-left: 4px solid #6366f1; background: rgba(99,102,241,0.06); padding: 0.75rem 1rem; margin: 1rem 0; border-radius: 0 0.75rem 0.75rem 0; color: #cbd5e1; }
        .tiptap-editor ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .tiptap-editor ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .tiptap-editor li { color: #cbd5e1; line-height: 1.7; margin-bottom: 0.25rem; }
        .tiptap-editor a  { color: #818cf8; text-decoration: underline; }
        .tiptap-editor code { background: #1e293b; color: #a5b4fc; padding: 0.1rem 0.4rem; border-radius: 0.25rem; font-size: 0.8rem; font-family: monospace; }
        .tiptap-editor table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        .tiptap-editor th { background: rgba(255,255,255,0.05); padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 700; color: #94a3b8; border: 1px solid rgba(255,255,255,0.08); }
        .tiptap-editor td { padding: 0.5rem 0.75rem; font-size: 0.75rem; color: #94a3b8; border: 1px solid rgba(255,255,255,0.06); }
        .tiptap-editor hr { border-color: rgba(255,255,255,0.08); margin: 1.5rem 0; }
        .tiptap-editor img { max-width: 100%; border-radius: 0.75rem; margin: 1rem 0; display: block; }
        .tiptap-editor img.ProseMirror-selectednode { outline: 2px solid #6366f1; border-radius: 0.75rem; }
        .tiptap-editor .is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #475569; pointer-events: none; height: 0; }
      `}</style>

      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col" style={{ height: '100vh' }}>

        {/* 상단 툴바 */}
        <div className="shrink-0 border-b border-white/5 bg-slate-900 px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-aegis-icon.png" alt="AEGIS" className="h-6 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            <span className="text-sm font-black text-white">Blog Admin</span>
            {savedAt && <span className="text-[10px] text-slate-600">자동저장 {savedAt}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={newPost} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors">새 글</button>
            <button onClick={loadDraft} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors">임시글 불러오기</button>
            <button onClick={importJson} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors">JSON 가져오기</button>
            <button onClick={exportJson} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg transition-colors">JSON 내보내기 ↓</button>
          </div>
        </div>

        {/* 3열 */}
        <div className="flex flex-1 min-h-0">

          {/* ── 열 1: 메타 & SEO ── */}
          <div className="w-64 shrink-0 border-r border-white/5 bg-slate-900/40 overflow-y-auto">
            <div className="p-4 space-y-3">

              {/* 섹션: 본문 구조 */}
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest pt-1">① 본문 아키텍처</p>
              <div>
                <label className="meta-label">제목 (H1 · 핵심 키워드 포함)</label>
                <input value={post.title} onChange={e => set('title', e.target.value)}
                  placeholder="독자가 검색할 핵심 키워드를 제목에 포함하세요"
                  className="meta-input" />
              </div>
              <div>
                <label className="meta-label">카테고리</label>
                <select value={post.category} onChange={e => set('category', e.target.value)} className="meta-input">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* 섹션: 메타 데이터 */}
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest pt-2">② 검색 노출 포장</p>
              <div>
                <label className="meta-label">URL 슬러그 (영문-소문자-대시)</label>
                <input value={post.slug} onChange={e => set('slug', e.target.value)}
                  placeholder="senior-ai-care-2026"
                  className="meta-input font-mono text-slate-300" />
                {post.slug && !/^[a-z0-9-]+$/.test(post.slug) && (
                  <p className="text-[9px] text-rose-400 mt-0.5">⚠ 영문 소문자, 숫자, 대시(-)만 사용하세요</p>
                )}
              </div>
              <div>
                <label className="meta-label">메타 타이틀 <span className="text-slate-600 font-normal">{post.title.length}/140자</span></label>
                <input value={post.title} onChange={e => set('title', e.target.value)}
                  placeholder="클릭을 유도하는 제목 + Project AEGIS"
                  className="meta-input" />
              </div>
              <div>
                <label className="meta-label">메타 디스크립션 <span className={`font-normal ${post.description.length > 160 ? 'text-rose-400' : 'text-slate-600'}`}>{post.description.length}/160자</span></label>
                <textarea value={post.description} onChange={e => set('description', e.target.value)}
                  rows={3} placeholder="독자가 이 글을 읽어야 하는 명확한 이유(Benefit)를 키워드와 함께 작성"
                  className="meta-input resize-none" />
              </div>
              <div>
                <label className="meta-label">요약글 Excerpt <span className="text-slate-600 font-normal">카드 표시용</span></label>
                <textarea value={post.excerpt} onChange={e => set('excerpt', e.target.value)}
                  rows={2} placeholder="호기심을 자극하는 200자 이내 도입부"
                  className="meta-input resize-none" />
              </div>
              <div>
                <label className="meta-label">전략 해시태그 <span className="text-slate-600 font-normal">쉼표 구분 · 대중+전문 혼합</span></label>
                <input value={tagsRaw} onChange={e => {
                  setTagsRaw(e.target.value);
                  set('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean));
                }}
                  placeholder="#초고령사회, #멀티모달AI, #AEO전략"
                  className="meta-input" />
              </div>

              {/* 섹션: 신뢰 및 시각 */}
              <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest pt-2">③ 신뢰도 & 시각 최적화</p>
              <div>
                <label className="meta-label">저자</label>
                <input value={post.author.name} onChange={e => set('author', { ...post.author, name: e.target.value })}
                  className="meta-input" />
              </div>
              <div>
                <label className="meta-label">역할 / 소속</label>
                <input value={post.author.role} onChange={e => set('author', { ...post.author, role: e.target.value })}
                  className="meta-input" />
              </div>
              <div>
                <label className="meta-label">최초 발행일</label>
                <input type="date" value={post.publishedAt} onChange={e => set('publishedAt', e.target.value)} className="meta-input" />
              </div>
              <div>
                <label className="meta-label">최근 수정일</label>
                <input type="date" value={post.updatedAt || ''} onChange={e => set('updatedAt', e.target.value)} className="meta-input" />
              </div>
              <div>
                <label className="meta-label">읽기 시간 (분) <span className="text-slate-600 font-normal">자동계산</span></label>
                <input type="number" value={post.readingTime} onChange={e => set('readingTime', parseInt(e.target.value) || 1)} className="meta-input" />
              </div>

              {/* 섹션: 확산 및 전환 */}
              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest pt-2">④ 확산 & 전환</p>
              <div>
                <label className="meta-label">OG / Hero 이미지 URL <span className="text-slate-600 font-normal">SNS 썸네일</span></label>
                <input value={post.heroImage || ''} onChange={e => set('heroImage', e.target.value)}
                  placeholder="https://... (WebP 권장)"
                  className="meta-input" />
                {post.heroImage && (
                  <img src={post.heroImage} alt="OG preview" className="mt-1.5 w-full rounded-lg aspect-video object-cover opacity-80" />
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 pb-1">
                <button onClick={() => set('published', !post.published)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${post.published ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${post.published ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-xs text-slate-400">{post.published ? '게시됨' : '비공개'}</span>
              </div>

            </div>
          </div>

          {/* ── 열 2: WYSIWYG 에디터 + FAQ ── */}
          <div className="flex-1 flex flex-col min-h-0 border-r border-white/5">
            <EditorToolbar editor={editor} onImageOpen={() => setImageModalOpen(true)} />
            <div className="flex-1 overflow-y-auto bg-slate-950">
              <EditorContent editor={editor} />
            </div>

            {/* FAQ 빌더 */}
            <div className="shrink-0 border-t border-white/5 bg-slate-900/30 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  📌 FAQ <span className="text-slate-700 font-normal normal-case">FAQPage 스키마 자동 생성</span>
                </label>
                <button onClick={addFaq} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">+ 추가</button>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {post.faqs.map((faq, i) => (
                  <div key={i} className="bg-slate-900 border border-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-400 shrink-0">Q.</span>
                      <input value={faq.q} onChange={e => editFaq(i, 'q', e.target.value)}
                        placeholder="질문형 문장 권장"
                        className="flex-1 bg-slate-800 border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none" />
                      <button onClick={() => removeFaq(i)} className="text-slate-600 hover:text-rose-400 text-sm shrink-0">✕</button>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-slate-600 shrink-0 mt-1">A.</span>
                      <textarea value={faq.a} onChange={e => editFaq(i, 'a', e.target.value)}
                        rows={2} placeholder="명확하고 간결한 답변"
                        className="flex-1 bg-slate-800 border border-white/5 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none resize-none" />
                    </div>
                  </div>
                ))}
                {post.faqs.length === 0 && <p className="text-[10px] text-slate-700 text-center py-1">FAQ 추가 시 FAQPage 스키마 자동 생성</p>}
              </div>
            </div>

            {/* HowTo 단계 빌더 */}
            <div className="shrink-0 border-t border-white/5 bg-slate-900/20 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  🪜 HowTo 단계 <span className="text-slate-700 font-normal normal-case">HowTo 스키마 자동 생성</span>
                </label>
                <button onClick={addStep} className="text-[10px] font-bold text-teal-400 hover:text-teal-300 transition-colors">+ 단계 추가</button>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {(post.howToSteps ?? []).map((step, i) => (
                  <div key={i} className="bg-slate-900 border border-teal-500/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-teal-400 shrink-0 w-5">{i + 1}.</span>
                      <input value={step.name} onChange={e => editStep(i, 'name', e.target.value)}
                        placeholder="단계 제목 (예: 키워드 리서치)"
                        className="flex-1 bg-slate-800 border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none" />
                      <button onClick={() => removeStep(i)} className="text-slate-600 hover:text-rose-400 text-sm shrink-0">✕</button>
                    </div>
                    <textarea value={step.text} onChange={e => editStep(i, 'text', e.target.value)}
                      rows={2} placeholder="단계 설명"
                      className="w-full bg-slate-800 border border-white/5 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none resize-none" />
                  </div>
                ))}
                {!(post.howToSteps?.length) && <p className="text-[10px] text-slate-700 text-center py-1">단계 추가 시 HowTo 스키마 자동 생성 (AI 답변 최적화)</p>}
              </div>
            </div>

            {/* 핵심 인용구 빌더 */}
            <div className="shrink-0 border-t border-white/5 bg-slate-900/20 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  " " 핵심 인용구 <span className="text-slate-700 font-normal normal-case">Quotation 스키마 자동 생성</span>
                </label>
                <button onClick={addQuote} className="text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors">+ 인용 추가</button>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {(post.quotes ?? []).map((q, i) => (
                  <div key={i} className="bg-slate-900 border border-amber-500/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 text-sm shrink-0 mt-0.5">"</span>
                      <textarea value={q.text} onChange={e => editQuote(i, 'text', e.target.value)}
                        rows={2} placeholder="인용 문장 (통계, 전문가 코멘트 등)"
                        className="flex-1 bg-slate-800 border border-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none resize-none" />
                      <button onClick={() => removeQuote(i)} className="text-slate-600 hover:text-rose-400 text-sm shrink-0">✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={q.author ?? ''} onChange={e => editQuote(i, 'author', e.target.value)}
                        placeholder="출처 저자/기관"
                        className="bg-slate-800 border border-white/5 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none" />
                      <input value={q.sourceUrl ?? ''} onChange={e => editQuote(i, 'sourceUrl', e.target.value)}
                        placeholder="출처 URL (선택)"
                        className="bg-slate-800 border border-white/5 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none" />
                    </div>
                  </div>
                ))}
                {!(post.quotes?.length) && <p className="text-[10px] text-slate-700 text-center py-1">인용 추가 시 Quotation 스키마 자동 생성</p>}
              </div>
            </div>
          </div>

          {/* ── 열 3: 스키마 / 체크리스트 ── */}
          <div className="w-80 shrink-0 flex flex-col min-h-0">
            <div className="shrink-0 border-b border-white/5 flex">
              {(['checklist', 'schema'] as const).map(tab => (
                <button key={tab} onClick={() => setRightTab(tab)}
                  className={`flex-1 py-2.5 text-[11px] font-bold transition-colors border-b-2 ${rightTab === tab ? 'text-white border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                  {tab === 'checklist' ? '✅ 발행 체크리스트' : '{ } JSON-LD 스키마'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {rightTab === 'checklist'
                ? <ChecklistPanel post={post} />
                : (
                  <div className="space-y-4">
                    {schemas.length === 0
                      ? <p className="text-[10px] text-slate-700 text-center mt-10">글 정보를 입력하면 스키마가 생성됩니다.</p>
                      : schemas.map((s, i) => (
                        <div key={i}>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{(s as any)['@type']}</p>
                          <pre className="bg-slate-900 border border-white/5 rounded-xl p-3 text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                            {JSON.stringify(s, null, 2)}
                          </pre>
                        </div>
                      ))
                    }
                  </div>
                )
              }
            </div>
          </div>

        </div>
      </div>

      {/* 이미지 생성 모달 */}
      {imageModalOpen && (
        <ImageGenModal
          onClose={() => setImageModalOpen(false)}
          onInsert={(src, alt) => {
            editor?.chain().focus().setImage({ src, alt }).run();
            setImageModalOpen(false);
          }}
        />
      )}

      {/* 메타 인풋 공통 스타일 */}
      <style>{`
        .meta-label { display: block; font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
        .meta-input { width: 100%; background: #1e293b; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 6px 10px; font-size: 11px; color: #f1f5f9; outline: none; }
        .meta-input:focus { border-color: #6366f1; }
      `}</style>
    </>
  );
}
