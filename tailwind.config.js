/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Marketing-Pivot 브랜드 (AEGIS 기반)
        indigo: {
          50: '#F0EFFF', 100: '#E4E3FF', 200: '#CCCAFF', 300: '#A9A6FF',
          400: '#8279FF', 500: '#5B52F5', 600: '#4A40DC', 700: '#3830B8',
          800: '#29239A', 900: '#1C1872', 950: '#0D0B42',
        },
        slate: {
          50: '#F6F6FE', 100: '#EDEDFB', 200: '#DCDCF5', 300: '#C2C1E8',
          400: '#9291CC', 500: '#6B6AAA', 600: '#525190', 700: '#3D3C72',
          800: '#292858', 850: '#1D1C42', 900: '#131230', 950: '#08071C',
        },
        // CDJ 마스터 전용 토큰
        'brand-dark':     '#1a1a2e',
        'brand-gold':     '#f0a500',
        'brand-positive': '#4caf50',
        'brand-negative': '#f44336',
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'brand-sm':   '0 1px 3px rgba(91,82,245,0.12), 0 1px 2px rgba(91,82,245,0.08)',
        'brand-md':   '0 4px 12px rgba(91,82,245,0.18), 0 2px 4px rgba(91,82,245,0.10)',
        'brand-lg':   '0 8px 30px rgba(91,82,245,0.24), 0 4px 8px rgba(91,82,245,0.12)',
        'brand-glow': '0 0 40px rgba(91,82,245,0.35)',
      },
      animation: {
        'in':                      'in 0.15s ease-out',
        'fade-in':                 'fadeIn 0.3s ease-out',
        'slide-in-from-bottom-4':  'slideUp4 0.3s ease-out',
        'slide-in-from-bottom-8':  'slideUp8 0.4s ease-out',
        'zoom-in-95':              'zoomIn95 0.2s ease-out',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' },                          to: { opacity: '1' } },
        slideUp4: { from: { opacity: '0', transform: 'translateY(1rem)' },  to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp8: { from: { opacity: '0', transform: 'translateY(2rem)' },  to: { opacity: '1', transform: 'translateY(0)' } },
        zoomIn95: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
