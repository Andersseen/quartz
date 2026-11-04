import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  compareSurface,
  formatChanges,
  checkApiSurface,
  canonicalizeUnionTypeText,
  describeExports,
} = require('./api-guard.js');

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
      'input alias changed',
      (n) => {
        delete n.exports.Thing.angular.inputs.size;
        n.exports.Thing.angular.inputs.controlSize = 'number';
      },
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

  it.each([
    ['"ready" | "busy"', '"busy" | "ready"'],
    ['string | null | undefined', 'undefined | string | null'],
    ['ReadonlyArray<"a" | "b"> | null', 'null | ReadonlyArray<"b" | "a">'],
    ['{ state: "ready" | "busy"; value: number }', '{ state: "busy" | "ready"; value: number }'],
  ])('canonicalizes equivalent union types: %s and %s', (left, right) => {
    expect(canonicalizeUnionTypeText(left)).toBe(canonicalizeUnionTypeText(right));
  });

  it.each([
    ['"ready" | "busy"', '"ready"'],
    ['"ready" | "busy"', '"ready" | "busy" | "disabled"'],
  ])('keeps a real union change detectable: %s -> %s', (before, after) => {
    expect(
      compareSurface(
        { type: canonicalizeUnionTypeText(before) },
        { type: canonicalizeUnionTypeText(after) },
      ),
    ).toEqual([expect.objectContaining({ severity: 'breaking', at: 'type', change: 'changed' })]);
  });

  it('preserves overload order and tuple order while canonicalizing their union members', () => {
    expect(canonicalizeUnionTypeText('readonly ["a" | "b", number]')).toBe(
      canonicalizeUnionTypeText('readonly ["b" | "a", number]'),
    );
    expect(
      compareSurface(
        { signatures: ['(value: string): string', '(value: number): number'] },
        { signatures: ['(value: number): number', '(value: string): string'] },
      ),
    ).toHaveLength(1);
    expect(canonicalizeUnionTypeText('readonly [string, number]')).not.toBe(
      canonicalizeUnionTypeText('readonly [number, string]'),
    );
  });

  it('canonicalizes unions from representative TypeScript declarations', () => {
    const dir = mkdtempSync(join(tmpdir(), 'api-union-declarations-'));
    const file = join(dir, 'public.d.ts');
    writeFileSync(
      file,
      [
        `export interface PublicTypes {`,
        `  stateA: 'ready' | 'busy';`,
        `  stateB: 'busy' | 'ready';`,
        `  nestedA: ReadonlyArray<'a' | 'b'> | null;`,
        `  nestedB: null | ReadonlyArray<'b' | 'a'>;`,
        `  nullableA: string | null | undefined;`,
        `  nullableB: undefined | null | string;`,
        `}`,
      ].join('\n'),
    );
    const members = describeExports(file).PublicTypes.members;
    expect(members.stateA).toBe(members.stateB);
    expect(members.nestedA).toBe(members.nestedB);
    expect(members.nullableA).toBe(members.nullableB);
  });

  it('detects required metadata changes and protects function signatures and overload order', () => {
    expect(
      compareSurface(
        { inputs: { value: 'value: number, value, true' } },
        { inputs: { value: 'value: number, value, false' } },
      ),
    ).toContainEqual(
      expect.objectContaining({ severity: 'breaking', at: 'inputs.value', change: 'changed' }),
    );
    const before = { exports: { find: { kind: 'function', signatures: ['(id: string): Item'] } } };
    const changed = structuredClone(before);
    changed.exports.find.signatures[0] = '(id: number): Item';
    expect(compareSurface(before, changed)).toContainEqual(
      expect.objectContaining({ severity: 'breaking', at: 'exports.find.signatures' }),
    );
    const overloads = {
      exports: {
        parse: { kind: 'function', signatures: ['(text: string): string', '(n: number): number'] },
      },
    };
    const reversed = structuredClone(overloads);
    reversed.exports.parse.signatures.reverse();
    expect(compareSurface(overloads, reversed)).toContainEqual(
      expect.objectContaining({ severity: 'breaking', at: 'exports.parse.signatures' }),
    );
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
