import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/core/vite.config.ts',
      'packages/primitives/vite.config.ts',
      'vitest.app.config.ts',
      'vitest.cli.config.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
      include: ['packages/{core,primitives}/src/**/*.ts'],
      exclude: [
        '**/*.spec.ts',
        '**/index.ts',
        '**/public-api.ts',
        '**/test-setup.ts',
        '**/test.d.ts',
      ],
      thresholds: {
        statements: 89,
        lines: 89,
        functions: 91,
        branches: 73,
        'packages/core/src/**': {
          statements: 87,
          lines: 88,
          functions: 88,
          branches: 77,
        },
        'packages/primitives/src/**': {
          statements: 89,
          lines: 89,
          functions: 92,
          branches: 72,
        },
      },
    },
  },
});
