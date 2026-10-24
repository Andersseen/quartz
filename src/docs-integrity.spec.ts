import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const contentRoot = join(root, 'src/content/docs');

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? markdownFiles(path) : name.endsWith('.md') ? [path] : [];
  });
}

const pages = markdownFiles(contentRoot);
const read = (file: string) => readFileSync(file, 'utf8');
const stripFences = (text: string) => text.replace(/```[\s\S]*?```/g, '');

describe('documentation content', () => {
  const demoIds = new Set(
    [
      ...read(join(root, 'src/app/docs-demos/registry.ts')).matchAll(
        /^\s+'?([a-z-]+)'?: \w+DemoLoader,/gm,
      ),
    ].map((m) => m[1]),
  );
  const playgroundIds = new Set(
    [
      ...read(join(root, 'src/app/docs-playgrounds/registry.ts')).matchAll(
        /^\s+'(quartz-[a-z-]+)': \{/gm,
      ),
    ].map((m) => m[1]),
  );

  it('registers every ::demo and ::playground used in Markdown', () => {
    const missing: string[] = [];
    for (const page of pages) {
      const text = stripFences(read(page));
      for (const m of text.matchAll(/^::demo\[([\w-]+)\]$/gm))
        if (!demoIds.has(m[1])) missing.push(`${page}: demo ${m[1]}`);
      for (const m of text.matchAll(/^::playground\[([\w-]+)\]$/gm))
        if (!playgroundIds.has(m[1])) missing.push(`${page}: playground ${m[1]}`);
    }
    expect(missing).toEqual([]);
    expect(demoIds.size).toBeGreaterThanOrEqual(27);
  });

  it('keeps every registered demo used by a page', () => {
    const used = new Set(
      pages.flatMap((p) => [...read(p).matchAll(/^::demo\[([\w-]+)\]$/gm)].map((m) => m[1])),
    );
    expect([...demoIds].filter((id) => !used.has(id))).toEqual([]);
  });

  it('links only to documents that exist', () => {
    const broken: string[] = [];
    for (const page of pages) {
      for (const m of stripFences(read(page)).matchAll(/\]\((\/docs[^)#\s]*)/g)) {
        const rel = m[1].replace(/^\/docs\/?/, '');
        const candidates = rel ? [`${rel}.md`, `${rel}/index.md`] : [];
        if (rel && !candidates.some((c) => existsSync(join(contentRoot, c))))
          broken.push(`${page}: ${m[1]}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('documents every Core and Primitives page named by the catalogue', () => {
    for (const name of [
      'overlay',
      'directionality',
      'scroll-lock',
      'splitter',
      'drag-drop',
      'virtual-scroll',
      'viewport',
      'collection',
      'focus',
      'dismiss',
    ]) {
      expect(existsSync(join(contentRoot, 'core', `${name}.md`)), name).toBe(true);
    }
    for (const name of [
      'dialog',
      'tooltip',
      'toast',
      'popover',
      'menu',
      'select',
      'listbox',
      'combobox',
      'tabs',
      'accordion',
      'switch',
      'checkbox',
      'radio-group',
      'toggle',
      'toggle-group',
      'slider',
      'range-slider',
      'tree',
      'sidebar',
      'navbar',
      'stepper',
    ]) {
      expect(existsSync(join(contentRoot, 'primitives', `${name}.md`)), name).toBe(true);
    }
  });

  it('redirects every legacy root URL to an existing page', () => {
    const lines = read(join(root, 'public/_redirects'))
      .split('\n')
      .filter((l) => l && !l.startsWith('#'));
    expect(lines.length).toBeGreaterThanOrEqual(27);
    for (const line of lines) {
      const [, to] = line.split(/\s+/);
      const rel = to.replace(/^\/docs\/?/, '');
      expect(rel === '' || existsSync(join(contentRoot, `${rel}.md`)), line).toBe(true);
    }
  });
});
