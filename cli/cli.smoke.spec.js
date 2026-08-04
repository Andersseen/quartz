import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { add } from './commands/add.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Smoke test for the `quartz add` CLI.
 *
 * Verifies that copying a primitive (dialog) also copies transitive dependencies
 * (overlay) and that every referenced cross-component import resolves to a copied
 * sibling folder. Does not build a full Angular app — just checks file existence and
 * import paths.
 */
function runAdd(cwd, components, output = 'src/lib/components') {
  // Capture the CLI output without polluting test logs.
  const outDir = path.join(cwd, output);
  add(components, { output: outDir, verbose: false, cwd });
  return outDir;
}

function readFiles(dir) {
  const result = {};
  for (const name of fs.readdirSync(dir)) {
    const subdir = path.join(dir, name);
    if (!fs.statSync(subdir).isDirectory()) continue;
    result[name] = fs.readdirSync(subdir).sort();
  }
  return result;
}

function readAll(dir) {
  const files = {};
  for (const name of fs.readdirSync(dir)) {
    const subdir = path.join(dir, name);
    if (!fs.statSync(subdir).isDirectory()) continue;
    for (const file of fs.readdirSync(subdir)) {
      files[`${name}/${file}`] = fs.readFileSync(path.join(subdir, file), 'utf8');
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

  it('should copy dialog and its overlay dependency', () => {
    const outDir = runAdd(tmpDir, ['dialog']);
    const copied = readFiles(outDir);

    expect(copied.dialog).toContain('dialog.service.ts');
    expect(copied.dialog).toContain('dialog.types.ts');
    expect(copied.dialog).toContain('dialog-ref.ts');
    expect(copied.dialog).toContain('index.ts');
    expect(copied.overlay).toContain('overlay.service.ts');
    expect(copied.overlay).toContain('overlay-ref.ts');
    expect(copied.overlay).toContain('overlay.types.ts');
    expect(copied.overlay).toContain('index.ts');
  });

  it('should copy tooltip and pull overlay transitively', () => {
    const outDir = runAdd(tmpDir, ['tooltip']);
    const copied = readFiles(outDir);

    expect(copied.tooltip).toContain('tooltip.directive.ts');
    expect(copied.tooltip).toContain('tooltip.service.ts');
    expect(copied.tooltip).toContain('tooltip.types.ts');
    expect(copied.tooltip).toContain('index.ts');
    expect(copied.overlay).toBeDefined();
    expect(copied.overlay.length).toBeGreaterThan(0);
  });

  it('should copy dialog + tooltip together without duplicates', () => {
    const outDir = runAdd(tmpDir, ['dialog', 'tooltip']);
    const copied = readFiles(outDir);

    expect(Object.keys(copied).sort()).toEqual(['dialog', 'overlay', 'tooltip']);
  });

  it('should resolve every cross-component import inside copied files', () => {
    const outDir = runAdd(tmpDir, ['dialog', 'tooltip']);
    const files = readAll(outDir);

    const importRe = /from\s+['"](\.\.\/[^'"]+)['"]/g;
    for (const [relPath, content] of Object.entries(files)) {
      let match;
      while ((match = importRe.exec(content)) !== null) {
        const importPath = match[1];
        const sibling = importPath.replace(/^\.\.\//, '').split('/')[0];
        const siblingDir = path.join(outDir, sibling);
        expect(fs.existsSync(siblingDir), `${relPath} imports missing ${sibling}`).toBe(true);
      }
    }
  });

  it('should preserve the original index.ts re-exports', () => {
    const outDir = runAdd(tmpDir, ['dialog']);
    const index = fs.readFileSync(path.join(outDir, 'dialog', 'index.ts'), 'utf8');
    expect(index).toContain('export');
    expect(index).toContain('./dialog.service');
    expect(index).toContain('./dialog-ref');
  });

  it('should not copy test specs', () => {
    const outDir = runAdd(tmpDir, ['dialog', 'overlay']);
    const files = readAll(outDir);
    const names = Object.keys(files);
    expect(names.every((n) => !n.endsWith('.spec.ts'))).toBe(true);
  });
});
