import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATALOGUE, entrySlug } from './catalogue';
import { SHOWCASE } from './showcase';

const root = resolve(__dirname, '../../..');
const directives = (entryPath: string, kind: 'demo' | 'playground') => {
  const markdown = readFileSync(resolve(root, 'src/content', `${entryPath.slice(1)}.md`), 'utf8');
  return [...markdown.matchAll(new RegExp(`^::${kind}\\[([a-z0-9-]+)\\]`, 'gm'))].map((m) => m[1]);
};
const registryIds = (file: string, pattern: RegExp) =>
  new Set([...readFileSync(resolve(root, file), 'utf8').matchAll(pattern)].map((m) => m[1]));

describe('component showcase', () => {
  it('mirrors the demos and playground of every documentation page', () => {
    for (const entry of CATALOGUE) {
      const demos = directives(entry.path, 'demo');
      const playgrounds = directives(entry.path, 'playground');
      const expected =
        demos.length || playgrounds.length
          ? { demos, ...(playgrounds[0] ? { playground: playgrounds[0] } : {}) }
          : undefined;
      expect(SHOWCASE[entrySlug(entry)], entry.path).toEqual(expected);
      expect(playgrounds.length, `${entry.path}: one playground per page`).toBeLessThanOrEqual(1);
    }
  });

  it('only names registered demos and playgrounds, and only catalogue slugs', () => {
    const demoIds = registryIds(
      'src/app/docs-demos/registry.ts',
      /^\s+'?([a-z0-9-]+)'?: \w+DemoLoader,/gm,
    );
    const playgroundIds = registryIds(
      'src/app/docs-playgrounds/registry.ts',
      /^\s+'(quartz-[a-z0-9-]+)':/gm,
    );
    const slugs = new Set(CATALOGUE.map(entrySlug));
    for (const [slug, showcase] of Object.entries(SHOWCASE)) {
      expect(slugs, slug).toContain(slug);
      for (const demo of showcase.demos) expect(demoIds, `${slug}: ${demo}`).toContain(demo);
      if (showcase.playground) expect(playgroundIds, slug).toContain(showcase.playground);
    }
  });

  it('gives every catalogue entry a unique slug', () => {
    expect(new Set(CATALOGUE.map(entrySlug)).size).toBe(CATALOGUE.length);
  });
});
