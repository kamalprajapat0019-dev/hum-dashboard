import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const PRODUCTION_BACKEND_URL = 'https://hum-dashboard-p8wn.vercel.app';
const LOCAL_BACKEND_URL = 'http://localhost:5000/api/v1';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const resolvedApiBase =
    process.env.VITE_API_BASE_URL ||
    env.VITE_API_BASE_URL ||
    (mode === 'production' ? PRODUCTION_BACKEND_URL : LOCAL_BACKEND_URL);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(resolvedApiBase),
    },
  };
});
