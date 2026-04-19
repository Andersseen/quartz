/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [angular()],
  resolve: {
    alias: {
      quartz: resolve(__dirname, 'packages/quartz/src/public-api.ts'),
    },
  },
  test: {
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
