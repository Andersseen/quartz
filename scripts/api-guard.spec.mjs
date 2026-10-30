import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { compareSurface, formatChanges, checkApiSurface } = require('./api-guard.js');

const directive = () => ({
  kind: 'class',
  angular: {
    type: 'directive',
    selector: '[qzThing]',
    exportAs: null,
    inputs: { size: 'number' },
    outputs: { opened: 'opened' },
  },
  members: { open: '() => void' },
});

describe('API compatibility guard', () => {
  const base = { exports: { Thing: directive() }, defaults: { DEFAULT_THING: { delay: 100 } } };
  const changed = (fn) => {
    const next = structuredClone(base);
    fn(next);
    return compareSurface(base, next);
  };

  it('is silent for identical surfaces', () =>
    expect(compareSurface(base, structuredClone(base))).toEqual([]));

  it.each([
    [
      'selector change',
      (n) => (n.exports.Thing.angular.selector = '[qzOther]'),
      'exports.Thing.angular.selector',
    ],
    [
      'input removed',
      (n) => delete n.exports.Thing.angular.inputs.size,
      'exports.Thing.angular.inputs.size',
    ],
    [
      'input type changed',
      (n) => (n.exports.Thing.angular.inputs.size = 'string'),
      'exports.Thing.angular.inputs.size',
    ],
    [
      'output removed',
      (n) => delete n.exports.Thing.angular.outputs.opened,
      'exports.Thing.angular.outputs.opened',
    ],
    [
      'method signature changed',
      (n) => (n.exports.Thing.members.open = '(force: boolean) => void'),
      'exports.Thing.members.open',
    ],
    ['export removed', (n) => delete n.exports.Thing, 'exports.Thing'],
    [
      'documented default changed',
      (n) => (n.defaults.DEFAULT_THING.delay = 200),
      'defaults.DEFAULT_THING.delay',
    ],
  ])('flags %s as breaking', (_label, mutate, at) => {
    expect(changed(mutate).some((c) => c.severity === 'breaking' && c.at === at)).toBe(true);
  });

  it('classifies an added input as additive and still reports it', () => {
    expect(changed((n) => (n.exports.Thing.angular.inputs.extra = 'boolean'))).toEqual([
      expect.objectContaining({
        severity: 'additive',
        change: 'added',
        at: 'exports.Thing.angular.inputs.extra',
      }),
    ]);
  });

  it('renders a readable report', () => {
    const text = formatChanges(
      'core',
      changed((n) => (n.exports.Thing.angular.selector = '[qzOther]')),
    );
    expect(text).toContain('BREAKING');
    expect(text).toContain('was: [qzThing]');
    expect(text).toContain('now: [qzOther]');
  });

  const built = existsSync(
    join(process.cwd(), 'packages/core/dist/types/quartz-headless-core.d.ts'),
  );
  it.skipIf(!built)('fails against a tampered baseline directory and names the change', () => {
    const dir = mkdtempSync(join(tmpdir(), 'api-baseline-'));
    cpSync(join(process.cwd(), 'docs/api/snapshots'), dir, { recursive: true });
    const file = join(dir, 'core.json');
    const snap = JSON.parse(readFileSync(file, 'utf8'));
    delete snap.exports.OverlayService.members.create;
    writeFileSync(file, JSON.stringify(snap));
    expect(() => checkApiSurface({ baselineDir: dir })).toThrow(
      /ADDITIVE[\s\S]*OverlayService\.members\.create/,
    );
  });
});
