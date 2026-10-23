import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isolateBackground } from './modal-isolation';

function el(tag: string, attrs: Record<string, string> = {}, parent: HTMLElement = document.body) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent.appendChild(node);
  return node;
}

const isIsolated = (node: Element) =>
  node.hasAttribute('inert') || node.getAttribute('aria-hidden') === 'true';

describe('isolateBackground', () => {
  let app: HTMLElement;
  let wrapper: HTMLElement;

  beforeEach(() => {
    app = el('main');
    wrapper = el('div', { 'data-qz-dialog-wrapper': '' });
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('isolates siblings but never the dialog or its ancestors', () => {
    const iso = isolateBackground(document, [wrapper]);
    expect(isIsolated(app)).toBe(true);
    expect(isIsolated(wrapper)).toBe(false);
    expect(isIsolated(document.body)).toBe(false);
    iso.release();
    expect(isIsolated(app)).toBe(false);
  });

  it('keeps portals opened after the dialog operable but isolates overlays that were already open', () => {
    const container = el('div', { 'data-qz-overlay-container': '' });
    const before = el('div', {}, container);
    const iso = isolateBackground(document, [wrapper]);
    const after = el('div', {}, container);

    expect(isIsolated(container)).toBe(false);
    expect(isIsolated(before)).toBe(true);
    expect(isIsolated(after)).toBe(false);

    iso.release();
    expect(isIsolated(before)).toBe(false);
  });

  it('isolates elements added to the body while open, except Quartz portals and dialog layers', () => {
    const iso = isolateBackground(document, [wrapper]);
    const stray = el('aside');
    const tooltip = el('div', { 'data-qz-tooltip': '' });
    const container = el('div', { 'data-qz-overlay-container': '' });
    const other = el('div', { 'data-qz-dialog-wrapper': '' });

    return Promise.resolve().then(() => {
      expect(isIsolated(stray)).toBe(true);
      expect(isIsolated(tooltip)).toBe(false);
      expect(isIsolated(container)).toBe(false);
      expect(isIsolated(other)).toBe(false);
      iso.release();
      expect(isIsolated(stray)).toBe(false);
    });
  });

  it('keeps a toast portal nested in the app tree operable', () => {
    const portal = el('div', { class: 'qz-toast-portal' }, app);
    const sibling = el('p', {}, app);
    const iso = isolateBackground(document, [wrapper]);

    expect(isIsolated(app)).toBe(false);
    expect(isIsolated(portal)).toBe(false);
    expect(isIsolated(sibling)).toBe(true);
    iso.release();
    expect(isIsolated(sibling)).toBe(false);
  });

  it('nested modals: the lower dialog is isolated while the child is open', () => {
    const a = isolateBackground(document, [wrapper]);
    const wrapperB = el('div', { 'data-qz-dialog-wrapper': '' });
    const b = isolateBackground(document, [wrapperB]);

    expect(isIsolated(wrapper)).toBe(true);
    expect(isIsolated(wrapperB)).toBe(false);
    expect(isIsolated(app)).toBe(true);

    b.release();
    expect(isIsolated(wrapper)).toBe(false);
    expect(isIsolated(app)).toBe(true);
    a.release();
    expect(isIsolated(app)).toBe(false);
  });

  it('closing the lower modal out of order keeps the background isolated for the upper one', () => {
    const a = isolateBackground(document, [wrapper]);
    const wrapperB = el('div', { 'data-qz-dialog-wrapper': '' });
    const b = isolateBackground(document, [wrapperB]);

    a.release();
    expect(isIsolated(app)).toBe(true);
    b.release();
    expect(isIsolated(app)).toBe(false);
    expect(app.hasAttribute('inert')).toBe(false);
  });

  it('preserves pre-existing inert and aria-hidden state', () => {
    const inertEl = el('section', { inert: '' });
    const hiddenEl = el('section', { 'aria-hidden': 'false' });
    const iso = isolateBackground(document, [wrapper]);
    iso.release();
    expect(inertEl.hasAttribute('inert')).toBe(true);
    expect(hiddenEl.getAttribute('aria-hidden')).toBe('false');
  });

  it('release is idempotent and does not touch a second isolation', () => {
    const a = isolateBackground(document, [wrapper]);
    const wrapperB = el('div', { 'data-qz-dialog-wrapper': '' });
    const b = isolateBackground(document, [wrapperB]);
    a.release();
    a.release();
    expect(isIsolated(app)).toBe(true);
    b.release();
  });

  it('is scoped to the Document it was created for', () => {
    const other = document.implementation.createHTMLDocument('other');
    const otherApp = other.body.appendChild(other.createElement('main'));
    const iso = isolateBackground(document, [wrapper]);
    expect(isIsolated(otherApp)).toBe(false);
    iso.release();
  });

  it('does not isolate a node that was re-parented out of an observed ancestor before the callback', async () => {
    const host = el('div', {}, app);
    el('div', { class: 'qz-toast-portal' }, host);
    const iso = isolateBackground(document, [wrapper]);

    // Angular inserts template roots next to the host, then Dialog moves them into its wrapper.
    const content = el('section', {}, host);
    wrapper.appendChild(content);

    await Promise.resolve();
    expect(isIsolated(content)).toBe(false);
    iso.release();
  });
});
