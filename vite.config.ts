import { defineConfig, loadEnv  } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = parseInt(env.VITE_PORT) ||8080;
  return {
    base: "/",
    plugins: [react()],
    preview: {
      port,
      strictPort: true,
    },
    server: {
      port,
      strictPort: true,
      host: true,
      origin: `http://0.0.0.0:${port}`,
      allowedHosts: true,
    },
  }
});
