/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'quartz-release',
    globals: true,
    environment: 'node',
    include: ['scripts/**/*.spec.mjs'],
    testTimeout: 30000,
    reporters: ['default'],
  },
});
