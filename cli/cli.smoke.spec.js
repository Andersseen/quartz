import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { add } from './commands/add.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Smoke test for the `quartz add` CLI.
 *
 * Core components are still copy-source with zero npm dependencies: copying one pulls in
 * its Core sibling deps (e.g. overlay -> dismiss) as sibling folders. Primitives now depend
 * on @quartz-headless/core as a real npm package instead — copying a primitive must NOT
 * copy any Core folder, and must report the peer dependency instead.
 */
function runAdd(cwd, components, output = 'src/lib/components') {
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

  it('should copy a Core component and its Core sibling deps', () => {
    const outDir = runAdd(tmpDir, ['overlay']);
    const copied = readFiles(outDir);

    expect(copied.overlay).toContain('overlay.service.ts');
    expect(copied.overlay).toContain('overlay-trigger.directive.ts');
    expect(copied.overlay).toContain('overlay-ref.ts');
    expect(copied.overlay).toContain('index.ts');
    expect(copied.dismiss).toContain('dismiss.ts');
    expect(copied.dismiss).toContain('index.ts');
    expect(copied.directionality).toContain('directionality.service.ts');
    expect(copied.directionality).toContain('index.ts');
  });

  it('should copy a Primitive without copying any Core folder', () => {
    const outDir = runAdd(tmpDir, ['dialog']);
    const copied = readFiles(outDir);

    expect(Object.keys(copied)).toEqual(['dialog']);
    expect(copied.dialog).toContain('dialog.service.ts');
    expect(copied.dialog).toContain('dialog.types.ts');
    expect(copied.dialog).toContain('dialog-ref.ts');
    expect(copied.dialog).toContain('index.ts');
    expect(fs.existsSync(path.join(outDir, 'focus'))).toBe(false);
    expect(fs.existsSync(path.join(outDir, 'dismiss'))).toBe(false);
  });

  it('should copy tooltip without copying overlay, since overlay is now an npm peer dep', () => {
    const outDir = runAdd(tmpDir, ['tooltip']);
    const copied = readFiles(outDir);

    expect(Object.keys(copied)).toEqual(['tooltip']);
    expect(copied.tooltip).toContain('tooltip.directive.ts');
    expect(copied.tooltip).toContain('tooltip.service.ts');
    expect(copied.tooltip).toContain('tooltip.types.ts');
    expect(copied.tooltip).toContain('index.ts');
  });

  it('should copy menu and popover as Primitives without copying Core folders', () => {
    const outDir = runAdd(tmpDir, ['menu', 'popover']);
    const copied = readFiles(outDir);

    expect(Object.keys(copied).sort()).toEqual(['menu', 'popover']);
    expect(copied.menu).toContain('menu-trigger.directive.ts');
    expect(copied.menu).toContain('menu-checkbox-item.directive.ts');
    expect(copied.menu).toContain('menu-radio-item.directive.ts');
    expect(copied.popover).toContain('popover-trigger.directive.ts');
    expect(fs.existsSync(path.join(outDir, 'overlay'))).toBe(false);
    expect(fs.existsSync(path.join(outDir, 'dismiss'))).toBe(false);
  });

  it('should copy a Core component and a Primitive together without duplicates', () => {
    const outDir = runAdd(tmpDir, ['overlay', 'tooltip']);
    const copied = readFiles(outDir);

    expect(Object.keys(copied).sort()).toEqual(['directionality', 'dismiss', 'overlay', 'tooltip']);
  });

  it('should resolve every cross-component import inside copied Core files', () => {
    const outDir = runAdd(tmpDir, ['overlay']);
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

  it('copied Primitive source imports @quartz-headless/core as a bare package specifier', () => {
    const outDir = runAdd(tmpDir, ['dialog']);
    const service = fs.readFileSync(path.join(outDir, 'dialog', 'dialog.service.ts'), 'utf8');
    expect(service).toContain("from '@quartz-headless/core'");
    expect(service).not.toMatch(/from ['"]\.\.\//);
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

  it('should copy 0.2.0 Core and Primitive additions with correct peer boundaries', () => {
    const outDir = runAdd(tmpDir, ['scroll-lock', 'select', 'tabs', 'accordion', 'switch']);
    const copied = readFiles(outDir);

    expect(Object.keys(copied).sort()).toEqual([
      'accordion',
      'scroll-lock',
      'select',
      'switch',
      'tabs',
    ]);
    expect(copied['scroll-lock']).toContain('scroll-lock.ts');
    expect(copied.select).toContain('select.directive.ts');
    expect(copied.tabs).toContain('tab-list.directive.ts');
    expect(copied.accordion).toContain('accordion-trigger.directive.ts');
    expect(copied.switch).toContain('switch.directive.ts');
    expect(fs.existsSync(path.join(outDir, 'overlay'))).toBe(false);
    expect(fs.existsSync(path.join(outDir, 'collection'))).toBe(false);
  });

  it('should copy 0.3.0 controls with correct peer boundaries', () => {
    const outDir = runAdd(tmpDir, [
      'checkbox',
      'radio-group',
      'toggle',
      'toggle-group',
      'slider',
    ]);
    const copied = readFiles(outDir);

    expect(Object.keys(copied).sort()).toEqual([
      'checkbox',
      'radio-group',
      'slider',
      'toggle',
      'toggle-group',
    ]);
    expect(copied.checkbox).toContain('checkbox.directive.ts');
    expect(copied['radio-group']).toContain('radio-group.directive.ts');
    expect(copied['radio-group']).toContain('radio.directive.ts');
    expect(copied.toggle).toContain('toggle.directive.ts');
    expect(copied['toggle-group']).toContain('toggle-group.directive.ts');
    expect(copied['toggle-group']).toContain('toggle-item.directive.ts');
    expect(copied.slider).toContain('slider.directive.ts');
    expect(copied.slider).toContain('slider-thumb.directive.ts');
    expect(fs.existsSync(path.join(outDir, 'collection'))).toBe(false);
    expect(fs.existsSync(path.join(outDir, 'directionality'))).toBe(false);
  });
});
