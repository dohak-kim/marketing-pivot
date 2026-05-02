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
  aesa:   { color: '#2563EB', label: 'AESA Rader',          icon: '📡', desc: 'Classic — PEST·3C·SWOT·STP 전략' },
  aegis:  { color: '#5B52F5', label: 'Project AEGIS',       icon: '⚡', desc: 'Drastic — C³ Cube Strategy Model' },
  cdj:    { color: '#F59E0B', label: 'CDJ 마스터',           icon: '🗺️', desc: '고객 구매여정 분석' },
  cep:    { color: '#8B5CF6', label: 'CEP Trend Analyzer',  icon: '📊', desc: 'CEP 트렌드·페르소나 분석' },
  video:  { color: '#EF4444', label: 'Video AEO/GEO',       icon: '🎬', desc: '영상 최적화 분석' },
} as const;

export type AppKey = keyof typeof APPS;
