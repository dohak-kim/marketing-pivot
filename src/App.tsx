import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { APPS, AppKey } from '@/shared/design/tokens';

const AegisApp  = lazy(() => import('@/apps/aegis/App'));
const CdjApp    = lazy(() => import('@/apps/cdj/App'));
const AesaApp   = lazy(() => import('@/apps/aesa/App'));
const CepApp    = lazy(() => import('@/apps/cep/App'));
const VideoApp  = lazy(() => import('@/apps/video/App'));

const NAV_ITEMS: { path: string; key: AppKey }[] = [
  { path: '/',       key: 'aegis'  },
  { path: '/cdj',    key: 'cdj'    },
  { path: '/aesa',   key: 'aesa'   },
  { path: '/cep',    key: 'cep'    },
  { path: '/video',  key: 'video'  },
];

function GlobalNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 h-12">
        {/* 로고 */}
        <span className="text-[11px] font-black text-white tracking-widest uppercase mr-4 shrink-0">
          Marketing<span className="text-indigo-400">·</span>Pivot
        </span>
        <div className="w-px h-5 bg-white/10 mr-3 shrink-0" />
        {/* 앱 탭 */}
        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map(({ path, key }) => {
            const app = APPS[key];
            const isActive = path === '/' ? pathname === '/' : pathname.startsWith(path);
            return (
              <NavLink
                key={key}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{app.icon}</span>
                <span>{app.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-500 text-sm animate-pulse">Loading...</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <GlobalNav />
      <div className="pt-12">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/"       element={<AegisApp />} />
            <Route path="/cdj/*"  element={<CdjApp />} />
            <Route path="/aesa/*" element={<AesaApp />} />
            <Route path="/cep/*"  element={<CepApp />} />
            <Route path="/video/*" element={<VideoApp />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
