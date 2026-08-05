import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function normalizeToolPath(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '') || 'md2pdf';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const toolPath = normalizeToolPath(env.VITE_TOOL_PATH || 'md2pdf');

  return {
    base: `/${toolPath}/`,
    plugins: [react()],
    build: {
      target: 'es2020'
    }
  };
});
