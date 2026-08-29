import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Local: Vite :3000 proxies /api → API_PROXY_TARGET (default :3001).
      // Express listens on PORT (default 8080 in production). Align them:
      //   PORT=3001 node server/index.js
      //   or API_PROXY_TARGET=http://127.0.0.1:8080
      proxy: {
        '/api': {
          target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
