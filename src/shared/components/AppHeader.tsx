import React from 'react';

interface AppHeaderProps {
  icon: string;           // emoji or SVG
  name: string;           // "AEGIS AESA Radar"
  accentPart: string;     // colored word e.g. "AESA Radar"
  subtitle: string;
  accentColor: string;    // tailwind text color e.g. "text-blue-600"
  iconBg: string;         // tailwind bg e.g. "bg-blue-600"
  theme?: 'light' | 'dark';
  actions?: React.ReactNode;
}

// 모든 도구 앱 공통 헤더 — 통일된 규격
export default function AppHeader({
  icon, name, accentPart, subtitle, accentColor, iconBg,
  theme = 'dark', actions,
}: AppHeaderProps) {
  const isLight = theme === 'light';
  const base = isLight
    ? 'bg-white border-b border-slate-200'
    : 'bg-slate-900 border-b border-white/5';
  const titleColor  = isLight ? 'text-slate-900' : 'text-white';
  const subColor    = isLight ? 'text-slate-400'  : 'text-slate-500';
  const btnBase     = isLight
    ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700'
    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white';

  // name에서 accentPart를 제거한 prefix 부분
  const prefix = name.replace(accentPart, '').trim();

  return (
    <div className={`${base} px-6 py-3 flex items-center justify-between no-print`}>
      <div className="flex items-center gap-3">
        {/* 아이콘 박스 */}
        <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center text-white text-base shadow-sm shrink-0`}>
          {icon}
        </div>
        {/* 타이틀 */}
        <div>
          <h1 className={`text-sm font-black ${titleColor} tracking-tight leading-tight`}>
            {prefix && <span>{prefix} </span>}
            <span className={accentColor}>{accentPart}</span>
          </h1>
          <p className={`text-[10px] ${subColor} mt-0.5`}>{subtitle}</p>
        </div>
      </div>
      {/* 액션 버튼 영역 */}
      {actions && (
        <div className="flex items-center gap-2">
          {React.Children.map(actions as React.ReactElement, child =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<any>, {
                  className: `${(child.props as any).className || ''} text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${btnBase}`,
                })
              : child
          )}
        </div>
      )}
    </div>
  );
}
