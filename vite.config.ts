/// <reference types="vitest" />
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(() => ({
  publicDir: 'public',
  server: {
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    analog({
      // The docs are a client-side application. Deploying it statically avoids
      // shipping an SSR Pages worker and keeps every production route reliable.
      ssr: false,
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      quartz: resolve(__dirname, 'packages/quartz/src/public-api.ts'),
    },
  },
}));
