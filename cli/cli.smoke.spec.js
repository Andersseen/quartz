import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { add } from './commands/add.js';
import { REGISTRY } from './registry.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Smoke test for the `quartz add` CLI.
 *
 * Verifies that copying a primitive also copies transitive dependencies
 * (foundations and overlay), that copied output mirrors the library's Core /
 * Headless Primitives layer split (`<layer>/<component>/`), and that every referenced
 * cross-component import resolves to a copied sibling folder. Does not build a full
 * Angular app — just checks file existence and import paths.
 */
function runAdd(cwd, components, output = 'src/lib/components') {
  // Capture the CLI output without polluting test logs.
  const outDir = path.join(cwd, output);
  add(components, { output: outDir, verbose: false, cwd });
  return outDir;
}

// Walks the two-level `<layer>/<component>/` copy output and returns
// { [component]: { layer, files: string[] } }.
function readComponents(dir) {
  const result = {};
  if (!fs.existsSync(dir)) return result;
  for (const layer of fs.readdirSync(dir)) {
    const layerDir = path.join(dir, layer);
    if (!fs.statSync(layerDir).isDirectory()) continue;
    for (const name of fs.readdirSync(layerDir)) {
      const compDir = path.join(layerDir, name);
      if (!fs.statSync(compDir).isDirectory()) continue;
      result[name] = { layer, files: fs.readdirSync(compDir).sort() };
    }
  }
  return result;
}

// Returns { "layer/component/file": content } for every copied file.
function readAllContents(dir) {
  const files = {};
  for (const [name, { layer, files: fileNames }] of Object.entries(readComponents(dir))) {
    for (const file of fileNames) {
      files[`${layer}/${name}/${file}`] = fs.readFileSync(
        path.join(dir, layer, name, file),
        'utf8',
      );
    }
  }
  return files;
}

describe('CLI smoke — quartz add', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quartz-cli-smoke-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should copy dialog and its focus/dismiss dependencies under their proper layers', () => {
    const outDir = runAdd(tmpDir, ['dialog']);
    const copied = readComponents(outDir);

    expect(copied.dialog.layer).toBe('primitives');
    expect(copied.dialog.files).toContain('dialog.service.ts');
    expect(copied.dialog.files).toContain('dialog.types.ts');
    expect(copied.dialog.files).toContain('dialog-ref.ts');
    expect(copied.dialog.files).toContain('index.ts');
    expect(copied.focus.layer).toBe('core');
    expect(copied.focus.files).toContain('focus.ts');
    expect(copied.focus.files).toContain('index.ts');
    expect(copied.dismiss.layer).toBe('core');
    expect(copied.dismiss.files).toContain('dismiss.ts');
    expect(copied.dismiss.files).toContain('index.ts');
  });

  it('should copy tooltip and pull overlay transitively', () => {
    const outDir = runAdd(tmpDir, ['tooltip']);
    const copied = readComponents(outDir);

    expect(copied.tooltip.layer).toBe('primitives');
    expect(copied.tooltip.files).toContain('tooltip.directive.ts');
    expect(copied.tooltip.files).toContain('tooltip.service.ts');
    expect(copied.tooltip.files).toContain('tooltip.types.ts');
    expect(copied.tooltip.files).toContain('index.ts');
    expect(copied.overlay).toBeDefined();
    expect(copied.overlay.layer).toBe('core');
    expect(copied.overlay.files.length).toBeGreaterThan(0);
  });

  it('should copy dialog + tooltip together without duplicates', () => {
    const outDir = runAdd(tmpDir, ['dialog', 'tooltip']);
    const copied = readComponents(outDir);

    expect(Object.keys(copied).sort()).toEqual([
      'dialog',
      'dismiss',
      'focus',
      'overlay',
      'tooltip',
    ]);
  });

  it('should let a Core component be added standalone without pulling in any primitive', () => {
    const outDir = runAdd(tmpDir, ['overlay']);
    const copied = readComponents(outDir);

    // overlay transitively needs dismiss (both Core) — that's expected. What must never
    // happen is a primitive getting pulled in, or a `primitives/` folder appearing at all.
    expect(Object.keys(copied).sort()).toEqual(['dismiss', 'overlay']);
    expect(copied.overlay.layer).toBe('core');
    expect(copied.dismiss.layer).toBe('core');
    expect(fs.existsSync(path.join(outDir, 'primitives'))).toBe(false);
  });

  it('should resolve every cross-component import inside copied files', () => {
    const outDir = runAdd(tmpDir, ['dialog', 'tooltip']);
    const files = readAllContents(outDir);

    const importRe = /from\s+['"]\.\.\/(?:\.\.\/(?:core|primitives)\/)?([^'"/]+)['"]/g;
    for (const [relPath, content] of Object.entries(files)) {
      let match;
      while ((match = importRe.exec(content)) !== null) {
        const sibling = match[1];
        const siblingLayer = REGISTRY[sibling]?.layer;
        expect(siblingLayer, `${relPath} imports unknown component "${sibling}"`).toBeDefined();
        const siblingDir = path.join(outDir, siblingLayer, sibling);
        expect(fs.existsSync(siblingDir), `${relPath} imports missing ${sibling}`).toBe(true);
      }
    }
  });

  it('should preserve the original index.ts re-exports', () => {
    const outDir = runAdd(tmpDir, ['dialog']);
    const index = fs.readFileSync(path.join(outDir, 'primitives', 'dialog', 'index.ts'), 'utf8');
    expect(index).toContain('export');
    expect(index).toContain('./dialog.service');
    expect(index).toContain('./dialog-ref');
  });

  it('should not copy test specs', () => {
    const outDir = runAdd(tmpDir, ['dialog', 'overlay']);
    const files = readAllContents(outDir);
    const names = Object.keys(files);
    expect(names.every((n) => !n.endsWith('.spec.ts'))).toBe(true);
  });
});
