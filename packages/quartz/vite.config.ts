/// <reference types="vitest" />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(() => ({
  plugins: [angular()],
  test: {
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: '../../coverage/quartz',
      all: true,
      include: ['src/core/**/*.ts', 'src/primitives/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/index.ts', '**/public-api.ts', '**/test-setup.ts'],
    },
  },
}));
