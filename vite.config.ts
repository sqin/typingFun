import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This maps the process.env.API_KEY used in the source code 
      // to the variable found in your local .env file.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    // Ensure relative paths work for deployment
    base: './',
  };
});