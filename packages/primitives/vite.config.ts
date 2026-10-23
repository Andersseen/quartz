/// <reference types="vitest" />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'node:path';

export default defineConfig(() => ({
  plugins: [angular()],
  resolve: {
    // The Forms entry point imports its sibling entry by package name; ng-packagr maps that
    // during the build, so tests map it to source. Core still resolves through node_modules.
    alias: [
      {
        find: /^@quartz-headless\/primitives\/forms$/,
        replacement: resolve(__dirname, 'forms/src/public-api.ts'),
      },
      {
        find: /^@quartz-headless\/primitives$/,
        replacement: resolve(__dirname, 'src/public-api.ts'),
      },
    ],
  },
  test: {
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    environment: 'jsdom',
    include: ['src/**/*.spec.ts', 'forms/src/**/*.spec.ts'],
    reporters: ['default'],
  },
}));
