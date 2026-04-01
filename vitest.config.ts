import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'app/vite.config.ts',
      'packages/quartz/vite.config.ts'
    ]
  }
});
