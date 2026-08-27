import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/core/vite.config.ts',
      'packages/primitives/vite.config.ts',
      'vitest.app.config.ts',
      'vitest.cli.config.ts',
    ],
  },
});
