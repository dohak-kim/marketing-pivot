import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/serper': {
          target: 'https://google.serper.dev',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/serper/, ''),
        },
        '/api/naver': {
          target: 'https://openapi.naver.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/naver/, ''),
        },
        '/api/naver-ad': {
          target: 'https://api.naver.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/naver-ad/, ''),
        },
        '/api/news': {
          target: 'https://openapi.naver.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/news/, '/v1/search/news.json'),
          headers: {
            'X-Naver-Client-Id':     env.NAVER_CLIENT_ID     || '',
            'X-Naver-Client-Secret': env.NAVER_CLIENT_SECRET  || '',
          },
        },
        '/api/datalab': {
          target: 'https://openapi.naver.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/datalab/, '/v1/datalab'),
          headers: {
            'X-Naver-Client-Id':     env.NAVER_CLIENT_ID     || '',
            'X-Naver-Client-Secret': env.NAVER_CLIENT_SECRET  || '',
          },
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY':        JSON.stringify((env.GEMINI_API_KEY || env.VITE_API_KEY || env.API_KEY || '').trim()),
      'process.env.GEMINI_API_KEY': JSON.stringify((env.GEMINI_API_KEY || env.VITE_API_KEY || env.API_KEY || '').trim()),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;

            // React 코어 — 모든 앱 공유
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'vendor-react';
            }
            // React Router — 모든 앱 공유
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // Gemini SDK — AI 기능 있는 모든 앱 공유 (한 번만 다운로드)
            if (id.includes('@google/genai')) {
              return 'vendor-genai';
            }
            // 차트 라이브러리 — C³, AESA, Vision 3개 앱 공유
            if (id.includes('chart.js') || id.includes('react-chartjs') || id.includes('/recharts/')) {
              return 'vendor-charts';
            }
            // D3 + force graph — C³ 전용이나 큰 라이브러리(~160KB)라 별도 캐시 이점
            if (id.includes('/d3-') || id.includes('/d3/') || id.includes('react-force-graph') || id.includes('force-graph')) {
              return 'vendor-d3';
            }
            // @react-pdf/renderer — AESA 전용이나 2MB+ 라 별도 캐시 이점
            if (id.includes('@react-pdf')) {
              return 'vendor-react-pdf';
            }
          },
        },
      },
    },
  };
});
