/// <reference types="vitest" />
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  publicDir: 'public',
  server: {
    hmr: {
      overlay: false,
    },
  },
  ssr: {
    noExternal: ['@analogjs/router'],
  },
  plugins: [
    analog({
      ssr: mode !== 'development',
      prerender: {
        routes: [],
      },
      nitro: {
        preset: 'cloudflare-pages',
        externals: {
          inline: ['@analogjs/router'],
        },
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      quartz: resolve(__dirname, 'packages/quartz/src/public-api.ts'),
    },
  },
}));
