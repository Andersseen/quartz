import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATALOGUE, CATEGORIES, apiPath, catalogueCounts, filterCatalogue } from './catalogue';

const root = resolve(__dirname, '../../..');
const docsRoot = resolve(root, 'src/content/docs');
const snapshot = (name: string): Record<string, unknown> =>
  JSON.parse(readFileSync(resolve(root, 'docs/api/snapshots', `${name}.json`), 'utf8')).exports;
const exportsOf = {
  core: snapshot('core'),
  primitives: { ...snapshot('primitives'), ...snapshot('primitives-forms') },
};

describe('catalogue', () => {
  it('links every entry to an existing documentation page', () => {
    for (const entry of CATALOGUE) {
      const file = resolve(root, 'src/content', `${entry.path.replace(/^\/docs\//, 'docs/')}.md`);
      expect(existsSync(file), `${entry.name} → ${entry.path}`).toBe(true);
    }
  });

  it('is reachable for every documented Core and Primitives page', () => {
    const covered = new Set(CATALOGUE.map((entry) => entry.path));
    for (const group of ['core', 'primitives']) {
      for (const file of readdirSync(resolve(docsRoot, group))) {
        if (!file.endsWith('.md')) continue;
        expect(covered, `${group}/${file} is not in the catalogue`).toContain(
          `/docs/${group}/${file.replace(/\.md$/, '')}`,
        );
      }
    }
  });

  it('has unique names and routes, and known categories', () => {
    expect(new Set(CATALOGUE.map((e) => e.path)).size).toBe(CATALOGUE.length);
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const entry of CATALOGUE) expect(ids.has(entry.category)).toBe(true);
  });

  it('only names exports that exist in the generated API snapshots', () => {
    for (const entry of CATALOGUE) {
      for (const name of entry.exports) {
        expect(
          Object.hasOwn(exportsOf[entry.layer], name),
          `${entry.name}: ${name} is not exported by ${entry.layer}`,
        ).toBe(true);
      }
    }
  });

  it('marks aliases and compositions explicitly and never lists them as independent exports', () => {
    for (const entry of CATALOGUE) {
      if (entry.kind !== 'export') expect(entry.note, entry.name).toBeTruthy();
    }
    const resizable = CATALOGUE.find((e) => e.name === 'Resizable');
    expect(resizable?.kind).toBe('alias');
    expect(CATALOGUE.map((e) => e.path)).toContain(resizable?.backedBy);
    expect(CATALOGUE.find((e) => e.name === 'Search')?.kind).toBe('composition');
  });

  it('links every export-backed entry to an existing generated API page', () => {
    for (const entry of CATALOGUE) {
      const route = apiPath(entry);
      if (entry.kind === 'composition') {
        expect(route, entry.name).toBeNull();
        continue;
      }
      expect(route, entry.name).toBeTruthy();
      const file = resolve(root, 'src/content', `${route!.replace(/^\/docs\//, 'docs/')}.md`);
      expect(existsSync(file), `${entry.name} → ${route}`).toBe(true);
    }
  });

  it('derives honest counts', () => {
    const counts = catalogueCounts();
    expect(counts.coreApis).toBe(10);
    expect(counts.documentedPrimitivePages).toBe(
      counts.primitiveFamilies + counts.aliases + counts.compositions,
    );
  });
});

describe('filterCatalogue', () => {
  const names = (query: Parameters<typeof filterCatalogue>[0]) =>
    filterCatalogue(query).map((entry) => entry.name);

  it('matches names, keywords, exports and descriptions case-insensitively', () => {
    expect(names({ text: 'DIALOG' })).toContain('Dialog');
    expect(names({ text: 'autocomplete' })).toContain('Combobox');
    expect(names({ text: 'createFocusTrap' })).toContain('Focus');
    expect(names({ text: 'zzz-no-match' })).toEqual([]);
    expect(names({ text: 'live region' })).toContain('Toast');
  });

  it('requires every term and combines with category and layer filters', () => {
    expect(names({ text: 'range slider' })).toContain('RangeSlider');
    expect(names({ text: 'slider', category: 'navigation' })).toEqual([]);
    expect(names({ layer: 'core' })).toHaveLength(10);
  });

  it('restores everything for an empty query', () => {
    expect(filterCatalogue({ text: '  ' })).toHaveLength(CATALOGUE.length);
  });
});
