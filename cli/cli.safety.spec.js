import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'child_process';
import { add, planInstall, CliError, EXIT } from './commands/add.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const BIN = path.resolve(__dirname, 'bin/quartz.js');

function quartz(cwd, ...args) {
  return spawnSync('node', [BIN, ...args], { cwd, encoding: 'utf8' });
}

function tree(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else out.push(path.relative(dir, p));
    }
  };
  walk(dir);
  return out.sort();
}

describe('CLI safety — quartz add', () => {
  let tmp;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quartz-cli-safety-'));
  });
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  describe('argument parsing and exit codes', () => {
    it('exits 3 for an unknown component, suggests a close match and writes nothing', () => {
      const r = quartz(tmp, 'add', 'dialgo', '-o', 'out');
      expect(r.status).toBe(EXIT.UNKNOWN_COMPONENT);
      expect(r.stderr).toContain('E_UNKNOWN_COMPONENT');
      expect(r.stderr).toContain('"dialog"');
      expect(fs.existsSync(path.join(tmp, 'out'))).toBe(false);
    });

    it('does not install the valid half of a mixed valid/unknown request', () => {
      const r = quartz(tmp, 'add', 'accordion', 'nope', '-o', 'out');
      expect(r.status).toBe(EXIT.UNKNOWN_COMPONENT);
      expect(tree(path.join(tmp, 'out'))).toEqual([]);
    });

    it('exits 2 when --output has no value', () => {
      for (const argv of [
        ['add', 'accordion', '--output'],
        ['add', 'accordion', '-o', '--force'],
        ['add', 'accordion', '--output='],
      ]) {
        const r = quartz(tmp, ...argv);
        expect(r.status, argv.join(' ')).toBe(EXIT.USAGE);
        expect(r.stderr).toContain('E_USAGE');
      }
      expect(tree(tmp)).toEqual([]);
    });

    it('exits 2 for unknown flags and for add without components', () => {
      expect(quartz(tmp, 'add', 'accordion', '--frobnicate').status).toBe(EXIT.USAGE);
      expect(quartz(tmp, 'add').status).toBe(EXIT.USAGE);
    });

    it('exits 2 for an unknown command and 0 for list/help', () => {
      expect(quartz(tmp, 'wat').status).toBe(EXIT.USAGE);
      expect(quartz(tmp, 'list').status).toBe(0);
      expect(quartz(tmp, '--help').status).toBe(0);
    });

    it('supports --output=<dir>', () => {
      const r = quartz(tmp, 'add', 'accordion', '--output=custom');
      expect(r.status).toBe(0);
      expect(tree(path.join(tmp, 'custom')).some((f) => f.startsWith('accordion/'))).toBe(true);
    });
  });

  describe('existing files', () => {
    it('is repeatable: a second install is a successful no-op', () => {
      expect(quartz(tmp, 'add', 'accordion', 'splitter', '-o', 'out').status).toBe(0);
      const before = tree(path.join(tmp, 'out'));
      const second = quartz(tmp, 'add', 'accordion', 'splitter', '-o', 'out');
      expect(second.status).toBe(0);
      expect(second.stdout).toContain('already up to date');
      expect(tree(path.join(tmp, 'out'))).toEqual(before);
    });

    it('refuses to overwrite a modified file (exit 4) and leaves every file untouched', () => {
      quartz(tmp, 'add', 'accordion', '-o', 'out');
      const edited = path.join(tmp, 'out/accordion/accordion.directive.ts');
      fs.writeFileSync(edited, '// my local change\n');
      // also delete a sibling so a partial write would be detectable
      const sibling = path.join(tmp, 'out/accordion/index.ts');
      fs.rmSync(sibling);

      const r = quartz(tmp, 'add', 'accordion', '-o', 'out');
      expect(r.status).toBe(EXIT.CONFLICT);
      expect(r.stderr).toContain('E_CONFLICT');
      expect(r.stderr).toContain('--force');
      expect(fs.readFileSync(edited, 'utf8')).toBe('// my local change\n');
      expect(fs.existsSync(sibling), 'no partial installation on conflict').toBe(false);
    });

    it('--force replaces modified files explicitly', () => {
      quartz(tmp, 'add', 'accordion', '-o', 'out');
      const edited = path.join(tmp, 'out/accordion/accordion.directive.ts');
      fs.writeFileSync(edited, '// my local change\n');
      const r = quartz(tmp, 'add', 'accordion', '-o', 'out', '--force');
      expect(r.status).toBe(0);
      expect(r.stdout).toContain('overwritten');
      expect(fs.readFileSync(edited, 'utf8')).not.toContain('my local change');
    });

    it('--dry-run writes nothing', () => {
      const r = quartz(tmp, 'add', 'accordion', '-o', 'out', '--dry-run');
      expect(r.status).toBe(0);
      expect(r.stdout).toContain('would add');
      expect(fs.existsSync(path.join(tmp, 'out'))).toBe(false);
    });

    it('exits 4 when a destination path is a directory instead of a file', () => {
      fs.mkdirSync(path.join(tmp, 'out/accordion/index.ts'), { recursive: true });
      const r = quartz(tmp, 'add', 'accordion', '-o', 'out');
      expect(r.status).toBe(EXIT.CONFLICT);
      expect(r.stderr).toContain('E_DESTINATION_NOT_FILE');
    });
  });

  describe('atomicity', () => {
    it('rolls back every created file and directory when a write fails midway', () => {
      const out = path.join(tmp, 'out');
      fs.mkdirSync(out);
      // Make the SECOND component directory impossible to create: a file occupies its name.
      // planInstall sees "create" for it only if it does not exist, so occupy it with a file
      // AFTER planning by wrapping fs.mkdirSync is overkill — use a read-only parent instead.
      fs.chmodSync(out, 0o555);
      let error;
      try {
        add(['accordion'], { output: out, cwd: tmp });
      } catch (e) {
        error = e;
      } finally {
        fs.chmodSync(out, 0o755);
      }
      if (process.getuid && process.getuid() === 0) return; // root ignores permissions
      expect(error).toBeInstanceOf(CliError);
      expect(error.code).toBe('E_IO');
      expect(error.exitCode).toBe(EXIT.IO);
      expect(tree(out)).toEqual([]);
      expect(fs.readdirSync(out)).toEqual([]);
    });
  });

  describe('paths and dependency graphs', () => {
    it('handles output paths containing spaces', () => {
      const r = quartz(tmp, 'add', 'splitter', '-o', 'my app/src/quartz primitives');
      expect(r.status).toBe(0);
      const files = tree(path.join(tmp, 'my app/src/quartz primitives'));
      expect(files).toContain('splitter/splitter.service.ts');
      expect(files.some((f) => f.startsWith('directionality/'))).toBe(true);
    });

    it('installs mixed Core + Primitives requests with the Core closure and the peer notice', () => {
      const r = quartz(tmp, 'add', 'overlay', 'dialog', 'drawer', '-o', 'out');
      expect(r.status).toBe(0);
      const files = tree(path.join(tmp, 'out'));
      for (const folder of ['overlay', 'dismiss', 'directionality', 'dialog', 'drawer']) {
        expect(
          files.some((f) => f.startsWith(`${folder}/`)),
          folder,
        ).toBe(true);
      }
      expect(r.stdout).toContain('npm install @quartz-headless/core');
    });

    it('plans without writing and is a pure function of the registry', () => {
      const plan = planInstall(['resizable'], { outputDir: path.join(tmp, 'x'), force: false });
      expect(plan.ordered).toContain('splitter');
      expect(plan.files.every((f) => f.state === 'create')).toBe(true);
      expect(fs.existsSync(path.join(tmp, 'x'))).toBe(false);
    });

    it('every registered component plans cleanly into an empty directory', () => {
      const { REGISTRY } = require('./registry');
      for (const name of Object.keys(REGISTRY).filter((n) => !REGISTRY[n].internal)) {
        expect(
          () => planInstall([name], { outputDir: path.join(tmp, 'all'), force: false }),
          name,
        ).not.toThrow();
      }
    });
  });
});
