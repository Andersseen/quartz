import { TestBed } from '@angular/core/testing';
import { describe, it, expect, afterEach } from 'vitest';
import { DirectionalityService } from './directionality.service';

describe('DirectionalityService', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('dir');
  });

  it('defaults to ltr', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(DirectionalityService);
    expect(service.direction()).toBe('ltr');
  });

  it('resolves ltr from <html dir="ltr">', () => {
    document.documentElement.setAttribute('dir', 'ltr');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(DirectionalityService);
    expect(service.direction()).toBe('ltr');
  });

  it('resolves rtl from <html dir="rtl">', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(DirectionalityService);
    expect(service.direction()).toBe('rtl');
  });

  it('direction is a signal (exposes a callable read)', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(DirectionalityService);
    expect(typeof service.direction).toBe('function');
  });

  it('refresh() re-reads the document after dir changes', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(DirectionalityService);
    expect(service.direction()).toBe('ltr');

    document.documentElement.setAttribute('dir', 'rtl');
    expect(service.direction()).toBe('ltr'); // not auto-tracked without refresh()

    service.refresh();
    expect(service.direction()).toBe('rtl');
  });

  it('set() overrides the tracked direction without touching the DOM', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(DirectionalityService);
    service.set('rtl');
    expect(service.direction()).toBe('rtl');
    expect(document.documentElement.getAttribute('dir')).toBeNull();
  });

  it('resolve() reads a specific element without changing the tracked direction', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(DirectionalityService);

    const el = document.createElement('div');
    el.setAttribute('dir', 'rtl');
    document.body.appendChild(el);

    expect(service.resolve(el)).toBe('rtl');
    expect(service.direction()).toBe('ltr');

    el.remove();
  });

  it('resolve() with no argument falls back to the tracked direction', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(DirectionalityService);
    service.set('rtl');
    expect(service.resolve()).toBe('rtl');
  });
});
