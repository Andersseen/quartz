/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'QuartzWeb',
      fileName: (format) => `quartz-web.${format}.js`,
      formats: ['es', 'umd'],
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: '../../coverage/quartz-web',
      all: true,
      include: ['src/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/index.ts'],
    },
  },
});
