/** Synthetic package trees + a fake npm registry for the release rehearsal tests. Never touches npm. */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { corePeerRangeFor } from './semver.mjs';
import { npmIntegrity } from './artifacts.mjs';

const NG = '^21.2.0 || ^22.0.0';

export function makeRoot(version, { mutate } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'quartz-release-fixture-'));
  const write = (rel, content) => {
    const file = join(root, rel);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, content);
  };
  const base = (name, extra) => ({
    name,
    version,
    license: 'MIT',
    sideEffects: false,
    type: 'module',
    peerDependencies: { '@angular/core': NG, '@angular/common': NG, rxjs: '^7.8.0' },
    dependencies: { tslib: '^2.3.0' },
    ...extra,
  });
  const core = base('@quartz-headless/core', {
    module: 'fesm2022/quartz-headless-core.mjs',
    typings: 'types/quartz-headless-core.d.ts',
    exports: {
      './package.json': { default: './package.json' },
      '.': {
        types: './types/quartz-headless-core.d.ts',
        default: './fesm2022/quartz-headless-core.mjs',
      },
    },
  });
  const prim = base('@quartz-headless/primitives', {
    module: 'fesm2022/quartz-headless-primitives.mjs',
    typings: 'types/quartz-headless-primitives.d.ts',
    peerDependencies: {
      '@angular/core': NG,
      '@angular/common': NG,
      rxjs: '^7.8.0',
      '@quartz-headless/core': corePeerRangeFor(version),
      '@angular/forms': NG,
    },
    peerDependenciesMeta: { '@angular/forms': { optional: true } },
    exports: {
      './package.json': { default: './package.json' },
      '.': {
        types: './types/quartz-headless-primitives.d.ts',
        default: './fesm2022/quartz-headless-primitives.mjs',
      },
      './forms': {
        types: './types/quartz-headless-primitives-forms.d.ts',
        default: './fesm2022/quartz-headless-primitives-forms.mjs',
      },
    },
  });
  const files = {
    'packages/core/dist/package.json': core,
    'packages/primitives/dist/package.json': prim,
  };
  const entries = {
    'packages/core/dist': ['quartz-headless-core'],
    'packages/primitives/dist': ['quartz-headless-primitives', 'quartz-headless-primitives-forms'],
  };
  for (const [dist, names] of Object.entries(entries)) {
    write(`${dist}/README.md`, '# readme\n');
    write(`${dist}/LICENSE`, 'MIT\n');
    for (const n of names) {
      write(`${dist}/fesm2022/${n}.mjs`, 'export const x = 1;\n');
      write(`${dist}/types/${n}.d.ts`, 'export declare const x: number;\n');
    }
  }
  const ctx = { root, files, write };
  mutate?.(ctx);
  for (const [rel, json] of Object.entries(files)) write(rel, JSON.stringify(json, null, 2));
  return ctx;
}

const err = (code, extra = '') => ({
  status: 1,
  stdout: JSON.stringify({ error: { code, summary: extra || code } }),
  stderr: `npm error code ${code}\n`,
});

/**
 * Fake registry exposed as an `exec(args)` with the same shape as `npmExec`.
 * `registry.versions` maps `name@version` -> integrity.
 */
export function fakeRegistry({ versions = {}, tags = {} } = {}) {
  const reg = {
    versions: { ...versions },
    tags: { ...tags },
    calls: [],
    fail: {}, // { view?: code, publish?: code }
    interruptAfterPublish: false, // publish "fails" but the version lands
    beforePublish: null, // (name, version) => void — simulate a concurrent writer
    hooks: {},
  };
  reg.exec = (args) => {
    reg.calls.push(args.join(' ').replace(/(_authToken=)\S+/g, '$1[x]'));
    if (args[0] === 'view') {
      if (reg.fail.view) return err(reg.fail.view);
      if (args[2] === 'dist-tags') {
        const name = args[1];
        const out = {};
        for (const [k, v] of Object.entries(reg.tags))
          if (k.startsWith(`${name}:`)) out[k.split(':')[1]] = v;
        return { status: 0, stdout: JSON.stringify(out), stderr: '' };
      }
      const integrity = reg.versions[args[1]];
      if (!integrity) return err('E404', 'No match found for version');
      return {
        status: 0,
        stdout: JSON.stringify({ integrity, shasum: 'x', tarball: 'https://r/x.tgz' }),
        stderr: '',
      };
    }
    if (args[0] === 'publish') {
      const file = args[1];
      const tagIdx = args.indexOf('--tag');
      const tag = args[tagIdx + 1];
      const pkg = JSON.parse(execTarJson(file));
      const key = `${pkg.name}@${pkg.version}`;
      reg.beforePublish?.(pkg.name, pkg.version);
      if (reg.fail.publish) return err(reg.fail.publish);
      if (reg.versions[key])
        return err('E403', 'You cannot publish over the previously published versions');
      reg.versions[key] = npmIntegrity(readFileSync(file));
      reg.tags[`${pkg.name}:${tag}`] = pkg.version;
      if (reg.interruptAfterPublish) return err('ETIMEDOUT');
      return { status: 0, stdout: '', stderr: '' };
    }
    return err('EUNEXPECTED');
  };
  return reg;
}

import { execFileSync } from 'node:child_process';
function execTarJson(file) {
  return execFileSync('tar', ['-xzOf', file, 'package/package.json'], { encoding: 'utf8' });
}
