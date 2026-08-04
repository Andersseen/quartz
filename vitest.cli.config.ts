/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'quartz-cli',
    globals: true,
    environment: 'node',
    include: ['cli/**/*.spec.js'],
    reporters: ['default'],
  },
});
