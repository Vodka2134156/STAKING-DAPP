import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import inject from '@rollup/plugin-inject';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';


export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      // Only inject Buffer in development with esbuild polyfills
      ...(mode === 'development'
        ? [
            {
              name: 'esbuild-polyfills',
              apply: 'serve',
              setup(build) {
                build.onResolve({ filter: /^buffer$/ }, () => ({
                  path: require.resolve('buffer/'),
                }));
              },
            },
          ]
        : []),
    ],
    build: {
      rollupOptions: {
        plugins: [
          // In production, inject Buffer using Rollup's inject plugin
          inject({ Buffer: ['buffer', 'Buffer'] }),
        ],
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        // Enable esbuild polyfill plugins in development
        define: {
          global: 'globalThis',
        },
        plugins: [
          // Include Buffer polyfill for development mode
          NodeGlobalsPolyfillPlugin({
            buffer: true,
          }),
        ],
      },
    },
    define:
      mode === 'development'
        ? {
            global: 'globalThis', // Ensure globalThis is used in development
          }
        : undefined,
  };
});
