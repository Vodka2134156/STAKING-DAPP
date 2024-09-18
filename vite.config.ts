import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import inject from '@rollup/plugin-inject'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    build:
      mode === 'production'
        ? {
            rollupOptions: {
              plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],
            },
          }
        : undefined,

    define:
      mode === 'development'
        ? {
            global: {},
          }
        : undefined,
  };
});