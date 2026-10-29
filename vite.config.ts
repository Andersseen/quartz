/// <reference types="vitest" />
import analog from '@analogjs/platform';
import { doqPrerenderRoutes } from '@doqs/analog';
import { doqContent } from '@doqs/analog/content';
import { doqDeterministicMarkdown } from '@doqs/analog/vite';
import { doqPaths } from './src/doq.paths';
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
    // Resolves ::source, ::include and [[api:]] from src/authoring into src/content before Analog loads pages.
    doqContent(),
    analog({
      // Static prerendering: every route in `prerender.routes` becomes plain HTML that hydrates
      // on the client, so Cloudflare Pages serves files only (no SSR worker).
      ssr: true,
      static: true,
      content: { highlighter: 'prism' },
      prerender: {
        routes: async () => [
          '/',
          '/components',
          // Browser-contract fixtures driven by Playwright (unstyled, not linked from the site).
          '/e2e-forms',
          '/e2e-floating',
          '/e2e-layers',
          '/e2e-selection',
          '/e2e-range',
          '/e2e-calendar',
          '/e2e-navigation',
          '/e2e-feedback',
          '/e2e-floating-016',
          ...doqPrerenderRoutes(doqPaths),
        ],
      },
    }),
    // Renders Markdown one file at a time so duplicate-heading ids are identical between builds.
    doqDeterministicMarkdown(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@quartz-headless/core': resolve(__dirname, 'packages/core/src/public-api.ts'),
      '@quartz-headless/primitives/forms': resolve(
        __dirname,
        'packages/primitives/forms/src/public-api.ts',
      ),
      '@quartz-headless/primitives': resolve(__dirname, 'packages/primitives/src/public-api.ts'),
    },
  },
}));
