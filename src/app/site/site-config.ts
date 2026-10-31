/**
 * Site-level facts shown in the website chrome. Keep them in one place so copy cannot drift.
 *
 * `LATEST_NPM_VERSION` is the newest version that exists on npm. It is deliberately NOT read from
 * `packages/*\/package.json`: manifests can run ahead of the registry (0.17-0.19 are merged but
 * unpublished), and the site must never call an unpublished version released. Update it only after
 * the guarded publish workflow has put the version on npm (see docs/releases/RELEASE_RUNBOOK.md).
 */
export const LATEST_NPM_VERSION = '0.16.0';

export const SITE_ORIGIN = 'https://quartz-headless.pages.dev';
export const GITHUB_URL = 'https://github.com/Andersseen/quartz';
export const NPM_CORE_URL = 'https://www.npmjs.com/package/@quartz-headless/core';
export const NPM_PRIMITIVES_URL = 'https://www.npmjs.com/package/@quartz-headless/primitives';

/** Verified Angular support (see docs/compatibility.md): 21.2 minimum, 21.2 current and 22. */
export const ANGULAR_SUPPORT = 'Angular 21.2+ and 22';

export const SITE_NAME = 'Quartz Headless';
export const DEFAULT_DESCRIPTION =
  'Unstyled, accessible Angular primitives: you own the styles, Quartz owns the behaviour. Two npm packages, signals-first, zoneless and SSR-safe, with live docs and an API reference.';
