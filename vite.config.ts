/// <reference types="vitest" />
import analog from '@analogjs/platform';
import { doqPrerenderRoutes } from '@doqs/analog';
import { doqContent } from '@doqs/analog/content';
import { doqDeterministicMarkdown } from '@doqs/analog/vite';
import { doqPaths } from './src/doq.paths';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';

/**
 * Runs Vite environment builds (client, then SSR) strictly one after the other.
 *
 * @analogjs/vite-plugin-nitro builds both environments with `Promise.all`, and with `sharedPlugins`
 * they share ONE @analogjs/vite-plugin-angular instance whose AOT output lives in a single map that
 * every environment's `buildEnd` clears. Whichever environment finished first wiped the map while
 * the other was still transforming lazy modules, so the home page and the components catalogue
 * shipped as raw decorators and crashed at runtime with "JIT compiler unavailable" (about every
 * second warm build; see docs/releases/0.17-acceptance.md). Serialising the builds removes the race
 * without touching Analog and without retrying anything.
 */
function sequentialEnvironmentBuilds(): Plugin {
  return {
    name: 'quartz:sequential-environment-builds',
    enforce: 'post',
    configResolved(config) {
      const original = config.builder?.buildApp;
      if (!config.builder || !original) return;
      config.builder.buildApp = async (builder) => {
        let tail: Promise<unknown> = Promise.resolve();
        const sequential = Object.create(builder, {
          build: {
            value: (environment: Parameters<typeof builder.build>[0]) => {
              const run = tail.then(() => builder.build(environment));
              tail = run.catch(() => undefined);
              return run;
            },
          },
        });
        await original(sequential);
      };
    },
  };
}

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
    sequentialEnvironmentBuilds(),
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
