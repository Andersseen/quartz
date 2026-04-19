import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/quartz/vite.config.ts'
    ]
  }
});
