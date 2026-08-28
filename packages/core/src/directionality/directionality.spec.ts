import { describe, it, expect, afterEach } from 'vitest';
import {
  resolveDirection,
  oppositeDirection,
  inlineToPhysical,
  physicalToInline,
  inlineStartKey,
  inlineEndKey,
  resolveInlineArrowKey,
} from './directionality';

describe('resolveDirection', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('dir');
    document.body.innerHTML = '';
  });

  it('defaults to ltr when nothing sets dir', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(resolveDirection(el)).toBe('ltr');
  });

  it('resolves ltr when dir="ltr" is set explicitly', () => {
    const el = document.createElement('div');
    el.setAttribute('dir', 'ltr');
    document.body.appendChild(el);
    expect(resolveDirection(el)).toBe('ltr');
  });

  it('resolves rtl from a dir="rtl" on the element itself', () => {
    const el = document.createElement('div');
    el.setAttribute('dir', 'rtl');
    document.body.appendChild(el);
    expect(resolveDirection(el)).toBe('rtl');
  });

  it('resolves rtl from an ancestor (document root) dir attribute', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(resolveDirection(el)).toBe('rtl');
  });

  it('lets a subtree dir="ltr" override an rtl document root', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const subtree = document.createElement('div');
    subtree.setAttribute('dir', 'ltr');
    const el = document.createElement('span');
    subtree.appendChild(el);
    document.body.appendChild(subtree);
    expect(resolveDirection(el)).toBe('ltr');
  });

  it('is case-insensitive', () => {
    const el = document.createElement('div');
    el.setAttribute('dir', 'RTL');
    document.body.appendChild(el);
    expect(resolveDirection(el)).toBe('rtl');
  });

  it('returns ltr for null/undefined', () => {
    expect(resolveDirection(null)).toBe('ltr');
    expect(resolveDirection(undefined)).toBe('ltr');
  });
});

describe('oppositeDirection', () => {
  it('flips ltr <-> rtl', () => {
    expect(oppositeDirection('ltr')).toBe('rtl');
    expect(oppositeDirection('rtl')).toBe('ltr');
  });
});

describe('logical <-> physical conversion', () => {
  it('ltr: inline-start is left, inline-end is right', () => {
    expect(inlineToPhysical('ltr', 'inline-start')).toBe('left');
    expect(inlineToPhysical('ltr', 'inline-end')).toBe('right');
  });

  it('rtl: inline-start is right, inline-end is left', () => {
    expect(inlineToPhysical('rtl', 'inline-start')).toBe('right');
    expect(inlineToPhysical('rtl', 'inline-end')).toBe('left');
  });

  it('physicalToInline is the inverse of inlineToPhysical for both directions', () => {
    for (const direction of ['ltr', 'rtl'] as const) {
      for (const logical of ['inline-start', 'inline-end'] as const) {
        const physical = inlineToPhysical(direction, logical);
        expect(physicalToInline(direction, physical)).toBe(logical);
      }
    }
  });
});

describe('keyboard direction helpers', () => {
  it('ltr: inline-start is ArrowLeft, inline-end is ArrowRight', () => {
    expect(inlineStartKey('ltr')).toBe('ArrowLeft');
    expect(inlineEndKey('ltr')).toBe('ArrowRight');
  });

  it('rtl: inline-start is ArrowRight, inline-end is ArrowLeft', () => {
    expect(inlineStartKey('rtl')).toBe('ArrowRight');
    expect(inlineEndKey('rtl')).toBe('ArrowLeft');
  });

  it('resolveInlineArrowKey classifies arrow keys per direction', () => {
    expect(resolveInlineArrowKey('ltr', 'ArrowLeft')).toBe('inline-start');
    expect(resolveInlineArrowKey('ltr', 'ArrowRight')).toBe('inline-end');
    expect(resolveInlineArrowKey('rtl', 'ArrowLeft')).toBe('inline-end');
    expect(resolveInlineArrowKey('rtl', 'ArrowRight')).toBe('inline-start');
  });

  it('resolveInlineArrowKey returns null for non-horizontal keys', () => {
    expect(resolveInlineArrowKey('ltr', 'ArrowUp')).toBeNull();
    expect(resolveInlineArrowKey('ltr', 'Enter')).toBeNull();
  });
});
