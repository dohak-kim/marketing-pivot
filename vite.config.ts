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
  };
});
