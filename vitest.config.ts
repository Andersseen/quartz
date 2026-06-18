import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/quartz/vite.config.ts',
      'packages/quartz-web/vite.config.ts',
      'vitest.app.config.ts',
    ],
  },
});
