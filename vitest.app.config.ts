/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [angular()],
  resolve: {
    alias: {
      '@quartz-headless/core': resolve(__dirname, 'packages/core/src/public-api.ts'),
      '@quartz-headless/primitives': resolve(__dirname, 'packages/primitives/src/public-api.ts'),
    },
  },
  test: {
    name: 'quartz-app',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    environment: 'jsdom',
    include: ['src/app/services/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/app',
      all: true,
      include: ['src/app/services/*.ts'],
      exclude: ['**/*.spec.ts', '**/test-setup.ts', '**/test.d.ts'],
    },
  },
});
