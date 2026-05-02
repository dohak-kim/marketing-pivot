// Marketing-Pivot 통합 디자인 토큰
// Project AEGIS 디자인 시스템 기반 — 전 앱 공통 적용

export const BRAND = {
  primary:   '#5B52F5',  // indigo-500
  primaryDk: '#4A40DC',  // indigo-600
  accent:    '#14B89B',  // teal-500
  accentDk:  '#0D9480',  // teal-600
};

// Classic → Drastic 순서: Marketing Pivot — From Classic to Drastic
export const APPS = {
  aesa:        { color: '#2563EB', label: 'AEGIS AESA Radar',        icon: '📡', desc: 'Classic — PEST·3C·SWOT·STP 전략' },
  aegis:       { color: '#5B52F5', label: 'AEGIS C³ Cube Strategy',  icon: '⚡', desc: 'Drastic — C³ Cube Strategy Model' },
  cdj:         { color: '#F59E0B', label: 'AEGIS Pathfinder',  icon: '🗺️', desc: 'CDJ 고객 구매여정 분석' },
  cep:         { color: '#8B5CF6', label: 'AEGIS Signal',      icon: '📊', desc: 'CEP 트렌드·페르소나 분석' },
  video:       { color: '#EF4444', label: 'AEGIS Vision',      icon: '🎬', desc: '멀티모달 AEO/GEO 영상 분석' },
  forge:       { color: '#F97316', label: 'AEGIS FORGE',       icon: '⚒️', desc: 'AI 크리에이티브 제작 스튜디오' },
} as const;

export type AppKey = keyof typeof APPS;
