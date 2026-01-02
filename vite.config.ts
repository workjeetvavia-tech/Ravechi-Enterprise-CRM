import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This injects the environment variable API_KEY into the code wherever process.env.API_KEY is used
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    }
  }
})