import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const DEV_SITE_BASE_URL = 'http://localhost:5173';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  //* index.html interpolates %VITE_SITE_BASE_URL% (canonical/og:url) - an unset
  //* var would ship the literal placeholder. Production builds must set it;
  //* the dev server falls back to the local Vite origin
  if (!env.VITE_SITE_BASE_URL) {
    if (command === 'build') {
      throw new Error('VITE_SITE_BASE_URL must be set for production builds (see .env.example)');
    }

    process.env.VITE_SITE_BASE_URL = DEV_SITE_BASE_URL;
  }

  return {
    plugins: [react()],
  };
});
