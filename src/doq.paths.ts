/**
 * Shared, build-safe documentation paths. `vite.config.ts` and the Angular application both import
 * this module, so it must never import Angular components.
 */
export const doqPaths = {
  contentDirectory: 'docs', // src/content/docs
  basePath: '/docs',
} as const;
