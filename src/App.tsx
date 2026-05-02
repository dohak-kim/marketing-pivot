import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';

// ── 마케팅 페이지 ─────────────────────────────────────────────────────────
const Home     = lazy(() => import('@/pages/Home'));
const Guides   = lazy(() => import('@/pages/Guides'));
const Compare  = lazy(() => import('@/pages/Compare'));
const Blog     = lazy(() => import('@/pages/Blog'));
const Product  = lazy(() => import('@/pages/Product'));
const Pricing  = lazy(() => import('@/pages/Pricing'));

// ── 도구 ─────────────────────────────────────────────────────────────────
const AesaApp      = lazy(() => import('@/apps/aesa/App'));
const AegisApp     = lazy(() => import('@/apps/aegis/App'));
const PathfinderApp = lazy(() => import('@/apps/cdj/App'));
const SignalApp    = lazy(() => import('@/apps/cep/App'));
const VideoApp     = lazy(() => import('@/apps/video/App'));

// ── 네비게이션 설정 ───────────────────────────────────────────────────────
const SITE_NAV = [
  { path: '/product',  label: '솔루션' },
  { path: '/guides',   label: '가이드' },
  { path: '/compare',  label: '비교' },
  { path: '/blog',     label: '인사이트' },
  { path: '/pricing',  label: '요금제' },
];

const TOOLS = [
  { path: '/tools/aesa',        label: 'AEGIS AESA Radar',        icon: '📡' },
  { path: '/tools/c3',          label: 'AEGIS C³ Cube Strategy',  icon: '⚡' },
  { path: '/tools/pathfinder',  label: 'AEGIS Pathfinder',        icon: '🗺️' },
  { path: '/tools/signal',      label: 'AEGIS Signal',            icon: '📊' },
  { path: '/tools/video',       label: 'AEGIS Vision',            icon: '🎬' },
];


// ── 글로벌 네비게이션 ─────────────────────────────────────────────────────
function GlobalNav() {
  const { pathname } = useLocation();
  const [toolsOpen, setToolsOpen] = useState(false);
  const isToolPage = pathname.startsWith('/tools');

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex items-center h-14 gap-8">
          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-black text-white tracking-tight">
              Marketing<span className="text-indigo-400">·</span>Pivot
            </span>
            <span className="hidden sm:block text-[9px] text-slate-500 font-bold uppercase tracking-widest border-l border-white/10 pl-2">
              Project AEGIS
            </span>
          </Link>

          {/* 사이트 메뉴 */}
          <div className="flex items-center gap-1 flex-1">
            {SITE_NAV.map(({ path, label }) => (
              <NavLink key={path} to={path}
                className={({ isActive }) => `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isActive ? 'text-white bg-white/8' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {label}
              </NavLink>
            ))}
          </div>

          {/* 도구 버튼 */}
          <div className="relative shrink-0">
            <button onClick={() => setToolsOpen(!toolsOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border ${isToolPage || toolsOpen ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>
              <span>⚡</span>
              <span>도구 열기</span>
              <span className={`transition-transform ${toolsOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {/* 도구 드롭다운 */}
            {toolsOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-2.5 border-b border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Project AEGIS 도구</span>
                </div>
                {TOOLS.map(t => (
                  <Link key={t.path} to={t.path} onClick={() => setToolsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                    <span className="text-lg">{t.icon}</span>
                    <div className="text-xs font-black text-white">{t.label}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 도구 페이지 서브 네비 */}
        {isToolPage && (
          <div className="border-t border-white/5 bg-slate-900/80">
            <div className="max-w-7xl mx-auto px-6 flex items-center gap-1 h-9 overflow-x-auto no-scrollbar">
              {TOOLS.map(t => (
                <NavLink key={t.path} to={t.path}
                  className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* 드롭다운 닫기 오버레이 */}
      {toolsOpen && <div className="fixed inset-0 z-40" onClick={() => setToolsOpen(false)} />}
    </>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/tools')) return null;
  return (
    <footer className="bg-slate-950 border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-sm font-black text-white">Marketing<span className="text-indigo-400">·</span>Pivot</span>
          <p className="text-xs text-slate-500 mt-1">From Classic to Drastic · Project AEGIS</p>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-500">
          {SITE_NAV.map(n => <Link key={n.path} to={n.path} className="hover:text-slate-300 transition-colors">{n.label}</Link>)}
        </div>
        <p className="text-xs text-slate-600">© 2026 김도학 Ph.D. · dohak.kim@gmail.com</p>
      </div>
    </footer>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-500 text-sm animate-pulse">Loading...</div>
    </div>
  );
}

// ── 앱 루트 ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <GlobalNav />
      <main>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* 마케팅 페이지 */}
            <Route path="/"          element={<Home />} />
            <Route path="/guides"    element={<Guides />} />
            <Route path="/compare"   element={<Compare />} />
            <Route path="/blog"      element={<Blog />} />
            <Route path="/product"   element={<Product />} />
            <Route path="/pricing"   element={<Pricing />} />

            {/* 도구 */}
            <Route path="/tools/aesa/*"       element={<div className="pt-14"><AesaApp /></div>} />
            <Route path="/tools/c3/*"         element={<div className="pt-[5.5rem]"><AegisApp /></div>} />
            <Route path="/tools/pathfinder/*" element={<div className="pt-[5.5rem]"><PathfinderApp /></div>} />
            <Route path="/tools/signal/*"     element={<div className="pt-[5.5rem]"><SignalApp /></div>} />
            <Route path="/tools/video/*"      element={<div className="pt-[5.5rem]"><VideoApp /></div>} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
