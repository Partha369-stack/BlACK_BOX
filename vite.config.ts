import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: {
        overlay: false
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      global: 'window',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Prevent Node.js modules from being externalized
        events: 'events',
      }
    },
    optimizeDeps: {
      include: ['parse'],
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    }
  };
});
